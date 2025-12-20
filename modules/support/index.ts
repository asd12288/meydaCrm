// Views
export { SupportViewClient } from './views/support-view-client';
export { TicketsListView } from './views/tickets-list-view';
export { SupportEmailView } from './views/support-email-view';

// Components - New email-style UI
export { TicketStatsCards } from './components/ticket-stats-cards';
export { TicketListPanel } from './components/ticket-list-panel';
export { TicketListItem } from './components/ticket-list-item';
export { TicketDetailPanel } from './components/ticket-detail-panel';
export { TicketConversation } from './components/ticket-conversation';
export { TicketReplyInput } from './components/ticket-reply-input';
export { TicketCommentBubble } from './components/ticket-comment-bubble';
export { CreateTicketModal } from './components/create-ticket-modal';

// Components - Legacy (deprecated, will be removed)
export { TicketsTable } from './components/tickets-table';
export { TicketsTableWrapper } from './components/tickets-table-wrapper';
export { TicketDetailModal } from './components/ticket-detail-modal';
export { TicketFilters } from './components/ticket-filters';

// UI
export { TicketCategoryBadge } from './ui/ticket-category-badge';
export { TicketStatusBadge } from './ui/ticket-status-badge';
export { TicketsPagination } from './ui/tickets-pagination';
export { TicketListSkeleton } from './ui/ticket-list-skeleton';
export { TicketDetailSkeleton, TicketEmptyStateSkeleton } from './ui/ticket-detail-skeleton';

// Actions
export {
  createTicket,
  getTickets,
  getTicket,
  getTicketCounts,
  updateTicketStatus,
  addComment,
} from './lib/actions';

// Types
export * from './types';

// Config
export {
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_ICONS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_COLORS,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_OPTIONS,
} from './config/constants';

// Hooks
export { useFilterNavigation } from './hooks/use-filter-navigation';
