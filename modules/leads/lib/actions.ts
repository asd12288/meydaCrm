'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, requireAdmin } from '@/modules/auth';
import { extractValidationError } from '@/lib/validation';
import { FR_MESSAGES } from '@/lib/errors';
import { LEAD_STATUS_LABELS } from '@/db/types';
import type { LeadStatus } from '@/db/types';
import { notifyLeadAssigned, notifyLeadComment } from '@/modules/notifications';
import { getCached, invalidateDashboardCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import type {
  LeadFilters,
  PaginatedLeadsResponse,
  LeadWithAssignee,
  SalesUser,
  LeadWithFullDetails,
  LeadUpdateInput,
  CommentWithAuthor,
  HistoryEventWithActor,
  LeadForKanban,
} from '../types';
import { leadUpdateSchema, commentSchema, UNASSIGNED_FILTER_VALUE } from '../types';
import { MIN_SEARCH_LENGTH } from '../config/constants';

/**
 * Fetch paginated leads with filters
 * RLS automatically filters: admin sees all, sales sees only assigned
 *
 * No count query for performance - pagination uses hasMore pattern
 */
export async function getLeads(
  filters: LeadFilters
): Promise<PaginatedLeadsResponse> {
  const supabase = await createClient();
  const pageSize = filters.pageSize || 20;
  const page = filters.page || 1;

  // Build query with assignee join
  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id, display_name)')
    .is('deleted_at', null);

  // Apply search filter only if minimum length is met
  if (filters.search && filters.search.trim().length >= MIN_SEARCH_LENGTH) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
    );
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply assignee filter
  if (filters.assignedTo) {
    if (filters.assignedTo === UNASSIGNED_FILTER_VALUE) {
      query = query.is('assigned_to', null);
    } else {
      query = query.eq('assigned_to', filters.assignedTo);
    }
  }

  // Apply sorting
  const sortColumn = filters.sortBy || 'updated_at';
  const ascending = filters.sortOrder === 'asc';
  query = query.order(sortColumn, { ascending });

  // Fetch one extra row to detect if there's a next page
  const from = (page - 1) * pageSize;
  const to = from + pageSize; // +1 to check hasMore
  query = query.range(from, to);

  const { data, error } = await query;

  if (error) {
    console.error('[getLeads] Error fetching leads:', error);
    return {
      leads: [],
      page,
      pageSize,
      hasMore: false,
    };
  }

  // Check if there are more results
  const hasMore = (data?.length || 0) > pageSize;
  const leads = hasMore ? data!.slice(0, pageSize) : (data || []);

  return {
    leads: leads as LeadWithAssignee[],
    page,
    pageSize,
    hasMore,
  };
}

/**
 * Fetch leads for kanban view (assigned to current user only)
 * Always filters by assigned_to = current user (for both admin and sales)
 * Includes last comment for each lead
 */
export async function getLeadsForKanban(
  filters: LeadFilters
): Promise<{ leads: LeadForKanban[]; total: number }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { leads: [], total: 0 };
  }

  // Build query - always filter by current user's assigned leads
  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id, display_name)', {
      count: 'exact',
    })
    .is('deleted_at', null)
    .eq('assigned_to', user.id); // Always filter by current user

  // Apply search filter
  if (filters.search && filters.search.trim().length >= MIN_SEARCH_LENGTH) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
    );
  }

  // Apply sorting and limit
  query = query
    .order('updated_at', { ascending: false })
    .limit(filters.pageSize || 200);

  const { data: leads, error, count } = await query;

  if (error) {
    console.error('Error fetching kanban leads:', error);
    return { leads: [], total: 0 };
  }

  if (!leads || leads.length === 0) {
    return { leads: [], total: count || 0 };
  }

  // Fetch last comment for each lead
  const leadIds = leads.map((l) => l.id);
  const { data: comments } = await supabase
    .from('lead_comments')
    .select('id, lead_id, body, created_at, author:profiles!lead_comments_author_id_fkey(id, display_name, avatar)')
    .in('lead_id', leadIds)
    .order('created_at', { ascending: false });

  // Group comments by lead_id and get only the latest one
  const lastCommentByLead = new Map<string, LeadForKanban['last_comment']>();
  if (comments) {
    for (const comment of comments) {
      if (!lastCommentByLead.has(comment.lead_id)) {
        lastCommentByLead.set(comment.lead_id, {
          id: comment.id,
          body: comment.body,
          created_at: comment.created_at,
          author: comment.author as LeadForKanban['last_comment'] extends { author: infer A } ? A : never,
        });
      }
    }
  }

  // Merge leads with last comment
  const leadsWithComments: LeadForKanban[] = leads.map((lead) => ({
    ...lead,
    last_comment: lastCommentByLead.get(lead.id) || null,
  })) as LeadForKanban[];

  return { leads: leadsWithComments, total: count || 0 };
}

/**
 * Get all users for assignee dropdown (excludes developers)
 * Accessible to all authenticated users (sales needs this for UI)
 * RLS policies on profiles table control access
 * 
 * Cached for 5 minutes - user list rarely changes
 */
export async function getSalesUsers(): Promise<SalesUser[]> {
  return getCached(
    CACHE_KEYS.SALES_USERS,
    async () => {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, role, avatar')
        .neq('role', 'developer') // Exclude developers from all user selectors
        .order('display_name');

      if (error) {
        console.error('Error fetching sales users:', error);
        return [];
      }

      return data || [];
    },
    CACHE_TTL.SALES_USERS
  );
}

/**
 * Get count and IDs of unassigned leads with "Nouveau" status (admin only)
 * Used for the quick assignment banner on leads page
 */
export async function getUnassignedNewLeadsCount(): Promise<{
  count: number;
  leadIds: string[];
}> {
  // Silently return empty if not admin (no error for UI display)
  try {
    await requireAdmin();
  } catch {
    return { count: 0, leadIds: [] };
  }

  const supabase = await createClient();

  const { data, count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('status', 'new') // Database uses lowercase English status keys
    .is('assigned_to', null)
    .is('deleted_at', null)
    .limit(500); // Cap at 500 for bulk operations

  if (error) {
    console.error('Error fetching unassigned new leads count:', error);
    return { count: 0, leadIds: [] };
  }

  return {
    count: count || 0,
    leadIds: data?.map((lead) => lead.id) || [],
  };
}

/**
 * Update lead status and create history entry
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: LeadStatus
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Get current lead data for history
  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('status, status_label')
    .eq('id', leadId)
    .single();

  if (fetchError || !currentLead) {
    return { error: FR_MESSAGES.LEAD_NOT_FOUND };
  }

  // Update lead with new status
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      status: newStatus,
      status_label: LEAD_STATUS_LABELS[newStatus],
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (updateError) {
    console.error('Error updating lead status:', updateError);
    return { error: FR_MESSAGES.ERROR_STATUS_UPDATE };
  }

  // Create history entry
  const { error: historyError } = await supabase.from('lead_history').insert({
    lead_id: leadId,
    actor_id: user.id,
    event_type: 'status_changed',
    before_data: { status: currentLead.status, status_label: currentLead.status_label },
    after_data: { status: newStatus, status_label: LEAD_STATUS_LABELS[newStatus] },
  });

  if (historyError) {
    console.error('Error creating history entry:', historyError);
    // Don't fail the operation for history errors
  }

  revalidatePath('/leads');
  
  // Invalidate dashboard cache (status counts changed)
  await invalidateDashboardCache();
  
  return { success: true };
}

/**
 * Bulk assign leads to a user (admin only)
 */
export async function bulkAssignLeads(
  leadIds: string[],
  assigneeId: string | null
): Promise<{ success?: boolean; error?: string; count?: number }> {
  const user = await requireAdmin();
  const supabase = await createClient();

  if (!leadIds.length) {
    return { error: FR_MESSAGES.NO_LEADS_SELECTED };
  }

  // Get current assignment data for history
  const { data: currentLeads } = await supabase
    .from('leads')
    .select('id, assigned_to')
    .in('id', leadIds);

  // Bulk update leads
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      assigned_to: assigneeId,
      updated_at: new Date().toISOString(),
    })
    .in('id', leadIds);

  if (updateError) {
    console.error('Error bulk assigning leads:', updateError);
    return { error: FR_MESSAGES.ERROR_ASSIGN };
  }

  // Create history entries for each lead
  if (currentLeads) {
    const historyEntries = currentLeads.map((lead) => ({
      lead_id: lead.id,
      actor_id: user.id,
      event_type: 'assigned' as const,
      before_data: { assigned_to: lead.assigned_to },
      after_data: { assigned_to: assigneeId },
    }));

    const { error: historyError } = await supabase
      .from('lead_history')
      .insert(historyEntries);

    if (historyError) {
      console.error('Error creating history entries:', historyError);
      // Don't fail the operation for history errors
    }

    // Send notifications to assignee if assigned
    if (assigneeId) {
      // Fetch lead details for notification
      const { data: leadsWithNames } = await supabase
        .from('leads')
        .select('id, first_name, last_name')
        .in('id', leadIds);

      // Create notifications for each assigned lead
      await Promise.all(
        (leadsWithNames || []).map((lead) => {
          const leadName = lead.first_name || lead.last_name
            ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
            : undefined;
          return notifyLeadAssigned(assigneeId, lead.id, leadName);
        })
      );
    }
  }

  revalidatePath('/leads');
  
  // Invalidate dashboard cache (assignment stats changed)
  await invalidateDashboardCache();
  
  return { success: true, count: leadIds.length };
}

// ============================================
// Phase 4: Lead Detail Page Actions
// ============================================

/**
 * Fetch a single lead with comments and history
 * RLS automatically filters: user can only see leads they have access to
 */
export async function getLeadById(
  leadId: string
): Promise<{ lead: LeadWithFullDetails | null; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { lead: null, error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Fetch lead with assignee
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_fkey(id, display_name)')
    .eq('id', leadId)
    .is('deleted_at', null)
    .single();

  if (leadError || !lead) {
    console.error('Error fetching lead:', leadError);
    return { lead: null, error: FR_MESSAGES.LEAD_NOT_FOUND };
  }

  // Fetch comments with author (use author_id column for relation)
  const { data: comments, error: commentsError } = await supabase
    .from('lead_comments')
    .select('*, author:profiles!lead_comments_author_id_fkey(id, display_name, avatar)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }

  // Fetch history with actor (use explicit FK constraint name)
  const { data: history, error: historyError } = await supabase
    .from('lead_history')
    .select('*, actor:profiles!lead_history_actor_id_fkey(id, display_name, avatar)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (historyError) {
    console.error('Error fetching history:', historyError);
  }

  return {
    lead: {
      ...lead,
      comments: (comments as CommentWithAuthor[]) || [],
      history: (history as HistoryEventWithActor[]) || [],
    },
  };
}

/**
 * Update lead fields and create history entry
 */
export async function updateLead(
  leadId: string,
  data: LeadUpdateInput
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Validate input
  const validationResult = leadUpdateSchema.safeParse(data);
  if (!validationResult.success) {
    return { error: FR_MESSAGES.INVALID_DATA };
  }

  // Get current lead data for history
  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('first_name, last_name, email, phone, company, job_title, address, city, postal_code, country, source, notes')
    .eq('id', leadId)
    .single();

  if (fetchError || !currentLead) {
    return { error: FR_MESSAGES.LEAD_NOT_FOUND };
  }

  // Calculate diff (only changed fields)
  const beforeData: Record<string, unknown> = {};
  const afterData: Record<string, unknown> = {};
  const currentLeadRecord = currentLead as Record<string, unknown>;

  for (const [key, newValue] of Object.entries(data)) {
    if (newValue === undefined) continue;

    const oldValue = currentLeadRecord[key];
    // Convert empty strings to null for comparison
    const normalizedNew = newValue === '' ? null : newValue;

    if (oldValue !== normalizedNew) {
      beforeData[key] = oldValue;
      afterData[key] = normalizedNew;
    }
  }

  // If nothing changed, return success without updating
  if (Object.keys(afterData).length === 0) {
    return { success: true };
  }

  // Prepare update data (convert empty strings to null)
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [key, value] of Object.entries(afterData)) {
    updateData[key] = value;
  }

  // Update lead
  const { error: updateError } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId);

  if (updateError) {
    console.error('Error updating lead:', updateError);
    return { error: FR_MESSAGES.ERROR_UPDATE };
  }

  // Create history entry
  const { error: historyError } = await supabase.from('lead_history').insert({
    lead_id: leadId,
    actor_id: user.id,
    event_type: 'updated',
    before_data: beforeData,
    after_data: afterData,
  });

  if (historyError) {
    console.error('Error creating history entry:', historyError);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  return { success: true };
}

/**
 * Assign a single lead to a user (admin only)
 */
export async function assignLead(
  leadId: string,
  assigneeId: string | null
): Promise<{ success?: boolean; error?: string }> {
  const user = await requireAdmin();
  const supabase = await createClient();

  // Get current assignment for history
  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('assigned_to')
    .eq('id', leadId)
    .single();

  if (fetchError || !currentLead) {
    return { error: FR_MESSAGES.LEAD_NOT_FOUND };
  }

  // Don't update if same assignee
  if (currentLead.assigned_to === assigneeId) {
    return { success: true };
  }

  // Update lead
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      assigned_to: assigneeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (updateError) {
    console.error('Error assigning lead:', updateError);
    return { error: FR_MESSAGES.ERROR_ASSIGN };
  }

  // Create history entry
  const { error: historyError } = await supabase.from('lead_history').insert({
    lead_id: leadId,
    actor_id: user.id,
    event_type: 'assigned',
    before_data: { assigned_to: currentLead.assigned_to },
    after_data: { assigned_to: assigneeId },
  });

  if (historyError) {
    console.error('Error creating history entry:', historyError);
  }

  // Send notification to assignee if assigned
  if (assigneeId) {
    // Fetch lead name for notification
    const { data: lead } = await supabase
      .from('leads')
      .select('first_name, last_name')
      .eq('id', leadId)
      .single();

    const leadName = lead
      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || undefined
      : undefined;

    await notifyLeadAssigned(assigneeId, leadId, leadName);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  
  // Invalidate dashboard cache (assignment stats changed)
  await invalidateDashboardCache();
  
  return { success: true };
}

/**
 * Add a comment to a lead
 */
export async function addComment(
  leadId: string,
  body: string
): Promise<{ success?: boolean; comment?: CommentWithAuthor; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Validate input
  const validationResult = commentSchema.safeParse({ body });
  if (!validationResult.success) {
    return { error: extractValidationError(validationResult, FR_MESSAGES.INVALID_DATA) };
  }

  // Insert comment
  const { data: comment, error: insertError } = await supabase
    .from('lead_comments')
    .insert({
      lead_id: leadId,
      author_id: user.id,
      body: body.trim(),
    })
    .select('*, author:profiles!lead_comments_author_id_fkey(id, display_name, avatar)')
    .single();

  if (insertError) {
    console.error('Error adding comment:', insertError);
    return { error: FR_MESSAGES.ERROR_COMMENT_ADD };
  }

  // Create history entry
  const { error: historyError } = await supabase.from('lead_history').insert({
    lead_id: leadId,
    actor_id: user.id,
    event_type: 'comment_added',
    metadata: { comment_id: comment.id },
  });

  if (historyError) {
    console.error('Error creating history entry:', historyError);
  }

  // Send notification to assigned user (if not the comment author)
  const { data: lead } = await supabase
    .from('leads')
    .select('assigned_to, first_name, last_name')
    .eq('id', leadId)
    .single();

  if (lead?.assigned_to && lead.assigned_to !== user.id) {
    const leadName = lead.first_name || lead.last_name
      ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
      : undefined;
    const commentPreview = body.trim().substring(0, 100);
    await notifyLeadComment(
      lead.assigned_to,
      leadId,
      comment.id,
      leadName,
      commentPreview
    );
  }

  revalidatePath(`/leads/${leadId}`);
  return { success: true, comment: comment as CommentWithAuthor };
}

/**
 * Delete a comment (own comments only, or admin)
 */
export async function deleteComment(
  commentId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Get comment to verify ownership and get lead_id
  const { data: comment, error: fetchError } = await supabase
    .from('lead_comments')
    .select('id, lead_id, author_id')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    return { error: FR_MESSAGES.COMMENT_NOT_FOUND };
  }

  // Check permission: own comment or admin
  const isAdmin = user.profile?.role === 'admin';
  if (comment.author_id !== user.id && !isAdmin) {
    return { error: FR_MESSAGES.CANNOT_DELETE_OTHERS_COMMENTS };
  }

  // Delete comment (RLS will also enforce this)
  const { error: deleteError } = await supabase
    .from('lead_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) {
    console.error('Error deleting comment:', deleteError);
    return { error: FR_MESSAGES.ERROR_DELETE };
  }

  revalidatePath(`/leads/${comment.lead_id}`);
  return { success: true };
}

/**
 * Delete a lead (soft delete - sets deleted_at)
 * Admin only
 */
export async function deleteLead(
  leadId: string
): Promise<{ success?: boolean; error?: string }> {
  const user = await requireAdmin();
  const supabase = await createClient();

  // Get current lead data for history
  const { data: currentLead, error: fetchError } = await supabase
    .from('leads')
    .select('id, first_name, last_name')
    .eq('id', leadId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !currentLead) {
    return { error: FR_MESSAGES.LEAD_NOT_FOUND };
  }

  // Soft delete (set deleted_at)
  const { error: deleteError } = await supabase
    .from('leads')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  if (deleteError) {
    console.error('Error deleting lead:', deleteError);
    return { error: deleteError.message || FR_MESSAGES.ERROR_DELETE };
  }

  // Create history entry
  const { error: historyError } = await supabase.from('lead_history').insert({
    lead_id: leadId,
    actor_id: user.id,
    event_type: 'deleted',
    before_data: {
      first_name: currentLead.first_name,
      last_name: currentLead.last_name,
    },
    after_data: { deleted_at: new Date().toISOString() },
  });

  if (historyError) {
    console.error('Error creating history entry:', historyError);
    // Don't fail the operation for history errors
  }

  revalidatePath('/leads');

  // Invalidate dashboard cache (lead counts changed)
  await invalidateDashboardCache();

  return { success: true };
}
