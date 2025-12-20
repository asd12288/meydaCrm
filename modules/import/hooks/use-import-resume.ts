'use client';

import { useState, useEffect, useCallback } from 'react';
import { pollImportJobStatus } from '../lib/actions';

const STORAGE_KEY = 'activeImportId';

export function useImportResume() {
  const [canResume, setCanResume] = useState(false);
  const [resumableJob, setResumableJob] = useState<{
    id: string;
    fileName: string;
    status: string;
    progress: number;
    lastActivity: Date;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // Check for resumable import on mount
  useEffect(() => {
    checkForResumableImport();
  }, []);

  const checkForResumableImport = async () => {
    setIsChecking(true);
    try {
      const savedJobId = sessionStorage.getItem(STORAGE_KEY);

      if (!savedJobId) {
        setIsChecking(false);
        return;
      }

      // Check if job is still active
      const result = await pollImportJobStatus(savedJobId);

      if (result.success && result.data) {
        const { status, totalRows, processedRows } = result.data;

        // Only resume if job is actually in progress
        if (['queued', 'parsing', 'importing'].includes(status)) {
          const progress = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

          setCanResume(true);
          setResumableJob({
            id: savedJobId,
            fileName: 'Import interrompu', // We don't have fileName in poll response
            status,
            progress,
            lastActivity: new Date(),
          });
        } else {
          // Job is complete or failed, clear storage
          clearResume();
        }
      } else {
        // Job not found or error, clear storage
        clearResume();
      }
    } catch (error) {
      console.error('[Resume] Error checking resumable import:', error);
      clearResume();
    } finally {
      setIsChecking(false);
    }
  };

  const saveActiveImport = useCallback((jobId: string) => {
    sessionStorage.setItem(STORAGE_KEY, jobId);
  }, []);

  const clearResume = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setCanResume(false);
    setResumableJob(null);
  }, []);

  const resumeImport = useCallback(() => {
    // Don't clear sessionStorage - let the wizard handle it
    setCanResume(false);
    return resumableJob?.id || null;
  }, [resumableJob]);

  const cancelResume = useCallback(() => {
    clearResume();
  }, [clearResume]);

  return {
    canResume,
    resumableJob,
    isChecking,
    saveActiveImport,
    clearResume,
    resumeImport,
    cancelResume,
  };
}
