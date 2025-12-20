'use client';

import React from 'react';
import { CardBox } from '@/modules/shared';
import Link from 'next/link';
import {
  IconMessage,
  IconUserCheck,
  IconEdit,
  IconPlus,
  IconArrowRight,
} from '@tabler/icons-react';
import type { ActivityItem } from '../types';

interface RecentActivityFeedProps {
  activities: ActivityItem[];
}

// Get action icon and color
const getActionConfig = (action: string) => {
  if (action.includes('Commentaire')) {
    return { icon: <IconMessage size={16} />, bg: 'bg-info/10', color: 'text-info' };
  }
  if (action.includes('Assigné')) {
    return { icon: <IconUserCheck size={16} />, bg: 'bg-primary/10', color: 'text-primary' };
  }
  if (action.includes('Statut') || action.includes('Mis à jour')) {
    return { icon: <IconEdit size={16} />, bg: 'bg-warning/10', color: 'text-warning' };
  }
  return { icon: <IconPlus size={16} />, bg: 'bg-success/10', color: 'text-success' };
};

// Format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title">Fil d&apos;activité</h5>
      </div>

      {activities.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-darklink">
          <p>Aucune activité</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.slice(0, 6).map((activity) => {
            const config = getActionConfig(activity.action);
            return (
              <Link
                key={activity.id}
                href={`/leads/${activity.leadId}`}
                className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-lightgray dark:hover:bg-darkgray transition-colors duration-150 group"
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.bg} ${config.color}`}>
                  {config.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ld truncate group-hover:text-primary transition-colors">
                    {activity.leadName}
                  </p>
                  <p className="text-xs text-darklink truncate">
                    {activity.action}
                    {activity.actorName && <span> • {activity.actorName}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-darklink">{formatRelativeTime(activity.date)}</span>
                  <IconArrowRight size={14} className="text-darklink opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {activities.length > 0 && (
        <Link
          href="/leads"
          className="flex items-center justify-center gap-2 mt-4 py-2 text-sm font-medium text-primary hover:underline"
        >
          Voir tous les leads
          <IconArrowRight size={16} />
        </Link>
      )}
    </CardBox>
  );
}
