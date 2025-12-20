'use client';

import React from 'react';
import { CardBox, Badge } from '@/modules/shared';
import Link from 'next/link';
import {
  IconClock,
  IconMessage,
  IconUserCheck,
  IconEdit,
  IconPlus,
} from '@tabler/icons-react';
import { LEAD_STATUS_LABELS } from '@/db/types';
import type { ActivityItem } from '../types';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  showActor?: boolean;
  maxItems?: number;
}

// Get status badge variant
const getStatusVariant = (
  status?: string
): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' => {
  if (!status) return 'secondary';
  if (status === 'won' || status === 'deposit') return 'success';
  if (['lost', 'no_answer', 'wrong_number', 'not_interested'].includes(status)) return 'error';
  if (['proposal', 'negotiation', 'relance', 'callback'].includes(status)) return 'warning';
  if (['contacted', 'qualified', 'rdv'].includes(status)) return 'info';
  return 'primary';
};

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;

  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
};

// Get action icon - all use neutral styling now
const getActionIcon = (action: string) => {
  if (action.includes('Commentaire')) {
    return <IconMessage size={18} />;
  }
  if (action.includes('Assigné')) {
    return <IconUserCheck size={18} />;
  }
  if (action.includes('Statut') || action.includes('Mis à jour')) {
    return <IconEdit size={18} />;
  }
  if (action.includes('Créé') || action.includes('Importé')) {
    return <IconPlus size={18} />;
  }
  return <IconClock size={18} />;
};

export function ActivityTimeline({
  activities,
  showActor = false,
  maxItems = 8,
}: ActivityTimelineProps) {
  const displayActivities = activities.slice(0, maxItems);

  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title">Activité récente</h5>
        <Link href="/leads" className="text-sm text-primary hover:underline">
          Voir tout
        </Link>
      </div>

      {displayActivities.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-darklink">
          <p>Aucune activité récente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayActivities.map((activity) => {
            return (
              <div
                key={activity.id}
                className="flex gap-3 group"
              >
                <div className="dashboard-activity-icon">
                  {getActionIcon(activity.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/leads/${activity.leadId}`}
                        className="text-sm font-medium text-ld hover:text-primary block truncate transition-colors"
                      >
                        {activity.leadName}
                      </Link>
                      <p className="text-xs text-darklink mt-0.5">
                        {activity.action}
                        {showActor && activity.actorName && (
                          <span> • {activity.actorName}</span>
                        )}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {activity.status && (
                        <Badge variant={getStatusVariant(activity.status)} size="sm">
                          {LEAD_STATUS_LABELS[activity.status as keyof typeof LEAD_STATUS_LABELS] || activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-darklink mt-1">{formatDate(activity.date)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardBox>
  );
}
