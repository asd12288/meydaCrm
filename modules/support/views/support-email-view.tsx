'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Drawer } from 'flowbite-react';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { CardBox, PageHeader, useModal, ErrorBoundary, SectionErrorFallback } from '@/modules/shared';
import { getCurrentUser } from '@/modules/auth';
import { TicketListPanel } from '../components/ticket-list-panel';
import { TicketDetailPanel } from '../components/ticket-detail-panel';
import { CreateTicketModal } from '../components/create-ticket-modal';
import { BannerManagement } from '../components/banner-management';
import { getTicket, getTickets } from '../lib/actions';
import type { SupportTicketWithDetails, SupportTicketStatus } from '../types';

const PAGE_SIZE = 20;

interface SupportEmailViewProps {
  initialTickets: SupportTicketWithDetails[];
}

export function SupportEmailView({
  initialTickets,
}: SupportEmailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // User state
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Tickets state with pagination
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>(initialTickets);
  const [currentPage, setCurrentPage] = useState(1);
  const [, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialTickets.length >= PAGE_SIZE);
  const [statusFilter] = useState<SupportTicketStatus | null>(
    (searchParams.get('status') as SupportTicketStatus) || null
  );
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');
  
  // Ref for tracking if component is mounted
  const isMountedRef = useRef(true);

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

  // Check user role on mount and cleanup
  useEffect(() => {
    isMountedRef.current = true;
    getCurrentUser().then((user) => {
      if (isMountedRef.current) {
        setIsAdmin(user?.profile?.role === 'admin');
        setIsDeveloper(user?.profile?.role === 'developer');
        setCurrentUserId(user?.profile?.id || null);
      }
    });
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load more tickets (pagination)
  const loadMoreTickets = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const result = await getTickets({
        page: nextPage,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        search: searchValue || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      if (isMountedRef.current) {
        setTickets((prev) => [...prev, ...result.tickets]);
        setCurrentPage(nextPage);
        setTotalPages(result.totalPages);
        setHasMore(nextPage < result.totalPages);
      }
    } catch (error) {
      console.error('Error loading more tickets:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoadingMore(false);
      }
    }
  }, [isLoadingMore, hasMore, currentPage, statusFilter, searchValue]);

  // Load selected ticket details when ID changes
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

  // Handle search change - reset pagination
  const handleSearchChange = async (value: string) => {
    setSearchValue(value);
    updateUrl(selectedTicketId, statusFilter, value);

    // Reset pagination and refetch tickets with new search
    try {
      const result = await getTickets({
        page: 1,
        pageSize: PAGE_SIZE,
        status: statusFilter || undefined,
        search: value || undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
      setTickets(result.tickets);
      setCurrentPage(1);
      setTotalPages(result.totalPages);
      setHasMore(result.tickets.length >= PAGE_SIZE && result.totalPages > 1);
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

    // Refresh the list - reload current pages worth of data
    const result = await getTickets({
      page: 1,
      pageSize: Math.max(PAGE_SIZE, tickets.length), // Keep current view size
      status: statusFilter || undefined,
      search: searchValue || undefined,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
    setTickets(result.tickets);
    setTotalPages(result.totalPages);
    setHasMore(result.tickets.length < result.total);
  };

  // Handle create success
  const handleCreateSuccess = () => {
    createModal.close();
    handleTicketUpdate();
  };

  return (
    <div className="min-w-0 flex flex-col h-full">
      <PageHeader
        title="Support"
        description="Gérez vos tickets de support"
        actions={
          isAdmin ? (
            <Button
              variant="primary"
              onClick={() => createModal.open()}
            >
              <IconPlus size={18} />
              Nouveau ticket
            </Button>
          ) : undefined
        }
      />

      {/* Developer-only: Banner Management */}
      {isDeveloper && (
        <div className="mb-6">
          <BannerManagement />
        </div>
      )}

      {/* Main split layout */}
      <CardBox className="!p-0 overflow-hidden flex-1">
        <div className="flex flex-row h-[calc(100vh-180px)] min-h-[500px]">
          {/* Left panel - Ticket List (Desktop) */}
          <div className="hidden lg:flex lg:flex-col w-[380px] h-full shrink-0 border-r border-ld">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <TicketListPanel
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onTicketSelect={handleTicketSelect}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onLoadMore={loadMoreTickets}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
            </ErrorBoundary>
          </div>

          {/* Left panel - Mobile Drawer */}
          <Drawer
            open={isMobileListOpen}
            onClose={() => setIsMobileListOpen(false)}
            position="left"
            className="w-[320px] lg:hidden"
          >
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <TicketListPanel
                tickets={tickets}
                selectedTicketId={selectedTicketId}
                onTicketSelect={handleTicketSelect}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onLoadMore={loadMoreTickets}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
              />
            </ErrorBoundary>
          </Drawer>

          {/* Right panel - Detail/Chat */}
          <div className="flex-1 min-w-0 flex flex-col">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <TicketDetailPanel
                ticket={selectedTicket}
                isLoading={isLoadingDetail}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                onUpdate={handleTicketUpdate}
                onMobileBack={() => setIsMobileListOpen(true)}
                showMobileBack
              />
            </ErrorBoundary>
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
