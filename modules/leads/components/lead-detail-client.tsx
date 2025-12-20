'use client';

import { useState } from 'react';
import { LeadProfileCard } from './lead-profile-card';
import { LeadActivityTabs } from './lead-activity-tabs';
import { LeadEditModal } from './lead-edit-modal';
import { LeadComments } from './lead-comments';
import { LeadHistory } from './lead-history';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Profile Card */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4">
          <LeadProfileCard
            lead={lead}
            isAdmin={isAdmin}
            salesUsers={salesUsers}
            onEditClick={() => setIsEditModalOpen(true)}
          />
        </div>

        {/* Right Column: Activity Tabs (Comments/History) */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8">
          <div className="h-[calc(100vh-12rem)] min-h-100">
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
              commentCount={lead.comments.length}
              historyCount={lead.history.length}
            />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <LeadEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        lead={lead}
      />
    </>
  );
}
