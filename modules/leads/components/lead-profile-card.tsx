'use client';

import { useTransition, useOptimistic } from 'react';
import {
  IconMail,
  IconPhone,
  IconBuilding,
  IconBriefcase,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconUser,
  IconChevronDown,
  IconEdit,
  IconId,
} from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import {
  CardBox,
  UserAvatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  useToast,
} from '@/modules/shared';
import { LeadStatusBadge } from '../ui/lead-status-badge';
import { ContactInfoItem } from '../ui/contact-info-item';
import { AddressMapCard } from './address-map-card';
import { assignLead } from '../lib/actions';
import type { LeadWithFullDetails, SalesUser } from '../types';

interface LeadProfileCardProps {
  lead: LeadWithFullDetails;
  isAdmin: boolean;
  salesUsers: SalesUser[];
  onEditClick: () => void;
}

type AssigneeType = { id: string; display_name: string | null } | null;

export function LeadProfileCard({
  lead,
  isAdmin,
  salesUsers,
  onEditClick,
}: LeadProfileCardProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Optimistic assignee state
  const [optimisticAssignee, setOptimisticAssignee] = useOptimistic<AssigneeType>(
    lead.assignee
  );

  // Build display name
  const displayName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ') ||
    lead.email ||
    lead.company ||
    'Lead sans nom';

  // Format address
  const addressParts = [lead.address, lead.city, lead.postal_code, lead.country].filter(Boolean);
  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

  // Format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleAssigneeChange = (userId: string | null) => {
    // Compute new assignee for optimistic update
    const newAssignee: AssigneeType = userId
      ? (() => {
          const user = salesUsers.find((u) => u.id === userId);
          return user ? { id: user.id, display_name: user.display_name } : null;
        })()
      : null;

    startTransition(async () => {
      // Optimistic: update immediately
      setOptimisticAssignee(newAssignee);

      const result = await assignLead(lead.id, userId);
      if (result.error) {
        toast.error(result.error);
        // Revalidation will restore the correct state
      }
    });
  };

  return (
    <CardBox className="h-fit">
      {/* Header Section - Horizontal layout with Avatar + Info */}
      <div className="flex items-start gap-4 pb-4">
        <UserAvatar
          name={displayName}
          size="xxl"
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-ld truncate">{displayName}</h2>
          {lead.company && (
            <p className="text-sm text-darklink truncate mb-2">{lead.company}</p>
          )}
          {/* Status Badge - Larger size */}
          <LeadStatusBadge
            leadId={lead.id}
            status={lead.status}
            statusLabel={lead.status_label}
            size="lg"
          />
        </div>
      </div>

      {/* Assignee (Admin only) */}
      {isAdmin && (
        <div className="flex items-center gap-2 pb-4">
          <span className="text-xs text-darklink">Assigné à:</span>
          <DropdownMenu
            position="bottom-left"
            widthClass="w-56"
            trigger={(isOpen) => (
              <button
                type="button"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm bg-lightgray dark:bg-darkborder hover:bg-lightprimary dark:hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {optimisticAssignee ? (
                  <UserAvatar
                    name={optimisticAssignee.display_name}
                    avatar={salesUsers.find((u) => u.id === optimisticAssignee.id)?.avatar}
                    size="sm"
                  />
                ) : (
                  <IconUser size={14} />
                )}
                {optimisticAssignee?.display_name || 'Non assigné'}
                <IconChevronDown
                  size={14}
                  className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          >
            <DropdownMenuContent maxHeight="300px">
              <DropdownMenuItem
                onClick={() => handleAssigneeChange(null)}
                className={!optimisticAssignee ? 'font-medium bg-lightgray dark:bg-darkborder' : ''}
              >
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <IconUser size={12} />
                  </span>
                  Non assigné
                </span>
              </DropdownMenuItem>
              {salesUsers.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleAssigneeChange(user.id)}
                  className={
                    user.id === optimisticAssignee?.id
                      ? 'font-medium bg-lightgray dark:bg-darkborder'
                      : ''
                  }
                >
                  <span className="flex items-center gap-2">
                    <UserAvatar name={user.display_name} avatar={user.avatar} size="sm" />
                    <span>{user.display_name || user.id.slice(0, 8)}</span>
                    {user.role === 'admin' && (
                      <span className="text-xs text-darklink">(Admin)</span>
                    )}
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Non-admin assignee display */}
      {!isAdmin && lead.assignee && (
        <div className="flex items-center gap-2 pb-4 text-sm">
          <span className="text-darklink">Assigné à:</span>
          <span className="text-ld">{lead.assignee.display_name}</span>
        </div>
      )}

      <div className="profile-divider" />

      {/* Contact Info Section */}
      <div className="space-y-4 py-2">
        <ContactInfoItem
          icon={IconMail}
          label="Email"
          value={lead.email}
          copyable
        />
        <ContactInfoItem
          icon={IconPhone}
          label="Téléphone"
          value={lead.phone}
          copyable
        />
        <ContactInfoItem
          icon={IconBuilding}
          label="Entreprise"
          value={lead.company}
        />
        <ContactInfoItem
          icon={IconBriefcase}
          label="Fonction"
          value={lead.job_title}
        />
        <ContactInfoItem
          icon={IconMapPin}
          label="Adresse"
          value={formattedAddress}
        />
        {/* Address Map */}
        <AddressMapCard
          address={lead.address}
          city={lead.city}
          postalCode={lead.postal_code}
          country={lead.country}
        />
      </div>

      <div className="profile-divider" />

      {/* Metadata Section */}
      <div className="space-y-2 py-2">
        <div className="flex items-center gap-2 text-xs text-darklink">
          <IconCalendar size={14} className="shrink-0" />
          <span>Créé le: {formatDate(lead.created_at)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-darklink">
          <IconClock size={14} className="shrink-0" />
          <span>Modifié le: {formatDate(lead.updated_at)}</span>
        </div>
        {lead.source && (
          <div className="flex items-center gap-2 text-xs text-darklink">
            <IconId size={14} className="shrink-0" />
            <span>Source: {lead.source}</span>
          </div>
        )}
      </div>

      {/* Edit Button */}
      <Button
        type="button"
        variant="primary"
        onClick={onEditClick}
        className="w-full mt-4"
      >
        <IconEdit size={18} />
        Modifier
      </Button>
    </CardBox>
  );
}
