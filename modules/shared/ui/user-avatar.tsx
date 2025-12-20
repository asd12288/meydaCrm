'use client';

import Image from 'next/image';
import { getAvatarPath } from '@/lib/constants';

interface UserAvatarProps {
  name: string | null | undefined;
  avatar?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  className?: string;
}

// Generate consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary text-white',
    'bg-secondary text-white',
    'bg-success text-white',
    'bg-warning text-dark',
    'bg-info text-white',
    'bg-purple-500 text-white',
    'bg-pink-500 text-white',
    'bg-teal-500 text-white',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

// Get initials from name (max 2 characters)
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',      // 24px - for very compact spaces
  sm: 'w-8 h-8 text-xs',      // 32px - dropdowns, filters
  md: 'w-10 h-10 text-sm',    // 40px - tables, lists
  lg: 'w-12 h-12 text-base',  // 48px - comments, cards
  xl: 'w-20 h-20 text-xl',    // 80px - profile cards
  xxl: 'w-24 h-24 text-2xl',  // 96px - large profile views
};

const imageSizes = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 80,
  xxl: 96,
};

export function UserAvatar({
  name,
  avatar,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const initials = getInitials(name);
  const colorClass = name ? getAvatarColor(name) : 'bg-gray-400 text-white';

  // If avatar is set, show the image
  if (avatar) {
    return (
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full overflow-hidden shrink-0 bg-lightgray
          ${className}
        `}
        title={name || 'Inconnu'}
      >
        <Image
          src={getAvatarPath(avatar)}
          alt={name || 'Avatar'}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="w-full h-full object-cover"
          unoptimized // Skip optimization for local images
        />
      </div>
    );
  }

  // Fallback to initials
  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClass}
        rounded-full flex items-center justify-center font-medium shrink-0
        ${className}
      `}
      title={name || 'Inconnu'}
    >
      {initials}
    </div>
  );
}
