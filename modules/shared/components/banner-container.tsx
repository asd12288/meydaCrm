'use client';

import { useBanner } from '../context/banner-context';
import { useSystemBanners } from '../hooks/use-system-banners';
import { SystemBanner } from './system-banner';
import type { BannerType } from './system-banner';

export function BannerContainer() {
  const { banners: contextBanners, hideBanner } = useBanner();
  const { banners: dbBanners, dismissBanner } = useSystemBanners();

  // Combine context banners and DB banners
  const hasContextBanners = contextBanners.length > 0;
  const hasDbBanners = dbBanners.length > 0;

  if (!hasContextBanners && !hasDbBanners) return null;

  return (
    <div className="sticky top-16 z-20">
      {/* Database-backed system banners (persistent) */}
      {dbBanners.map((banner) => (
        <SystemBanner
          key={`db-${banner.id}`}
          message={banner.message}
          type={banner.type as BannerType}
          dismissible={banner.is_dismissible}
          onDismiss={() => dismissBanner(banner.id)}
        />
      ))}

      {/* Context-based banners (session-only) */}
      {contextBanners.map((banner) => (
        <SystemBanner
          key={`ctx-${banner.id}`}
          message={banner.message}
          type={banner.type}
          dismissible={banner.dismissible}
          onDismiss={() => hideBanner(banner.id)}
        />
      ))}
    </div>
  );
}
