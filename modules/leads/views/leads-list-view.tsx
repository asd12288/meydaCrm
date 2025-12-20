import { CardBox, PageHeader } from '@/modules/shared';
import { getCurrentUser } from '@/modules/auth';
import { getLeads, getSalesUsers, getUnassignedNewLeadsCount } from '../lib/actions';
import { leadFiltersSchema } from '../types';
import { LeadFilters } from '../ui/lead-filters';
import { LeadsTable } from '../components/leads-table';
import { LeadsPagination } from '../ui/leads-pagination';
import { UnassignedLeadsBanner } from '../components/unassigned-leads-banner';

interface LeadsListViewProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function LeadsListView({ searchParams }: LeadsListViewProps) {
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === 'admin';

  // Await and parse search params
  const params = await searchParams;

  // Parse filters from URL params with defaults
  const filters = leadFiltersSchema.parse({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    status: params.status,
    assignedTo: params.assignedTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  // Fetch data in parallel - include unassigned count for admins
  const [leadsData, salesUsers, unassignedData] = await Promise.all([
    getLeads(filters),
    isAdmin ? getSalesUsers() : Promise.resolve([]),
    isAdmin ? getUnassignedNewLeadsCount() : Promise.resolve({ count: 0, leadIds: [] }),
  ]);

  return (
    <div className="min-w-0">
      <PageHeader
        title="Leads"
        description={
          isAdmin ? 'Gerez tous vos leads' : 'Vos leads assignes'
        }
      />

      {/* Unassigned new leads banner - admin only */}
      {isAdmin && unassignedData.count > 0 && (
        <UnassignedLeadsBanner
          count={unassignedData.count}
          leadIds={unassignedData.leadIds}
          salesUsers={salesUsers}
        />
      )}

      <CardBox>
        {/* Filters */}
        <LeadFilters salesUsers={salesUsers} isAdmin={isAdmin} />

        {/* Table */}
        <LeadsTable
          leads={leadsData.leads}
          isAdmin={isAdmin}
          salesUsers={salesUsers}
        />

        {/* Pagination */}
        <LeadsPagination
          total={leadsData.total}
          page={leadsData.page}
          pageSize={leadsData.pageSize}
          totalPages={leadsData.totalPages}
        />
      </CardBox>
    </div>
  );
}
