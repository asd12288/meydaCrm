'use client';

import { useState, useEffect } from 'react';
import { IconDownload, IconX, IconAlertCircle } from '@tabler/icons-react';
import { Modal } from '@/modules/shared';
import { getImportRows, getErrorReportUrl } from '../lib/actions';
import type { ImportRowWithDetails } from '../types';

interface ErrorReportModalProps {
  importJobId: string;
  isOpen: boolean;
  onClose: () => void;
  invalidRowsCount: number;
}

export function ErrorReportModal({
  importJobId,
  isOpen,
  onClose,
  invalidRowsCount,
}: ErrorReportModalProps) {
  const [errors, setErrors] = useState<ImportRowWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (isOpen) {
      loadErrors(1);
    }
  }, [isOpen]);

  const loadErrors = async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await getImportRows(importJobId, {
        status: 'invalid',
        page: targetPage,
        pageSize: 20,
      });

      if (result.success && result.data) {
        setErrors(result.data.rows);
        setPage(result.data.page);
        setTotalPages(result.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to load errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const result = await getErrorReportUrl(importJobId);

      if (result.success && result.data?.url) {
        // Download the file
        const link = document.createElement('a');
        link.href = result.data.url;
        link.download = `erreurs-import-${importJobId}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(result.error || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lignes invalides">
      <div className="space-y-4">
        {/* Warning message */}
        <div className="flex items-start gap-3 p-4 bg-lighterror/30 border border-error/30 rounded-lg">
          <IconAlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-error">
              {invalidRowsCount} ligne{invalidRowsCount > 1 ? 's' : ''} invalide
              {invalidRowsCount > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-error/80 mt-1">
              Ces lignes contiennent des erreurs et ne seront pas importées. Corrigez
              les erreurs et ré-importez le fichier.
            </p>
          </div>
        </div>

        {/* Preview table */}
        <div className="border border-ld rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Ligne</th>
                  <th className="px-4 py-3 text-left font-semibold">Erreurs</th>
                  <th className="px-4 py-3 text-left font-semibold">Données</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-darklink">
                      Chargement...
                    </td>
                  </tr>
                ) : errors.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-darklink">
                      Aucune erreur trouvée
                    </td>
                  </tr>
                ) : (
                  errors.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{row.row_number}</td>
                      <td className="px-4 py-3">
                        {row.validation_errors ? (
                          <div className="space-y-1">
                            {Object.entries(row.validation_errors).map(
                              ([field, error]) => (
                                <div key={field} className="text-error text-xs">
                                  <span className="font-medium">{field}:</span> {error}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-darklink">Aucune erreur</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-darklink font-mono max-w-xs truncate">
                          {JSON.stringify(row.raw_data)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm">
            <p className="text-darklink">
              Page {page} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadErrors(page - 1)}
                disabled={page === 1 || loading}
                className="px-3 py-1 rounded border border-ld hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => loadErrors(page + 1)}
                disabled={page === totalPages || loading}
                className="px-3 py-1 rounded border border-ld hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-ld">
          <button
            onClick={onClose}
            className="px-4 py-2 text-darklink hover:text-ld hover:bg-muted rounded-md transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primaryemphasis transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconDownload className="w-4 h-4" />
            {downloading ? 'Téléchargement...' : 'Télécharger le rapport complet'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
