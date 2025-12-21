import type { NormalizedProfile } from '@/lib/auth';

// Auth user with profile (normalized to camelCase)
export interface AuthUser {
  id: string;
  email: string;
  profile: NormalizedProfile | null;
}
