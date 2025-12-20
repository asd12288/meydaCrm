import type { ReactNode } from 'react';

export interface FormSectionProps {
  /** Section title */
  title: string;
  /** Number of columns in grid layout (1 or 2) */
  columns?: 1 | 2;
  /** Children content */
  children: ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * Reusable form section with title and grid layout
 * Used for grouping related form fields
 */
export function FormSection({
  title,
  columns = 2,
  children,
  className = '',
}: FormSectionProps) {
  const gridClass = columns === 1
    ? 'grid grid-cols-1 gap-4'
    : 'grid grid-cols-1 md:grid-cols-2 gap-4';

  return (
    <div className={className}>
      <h4 className="card-subtitle mb-4">{title}</h4>
      <div className={gridClass}>{children}</div>
    </div>
  );
}
