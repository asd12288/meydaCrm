'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

interface HoverVideoProps {
  /** Video source URL */
  src: string;
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Fallback image if video fails */
  fallback?: string;
}

/**
 * Video component that plays on hover and pauses on mouse leave.
 * Resets to beginning when mouse leaves.
 */
export function HoverVideo({
  src,
  width = 40,
  height = 40,
  className = '',
  alt = 'Video',
  fallback,
}: HoverVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current && !hasError) {
      videoRef.current.play().catch(() => {
        // Ignore play errors (e.g., user hasn't interacted yet)
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleError = () => {
    console.error('Video failed to load:', src);
    setHasError(true);
  };

  // Show fallback or placeholder if video fails
  if (hasError) {
    if (fallback) {
      return (
        <Image
          src={fallback}
          width={width}
          height={height}
          alt={alt}
          className={`object-cover aspect-square ${className}`}
        />
      );
    }
    // Return empty placeholder with same dimensions
    return (
      <div
        style={{ width, height }}
        className={`bg-primary/10 aspect-square ${className}`}
      />
    );
  }

  return (
    <video
      ref={videoRef}
      width={width}
      height={height}
      className={`object-cover aspect-square cursor-pointer ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onError={handleError}
      muted
      playsInline
      loop
      preload="metadata"
      aria-label={alt}
    >
      <source src={src} type="video/webm" />
      Your browser does not support the video tag.
    </video>
  );
}
