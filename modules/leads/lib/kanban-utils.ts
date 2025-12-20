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
 * Get the column configuration for a status
 */
export function getColumnConfig(status: LeadStatus) {
  return KANBAN_COLUMNS.find((col) => col.status === status);
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

/**
 * Format relative time for kanban card (e.g., "il y a 2h")
 */
export function formatRelativeTime(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "à l'instant";
  if (diffMins < 60) return `il y a ${diffMins}min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays}j`;
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)}sem`;
  return `il y a ${Math.floor(diffDays / 30)}mois`;
}
