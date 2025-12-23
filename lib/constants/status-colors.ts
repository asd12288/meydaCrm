/**
 * Centralized status color constants (DRY)
 * Single source of truth for all status-related color mappings
 *
 * Used across: leads module, dashboard, filters, kanban, charts
 */

import type { LeadStatus } from '@/db/types';

/**
 * Main status to badge class mapping
 * Each active status has a unique color for easy differentiation
 */
export const STATUS_BADGE_CLASSES: Record<LeadStatus, string> = {
  // Active statuses (10 DISTINCT colors - maximum visual separation)
  new: 'badge-indigo', // Indigo - Fresh, exciting opportunity
  rdv: 'badge-darkblue', // Dark blue - Meeting scheduled (achievement!)
  no_answer_1: 'badge-sky', // Sky blue - Calm "try again" (light, hopeful)
  no_answer_2: 'badge-slate', // Slate gray - Patient, neutral second attempt
  wrong_number: 'badge-gray', // Dark gray - Closed, move on
  not_interested: 'badge-rose', // Rose pink - Rejection (softer than red)
  deposit: 'badge-deposit', // Solid success green - Money/celebration!
  callback: 'badge-orange', // Orange - Scheduled callback
  relance: 'badge-primary', // Blue - Professional follow-up
  mail: 'badge-fuchsia', // Fuchsia pink - Communication (distinct from purple)
  // Legacy statuses (keeping for backwards compatibility)
  contacted: 'badge-sky',
  qualified: 'badge-warning',
  proposal: 'badge-warning',
  negotiation: 'badge-orange',
  won: 'badge-gold',
  lost: 'badge-rose',
  no_answer: 'badge-orange',
};

/**
 * Badge class to CSS variable mapping
 * Used for inline styles when CSS classes can't be applied
 */
export const BADGE_TO_CSS_VAR: Record<string, string> = {
  'badge-success': 'var(--color-success)',
  'badge-warning': 'var(--color-warning)',
  'badge-error': 'var(--color-error)',
  'badge-info': 'var(--color-info)',
  'badge-primary': 'var(--color-primary)',
  'badge-secondary': 'var(--color-secondary)',
  // Extended colors for unique status differentiation
  'badge-indigo': 'var(--color-indigo)',
  'badge-orange': 'var(--color-orange)',
  'badge-gray': 'var(--color-gray)',
  'badge-emerald': 'var(--color-emerald)',
  'badge-cyan': 'var(--color-cyan)',
  'badge-purple': 'var(--color-purple)',
  // NEW distinct colors
  'badge-teal': '#14b8a6',
  'badge-deposit': '#16a34a',
  'badge-sky': '#0ea5e9',
  'badge-slate': '#64748b',
  'badge-rose': '#f43f5e',
  'badge-fuchsia': '#d946ef',
  'badge-darkblue': '#1e40af',
};

/**
 * Badge class to text color class mapping
 * Used for filter dropdowns and other text-based status indicators
 */
export const BADGE_TO_TEXT_CLASS: Record<string, string> = {
  'badge-success': 'text-success',
  'badge-warning': 'text-warning',
  'badge-error': 'text-error',
  'badge-info': 'text-info',
  'badge-primary': 'text-primary',
  'badge-secondary': 'text-secondary',
  // Extended colors
  'badge-indigo': 'text-indigo',
  'badge-orange': 'text-orange',
  'badge-gray': 'text-gray-status',
  'badge-emerald': 'text-emerald',
  'badge-cyan': 'text-cyan',
  'badge-purple': 'text-purple',
  // NEW distinct colors
  'badge-teal': 'text-teal',
  'badge-deposit': 'text-deposit',
  'badge-sky': 'text-sky',
  'badge-slate': 'text-slate',
  'badge-rose': 'text-rose',
  'badge-fuchsia': 'text-fuchsia',
  'badge-darkblue': 'text-darkblue',
};

/**
 * Text color class to CSS variable mapping
 * Used for inline icon styles in dropdowns
 */
export const TEXT_CLASS_TO_CSS_VAR: Record<string, string> = {
  'text-success': 'var(--color-success)',
  'text-warning': 'var(--color-warning)',
  'text-error': 'var(--color-error)',
  'text-info': 'var(--color-info)',
  'text-primary': 'var(--color-primary)',
  'text-secondary': 'var(--color-secondary)',
  // Extended colors
  'text-indigo': 'var(--color-indigo)',
  'text-orange': 'var(--color-orange)',
  'text-gray-status': 'var(--color-gray)',
  'text-emerald': 'var(--color-emerald)',
  'text-cyan': 'var(--color-cyan)',
  'text-purple': 'var(--color-purple)',
  // NEW distinct colors
  'text-teal': '#14b8a6',
  'text-deposit': '#16a34a',
  'text-sky': '#0ea5e9',
  'text-slate': '#64748b',
  'text-rose': '#f43f5e',
  'text-fuchsia': '#d946ef',
  'text-darkblue': '#1e40af',
};

/**
 * Status to chart color mapping (hex values for ApexCharts)
 * Derived from CSS variables for consistency
 */
export const STATUS_CHART_COLORS: Record<string, string> = {
  // 10 DISTINCT colors - maximum visual separation
  new: '#6366f1', // Indigo (blue-violet)
  rdv: '#1e40af', // Dark blue
  no_answer_1: '#0ea5e9', // Sky blue (light, hopeful)
  no_answer_2: '#64748b', // Slate gray (neutral)
  wrong_number: '#52525b', // Zinc (dark gray)
  not_interested: '#f43f5e', // Rose (softer pink-red)
  deposit: '#16a34a', // Solid success green
  callback: '#f97316', // Orange (warm, inviting)
  relance: '#3b82f6', // Blue (primary)
  mail: '#d946ef', // Fuchsia (bright pink)
  // Legacy
  contacted: '#0ea5e9', // Sky
  qualified: '#eab308', // Warning
  proposal: '#eab308', // Warning
  negotiation: '#f97316', // Orange
  won: '#f59e0b', // Gold
  lost: '#f43f5e', // Rose
  no_answer: '#f97316', // Orange
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get the badge class for a status
 */
export function getStatusBadgeClass(status: string): string {
  return STATUS_BADGE_CLASSES[status as LeadStatus] || 'badge-secondary';
}

/**
 * Get the CSS variable for a status (for inline styles)
 */
export function getStatusCssVar(status: string): string {
  const badgeClass = getStatusBadgeClass(status);
  return BADGE_TO_CSS_VAR[badgeClass] || 'var(--color-secondary)';
}

/**
 * Get the text color class for a status
 */
export function getStatusTextClass(status: string): string {
  const badgeClass = getStatusBadgeClass(status);
  return BADGE_TO_TEXT_CLASS[badgeClass] || 'text-secondary';
}

/**
 * Get the chart color (hex) for a status
 */
export function getStatusChartColor(status: string): string {
  return STATUS_CHART_COLORS[status] || '#8965e5';
}

/**
 * Get CSS variable from text class (for inline icon styles)
 */
export function getTextClassCssVar(textClass: string): string | undefined {
  return TEXT_CLASS_TO_CSS_VAR[textClass];
}
