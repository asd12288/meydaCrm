'use client';

import { useState, useEffect, useCallback } from 'react';
import { getImportJobs } from '../lib/actions';
import type { ImportJobWithStats } from '../types';

interface UseActiveImportsOptions {
  /** Poll interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Auto-stop polling when no active imports (default: true) */
  autoStop?: boolean;
}

export function useActiveImports(options: UseActiveImportsOptions = {}) {
  const { pollInterval = 2000, autoStop = true } = options;

  const [activeImports, setActiveImports] = useState<ImportJobWithStats[]>([]);
  const [recentImports, setRecentImports] = useState<ImportJobWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchImports = useCallback(async () => {
    try {
      const result = await getImportJobs();

      if (result.success && result.data) {
        const jobs = result.data;

        // Active: queued, parsing, importing
        const active = jobs.filter((job) =>
          ['queued', 'parsing', 'importing'].includes(job.status)
        );

        // Recent: completed, failed, cancelled (last 5)
        const recent = jobs
          .filter((job) => ['completed', 'failed', 'cancelled'].includes(job.status))
          .slice(0, 5);

        setActiveImports(active);
        setRecentImports(recent);
        setError(null);

        // Auto-stop polling if no active imports
        if (autoStop && active.length === 0) {
          setIsPolling(false);
        }
      } else {
        setError(result.error || 'Erreur lors du chargement');
      }
    } catch (err) {
      console.error('[useActiveImports] Error:', err);
      setError('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  }, [autoStop]);

  // Initial fetch
  useEffect(() => {
    fetchImports();
  }, [fetchImports]);

  // Polling
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(fetchImports, pollInterval);

    return () => clearInterval(interval);
  }, [isPolling, pollInterval, fetchImports]);

  // Auto-start polling if active imports detected
  useEffect(() => {
    if (activeImports.length > 0 && !isPolling) {
      setIsPolling(true);
    }
  }, [activeImports.length, isPolling]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const refresh = useCallback(() => {
    setIsLoading(true);
    fetchImports();
  }, [fetchImports]);

  return {
    activeImports,
    recentImports,
    isLoading,
    error,
    isPolling,
    startPolling,
    stopPolling,
    refresh,
  };
}
