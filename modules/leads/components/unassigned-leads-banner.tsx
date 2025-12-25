'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconUserExclamation, IconEye, IconX } from '@tabler/icons-react';
import { Button, useFormState, useToast, Spinner } from '@/modules/shared';
import { AssignDropdown } from '../ui/assign-dropdown';
import { bulkAssignLeads } from '../lib/actions';
import type { SalesUser } from '../types';

interface UnassignedLeadsBannerProps {
  count: number;
  leadIds: string[];
  salesUsers: SalesUser[];
}

/**
 * Alert banner showing unassigned "Nouveau" leads count
 * Displayed for admins only when count > 0
 * Provides quick actions to view or bulk-assign these leads
 */
export function UnassignedLeadsBanner({
  count,
  leadIds,
  salesUsers,
}: UnassignedLeadsBannerProps) {
  const router = useRouter();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const { isPending, startTransition, error, setError, resetError } = useFormState();
  const { toast } = useToast();

  // Don't render if dismissed or no leads
  if (isDismissed || count === 0) {
    return null;
  }

  const handleViewLeads = () => {
    setIsNavigating(true);
    // Navigate to leads page with filter for new + unassigned
    router.push('/leads?status=new&assignedTo=unassigned');
  };

  const handleAssign = (userIds: string | string[] | null) => {
    if (!userIds || leadIds.length === 0) return;

    // Convert to array for consistent handling
    const assigneeIds = Array.isArray(userIds) ? userIds : [userIds];
    if (assigneeIds.length === 0) return;

    // Reset state
    resetError();

    startTransition(async () => {
      // Group leads by assignee (round-robin distribution)
      // This batches N leads into M calls (where M = number of assignees)
      // instead of N separate calls
      const leadsByAssignee: Record<string, string[]> = {};

      for (let i = 0; i < leadIds.length; i++) {
        const assigneeId = assigneeIds[i % assigneeIds.length];
        if (!leadsByAssignee[assigneeId]) {
          leadsByAssignee[assigneeId] = [];
        }
        leadsByAssignee[assigneeId].push(leadIds[i]);
      }

      // Execute batched assignments - one call per assignee
      const results = await Promise.all(
        Object.entries(leadsByAssignee).map(([assigneeId, ids]) =>
          bulkAssignLeads(ids, assigneeId)
        )
      );

      // Check for errors
      const errorResults = results.filter((r) => r.error);
      const totalAssigned = results.reduce((sum, r) => sum + (r.count || 0), 0);

      if (errorResults.length > 0) {
        const errorMessages = errorResults.map((r) => r.error).join(', ');
        setError(
          totalAssigned > 0
            ? `${totalAssigned} leads assignés, mais erreurs sur certains : ${errorMessages}`
            : `Erreur d'assignation : ${errorMessages}`
        );
      } else {
        toast.success(
          `${totalAssigned} lead${totalAssigned > 1 ? 's' : ''} assigné${totalAssigned > 1 ? 's' : ''} avec succès`
        );
        setIsDismissed(true);
      }

      router.refresh();
    });
  };

  return (
    <div
      className={`mb-4 rounded-xl p-5 shadow-sm border-2 transition-colors ${
        isPending
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          : error
            ? 'bg-error/10 border-error/30'
            : 'bg-info/10 border-info/30'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <span
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isPending
              ? 'bg-gray-200 dark:bg-gray-700'
              : error
                ? 'bg-error/20'
                : 'bg-info/20'
          }`}
        >
          {isPending ? (
            <Spinner size="md" variant="muted" />
          ) : (
            <IconUserExclamation
              size={20}
              className={error ? 'text-error' : 'text-info'}
            />
          )}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isPending ? (
            <>
              <h3 className="font-semibold text-ld">Assignation en cours...</h3>
              <p className="text-sm text-darklink mt-0.5">
                Distribution des leads aux commerciaux sélectionnés
              </p>
            </>
          ) : error ? (
            <>
              <h3 className="font-semibold text-error">Erreur d&apos;assignation</h3>
              <p className="text-sm text-darklink mt-0.5">{error}</p>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-ld">
                {count} nouveau{count > 1 ? 'x' : ''} lead{count > 1 ? 's' : ''} non
                assigné{count > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-darklink mt-0.5">
                {count > 1
                  ? "Ces leads attendent d'être assignés à un commercial"
                  : "Ce lead attend d'être assigné à un commercial"}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isPending && (
            <>
              {/* View leads button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleViewLeads}
                disabled={isNavigating}
                className="border-info/30 text-info hover:bg-info/10"
              >
                {isNavigating ? (
                  <Spinner size="sm" />
                ) : (
                  <IconEye size={16} />
                )}
                <span className="hidden sm:inline">Voir les leads</span>
              </Button>

              {/* Assign dropdown - with multi-select for distribution */}
              <AssignDropdown
                salesUsers={salesUsers}
                onAssign={handleAssign}
                disabled={isPending}
                position="down"
                enableMultiSelect
                hideUnassign
              />
            </>
          )}

          {/* Dismiss button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsDismissed(true)}
            disabled={isPending}
            className="text-darklink hover:text-error hover:bg-error/10"
            title="Ignorer"
          >
            <IconX size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
}
