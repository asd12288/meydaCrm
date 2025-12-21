'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { IconSearch, IconX, IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { useClickOutside } from '@/modules/shared/hooks/use-click-outside';
import { Spinner } from '@/modules/shared';
import { searchLeadsForNotes } from '../lib/actions';

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
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Lead[]>([]);
  const [isPending, startTransition] = useTransition();

  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setIsOpen(false), isOpen);

  const handleSearch = useCallback(
    (query: string) => {
      setSearch(query);
      if (query.length < 2) {
        setResults([]);
        return;
      }

      startTransition(async () => {
        const { leads } = await searchLeadsForNotes(query);
        setResults(leads);
      });
    },
    []
  );

  const handleSelect = (lead: Lead) => {
    onChange(lead.id);
    setIsOpen(false);
    setSearch('');
    setResults([]);
  };

  const handleClear = () => {
    onChange(null);
  };

  const getLeadDisplayName = (lead: { first_name: string | null; last_name: string | null }) => {
    const parts = [lead.first_name, lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  return (
    <div className="space-y-2">
      <label className="form-label">Lier à un lead</label>

      {/* Selected lead display */}
      {value && selectedLead ? (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-lightgray dark:bg-darkgray">
          <IconUser size={16} className="text-darklink" />
          <span className="flex-1 text-sm">{getLeadDisplayName(selectedLead)}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-white dark:hover:bg-dark transition-colors"
              aria-label="Retirer le lead"
            >
              <IconX size={14} className="text-darklink" />
            </button>
          )}
        </div>
      ) : (
        /* Search input */
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <IconSearch
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder="Rechercher un lead..."
              disabled={disabled}
              className={cn(
                'w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border',
                'bg-white dark:bg-dark',
                'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            />
            {isPending && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </div>
            )}
          </div>

          {/* Dropdown results */}
          {isOpen && (search.length >= 2 || results.length > 0) && (
            <div className="absolute z-50 w-full mt-1 py-1 bg-white dark:bg-dark border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {results.length === 0 && !isPending ? (
                <div className="px-3 py-2 text-sm text-darklink">
                  {search.length < 2
                    ? 'Tapez au moins 2 caractères'
                    : 'Aucun lead trouvé'}
                </div>
              ) : (
                results.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => handleSelect(lead)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-lightgray dark:hover:bg-darkgray transition-colors"
                  >
                    <div className="font-medium">{getLeadDisplayName(lead)}</div>
                    {lead.company && (
                      <div className="text-xs text-darklink">{lead.company}</div>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
