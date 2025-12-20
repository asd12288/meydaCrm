// Re-export centralized schemas from lib/validation
export {
  updateProfileSchema,
  changePasswordSchema,
  type UpdateProfileInput,
  type ChangePasswordInput,
} from '@/lib/validation';

// Stats types
export interface LeadStats {
  total: number;
  byStatus: Record<string, number>;
}

export interface AccountStats {
  leads: LeadStats;
  commentsCount: number;
  lastActivity: string | null;
}
