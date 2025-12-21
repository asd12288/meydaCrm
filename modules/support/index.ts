// Views
export { TicketsListView } from './views/tickets-list-view';
export { SupportEmailView } from './views/support-email-view';

// Components - Email-style UI
export { TicketListPanel } from './components/ticket-list-panel';
export { TicketListItem } from './components/ticket-list-item';
export { TicketDetailPanel } from './components/ticket-detail-panel';
export { TicketConversation } from './components/ticket-conversation';
export { TicketReplyInput } from './components/ticket-reply-input';
export { TicketCommentBubble } from './components/ticket-comment-bubble';
export { CreateTicketModal } from './components/create-ticket-modal';

// Banner Management (Developer only)
export { BannerManagement } from './components/banner-management';
export { CreateBannerModal } from './components/create-banner-modal';
export { EditBannerModal } from './components/edit-banner-modal';

// UI
export { TicketCategoryBadge } from './ui/ticket-category-badge';
export { TicketStatusBadge } from './ui/ticket-status-badge';
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

// Banner Actions
export {
  createBanner,
  updateBanner,
  toggleBannerActive,
  deleteBanner,
  getAllBanners,
  getActiveBanners,
  getDismissedBannerIds,
  dismissBanner,
  type SystemBanner,
  type BannerType,
  type BannerTarget,
} from './lib/banner-actions';

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
