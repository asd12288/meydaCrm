import { notFound } from 'next/navigation';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { PageHeader } from '@/modules/shared';
import { getCurrentUser } from '@/modules/auth';
import { ROLES } from '@/lib/constants';
import { getLeadById, getSalesUsers } from '../lib/actions';
import { LeadDetailClient } from '../components/lead-detail-client';

interface LeadDetailViewProps {
  leadId: string;
}

export async function LeadDetailView({ leadId }: LeadDetailViewProps) {
  const user = await getCurrentUser();
  const isAdmin = user?.profile?.role === ROLES.ADMIN;

  // Fetch lead data and sales users in parallel
  const [leadResult, salesUsers] = await Promise.all([
    getLeadById(leadId),
    isAdmin ? getSalesUsers() : Promise.resolve([]),
  ]);

  // If lead not found or no access, show 404
  if (!leadResult.lead) {
    notFound();
  }

  const lead = leadResult.lead;

  // Build display name
  const displayName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    lead.email ||
    lead.company ||
    'Lead sans nom';

  return (
    <div className="min-w-0">
      <PageHeader
        title={displayName}
        description={`Lead #${lead.id.slice(0, 8)}`}
        actions={
          <Link
            href="/leads"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-lightgray dark:bg-darkborder text-ld hover:bg-lightprimary dark:hover:bg-primary/20 hover:text-primary transition-colors"
          >
            <IconArrowLeft size={18} />
            <span>Retour à la liste</span>
          </Link>
        }
      />

      <LeadDetailClient
        lead={lead}
        isAdmin={isAdmin}
        salesUsers={salesUsers}
        currentUserId={user?.id || ''}
      />
    </div>
  );
}
