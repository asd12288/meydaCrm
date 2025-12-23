import { CardBox, PageHeader, ErrorBoundary, ErrorFallback } from '@/modules/shared';
import { getCurrentUser } from '@/modules/auth';
import { getLeads, getSalesUsers, getUnassignedNewLeadsCount, getLeadsForKanban } from '../lib/actions';
import { leadFiltersSchema } from '../types';
import { LeadFilters } from '../ui/lead-filters';
import { LeadsTable } from '../components/leads-table';
import { LeadsPagination } from '../ui/leads-pagination';
import { UnassignedLeadsBanner } from '../components/unassigned-leads-banner';
import { ViewToggle, type ViewMode } from '../components/view-toggle';
import { LeadsKanbanBoard } from '../components/kanban';
import { KANBAN_PAGE_SIZE } from '../config/constants';

interface LeadsListViewProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function LeadsListView({ searchParams }: LeadsListViewProps) {
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === 'admin';

  // Await and parse search params
  const params = await searchParams;

  // Determine view mode (default to table)
  const viewMode: ViewMode = params.view === 'kanban' ? 'kanban' : 'table';
  const isKanbanView = viewMode === 'kanban';

  // Parse filters from URL params with defaults
  const filters = leadFiltersSchema.parse({
    page: params.page,
    pageSize: isKanbanView ? KANBAN_PAGE_SIZE : params.pageSize,
    search: params.search,
    status: isKanbanView ? undefined : params.status,
    assignedTo: params.assignedTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // Fetch data based on view mode
  // Kanban: only assigned leads with last comments
  // Table: all leads based on filters and RLS
  // Note: salesUsers needed for both admin (bulk assign) and sales (transfer leads)
  const [leadsData, kanbanData, salesUsers, unassignedData] = await Promise.all([
    isKanbanView ? Promise.resolve({ leads: [], page: 1, pageSize: 20, hasMore: false }) : getLeads(filters),
    isKanbanView ? getLeadsForKanban(filters) : Promise.resolve({ leads: [], total: 0 }),
    getSalesUsers(), // Both admin and sales need this (sales for transfer feature)
    isAdmin && !isKanbanView ? getUnassignedNewLeadsCount() : Promise.resolve({ count: 0, leadIds: [] }),
  ]);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Leads"
        description={
          isAdmin ? 'Gérez tous vos leads' : 'Vos leads assignés'
        }
        actions={<ViewToggle currentView={viewMode} />}
      />

      {/* Unassigned new leads banner - admin only (only in table view) */}
      {!isKanbanView && isAdmin && unassignedData.count > 0 && (
        <UnassignedLeadsBanner
          count={unassignedData.count}
          leadIds={unassignedData.leadIds}
          salesUsers={salesUsers}
        />
      )}

      {isKanbanView ? (
        /* Kanban View - Shows only user's assigned leads */
        <div className="mt-4">
          {/* Kanban Board */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <LeadsKanbanBoard leads={kanbanData.leads} />
          </ErrorBoundary>

          {/* Show total count info (only if there are leads) */}
          {kanbanData.leads.length > 0 && (
            <div className="mt-2 text-sm text-darklink text-center">
              {kanbanData.total} lead{kanbanData.total !== 1 ? 's' : ''} assigné{kanbanData.total !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      ) : (
        /* Table View */
        <CardBox>
          {/* Filters */}
          <LeadFilters salesUsers={salesUsers} isAdmin={isAdmin} />

          {/* Table */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <LeadsTable
              leads={leadsData.leads}
              isAdmin={isAdmin}
              salesUsers={salesUsers}
              currentUserId={user?.id}
            />
          </ErrorBoundary>

          {/* Pagination */}
          <LeadsPagination
            page={leadsData.page}
            pageSize={leadsData.pageSize}
            hasMore={leadsData.hasMore}
          />
        </CardBox>
      )}
    </div>
  );
}
