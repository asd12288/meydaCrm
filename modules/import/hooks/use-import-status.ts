'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { pollImportJobStatus } from '../lib/actions';

interface JobStatus {
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  skippedRows: number;
  processedRows: number;
  errorMessage: string | null;
  completedAt: string | null;
}

interface UseImportStatusOptions {
  /** Job ID to poll */
  jobId: string | null;
  /** Enable/disable polling */
  enabled?: boolean;
  /** Callback when status changes */
  onStatusChange?: (status: JobStatus) => void;
  /** Callback when job completes */
  onComplete?: (status: JobStatus) => void;
  /** Callback when job fails */
  onError?: (error: string) => void;
}

/**
 * Smart polling hook for import job status
 * Adjusts poll frequency based on job status
 */
export function useImportStatus(options: UseImportStatusOptions) {
  const { jobId, enabled = true, onStatusChange, onComplete, onError } = options;

  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  // Get smart polling interval based on status
  const getPollingInterval = useCallback((currentStatus: string) => {
    switch (currentStatus) {
      case 'queued':
        return 5000; // 5 seconds - not much happening
      case 'parsing':
      case 'importing':
        return 1000; // 1 second - active processing
      case 'ready':
        return 3000; // 3 seconds - waiting for user
      default:
        return 10000; // 10 seconds - completed/failed
    }
  }, []);

  // Poll for status
  const poll = useCallback(async () => {
    if (!jobId || !enabled) return;

    try {
      const result = await pollImportJobStatus(jobId);

      if (result.success && result.data) {
        const newStatus = result.data;
        setStatus(newStatus);
        setError(null);

        // Call status change callback
        onStatusChange?.(newStatus);

        // Check for status change
        if (lastStatusRef.current !== newStatus.status) {
          console.log(`[StatusPoll] Status changed: ${lastStatusRef.current} → ${newStatus.status}`);
          lastStatusRef.current = newStatus.status;

          // Stop polling and call callbacks on completion
          if (newStatus.status === 'completed') {
            setIsPolling(false);
            onComplete?.(newStatus);
          } else if (newStatus.status === 'failed') {
            setIsPolling(false);
            onError?.(newStatus.errorMessage || 'Import échoué');
          } else if (newStatus.status === 'cancelled') {
            setIsPolling(false);
          }
        }
      } else {
        setError(result.error || 'Erreur lors de la récupération du statut');
        setIsPolling(false);
      }
    } catch (err) {
      console.error('[StatusPoll] Error:', err);
      setError('Erreur de connexion');
      setIsPolling(false);
    }
  }, [jobId, enabled, onStatusChange, onComplete, onError]);

  // Start/stop polling
  useEffect(() => {
    if (!jobId || !enabled || !isPolling) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial poll - legitimately needed for immediate status check
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();

    // Set up interval with smart timing
    const updateInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const interval = status ? getPollingInterval(status.status) : 2000;
      intervalRef.current = setInterval(poll, interval);
    };

    updateInterval();

    // Update interval when status changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [jobId, enabled, isPolling, poll, status, getPollingInterval]);

  // Auto-start polling when job ID is set
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (jobId && enabled && !isPolling) {
      setIsPolling(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId, enabled]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refresh = useCallback(() => {
    poll();
  }, [poll]);

  return {
    status,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refresh,
  };
}
