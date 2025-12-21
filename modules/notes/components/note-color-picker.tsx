'use client';

import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { NOTE_COLOR_OPTIONS } from '../config/constants';
import type { NoteColor } from '../types';

interface NoteColorPickerProps {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
  disabled?: boolean;
}

export function NoteColorPicker({
  value,
  onChange,
  disabled = false,
}: NoteColorPickerProps) {
  return (
    <div className="space-y-2">
      <label className="form-label">Couleur</label>
      <TooltipProvider>
        <div className="flex items-center justify-center gap-4 py-2 px-4">
          {NOTE_COLOR_OPTIONS.map((option) => (
            <Tooltip key={option.value}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => !disabled && onChange(option.value)}
                  disabled={disabled}
                  className={cn(
                    'w-8 h-8 rounded-full transition-all duration-200',
                    option.class,
                    value === option.value
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  aria-label={option.label}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {option.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
