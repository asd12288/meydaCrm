'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconDeviceFloppy } from '@tabler/icons-react';
import {
  FormField,
  FormSelectDropdown,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
} from '@/modules/shared';
import { editUserSchema, USER_FIELD_LABELS } from '../types';
import type { EditUserInput, UserProfile } from '../types';
import { USER_ROLE_OPTIONS } from '@/lib/constants';
import { updateUser } from '../lib/actions';

interface EditUserFormProps {
  user: UserProfile;
  isSelf?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EditUserForm({ user, isSelf = false, onSuccess, onCancel }: EditUserFormProps) {
  const { isPending, startTransition, error, setError, success, handleFormSuccess, resetAll } =
    useFormState();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<EditUserInput>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: user.display_name,
      role: user.role,
    },
  });

  const onSubmit = (data: EditUserInput) => {
    resetAll();

    startTransition(async () => {
      const result = await updateUser(user.id, data);

      if (result.error) {
        setError(result.error);
      } else {
        handleFormSuccess({ onSuccess, onSuccessDelay: 1000 });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label={USER_FIELD_LABELS.displayName}
        error={errors.displayName?.message}
        {...register('displayName')}
      />

      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <FormSelectDropdown
            label={USER_FIELD_LABELS.role}
            options={[...USER_ROLE_OPTIONS]}
            value={field.value}
            onChange={field.onChange}
            error={errors.role?.message}
            hint={isSelf ? 'Vous ne pouvez pas modifier votre propre rôle' : undefined}
            disabled={isSelf}
            className={isSelf ? 'opacity-50' : ''}
          />
        )}
      />

      <FormErrorAlert error={error} />
      <FormSuccessAlert show={success} message="Utilisateur modifié avec succès" />

      <FormActions
        isPending={isPending}
        isDirty={isDirty}
        submitLabel="Enregistrer"
        submitLabelPending="Enregistrement..."
        submitIcon={<IconDeviceFloppy size={18} />}
        showCancel={!!onCancel}
        onCancel={onCancel}
      />
    </form>
  );
}
