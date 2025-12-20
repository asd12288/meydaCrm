/**
 * Centralized history event labels (DRY)
 * Used across: leads module
 */

/**
 * History event types
 */
export const HISTORY_EVENT_TYPES = {
  CREATED: 'created',
  UPDATED: 'updated',
  ASSIGNED: 'assigned',
  STATUS_CHANGED: 'status_changed',
  IMPORTED: 'imported',
  COMMENT_ADDED: 'comment_added',
} as const;

export type HistoryEventType =
  (typeof HISTORY_EVENT_TYPES)[keyof typeof HISTORY_EVENT_TYPES];

/**
 * History event display labels in French
 */
export const HISTORY_EVENT_LABELS: Record<HistoryEventType, string> = {
  created: 'Lead créé',
  updated: 'Lead modifié',
  assigned: 'Lead assigné',
  status_changed: 'Statut modifié',
  imported: 'Lead importé',
  comment_added: 'Commentaire ajouté',
};

/**
 * Get display label for an event type
 */
export function getHistoryEventLabel(eventType: string): string {
  return (
    HISTORY_EVENT_LABELS[eventType as HistoryEventType] || eventType
  );
}
