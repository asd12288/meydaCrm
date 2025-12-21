'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/modules/auth';
import { FR_MESSAGES, actionSuccess, actionError } from '@/lib/errors';
import type { NoteCreateInput, NoteUpdateInput, NotePositionInput, NoteWithLead } from '../types';
import { noteCreateSchema, noteUpdateSchema, notePositionSchema } from '../types';

/**
 * Fetch recent notes for dashboard widget
 * Returns limited number of notes ordered by most recently updated
 */
export async function getRecentNotes(limit = 4): Promise<{
  notes: NoteWithLead[];
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { notes: [], error: FR_MESSAGES.UNAUTHENTICATED };
  }

  const { data, error } = await supabase
    .from('notes')
    .select(
      `
      *,
      lead:leads!lead_id(id, first_name, last_name)
    `
    )
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent notes:', error);
    return { notes: [], error: 'Erreur lors du chargement des notes' };
  }

  return { notes: (data as NoteWithLead[]) || [] };
}

/**
 * Fetch all notes for current user
 * Includes linked lead info to avoid N+1 queries
 * Ordered by: z_index (for proper layering on canvas)
 */
export async function getNotes(): Promise<{
  notes: NoteWithLead[];
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { notes: [], error: FR_MESSAGES.UNAUTHENTICATED };
  }

  const { data, error } = await supabase
    .from('notes')
    .select(
      `
      *,
      lead:leads!lead_id(id, first_name, last_name)
    `
    )
    .eq('created_by', user.id)
    .order('z_index', { ascending: true });

  if (error) {
    console.error('Error fetching notes:', error);
    return { notes: [], error: 'Erreur lors du chargement des notes' };
  }

  return { notes: (data as NoteWithLead[]) || [] };
}

/**
 * Create a new note
 * New notes appear on top (highest z_index) with staggered positions
 */
export async function createNote(input: NoteCreateInput): Promise<{
  success?: boolean;
  note?: NoteWithLead;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return actionError(FR_MESSAGES.UNAUTHENTICATED);
  }

  const validation = noteCreateSchema.safeParse(input);
  if (!validation.success) {
    return actionError(FR_MESSAGES.INVALID_DATA);
  }

  // Get max position and z_index for new note
  const { data: maxData } = await supabase
    .from('notes')
    .select('position, z_index')
    .eq('created_by', user.id)
    .order('position', { ascending: false })
    .limit(1)
    .single();

  const newPosition = (maxData?.position ?? -1) + 1;
  const newZIndex = (maxData?.z_index ?? -1) + 1;

  // Stagger new notes so they don't overlap
  const baseX = 100 + (newPosition * 30) % 400;
  const baseY = 100 + (newPosition * 40) % 300;

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: input.title || null,
      content: input.content,
      color: input.color,
      lead_id: input.leadId || null,
      position: newPosition,
      position_x: baseX,
      position_y: baseY,
      width: 240,
      height: 200,
      z_index: newZIndex,
      created_by: user.id,
    })
    .select(`*, lead:leads!lead_id(id, first_name, last_name)`)
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return actionError('Erreur lors de la création de la note');
  }

  revalidatePath('/notes');
  return { success: true, note: data as NoteWithLead };
}

/**
 * Update a note
 */
export async function updateNote(input: NoteUpdateInput): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return actionError(FR_MESSAGES.UNAUTHENTICATED);
  }

  const validation = noteUpdateSchema.safeParse(input);
  if (!validation.success) {
    return actionError(FR_MESSAGES.INVALID_DATA);
  }

  const { id, ...updateData } = input;

  // Build update object with only provided fields
  const updateObj: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updateData.title !== undefined) updateObj.title = updateData.title;
  if (updateData.content !== undefined) updateObj.content = updateData.content;
  if (updateData.color !== undefined) updateObj.color = updateData.color;
  if (updateData.leadId !== undefined) updateObj.lead_id = updateData.leadId;

  const { error } = await supabase
    .from('notes')
    .update(updateObj)
    .eq('id', id)
    .eq('created_by', user.id); // RLS double-check

  if (error) {
    console.error('Error updating note:', error);
    return actionError('Erreur lors de la modification de la note');
  }

  revalidatePath('/notes');
  return actionSuccess();
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return actionError(FR_MESSAGES.UNAUTHENTICATED);
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('created_by', user.id); // RLS double-check

  if (error) {
    console.error('Error deleting note:', error);
    return actionError('Erreur lors de la suppression de la note');
  }

  revalidatePath('/notes');
  return actionSuccess();
}

/**
 * Reorder notes (update positions after drag)
 * Uses batch position update for efficiency
 */
export async function reorderNotes(orderedIds: string[]): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return actionError(FR_MESSAGES.UNAUTHENTICATED);
  }

  // Update positions in batch
  // Each note gets its array index as the new position
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from('notes')
      .update({
        position: i,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderedIds[i])
      .eq('created_by', user.id);

    if (error) {
      console.error('Error reordering note:', error);
      return actionError('Erreur lors du réordonnancement');
    }
  }

  revalidatePath('/notes');
  return actionSuccess();
}

/**
 * Search leads for the lead picker
 */
export async function searchLeadsForNotes(query: string): Promise<{
  leads: Array<{ id: string; first_name: string | null; last_name: string | null; company: string | null }>;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { leads: [], error: FR_MESSAGES.UNAUTHENTICATED };
  }

  const searchQuery = `%${query}%`;

  const { data, error } = await supabase
    .from('leads')
    .select('id, first_name, last_name, company')
    .is('deleted_at', null)
    .or(`first_name.ilike.${searchQuery},last_name.ilike.${searchQuery},company.ilike.${searchQuery}`)
    .limit(10);

  if (error) {
    console.error('Error searching leads:', error);
    return { leads: [], error: 'Erreur lors de la recherche' };
  }

  return { leads: data || [] };
}

/**
 * Get all leads assigned to the current user (for dropdown picker)
 * Returns all non-deleted leads assigned to the user, sorted by name
 */
export async function getAssignedLeadsForNotes(): Promise<{
  leads: Array<{ id: string; first_name: string | null; last_name: string | null; company: string | null }>;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return { leads: [], error: FR_MESSAGES.UNAUTHENTICATED };
  }

  const { data, error } = await supabase
    .from('leads')
    .select('id, first_name, last_name, company')
    .eq('assigned_to', user.id)
    .is('deleted_at', null)
    .order('last_name', { ascending: true })
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching assigned leads:', error);
    return { leads: [], error: 'Erreur lors du chargement des leads' };
  }

  return { leads: data || [] };
}

/**
 * Update note position/size after drag or resize
 * Optimized for frequent calls - minimal validation, fast update
 * No revalidatePath - optimistic UI handles display
 */
export async function updateNotePosition(input: NotePositionInput): Promise<{
  success?: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return actionError(FR_MESSAGES.UNAUTHENTICATED);
  }

  const validation = notePositionSchema.safeParse(input);
  if (!validation.success) {
    return actionError(FR_MESSAGES.INVALID_DATA);
  }

  const { id, ...updateData } = input;

  // Build update object with only provided fields
  const updateObj: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updateData.positionX !== undefined) updateObj.position_x = updateData.positionX;
  if (updateData.positionY !== undefined) updateObj.position_y = updateData.positionY;
  if (updateData.width !== undefined) updateObj.width = updateData.width;
  if (updateData.height !== undefined) updateObj.height = updateData.height;
  if (updateData.zIndex !== undefined) updateObj.z_index = updateData.zIndex;

  const { error } = await supabase
    .from('notes')
    .update(updateObj)
    .eq('id', id)
    .eq('created_by', user.id);

  if (error) {
    console.error('Error updating note position:', error);
    return actionError('Erreur lors du déplacement de la note');
  }

  // No revalidatePath here - optimistic UI handles it
  return actionSuccess();
}

/**
 * Bring note to front (highest z-index)
 * Called when user starts dragging a note
 */
export async function bringNoteToFront(noteId: string): Promise<{
  success?: boolean;
  zIndex?: number;
  error?: string;
}> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return actionError(FR_MESSAGES.UNAUTHENTICATED);
  }

  // Get max z_index for user's notes
  const { data: maxZData } = await supabase
    .from('notes')
    .select('z_index')
    .eq('created_by', user.id)
    .order('z_index', { ascending: false })
    .limit(1)
    .single();

  const newZIndex = (maxZData?.z_index ?? 0) + 1;

  const { error } = await supabase
    .from('notes')
    .update({ z_index: newZIndex, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('created_by', user.id);

  if (error) {
    console.error('Error bringing note to front:', error);
    return actionError('Erreur lors de la mise au premier plan');
  }

  // No revalidatePath - optimistic UI handles z-index
  return { success: true, zIndex: newZIndex };
}
