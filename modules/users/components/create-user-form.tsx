'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconUserPlus } from '@tabler/icons-react';
import {
  FormField,
  FormPasswordField,
  FormSelectDropdown,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
} from '@/modules/shared';
import { createUserSchema, USER_FIELD_LABELS } from '../types';
import type { CreateUserInput } from '../types';
import { USER_ROLE_OPTIONS } from '@/lib/constants';
import { createUser } from '../lib/actions';

interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const { isPending, startTransition, error, setError, success, handleFormSuccess, resetAll } =
    useFormState();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      displayName: '',
      password: '',
      confirmPassword: '',
      role: 'sales',
    },
  });

  const onSubmit = (data: CreateUserInput) => {
    resetAll();

    startTransition(async () => {
      const result = await createUser(data);

      if (result.error) {
        setError(result.error);
      } else {
        reset();
        handleFormSuccess({ onSuccess, onSuccessDelay: 1000 });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label={USER_FIELD_LABELS.username}
        error={errors.username?.message}
        placeholder="ex: jean.dupont"
        {...register('username')}
      />

      <FormField
        label={USER_FIELD_LABELS.displayName}
        error={errors.displayName?.message}
        placeholder="ex: Jean Dupont"
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
          />
        )}
      />

      <FormPasswordField
        label={USER_FIELD_LABELS.password}
        error={errors.password?.message}
        {...register('password')}
      />

      <FormPasswordField
        label={USER_FIELD_LABELS.confirmPassword}
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <FormErrorAlert error={error} />
      <FormSuccessAlert show={success} message="Utilisateur créé avec succès" />

      <FormActions
        isPending={isPending}
        submitLabel="Créer l'utilisateur"
        submitLabelPending="Création..."
        submitIcon={<IconUserPlus size={18} />}
        showCancel={!!onCancel}
        onCancel={onCancel}
      />
    </form>
  );
}
