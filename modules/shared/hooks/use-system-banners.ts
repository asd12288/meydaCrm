'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getActiveBanners,
  getDismissedBannerIds,
  dismissBanner as dismissBannerAction,
  type SystemBanner,
} from '@/modules/support';

interface UseSystemBannersOptions {
  /** Enable/disable fetching */
  enabled?: boolean;
}

interface UseSystemBannersReturn {
  /** Active banners (filtered by dismissals) */
  banners: SystemBanner[];
  /** Whether currently loading */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Dismiss a banner */
  dismissBanner: (bannerId: string) => Promise<void>;
  /** Refresh banners */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching and managing system banners
 * Fetches banners on mount and filters out dismissed ones
 * Note: Realtime removed - system_banners table not in realtime publication
 */
export function useSystemBanners(options: UseSystemBannersOptions = {}): UseSystemBannersReturn {
  const { enabled = true } = options;

  const [banners, setBanners] = useState<SystemBanner[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch banners and dismissals
  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const [bannersResult, dismissalsResult] = await Promise.all([
        getActiveBanners(),
        getDismissedBannerIds(),
      ]);

      if (bannersResult.error) {
        setError(bannersResult.error);
        return;
      }

      setBanners(bannersResult.banners || []);
      setDismissedIds(new Set(dismissalsResult.dismissedIds || []));
    } catch (err) {
      console.error('Error fetching system banners:', err);
      setError('Erreur lors du chargement des annonces');
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Fetch on mount
  useEffect(() => {
    if (!enabled) return;
    fetchData();
  }, [enabled, fetchData]);

  // Dismiss a banner
  const dismissBanner = useCallback(async (bannerId: string) => {
    // Optimistic update
    setDismissedIds((prev) => new Set([...prev, bannerId]));

    const result = await dismissBannerAction(bannerId);

    if (!result.success) {
      // Revert on error
      setDismissedIds((prev) => {
        const next = new Set(prev);
        next.delete(bannerId);
        return next;
      });
      console.error('Error dismissing banner:', result.error);
    }
  }, []);

  // Filter out dismissed banners
  const visibleBanners = banners.filter((banner) => !dismissedIds.has(banner.id));

  return {
    banners: visibleBanners,
    isLoading,
    error,
    dismissBanner,
    refresh: fetchData,
  };
}
