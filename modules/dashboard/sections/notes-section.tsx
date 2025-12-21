import Link from 'next/link';
import { IconNote, IconChevronRight, IconUser } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { CardBox } from '@/modules/shared';
import { getRecentNotes } from '@/modules/notes/lib/actions';
import { getPostItColorClasses, renderMarkdown } from '@/modules/notes';
import type { NoteWithLead } from '@/modules/notes/types';

/**
 * Mini post-it note for dashboard widget
 * Matches the design of PostItNote on the notes page, but compact and non-interactive
 */
function MiniPostItNote({ note }: { note: NoteWithLead }) {
  const colorClasses = getPostItColorClasses(note.color);

  const getLeadDisplayName = () => {
    if (!note.lead) return null;
    const parts = [note.lead.first_name, note.lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  return (
    <Link href="/notes" className="block group">
      <div
        className={cn(
          'post-it-inner relative',
          colorClasses.bg,
          colorClasses.shadow,
          'transition-transform hover:scale-[1.02] hover:-rotate-1'
        )}
        style={{ minHeight: '140px' }}
      >
        {/* Folded corner effect */}
        <div className={cn('post-it-fold', colorClasses.fold)} />

        {/* Content area */}
        <div className="post-it-content">
          {/* Title */}
          {note.title && (
            <h3 className="post-it-title line-clamp-1">{note.title}</h3>
          )}

          {/* Note content with markdown */}
          <div
            className="post-it-body prose prose-sm dark:prose-invert line-clamp-3"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
          />
        </div>

        {/* Footer */}
        <div className="post-it-footer">
          {note.lead ? (
            <span className="post-it-lead-badge">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {notes.map((note) => (
            <MiniPostItNote key={note.id} note={note} />
          ))}
        </div>
      )}
    </CardBox>
  );
}
