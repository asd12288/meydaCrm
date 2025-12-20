'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconKey } from '@tabler/icons-react';
import {
  FormPasswordField,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
} from '@/modules/shared';
import { resetPasswordSchema, USER_FIELD_LABELS } from '../types';
import type { ResetPasswordInput } from '../types';
import { resetPassword } from '../lib/actions';

interface ResetPasswordFormProps {
  userId: string;
  userName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ResetPasswordForm({
  userId,
  userName,
  onSuccess,
  onCancel,
}: ResetPasswordFormProps) {
  const { isPending, startTransition, error, setError, success, handleFormSuccess, resetAll } =
    useFormState();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    resetAll();

    startTransition(async () => {
      const result = await resetPassword(userId, data);

      if (result.error) {
        setError(result.error);
      } else {
        reset();
        handleFormSuccess({ onSuccess, onSuccessDelay: 1500 });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-darklink mb-4">
        Réinitialiser le mot de passe de <strong>{userName}</strong>
      </p>

      <FormPasswordField
        label={USER_FIELD_LABELS.newPassword}
        error={errors.newPassword?.message}
        {...register('newPassword')}
      />

      <FormPasswordField
        label={USER_FIELD_LABELS.confirmPassword}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <FormErrorAlert error={error} />
      <FormSuccessAlert show={success} message="Mot de passe réinitialisé avec succès" />

      <FormActions
        isPending={isPending}
        submitLabel="Réinitialiser"
        submitLabelPending="Réinitialisation..."
        submitIcon={<IconKey size={18} />}
        showCancel={!!onCancel}
        onCancel={onCancel}
      />
    </form>
  );
}
