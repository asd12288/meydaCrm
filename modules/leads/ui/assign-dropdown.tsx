'use client';

import { useState, useRef } from 'react';
import {
  IconChevronDown,
  IconUserPlus,
  IconUserOff,
  IconUsers,
  IconCheck,
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { UserAvatar, useClickOutside } from '@/modules/shared';
import type { SalesUser } from '../types';

interface AssignDropdownProps {
  salesUsers: SalesUser[];
  /** Single select: receives userId or null. Multi-select: receives array of userIds */
  onAssign: (userIds: string | string[] | null) => void;
  disabled?: boolean;
  className?: string;
  /** Dropdown opens up (for bottom bars) or down (for top banners) */
  position?: 'up' | 'down';
  /** Enable multi-select mode with checkboxes */
  enableMultiSelect?: boolean;
  /** Hide the unassign option */
  hideUnassign?: boolean;
}

export function AssignDropdown({
  salesUsers,
  onAssign,
  disabled = false,
  className = '',
  position = 'up',
  enableMultiSelect = false,
  hideUnassign = false,
}: AssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useClickOutside(dropdownRef, () => {
    setIsOpen(false);
    setSelectedUsers(new Set());
  }, isOpen);

  const handleSingleSelect = (userId: string | null) => {
    onAssign(userId);
    setIsOpen(false);
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === salesUsers.length) {
      // Deselect all
      setSelectedUsers(new Set());
    } else {
      // Select all
      setSelectedUsers(new Set(salesUsers.map((u) => u.id)));
    }
  };

  const handleConfirmMultiSelect = () => {
    if (selectedUsers.size > 0) {
      onAssign(Array.from(selectedUsers));
      setIsOpen(false);
      setSelectedUsers(new Set());
    }
  };

  const isAllSelected = salesUsers.length > 0 && selectedUsers.size === salesUsers.length;

  // Position classes
  const positionClasses =
    position === 'up'
      ? 'bottom-full left-0 mb-2 animate-in fade-in slide-in-from-bottom-1'
      : 'top-full left-0 mt-2 animate-in fade-in slide-in-from-top-1';

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger button */}
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={isOpen ? 'ring-2 ring-primary/30' : ''}
      >
        <IconUserPlus size={16} />
        <span>Assigner à</span>
        <IconChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute ${positionClasses} min-w-56 max-w-72 z-50 bg-white dark:bg-darkgray border border-ld rounded-md shadow-lg dark:shadow-dark-md duration-150`}
        >
          {/* Unassign option */}
          {!hideUnassign && !enableMultiSelect && (
            <div className="py-1 border-b border-ld">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleSingleSelect(null)}
                className="w-full px-3 py-2 justify-start gap-3 rounded-none text-darklink hover:bg-lightgray dark:hover:bg-darkmuted"
              >
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                  <IconUserOff size={14} />
                </span>
                <span>Retirer l&apos;assignation</span>
              </Button>
            </div>
          )}

          {/* Multi-select: Select all option */}
          {enableMultiSelect && (
            <div className="py-1 border-b border-ld">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSelectAll}
                className="w-full px-3 py-2 justify-start gap-3 rounded-none text-ld hover:bg-lightgray dark:hover:bg-darkmuted"
              >
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    isAllSelected
                      ? 'bg-primary border-primary text-white'
                      : 'border-border bg-white dark:bg-dark'
                  }`}
                >
                  {isAllSelected && <IconCheck size={14} />}
                </span>
                <IconUsers size={18} className="text-primary" />
                <span className="font-medium">Tous les commerciaux</span>
              </Button>
            </div>
          )}

          {/* Sales users list */}
          <div className="py-1 max-h-64 overflow-y-auto">
            {salesUsers.map((user) => {
              const isSelected = selectedUsers.has(user.id);

              if (enableMultiSelect) {
                return (
                  <Button
                    key={user.id}
                    type="button"
                    variant="ghost"
                    onClick={() => handleToggleUser(user.id)}
                    className="w-full px-3 py-2 justify-start gap-3 rounded-none text-ld hover:bg-lightgray dark:hover:bg-darkmuted"
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary border-primary text-white'
                          : 'border-border bg-white dark:bg-dark'
                      }`}
                    >
                      {isSelected && <IconCheck size={14} />}
                    </span>
                    <UserAvatar name={user.display_name} avatar={user.avatar} size="sm" />
                    <span className="truncate">{user.display_name || 'Sans nom'}</span>
                  </Button>
                );
              }

              return (
                <Button
                  key={user.id}
                  type="button"
                  variant="ghost"
                  onClick={() => handleSingleSelect(user.id)}
                  className="w-full px-3 py-2 justify-start gap-3 rounded-none text-ld hover:bg-lightgray dark:hover:bg-darkmuted"
                >
                  <UserAvatar name={user.display_name} avatar={user.avatar} size="sm" />
                  <span className="truncate">{user.display_name || 'Sans nom'}</span>
                </Button>
              );
            })}

            {salesUsers.length === 0 && (
              <div className="px-3 py-2 text-sm text-darklink italic">
                Aucun commercial disponible
              </div>
            )}
          </div>

          {/* Multi-select: Confirm button */}
          {enableMultiSelect && (
            <div className="p-2 border-t border-ld">
              <Button
                type="button"
                variant="primary"
                onClick={handleConfirmMultiSelect}
                disabled={selectedUsers.size === 0}
                className="w-full"
              >
                <IconCheck size={16} />
                Distribuer à {selectedUsers.size || '...'} commercial
                {selectedUsers.size > 1 ? 'x' : ''}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
