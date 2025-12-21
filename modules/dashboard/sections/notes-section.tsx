import Link from 'next/link';
import { IconNote, IconChevronRight, IconUser } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import { getRecentNotes } from '@/modules/notes/lib/actions';
import { getNoteColorClasses } from '@/modules/notes/config/constants';
import type { NoteWithLead } from '@/modules/notes/types';

/**
 * Mini note card for dashboard widget
 * Compact display with color, title/content preview, and linked lead
 */
function MiniNoteCard({ note }: { note: NoteWithLead }) {
  const colorClasses = getNoteColorClasses(note.color);

  const getLeadDisplayName = () => {
    if (!note.lead) return null;
    const parts = [note.lead.first_name, note.lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  const getPreview = () => {
    if (note.title) return note.title;
    // Strip markdown and truncate
    const plainText = note.content.replace(/[#*_~`]/g, '').trim();
    return plainText.length > 50 ? plainText.slice(0, 50) + '...' : plainText;
  };

  return (
    <Link
      href="/notes"
      className={`block rounded-lg border-2 p-3 transition-all hover:shadow-md ${colorClasses.bg} ${colorClasses.border}`}
    >
      <p className="text-sm font-medium text-ld line-clamp-2 mb-2">
        {getPreview()}
      </p>
      <div className="flex items-center justify-between text-xs text-darklink">
        {note.lead ? (
          <span className="flex items-center gap-1">
            <IconUser size={12} />
            {getLeadDisplayName()}
          </span>
        ) : (
          <span />
        )}
        <span>
          {new Date(note.updated_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </Link>
  );
}

/**
 * Empty state when user has no notes
 */
function EmptyNotesState() {
  return (
    <div className="text-center py-8">
      <IconNote size={40} className="mx-auto text-darklink mb-3" stroke={1.5} />
      <p className="text-darklink text-sm mb-3">Aucune note pour le moment</p>
      <Link
        href="/notes"
        className="text-primary text-sm font-medium hover:underline"
      >
        Créer une note
      </Link>
    </div>
  );
}

/**
 * Async server component for sales notes widget
 * Shows 4 most recent notes with link to notes page
 * Wrapped in Suspense for streaming
 */
export async function SalesNotesSection() {
  const { notes, error } = await getRecentNotes(4);

  if (error) {
    return (
      <CardBox>
        <div className="text-center py-8 text-error">
          <p>{error}</p>
        </div>
      </CardBox>
    );
  }

  return (
    <CardBox>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="card-title flex items-center gap-2">
          <IconNote size={20} className="text-primary" />
          Mes notes
        </h4>
        <Link
          href="/notes"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Voir tout
          <IconChevronRight size={16} />
        </Link>
      </div>

      {/* Content */}
      {notes.length === 0 ? (
        <EmptyNotesState />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {notes.map((note) => (
            <MiniNoteCard key={note.id} note={note} />
          ))}
        </div>
      )}
    </CardBox>
  );
}
