'use client';

import Link from 'next/link';
import { IconCalendar, IconClock, IconUser, IconMapPin } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import type { MeetingWithLead } from '@/modules/meetings/types';

interface MeetingsWidgetProps {
  todayMeetings: MeetingWithLead[];
  upcomingMeetings: MeetingWithLead[];
}

export function MeetingsWidget({
  todayMeetings,
  upcomingMeetings,
}: MeetingsWidgetProps) {
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getLeadName = (lead: {
    first_name: string | null;
    last_name: string | null;
  }) => {
    return (
      [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Sans nom'
    );
  };

  // Filter out today's meetings from upcoming to avoid duplicates
  const futureUpcoming = upcomingMeetings.filter(
    (m) => !todayMeetings.find((t) => t.id === m.id)
  );

  return (
    <CardBox>
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title flex items-center gap-2">
          <IconCalendar size={20} className="text-primary" />
          Réunions du jour
        </h5>
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-semibold bg-lightprimary text-primary">
          {todayMeetings.length}
        </span>
      </div>

      {todayMeetings.length === 0 ? (
        <p className="text-darklink text-sm py-4 text-center">
          Aucune réunion aujourd&apos;hui
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {todayMeetings.map((meeting) => (
            <Link
              key={meeting.id}
              href={`/leads/${meeting.lead_id}`}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-hover transition-colors"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-lightprimary text-primary font-semibold text-sm shrink-0">
                {formatTime(meeting.scheduled_start)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ld truncate">{meeting.title}</p>
                <p className="text-sm text-darklink flex items-center gap-1 mt-0.5">
                  <IconUser size={14} className="shrink-0" />
                  <span className="truncate">{getLeadName(meeting.lead)}</span>
                </p>
                {meeting.location && (
                  <p className="text-xs text-darklink flex items-center gap-1 mt-0.5">
                    <IconMapPin size={12} className="shrink-0" />
                    <span className="truncate">{meeting.location}</span>
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {futureUpcoming.length > 0 && (
        <div className="border-t border-ld pt-3 mt-3">
          <p className="text-xs text-darklink uppercase font-medium mb-2">
            Prochaines réunions
          </p>
          <div className="space-y-2">
            {futureUpcoming.slice(0, 3).map((meeting) => (
              <Link
                key={meeting.id}
                href={`/leads/${meeting.lead_id}`}
                className="flex items-center gap-2 text-sm text-darklink hover:text-primary transition-colors"
              >
                <IconClock size={14} className="shrink-0" />
                <span className="shrink-0">{formatDate(meeting.scheduled_start)}</span>
                <span className="truncate">
                  {meeting.title} - {getLeadName(meeting.lead)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </CardBox>
  );
}
