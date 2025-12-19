/**
 * Formatting utilities for the leads module
 */

/**
 * Format a date as relative time in French
 * @param dateString - ISO date string to format
 * @param options - Optional configuration
 * @returns Formatted relative time string in French
 */
export function formatRelativeTime(
  dateString: string,
  options?: { includeYear?: boolean }
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return "à l'instant";
  }
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  }
  if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  }
  if (diffDays < 7) {
    return `il y a ${diffDays}j`;
  }

  // For older dates, show the actual date
  const includeYear = options?.includeYear ?? diffDays > 365;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: includeYear ? 'numeric' : undefined,
  });
}

/**
 * Format a value for display in history/audit logs
 * @param value - Any value to format
 * @returns Formatted string representation
 */
export function formatDisplayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '(vide)';
  }
  return String(value);
}
