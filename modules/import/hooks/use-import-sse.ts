'use client';

import { useState, useEffect, useRef } from 'react';
import type { ImportJobProgress } from '../types';
import { pollImportJobStatus } from '../lib/actions';

const LOG_PREFIX = '[ImportSSE]';

interface UseImportSSEOptions {
  /** Job ID to subscribe to */
  jobId: string | null;
  /** Enable/disable polling */
  enabled?: boolean;
  /** Callback when progress updates */
  onProgress?: (progress: ImportJobProgress) => void;
  /** Callback when job completes */
  onComplete?: (progress: ImportJobProgress) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
}

interface UseImportSSEReturn {
  /** Current progress data */
  progress: ImportJobProgress | null;
  /** Whether polling is active */
  isConnected: boolean;
  /** Connection error message */
  error: string | null;
  /** Manually reconnect/restart polling */
  reconnect: () => void;
  /** Stop polling */
  disconnect: () => void;
}

// Polling interval in milliseconds
const POLL_INTERVAL = 2000;

/**
 * Polling-based hook for import progress updates
 * Uses server action polling for better compatibility with Next.js
 */
export function useImportSSE(options: UseImportSSEOptions): UseImportSSEReturn {
  const { jobId, enabled = true, onProgress, onComplete, onError } = options;
  console.log(LOG_PREFIX, 'useImportSSE init', { jobId, enabled });

  const [progress, setProgress] = useState<ImportJobProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store all mutable state in refs to avoid dependency issues
  const stateRef = useRef({
    jobId: jobId,
    enabled: enabled,
    onProgress: onProgress,
    onComplete: onComplete,
    onError: onError,
    intervalId: null as NodeJS.Timeout | null,
    isFetching: false,
    isStopped: false,
    isMounted: true,
  });

  // Update refs when props change (no effect re-runs needed)
  stateRef.current.jobId = jobId;
  stateRef.current.enabled = enabled;
  stateRef.current.onProgress = onProgress;
  stateRef.current.onComplete = onComplete;
  stateRef.current.onError = onError;

  // Single effect that manages the entire polling lifecycle
  useEffect(() => {
    const state = stateRef.current;
    state.isMounted = true;
    state.isStopped = false;

    // Cleanup function
    const stopPolling = () => {
      if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
      }
      state.isFetching = false;
    };

    // Fetch function
    const doFetch = async () => {
      // Skip if already fetching, stopped, unmounted, or missing job ID
      if (state.isFetching || state.isStopped || !state.isMounted) return;
      if (!state.jobId || !state.enabled) return;

      state.isFetching = true;
      console.log(LOG_PREFIX, 'Polling job status...', state.jobId);

      try {
        const result = await pollImportJobStatus(state.jobId);

        // Check if we should still process the result
        if (!state.isMounted || state.isStopped) return;

        if (!result.success) {
          console.error(LOG_PREFIX, 'Poll error:', result.error);
          setError(result.error || 'Erreur de connexion');
          return;
        }

        const data = result.data!;
        console.log(LOG_PREFIX, 'Poll result:', { status: data.status, importedRows: data.importedRows, totalRows: data.totalRows });

        // Transform to ImportJobProgress format
        const progressData: ImportJobProgress = {
          id: state.jobId,
          status: data.status as ImportJobProgress['status'],
          totalRows: data.totalRows,
          processedRows: data.processedRows,
          validRows: data.validRows,
          invalidRows: data.invalidRows,
          importedRows: data.importedRows,
          skippedRows: data.skippedRows,
          currentChunk: null,
          totalChunks: null,
          errorMessage: data.errorMessage,
          startedAt: null,
          completedAt: data.completedAt,
          updatedAt: new Date().toISOString(),
        };

        setProgress(progressData);
        setIsConnected(true);
        setError(null);
        state.onProgress?.(progressData);

        // Handle terminal states - stop polling
        if (data.status === 'completed') {
          console.log(LOG_PREFIX, 'Job completed, stopping polling');
          state.isStopped = true;
          stopPolling();
          state.onComplete?.(progressData);
        } else if (data.status === 'failed') {
          console.log(LOG_PREFIX, 'Job failed, stopping polling');
          state.isStopped = true;
          stopPolling();
          state.onError?.(data.errorMessage || 'Import échoué');
        } else if (data.status === 'cancelled') {
          console.log(LOG_PREFIX, 'Job cancelled, stopping polling');
          state.isStopped = true;
          stopPolling();
        }
      } catch (err) {
        if (!state.isMounted) return;
        console.error(LOG_PREFIX, 'Poll exception:', err);
        setError('Erreur de connexion');
      } finally {
        state.isFetching = false;
      }
    };

    // Don't start polling if conditions aren't met
    if (!jobId || !enabled) {
      state.isStopped = true; // Stop any in-flight polls from processing
      stopPolling();
      setIsConnected(false);
      setProgress(null); // Reset progress when disabled
      setError(null);
      return;
    }

    // Start polling
    setIsConnected(true);
    setError(null);

    // Initial fetch
    doFetch();

    // Start interval - use a fresh interval that calls doFetch
    state.intervalId = setInterval(doFetch, POLL_INTERVAL);

    // Cleanup on unmount or when jobId/enabled change
    return () => {
      state.isMounted = false;
      stopPolling();
    };
  }, [jobId, enabled]); // Only depend on jobId and enabled - everything else is in refs

  // Manual reconnect
  const reconnect = () => {
    console.log(LOG_PREFIX, 'Manual reconnect requested');
    const state = stateRef.current;
    if (!state.jobId || !state.enabled) {
      console.log(LOG_PREFIX, 'Reconnect skipped - no jobId or disabled');
      return;
    }

    // Stop existing polling
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }

    state.isStopped = false;
    state.isFetching = false;
    setIsConnected(true);
    setError(null);
    console.log(LOG_PREFIX, 'Reconnecting to job:', state.jobId);

    // Restart polling
    const doFetch = async () => {
      if (state.isFetching || state.isStopped || !state.isMounted) return;
      if (!state.jobId || !state.enabled) return;

      state.isFetching = true;
      try {
        const result = await pollImportJobStatus(state.jobId);
        if (!state.isMounted || state.isStopped) return;

        if (!result.success) {
          setError(result.error || 'Erreur de connexion');
          return;
        }

        const data = result.data!;
        const progressData: ImportJobProgress = {
          id: state.jobId,
          status: data.status as ImportJobProgress['status'],
          totalRows: data.totalRows,
          processedRows: data.processedRows,
          validRows: data.validRows,
          invalidRows: data.invalidRows,
          importedRows: data.importedRows,
          skippedRows: data.skippedRows,
          currentChunk: null,
          totalChunks: null,
          errorMessage: data.errorMessage,
          startedAt: null,
          completedAt: data.completedAt,
          updatedAt: new Date().toISOString(),
        };

        setProgress(progressData);
        setIsConnected(true);
        setError(null);
        state.onProgress?.(progressData);

        if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
          state.isStopped = true;
          if (state.intervalId) {
            clearInterval(state.intervalId);
            state.intervalId = null;
          }
          if (data.status === 'completed') state.onComplete?.(progressData);
          if (data.status === 'failed') state.onError?.(data.errorMessage || 'Import échoué');
        }
      } catch {
        if (!state.isMounted) return;
        setError('Erreur de connexion');
      } finally {
        state.isFetching = false;
      }
    };

    doFetch();
    state.intervalId = setInterval(doFetch, POLL_INTERVAL);
  };

  // Manual disconnect
  const disconnect = () => {
    const state = stateRef.current;
    state.isStopped = true;
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
    setIsConnected(false);
  };

  return {
    progress,
    isConnected,
    error,
    reconnect,
    disconnect,
  };
}

/**
 * Convenience hook that provides polling-based progress tracking
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
  const { percentage, isIndeterminate } = (() => {
    if (!progress) return { percentage: 0, isIndeterminate: true };

    const status = progress.status;

    // Terminal states
    if (status === 'completed') return { percentage: 100, isIndeterminate: false };
    if (status === 'failed' || status === 'cancelled') return { percentage: 0, isIndeterminate: false };

    // Parsing phase: 0-50%
    if (status === 'parsing') {
      const totalRows = progress.totalRows || 0;
      const processedRows = progress.processedRows || 0;

      if (totalRows > 0) {
        const parsingProgress = Math.min(processedRows / totalRows, 1);
        return {
          percentage: Math.round(parsingProgress * 50),
          isIndeterminate: false,
        };
      }

      if (processedRows > 0) {
        return { percentage: Math.min(25, processedRows / 100), isIndeterminate: true };
      }

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

      return { percentage: 50, isIndeterminate: true };
    }

    return { percentage: 0, isIndeterminate: true };
  })();

  const phaseLabel = (() => {
    if (!progress) return 'En attente...';
    switch (progress.status) {
      case 'pending':
      case 'queued':
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
