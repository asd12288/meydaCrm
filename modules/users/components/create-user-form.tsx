'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconUserPlus } from '@tabler/icons-react';
import {
  PasswordInput,
  FormField,
  FormSelect,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
} from '@/modules/shared';
import { createUserSchema, USER_FIELD_LABELS } from '../types';
import type { CreateUserInput } from '../types';
import { ROLE_OPTIONS } from '@/lib/constants';
import { createUser } from '../lib/actions';

interface CreateUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateUserForm({ onSuccess, onCancel }: CreateUserFormProps) {
  const { isPending, startTransition, error, setError, success, setSuccess, resetAll } =
    useFormState();

  const {
    register,
    handleSubmit,
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
        setSuccess(true);
        reset();
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000);
        }
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

      <FormSelect
        label={USER_FIELD_LABELS.role}
        options={[...ROLE_OPTIONS]}
        error={errors.role?.message}
        {...register('role')}
      />

      <div>
        <label className="form-label">{USER_FIELD_LABELS.password}</label>
        <PasswordInput {...register('password')} error={!!errors.password} />
        {errors.password?.message && (
          <p className="form-error">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="form-label">{USER_FIELD_LABELS.confirmPassword}</label>
        <PasswordInput
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword?.message && (
          <p className="form-error">{errors.confirmPassword.message}</p>
        )}
      </div>

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
