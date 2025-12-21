import { getTickets } from '../lib/actions';
import { ticketFiltersSchema } from '../types';
import { SupportEmailView } from './support-email-view';

interface TicketsListViewProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function TicketsListView({ searchParams }: TicketsListViewProps) {
  // Await and parse search params
  const params = await searchParams;

  // Parse filters from URL params with defaults
  const filters = ticketFiltersSchema.parse({
    page: params.page,
    pageSize: 50, // Larger page size for email-style list
    search: params.search,
    category: params.category,
    status: params.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // Fetch tickets
  const ticketsData = await getTickets(filters);

  return (
    <SupportEmailView
      initialTickets={ticketsData.tickets}
    />
  );
}
