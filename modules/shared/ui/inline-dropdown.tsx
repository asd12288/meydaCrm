/**
 * Inline Dropdown Component
 *
 * Compact custom dropdown for table rows and inline selections (not native select)
 * Supports both flat options and grouped options
 */

'use client';

import { useState, useRef } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import { useClickOutside } from '../hooks/use-click-outside';

// =============================================================================
// TYPES
// =============================================================================

export interface InlineDropdownOption {
  value: string;
  label: string;
}

export interface InlineDropdownOptionGroup {
  label: string;
  options: InlineDropdownOption[];
}

interface InlineDropdownProps {
  /** Flat options */
  options?: InlineDropdownOption[];
  /** Grouped options (alternative to flat options) */
  groups?: InlineDropdownOptionGroup[];
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Width class */
  widthClass?: string;
  /** Placeholder when no value */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md';
}

// =============================================================================
// COMPONENT
// =============================================================================

export function InlineDropdown({
  options,
  groups,
  value,
  onChange,
  widthClass = 'w-28',
  placeholder = 'Sélectionner',
  size = 'sm',
}: InlineDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all options flattened for finding selected label
  const allOptions = options || groups?.flatMap((g) => g.options) || [];
  const selectedOption = allOptions.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const sizeClasses = size === 'sm'
    ? 'h-7 px-2 text-xs'
    : 'h-8 px-3 text-sm';

  const optionSizeClasses = size === 'sm'
    ? 'px-2 py-1.5 text-xs'
    : 'px-3 py-2 text-sm';

  return (
    <div ref={dropdownRef} className={`relative ${widthClass}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full ${sizeClasses} flex items-center justify-between gap-1
          text-left border rounded-md
          bg-white dark:bg-darkgray
          transition-colors cursor-pointer
          hover:border-primary/50
          ${isOpen ? 'border-primary ring-1 ring-primary/20' : 'border-ld'}
          ${value ? 'text-ld' : 'text-darklink'}
        `}
      >
        <span className="truncate">{displayLabel}</span>
        <IconChevronDown
          size={size === 'sm' ? 12 : 14}
          className={`text-darklink shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-9999 min-w-full w-max bg-white dark:bg-zinc-900 border border-border dark:border-darkborder rounded-lg shadow-lg overflow-hidden">
          {/* Flat options */}
          {options && (
            <div className="py-1 max-h-48 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full ${optionSizeClasses} flex items-center gap-1.5 text-left
                      transition-colors
                      ${isSelected
                        ? 'text-primary font-medium bg-lightprimary/50 dark:bg-primary/10'
                        : 'text-ld hover:bg-lightgray dark:hover:bg-darkmuted'
                      }
                    `}
                  >
                    {isSelected ? (
                      <IconCheck size={size === 'sm' ? 12 : 14} className="text-primary shrink-0" />
                    ) : (
                      <span className={size === 'sm' ? 'w-3' : 'w-3.5'} />
                    )}
                    <span className="whitespace-nowrap">{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Grouped options */}
          {groups && (
            <div className="py-1 max-h-64 overflow-y-auto">
              {groups.map((group, groupIndex) => (
                <div key={group.label || `group-${groupIndex}`}>
                  {/* Group header - only show if label exists */}
                  {group.label && (
                    <div className="px-2 py-1 text-[10px] font-semibold text-darklink uppercase tracking-wide bg-lightgray/50 dark:bg-darkgray/50">
                      {group.label}
                    </div>
                  )}
                  {/* Group options */}
                  {group.options.map((option) => {
                    const isSelected = option.value === value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelect(option.value)}
                        className={`
                          w-full ${optionSizeClasses} flex items-center gap-1.5 text-left
                          transition-colors
                          ${isSelected
                            ? 'text-primary font-medium bg-lightprimary/50 dark:bg-primary/10'
                            : 'text-ld hover:bg-lightgray dark:hover:bg-darkmuted'
                          }
                        `}
                      >
                        {isSelected ? (
                          <IconCheck size={size === 'sm' ? 12 : 14} className="text-primary shrink-0" />
                        ) : (
                          <span className={size === 'sm' ? 'w-3' : 'w-3.5'} />
                        )}
                        <span className="whitespace-nowrap">{option.label}</span>
                      </button>
                    );
                  })}
                  {/* Separator between groups */}
                  {groupIndex < groups.length - 1 && group.label && (
                    <div className="my-1 border-t border-border dark:border-darkborder" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
