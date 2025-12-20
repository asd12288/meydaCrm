'use client';

import { useEffect, useRef } from 'react';
import { IconX, IconUpload } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import { ImportWizardV2 } from './import-wizard-v2';
import type { SalesUser } from '@/modules/leads/types';

interface ImportWizardCardProps {
  salesUsers: SalesUser[];
  resumeJobId?: string;
  onClose: () => void;
  onComplete?: (importJobId: string) => void;
}

/**
 * Wrapper card for the import wizard
 * Shows the wizard in a CardBox with a close button
 * Auto-scrolls into view when mounted
 */
export function ImportWizardCard({
  salesUsers,
  resumeJobId,
  onClose,
  onComplete,
}: ImportWizardCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Scroll into view when mounted
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleComplete = (importJobId: string) => {
    onComplete?.(importJobId);
    // Close wizard after completion (user will see updated history)
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div ref={cardRef}>
      <CardBox className="border-2 border-primary/20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <IconUpload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ld">
                {resumeJobId ? "Reprendre l'import" : 'Nouvel import'}
              </h3>
              <p className="text-sm text-darklink">
                {resumeJobId
                  ? 'Continuez votre import en cours'
                  : 'Importez des leads depuis un fichier CSV ou Excel'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-darklink hover:text-ld hover:bg-muted rounded-lg transition-colors"
            title="Fermer"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard content */}
        <ImportWizardV2
          salesUsers={salesUsers}
          resumeJobId={resumeJobId}
          onImportComplete={handleComplete}
        />
      </CardBox>
    </div>
  );
}
