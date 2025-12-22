import { z } from 'zod';

// Meeting status type
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

// Base meeting type (snake_case to match Supabase response)
export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  scheduled_start: string;
  scheduled_end: string;
  lead_id: string;
  assigned_to: string;
  created_by: string;
  status: MeetingStatus;
  outcome_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Meeting with lead relation (for dashboard widget)
export interface MeetingWithLead extends Meeting {
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// Meeting with full details (for lead detail page)
export interface MeetingWithDetails extends Meeting {
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
  assignee: {
    id: string;
    display_name: string;
  };
}

// Zod schema for create/edit form
export const meetingFormSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Maximum 200 caractères'),
  description: z
    .string()
    .max(2000, 'Maximum 2000 caractères')
    .optional()
    .nullable(),
  location: z
    .string()
    .max(500, 'Maximum 500 caractères')
    .optional()
    .nullable(),
  scheduledStart: z.string().min(1, 'La date de début est requise'),
  scheduledEnd: z.string().min(1, 'La date de fin est requise'),
  leadId: z.string().uuid('Lead invalide'),
});

export type MeetingFormInput = z.infer<typeof meetingFormSchema>;

// Status update schema
export const meetingStatusSchema = z.object({
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']),
  outcomeNotes: z.string().max(2000).optional().nullable(),
});

export type MeetingStatusInput = z.infer<typeof meetingStatusSchema>;
