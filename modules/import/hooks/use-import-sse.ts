'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ImportJobProgress, SSEMessage } from '../types';

interface UseImportSSEOptions {
  /** Job ID to subscribe to */
  jobId: string | null;
  /** Enable/disable SSE connection */
  enabled?: boolean;
  /** Callback when progress updates */
  onProgress?: (progress: ImportJobProgress) => void;
  /** Callback when job completes */
  onComplete?: (progress: ImportJobProgress) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
  /** Callback when connection lost */
  onDisconnect?: () => void;
  /** Callback when connection restored */
  onReconnect?: () => void;
}

interface UseImportSSEReturn {
  /** Current progress data */
  progress: ImportJobProgress | null;
  /** Whether SSE is connected */
  isConnected: boolean;
  /** Connection error message */
  error: string | null;
  /** Manually reconnect */
  reconnect: () => void;
  /** Disconnect SSE */
  disconnect: () => void;
}

/**
 * SSE-based hook for real-time import progress updates
 * Replaces polling with Server-Sent Events for instant updates
 */
export function useImportSSE(options: UseImportSSEOptions): UseImportSSEReturn {
  const {
    jobId,
    enabled = true,
    onProgress,
    onComplete,
    onError,
    onDisconnect,
    onReconnect,
  } = options;

  const [progress, setProgress] = useState<ImportJobProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const prevJobIdRef = useRef<string | null>(null);
  const maxReconnectAttempts = 5;

  // Cleanup function
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Connect to SSE endpoint
  /* eslint-disable react-hooks/immutability */
  const connect = useCallback(() => {
    if (!jobId || !enabled) return;

    cleanup();

    const url = `/api/import/${jobId}/status`;
    console.log(`[SSE] Connecting to ${url}`);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('[SSE] Connected');
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0;

      if (reconnectAttemptsRef.current > 0) {
        onReconnect?.();
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const message: SSEMessage = JSON.parse(event.data);
        console.log(`[SSE] Received: ${message.type}`, message.data?.status);

        if (message.type === 'progress' || message.type === 'complete') {
          if (message.data) {
            setProgress(message.data);
            onProgress?.(message.data);

            // Handle completion
            if (message.data.status === 'completed') {
              onComplete?.(message.data);
            } else if (message.data.status === 'failed') {
              onError?.(message.data.errorMessage || 'Import échoué');
            } else if (message.data.status === 'cancelled') {
              // Job was cancelled, no error callback
            }

            // Auto-disconnect on terminal states
            if (['completed', 'failed', 'cancelled'].includes(message.data.status)) {
              setTimeout(() => {
                cleanup();
                setIsConnected(false);
              }, 500);
            }
          }
        } else if (message.type === 'error') {
          setError('Erreur du serveur');
          onError?.('Erreur du serveur');
        }
      } catch (err) {
        console.error('[SSE] Parse error:', err);
      }
    };

    eventSource.onerror = (event) => {
      console.error('[SSE] Connection error:', event);
      setIsConnected(false);
      cleanup();

      // Don't reconnect if we're at a terminal state
      if (progress && ['completed', 'failed', 'cancelled'].includes(progress.status)) {
        return;
      }

      // Attempt reconnection with exponential backoff
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1})`);

        onDisconnect?.();
        setError('Connexion perdue, reconnexion...');

        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, delay);
      } else {
        setError('Connexion perdue. Veuillez rafraîchir la page.');
        onError?.('Connexion perdue');
      }
    };
  }, [jobId, enabled, cleanup, onProgress, onComplete, onError, onDisconnect, onReconnect, progress]);
  /* eslint-enable react-hooks/immutability */

  // Connect when job ID changes or enabled changes
  useEffect(() => {
    if (jobId && enabled) {
      connect();
    } else {
      cleanup();
      setIsConnected(false);
      // Don't clear progress when disabled - preserve final state for results display
      // Progress is only cleared when a new job ID is set (handled in connect)
    }

    return cleanup;
  }, [jobId, enabled, connect, cleanup]);

  // Clear progress when job ID changes to a NEW value (not null)
  useEffect(() => {
    if (jobId && jobId !== prevJobIdRef.current) {
      // New job started - clear old progress
      setProgress(null);
      setError(null);
    }
    prevJobIdRef.current = jobId;
  }, [jobId]);

  // Manual reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
  }, [cleanup]);

  return {
    progress,
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}

/**
 * Convenience hook that provides both SSE (preferred) and polling fallback
 * Use this when you need maximum compatibility
 */
export function useImportProgress(jobId: string | null, enabled = true) {
  const {
    progress,
    isConnected,
    error,
    reconnect,
  } = useImportSSE({
    jobId,
    enabled,
  });

  // Phase-aware percentage calculation
  // - Parsing: 0-50% (based on chunks processed)
  // - Importing: 50-100% (based on rows imported)
  const { percentage, isIndeterminate } = (() => {
    if (!progress) return { percentage: 0, isIndeterminate: true };

    const status = progress.status;

    // Terminal states
    if (status === 'completed') return { percentage: 100, isIndeterminate: false };
    if (status === 'failed' || status === 'cancelled') return { percentage: 0, isIndeterminate: false };

    // Parsing phase: 0-50%
    if (status === 'parsing') {
      const totalChunks = progress.totalChunks || 0;
      const currentChunk = progress.currentChunk || 0;

      // If we have chunk estimate, calculate 0-50%
      if (totalChunks > 0) {
        const parsingProgress = Math.min(currentChunk / totalChunks, 1);
        return {
          percentage: Math.round(parsingProgress * 50),
          isIndeterminate: false,
        };
      }

      // No chunk estimate - use processed rows if available
      if (progress.processedRows && progress.processedRows > 0) {
        // Show indeterminate but with some activity indication
        return { percentage: Math.min(25, progress.processedRows / 100), isIndeterminate: true };
      }

      // Truly indeterminate
      return { percentage: 0, isIndeterminate: true };
    }

    // Importing phase: 50-100%
    if (status === 'importing') {
      const validRows = progress.validRows || 0;
      const importedRows = progress.importedRows || 0;

      if (validRows > 0) {
        const importingProgress = Math.min(importedRows / validRows, 1);
        return {
          percentage: 50 + Math.round(importingProgress * 50),
          isIndeterminate: false,
        };
      }

      // No valid rows count yet, show 50% (parsing done)
      return { percentage: 50, isIndeterminate: true };
    }

    // Pending or other states
    return { percentage: 0, isIndeterminate: true };
  })();

  // Determine phase label for display
  const phaseLabel = (() => {
    if (!progress) return 'En attente...';
    switch (progress.status) {
      case 'pending':
        return 'En attente...';
      case 'parsing':
        return 'Validation des données...';
      case 'importing':
        return 'Création des leads...';
      case 'completed':
        return 'Import terminé';
      case 'failed':
        return 'Échec de l\'import';
      case 'cancelled':
        return 'Import annulé';
      default:
        return 'Traitement...';
    }
  })();

  // Is terminal state
  const isComplete = progress?.status === 'completed';
  const isFailed = progress?.status === 'failed';
  const isCancelled = progress?.status === 'cancelled';
  const isTerminal = isComplete || isFailed || isCancelled;

  return {
    progress,
    percentage,
    isIndeterminate,
    phaseLabel,
    phase: progress?.status || 'pending',
    isConnected,
    error,
    isComplete,
    isFailed,
    isCancelled,
    isTerminal,
    reconnect,
  };
}
