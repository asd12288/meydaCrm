import type { NoteColor } from '../types';

// French labels for colors
export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  yellow: 'Jaune',
  pink: 'Rose',
  blue: 'Bleu',
  green: 'Vert',
  purple: 'Violet',
  orange: 'Orange',
};

// Tailwind CSS classes for note colors
export const NOTE_COLOR_CLASSES: Record<
  NoteColor,
  { bg: string; border: string; hoverBg: string }
> = {
  yellow: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-300 dark:border-amber-700',
    hoverBg: 'hover:bg-amber-200 dark:hover:bg-amber-900/50',
  },
  pink: {
    bg: 'bg-pink-100 dark:bg-pink-900/30',
    border: 'border-pink-300 dark:border-pink-700',
    hoverBg: 'hover:bg-pink-200 dark:hover:bg-pink-900/50',
  },
  blue: {
    bg: 'bg-sky-100 dark:bg-sky-900/30',
    border: 'border-sky-300 dark:border-sky-700',
    hoverBg: 'hover:bg-sky-200 dark:hover:bg-sky-900/50',
  },
  green: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-300 dark:border-emerald-700',
    hoverBg: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
  },
  purple: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    border: 'border-violet-300 dark:border-violet-700',
    hoverBg: 'hover:bg-violet-200 dark:hover:bg-violet-900/50',
  },
  orange: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-300 dark:border-orange-700',
    hoverBg: 'hover:bg-orange-200 dark:hover:bg-orange-900/50',
  },
};

// Color picker options
export const NOTE_COLOR_OPTIONS = [
  { value: 'yellow' as NoteColor, label: 'Jaune', class: 'bg-amber-400' },
  { value: 'pink' as NoteColor, label: 'Rose', class: 'bg-pink-400' },
  { value: 'blue' as NoteColor, label: 'Bleu', class: 'bg-sky-400' },
  { value: 'green' as NoteColor, label: 'Vert', class: 'bg-emerald-400' },
  { value: 'purple' as NoteColor, label: 'Violet', class: 'bg-violet-400' },
  { value: 'orange' as NoteColor, label: 'Orange', class: 'bg-orange-400' },
];

// Helper to get color classes
export function getNoteColorClasses(color: NoteColor) {
  return NOTE_COLOR_CLASSES[color] || NOTE_COLOR_CLASSES.yellow;
}

// Post-it specific color classes (for free-form canvas)
export const POST_IT_COLOR_CLASSES: Record<
  NoteColor,
  { bg: string; fold: string; shadow: string }
> = {
  yellow: {
    bg: 'post-it-bg-yellow',
    fold: 'post-it-fold-yellow',
    shadow: 'post-it-shadow-yellow',
  },
  pink: {
    bg: 'post-it-bg-pink',
    fold: 'post-it-fold-pink',
    shadow: 'post-it-shadow-pink',
  },
  blue: {
    bg: 'post-it-bg-blue',
    fold: 'post-it-fold-blue',
    shadow: 'post-it-shadow-blue',
  },
  green: {
    bg: 'post-it-bg-green',
    fold: 'post-it-fold-green',
    shadow: 'post-it-shadow-green',
  },
  purple: {
    bg: 'post-it-bg-purple',
    fold: 'post-it-fold-purple',
    shadow: 'post-it-shadow-purple',
  },
  orange: {
    bg: 'post-it-bg-orange',
    fold: 'post-it-fold-orange',
    shadow: 'post-it-shadow-orange',
  },
};

// Helper to get Post-it color classes
export function getPostItColorClasses(color: NoteColor) {
  return POST_IT_COLOR_CLASSES[color] || POST_IT_COLOR_CLASSES.yellow;
}
