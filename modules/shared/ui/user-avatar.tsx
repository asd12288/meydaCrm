'use client';

interface UserAvatarProps {
  name: string | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
  xl: 'w-16 h-16 text-xl',
};

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const initials = getInitials(name);
  const colorClass = name ? getAvatarColor(name) : 'bg-gray-400 text-white';

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
