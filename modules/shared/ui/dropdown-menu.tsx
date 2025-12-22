'use client';

import { useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
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
  /** Z-index class (default: z-50, use z-[100] for modals) */
  zIndexClass?: string;
  /** Tight spacing for select-like dropdowns */
  tight?: boolean;
  /** Use portal to render outside parent (for modals) */
  portal?: boolean;
}

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
  zIndexClass = 'z-50',
  tight = false,
  portal = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Combined ref for click outside detection
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setIsOpen(false), isOpen && !portal);

  // Calculate position for portal mode immediately when opening
  const handleToggle = () => {
    if (!isOpen && portal && triggerRef.current) {
      // Calculate position synchronously before opening
      const rect = triggerRef.current.getBoundingClientRect();
      const gap = tight ? 4 : 8;

      let top = rect.bottom + gap;
      let left = rect.left;

      if (position === 'bottom-right') {
        left = rect.right - rect.width; // Use trigger width initially
      } else if (position === 'top-left' || position === 'top-right') {
        top = rect.top - gap - 200; // Estimate height
        if (position === 'top-right') {
          left = rect.right - rect.width;
        }
      }

      setMenuPosition({ top, left, width: rect.width });
    } else {
      // Reset position when closing
      setMenuPosition(null);
    }
    setIsOpen(!isOpen);
  };

  // Reset position when closing - handled in handleToggle instead of effect
  // to avoid ESLint warning about setState in effect

  const menuContent = (
    <div
      ref={menuRef}
      className={`${widthClass} bg-white dark:bg-dark rounded-xl border border-border shadow-lg overflow-hidden ${portal ? 'animate-in fade-in duration-150' : 'animate-in fade-in slide-in-from-top-2 duration-200'}`}
      style={
        portal && menuPosition
          ? {
              position: 'fixed',
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth: menuPosition.width || 200,
              zIndex: 10000,
              pointerEvents: 'auto',
            }
          : undefined
      }
      onClick={(e) => {
        // Only close if clicking on a menu item (has data-menu-item attribute)
        const target = e.target as HTMLElement;
        if (target.closest('[data-menu-item]') && closeOnClick) {
          setIsOpen(false);
        }
      }}
    >
      {children}
    </div>
  );

  // Non-portal mode: relative positioning
  if (!portal) {
    const positionClasses = {
      'bottom-left': `top-full left-0 ${tight ? 'mt-1' : 'mt-2'}`,
      'bottom-right': `top-full right-0 ${tight ? 'mt-1' : 'mt-2'}`,
      'top-left': `bottom-full left-0 ${tight ? 'mb-1' : 'mb-2'}`,
      'top-right': `bottom-full right-0 ${tight ? 'mb-1' : 'mb-2'}`,
    };

    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div ref={triggerRef} onClick={handleToggle}>
          {typeof trigger === 'function' ? trigger(isOpen) : trigger}
        </div>
        {isOpen && (
          <div className={`absolute ${positionClasses[position]} ${zIndexClass}`}>
            {menuContent}
          </div>
        )}
      </div>
    );
  }

  // Portal mode: fixed positioning via portal with backdrop
  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div ref={triggerRef} onClick={handleToggle}>
        {typeof trigger === 'function' ? trigger(isOpen) : trigger}
      </div>
      {isOpen &&
        menuPosition &&
        createPortal(
          <>
            {/* Invisible backdrop to catch outside clicks */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 9999 }}
              onClick={() => setIsOpen(false)}
            />
            {/* Menu content above backdrop */}
            {menuContent}
          </>,
          document.body
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
      className={`py-2 ${maxHeight ? 'overflow-y-auto' : ''} ${className}`}
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
    return (
      <Link href={href} className={baseClasses} data-menu-item>
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
      data-menu-item
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
