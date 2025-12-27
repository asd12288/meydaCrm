'use client';

import { useState, useMemo } from 'react';
import { IconChevronDown, IconX, IconSearch } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SearchableSelectProps {
  /** Current selected value */
  value: string | null;
  /** Change handler */
  onChange: (value: string | null) => void;
  /** Options to display */
  options: SearchableSelectOption[];
  /** Placeholder when no value selected */
  placeholder?: string;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Message when no options */
  emptyMessage?: string;
  /** Message when search returns no results */
  noResultsMessage?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Allow clearing selection */
  clearable?: boolean;
  /** Field label */
  label?: string;
  /** Additional className for trigger */
  className?: string;
}

/**
 * Searchable select dropdown using Radix Popover
 * Works reliably inside modals (proper z-index handling)
 */
export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  emptyMessage = 'Aucune option',
  noResultsMessage = 'Aucun résultat',
  isLoading = false,
  loadingMessage = 'Chargement...',
  disabled = false,
  clearable = true,
  label,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Find selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const searchLower = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchLower) ||
        opt.sublabel?.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setSearch('');
  };

  return (
    <div className={className}>
      {label && <label className="form-label">{label}</label>}

      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild disabled={disabled || isLoading}>
          <button
            type="button"
            className={cn(
              'w-full flex items-center gap-2',
              'px-3 py-2.5 text-sm rounded-lg',
              'border border-border bg-white dark:bg-darkgray',
              'hover:border-primary/50 transition-colors',
              'text-left',
              isOpen && 'border-primary ring-1 ring-primary/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className={cn('flex-1 truncate', !selectedOption && 'text-darklink')}>
              {isLoading ? loadingMessage : selectedOption?.label || placeholder}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {value && clearable && !disabled && (
                <span
                  role="button"
                  onClick={handleClear}
                  className="p-1 rounded hover:bg-lightgray dark:hover:bg-dark transition-colors"
                >
                  <IconX size={14} className="text-darklink" />
                </span>
              )}
              <IconChevronDown
                size={16}
                className={cn('text-darklink transition-transform', isOpen && 'rotate-180')}
              />
            </div>
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)] bg-white dark:bg-dark z-[10000]"
          align="start"
          sideOffset={4}
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <IconSearch size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-darklink" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-2 text-sm bg-lightgray dark:bg-darkgray rounded-md outline-none focus:ring-1 focus:ring-primary/50"
                autoFocus
              />
            </div>
          </div>

          {/* Options list */}
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-darklink text-center">
                {emptyMessage}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-darklink text-center">
                {noResultsMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left',
                    'text-ld hover:bg-lightgray dark:hover:bg-darkgray transition-colors',
                    value === option.value && 'bg-primary/10 text-primary'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-xs text-darklink truncate">({option.sublabel})</span>
                  )}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
