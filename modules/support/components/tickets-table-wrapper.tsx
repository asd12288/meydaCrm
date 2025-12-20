'use client';

import { useState } from 'react';
import { TicketsTable } from './tickets-table';
import { TicketDetailModal } from './ticket-detail-modal';
import { getTicket } from '../lib/actions';
import type { SupportTicketWithDetails } from '../types';

interface TicketsTableWrapperProps {
  tickets: SupportTicketWithDetails[];
}

export function TicketsTableWrapper({ tickets }: TicketsTableWrapperProps) {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithDetails | null>(null);
  const [ticketDetails, setTicketDetails] = useState<SupportTicketWithDetails | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // Loading state tracked but not shown in UI yet
  const [, setIsLoadingDetails] = useState(false);

  const handleTicketClick = async (ticket: SupportTicketWithDetails) => {
    setSelectedTicket(ticket);
    setIsLoadingDetails(true);
    setIsDetailModalOpen(true);

    // Fetch full ticket details with comments
    const fullTicket = await getTicket(ticket.id);
    if (fullTicket) {
      setTicketDetails(fullTicket);
    }
    setIsLoadingDetails(false);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTicket(null);
    setTicketDetails(null);
  };

  const handleUpdate = () => {
    // Refresh the page to get updated data
    window.location.reload();
  };

  return (
    <>
      <TicketsTable tickets={tickets} onTicketClick={handleTicketClick} />
      <TicketDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
        ticket={ticketDetails || selectedTicket}
        onUpdate={handleUpdate}
      />
    </>
  );
}
