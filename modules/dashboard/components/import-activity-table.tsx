'use client';

import React from 'react';
import { CardBox, Badge } from '@/modules/shared';
import { IconFileUpload, IconCheck, IconX, IconLoader, IconClock } from '@tabler/icons-react';
import Link from 'next/link';
import type { ImportActivityItem } from '../types';

interface ImportActivityTableProps {
  imports: ImportActivityItem[];
}

// Get status config - simplified to 3 states: success, warning (in-progress), default
const getStatusConfig = (status: string) => {
  const configs: Record<string, { variant: 'success' | 'error' | 'secondary'; icon: React.ReactNode; label: string }> = {
    completed: { variant: 'success', icon: <IconCheck size={14} />, label: 'Terminé' },
    failed: { variant: 'error', icon: <IconX size={14} />, label: 'Échec' },
    cancelled: { variant: 'secondary', icon: <IconX size={14} />, label: 'Annulé' },
    processing: { variant: 'secondary', icon: <IconLoader size={14} className="animate-spin" />, label: 'En cours' },
    parsing: { variant: 'secondary', icon: <IconLoader size={14} className="animate-spin" />, label: 'Analyse' },
    committing: { variant: 'secondary', icon: <IconLoader size={14} className="animate-spin" />, label: 'Import' },
    pending: { variant: 'secondary', icon: <IconClock size={14} />, label: 'En attente' },
  };
  return configs[status] || { variant: 'secondary' as const, icon: <IconClock size={14} />, label: status };
};

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ImportActivityTable({ imports }: ImportActivityTableProps) {
  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title">Imports récents</h5>
        <Link href="/import/history" className="text-sm text-primary hover:underline">
          Voir tout
        </Link>
      </div>

      {imports.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-darklink">
          <p>Aucun import récent</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-darkborder">
                <th className="text-left py-3 text-xs font-semibold text-darklink uppercase">Fichier</th>
                <th className="text-left py-3 text-xs font-semibold text-darklink uppercase">Date</th>
                <th className="text-left py-3 text-xs font-semibold text-darklink uppercase">Statut</th>
                <th className="text-right py-3 text-xs font-semibold text-darklink uppercase">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {imports.slice(0, 5).map((item) => {
                const statusConfig = getStatusConfig(item.status);
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border dark:border-darkborder last:border-0 hover:bg-lightgray dark:hover:bg-darkgray transition-colors"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <IconFileUpload size={18} className="text-darklink" />
                        <span className="text-sm font-medium text-ld truncate max-w-[200px]">
                          {item.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="text-sm text-darklink">{formatDate(item.date)}</span>
                    </td>
                    <td className="py-3">
                      <Badge variant={statusConfig.variant} size="sm" icon={statusConfig.icon}>
                        {statusConfig.label}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <span className="text-sm">
                        <span className="text-ld font-medium">{item.importedRows}</span>
                        <span className="text-darklink">/{item.totalRows}</span>
                        {item.invalidRows > 0 && (
                          <span className="text-darklink ml-1">({item.invalidRows} err)</span>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardBox>
  );
}
