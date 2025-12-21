'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { IconChevronDown, IconX, IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';
import { getAssignedLeadsForNotes } from '../lib/actions';

interface Lead {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface NoteLeadPickerProps {
  value: string | null;
  selectedLead?: { id: string; first_name: string | null; last_name: string | null } | null;
  onChange: (leadId: string | null) => void;
  disabled?: boolean;
}

export function NoteLeadPicker({
  value,
  selectedLead,
  onChange,
  disabled = false,
}: NoteLeadPickerProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch assigned leads on mount
  useEffect(() => {
    startTransition(async () => {
      const { leads: fetchedLeads } = await getAssignedLeadsForNotes();
      setLeads(fetchedLeads);
      setIsLoaded(true);
    });
  }, []);

  const getLeadDisplayName = (lead: { first_name: string | null; last_name: string | null }) => {
    const parts = [lead.first_name, lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  // Find the currently selected lead from the list
  const currentLead = value
    ? leads.find((l) => l.id === value) || selectedLead
    : null;

  // Filter leads based on search
  const filteredLeads = search.trim()
    ? leads.filter((lead) => {
        const searchLower = search.toLowerCase();
        const fullName = getLeadDisplayName(lead).toLowerCase();
        const company = (lead.company || '').toLowerCase();
        return fullName.includes(searchLower) || company.includes(searchLower);
      })
    : leads;

  const handleOpen = () => {
    if (disabled || isPending) return;

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setIsOpen(true);
    // Focus input after opening
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearch('');
    setMenuPosition(null);
  };

  const handleSelect = (lead: Lead) => {
    onChange(lead.id);
    handleClose();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setSearch('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) {
      handleOpen();
    }
  };

  // Display value: search when open, selected lead name when closed
  const displayValue = isOpen ? search : (currentLead ? getLeadDisplayName(currentLead) : '');
  const placeholder = isPending && !isLoaded ? 'Chargement...' : 'Rechercher un lead...';

  return (
    <div className="space-y-2">
      <label className="form-label">Lier à un lead</label>

      <div ref={containerRef} className="relative">
        <div
          className={cn(
            'w-full flex items-center gap-2',
            'px-3 py-2.5 text-sm rounded-lg',
            'border border-border bg-white dark:bg-darkgray',
            'hover:border-primary/50 transition-colors',
            isOpen && 'border-primary',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleOpen}
        >
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleOpen}
            placeholder={placeholder}
            disabled={disabled || isPending}
            className={cn(
              'flex-1 bg-transparent outline-none text-sm min-w-0',
              !displayValue && 'placeholder:text-darklink'
            )}
          />
          <div className="flex items-center gap-1 shrink-0">
            {value && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-lightgray dark:hover:bg-dark transition-colors"
                aria-label="Retirer le lead"
              >
                <IconX size={14} className="text-darklink" />
              </span>
            )}
            <IconChevronDown size={16} className={cn('text-darklink transition-transform', isOpen && 'rotate-180')} />
          </div>
        </div>

        {/* Dropdown via portal */}
        {isOpen && menuPosition && createPortal(
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0"
              style={{ zIndex: 9999 }}
              onClick={handleClose}
            />
            {/* Menu */}
            <div
              ref={menuRef}
              className="bg-white dark:bg-dark rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in duration-150"
              style={{
                position: 'fixed',
                top: menuPosition.top,
                left: menuPosition.left,
                minWidth: menuPosition.width,
                zIndex: 10000,
              }}
            >
              <div className="py-2 overflow-y-auto" style={{ maxHeight: '200px' }}>
                {leads.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-darklink text-center">
                    Aucun lead assigné
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-darklink text-center">
                    Aucun résultat
                  </div>
                ) : (
                  filteredLeads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => handleSelect(lead)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left',
                        'text-ld hover:bg-lightgray dark:hover:bg-darkgray transition-colors',
                        value === lead.id && 'bg-primary/10'
                      )}
                    >
                      <IconUser size={16} className="text-darklink shrink-0" />
                      {getLeadDisplayName(lead)}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}
