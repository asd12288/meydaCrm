'use client';

import { useState, useRef } from 'react';
import { IconChevronDown, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useClickOutside } from '../hooks/use-click-outside';
import { TEXT_CLASS_TO_CSS_VAR } from '@/lib/constants';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  /** Color class for the icon (e.g., 'text-success', 'text-warning') */
  iconColorClass?: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
  /** Custom render for each option - receives the option and whether it's selected */
  renderOption?: (option: FilterOption, isSelected: boolean) => React.ReactNode;
  /** Custom render for the selected value in the trigger button */
  renderSelected?: (option: FilterOption) => React.ReactNode;
  /** Max width for dropdown menu (default: max-w-72) */
  menuMaxWidth?: string;
  /** Enable scrollable menu when many options (default: false) */
  scrollable?: boolean;
}

export function FilterDropdown({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  className = '',
  renderOption,
  renderSelected,
  menuMaxWidth = 'max-w-72',
  scrollable = false,
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;
  const SelectedIcon = selectedOption?.icon;

  // Close dropdown when clicking outside or pressing escape
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          h-10 min-w-44 px-3 justify-between gap-2
          border-ld bg-white dark:bg-darkgray
          hover:border-primary/50 rounded-md
          ${isOpen ? 'border-primary ring-1 ring-primary/20' : ''}
          ${value ? 'text-ld' : 'text-darklink'}
        `}
      >
        <span className="flex items-center gap-2 truncate">
          {Icon && <Icon size={16} className="text-darklink shrink-0" />}
          {selectedOption && renderSelected ? (
            renderSelected(selectedOption)
          ) : (
            <>
              {SelectedIcon && <SelectedIcon size={14} className="shrink-0" />}
              <span className="truncate">{displayLabel}</span>
            </>
          )}
        </span>
        <IconChevronDown
          size={16}
          className={`text-darklink shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-1 min-w-full w-max ${menuMaxWidth} z-9999 bg-white dark:bg-zinc-900 border border-border dark:border-darkborder rounded-xl shadow-lg dark:shadow-dark-md overflow-hidden`}>
          {/* Clear option - sticky at top */}
          <div className="py-1 border-b border-border dark:border-darkborder">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleSelect('')}
              className={`
                w-full px-3 py-2.5 justify-start gap-2 rounded-none
                hover:bg-lightgray dark:hover:bg-darkmuted hover:pl-5
                transition-all duration-150 dropdown-item-stagger
                ${!value ? 'text-primary font-medium' : 'text-darklink'}
              `}
            >
              {!value && <IconCheck size={14} className="text-primary" />}
              <span className={!value ? '' : 'ml-5'}>{placeholder}</span>
            </Button>
          </div>

          {/* Options - scrollable when many items */}
          <div className={`py-1 ${scrollable ? 'max-h-64 overflow-y-auto' : ''}`}>
            {options.map((option) => {
              const OptionIcon = option.icon;
              const isSelected = option.value === value;
              // Get inline color style for guaranteed color application
              const iconColorStyle = option.iconColorClass
                ? { color: TEXT_CLASS_TO_CSS_VAR[option.iconColorClass] || undefined }
                : undefined;
              // Build hover class for text color on hover
              const hoverColorClass = option.iconColorClass
                ? `hover-${option.iconColorClass}`
                : '';

              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="ghost"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-3 py-2.5 justify-start gap-2 rounded-none
                    hover:bg-lightgray dark:hover:bg-darkmuted hover:pl-5
                    transition-all duration-150 dropdown-item-stagger
                    ${isSelected ? 'text-primary font-medium bg-lightprimary/50 dark:bg-primary/10' : 'text-ld'}
                    ${!isSelected && hoverColorClass ? hoverColorClass : ''}
                  `}
                >
                  {renderOption ? (
                    <>
                      {isSelected && <IconCheck size={14} className="text-primary shrink-0" />}
                      {renderOption(option, isSelected)}
                    </>
                  ) : (
                    <>
                      {isSelected ? (
                        <IconCheck size={14} className="text-primary shrink-0" />
                      ) : OptionIcon ? (
                        <OptionIcon size={14} className="shrink-0" style={iconColorStyle} />
                      ) : (
                        <span className="w-3.5" />
                      )}
                      <span className="truncate">{option.label}</span>
                    </>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
