'use client';

import { useState, useTransition, useCallback } from 'react';

export interface UseFormStateReturn {
  /** Is the form submitting */
  isPending: boolean;
  /** Start a transition for async operations */
  startTransition: React.TransitionStartFunction;
  /** Current error message */
  error: string | null;
  /** Set error message */
  setError: (error: string | null) => void;
  /** Is the form in success state */
  success: boolean;
  /** Set success state */
  setSuccess: (success: boolean) => void;
  /** Reset error state (useful before form submission) */
  resetError: () => void;
  /** Reset success state */
  resetSuccess: () => void;
  /** Reset all states */
  resetAll: () => void;
}

/**
 * Custom hook for managing common form state patterns
 * Reduces boilerplate: isPending, error, success state management
 */
export function useFormState(): UseFormStateReturn {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetError = useCallback(() => setError(null), []);
  const resetSuccess = useCallback(() => setSuccess(false), []);
  const resetAll = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isPending,
    startTransition,
    error,
    setError,
    success,
    setSuccess,
    resetError,
    resetSuccess,
    resetAll,
  };
}
