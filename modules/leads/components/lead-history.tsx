'use client';

import {
  IconPlus,
  IconEdit,
  IconUserPlus,
  IconRefresh,
  IconFileImport,
  IconMessage,
  IconClock,
} from '@tabler/icons-react';
import { HISTORY_EVENT_LABELS } from '@/db/types';
import { LEAD_FIELD_LABELS } from '../types';
import { formatRelativeTime, formatDisplayValue } from '../lib/format';
import type { HistoryEventWithActor } from '../types';

interface LeadHistoryProps {
  history: HistoryEventWithActor[];
}

// Map event type to icon
const EVENT_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  created: IconPlus,
  updated: IconEdit,
  assigned: IconUserPlus,
  status_changed: IconRefresh,
  imported: IconFileImport,
  comment_added: IconMessage,
};

// Map event type to color class
const EVENT_COLORS: Record<string, string> = {
  created: 'bg-lightsuccess text-success',
  updated: 'bg-lightprimary text-primary',
  assigned: 'bg-lightwarning text-warning',
  status_changed: 'bg-lightinfo text-info',
  imported: 'bg-lightsecondary text-secondary',
  comment_added: 'bg-lightprimary text-primary',
};

export function LeadHistory({ history }: LeadHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="text-darklink text-sm py-4 text-center">Aucun historique</p>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line - centered under the icons */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-bordergray dark:bg-darkborder -translate-x-1/2" />

      {/* Events */}
      <div className="space-y-4">
        {history.map((event) => (
          <HistoryEvent key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

interface HistoryEventProps {
  event: HistoryEventWithActor;
}

function HistoryEvent({ event }: HistoryEventProps) {
  const Icon = EVENT_ICONS[event.event_type] || IconClock;
  const colorClass = EVENT_COLORS[event.event_type] || 'bg-lightgray text-darklink';
  const label = HISTORY_EVENT_LABELS[event.event_type] || event.event_type;

  return (
    <div className="relative pl-10">
      {/* Icon with solid background to cover the line */}
      <div className="absolute left-0 w-8 h-8 rounded-full bg-white dark:bg-dark flex items-center justify-center">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center ${colorClass}`}
        >
          <Icon size={14} />
        </div>
      </div>

      {/* Content */}
      <div className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{label}</span>
          <span className="text-xs text-darklink">
            {formatRelativeTime(event.created_at)}
          </span>
        </div>

        <p className="text-xs text-darklink mb-1">
          par {event.actor?.display_name || 'Système'}
        </p>

        {/* Event details */}
        <EventDetails event={event} />
      </div>
    </div>
  );
}

function EventDetails({ event }: { event: HistoryEventWithActor }) {
  const { event_type, before_data, after_data } = event;

  // Status changed
  if (event_type === 'status_changed' && before_data && after_data) {
    return (
      <div className="text-xs bg-lightgray dark:bg-darkborder rounded p-2 mt-1">
        <span className="text-darklink">
          {String(before_data.status_label || before_data.status)}
        </span>
        <span className="mx-2">→</span>
        <span className="font-medium">
          {String(after_data.status_label || after_data.status)}
        </span>
      </div>
    );
  }

  // Assigned
  if (event_type === 'assigned') {
    const wasUnassigned = !before_data?.assigned_to;
    const isUnassigned = !after_data?.assigned_to;

    return (
      <div className="text-xs bg-lightgray dark:bg-darkborder rounded p-2 mt-1">
        {wasUnassigned ? (
          <span className="text-darklink">Non assigné</span>
        ) : (
          <span className="text-darklink">Ancien assigné</span>
        )}
        <span className="mx-2">→</span>
        {isUnassigned ? (
          <span className="font-medium">Non assigné</span>
        ) : (
          <span className="font-medium">Nouvel assigné</span>
        )}
      </div>
    );
  }

  // Field updates
  if (event_type === 'updated' && before_data && after_data) {
    const changedFields = Object.keys(after_data);

    if (changedFields.length === 0) return null;

    return (
      <div className="text-xs bg-lightgray dark:bg-darkborder rounded p-2 mt-1 space-y-1">
        {changedFields.slice(0, 5).map((field) => {
          const fieldLabel =
            LEAD_FIELD_LABELS[field as keyof typeof LEAD_FIELD_LABELS] || field;
          const oldValue = before_data[field];
          const newValue = after_data[field];

          return (
            <div key={field} className="flex flex-wrap gap-1">
              <span className="text-darklink">{fieldLabel}:</span>
              <span className="line-through text-darklink">
                {formatDisplayValue(oldValue)}
              </span>
              <span className="mx-1">→</span>
              <span className="font-medium">{formatDisplayValue(newValue)}</span>
            </div>
          );
        })}
        {changedFields.length > 5 && (
          <p className="text-darklink">
            +{changedFields.length - 5} autre(s) modification(s)
          </p>
        )}
      </div>
    );
  }

  // Comment added (show nothing extra, the event is self-explanatory)
  if (event_type === 'comment_added') {
    return null;
  }

  return null;
}
