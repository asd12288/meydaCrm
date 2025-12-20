import { z } from 'zod';
import type { LeadStatus } from '@/db/types';

// Special value for filtering unassigned leads
export const UNASSIGNED_FILTER_VALUE = 'unassigned';

// Lead filter schema for URL params validation
export const leadFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(10).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  // Accept UUID or 'unassigned' special value
  assignedTo: z
    .string()
    .refine(
      (val) => val === UNASSIGNED_FILTER_VALUE || z.string().uuid().safeParse(val).success,
      { message: 'Must be a valid UUID or "unassigned"' }
    )
    .optional(),
  sortBy: z
    .enum(['updated_at', 'created_at', 'last_name', 'company', 'status'])
    .default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type LeadFilters = z.infer<typeof leadFiltersSchema>;

// Assignee info (subset of Profile) - snake_case from Supabase
export interface LeadAssignee {
  id: string;
  display_name: string | null;
}

// Lead from Supabase (snake_case column names)
export interface SupabaseLead {
  id: string;
  external_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  status: LeadStatus;
  status_label: string;
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  import_job_id: string | null;
}

// Lead with assignee relation (what Supabase returns)
export interface LeadWithAssignee extends SupabaseLead {
  assignee: LeadAssignee | null;
}

// Paginated response from getLeads
export interface PaginatedLeadsResponse {
  leads: LeadWithAssignee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Status update payload
export const updateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum([
    'new',
    'contacted',
    'qualified',
    'proposal',
    'negotiation',
    'won',
    'lost',
    'no_answer',
  ]),
});

export type UpdateStatusPayload = z.infer<typeof updateStatusSchema>;

// Bulk assign payload
export const bulkAssignSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  assigneeId: z.string().uuid(),
});

export type BulkAssignPayload = z.infer<typeof bulkAssignSchema>;

// Sales user for dropdowns
export interface SalesUser {
  id: string;
  display_name: string | null;
  role: string;
  avatar: string | null;
}

// Re-export LeadStatus for convenience
export type { LeadStatus };

// ============================================
// Phase 4: Lead Detail Page Types
// ============================================

// Lead update schema for form validation
export const leadUpdateSchema = z.object({
  first_name: z.string().max(100, 'Maximum 100 caractères').optional().nullable(),
  last_name: z.string().max(100, 'Maximum 100 caractères').optional().nullable(),
  email: z
    .string()
    .email('Email invalide')
    .max(255, 'Maximum 255 caractères')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z.string().max(50, 'Maximum 50 caractères').optional().nullable(),
  company: z.string().max(200, 'Maximum 200 caractères').optional().nullable(),
  job_title: z.string().max(100, 'Maximum 100 caractères').optional().nullable(),
  address: z.string().max(500, 'Maximum 500 caractères').optional().nullable(),
  city: z.string().max(100, 'Maximum 100 caractères').optional().nullable(),
  postal_code: z.string().max(20, 'Maximum 20 caractères').optional().nullable(),
  country: z.string().max(100, 'Maximum 100 caractères').optional().nullable(),
  source: z.string().max(100, 'Maximum 100 caractères').optional().nullable(),
  notes: z.string().max(5000, 'Maximum 5000 caractères').optional().nullable(),
});

export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;

// Comment schema for form validation
export const commentSchema = z.object({
  body: z
    .string()
    .min(1, 'Le commentaire ne peut pas être vide')
    .max(2000, 'Maximum 2000 caractères'),
});

export type CommentInput = z.infer<typeof commentSchema>;

// Note: LEAD_FIELD_LABELS is centralized in @/lib/constants

// Comment with author info (what Supabase returns)
export interface CommentWithAuthor {
  id: string;
  lead_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    display_name: string | null;
    avatar: string | null;
  } | null;
}

// History event with actor info (what Supabase returns)
export interface HistoryEventWithActor {
  id: string;
  lead_id: string;
  actor_id: string | null;
  event_type: 'created' | 'updated' | 'assigned' | 'status_changed' | 'imported' | 'comment_added';
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  actor: {
    id: string;
    display_name: string | null;
    avatar: string | null;
  } | null;
}

// Full lead details for detail page
export interface LeadWithFullDetails extends SupabaseLead {
  assignee: LeadAssignee | null;
  comments: CommentWithAuthor[];
  history: HistoryEventWithActor[];
}
