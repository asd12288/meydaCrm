'use client';

import { useEffect } from 'react';
import { ErrorBoundary, SectionErrorFallback, useModal } from '@/modules/shared';
import { LeadProfileCard } from './lead-profile-card';
import { LeadActivityTabs } from './lead-activity-tabs';
import { LeadEditModal } from './lead-edit-modal';
import { LeadComments } from './lead-comments';
import { LeadHistory } from './lead-history';
import { LeadMeetings } from './lead-meetings';
import { analytics } from '@/lib/analytics';
import type { LeadWithFullDetails, SalesUser } from '../types';

interface LeadDetailClientProps {
  lead: LeadWithFullDetails;
  isAdmin: boolean;
  salesUsers: SalesUser[];
  currentUserId: string;
}

export function LeadDetailClient({
  lead,
  isAdmin,
  salesUsers,
  currentUserId,
}: LeadDetailClientProps) {
  const editModal = useModal();

  // Track lead view on mount
  useEffect(() => {
    analytics.leadViewed({ leadId: lead.id, status: lead.status });
  }, [lead.id, lead.status]);

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Profile Card */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <ErrorBoundary FallbackComponent={SectionErrorFallback}>
            <LeadProfileCard
              lead={lead}
              isAdmin={isAdmin}
              salesUsers={salesUsers}
              onEditClick={() => editModal.open()}
            />
          </ErrorBoundary>
        </div>

        {/* Right Column: Activity Tabs (Comments/History) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="h-[calc(100vh-12rem)] min-h-100">
            <ErrorBoundary FallbackComponent={SectionErrorFallback}>
              <LeadActivityTabs
                commentsContent={
                  <LeadComments
                    leadId={lead.id}
                    comments={lead.comments}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                  />
                }
                historyContent={
                  <div className="p-4 overflow-y-auto h-full">
                    <LeadHistory history={lead.history} />
                  </div>
                }
                meetingsContent={
                  <div className="p-4 overflow-y-auto h-full">
                    <LeadMeetings leadId={lead.id} meetings={lead.meetings} />
                  </div>
                }
                commentCount={lead.comments.length}
                historyCount={lead.history.length}
                meetingsCount={lead.meetings.length}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <LeadEditModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        lead={lead}
      />
    </>
  );
}
