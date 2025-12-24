'use client';

import { useFilterNavigation as useSharedFilterNavigation } from '@/modules/shared';

/**
 * Hook for managing URL-based filter navigation in Leads module
 * Uses shared hook with leads-specific defaults
 */
export function useFilterNavigation() {
  return useSharedFilterNavigation({ defaultSort: 'updated_at' });
}
