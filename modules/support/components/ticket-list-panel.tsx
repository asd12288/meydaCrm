'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import SimpleBar from 'simplebar-react';
import { IconSearch, IconTicket } from '@tabler/icons-react';
import { TicketListItem } from './ticket-list-item';
import type { SupportTicketWithDetails } from '../types';

const SEARCH_DEBOUNCE_MS = 300;

interface TicketListPanelProps {
  tickets: SupportTicketWithDetails[];
  selectedTicketId: string | null;
  onTicketSelect: (ticket: SupportTicketWithDetails) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export function TicketListPanel({
  tickets,
  selectedTicketId,
  onTicketSelect,
  searchValue,
  onSearchChange,
}: TicketListPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchValue);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchChange(value);
  }, SEARCH_DEBOUNCE_MS);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearch(value);
    debouncedSearch(value);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search header */}
      <div className="shrink-0 p-4 border-b border-ld">
        <div className="relative">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-darklink pointer-events-none"
          />
          <input
            type="text"
            placeholder="Rechercher..."
            value={localSearch}
            onChange={handleSearchChange}
            className="w-full h-10 pl-9 pr-3 text-sm border border-ld rounded-lg bg-white dark:bg-darkgray focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Tickets list */}
      <div className="flex-1 min-h-0">
        {tickets.length === 0 ? (
          <div className="ticket-empty-state h-full">
            <IconTicket size={40} className="ticket-empty-icon" />
            <p className="ticket-empty-title">Aucun ticket</p>
            <p className="ticket-empty-text">
              {searchValue
                ? 'Aucun ticket ne correspond à votre recherche'
                : 'Aucun ticket pour le moment'}
            </p>
          </div>
        ) : (
          <SimpleBar className="h-full">
            {tickets.map((ticket) => (
              <TicketListItem
                key={ticket.id}
                ticket={ticket}
                isSelected={selectedTicketId === ticket.id}
                onClick={() => onTicketSelect(ticket)}
              />
            ))}
          </SimpleBar>
        )}
      </div>
    </div>
  );
}
