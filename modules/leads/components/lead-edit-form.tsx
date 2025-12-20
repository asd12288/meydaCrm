'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconDeviceFloppy } from '@tabler/icons-react';
import {
  FormField,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
} from '@/modules/shared';
import { leadUpdateSchema } from '../types';
import { LEAD_FIELD_LABELS } from '@/lib/constants';
import type { LeadUpdateInput, LeadWithFullDetails } from '../types';
import { updateLead } from '../lib/actions';

interface LeadEditFormProps {
  lead: LeadWithFullDetails;
  onSuccess?: () => void;
}

export function LeadEditForm({ lead, onSuccess }: LeadEditFormProps) {
  const { isPending, startTransition, error, setError, success, setSuccess, resetAll } =
    useFormState();

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
    resetAll();

    startTransition(async () => {
      const result = await updateLead(lead.id, data);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        reset(data);
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1000);
        } else {
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
          <label className="form-label">{LEAD_FIELD_LABELS.notes}</label>
          <textarea
            {...register('notes')}
            rows={4}
            className="form-control-input w-full resize-none"
            placeholder="Notes sur ce lead..."
          />
          {errors.notes?.message && (
            <p className="form-error">{errors.notes.message}</p>
          )}
        </div>
      </div>

      <FormErrorAlert error={error} />
      <FormSuccessAlert show={success} message="Modifications enregistrées" />

      <FormActions
        isPending={isPending}
        isDirty={isDirty}
        submitLabel="Enregistrer"
        submitLabelPending="Enregistrement..."
        submitIcon={<IconDeviceFloppy size={18} />}
        showCancel={true}
        onCancel={() => reset()}
        cancelLabel="Annuler"
      />
    </form>
  );
}
