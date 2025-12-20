'use client';

import React from 'react';
import Image from 'next/image';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';

interface WelcomeCardProps {
  userName: string;
  userAvatar?: string | null;
  totalLeads: number;
  trendPercentage: number;
  isAdmin?: boolean;
}

export function WelcomeCard({
  userName,
  userAvatar,
  totalLeads,
  trendPercentage,
  isAdmin = false,
}: WelcomeCardProps) {
  const isPositive = trendPercentage >= 0;
  
  // Get avatar path - use default if not set
  const avatarSrc = userAvatar 
    ? `/avatars/${userAvatar}.png`
    : '/avatars/avatar-01.png';

  return (
    <div className="relative overflow-hidden rounded-xl dashboard-welcome p-6">
      <div className="flex items-end justify-between min-h-[140px]">
        {/* Left: Welcome text and stats */}
        <div className="flex-1 z-10 pb-2">
          <h4 className="!text-white/70 text-sm font-medium">Bonjour,</h4>
          <h2 className="text-2xl font-bold !text-white mt-1">{userName}</h2>
          
          {/* Stats pills */}
          <div className="flex items-center gap-3 mt-5">
            <div className="bg-white/15 backdrop-blur-sm rounded-full px-5 py-3">
              <p className="text-3xl font-bold !text-white leading-none">
                {totalLeads.toLocaleString('fr-FR')}
              </p>
              <p className="!text-white/60 text-xs mt-1">
                {isAdmin ? 'Total leads' : 'Vos leads'}
              </p>
            </div>
            
            <div className="bg-white/15 backdrop-blur-sm rounded-full px-5 py-3">
              <p className={`text-2xl font-bold leading-none flex items-center gap-1 ${isPositive ? '!text-white' : '!text-white/70'}`}>
                {isPositive ? <IconTrendingUp size={20} /> : <IconTrendingDown size={20} />}
                {isPositive ? '+' : ''}{trendPercentage}%
              </p>
              <p className="!text-white/60 text-xs mt-1">vs 30 jours</p>
            </div>
          </div>
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
      
      {/* Decorative circles - subtle */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
      <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
    </div>
  );
}
