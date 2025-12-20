'use client';

import { useState, useRef, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useClickOutside } from '../hooks/use-click-outside';

export interface DropdownMenuProps {
  /** Trigger element or render function */
  trigger: ReactNode | ((isOpen: boolean) => ReactNode);
  /** Menu content */
  children: ReactNode;
  /** Dropdown position relative to trigger */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Menu width class */
  widthClass?: string;
  /** Additional class for the container */
  className?: string;
  /** Close on item click */
  closeOnClick?: boolean;
}

const POSITION_CLASSES = {
  'bottom-left': 'top-full left-0 mt-2',
  'bottom-right': 'top-full right-0 mt-2',
  'top-left': 'bottom-full left-0 mb-2',
  'top-right': 'bottom-full right-0 mb-2',
};

/**
 * Generic dropdown menu container
 * Handles open/close state, positioning, and click outside
 */
export function DropdownMenu({
  trigger,
  children,
  position = 'bottom-right',
  widthClass = 'w-56',
  className = '',
  closeOnClick = true,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const handleContentClick = () => {
    if (closeOnClick) {
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          className={`absolute ${POSITION_CLASSES[position]} ${widthClass} z-50 bg-white dark:bg-dark rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}
          onClick={handleContentClick}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// ============ Sub-components ============

export interface DropdownMenuHeaderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dropdown header section with background
 */
export function DropdownMenuHeader({ children, className = '' }: DropdownMenuHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-border bg-lightgray dark:bg-darkgray ${className}`}>
      {children}
    </div>
  );
}

export interface DropdownMenuContentProps {
  children: ReactNode;
  /** Max height with scroll */
  maxHeight?: string;
  className?: string;
}

/**
 * Dropdown content section (scrollable)
 */
export function DropdownMenuContent({
  children,
  maxHeight,
  className = '',
}: DropdownMenuContentProps) {
  return (
    <div
      className={`py-2 ${maxHeight ? `max-h-[${maxHeight}] overflow-y-auto` : ''} ${className}`}
      style={maxHeight ? { maxHeight } : undefined}
    >
      {children}
    </div>
  );
}

export interface DropdownMenuItemProps {
  children: ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Render as link */
  href?: string;
  /** Danger variant (red text) */
  variant?: 'default' | 'danger';
  /** Icon to display */
  icon?: ReactNode;
  /** Disabled state */
  disabled?: boolean;
  className?: string;
}

/**
 * Dropdown menu item (button or link)
 */
export function DropdownMenuItem({
  children,
  onClick,
  href,
  variant = 'default',
  icon,
  disabled = false,
  className = '',
}: DropdownMenuItemProps) {
  const variantClasses = {
    default: 'text-ld hover:bg-lightgray dark:hover:bg-darkgray hover:pl-5',
    danger: 'text-error hover:bg-error/5 hover:pl-5',
  };

  const baseClasses = `
    w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-150 dropdown-item-stagger
    ${variantClasses[variant]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  if (href && !disabled) {
    // Use dynamic import to avoid server/client mismatch
    const Link = require('next/link').default;
    return (
      <Link href={href} className={baseClasses}>
        {icon && <span className="text-darklink">{icon}</span>}
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={baseClasses}
    >
      {icon && <span className={variant === 'danger' ? '' : 'text-darklink'}>{icon}</span>}
      {children}
    </button>
  );
}

export interface DropdownMenuDividerProps {
  className?: string;
}

/**
 * Dropdown menu divider
 */
export function DropdownMenuDivider({ className = '' }: DropdownMenuDividerProps) {
  return <div className={`my-2 border-t border-border ${className}`} />;
}

export interface DropdownMenuFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Dropdown footer section
 */
export function DropdownMenuFooter({ children, className = '' }: DropdownMenuFooterProps) {
  return (
    <div className={`px-4 py-3 border-t border-border ${className}`}>
      {children}
    </div>
  );
}
