/**
 * Results Actions Hook
 *
 * Handles post-import actions: view leads, start new import, download report.
 * Extracted from import-wizard-v2.tsx for better maintainability.
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useImportWizard } from '../context';

export function useResultsActions() {
  const router = useRouter();
  const { state, reset, dispatch } = useImportWizard();

  const handleViewLeads = useCallback(() => {
    router.push('/leads');
  }, [router]);

  const handleNewImport = useCallback(() => {
    reset();
  }, [reset]);

  const handleDownloadReport = useCallback(() => {
    if (!state.results) return;

    // Generate CSV report
    const lines: string[] = [];
    lines.push('Ligne,Email,Telephone,Nom,Statut,Raison');

    const allRows = [
      ...state.results.importedRows.map((r) => ({ ...r, statusLabel: 'Importe' })),
      ...state.results.updatedRows.map((r) => ({ ...r, statusLabel: 'Mis a jour' })),
      ...state.results.skippedRows.map((r) => ({ ...r, statusLabel: 'Ignore' })),
      ...state.results.errorRows.map((r) => ({ ...r, statusLabel: 'Erreur' })),
    ].sort((a, b) => a.rowNumber - b.rowNumber);

    for (const row of allRows) {
      const name = [row.displayData.firstName, row.displayData.lastName]
        .filter(Boolean)
        .join(' ');
      const line = [
        row.rowNumber,
        row.displayData.email || '',
        row.displayData.phone || '',
        name,
        row.statusLabel,
        row.reason || '',
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',');
      lines.push(line);
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.results]);

  const handleCancelImport = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: 'Import annule' });
    dispatch({ type: 'SET_IMPORTING', payload: false });
  }, [dispatch]);

  return {
    handleViewLeads,
    handleNewImport,
    handleDownloadReport,
    handleCancelImport,
  };
}
