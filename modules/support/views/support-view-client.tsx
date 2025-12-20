'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/modules/shared';
import { CreateTicketModal } from '../components/create-ticket-modal';
import { getCurrentUser } from '@/modules/auth';

interface SupportViewClientProps {
  children: React.ReactNode;
}

export function SupportViewClient({ children }: SupportViewClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);

  // Check if user is admin on mount
  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsAdminUser(user?.profile?.role === 'admin');
    });
  }, []);

  const handleCreateSuccess = () => {
    // Close modal and show toast immediately
    setIsCreateModalOpen(false);
    toast.success('Ticket créé avec succès');
    // Soft refresh to show new ticket
    router.refresh();
  };

  return (
    <>
      {isAdminUser && (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <IconPlus size={18} />
            Créer un ticket
          </Button>
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
