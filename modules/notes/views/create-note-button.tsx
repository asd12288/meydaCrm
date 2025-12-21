'use client';

import { useState } from 'react';
import { IconPlus, IconNote } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/modules/shared';
import { NoteForm } from '../components/note-form';

export function CreateNoteButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        <IconPlus size={18} className="mr-2" />
        Nouvelle note
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Nouvelle note"
        icon={<IconNote size={20} />}
        size="lg"
      >
        <NoteForm onSuccess={handleClose} onCancel={handleClose} />
      </Modal>
    </>
  );
}
