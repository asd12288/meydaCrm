'use client';

import { useFilterNavigation as useSharedFilterNavigation } from '@/modules/shared';

/**
 * Hook for managing URL-based filter navigation in Users module
 * Uses shared hook with users-specific defaults
 */
export function useFilterNavigation() {
  return useSharedFilterNavigation({ defaultSort: 'created_at' });
}


