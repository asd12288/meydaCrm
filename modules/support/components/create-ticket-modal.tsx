'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconTicket } from '@tabler/icons-react';
import {
  Modal,
  FormField,
  FormTextarea,
  FormSelectDropdown,
  FormErrorAlert,
  FormActions,
  useToast,
} from '@/modules/shared';
import { useTransition, useState } from 'react';
import { z } from 'zod';
import { createTicket } from '../lib/actions';
import { TICKET_CATEGORY_OPTIONS } from '../config/constants';

const createTicketSchema = z.object({
  category: z.enum(['bug', 'feature', 'payment_issue', 'feedback']),
  subject: z.string().min(1, 'Le sujet est requis').max(200, 'Le sujet est trop long'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTicketModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      category: 'bug',
      subject: '',
      description: '',
    },
  });

  const onSubmit = (data: CreateTicketFormData) => {
    setError(null);

    startTransition(async () => {
      const result = await createTicket(data);

      if (result.error) {
        setError(result.error);
      } else {
        // Close immediately and show toast
        reset();
        onClose();
        toast.success('Ticket créé avec succès');
        onSuccess?.();
      }
    });
  };

  const handleClose = () => {
    reset();
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Créer un ticket"
      icon={<IconTicket size={20} />}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <FormSelectDropdown
              label="Catégorie"
              options={TICKET_CATEGORY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />

        <FormField
          label="Sujet"
          error={errors.subject?.message}
          placeholder="Résumé du problème ou de la demande"
          {...register('subject')}
        />

        <FormTextarea
          label="Description"
          error={errors.description?.message}
          placeholder="Décrivez en détail le problème, la fonctionnalité demandée, ou votre commentaire..."
          rows={6}
          {...register('description')}
        />

        <FormErrorAlert error={error} />

        <FormActions
          isPending={isPending}
          submitLabel="Créer le ticket"
          onCancel={handleClose}
        />
      </form>
    </Modal>
  );
}
