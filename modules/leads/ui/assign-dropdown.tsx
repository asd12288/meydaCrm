'use client';

import { useState, useRef, useEffect } from 'react';
import { IconChevronDown, IconUserPlus, IconUserOff } from '@tabler/icons-react';
import { UserAvatar } from '@/modules/shared';
import type { SalesUser } from '../types';

interface AssignDropdownProps {
  salesUsers: SalesUser[];
  onAssign: (userId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function AssignDropdown({
  salesUsers,
  onAssign,
  disabled = false,
  className = '',
}: AssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleSelect = (userId: string | null) => {
    onAssign(userId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          h-9 px-3 flex items-center gap-2
          text-sm font-medium rounded-md
          bg-primary text-white
          hover:bg-primaryemphasis transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-primary/30' : ''}
        `}
      >
        <IconUserPlus size={16} />
        <span>Assigner à</span>
        <IconChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 min-w-52 w-max z-50 py-1 bg-white dark:bg-darkgray border border-ld rounded-md shadow-lg dark:shadow-dark-md animate-in fade-in slide-in-from-bottom-1 duration-150">
          {/* Unassign option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="w-full px-3 py-2 flex items-center gap-3 text-sm text-left text-darklink hover:bg-lightgray dark:hover:bg-darkmuted transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
              <IconUserOff size={14} />
            </span>
            <span>Retirer l&apos;assignation</span>
          </button>

          <div className="border-t border-ld my-1" />

          {/* Sales users */}
          {salesUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user.id)}
              className="w-full px-3 py-2 flex items-center gap-3 text-sm text-left text-ld hover:bg-lightgray dark:hover:bg-darkmuted transition-colors"
            >
              <UserAvatar name={user.display_name} avatar={user.avatar} size="sm" />
              <span className="truncate">{user.display_name || 'Sans nom'}</span>
            </button>
          ))}

          {salesUsers.length === 0 && (
            <div className="px-3 py-2 text-sm text-darklink italic">
              Aucun commercial disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
}
