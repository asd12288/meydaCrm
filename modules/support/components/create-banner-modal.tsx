'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconSpeakerphone } from '@tabler/icons-react';
import {
  Modal,
  FormField,
  FormTextarea,
  FormSelectDropdown,
  FormErrorAlert,
  FormActions,
  Checkbox,
  useToast,
  useFormState,
} from '@/modules/shared';
import { z } from 'zod';
import { createBanner } from '../lib/banner-actions';
import { TOAST, TEXTAREA_ROWS } from '@/lib/constants';

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
  expires_at: z.string().nullable().optional(),
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
  const { isPending, startTransition, error, setError, resetError } = useFormState();
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
      expires_at: null,
    },
  });

  const onSubmit = (data: CreateBannerFormData) => {
    resetError();

    // Transform empty string to null for expires_at
    const payload = {
      ...data,
      expires_at: data.expires_at === '' ? null : data.expires_at,
    };

    startTransition(async () => {
      const result = await createBanner(payload);

      if (result.error) {
        setError(result.error);
      } else {
        reset();
        onClose();
        toast.success(TOAST.BANNER_CREATED);
        onSuccess?.();
      }
    });
  };

  const handleClose = () => {
    reset();
    resetError();
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
          rows={TEXTAREA_ROWS.BANNER_CONTENT}
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

        <FormField
          type="datetime-local"
          label="Date d'expiration (optionnel)"
          {...register('expires_at')}
        />

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
