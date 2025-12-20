import type { SupabaseClient } from '@supabase/supabase-js';
import { logSupabaseError } from '@/lib/errors';

export type HistoryEventType =
  | 'created'
  | 'updated'
  | 'assigned'
  | 'status_changed'
  | 'imported'
  | 'comment_added';

export interface HistoryEntryInput {
  lead_id: string;
  actor_id: string;
  event_type: HistoryEventType;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create a history entry for a lead
 * Reduces duplication in leads/lib/actions.ts
 *
 * Note: History errors are logged but don't fail the parent operation
 */
export async function createHistoryEntry(
  supabase: SupabaseClient,
  entry: HistoryEntryInput
): Promise<{ error?: unknown }> {
  const { error } = await supabase.from('lead_history').insert({
    lead_id: entry.lead_id,
    actor_id: entry.actor_id,
    event_type: entry.event_type,
    before_data: entry.before_data,
    after_data: entry.after_data,
    metadata: entry.metadata,
  });

  if (error) {
    logSupabaseError(`createHistoryEntry[${entry.event_type}]`, error);
  }

  return { error };
}

/**
 * Create a status change history entry
 */
export async function createStatusChangeHistory(
  supabase: SupabaseClient,
  leadId: string,
  actorId: string,
  previousStatus: string,
  newStatus: string
): Promise<void> {
  await createHistoryEntry(supabase, {
    lead_id: leadId,
    actor_id: actorId,
    event_type: 'status_changed',
    before_data: { status: previousStatus },
    after_data: { status: newStatus },
  });
}

/**
 * Create an assignment history entry
 */
export async function createAssignmentHistory(
  supabase: SupabaseClient,
  leadId: string,
  actorId: string,
  previousAssignee: string | null,
  newAssignee: string | null,
  newAssigneeName?: string
): Promise<void> {
  await createHistoryEntry(supabase, {
    lead_id: leadId,
    actor_id: actorId,
    event_type: 'assigned',
    before_data: { assigned_to: previousAssignee },
    after_data: { assigned_to: newAssignee },
    metadata: newAssigneeName ? { assigned_to_name: newAssigneeName } : undefined,
  });
}

/**
 * Create an update history entry
 */
export async function createUpdateHistory(
  supabase: SupabaseClient,
  leadId: string,
  actorId: string,
  beforeData: Record<string, unknown>,
  afterData: Record<string, unknown>
): Promise<void> {
  await createHistoryEntry(supabase, {
    lead_id: leadId,
    actor_id: actorId,
    event_type: 'updated',
    before_data: beforeData,
    after_data: afterData,
  });
}

/**
 * Create a comment added history entry
 */
export async function createCommentHistory(
  supabase: SupabaseClient,
  leadId: string,
  actorId: string,
  commentId: string,
  commentPreview: string
): Promise<void> {
  await createHistoryEntry(supabase, {
    lead_id: leadId,
    actor_id: actorId,
    event_type: 'comment_added',
    metadata: {
      comment_id: commentId,
      preview: commentPreview.substring(0, 100),
    },
  });
}
