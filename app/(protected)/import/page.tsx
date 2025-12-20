import { requireAdmin } from '@/modules/auth';
import { PageHeader } from '@/modules/shared';
import { getSalesUsers } from '@/modules/leads';
import { ImportDashboardView } from '@/modules/import/views/import-dashboard-view';
import { getRecentImportJobs } from '@/modules/import/lib/actions';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import - Pulse CRM',
};

interface ImportPageProps {
  searchParams: Promise<{ resume?: string }>;
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  await requireAdmin();

  // Get resume job ID from query params
  const { resume: resumeJobId } = await searchParams;

  // Fetch data in parallel
  const [salesUsers, recentJobsResult] = await Promise.all([
    getSalesUsers(),
    getRecentImportJobs(10),
  ]);

  // Extract jobs data (fallback to empty array on error)
  const initialJobs = recentJobsResult.success && recentJobsResult.data ? recentJobsResult.data.jobs : [];
  const initialTotal = recentJobsResult.success && recentJobsResult.data ? recentJobsResult.data.total : 0;

  return (
    <div>
      <PageHeader
        title="Import de leads"
        description="Gerez vos imports de leads"
      />

      <ImportDashboardView
        salesUsers={salesUsers}
        initialJobs={initialJobs}
        initialTotal={initialTotal}
        resumeJobId={resumeJobId}
      />
    </div>
  );
}
