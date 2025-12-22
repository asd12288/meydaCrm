import type { MeetingStatus } from '../types';

export const MEETING_STATUSES: Record<MeetingStatus, MeetingStatus> = {
  scheduled: 'scheduled',
  completed: 'completed',
  cancelled: 'cancelled',
  no_show: 'no_show',
} as const;

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  scheduled: 'Planifié',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
};

export const MEETING_STATUS_COLORS: Record<MeetingStatus, string> = {
  scheduled: 'primary',
  completed: 'success',
  cancelled: 'secondary',
  no_show: 'warning',
};

export const MEETING_STATUS_OPTIONS = Object.entries(MEETING_STATUS_LABELS).map(
  ([value, label]) => ({ value, label })
);

// Default meeting duration in minutes
export const DEFAULT_MEETING_DURATION = 60;

// Duration options for the form (in minutes)
export const MEETING_DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 heure' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 heures' },
];

// Field labels for forms (French)
export const MEETING_FIELD_LABELS = {
  title: 'Titre',
  description: 'Description',
  location: 'Lieu / Lien',
  scheduledStart: 'Date et heure',
  duration: 'Durée',
  status: 'Statut',
  outcomeNotes: 'Notes de résultat',
} as const;
