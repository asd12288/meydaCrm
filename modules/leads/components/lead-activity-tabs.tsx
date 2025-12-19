'use client';

import { useState } from 'react';
import { IconMessage, IconHistory } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';

interface LeadActivityTabsProps {
  commentsContent: React.ReactNode;
  historyContent: React.ReactNode;
  commentCount: number;
  historyCount: number;
}

export function LeadActivityTabs({
  commentsContent,
  historyContent,
  commentCount,
  historyCount,
}: LeadActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');

  return (
    <CardBox className="h-full flex flex-col overflow-hidden p-0">
      {/* Tab Headers */}
      <div className="flex border-b border-ld shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`tab-button ${activeTab === 'comments' ? 'tab-button-active' : ''}`}
        >
          <IconMessage size={18} />
          <span>Commentaires</span>
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium bg-lightprimary text-primary">
            {commentCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`tab-button ${activeTab === 'history' ? 'tab-button-active' : ''}`}
        >
          <IconHistory size={18} />
          <span>Historique</span>
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-medium bg-lightsecondary text-secondary">
            {historyCount}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'comments' ? commentsContent : historyContent}
      </div>
    </CardBox>
  );
}
