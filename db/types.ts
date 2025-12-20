import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  profiles,
  leads,
  leadComments,
  leadHistory,
  importJobs,
  importRows,
  subscriptions,
  payments,
  supportTickets,
  supportTicketComments,
} from './schema';

// Profiles
export type Profile = InferSelectModel<typeof profiles>;
export type NewProfile = InferInsertModel<typeof profiles>;
export type UserRole = Profile['role'];

// Leads
export type Lead = InferSelectModel<typeof leads>;
export type NewLead = InferInsertModel<typeof leads>;
export type LeadStatus = Lead['status'];

// Lead Comments
export type LeadComment = InferSelectModel<typeof leadComments>;
export type NewLeadComment = InferInsertModel<typeof leadComments>;

// Lead History
export type LeadHistoryEvent = InferSelectModel<typeof leadHistory>;
export type NewLeadHistoryEvent = InferInsertModel<typeof leadHistory>;
export type HistoryEventType = LeadHistoryEvent['eventType'];

// Import Jobs
export type ImportJob = InferSelectModel<typeof importJobs>;
export type NewImportJob = InferInsertModel<typeof importJobs>;
export type ImportStatus = ImportJob['status'];

// Import Rows
export type ImportRow = InferSelectModel<typeof importRows>;
export type NewImportRow = InferInsertModel<typeof importRows>;
export type ImportRowStatus = ImportRow['status'];

// Utility types for API responses
export type LeadWithAssignee = Lead & {
  assignee: Profile | null;
};

export type LeadWithDetails = Lead & {
  assignee: Profile | null;
  comments: LeadComment[];
  history: LeadHistoryEvent[];
};

// Lead status labels in French
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  // New statuses
  rdv: 'RDV',
  no_answer_1: 'Pas de réponse 1',
  no_answer_2: 'Pas de réponse 2',
  wrong_number: 'Faux numéro',
  not_interested: 'Pas intéressé',
  deposit: 'Dépôt',
  callback: 'Rappeler',
  relance: 'Relance',
  mail: 'Mail',
  // Legacy statuses
  new: 'Nouveau',
  contacted: 'Contacté',
  qualified: 'Qualifié',
  proposal: 'Proposition envoyée',
  negotiation: 'Négociation',
  won: 'Gagné',
  lost: 'Perdu',
  no_answer: 'Pas de réponse',
};

// History event type labels in French
export const HISTORY_EVENT_LABELS: Record<HistoryEventType, string> = {
  created: 'Créé',
  updated: 'Mis à jour',
  assigned: 'Assigné',
  status_changed: 'Statut modifié',
  imported: 'Importé',
  comment_added: 'Commentaire ajouté',
};

// Subscriptions
export type Subscription = InferSelectModel<typeof subscriptions>;
export type NewSubscription = InferInsertModel<typeof subscriptions>;
export type SubscriptionPlan = Subscription['plan'];
export type SubscriptionPeriod = Subscription['period'];
export type SubscriptionStatus = Subscription['status'];

// Payments
export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;
export type PaymentStatus = Payment['status'];

// Support Tickets
export type SupportTicket = InferSelectModel<typeof supportTickets>;
export type NewSupportTicket = InferInsertModel<typeof supportTickets>;
export type SupportTicketCategory = SupportTicket['category'];
export type SupportTicketStatus = SupportTicket['status'];

// Support Ticket Comments
export type SupportTicketComment = InferSelectModel<typeof supportTicketComments>;
export type NewSupportTicketComment = InferInsertModel<typeof supportTicketComments>;
