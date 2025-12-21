'use client';

/**
 * Export Modal Component
 *
 * Modal for configuring and triggering background CSV exports.
 * Shows active filters, estimated row count, and limit options.
 */

import { useState, useEffect, useTransition } from 'react';
import { IconDownload, IconAlertTriangle, IconCheck, IconLoader2 } from '@tabler/icons-react';
import { Modal, useToast } from '@/modules/shared';
import { Button } from '@/components/ui/button';
import { createExportJob, getExportCount } from '../lib/actions';
import { EXPORT_LIMITS, EXPORT_WARNING_THRESHOLD } from '../config/constants';
import type { ExportFilters } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ExportFilters;
}

export function ExportModal({ isOpen, onClose, filters }: ExportModalProps) {
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Load count when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoadingCount(true);
      setEstimatedCount(null);

      getExportCount(filters).then(({ count, error }) => {
        if (error) {
          toast.error(error);
        } else {
          setEstimatedCount(count);
        }
        setIsLoadingCount(false);
      });
    }
  }, [isOpen, filters, toast]);

  // Reset limit when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLimit(null);
    }
  }, [isOpen]);

  const handleExport = () => {
    startTransition(async () => {
      const result = await createExportJob(filters, selectedLimit);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Export lancé ! Vous recevrez une notification lorsqu\'il sera prêt.');
      onClose();
    });
  };

  const effectiveCount = selectedLimit
    ? Math.min(selectedLimit, estimatedCount ?? 0)
    : estimatedCount;

  const showWarning = effectiveCount !== null && effectiveCount > EXPORT_WARNING_THRESHOLD;

  // Build filter description
  const filterChips: { label: string; value: string }[] = [];
  if (filters.search) {
    filterChips.push({ label: 'Recherche', value: filters.search });
  }
  if (filters.status) {
    filterChips.push({ label: 'Statut', value: filters.status });
  }
  if (filters.assignedTo) {
    filterChips.push({
      label: 'Commercial',
      value: filters.assignedTo === 'unassigned' ? 'Non assignés' : filters.assignedTo
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exporter les leads"
      icon={<IconDownload size={20} />}
      size="md"
    >
      <div className="space-y-5 py-2">
        {/* Active filters */}
        <div>
          <h3 className="text-sm font-medium text-darklink mb-2">Filtres actifs</h3>
          {filterChips.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {filterChips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm bg-lightprimary text-primary rounded-full"
                >
                  <span className="text-xs font-medium opacity-70">{chip.label}:</span>
                  <span className="font-medium truncate max-w-32">{chip.value}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-darklink italic">Aucun filtre - tous les leads seront exportés</p>
          )}
        </div>

        {/* Estimated count */}
        <div>
          <h3 className="text-sm font-medium text-darklink mb-2">Leads à exporter</h3>
          {isLoadingCount ? (
            <div className="flex items-center gap-2 text-darklink">
              <IconLoader2 size={16} className="animate-spin" />
              <span className="text-sm">Calcul en cours...</span>
            </div>
          ) : (
            <p className="text-2xl font-bold text-ld">
              {effectiveCount !== null ? (
                <>
                  ~{effectiveCount.toLocaleString('fr-FR')}
                  {selectedLimit && estimatedCount && selectedLimit < estimatedCount && (
                    <span className="text-sm font-normal text-darklink ml-2">
                      (sur {estimatedCount.toLocaleString('fr-FR')})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-darklink">—</span>
              )}
            </p>
          )}
        </div>

        {/* Limit selector */}
        <div>
          <h3 className="text-sm font-medium text-darklink mb-2">Limite d&apos;export</h3>
          <div className="space-y-2">
            {EXPORT_LIMITS.map((option) => (
              <label
                key={option.value ?? 'all'}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedLimit === option.value
                    ? 'border-primary bg-lightprimary'
                    : 'border-ld hover:border-primary hover:bg-lightprimary/50'
                }`}
              >
                <input
                  type="radio"
                  name="exportLimit"
                  value={option.value ?? 'all'}
                  checked={selectedLimit === option.value}
                  onChange={() => setSelectedLimit(option.value)}
                  className="w-4 h-4 text-primary accent-primary"
                />
                <span className="text-sm font-medium text-ld">{option.label}</span>
                {selectedLimit === option.value && (
                  <IconCheck size={16} className="text-primary ml-auto" />
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Warning for large exports */}
        {showWarning && (
          <div className="flex items-start gap-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <IconAlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">Export volumineux</p>
              <p className="text-darklink mt-1">
                L&apos;export sera traité en arrière-plan. Vous recevrez une notification
                lorsqu&apos;il sera prêt au téléchargement.
              </p>
            </div>
          </div>
        )}

        {/* Info message */}
        {!showWarning && (
          <div className="text-sm text-darklink bg-surface p-3 rounded-lg">
            <p>
              L&apos;export sera traité en arrière-plan. Vous recevrez une notification
              lorsqu&apos;il sera prêt.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-ld">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleExport}
            disabled={isPending || isLoadingCount || estimatedCount === 0}
          >
            {isPending ? (
              <>
                <IconLoader2 size={16} className="animate-spin" />
                Export en cours...
              </>
            ) : (
              <>
                <IconDownload size={16} />
                Exporter
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
