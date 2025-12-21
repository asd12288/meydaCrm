import Link from 'next/link';
import { IconNote, IconChevronRight, IconUser } from '@tabler/icons-react';
import { CardBox } from '@/modules/shared';
import { getRecentNotes } from '@/modules/notes/lib/actions';
import { getNoteColorClasses, renderMarkdown } from '@/modules/notes';
import type { NoteWithLead } from '@/modules/notes/types';

/**
 * Mini note card for dashboard widget
 * Matches the design of NoteCard on the notes page, but compact
 */
function MiniNoteCard({ note }: { note: NoteWithLead }) {
  const colorClasses = getNoteColorClasses(note.color);

  const getLeadDisplayName = () => {
    if (!note.lead) return null;
    const parts = [note.lead.first_name, note.lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  return (
    <Link
      href="/notes"
      className={`block rounded-lg border-2 p-4 transition-all hover:shadow-md group ${colorClasses.bg} ${colorClasses.border}`}
    >
      {/* Title */}
      {note.title && (
        <h3 className="font-semibold text-ld mb-2 line-clamp-1">
          {note.title}
        </h3>
      )}

      {/* Note content with markdown */}
      <div
        className="text-sm text-darklink prose prose-sm dark:prose-invert max-w-none line-clamp-3"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
      />

      {/* Lead badge */}
      {note.lead && (
        <span className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 dark:bg-dark/50 text-xs font-medium text-darklink">
          <IconUser size={12} />
          {getLeadDisplayName()}
        </span>
      )}

      {/* Timestamp */}
      <div className="mt-3 text-xs text-darklink/60">
        {new Date(note.updated_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })}
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
