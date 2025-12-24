import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.97]",
  {
    variants: {
      variant: {
        // === shadcn/ui original variants ===
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 rounded-md',
        destructive:
          'text-destructive hover-text-foreground bg-secondary border border-border hover:text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:hover:bg-destructive/60 rounded-md',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 rounded-md',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 rounded-md',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md',
        link: 'text-primary underline-offset-4 hover:underline',

        // === CRM Design System variants (pill buttons) ===
        // Primary action - rounded pill, primary color (replaces btn-primary-action)
        primary:
          'bg-primary text-white font-medium rounded-full hover:bg-primaryemphasis',
        // Secondary action - rounded pill, gray (replaces btn-secondary-action)
        secondaryAction:
          'bg-lightgray text-dark font-medium rounded-full hover:bg-muted dark:bg-darkborder dark:text-white dark:hover:bg-darkmuted',
        // Success action - rounded pill, success color
        success:
          'bg-success text-white font-medium rounded-full hover:bg-successemphasis',
        // Danger/error action - rounded pill, error color
        danger:
          'bg-error text-white font-medium rounded-full hover:bg-erroremphasis',
        // Warning action - rounded pill, warning color
        warning:
          'bg-warning text-white font-medium rounded-full hover:bg-warningemphasis',

        // === Icon button variants ===
        // Circle hover - for icon buttons in headers/modals (replaces btn-circle-hover)
        circleHover:
          'rounded-full bg-transparent text-link hover:bg-lightprimary hover:text-primary dark:text-darklink dark:hover:bg-darkmuted dark:hover:text-primary',
        // Circle solid - for icon buttons with background
        circleSolid:
          'rounded-full bg-dark text-white hover:bg-primary dark:bg-primary',

        // === Utility variants ===
        // Pagination button (replaces pagination-btn)
        pagination:
          'rounded-full hover:bg-lightprimary hover:text-primary dark:hover:bg-darkmuted',
        // Ghost text - like link but no underline
        ghostText:
          'text-darklink hover:text-ld dark:hover:text-white',
        // Ghost danger - for delete/remove actions
        ghostDanger:
          'text-darklink hover:text-error hover:bg-lighterror/30',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 gap-1.5 px-3 text-xs',
        lg: 'h-10 px-6',
        xl: 'h-11 px-8 text-base',
        // Icon sizes
        icon: 'size-9',
        iconSm: 'size-8',
        iconLg: 'size-10',
        // Circle sizes (alias for icon)
        circle: 'size-9',
        circleSm: 'size-8',
        circleLg: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
