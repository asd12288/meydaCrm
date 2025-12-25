'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { IconCalendar } from '@tabler/icons-react';
import {
  FormField,
  FormTextarea,
  FormErrorAlert,
  FormSuccessAlert,
  FormActions,
  useFormState,
  InlineDropdown,
} from '@/modules/shared';
import { DateTimePicker } from '@/modules/shared';
import { meetingFormSchema, type MeetingFormInput } from '../types';
import { createMeeting, updateMeeting } from '../lib/actions';
import {
  DEFAULT_MEETING_DURATION,
  MEETING_DURATION_OPTIONS,
  MEETING_FIELD_LABELS,
} from '../config/constants';
import { TIMING, TEXTAREA_ROWS } from '@/lib/constants';

interface MeetingFormProps {
  leadId: string;
  /** If provided, form is in edit mode */
  meeting?: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    scheduled_start: string;
    scheduled_end: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MeetingForm({
  leadId,
  meeting,
  onSuccess,
  onCancel,
}: MeetingFormProps) {
  const isEditing = !!meeting;
  const {
    isPending,
    startTransition,
    error,
    setError,
    success,
    handleFormSuccess,
    resetAll,
  } = useFormState();

  // Calculate initial duration from existing meeting
  const getInitialDuration = () => {
    if (meeting) {
      const start = new Date(meeting.scheduled_start);
      const end = new Date(meeting.scheduled_end);
      const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
      // Find closest duration option
      const closest = MEETING_DURATION_OPTIONS.reduce((prev, curr) =>
        Math.abs(curr.value - diffMinutes) < Math.abs(prev.value - diffMinutes)
          ? curr
          : prev
      );
      return closest.value;
    }
    return DEFAULT_MEETING_DURATION;
  };

  const [duration, setDuration] = useState(getInitialDuration());

  // Default to tomorrow at 10:00
  const getDefaultStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    meeting ? new Date(meeting.scheduled_start) : getDefaultStartDate()
  );

  // Calculate end date from start + duration
  const getEndDateString = (start: Date, durationMinutes: number) => {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + durationMinutes);
    return end.toISOString();
  };

  // Minimum date is today
  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MeetingFormInput>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      title: meeting?.title || '',
      description: meeting?.description || '',
      location: meeting?.location || '',
      scheduledStart: selectedDate?.toISOString().slice(0, 16) || '',
      scheduledEnd: selectedDate
        ? getEndDateString(selectedDate, duration).slice(0, 16)
        : '',
      leadId,
    },
  });

  // Handle date change from picker
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setValue('scheduledStart', date.toISOString().slice(0, 16));
      setValue('scheduledEnd', getEndDateString(date, duration).slice(0, 16));
    }
  };

  // Handle duration change
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = parseInt(e.target.value, 10);
    setDuration(newDuration);
    if (selectedDate) {
      setValue(
        'scheduledEnd',
        getEndDateString(selectedDate, newDuration).slice(0, 16)
      );
    }
  };

  const onSubmit = (data: MeetingFormInput) => {
    resetAll();
    startTransition(async () => {
      let result;

      if (isEditing && meeting) {
        result = await updateMeeting(meeting.id, data);
      } else {
        result = await createMeeting(data);
      }

      if (result.error) {
        setError(result.error);
      } else {
        handleFormSuccess({ onSuccess, onSuccessDelay: TIMING.SUCCESS_DELAY_QUICK });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label={MEETING_FIELD_LABELS.title}
        placeholder="Ex: Appel de découverte"
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">{MEETING_FIELD_LABELS.scheduledStart}</label>
          <DateTimePicker
            value={selectedDate}
            onChange={handleDateChange}
            placeholder="Choisir une date"
            minDate={minDate}
            showTime
          />
          {errors.scheduledStart?.message && (
            <p className="form-error mt-1">{errors.scheduledStart.message}</p>
          )}
        </div>
        <div>
          <label className="form-label">{MEETING_FIELD_LABELS.duration}</label>
          <InlineDropdown
            options={MEETING_DURATION_OPTIONS.map((opt) => ({
              value: String(opt.value),
              label: opt.label,
            }))}
            value={String(duration)}
            onChange={(v) => handleDurationChange({ target: { value: v } } as React.ChangeEvent<HTMLSelectElement>)}
            widthClass="w-full"
            size="md"
          />
        </div>
      </div>

      <FormField
        label={MEETING_FIELD_LABELS.location}
        placeholder="Bureau, Google Meet, Zoom..."
        error={errors.location?.message}
        {...register('location')}
      />

      <FormTextarea
        label={MEETING_FIELD_LABELS.description}
        placeholder="Notes sur le rendez-vous..."
        rows={TEXTAREA_ROWS.MEETING_NOTES}
        error={errors.description?.message}
        {...register('description')}
      />

      <input type="hidden" {...register('leadId')} />
      <input type="hidden" {...register('scheduledEnd')} />

      <FormErrorAlert error={error} />
      <FormSuccessAlert
        show={success}
        message={isEditing ? 'Rendez-vous modifié' : 'Rendez-vous créé'}
      />

      <FormActions
        isPending={isPending}
        submitLabel={isEditing ? 'Enregistrer' : 'Planifier'}
        submitIcon={<IconCalendar size={18} />}
        onCancel={onCancel}
      />
    </form>
  );
}
