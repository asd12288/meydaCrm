'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconUser,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/modules/shared';
import { TOAST } from '@/lib/constants';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { getNoteColorClasses } from '../config/constants';
import { renderMarkdown } from '../lib/markdown';
import { deleteNote } from '../lib/actions';
import type { NoteWithLead } from '../types';

interface NoteCardProps {
  note: NoteWithLead;
  onEdit: (note: NoteWithLead) => void;
  isDragging?: boolean;
}

export function NoteCard({ note, onEdit, isDragging = false }: NoteCardProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const colorClasses = getNoteColorClasses(note.color);

  const handleDelete = () => {
    if (!confirm('Supprimer cette note ?')) return;

    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(TOAST.NOTE_DELETED);
      }
    });
  };

  const getLeadDisplayName = () => {
    if (!note.lead) return null;
    const parts = [note.lead.first_name, note.lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  return (
    <div
      className={cn(
        'relative group rounded-lg border-2 p-4 transition-all duration-200',
        colorClasses.bg,
        colorClasses.border,
        isDragging && 'opacity-50 scale-[1.02] rotate-[2deg] shadow-xl',
        isPending && 'opacity-70'
      )}
    >
      {/* Drag handle */}
      <div
        className={cn(
          'absolute left-2 top-2 cursor-grab active:cursor-grabbing',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'text-darklink hover:text-ld'
        )}
        aria-label="Déplacer"
      >
        <IconGripVertical size={16} />
      </div>

      {/* Actions dropdown */}
      <DropdownMenu
        trigger={
          <button
            className={cn(
              'absolute right-2 top-2 p-1 rounded transition-all',
              'hover:bg-white/50 dark:hover:bg-dark/50',
              'text-darklink opacity-0 group-hover:opacity-100'
            )}
            aria-label="Actions"
          >
            <IconDotsVertical size={16} />
          </button>
        }
        position="bottom-right"
      >
        <DropdownMenuContent>
          <DropdownMenuItem
            icon={<IconEdit size={16} />}
            onClick={() => onEdit(note)}
          >
            Modifier
          </DropdownMenuItem>
          <DropdownMenuDivider />
          <DropdownMenuItem
            icon={<IconTrash size={16} />}
            variant="danger"
            onClick={handleDelete}
          >
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Content */}
      <div className="pt-4">
        {/* Title */}
        {note.title && (
          <h3 className="font-semibold text-ld mb-2 pr-8 line-clamp-2">
            {note.title}
          </h3>
        )}

        {/* Note content */}
        <div
          className="text-sm text-darklink prose prose-sm dark:prose-invert max-w-none line-clamp-6"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
        />

        {/* Lead badge */}
        {note.lead && (
          <Link
            href={`/leads/${note.lead.id}`}
            className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/50 dark:bg-dark/50 text-xs font-medium text-darklink hover:text-ld transition-colors"
          >
            <IconUser size={12} />
            {getLeadDisplayName()}
          </Link>
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
      </div>
    </div>
  );
}
