'use client';

import { CopyableText } from '@/modules/shared';

interface ContactInfoItemProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
}

/**
 * Displays a contact information item with an icon, label, and value.
 * Optionally supports copy-to-clipboard functionality.
 */
export function ContactInfoItem({
  icon: Icon,
  label,
  value,
  copyable = false,
}: ContactInfoItemProps) {
  if (!value) return null;

  return (
    <div className="contact-info-row">
      <div className="icon-circle">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-darklink mb-0.5">{label}</p>
        {copyable ? (
          <CopyableText text={value} className="text-sm font-medium text-ld" />
        ) : (
          <p className="text-sm font-medium text-ld truncate">{value}</p>
        )}
      </div>
    </div>
  );
}
