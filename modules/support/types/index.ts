import { z } from 'zod';
import type {
  SupportTicket,
  SupportTicketComment,
  SupportTicketCategory,
  SupportTicketStatus,
  Profile,
} from '@/db/types';

// Re-export database types
export type {
  SupportTicket,
  SupportTicketComment,
  SupportTicketCategory,
  SupportTicketStatus,
};

// Ticket with relations
export interface SupportTicketWithDetails extends SupportTicket {
  createdByProfile: Profile;
  comments: SupportTicketCommentWithAuthor[];
  commentCount: number;
}

// Comment with author profile
export interface SupportTicketCommentWithAuthor extends SupportTicketComment {
  author: Profile;
}

// Ticket filter schema for URL params validation
export const ticketFiltersSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(10).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(['bug', 'feature', 'payment_issue', 'feedback']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'subject'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type TicketFilters = z.infer<typeof ticketFiltersSchema>;

// Create ticket request
export interface CreateTicketRequest {
  category: SupportTicketCategory;
  subject: string;
  description: string;
}

// Update ticket status request
export interface UpdateTicketStatusRequest {
  ticketId: string;
  status: SupportTicketStatus;
}

// Add comment request
export interface AddCommentRequest {
  ticketId: string;
  body: string;
  isInternal?: boolean;
}

// Paginated tickets response
export interface PaginatedTicketsResponse {
  tickets: SupportTicketWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}


