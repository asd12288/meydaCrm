'use client';

import { useState, useCallback } from 'react';
import { IconCopy, IconCheck } from '@tabler/icons-react';

type CopyableTextVariant = 'icon' | 'inline';

interface CopyableTextProps {
  /** The text to display and copy */
  text: string;
  /** Optional custom display content (defaults to text) */
  children?: React.ReactNode;
  /** Additional class names for the container */
  className?: string;
  /**
   * Display variant:
   * - "icon": shows copy icon on hover (default)
   * - "inline": no icon, click text to copy (compact, good for tables)
   */
  variant?: CopyableTextVariant;
  /** Size of the copy icon (default: 14) - only for "icon" variant */
  iconSize?: number;
  /** Duration to show success state in ms (default: 2000) */
  successDuration?: number;
}

/**
 * A reusable component that displays text with copy-to-clipboard functionality.
 *
 * Usage:
 * ```tsx
 * // With icon on hover (default)
 * <CopyableText text="email@example.com" />
 *
 * // Inline - no icon, just click text (compact for tables)
 * <CopyableText text={email} variant="inline" className="text-sm" />
 * ```
 */
export function CopyableText({
  text,
  children,
  className = '',
  variant = 'icon',
  iconSize = 14,
  successDuration = 2000,
}: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), successDuration);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  }, [text, successDuration]);

  if (!text) {
    return <span className={className}>-</span>;
  }

  // Inline variant: clickable text without icon, with popup feedback
  if (variant === 'inline') {
    return (
      <span className="relative inline-block">
        <button
          type="button"
          onClick={handleCopy}
          className={`text-left truncate cursor-pointer hover:text-primary transition-colors ${className}`}
          title="Cliquer pour copier"
          aria-label="Cliquer pour copier"
        >
          {children ?? text}
        </button>
        {/* Floating popup on copy - minimalistic dark theme */}
        <span
          className={`
            absolute -top-9 left-1/2 -translate-x-1/2 z-50
            px-2.5 py-1.5 rounded-md
            bg-gray-800 dark:bg-gray-700 text-white text-xs font-medium
            whitespace-nowrap shadow-lg
            flex items-center gap-1.5
            transition-all duration-300 ease-out
            ${copied
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 translate-y-2 scale-95 pointer-events-none'
            }
          `}
          aria-hidden={!copied}
        >
          <span className={`transition-transform duration-300 ${copied ? 'animate-bounce-once' : ''}`}>
            <IconCheck size={13} strokeWidth={2.5} />
          </span>
          Copié !
          {/* Small arrow pointing down */}
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-700 rotate-45" />
        </span>
      </span>
    );
  }

  // Icon variant: text with copy icon on hover
  return (
    <span className={`group/copy inline-flex items-center gap-1.5 ${className}`}>
      <span className="truncate">{children ?? text}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 transition-opacity p-0.5 rounded hover:bg-lightprimary shrink-0"
        title={copied ? 'Copié !' : 'Copier'}
        aria-label={copied ? 'Copié !' : 'Copier'}
      >
        {copied ? (
          <IconCheck size={iconSize} className="text-success" />
        ) : (
          <IconCopy size={iconSize} className="text-darklink hover:text-primary" />
        )}
      </button>
    </span>
  );
}
