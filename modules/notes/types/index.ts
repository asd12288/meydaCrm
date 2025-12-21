import { z } from 'zod';

// Note colors
export const NOTE_COLORS = [
  'yellow',
  'pink',
  'blue',
  'green',
  'purple',
  'orange',
] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

// Zod schemas

// Form schema - for react-hook-form (color and isPinned are required)
export const noteFormSchema = z.object({
  title: z.string().max(200, 'Maximum 200 caractères').optional().nullable(),
  content: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(5000, 'Maximum 5000 caractères'),
  color: z.enum(NOTE_COLORS),
  leadId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean(),
});

// Create schema - for server action (with defaults)
export const noteCreateSchema = z.object({
  title: z.string().max(200, 'Maximum 200 caractères').optional().nullable(),
  content: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(5000, 'Maximum 5000 caractères'),
  color: z.enum(NOTE_COLORS).default('yellow'),
  leadId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().default(false),
});

export const noteUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200, 'Maximum 200 caractères').optional().nullable(),
  content: z
    .string()
    .min(1, 'Le contenu est requis')
    .max(5000, 'Maximum 5000 caractères')
    .optional(),
  color: z.enum(NOTE_COLORS).optional(),
  leadId: z.string().uuid().optional().nullable(),
  isPinned: z.boolean().optional(),
});

// Position schema for drag/resize updates
export const notePositionSchema = z.object({
  id: z.string().uuid(),
  positionX: z.number().int().min(0).optional(),
  positionY: z.number().int().min(0).optional(),
  width: z.number().int().min(150).max(600).optional(),
  height: z.number().int().min(120).max(800).optional(),
  zIndex: z.number().int().optional(),
});

// Default note dimensions
export const NOTE_DEFAULTS = {
  width: 240,
  height: 200,
  minWidth: 150,
  maxWidth: 600,
  minHeight: 120,
  maxHeight: 800,
} as const;

export type NoteFormInput = z.infer<typeof noteFormSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
export type NotePositionInput = z.infer<typeof notePositionSchema>;

// Database types (snake_case from Supabase)
export interface SupabaseNote {
  id: string;
  title: string | null;
  content: string;
  color: NoteColor;
  position: number;
  is_pinned: boolean;
  // Free-form canvas positioning
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  z_index: number;
  // Relations
  lead_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Note with linked lead info
export interface NoteWithLead extends SupabaseNote {
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}
