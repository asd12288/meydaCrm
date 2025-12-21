'use client';

/**
 * Hook for polling export job status
 */

import { useState, useEffect, useCallback } from 'react';
import { getExportJob } from '../lib/actions';
import { EXPORT_POLL_INTERVAL_MS } from '../config/constants';
import type { ExportJob } from '../types';

export interface UseExportStatusResult {
  job: ExportJob | null;
  isPolling: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useExportStatus(jobId: string | null): UseExportStatusResult {
  const [job, setJob] = useState<ExportJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    const { job: updated, error: fetchError } = await getExportJob(jobId);

    if (fetchError) {
      setError(fetchError);
      return;
    }

    setJob(updated);
    setError(null);

    // Stop polling if job is done
    if (updated?.status === 'completed' || updated?.status === 'failed' || updated?.status === 'expired') {
      setIsPolling(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional state clear when jobId changes
      setJob(null);
      setIsPolling(false);
      return;
    }

    // Start polling
    setIsPolling(true);
    fetchJob();

    const interval = setInterval(fetchJob, EXPORT_POLL_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [jobId, fetchJob]);

  return {
    job,
    isPolling,
    error,
    refetch: fetchJob,
  };
}
