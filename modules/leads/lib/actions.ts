'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, requireAdmin } from '@/modules/auth';
import { extractValidationError } from '@/lib/validation';
import { FR_MESSAGES } from '@/lib/errors';
import { LEAD_STATUS_LABELS } from '@/db/types';
import type { LeadStatus } from '@/db/types';
import type {
  LeadFilters,
  PaginatedLeadsResponse,
  LeadWithAssignee,
  SalesUser,
  LeadWithFullDetails,
  LeadUpdateInput,
  CommentWithAuthor,
  HistoryEventWithActor,
} from '../types';
import { leadUpdateSchema, commentSchema } from '../types';

/**
 * Fetch paginated leads with filters
 * RLS automatically filters: admin sees all, sales sees only assigned
 */
export async function getLeads(
  filters: LeadFilters
): Promise<PaginatedLeadsResponse> {
  const supabase = await createClient();

  // Build base query with assignee join
  let query = supabase
    .from('leads')
    .select('*, assignee:profiles!leads_assigned_to_profiles_id_fk(id, display_name)', {
      count: 'exact',
    })
    .is('deleted_at', null);

  // Apply search filter (across multiple fields)
  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(
      `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
    );
  }

  // Apply status filter
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  // Apply assignee filter (admin only - sales can't filter by assignee)
  if (filters.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }

  // Apply sorting
  const sortColumn = filters.sortBy || 'updated_at';
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
    console.error('Error fetching leads:', error);
    return {
      leads: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return {
    leads: (data as LeadWithAssignee[]) || [],
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Get all users for assignee dropdown (admin only)
 */
export async function getSalesUsers(): Promise<SalesUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role, avatar')
    .order('display_name');

  if (error) {
    console.error('Error fetching sales users:', error);
    return [];
  }

  return data || [];
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
  }

  revalidatePath('/leads');
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
    .select('*, assignee:profiles!leads_assigned_to_profiles_id_fk(id, display_name)')
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
    .select('*, author:profiles!author_id(id, display_name, avatar)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (commentsError) {
    console.error('Error fetching comments:', commentsError);
  }

  // Fetch history with actor (use actor_id column for relation)
  const { data: history, error: historyError } = await supabase
    .from('lead_history')
    .select('*, actor:profiles!actor_id(id, display_name, avatar)')
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

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
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
    .select('*, author:profiles!author_id(id, display_name, avatar)')
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
