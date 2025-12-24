interface LogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

/**
 * Pulse CRM text logo component
 */
export function Logo({ size = 'md', className = '' }: LogoProps) {
  return (
    <span className={`font-bold text-primary ${sizeClasses[size]} ${className} inline-flex items-center`}>
      <span className="text-[1.3em] -mr-0.5">🎄</span>Pulse<span className="text-darklink font-normal ml-1">CRM</span>
    </span>
  );
}
