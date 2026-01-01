'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin, requireAdminOrDeveloper, getCurrentUser } from '@/modules/auth';
import { sendTicketCreatedEmail, sendTicketCommentEmail } from '@/lib/email';
import { extractValidationError } from '@/lib/validation';
import { FR_MESSAGES } from '@/lib/errors';
import { createNotificationForUsers } from '@/modules/notifications';
import { z } from 'zod';
import type {
  SupportTicketWithDetails,
  SupportTicketCommentWithAuthor,
  PaginatedTicketsResponse,
  CreateTicketRequest,
  UpdateTicketStatusRequest,
  AddCommentRequest,
  TicketFilters,
} from '../types';

// Create ticket schema
const createTicketSchema = z.object({
  category: z.enum(['bug', 'feature', 'payment_issue', 'feedback']),
  subject: z.string().min(1, 'Le sujet est requis').max(200, 'Le sujet est trop long'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
});

/**
 * Create a new support ticket
 * Admin only
 */
export async function createTicket(
  data: CreateTicketRequest
): Promise<{ success: boolean; ticketId?: string; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Validate input
  const validation = createTicketSchema.safeParse(data);
  if (!validation.success) {
    return {
      success: false,
      error: extractValidationError(validation, 'Données invalides'),
    };
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      success: false,
      error: FR_MESSAGES.UNAUTHENTICATED,
    };
  }

  // Insert ticket
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      created_by: user.profile.id,
      category: validation.data.category,
      subject: validation.data.subject,
      description: validation.data.description,
      status: 'open',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    return {
      success: false,
      error: 'Erreur lors de la création du ticket',
    };
  }

  // Add the description as the first comment in the conversation
  const { error: commentError } = await supabase
    .from('support_ticket_comments')
    .insert({
      ticket_id: ticket.id,
      author_id: user.profile.id,
      body: validation.data.description,
      is_internal: false,
    });

  if (commentError) {
    console.error('Error creating initial comment:', commentError);
    // Don't fail the ticket creation, just log the error
  }

  // Send email notification (non-blocking, fails silently)
  sendTicketCreatedEmail({
    id: ticket.id,
    subject: validation.data.subject,
    category: validation.data.category,
    description: validation.data.description,
    createdBy: user.profile.displayName || user.profile.id,
  }).catch((err) => {
    console.error('[Email] Failed to send ticket creation email:', err);
  });

  // Notify all admin users
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'developer']);

  if (admins && admins.length > 0) {
    const adminIds = admins.map((a) => a.id);
    await createNotificationForUsers(
      adminIds,
      'support_ticket',
      'Nouveau ticket support',
      `Ticket créé: "${validation.data.subject}"`,
      { ticketId: ticket.id, ticketSubject: validation.data.subject },
      `/support?ticket=${ticket.id}`
    );
  }

  revalidatePath('/support');
  return {
    success: true,
    ticketId: ticket.id,
  };
}

/**
 * Get paginated tickets with filters
 * Admin only
 * Optimized: Uses aggregate count in single query (fixes N+1 query)
 */
export async function getTickets(
  filters: TicketFilters
): Promise<PaginatedTicketsResponse> {
  await requireAdminOrDeveloper();
  const supabase = await createClient();

  // Build base query with creator profile join and comment count aggregate
  // Using Supabase's aggregate syntax to get comment counts in single query
  let query = supabase
    .from('support_tickets')
    .select(
      `*,
      createdByProfile:profiles!support_tickets_created_by_fkey(id, display_name, avatar, role),
      support_ticket_comments(count)`,
      {
        count: 'exact',
      }
    );

  // Apply search filter (subject and description)
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`subject.ilike.${searchTerm},description.ilike.${searchTerm}`);
  }

  // Apply category filter
  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply sorting
  const sortColumn = filters.sortBy || 'created_at';
  const ascending = filters.sortOrder === 'asc';
  query = query.order(sortColumn, { ascending });

  // Apply pagination
  const pageSize = filters.pageSize || 20;
  const page = filters.page || 1;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching tickets:', error);
    return {
      tickets: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Transform data to include comment counts and normalize field names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tickets = (data || []).map((ticket: any) => {
    // Extract comment count from aggregate result
    const commentCountData = ticket.support_ticket_comments;
    const commentCount = Array.isArray(commentCountData)
      ? commentCountData[0]?.count || 0
      : 0;

    return {
      ...ticket,
      createdAt: ticket.created_at || ticket.createdAt,
      updatedAt: ticket.updated_at || ticket.updatedAt,
      createdBy: ticket.created_by || ticket.createdBy,
      createdByProfile: ticket.createdByProfile || null,
      comments: [],
      commentCount,
      // Remove the nested aggregate data from output
      support_ticket_comments: undefined,
    };
  }) as SupportTicketWithDetails[];

  return {
    tickets,
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get a single ticket with all comments
 * Admin or Developer only
 */
export async function getTicket(
  ticketId: string
): Promise<SupportTicketWithDetails | null> {
  await requireAdminOrDeveloper();
  const supabase = await createClient();

  // Fetch ticket with creator profile
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select(
      '*, createdByProfile:profiles!support_tickets_created_by_fkey(id, display_name, avatar, role)'
    )
    .eq('id', ticketId)
    .single();

  if (ticketError || !ticket) {
    console.error('Error fetching ticket:', ticketError);
    return null;
  }

  // Fetch comments with author profiles
  const { data: comments, error: commentsError } = await supabase
    .from('support_ticket_comments')
    .select(
      '*, author:profiles!support_ticket_comments_author_id_fkey(id, display_name, avatar, role)'
    )
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }

  // Normalize field names from snake_case to camelCase
  const normalizedTicket = {
    ...ticket,
    createdAt: ticket.created_at || ticket.createdAt,
    updatedAt: ticket.updated_at || ticket.updatedAt,
    createdBy: ticket.created_by || ticket.createdBy,
    createdByProfile: ticket.createdByProfile || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    comments: (comments || []).map((c: any) => ({
      ...c,
      createdAt: c.created_at || c.createdAt,
      updatedAt: c.updated_at || c.updatedAt,
      ticketId: c.ticket_id || c.ticketId,
      authorId: c.author_id || c.authorId,
      isInternal: c.is_internal ?? c.isInternal,
      author: c.author || null,
    })) as SupportTicketCommentWithAuthor[],
    commentCount: comments?.length || 0,
  };

  return normalizedTicket;
}

/**
 * Update ticket status
 * Admin only
 */
export async function updateTicketStatus(
  data: UpdateTicketStatusRequest
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin();
  const supabase = await createClient();

  // Get ticket subject for notification
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('subject')
    .eq('id', data.ticketId)
    .single();

  const { error } = await supabase
    .from('support_tickets')
    .update({ status: data.status })
    .eq('id', data.ticketId);

  if (error) {
    console.error('Error updating ticket status:', error);
    return {
      success: false,
      error: 'Erreur lors de la mise à jour du statut',
    };
  }

  // Notify all admin users about status update
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'developer']);

  if (admins && admins.length > 0) {
    const adminIds = admins.map((a) => a.id);
    await createNotificationForUsers(
      adminIds,
      'support_ticket',
      'Ticket mis à jour',
      `Statut du ticket "${ticket?.subject || data.ticketId}" mis à jour`,
      { ticketId: data.ticketId, ticketSubject: ticket?.subject },
      `/support?ticket=${data.ticketId}`
    );
  }

  revalidatePath('/support');
  return {
    success: true,
  };
}

/**
 * Get ticket counts by status
 * Admin or Developer only
 * Optimized: Uses RPC for server-side aggregation (instead of fetching all tickets)
 */
export async function getTicketCounts(): Promise<{
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}> {
  await requireAdminOrDeveloper();
  const supabase = await createClient();

  // Use RPC for efficient server-side aggregation
  const { data: statusCounts } = await supabase.rpc('get_ticket_counts_by_status');

  const counts = {
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  if (statusCounts) {
    statusCounts.forEach((row: { status: string; count: number }) => {
      const status = row.status as keyof typeof counts;
      if (status in counts && status !== 'total') {
        counts[status] = Number(row.count);
      }
      counts.total += Number(row.count);
    });
  }

  return counts;
}

/**
 * Add a comment to a ticket
 * Admin only
 */
export async function addComment(
  data: AddCommentRequest
): Promise<{ success: boolean; commentId?: string; error?: string }> {
  await requireAdminOrDeveloper();
  const supabase = await createClient();

  // Validate comment body
  if (!data.body || data.body.trim().length < 1) {
    return {
      success: false,
      error: 'Le commentaire ne peut pas être vide',
    };
  }

  // Get current user
  const user = await getCurrentUser();
  if (!user?.profile) {
    return {
      success: false,
      error: FR_MESSAGES.UNAUTHENTICATED,
    };
  }

  // Insert comment
  const { data: comment, error } = await supabase
    .from('support_ticket_comments')
    .insert({
      ticket_id: data.ticketId,
      author_id: user.profile.id,
      body: data.body.trim(),
      is_internal: data.isInternal || false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return {
      success: false,
      error: 'Erreur lors de l\'ajout du commentaire',
    };
  }

  // Fetch ticket details for email notification
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('id, subject')
    .eq('id', data.ticketId)
    .single();

  // Send email notification (non-blocking, fails silently)
  if (ticket) {
    sendTicketCommentEmail(
      {
        id: ticket.id,
        subject: ticket.subject,
      },
      {
        body: data.body.trim(),
        authorName: user.profile.displayName || 'Utilisateur',
      }
    ).catch((err) => {
      console.error('[Email] Failed to send comment email:', err);
    });

    // Notify all admin users about new comment (except the comment author)
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'developer'])
      .neq('id', user.profile.id); // Don't notify the comment author

    if (admins && admins.length > 0) {
      const adminIds = admins.map((a) => a.id);
      await createNotificationForUsers(
        adminIds,
        'support_ticket',
        'Nouveau commentaire',
        `Nouveau commentaire sur le ticket: "${ticket.subject}"`,
        { ticketId: data.ticketId, ticketSubject: ticket.subject },
        `/support?ticket=${data.ticketId}`
      );
    }
  }

  revalidatePath('/support');
  return {
    success: true,
    commentId: comment.id,
  };
}


