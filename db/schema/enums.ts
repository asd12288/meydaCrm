import { pgEnum } from 'drizzle-orm/pg-core';

// User roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'sales']);

// Lead status - French labels stored, English keys for internal use
export const leadStatusEnum = pgEnum('lead_status', [
  // New statuses
  'rdv', // RDV (Rendez-vous)
  'no_answer_1', // Pas de réponse 1
  'no_answer_2', // Pas de réponse 2
  'wrong_number', // Faux numéro
  'not_interested', // Pas intéressé
  'deposit', // Dépôt
  'callback', // Rappeler
  'relance', // Relance
  'mail', // Mail
  // Legacy statuses (kept for data compatibility)
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'no_answer',
]);

// Import job status
export const importStatusEnum = pgEnum('import_status', [
  'pending',
  'parsing',
  'validating',
  'ready',
  'importing',
  'completed',
  'failed',
]);

// Import row status
export const importRowStatusEnum = pgEnum('import_row_status', [
  'pending',
  'valid',
  'invalid',
  'imported',
  'skipped',
]);

// History event types
export const historyEventTypeEnum = pgEnum('history_event_type', [
  'created',
  'updated',
  'assigned',
  'status_changed',
  'imported',
  'comment_added',
]);
