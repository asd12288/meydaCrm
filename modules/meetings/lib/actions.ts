'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/modules/auth';
import { FR_MESSAGES } from '@/lib/errors';
import { meetingFormSchema, meetingStatusSchema } from '../types';
import type {
  MeetingFormInput,
  MeetingWithLead,
  MeetingWithDetails,
  MeetingStatus,
} from '../types';

/**
 * Get today's meetings for the current user (dashboard widget)
 */
export async function getTodaysMeetings(): Promise<MeetingWithLead[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('meetings')
    .select(
      `
      *,
      lead:leads!meetings_lead_id_fkey(id, first_name, last_name)
    `
    )
    .gte('scheduled_start', today.toISOString())
    .lt('scheduled_start', tomorrow.toISOString())
    .neq('status', 'cancelled')
    .order('scheduled_start', { ascending: true });

  if (error) {
    console.error('Error fetching today meetings:', error);
    return [];
  }

  return (data as MeetingWithLead[]) || [];
}

/**
 * Get upcoming meetings for the current user (dashboard widget)
 */
export async function getUpcomingMeetings(
  limit = 5
): Promise<MeetingWithLead[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('meetings')
    .select(
      `
      *,
      lead:leads!meetings_lead_id_fkey(id, first_name, last_name)
    `
    )
    .gte('scheduled_start', today.toISOString())
    .neq('status', 'cancelled')
    .order('scheduled_start', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming meetings:', error);
    return [];
  }

  return (data as MeetingWithLead[]) || [];
}

/**
 * Get meetings for a specific lead (lead detail page)
 */
export async function getLeadMeetings(
  leadId: string
): Promise<MeetingWithDetails[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('meetings')
    .select(
      `
      *,
      lead:leads!meetings_lead_id_fkey(id, first_name, last_name),
      assignee:profiles!meetings_assigned_to_fkey(id, display_name)
    `
    )
    .eq('lead_id', leadId)
    .order('scheduled_start', { ascending: false });

  if (error) {
    console.error('Error fetching lead meetings:', error);
    return [];
  }

  return (data as MeetingWithDetails[]) || [];
}

/**
 * Create a new meeting
 */
export async function createMeeting(
  data: MeetingFormInput
): Promise<{ success?: boolean; error?: string; meetingId?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Validate input
  const validation = meetingFormSchema.safeParse(data);
  if (!validation.success) {
    return {
      error: validation.error.issues[0]?.message || FR_MESSAGES.INVALID_DATA,
    };
  }

  const { data: meeting, error } = await supabase
    .from('meetings')
    .insert({
      title: data.title,
      description: data.description || null,
      location: data.location || null,
      scheduled_start: data.scheduledStart,
      scheduled_end: data.scheduledEnd,
      lead_id: data.leadId,
      assigned_to: user.id,
      created_by: user.id,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating meeting:', error);
    return { error: 'Erreur lors de la création de la réunion' };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/leads/${data.leadId}`);

  return { success: true, meetingId: meeting.id };
}

/**
 * Update meeting status (complete, cancel, mark as no-show)
 */
export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus,
  outcomeNotes?: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  const validation = meetingStatusSchema.safeParse({ status, outcomeNotes });
  if (!validation.success) {
    return { error: FR_MESSAGES.INVALID_DATA };
  }

  // Get meeting to find lead_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('lead_id')
    .eq('id', meetingId)
    .single();

  const { error } = await supabase
    .from('meetings')
    .update({
      status: validation.data.status,
      outcome_notes: validation.data.outcomeNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId);

  if (error) {
    console.error('Error updating meeting status:', error);
    return { error: 'Erreur lors de la mise à jour du statut' };
  }

  revalidatePath('/dashboard');
  if (meeting?.lead_id) {
    revalidatePath(`/leads/${meeting.lead_id}`);
  }

  return { success: true };
}

/**
 * Update meeting details
 */
export async function updateMeeting(
  meetingId: string,
  data: Partial<MeetingFormInput>
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Get meeting to find lead_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('lead_id')
    .eq('id', meetingId)
    .single();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined)
    updateData.description = data.description || null;
  if (data.location !== undefined) updateData.location = data.location || null;
  if (data.scheduledStart !== undefined)
    updateData.scheduled_start = data.scheduledStart;
  if (data.scheduledEnd !== undefined)
    updateData.scheduled_end = data.scheduledEnd;

  const { error } = await supabase
    .from('meetings')
    .update(updateData)
    .eq('id', meetingId);

  if (error) {
    console.error('Error updating meeting:', error);
    return { error: 'Erreur lors de la mise à jour' };
  }

  revalidatePath('/dashboard');
  if (meeting?.lead_id) {
    revalidatePath(`/leads/${meeting.lead_id}`);
  }

  return { success: true };
}

/**
 * Delete a meeting
 */
export async function deleteMeeting(
  meetingId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { error: FR_MESSAGES.UNAUTHENTICATED };
  }

  // Get meeting to find lead_id for revalidation
  const { data: meeting } = await supabase
    .from('meetings')
    .select('lead_id')
    .eq('id', meetingId)
    .single();

  const { error } = await supabase.from('meetings').delete().eq('id', meetingId);

  if (error) {
    console.error('Error deleting meeting:', error);
    return { error: 'Erreur lors de la suppression' };
  }

  revalidatePath('/dashboard');
  if (meeting?.lead_id) {
    revalidatePath(`/leads/${meeting.lead_id}`);
  }

  return { success: true };
}
