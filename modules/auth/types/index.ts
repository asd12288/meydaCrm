import { z } from 'zod';
import type { Profile } from '@/db/types';

// Login form validation schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Identifiant requis'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Auth user with profile
export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// Auth state for context/hooks
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSales: boolean;
}
