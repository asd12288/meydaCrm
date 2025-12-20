import { pgEnum } from 'drizzle-orm/pg-core';

// User roles
export const userRoleEnum = pgEnum('user_role', ['admin', 'sales', 'developer']);

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
  'queued', // In QStash queue
  'pending', // Awaiting processing
  'parsing', // Reading file
  'validating', // Validating rows
  'ready', // Ready to commit
  'importing', // Committing to database
  'completed', // Success
  'failed', // Error occurred
  'cancelled', // User cancelled
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

// Subscription plan types
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'standard',
  'pro',
]);

// Subscription period options
export const subscriptionPeriodEnum = pgEnum('subscription_period', [
  '1_month',
  '3_months',
  '12_months',
]);

// Subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'pending',
  'active',
  'grace', // After expiry, before full block (7-day grace period)
  'expired',
  'cancelled',
]);

// Payment status (from NOWPayments)
export const paymentStatusEnum = pgEnum('payment_status', [
  'waiting',
  'confirming',
  'confirmed',
  'sending',
  'partially_paid',
  'finished',
  'failed',
  'refunded',
  'expired',
]);

// Support ticket category
export const supportTicketCategoryEnum = pgEnum('support_ticket_category', [
  'bug',
  'feature',
  'payment_issue',
  'feedback',
]);

// Support ticket status
export const supportTicketStatusEnum = pgEnum('support_ticket_status', [
  'open',
  'in_progress',
  'resolved',
  'closed',
]);
