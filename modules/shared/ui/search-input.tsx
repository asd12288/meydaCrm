'use client';

import { useState, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { IconSearch, IconX } from '@tabler/icons-react';
import { Button } from './button';
import { Spinner } from './spinner';

export interface SearchInputProps {
  /** Initial/controlled value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when search value changes (debounced) */
  onSearch: (value: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Minimum characters required before searching */
  minLength?: number;
  /** Show loading indicator */
  isLoading?: boolean;
  /** Show clear button when there's text */
  showClearButton?: boolean;
  /** Additional class name for the container */
  className?: string;
  /** Width class for the input container */
  widthClass?: string;
}

const DEFAULT_DEBOUNCE_MS = 300;
const DEFAULT_MIN_LENGTH = 0;

/**
 * Shared search input component with debouncing
 * Used in filter bars across leads, users, tickets, etc.
 */
export function SearchInput({
  value: controlledValue,
  placeholder = 'Rechercher...',
  onSearch,
  debounceMs = DEFAULT_DEBOUNCE_MS,
  minLength = DEFAULT_MIN_LENGTH,
  isLoading = false,
  showClearButton = true,
  className = '',
  widthClass = 'w-64',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(controlledValue || '');
  const displayValue = controlledValue !== undefined ? controlledValue : localValue;

  // Show hint when user types but hasn't reached minimum length
  const showMinLengthHint = minLength > 0 && displayValue.length > 0 && displayValue.length < minLength;

  // Debounced search callback
  const debouncedSearch = useDebouncedCallback((term: string) => {
    // Only trigger search if empty or meets minimum length
    if (term.length === 0 || term.length >= minLength) {
      onSearch(term);
    }
  }, debounceMs);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedSearch(newValue);
    },
    [debouncedSearch]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearch('');
  }, [onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className={`relative ${widthClass}`}>
        {/* Search icon */}
        <IconSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink pointer-events-none"
        />

        {/* Input field */}
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`
            w-full h-10 pl-9 pr-${showClearButton && displayValue ? '9' : '3'} text-sm 
            border rounded-md bg-white dark:bg-darkgray 
            focus:outline-none transition-colors
            ${showMinLengthHint ? 'border-warning focus:border-warning' : 'border-ld focus:border-primary'}
          `}
        />

        {/* Clear button or loading indicator */}
        {isLoading ? (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Spinner size="sm" variant="muted" />
          </div>
        ) : showClearButton && displayValue ? (
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            title="Effacer"
          >
            <IconX size={14} />
          </Button>
        ) : null}
      </div>

      {/* Minimum length hint */}
      {showMinLengthHint && (
        <p className="absolute -bottom-5 left-0 text-xs text-warning">
          Min. {minLength} caractères
        </p>
      )}
    </div>
  );
}
