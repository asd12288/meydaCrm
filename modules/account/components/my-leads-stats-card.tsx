'use client';

import { CardBox, SectionHeader } from '@/modules/shared';
import { LEAD_STATUS_LABELS } from '@/db/types';
import { IconUsers, IconClock } from '@tabler/icons-react';
import type { AccountStats } from '../types';

interface MyLeadsStatsCardProps {
  stats: AccountStats;
  isAdmin: boolean;
}

export function MyLeadsStatsCard({ stats, isAdmin }: MyLeadsStatsCardProps) {
  const { leads, commentsCount, lastActivity } = stats;

  // Format last activity date
  const lastActivityFormatted = lastActivity
    ? new Date(lastActivity).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Aucune activité';

  // Get top statuses sorted by count
  const sortedStatuses = Object.entries(leads.byStatus)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <CardBox>
      <SectionHeader
        title={isAdmin ? 'Statistiques globales' : 'Mes leads'}
        icon={<IconUsers size={20} />}
        iconColor="darklink"
      />

      {/* Main Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Total Leads */}
        <div className="p-4 rounded-lg border border-border dark:border-darkborder">
          <p className="text-3xl font-bold text-ld">{leads.total}</p>
          <p className="text-sm text-darklink">
            {isAdmin ? 'Leads au total' : 'Leads assignés'}
          </p>
        </div>

        {/* Comments */}
        <div className="p-4 rounded-lg border border-border dark:border-darkborder">
          <p className="text-3xl font-bold text-ld">{commentsCount}</p>
          <p className="text-sm text-darklink">Commentaires</p>
        </div>
      </div>

      {/* Status Breakdown */}
      {sortedStatuses.length > 0 && (
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-darklink">Répartition par statut</p>
          <div className="space-y-2">
            {sortedStatuses.map(([status, count]) => {
              const percentage =
                leads.total > 0 ? Math.round((count / leads.total) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="text-sm text-ld flex-1 truncate">
                    {LEAD_STATUS_LABELS[status as keyof typeof LEAD_STATUS_LABELS] ||
                      status}
                  </span>
                  <div className="w-24 h-2 bg-surface dark:bg-darkborder rounded-full overflow-hidden">
                    <div
                      className="h-full bg-darklink/50 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-ld w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Activity */}
      <div className="pt-4 border-t border-border dark:border-darkborder">
        <div className="flex items-center gap-2 text-sm text-darklink">
          <IconClock size={16} />
          <span>Dernière activité: {lastActivityFormatted}</span>
        </div>
      </div>
    </CardBox>
  );
}
