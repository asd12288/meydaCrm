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
    bg: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent',
    icon: <IconInfoCircle size={18} />,
  },
  warning: {
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent',
    icon: <IconAlertTriangle size={18} />,
  },
  success: {
    bg: 'bg-gradient-to-r from-green-700 to-green-600 text-white border-transparent',
    icon: <IconCircleCheck size={18} />,
  },
  announcement: {
    bg: 'bg-gradient-to-r from-primary to-purple-500 text-white border-transparent',
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
              className="flex-shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
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
