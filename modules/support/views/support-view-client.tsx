'use client';

import { useState, useEffect } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { CreateTicketModal } from '../components/create-ticket-modal';
import { getCurrentUser } from '@/modules/auth';

interface SupportViewClientProps {
  children: React.ReactNode;
}

export function SupportViewClient({ children }: SupportViewClientProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check if user is admin on mount
  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsAdminUser(user?.profile?.role === 'admin');
    });
  }, []);

  const handleCreateSuccess = () => {
    // Refresh the page to show new ticket
    window.location.reload();
  };

  return (
    <>
      {isAdminUser && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary-action flex items-center gap-2 px-4 py-2"
          >
            <IconPlus size={18} />
            Créer un ticket
          </button>
        </div>
      )}

      {children}

      {isAdminUser && (
        <CreateTicketModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </>
  );
}
