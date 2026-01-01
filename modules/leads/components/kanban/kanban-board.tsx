'use client';

import { useOptimistic, startTransition } from 'react';
import { IconTableOff } from '@tabler/icons-react';
import {
  KanbanBoard as KanbanBoardPrimitive,
  KanbanBoardProvider,
  KanbanBoardExtraMargin,
} from './board-primitives';
import { useToast } from '@/modules/shared';
import type { LeadForKanban } from '../../types';
import type { LeadStatus } from '@/db/types';
import { KANBAN_COLUMNS } from '../../config/constants';
import { groupLeadsByStatus } from '../../lib/kanban-utils';
import { updateLeadStatus } from '../../lib/actions';
import { KanbanColumn } from './kanban-column';

interface KanbanBoardProps {
  leads: LeadForKanban[];
}

// French screen reader announcements
const frenchAnnouncements = {
  onDragStart() {
    return `Lead sélectionné pour déplacement.`;
  },
  onDragOver(_activeId: string, overId?: string) {
    if (overId) {
      return `Lead survolant la colonne ${overId}.`;
    }
    return `Lead n'est plus sur une colonne.`;
  },
  onDragEnd(_activeId: string, overId?: string) {
    if (overId) {
      return `Lead déplacé vers ${overId}.`;
    }
    return `Lead déposé.`;
  },
  onDragCancel() {
    return `Déplacement annulé.`;
  },
};

const frenchScreenReaderInstructions = `
Pour sélectionner un lead, appuyez sur Espace.
Pendant le déplacement, utilisez les touches fléchées.
Appuyez à nouveau sur Espace pour déposer, ou Échap pour annuler.
`;

export function LeadsKanbanBoard({ leads }: KanbanBoardProps) {
  const { toast } = useToast();

  // Optimistic state for leads - allows instant UI updates
  const [optimisticLeads, setOptimisticLeads] = useOptimistic(
    leads,
    (currentLeads, update: { leadId: string; newStatus: LeadStatus }) => {
      return currentLeads.map((lead) =>
        lead.id === update.leadId
          ? { ...lead, status: update.newStatus }
          : lead
      );
    }
  );

  // Group leads by status for columns
  const groupedLeads = groupLeadsByStatus(optimisticLeads);

  // Handle card drop on a new column
  const handleCardDrop = (leadId: string, newStatus: LeadStatus) => {
    // Find the lead to check if status actually changed
    const lead = optimisticLeads.find((l) => l.id === leadId);
    if (!lead || lead.status === newStatus) return;

    startTransition(async () => {
      // Optimistically update the UI
      setOptimisticLeads({ leadId, newStatus });

      // Call server action
      const result = await updateLeadStatus(leadId, newStatus);
      if (result.error) {
        console.error('Failed to update lead status:', result.error);
        toast.error(result.error);
      }
    });
  };

  // Empty state when user has no assigned leads
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-lightgray dark:bg-darkgray flex items-center justify-center mb-4">
          <IconTableOff size={32} className="text-darklink" />
        </div>
        <h3 className="text-lg font-semibold text-ld mb-2">
          Aucun lead assigné
        </h3>
        <p className="text-sm text-darklink max-w-md">
          Le Kanban affiche uniquement vos leads assignés. 
          Consultez la vue <strong>Tableau</strong> pour voir tous les leads 
          et les assigner à des commerciaux.
        </p>
      </div>
    );
  }

  return (
    <KanbanBoardProvider
      announcements={frenchAnnouncements}
      screenReaderInstructions={frenchScreenReaderInstructions}
    >
      <KanbanBoardPrimitive className="pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            leads={groupedLeads.get(column.status) || []}
            onCardDrop={handleCardDrop}
          />
        ))}
        <KanbanBoardExtraMargin />
      </KanbanBoardPrimitive>
    </KanbanBoardProvider>
  );
}


