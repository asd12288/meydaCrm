import { pgEnum } from 'drizzle-orm/pg-core';

// User roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'sales']);

// Lead status - French labels stored, English keys for internal use
export const leadStatusEnum = pgEnum('lead_status', [
  'new', // Nouveau
  'contacted', // Contacté
  'qualified', // Qualifié
  'proposal', // Proposition envoyée
  'negotiation', // Négociation
  'won', // Gagné
  'lost', // Perdu
  'no_answer', // Pas de réponse
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
