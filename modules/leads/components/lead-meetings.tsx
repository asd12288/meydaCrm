'use client';

import { useState, useTransition } from 'react';
import {
  IconPlus,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconTrash,
} from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { EmptyState, Modal, ConfirmDialog, useToast } from '@/modules/shared';
import {
  MEETING_STATUS_LABELS,
  MEETING_STATUS_COLORS,
  MeetingForm,
} from '@/modules/meetings';
import { updateMeetingStatus, deleteMeeting } from '@/modules/meetings/lib/actions';
import type { MeetingWithDetails, MeetingStatus } from '@/modules/meetings/types';

interface LeadMeetingsProps {
  leadId: string;
  meetings: MeetingWithDetails[];
}

export function LeadMeetings({ leadId, meetings }: LeadMeetingsProps) {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingWithDetails | null>(
    null
  );
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const now = new Date();

  const upcomingMeetings = meetings.filter(
    (m) => m.status === 'scheduled' && new Date(m.scheduled_start) >= now
  );
  const pastMeetings = meetings.filter(
    (m) => m.status !== 'scheduled' || new Date(m.scheduled_start) < now
  );

  const handleDeleteClick = (meetingId: string) => {
    setDeletingMeetingId(meetingId);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMeetingId || isDeleting) return;

    setIsDeleting(true);
    const result = await deleteMeeting(deletingMeetingId);
    setIsDeleting(false);
    setDeletingMeetingId(null);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rendez-vous supprimé');
    }
  };

  const handleDeleteCancel = () => {
    setDeletingMeetingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h6 className="font-medium text-ld">Rendez-vous</h6>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <IconPlus size={16} />
          Planifier
        </Button>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={<IconCalendar size={48} />}
          title="Aucun rendez-vous"
          description="Planifiez un rendez-vous avec ce lead"
        />
      ) : (
        <>
          {/* Upcoming meetings */}
          {upcomingMeetings.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-darklink uppercase font-medium">
                À venir
              </p>
              {upcomingMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={() => setEditingMeeting(meeting)}
                  onDelete={() => handleDeleteClick(meeting.id)}
                  toast={toast}
                />
              ))}
            </div>
          )}

          {/* Past meetings */}
          {pastMeetings.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-darklink uppercase font-medium">
                Passées
              </p>
              {pastMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  isPast
                  onEdit={() => setEditingMeeting(meeting)}
                  onDelete={() => handleDeleteClick(meeting.id)}
                  toast={toast}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create meeting modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="Planifier un rendez-vous"
      >
        <MeetingForm
          leadId={leadId}
          onSuccess={() => {
            setShowForm(false);
            toast.success('Rendez-vous créé');
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      {/* Edit meeting modal */}
      {editingMeeting && (
        <Modal
          isOpen={!!editingMeeting}
          onClose={() => setEditingMeeting(null)}
          title="Modifier le rendez-vous"
        >
          <MeetingForm
            leadId={leadId}
            meeting={editingMeeting}
            onSuccess={() => {
              setEditingMeeting(null);
              toast.success('Rendez-vous modifié');
            }}
            onCancel={() => setEditingMeeting(null)}
          />
        </Modal>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deletingMeetingId !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Supprimer le rendez-vous"
        message="Êtes-vous sûr de vouloir supprimer ce rendez-vous ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isPending={isDeleting}
      />
    </div>
  );
}

// Toast type from useToast hook
type ToastFunctions = {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
};

// Meeting card subcomponent
function MeetingCard({
  meeting,
  isPast = false,
  onEdit,
  onDelete,
  toast,
}: {
  meeting: MeetingWithDetails;
  isPast?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  toast: ToastFunctions;
}) {
  const [isPending, startTransition] = useTransition();
  const statusColor = MEETING_STATUS_COLORS[meeting.status as MeetingStatus] || 'secondary';

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusChange = (newStatus: MeetingStatus) => {
    startTransition(async () => {
      const result = await updateMeetingStatus(meeting.id, newStatus);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Statut mis à jour');
      }
    });
  };

  const isScheduled = meeting.status === 'scheduled';
  const isUpcoming = isScheduled && new Date(meeting.scheduled_start) >= new Date();

  return (
    <div
      className={`p-3 rounded-lg border border-ld ${isPast ? 'opacity-60' : ''} ${isPending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ld">{meeting.title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-darklink">
            <span className="flex items-center gap-1">
              <IconClock size={14} className="shrink-0" />
              {formatDateTime(meeting.scheduled_start)}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <IconMapPin size={14} className="shrink-0" />
                <span className="truncate max-w-[150px]">{meeting.location}</span>
              </span>
            )}
          </div>
          {meeting.description && (
            <p className="text-sm text-darklink mt-2 line-clamp-2">
              {meeting.description}
            </p>
          )}
        </div>
        <span className={`badge-${statusColor} shrink-0`}>
          {MEETING_STATUS_LABELS[meeting.status as MeetingStatus]}
        </span>
      </div>

      {meeting.outcome_notes && (
        <p className="mt-2 text-sm text-darklink border-t border-ld pt-2 italic">
          {meeting.outcome_notes}
        </p>
      )}

      {/* Action buttons - Edit/Delete for all, status buttons only for upcoming */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-ld">
        {onEdit && (
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={isPending}>
            Modifier
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={isPending}
            className="text-error hover:bg-lighterror"
          >
            <IconTrash size={14} />
            Supprimer
          </Button>
        )}

        {/* Status change buttons ONLY for upcoming scheduled meetings */}
        {isUpcoming && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => handleStatusChange('completed')}
              disabled={isPending}
            >
              <IconCheck size={14} />
              Terminé
            </Button>
            <Button
              size="sm"
              variant="warning"
              onClick={() => handleStatusChange('no_show')}
              disabled={isPending}
            >
              <IconAlertCircle size={14} />
              Absent
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStatusChange('cancelled')}
              disabled={isPending}
            >
              <IconX size={14} />
              Annuler
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
