'use client';

import { IconX, IconInfoCircle, IconAlertTriangle, IconCircleCheck, IconSpeakerphone } from '@tabler/icons-react';

export type BannerType = 'info' | 'warning' | 'success' | 'announcement';

export interface SystemBannerProps {
  message: string;
  type?: BannerType;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const bannerStyles: Record<BannerType, { bg: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
    icon: <IconInfoCircle size={18} />,
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    icon: <IconAlertTriangle size={18} />,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950/50 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    icon: <IconCircleCheck size={18} />,
  },
  announcement: {
    bg: 'bg-primary/10 text-primary dark:text-blue-200 border-primary/20',
    icon: <IconSpeakerphone size={18} />,
  },
};

export function SystemBanner({
  message,
  type = 'info',
  dismissible = true,
  onDismiss
}: SystemBannerProps) {
  const style = bannerStyles[type];

  return (
    <div className={`border-b ${style.bg}`}>
      <div className="max-w-400 mx-auto px-4 lg:px-5 xl:px-6">
        <div className="flex items-center justify-between py-2.5 gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="flex-shrink-0">{style.icon}</span>
            <p className="text-sm font-medium truncate">{message}</p>
          </div>
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Fermer"
            >
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
