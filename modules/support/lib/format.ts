/**
 * Formatting utilities for the support module
 */

/**
 * Format a date as relative time in French
 * @param dateString - ISO date string or Date object to format
 * @returns Formatted relative time string in French
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (isNaN(diffMs) || diffMs < 0) {
    return 'Date invalide';
  }

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
  const includeYear = diffDays > 365;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: includeYear ? 'numeric' : undefined,
  });
}
