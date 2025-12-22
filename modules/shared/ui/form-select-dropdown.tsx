'use client';

import { useState, useRef } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import { useClickOutside } from '../hooks/use-click-outside';

export interface FormSelectDropdownOption {
  value: string;
  label: string;
}

export interface FormSelectDropdownProps {
  /** Field label */
  label: string;
  /** Options to display */
  options: FormSelectDropdownOption[];
  /** Current value */
  value?: string;
  /** Default value (uncontrolled mode) */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Field name (for forms) */
  name?: string;
  /** Additional class for container */
  className?: string;
}

/**
 * Form select with custom dropdown (fully stylable)
 * Use this instead of FormSelect when you need custom dropdown styling
 */
export function FormSelectDropdown({
  label,
  options,
  value: controlledValue,
  defaultValue,
  placeholder = 'Sélectionner...',
  onChange,
  error,
  hint,
  disabled = false,
  name,
  className = '',
}: FormSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use controlled or uncontrolled value
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside or pressing Escape
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const handleSelect = (optionValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      
      <div ref={dropdownRef} className="relative">
        {/* Hidden input for form submission */}
        {name && <input type="hidden" name={name} value={value} />}
        
        {/* Trigger button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full h-[42px] px-3 flex items-center justify-between gap-2
            text-sm text-left border rounded-md
            bg-white dark:bg-darkgray
            transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
            ${isOpen ? 'border-primary ring-1 ring-primary/20' : 'border-ld'}
            ${error ? 'border-error' : ''}
            ${value ? 'text-ld' : 'text-darklink'}
          `}
        >
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
          <IconChevronDown
            size={16}
            className={`text-darklink shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-zinc-900 rounded-lg border border-border dark:border-darkborder shadow-lg overflow-hidden">
            <div className="py-1 max-h-60 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-3 py-2 flex items-center gap-2 text-sm text-left
                      transition-colors
                      ${isSelected
                        ? 'text-primary font-medium bg-lightprimary/50 dark:bg-primary/10'
                        : 'text-ld hover:bg-lightgray dark:hover:bg-darkmuted'
                      }
                    `}
                  >
                    {isSelected ? (
                      <IconCheck size={14} className="text-primary shrink-0" />
                    ) : (
                      <span className="w-3.5 shrink-0" />
                    )}
                    <span className="truncate">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {hint && !error && <p className="form-warning">{hint}</p>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
