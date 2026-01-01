import type { LeadStatus } from '@/db/types';
import type { LeadForKanban } from '../types';
import { KANBAN_COLUMNS } from '../config/constants';

/**
 * Groups leads by their status for kanban board display
 * Returns a Map with status as key and array of leads as value
 */
export function groupLeadsByStatus(
  leads: LeadForKanban[]
): Map<LeadStatus, LeadForKanban[]> {
  const grouped = new Map<LeadStatus, LeadForKanban[]>();

  // Initialize all columns with empty arrays (ensures column order)
  for (const column of KANBAN_COLUMNS) {
    grouped.set(column.status, []);
  }

  // Group leads into their respective columns
  for (const lead of leads) {
    const status = lead.status as LeadStatus;
    const existing = grouped.get(status);
    if (existing) {
      existing.push(lead);
    }
    // If status doesn't match any column, skip it (legacy statuses)
  }

  return grouped;
}

/**
 * Format lead name for display on kanban card
 */
export function formatLeadName(lead: LeadForKanban): string {
  const firstName = lead.first_name || '';
  const lastName = lead.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Sans nom';
}


