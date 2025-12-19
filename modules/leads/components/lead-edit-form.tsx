'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition } from 'react';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { leadUpdateSchema, LEAD_FIELD_LABELS } from '../types';
import type { LeadUpdateInput, LeadWithFullDetails } from '../types';
import { updateLead } from '../lib/actions';

interface LeadEditFormProps {
  lead: LeadWithFullDetails;
  onSuccess?: () => void;
}

export function LeadEditForm({ lead, onSuccess }: LeadEditFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LeadUpdateInput>({
    resolver: zodResolver(leadUpdateSchema),
    defaultValues: {
      first_name: lead.first_name || '',
      last_name: lead.last_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      job_title: lead.job_title || '',
      address: lead.address || '',
      city: lead.city || '',
      postal_code: lead.postal_code || '',
      country: lead.country || '',
      source: lead.source || '',
      notes: lead.notes || '',
    },
  });

  const onSubmit = (data: LeadUpdateInput) => {
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateLead(lead.id, data);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Reset form with new values to clear dirty state
        reset(data);
        // Call onSuccess callback after a brief delay to show success message
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000);
        } else {
          // Clear success message after 3 seconds if no callback
          setTimeout(() => setSuccess(false), 3000);
        }
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Personal Information */}
      <div>
        <h4 className="card-subtitle mb-4">Informations personnelles</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={LEAD_FIELD_LABELS.first_name}
            error={errors.first_name?.message}
            {...register('first_name')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.last_name}
            error={errors.last_name?.message}
            {...register('last_name')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.email}
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.phone}
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
      </div>

      {/* Company Information */}
      <div>
        <h4 className="card-subtitle mb-4">Entreprise</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label={LEAD_FIELD_LABELS.company}
            error={errors.company?.message}
            {...register('company')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.job_title}
            error={errors.job_title?.message}
            {...register('job_title')}
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <h4 className="card-subtitle mb-4">Adresse</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FormField
              label={LEAD_FIELD_LABELS.address}
              error={errors.address?.message}
              {...register('address')}
            />
          </div>
          <FormField
            label={LEAD_FIELD_LABELS.city}
            error={errors.city?.message}
            {...register('city')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.postal_code}
            error={errors.postal_code?.message}
            {...register('postal_code')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.country}
            error={errors.country?.message}
            {...register('country')}
          />
          <FormField
            label={LEAD_FIELD_LABELS.source}
            error={errors.source?.message}
            {...register('source')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <h4 className="card-subtitle mb-4">Notes</h4>
        <div>
          <label className="block text-sm font-medium text-ld mb-1">
            {LEAD_FIELD_LABELS.notes}
          </label>
          <textarea
            {...register('notes')}
            rows={4}
            className="form-control-input w-full resize-none"
            placeholder="Notes sur ce lead..."
          />
          {errors.notes?.message && (
            <p className="mt-1 text-sm text-error">{errors.notes.message}</p>
          )}
        </div>
      </div>

      {/* Error/Success messages */}
      {error && (
        <div className="p-3 rounded-md bg-lighterror text-error text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-md bg-lightsuccess text-success text-sm">
          Modifications enregistrées
        </div>
      )}

      {/* Form Actions - Always visible in modal context */}
      <div className="flex items-center gap-3 pt-4 border-t border-ld">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="ui-button bg-primary text-white flex items-center gap-2 disabled:opacity-50"
        >
          <IconDeviceFloppy size={18} />
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          disabled={isPending || !isDirty}
          className="ui-button bg-lightgray dark:bg-darkborder text-ld flex items-center gap-2 disabled:opacity-50"
        >
          <IconX size={18} />
          Annuler
        </button>
      </div>
    </form>
  );
}

// Reusable form field component
interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

function FormField({ label, error, ...props }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-ld mb-1">{label}</label>
      <input
        {...props}
        className={`form-control-input w-full ${error ? 'border-error' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}
