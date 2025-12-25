'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconLock } from '@tabler/icons-react';
import {
  CardBox,
  FormPasswordField,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  SectionHeader,
  useFormState,
} from '@/modules/shared';
import { changePasswordSchema } from '../types';
import type { ChangePasswordInput } from '../types';
import { changePassword } from '../lib/actions';
import { analytics } from '@/lib/analytics';

export function PasswordChangeCard() {
  const { isPending, startTransition, error, setError, success, handleFormSuccess, resetAll } =
    useFormState();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordInput) => {
    resetAll();

    const formData = new FormData();
    formData.set('currentPassword', data.currentPassword);
    formData.set('newPassword', data.newPassword);
    formData.set('confirmPassword', data.confirmPassword);

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) {
        setError(result.error);
      } else {
        analytics.passwordChanged();
        reset();
        handleFormSuccess();
      }
    });
  };

  return (
    <CardBox>
      <SectionHeader
        title="Changer le mot de passe"
        icon={<IconLock size={20} />}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormPasswordField
          label="Mot de passe actuel"
          error={errors.currentPassword?.message}
          placeholder="••••••••"
          {...register('currentPassword')}
        />

        <FormPasswordField
          label="Nouveau mot de passe"
          error={errors.newPassword?.message}
          placeholder="••••••••"
          {...register('newPassword')}
        />

        <FormPasswordField
          label="Confirmer le mot de passe"
          error={errors.confirmPassword?.message}
          placeholder="••••••••"
          {...register('confirmPassword')}
        />

        <FormErrorAlert error={error} />
        <FormSuccessAlert show={success} message="Mot de passe modifié avec succès" />

        <FormActions
          isPending={isPending}
          isDirty={isDirty}
          submitLabel="Modifier le mot de passe"
          submitLabelPending="Modification..."
          submitIcon={<IconLock size={18} />}
          showCancel={false}
          withBorder={false}
          className="justify-center"
        />
      </form>
    </CardBox>
  );
}
