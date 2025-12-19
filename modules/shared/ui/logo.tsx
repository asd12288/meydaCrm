'use client';

import Image from 'next/image';
import { useTheme } from '@/lib/theme';

interface LogoProps {
  /** Width of the logo in pixels */
  width?: number;
  /** Height of the logo in pixels (auto-calculated if not provided) */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Force a specific variant regardless of theme */
  variant?: 'light' | 'dark';
}

/**
 * Logo component with automatic dark/light mode switching
 * - Uses logo-light.png in light mode (light background)
 * - Uses logo-dark.png in dark mode (dark background)
 */
export function Logo({
  width = 150,
  height,
  className = '',
  variant
}: LogoProps) {
  const { theme } = useTheme();

  // Determine which logo to show
  // If variant is forced, use that; otherwise use theme
  // logo-dark.png = for dark backgrounds, logo-light.png = for light backgrounds
  const useDarkLogo = variant ? variant === 'dark' : theme === 'dark';
  const logoSrc = useDarkLogo ? '/logo-dark.png' : '/logo-light.png';

  // Calculate height maintaining aspect ratio if not provided
  // Original is 2048x2048 (1:1), but we crop height visually with object-fit
  const calculatedHeight = height || Math.round(width * 0.4); // 40% height ratio

  return (
    <Image
      src={logoSrc}
      alt="Meyda"
      width={width}
      height={calculatedHeight}
      className={`object-contain object-center ${className}`}
      priority
    />
  );
}
