/**
 * Preview Row Actions Hook
 *
 * Handles row actions (skip/import/update), modal state, and row editing.
 * Extracted from import-wizard-v2.tsx for better maintainability.
 */

'use client';

import { useCallback, useState, useMemo } from 'react';
import { useImportWizard } from '../context';
import { DEFAULT_ACTION_BY_TYPE } from '../config/constants';
import type { UnifiedRowAction, PreviewIssueType } from '../config/constants';
import type { IssueRow } from '../components/preview-issue-table';
import type { LeadFieldKey } from '../../import/types/mapping';

// =============================================================================
// MODAL STATE TYPE
// =============================================================================

interface ModalState {
  isOpen: boolean;
  row: IssueRow | null;
  issueType: PreviewIssueType | null;
}

// =============================================================================
// HOOK
// =============================================================================

export function usePreviewRowActions() {
  const { state, dispatch } = useImportWizard();

  // Unified modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    row: null,
    issueType: null,
  });

  // Handle single row action change
  const handleRowActionChange = useCallback(
    (rowNumber: number, action: UnifiedRowAction) => {
      dispatch({ type: 'SET_ROW_DECISION', payload: { rowNumber, action } });
    },
    [dispatch]
  );

  // Handle bulk action for all rows of a specific issue type
  const handleBulkAction = useCallback(
    (issueType: PreviewIssueType, action: UnifiedRowAction) => {
      dispatch({ type: 'SET_ALL_ROW_DECISIONS', payload: { issueType, action } });
    },
    [dispatch]
  );

  // Handle opening the unified modal
  const handleViewEdit = useCallback(
    (row: IssueRow, issueType: PreviewIssueType) => {
      setModalState({
        isOpen: true,
        row,
        issueType,
      });
    },
    []
  );

  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setModalState({
      isOpen: false,
      row: null,
      issueType: null,
    });
  }, []);

  // Handle saving edits from modal
  const handleSaveEdits = useCallback(
    (edits: Partial<Record<LeadFieldKey, string>>) => {
      if (!modalState.row) return;

      // Save each field update to the wizard state
      for (const [field, value] of Object.entries(edits)) {
        if (value !== undefined) {
          dispatch({
            type: 'SET_EDITED_ROW_FIELD',
            payload: {
              rowNumber: modalState.row.rowNumber,
              field: field as LeadFieldKey,
              value: value || '',
            },
          });
        }
      }
    },
    [modalState.row, dispatch]
  );

  // Handle action change from within the modal
  const handleModalActionChange = useCallback(
    (action: UnifiedRowAction) => {
      if (!modalState.row) return;
      dispatch({
        type: 'SET_ROW_DECISION',
        payload: { rowNumber: modalState.row.rowNumber, action },
      });
    },
    [modalState.row, dispatch]
  );

  // Computed: current row action from state
  const currentRowAction = useMemo(() => {
    if (!modalState.row || !modalState.issueType) return 'skip' as UnifiedRowAction;
    return (
      state.rowDecisions.get(modalState.row.rowNumber) ||
      DEFAULT_ACTION_BY_TYPE[modalState.issueType]
    );
  }, [modalState.row, modalState.issueType, state.rowDecisions]);

  // Computed: current row edits from state
  const currentRowEdits = useMemo(() => {
    if (!modalState.row) return {};
    return state.editedRows.get(modalState.row.rowNumber) || {};
  }, [modalState.row, state.editedRows]);

  return {
    // Modal state
    modalState,
    currentRowAction,
    currentRowEdits,
    // Row action handlers
    handleRowActionChange,
    handleBulkAction,
    // Modal handlers
    handleViewEdit,
    handleCloseModal,
    handleSaveEdits,
    handleModalActionChange,
  };
}
