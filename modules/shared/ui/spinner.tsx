type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerVariant = 'primary' | 'secondary' | 'muted' | 'white';
type SpinnerType = 'ring' | 'dots' | 'bars';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  type?: SpinnerType;
  className?: string;
}

// Size mappings for ring spinner
const ringSizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-10 h-10 border-[3px]',
};

// Size mappings for dots spinner (dot size)
const dotSizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
  xl: 'w-3 h-3',
};

// Size mappings for bars spinner (bar dimensions)
const barSizeClasses: Record<SpinnerSize, { bar: string; height: string }> = {
  sm: { bar: 'w-0.5', height: 'h-3' },
  md: { bar: 'w-1', height: 'h-4' },
  lg: { bar: 'w-1', height: 'h-5' },
  xl: { bar: 'w-1.5', height: 'h-6' },
};

// Variant color mappings (background color for dots/bars)
const variantBgClasses: Record<SpinnerVariant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  muted: 'bg-darklink',
  white: 'bg-white',
};

// Variant color mappings (text/border color for ring)
const variantTextClasses: Record<SpinnerVariant, string> = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  muted: 'text-darklink',
  white: 'text-white',
};

// ---------------------------------------------------------
// Ring Spinner: Classic spinning border ring
// ---------------------------------------------------------
function RingSpinner({ size, variant, className }: Omit<SpinnerProps, 'type'>) {
  return (
    <div
      className={`animate-spin rounded-full border-current border-t-transparent ${ringSizeClasses[size!]} ${variantTextClasses[variant!]} ${className}`}
      role="status"
      aria-label="Chargement..."
    >
      <span className="sr-only">Chargement...</span>
    </div>
  );
}

// ---------------------------------------------------------
// Dots Spinner: Three bouncing dots (Slack/Discord style)
// ---------------------------------------------------------
function DotsSpinner({ size, variant, className }: Omit<SpinnerProps, 'type'>) {
  const dotClass = `${dotSizeClasses[size!]} ${variantBgClasses[variant!]} rounded-full`;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      role="status"
      aria-label="Chargement..."
    >
      <span className={`${dotClass} animate-bounce [animation-delay:-0.3s]`} />
      <span className={`${dotClass} animate-bounce [animation-delay:-0.15s]`} />
      <span className={`${dotClass} animate-bounce`} />
      <span className="sr-only">Chargement...</span>
    </span>
  );
}

// ---------------------------------------------------------
// Bars Spinner: Pulsing vertical bars (audio visualizer style)
// ---------------------------------------------------------
function BarsSpinner({ size, variant, className }: Omit<SpinnerProps, 'type'>) {
  const { bar, height } = barSizeClasses[size!];
  const barClass = `${bar} ${variantBgClasses[variant!]} rounded-full`;

  return (
    <span
      className={`inline-flex items-end gap-0.5 ${height} ${className}`}
      role="status"
      aria-label="Chargement..."
    >
      <span className={`${barClass} animate-pulse h-[40%] [animation-delay:0s]`} />
      <span className={`${barClass} animate-pulse h-[70%] [animation-delay:0.1s]`} />
      <span className={`${barClass} animate-pulse h-full [animation-delay:0.2s]`} />
      <span className={`${barClass} animate-pulse h-[70%] [animation-delay:0.3s]`} />
      <span className={`${barClass} animate-pulse h-[40%] [animation-delay:0.4s]`} />
      <span className="sr-only">Chargement...</span>
    </span>
  );
}

// ---------------------------------------------------------
// Main Spinner Component
// ---------------------------------------------------------
export function Spinner({
  size = 'md',
  variant = 'primary',
  type = 'ring',
  className = ''
}: SpinnerProps) {
  switch (type) {
    case 'dots':
      return <DotsSpinner size={size} variant={variant} className={className} />;
    case 'bars':
      return <BarsSpinner size={size} variant={variant} className={className} />;
    case 'ring':
    default:
      return <RingSpinner size={size} variant={variant} className={className} />;
  }
}

// ---------------------------------------------------------
// LoadingState: Centered spinner with optional message
// Use for page/section loading states
// ---------------------------------------------------------
interface LoadingStateProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  type?: SpinnerType;
  message?: string;
  className?: string;
}

export function LoadingState({
  size = 'lg',
  variant = 'primary',
  type = 'ring',
  message,
  className = ''
}: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-4 ${className}`}>
      <Spinner size={size} variant={variant} type={type} />
      {message && <p className="text-sm text-darklink">{message}</p>}
    </div>
  );
}

// ---------------------------------------------------------
// InlineSpinner: Spinner with text for buttons/inline use
// Defaults to 'dots' type for better inline appearance
// ---------------------------------------------------------
interface InlineSpinnerProps {
  size?: 'sm' | 'md';
  variant?: SpinnerVariant;
  type?: SpinnerType;
  children?: React.ReactNode;
  className?: string;
}

export function InlineSpinner({
  size = 'sm',
  variant = 'primary',
  type = 'dots',
  children,
  className = ''
}: InlineSpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Spinner size={size} variant={variant} type={type} />
      {children}
    </span>
  );
}

// Export types for external use
export type { SpinnerSize, SpinnerVariant, SpinnerType, SpinnerProps };
