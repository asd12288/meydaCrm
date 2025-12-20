'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { IconUserExclamation, IconEye, IconX, IconLoader2 } from '@tabler/icons-react';
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  // Don't render if dismissed or no leads
  if (isDismissed || count === 0) {
    return null;
  }

  const handleViewLeads = () => {
    // Navigate to leads page with filter for new + unassigned
    router.push('/leads?status=new&assignedTo=unassigned');
  };

  const handleAssign = (userIds: string | string[] | null) => {
    if (!userIds || leadIds.length === 0) return;

    // Convert to array for consistent handling
    const assigneeIds = Array.isArray(userIds) ? userIds : [userIds];
    if (assigneeIds.length === 0) return;

    // Reset state
    setError(null);
    setSuccessCount(null);

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
      const errors = results.filter((r) => r.error);
      const totalAssigned = results.reduce((sum, r) => sum + (r.count || 0), 0);

      if (errors.length > 0) {
        setError(
          `Erreur lors de l'assignation de certains leads. ${totalAssigned} leads assignes avec succes.`
        );
      } else {
        setSuccessCount(totalAssigned);
        // Auto-dismiss after success
        setTimeout(() => {
          setIsDismissed(true);
        }, 2000);
      }

      router.refresh();
    });
  };

  return (
    <div
      className={`mb-4 rounded-xl p-5 shadow-sm border-2 transition-colors ${
        isPending
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600'
          : successCount
            ? 'bg-success/10 border-success/30'
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
              : successCount
                ? 'bg-success/20'
                : error
                  ? 'bg-error/20'
                  : 'bg-info/20'
          }`}
        >
          {isPending ? (
            <IconLoader2 size={20} className="text-darklink animate-spin" />
          ) : (
            <IconUserExclamation
              size={20}
              className={
                successCount ? 'text-success' : error ? 'text-error' : 'text-info'
              }
            />
          )}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isPending ? (
            <>
              <h3 className="font-semibold text-ld">Assignation en cours...</h3>
              <p className="text-sm text-darklink mt-0.5">
                Distribution des leads aux commerciaux selectionnes
              </p>
            </>
          ) : successCount ? (
            <>
              <h3 className="font-semibold text-success">
                {successCount} lead{successCount > 1 ? 's' : ''} assigne
                {successCount > 1 ? 's' : ''} avec succes
              </h3>
              <p className="text-sm text-darklink mt-0.5">
                Les leads ont ete distribues aux commerciaux
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
                assigne{count > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-darklink mt-0.5">
                {count > 1
                  ? "Ces leads attendent d'etre assignes a un commercial"
                  : "Ce lead attend d'etre assigne a un commercial"}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!isPending && !successCount && (
            <>
              {/* View leads button */}
              <button
                type="button"
                onClick={handleViewLeads}
                className="h-9 px-4 flex items-center gap-2 text-sm font-medium rounded-md border border-info/30 text-info hover:bg-info/10 transition-colors"
              >
                <IconEye size={16} />
                <span className="hidden sm:inline">Voir les leads</span>
              </button>

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
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            disabled={isPending}
            className="p-2 text-darklink hover:text-error hover:bg-error/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ignorer"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
