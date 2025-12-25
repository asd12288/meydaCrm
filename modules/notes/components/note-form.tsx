'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCheck } from '@tabler/icons-react';
import {
  FormField,
  FormTextarea,
  FormErrorAlert,
  FormActions,
  useFormState,
  useToast,
} from '@/modules/shared';
import { noteFormSchema, type NoteFormInput, type NoteWithLead } from '../types';
import { createNote, updateNote } from '../lib/actions';
import { NoteColorPicker } from './note-color-picker';
import { TEXTAREA_ROWS } from '@/lib/constants';
import { NoteLeadPicker } from './note-lead-picker';

interface NoteFormProps {
  note?: NoteWithLead;
  onSuccess: () => void;
  onCancel: () => void;
}

export function NoteForm({ note, onSuccess, onCancel }: NoteFormProps) {
  const isEditing = !!note;

  const {
    isPending,
    startTransition,
    error,
    setError,
    resetAll,
  } = useFormState();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NoteFormInput>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: note?.title || '',
      content: note?.content || '',
      color: note?.color || 'yellow',
      leadId: note?.lead_id || null,
    },
  });

  const onSubmit = (data: NoteFormInput) => {
    resetAll();
    startTransition(async () => {
      const result = isEditing
        ? await updateNote({ id: note.id, ...data })
        : await createNote(data);

      if (result.error) {
        setError(result.error);
      } else {
        toast.success(isEditing ? 'Note modifiée' : 'Note créée');
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title (optional) */}
      <FormField
        label="Titre"
        placeholder="Titre de la note (optionnel)"
        error={errors.title?.message}
        {...register('title')}
      />

      {/* Content */}
      <FormTextarea
        label="Contenu"
        placeholder="Contenu de la note..."
        rows={TEXTAREA_ROWS.NOTE_CONTENT}
        error={errors.content?.message}
        {...register('content')}
      />

      {/* Color picker */}
      <Controller
        name="color"
        control={control}
        render={({ field }) => (
          <NoteColorPicker
            value={field.value}
            onChange={field.onChange}
            disabled={isPending}
          />
        )}
      />

      {/* Lead picker */}
      <Controller
        name="leadId"
        control={control}
        render={({ field }) => (
          <NoteLeadPicker
            value={field.value || null}
            selectedLead={note?.lead || null}
            onChange={field.onChange}
            disabled={isPending}
          />
        )}
      />

      {/* Error alert */}
      <FormErrorAlert error={error} />

      {/* Actions */}
      <FormActions
        isPending={isPending}
        submitLabel={isEditing ? 'Enregistrer' : 'Créer la note'}
        submitIcon={<IconCheck size={18} />}
        onCancel={onCancel}
      />
    </form>
  );
}
