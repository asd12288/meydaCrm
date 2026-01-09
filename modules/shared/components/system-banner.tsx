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
    bg: 'bg-gradient-to-l from-cyan-700 to-blue-700 text-white border-transparent',
    icon: <IconInfoCircle size={22} />,
  },
  warning: {
    bg: 'bg-gradient-to-l from-orange-600 to-orange-700 text-white border-transparent',
    icon: <IconAlertTriangle size={22} />,
  },
  success: {
    bg: 'bg-gradient-to-l from-green-700 to-green-800 text-white border-transparent',
    icon: <IconCircleCheck size={22} />,
  },
  announcement: {
    bg: 'bg-gradient-to-l from-purple-600 to-purple-800 text-white border-transparent',
    icon: <IconSpeakerphone size={22} />,
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
            <span className="shrink-0">{style.icon}</span>
            <p className="text-sm font-medium truncate drop-shadow-md">{message}</p>
          </div>
          {dismissible && onDismiss && (
            <button
              onClick={onDismiss}
              className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
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
