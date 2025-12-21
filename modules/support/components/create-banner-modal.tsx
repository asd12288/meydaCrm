'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconSpeakerphone } from '@tabler/icons-react';
import {
  Modal,
  FormTextarea,
  FormSelectDropdown,
  FormErrorAlert,
  FormActions,
  Checkbox,
  useToast,
} from '@/modules/shared';
import { useTransition, useState } from 'react';
import { z } from 'zod';
import { createBanner } from '../lib/banner-actions';

const BANNER_TYPE_OPTIONS = [
  { value: 'info', label: 'Information' },
  { value: 'warning', label: 'Avertissement' },
  { value: 'success', label: 'Succès' },
  { value: 'announcement', label: 'Annonce' },
];

const BANNER_TARGET_OPTIONS = [
  { value: 'all', label: 'Tous les utilisateurs' },
  { value: 'admin', label: 'Administrateurs uniquement' },
];

const createBannerSchema = z.object({
  message: z.string().min(1, 'Le message est requis').max(500, 'Le message est trop long'),
  type: z.enum(['info', 'warning', 'success', 'announcement']),
  target_audience: z.enum(['all', 'admin']),
  is_dismissible: z.boolean(),
});

type CreateBannerFormData = z.infer<typeof createBannerSchema>;

interface CreateBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateBannerModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBannerModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateBannerFormData>({
    resolver: zodResolver(createBannerSchema),
    defaultValues: {
      message: '',
      type: 'info',
      target_audience: 'all',
      is_dismissible: true,
    },
  });

  const onSubmit = (data: CreateBannerFormData) => {
    setError(null);

    startTransition(async () => {
      const result = await createBanner(data);

      if (result.error) {
        setError(result.error);
      } else {
        reset();
        onClose();
        toast.success('Annonce créée avec succès');
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
      title="Créer une annonce"
      icon={<IconSpeakerphone size={20} />}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormTextarea
          label="Message"
          error={errors.message?.message}
          placeholder="Contenu de l'annonce..."
          rows={4}
          {...register('message')}
        />

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormSelectDropdown
                label="Type"
                options={BANNER_TYPE_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.type?.message}
              />
            )}
          />

          <Controller
            name="target_audience"
            control={control}
            render={({ field }) => (
              <FormSelectDropdown
                label="Audience"
                options={BANNER_TARGET_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                error={errors.target_audience?.message}
              />
            )}
          />
        </div>

        <Controller
          name="is_dismissible"
          control={control}
          render={({ field }) => (
            <Checkbox
              label="Peut être masquée par l'utilisateur"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />

        <FormErrorAlert error={error} />

        <FormActions
          isPending={isPending}
          submitLabel="Créer l'annonce"
          onCancel={handleClose}
        />
      </form>
    </Modal>
  );
}
