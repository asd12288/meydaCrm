'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconEdit } from '@tabler/icons-react';
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
import { TOAST, TEXTAREA_ROWS } from '@/lib/constants';
import { useEffect } from 'react';
import { z } from 'zod';
import { updateBanner, type SystemBanner } from '../lib/banner-actions';

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

const editBannerSchema = z.object({
  message: z.string().min(1, 'Le message est requis').max(500, 'Le message est trop long'),
  type: z.enum(['info', 'warning', 'success', 'announcement']),
  target_audience: z.enum(['all', 'admin']),
  is_dismissible: z.boolean(),
  expires_at: z.string().nullable().optional(),
});

type EditBannerFormData = z.infer<typeof editBannerSchema>;

interface EditBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  banner: SystemBanner | null;
}

export function EditBannerModal({
  isOpen,
  onClose,
  onSuccess,
  banner,
}: EditBannerModalProps) {
  const { isPending, startTransition, error, setError, resetError } = useFormState();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditBannerFormData>({
    resolver: zodResolver(editBannerSchema),
    defaultValues: {
      message: '',
      type: 'info',
      target_audience: 'all',
      is_dismissible: true,
      expires_at: null,
    },
  });

  // Reset form when banner changes
  useEffect(() => {
    if (banner) {
      // Format expires_at for datetime-local input (YYYY-MM-DDTHH:mm)
      let formattedExpiresAt = null;
      if (banner.expires_at) {
        const date = new Date(banner.expires_at);
        formattedExpiresAt = date.toISOString().slice(0, 16);
      }

      reset({
        message: banner.message,
        type: banner.type,
        target_audience: banner.target_audience,
        is_dismissible: banner.is_dismissible,
        expires_at: formattedExpiresAt,
      });
    }
  }, [banner, reset]);

  const onSubmit = (data: EditBannerFormData) => {
    if (!banner) return;
    resetError();

    // Transform empty string to null for expires_at
    const payload = {
      ...data,
      expires_at: data.expires_at === '' ? null : data.expires_at,
    };

    startTransition(async () => {
      const result = await updateBanner({
        id: banner.id,
        ...payload,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
        toast.success(TOAST.BANNER_UPDATED);
        onSuccess?.();
      }
    });
  };

  const handleClose = () => {
    resetError();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier l'annonce"
      icon={<IconEdit size={20} />}
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
          submitLabel="Enregistrer"
          onCancel={handleClose}
        />
      </form>
    </Modal>
  );
}
