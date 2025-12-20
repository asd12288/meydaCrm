'use client';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  count?: number;
}

export function LoadingSkeleton({
  className = '',
  variant = 'rect',
  count = 1,
}: LoadingSkeletonProps) {
  const baseClass = 'animate-pulse bg-gradient-to-r from-muted via-border to-muted bg-[length:200%_100%]';

  const variantClasses = {
    text: 'h-4 rounded',
    circle: 'rounded-full',
    rect: 'h-12 rounded-lg',
    card: 'h-32 rounded-xl',
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={{
        animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
        animationDelay: `${i * 0.1}s`,
      }}
    />
  ));

  return <>{items}</>;
}

export function FilePreviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="circle" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" className="w-48" />
          <LoadingSkeleton variant="text" className="w-32" />
        </div>
      </div>
      <LoadingSkeleton variant="rect" count={3} className="w-full" />
    </div>
  );
}

export function MappingTableSkeleton() {
  return (
    <div className="space-y-2">
      <LoadingSkeleton variant="text" className="w-full" count={5} />
    </div>
  );
}

export function ProgressStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="text-center space-y-2">
          <LoadingSkeleton variant="text" className="w-16 h-8 mx-auto" />
          <LoadingSkeleton variant="text" className="w-24 mx-auto" />
        </div>
      ))}
    </div>
  );
}
