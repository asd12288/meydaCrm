'use client';

import { useState, useTransition, useOptimistic, useCallback } from 'react';
import { IconNote, IconPlus, IconEdit } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Modal, EmptyState } from '@/modules/shared';
import { reorderNotes } from '../lib/actions';
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import type { NoteWithLead } from '../types';

interface NoteGridProps {
  notes: NoteWithLead[];
}

export function NoteGrid({ notes: initialNotes }: NoteGridProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteWithLead | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic updates for drag and drop
  const [optimisticNotes, setOptimisticNotes] = useOptimistic(
    initialNotes,
    (state, { fromIndex, toIndex }: { fromIndex: number; toIndex: number }) => {
      const newNotes = [...state];
      const [removed] = newNotes.splice(fromIndex, 1);
      newNotes.splice(toIndex, 0, removed);
      return newNotes;
    }
  );


  const handleDragStart = useCallback(
    (e: React.DragEvent, noteId: string) => {
      setDraggedId(noteId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', noteId);

      // Create a better drag image
      const target = e.currentTarget as HTMLElement;
      const clone = target.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.transform = 'rotate(3deg)';
      clone.style.opacity = '0.9';
      document.body.appendChild(clone);
      e.dataTransfer.setDragImage(clone, target.offsetWidth / 2, 20);
      requestAnimationFrame(() => document.body.removeChild(clone));
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      const draggedNoteId = e.dataTransfer.getData('text/plain');

      if (draggedNoteId === targetId) return;

      // Find the dragged note
      const draggedNote = optimisticNotes.find((n) => n.id === draggedNoteId);
      if (!draggedNote) return;

      const fromIndex = optimisticNotes.findIndex((n) => n.id === draggedNoteId);
      const toIndex = optimisticNotes.findIndex((n) => n.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return;

      startTransition(async () => {
        // Optimistic update
        setOptimisticNotes({ fromIndex, toIndex });

        // Get the new order of IDs
        const newNotes = [...optimisticNotes];
        const [removed] = newNotes.splice(fromIndex, 1);
        newNotes.splice(toIndex, 0, removed);

        // Send reorder to server
        await reorderNotes(newNotes.map((n) => n.id));
      });
    },
    [optimisticNotes, setOptimisticNotes]
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
          description="Créez votre première note pour commencer"
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
          size="lg"
        >
          <NoteForm onSuccess={handleCloseCreate} onCancel={handleCloseCreate} />
        </Modal>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notes grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {optimisticNotes.map((note) => (
          <div
            key={note.id}
            draggable
            onDragStart={(e) => handleDragStart(e, note.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, note.id)}
          >
            <NoteCard
              note={note}
              onEdit={handleEditNote}
              isDragging={draggedId === note.id}
            />
          </div>
        ))}
      </div>

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
