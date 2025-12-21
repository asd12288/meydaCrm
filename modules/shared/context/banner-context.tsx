'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { BannerType } from '../components/system-banner';

export interface Banner {
  id: string;
  message: string;
  type: BannerType;
  dismissible: boolean;
  onDismiss?: () => void;
}

interface BannerContextType {
  banners: Banner[];
  showBanner: (options: {
    message: string;
    type?: BannerType;
    dismissible?: boolean;
    id?: string;
    onDismiss?: () => void;
  }) => string;
  hideBanner: (id: string) => void;
  clearAllBanners: () => void;
}

const BannerContext = createContext<BannerContextType | null>(null);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [banners, setBanners] = useState<Banner[]>([]);

  const showBanner = useCallback(({
    message,
    type = 'info',
    dismissible = true,
    id,
    onDismiss
  }: {
    message: string;
    type?: BannerType;
    dismissible?: boolean;
    id?: string;
    onDismiss?: () => void;
  }) => {
    const bannerId = id || `banner-${Date.now()}`;

    setBanners(prev => {
      // If banner with same ID exists, update it
      const existingIndex = prev.findIndex(b => b.id === bannerId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { id: bannerId, message, type, dismissible, onDismiss };
        return updated;
      }
      // Otherwise add new banner
      return [...prev, { id: bannerId, message, type, dismissible, onDismiss }];
    });

    return bannerId;
  }, []);

  const hideBanner = useCallback((id: string) => {
    setBanners(prev => {
      const banner = prev.find(b => b.id === id);
      if (banner?.onDismiss) {
        banner.onDismiss();
      }
      return prev.filter(b => b.id !== id);
    });
  }, []);

  const clearAllBanners = useCallback(() => {
    setBanners([]);
  }, []);

  return (
    <BannerContext.Provider value={{ banners, showBanner, hideBanner, clearAllBanners }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error('useBanner must be used within a BannerProvider');
  }
  return context;
}
