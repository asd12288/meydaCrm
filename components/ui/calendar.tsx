'use client';

import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={fr}
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium capitalize',
        nav: 'space-x-1 flex items-center',
        button_previous:
          'absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-ld hover:bg-hover',
        button_next:
          'absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-ld hover:bg-hover',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday:
          'text-darklink rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button:
          'h-9 w-9 p-0 font-normal inline-flex items-center justify-center rounded-md hover:bg-lightprimary hover:text-primary transition-colors',
        selected:
          'bg-primary text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-md',
        today: 'bg-lightprimary text-primary rounded-md',
        outside:
          'text-darklink/50 opacity-50',
        disabled: 'text-darklink/50 opacity-50',
        range_middle:
          'aria-selected:bg-lightprimary aria-selected:text-primary',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <IconChevronLeft className="h-4 w-4" />
          ) : (
            <IconChevronRight className="h-4 w-4" />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
