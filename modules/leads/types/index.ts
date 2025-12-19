import { z } from 'zod';
import type { LeadStatus } from '@/db/types';

// Lead filter schema for URL params validation
export const leadFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(10).max(100).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
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
}

// Re-export LeadStatus for convenience
export type { LeadStatus };
