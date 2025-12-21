'use client';

import { useState } from 'react';
import Image from 'next/image';

// Random subtitles for each time period
const MORNING_SUBTITLES = [
  'Prêt pour une belle journée ?',
  'Un café et c\'est parti !',
  'Les objectifs n\'attendent pas !',
  'Nouvelle journée, nouvelles opportunités !',
  'C\'est l\'heure de briller !',
  'On attaque fort aujourd\'hui ?',
  'Les meilleurs leads arrivent tôt !',
];

const AFTERNOON_SUBTITLES = [
  'La journée avance bien !',
  'On garde le rythme !',
  'La pause café est méritée !',
  'Encore quelques deals à closer ?',
  'L\'après-midi des champions !',
  'Les objectifs sont en vue !',
  'Continue comme ça !',
];

const EVENING_SUBTITLES = [
  'Bientôt le repos mérité !',
  'Belle journée de travail !',
  'Tu as fait du bon boulot !',
  'Dernière ligne droite !',
  'Le canapé t\'attend bientôt !',
  'Finis en beauté !',
  'Bravo pour cette journée !',
];

const NIGHT_SUBTITLES = [
  'Encore debout ? Chapeau !',
  'Les noctambules font les meilleurs vendeurs !',
  'Le calme de la nuit, parfait pour travailler !',
  'Insomnie productive ?',
  'Tu ne dors jamais ?',
  'Les deals se font aussi la nuit !',
];

// Pick random subtitle from array using seeded index
function pickRandom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

interface GreetingData {
  text: string;
  emoji: string;
  subtitle: string;
}

// Default greeting for SSR (safe initial value)
const DEFAULT_GREETING: GreetingData = {
  text: 'Bienvenue',
  emoji: '👋',
  subtitle: 'Prêt à travailler !',
};

// Get time-based greeting with emoji (client-only)
function getTimeGreeting(seed: number): GreetingData {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { text: 'Bon matin', emoji: '☀️', subtitle: pickRandom(MORNING_SUBTITLES, seed) };
  }
  if (hour >= 12 && hour < 18) {
    return { text: 'Bon après-midi', emoji: '🌤️', subtitle: pickRandom(AFTERNOON_SUBTITLES, seed) };
  }
  if (hour >= 18 && hour < 22) {
    return { text: 'Bonsoir', emoji: '🌅', subtitle: pickRandom(EVENING_SUBTITLES, seed) };
  }
  return { text: 'Bonne nuit', emoji: '🌙', subtitle: pickRandom(NIGHT_SUBTITLES, seed) };
}

interface WelcomeCardProps {
  userName: string;
  userAvatar?: string | null;
}

export function WelcomeCard({ userName, userAvatar }: WelcomeCardProps) {
  // Use lazy initializer to compute greeting once on mount
  // The initializer function is only called once during first render
  const [greeting] = useState<GreetingData>(() => {
    // Check if we're on the client (window exists)
    if (typeof window === 'undefined') {
      return DEFAULT_GREETING;
    }
    // Uses current minute as seed for consistent subtitle within the same minute
    const seed = Math.floor(Date.now() / 60000);
    return getTimeGreeting(seed);
  });

  const { text: greetingText, emoji, subtitle } = greeting;

  // Get avatar path - use default if not set
  const avatarSrc = userAvatar
    ? `/avatars/${userAvatar}.png`
    : '/avatars/avatar-01.png';

  return (
    <div className="relative overflow-hidden rounded-xl dashboard-welcome p-6">
      <div className="flex items-center justify-between min-h-[140px]">
        {/* Left: Welcome text */}
        <div className="flex-1 z-10">
          <h4 className="!text-white/80 text-xl font-medium">
            {emoji} {greetingText},
          </h4>
          <h2 className="text-4xl font-bold !text-white mt-2">{userName}</h2>
          <p className="!text-white/60 text-base mt-3">{subtitle}</p>
        </div>

        {/* Right: Avatar - positioned at bottom */}
        <div className="relative z-10 hidden sm:block self-end -mb-6 -mr-2">
          <div className="relative w-44 h-44 lg:w-52 lg:h-52">
            <Image
              src={avatarSrc}
              alt={userName}
              fill
              className="object-contain object-bottom drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </div>

      {/* Decorative circles - static */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
    </div>
  );
}
