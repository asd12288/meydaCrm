'use client';

import { useState, useTransition } from 'react';
import { Rnd } from 'react-rnd';
import Link from 'next/link';
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconUser,
  IconMaximize,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuDivider,
} from '@/modules/shared';
import { useToast } from '@/modules/shared/hooks/use-toast';
import { getPostItColorClasses } from '../config/constants';
import { renderMarkdown } from '../lib/markdown';
import {
  deleteNote,
  updateNotePosition,
  bringNoteToFront,
  updateNote,
} from '../lib/actions';
import type { NoteWithLead } from '../types';
import { NOTE_DEFAULTS } from '../types';

interface PostItNoteProps {
  note: NoteWithLead;
  onEdit: (note: NoteWithLead) => void;
  onPositionChange?: (id: string, x: number, y: number) => void;
  onSizeChange?: (
    id: string,
    width: number,
    height: number,
    x: number,
    y: number
  ) => void;
  onZIndexChange?: (id: string, zIndex: number) => void;
  onContentChange?: (id: string, content: string) => void;
  bounds?: string;
}

export function PostItNote({
  note,
  onEdit,
  onPositionChange,
  onSizeChange,
  onZIndexChange,
  onContentChange,
  bounds = '.notes-canvas',
}: PostItNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [, startTransition] = useTransition();
  const { toast } = useToast();
  const colorClasses = getPostItColorClasses(note.color);

  const handleDragStart = () => {
    setIsDragging(true);
    // Bring to front on drag start
    startTransition(async () => {
      const result = await bringNoteToFront(note.id);
      if (result.success && result.zIndex !== undefined) {
        onZIndexChange?.(note.id, result.zIndex);
      }
    });
  };

  const handleDragStop = (
    _e: unknown,
    data: { x: number; y: number }
  ) => {
    setIsDragging(false);
    const x = Math.round(data.x);
    const y = Math.round(data.y);
    onPositionChange?.(note.id, x, y);
    // Persist position
    startTransition(async () => {
      await updateNotePosition({
        id: note.id,
        positionX: x,
        positionY: y,
      });
    });
  };

  const handleResizeStop = (
    _e: unknown,
    _dir: unknown,
    ref: HTMLElement,
    _delta: unknown,
    position: { x: number; y: number }
  ) => {
    setIsResizing(false);
    const width = parseInt(ref.style.width);
    const height = parseInt(ref.style.height);
    const x = Math.round(position.x);
    const y = Math.round(position.y);
    onSizeChange?.(note.id, width, height, x, y);
    // Persist size and position
    startTransition(async () => {
      await updateNotePosition({
        id: note.id,
        width,
        height,
        positionX: x,
        positionY: y,
      });
    });
  };

  const handleDelete = () => {
    if (!confirm('Supprimer cette note ?')) return;
    startTransition(async () => {
      const result = await deleteNote(note.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Note supprimee');
      }
    });
  };

  // Inline content editing handlers
  const handleContentClick = () => {
    setEditContent(note.content);
    setIsEditing(true);
  };

  const handleContentBlur = () => {
    const trimmedContent = editContent.trim();
    if (trimmedContent === note.content || !trimmedContent) {
      setEditContent(note.content);
      setIsEditing(false);
      return;
    }

    setIsEditing(false);
    // Optimistic update via parent
    onContentChange?.(note.id, trimmedContent);
    // Persist to server (fire-and-forget)
    startTransition(async () => {
      const result = await updateNote({ id: note.id, content: trimmedContent });
      if (result.error) {
        toast.error(result.error);
        setEditContent(note.content); // Revert on error
      }
    });
  };

  const handleContentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditContent(note.content);
      setIsEditing(false);
    }
  };

  const getLeadDisplayName = () => {
    if (!note.lead) return null;
    const parts = [note.lead.first_name, note.lead.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Sans nom';
  };

  return (
    <Rnd
      default={{
        x: note.position_x,
        y: note.position_y,
        width: note.width,
        height: note.height,
      }}
      minWidth={NOTE_DEFAULTS.minWidth}
      minHeight={NOTE_DEFAULTS.minHeight}
      maxWidth={NOTE_DEFAULTS.maxWidth}
      maxHeight={NOTE_DEFAULTS.maxHeight}
      bounds={bounds}
      onDragStart={handleDragStart}
      onDragStop={handleDragStop}
      onResizeStart={() => setIsResizing(true)}
      onResizeStop={handleResizeStop}
      dragHandleClassName="post-it-drag-handle"
      enableResizing={{
        bottom: true,
        bottomRight: true,
        right: true,
      }}
      style={{ zIndex: note.z_index }}
      className={cn(
        'post-it-note group',
        isDragging && 'post-it-dragging',
        isResizing && 'post-it-resizing'
      )}
    >
      <div
        className={cn(
          'post-it-inner',
          colorClasses.bg,
          colorClasses.shadow
        )}
      >
        {/* Folded corner effect */}
        <div className={cn('post-it-fold', colorClasses.fold)} />

        {/* Drag handle (top strip) */}
        <div className="post-it-drag-handle">
          {/* Actions dropdown */}
          <DropdownMenu
            trigger={
              <button
                className="post-it-menu text-gray-600 dark:text-gray-800 opacity-60 hover:opacity-100 transition-opacity"
                aria-label="Actions"
              >
                <IconDotsVertical size={18} />
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
        </div>

        {/* Content area - inline editable */}
        <div className="post-it-content">
          {note.title && <h3 className="post-it-title">{note.title}</h3>}
          {isEditing ? (
            <textarea
              autoFocus
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleContentBlur}
              onKeyDown={handleContentKeyDown}
              className="post-it-textarea"
              placeholder="Ecrivez votre note..."
            />
          ) : (
            <div
              onClick={handleContentClick}
              className="post-it-body prose prose-sm dark:prose-invert cursor-text"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="post-it-footer">
          {note.lead ? (
            <Link
              href={`/leads/${note.lead.id}`}
              className="post-it-lead-badge"
            >
              <IconUser size={12} />
              {getLeadDisplayName()}
            </Link>
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

        {/* Resize handle indicator */}
        <div className="post-it-resize-handle">
          <IconMaximize size={12} className="rotate-90" />
        </div>
      </div>
    </Rnd>
  );
}
