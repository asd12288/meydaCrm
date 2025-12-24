'use client';

import { useState, useOptimistic, useCallback, useTransition } from 'react';
import { IconNote, IconPlus, IconEdit } from '@tabler/icons-react';
import { Button } from '@/modules/shared';
import { Modal, EmptyState } from '@/modules/shared';
import { PostItNote } from './post-it-note';
import { NoteForm } from './note-form';
import type { NoteWithLead } from '../types';

interface NotesCanvasProps {
  notes: NoteWithLead[];
}

type OptimisticAction =
  | { type: 'position'; id: string; x: number; y: number }
  | { type: 'size'; id: string; width: number; height: number; x: number; y: number }
  | { type: 'zIndex'; id: string; zIndex: number }
  | { type: 'content'; id: string; content: string };

export function NotesCanvas({ notes: initialNotes }: NotesCanvasProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithLead | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic updates for position/size changes
  const [optimisticNotes, setOptimisticNotes] = useOptimistic(
    initialNotes,
    (state, action: OptimisticAction) => {
      switch (action.type) {
        case 'position':
          return state.map((note) =>
            note.id === action.id
              ? { ...note, position_x: action.x, position_y: action.y }
              : note
          );
        case 'size':
          return state.map((note) =>
            note.id === action.id
              ? {
                  ...note,
                  width: action.width,
                  height: action.height,
                  position_x: action.x,
                  position_y: action.y,
                }
              : note
          );
        case 'zIndex':
          return state.map((note) =>
            note.id === action.id
              ? { ...note, z_index: action.zIndex }
              : note
          );
        case 'content':
          return state.map((note) =>
            note.id === action.id
              ? { ...note, content: action.content }
              : note
          );
        default:
          return state;
      }
    }
  );

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      startTransition(() => {
        setOptimisticNotes({ type: 'position', id, x, y });
      });
    },
    [setOptimisticNotes]
  );

  const handleSizeChange = useCallback(
    (id: string, width: number, height: number, x: number, y: number) => {
      startTransition(() => {
        setOptimisticNotes({ type: 'size', id, width, height, x, y });
      });
    },
    [setOptimisticNotes]
  );

  const handleZIndexChange = useCallback(
    (id: string, zIndex: number) => {
      startTransition(() => {
        setOptimisticNotes({ type: 'zIndex', id, zIndex });
      });
    },
    [setOptimisticNotes]
  );

  const handleContentChange = useCallback(
    (id: string, content: string) => {
      startTransition(() => {
        setOptimisticNotes({ type: 'content', id, content });
      });
    },
    [setOptimisticNotes]
  );

  const handleEditNote = (note: NoteWithLead) => {
    setEditingNote(note);
  };

  const handleCloseEdit = () => {
    setEditingNote(null);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  if (optimisticNotes.length === 0) {
    return (
      <>
        <EmptyState
          icon={<IconNote size={48} />}
          title="Aucune note"
          description="Creez votre premiere note pour commencer"
          action={
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              <IconPlus size={18} className="mr-2" />
              Nouvelle note
            </Button>
          }
        />

        {/* Create modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={handleCloseCreate}
          title="Nouvelle note"
          icon={<IconNote size={20} />}
          size="md"
        >
          <NoteForm onSuccess={handleCloseCreate} onCancel={handleCloseCreate} />
        </Modal>
      </>
    );
  }

  return (
    <div className="notes-canvas-container">
      {/* Canvas toolbar */}
      <div className="notes-canvas-toolbar">
        <span className="text-sm text-darklink">
          {optimisticNotes.length} note{optimisticNotes.length > 1 ? 's' : ''}
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
        >
          <IconPlus size={16} className="mr-1" />
          Nouvelle note
        </Button>
      </div>

      {/* Main canvas */}
      <div className="notes-canvas">
        {optimisticNotes
          .sort((a, b) => a.z_index - b.z_index)
          .map((note) => (
            <PostItNote
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onPositionChange={handlePositionChange}
              onSizeChange={handleSizeChange}
              onZIndexChange={handleZIndexChange}
              onContentChange={handleContentChange}
            />
          ))}
      </div>

      {/* Create modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        title="Nouvelle note"
        icon={<IconNote size={20} />}
        size="md"
      >
        <NoteForm onSuccess={handleCloseCreate} onCancel={handleCloseCreate} />
      </Modal>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingNote}
        onClose={handleCloseEdit}
        title="Modifier la note"
        icon={<IconEdit size={20} />}
        size="md"
      >
        {editingNote && (
          <NoteForm
            note={editingNote}
            onSuccess={handleCloseEdit}
            onCancel={handleCloseEdit}
          />
        )}
      </Modal>
    </div>
  );
}
