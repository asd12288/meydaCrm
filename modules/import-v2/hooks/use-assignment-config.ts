/**
 * Assignment Configuration Hook
 *
 * Manages the assignment toggle and user selection for import.
 * Extracted from import-wizard-v2.tsx for better maintainability.
 */

'use client';

import { useCallback } from 'react';
import { useImportWizard } from '../context';

export function useAssignmentConfig() {
  const { dispatch } = useImportWizard();

  const handleAssignmentToggle = useCallback(
    (enabled: boolean) => {
      dispatch({
        type: 'SET_ASSIGNMENT',
        payload: { mode: enabled ? 'round_robin' : 'none' },
      });
    },
    [dispatch]
  );

  const handleAssignmentUsersChange = useCallback(
    (userIds: string[]) => {
      dispatch({
        type: 'SET_ASSIGNMENT',
        payload: { selectedUserIds: userIds },
      });
    },
    [dispatch]
  );

  return {
    handleAssignmentToggle,
    handleAssignmentUsersChange,
  };
}
