'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Drawer } from 'flowbite-react';
import { IconPlus } from '@tabler/icons-react';
import { CardBox, PageHeader, useModal } from '@/modules/shared';
import { getCurrentUser } from '@/modules/auth';
import { TicketListPanel } from '../components/ticket-list-panel';
import { TicketDetailPanel } from '../components/ticket-detail-panel';
import { CreateTicketModal } from '../components/create-ticket-modal';
import { getTicket, getTickets } from '../lib/actions';
import type { SupportTicketWithDetails, SupportTicketStatus } from '../types';

interface TicketCounts {
  total: number;
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

interface SupportEmailViewProps {
  initialTickets: SupportTicketWithDetails[];
  initialCounts: TicketCounts;
}

export function SupportEmailView({
  initialTickets,
  initialCounts,
}: SupportEmailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User state
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Tickets state
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>(initialTickets);
  // counts is used to track ticket counts but may not be rendered yet
  const [, setCounts] = useState<TicketCounts>(initialCounts);
  const [statusFilter, setStatusFilter] = useState<SupportTicketStatus | null>(
    (searchParams.get('status') as SupportTicketStatus) || null
  );
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

  // Selected ticket state
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(
    searchParams.get('ticket') || null
  );
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithDetails | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Mobile drawer state
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  // Create modal
  const createModal = useModal();

  // Check user role on mount
  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsAdmin(user?.profile?.role === 'admin');
      setCurrentUserId(user?.profile?.id || null);
    });
  }, []);

  // Load selected ticket details when ID changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    let isMounted = true;

    if (!selectedTicketId) {
      setSelectedTicket(null);
      return;
    }

    setIsLoadingDetail(true);
    getTicket(selectedTicketId)
      .then((ticket) => {
        if (isMounted) {
          setSelectedTicket(ticket);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) {
          setIsLoadingDetail(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedTicketId]);

  // Update URL when selection changes
  const updateUrl = useCallback((ticketId: string | null, status: SupportTicketStatus | null, search: string) => {
    const params = new URLSearchParams();
    if (ticketId) params.set('ticket', ticketId);
    if (status) params.set('status', status);
    if (search) params.set('search', search);

    const newUrl = params.toString() ? `/support?${params.toString()}` : '/support';
    router.replace(newUrl, { scroll: false });
  }, [router]);

  // Handle ticket selection
  const handleTicketSelect = (ticket: SupportTicketWithDetails) => {
    setSelectedTicketId(ticket.id);
    setIsMobileListOpen(false);
    updateUrl(ticket.id, statusFilter, searchValue);
  };

  // Handle status filter change (available for future filter UI)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleStatusFilterChange = async (status: SupportTicketStatus | null) => {
    setStatusFilter(status);
    updateUrl(selectedTicketId, status, searchValue);

    // Refetch tickets with new filter
    try {
      const result = await getTickets({
        page: 1,
        pageSize: 50,
        status: status || undefined,
        search: searchValue || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setTickets(result.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Handle search change
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    updateUrl(selectedTicketId, statusFilter, value);

    // Refetch tickets with new search
    try {
      const result = await getTickets({
        page: 1,
        pageSize: 50,
        status: statusFilter || undefined,
        search: value || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setTickets(result.tickets);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  // Handle ticket update (refresh data)
  const handleTicketUpdate = async () => {
    // Refresh the selected ticket
    if (selectedTicketId) {
      const ticket = await getTicket(selectedTicketId);
      setSelectedTicket(ticket);
    }

    // Refresh the list
    const result = await getTickets({
      page: 1,
      pageSize: 50,
      status: statusFilter || undefined,
      search: searchValue || undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setTickets(result.tickets);

    // Update counts
    const newCounts: TicketCounts = {
      total: result.tickets.length,
      open: result.tickets.filter(t => t.status === 'open').length,
      in_progress: result.tickets.filter(t => t.status === 'in_progress').length,
      resolved: result.tickets.filter(t => t.status === 'resolved').length,
      closed: result.tickets.filter(t => t.status === 'closed').length,
    };
    setCounts(newCounts);
  };

  // Handle create success
  const handleCreateSuccess = () => {
    createModal.close();
    handleTicketUpdate();
  };

  return (
    <div className="min-w-0">
      <PageHeader
        title="Support"
        description="Gérez vos tickets de support"
        actions={
          isAdmin ? (
            <button
              onClick={() => createModal.open()}
              className="btn-primary-action flex items-center gap-2"
            >
              <IconPlus size={18} />
              Nouveau ticket
            </button>
          ) : undefined
        }
      />

      {/* Main split layout */}
      <CardBox className="p-0 overflow-hidden">
        <div className="flex h-[calc(100vh-200px)] min-h-[500px]">
          {/* Left panel - Desktop */}
          <div className="hidden lg:flex lg:flex-col lg:w-[380px] lg:border-r lg:border-ld">
            <TicketListPanel
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              onTicketSelect={handleTicketSelect}
              searchValue={searchValue}
              onSearchChange={handleSearchChange}
            />
          </div>

          {/* Left panel - Mobile Drawer */}
          <Drawer
            open={isMobileListOpen}
            onClose={() => setIsMobileListOpen(false)}
            position="left"
            className="w-[320px] lg:hidden"
          >
            <TicketListPanel
              tickets={tickets}
              selectedTicketId={selectedTicketId}
              onTicketSelect={handleTicketSelect}
              searchValue={searchValue}
              onSearchChange={handleSearchChange}
            />
          </Drawer>

          {/* Right panel - Detail */}
          <div className="flex-1 min-w-0 h-full">
            <TicketDetailPanel
              ticket={selectedTicket}
              isLoading={isLoadingDetail}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              onUpdate={handleTicketUpdate}
              onMobileBack={() => setIsMobileListOpen(true)}
              showMobileBack
            />
          </div>
        </div>
      </CardBox>

      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={createModal.isOpen}
        onClose={createModal.close}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
