'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { IconCalendar, IconClock } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverPortal,
} from '@radix-ui/react-popover';
import { Calendar } from './calendar';

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Show time picker alongside date */
  showTime?: boolean;
  /** Minimum selectable date */
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Sélectionner une date',
  disabled = false,
  className,
  showTime = true,
  minDate,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [hours, setHours] = React.useState(value ? value.getHours() : 10);
  const [minutes, setMinutes] = React.useState(value ? value.getMinutes() : 0);

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setHours(value.getHours());
      setMinutes(value.getMinutes());
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
      onChange?.(newDate);
    } else {
      setSelectedDate(undefined);
      onChange?.(undefined);
    }
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(newHours, newMinutes, 0, 0);
      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder;
    if (showTime) {
      return format(selectedDate, "d MMM yyyy 'à' HH:mm", { locale: fr });
    }
    return format(selectedDate, 'd MMM yyyy', { locale: fr });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-darklink',
            className
          )}
        >
          <IconCalendar className="mr-2 h-4 w-4" />
          {formatDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          className="w-auto p-0 bg-white dark:bg-dark border border-ld rounded-lg shadow-lg z-10001"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions
        >
          <div className="flex">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={minDate ? { before: minDate } : undefined}
              initialFocus
            />
            {showTime && (
              <div className="border-l border-ld p-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-darklink">
                    <IconClock className="h-4 w-4" />
                    <span>Heure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <select
                      value={hours}
                      onChange={(e) => handleTimeChange(parseInt(e.target.value), minutes)}
                      className="select-md text-sm w-16"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                    <span className="text-darklink">:</span>
                    <select
                      value={minutes}
                      onChange={(e) => handleTimeChange(hours, parseInt(e.target.value))}
                      className="select-md text-sm w-16"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>
                          {m.toString().padStart(2, '0')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => setOpen(false)}
                >
                  Confirmer
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}
