'use client';

import React from 'react';
import { CardBox, Badge, UserAvatar } from '@/modules/shared';
import { DISPLAY_LIMITS } from '@/lib/constants';
import { IconTrophy } from '@tabler/icons-react';
import type { TeamPerformanceItem } from '../types';

interface TeamPerformanceChartProps {
  teamData: TeamPerformanceItem[];
}

export function TeamPerformanceChart({ teamData }: TeamPerformanceChartProps) {
  if (teamData.length === 0) {
    return (
      <CardBox className="h-full">
        <h5 className="card-title mb-4">Performance de l&apos;équipe</h5>
        <div className="flex items-center justify-center h-48 text-darklink">
          <p>Aucune donnée disponible</p>
        </div>
      </CardBox>
    );
  }

  // Take top performers
  const topPerformers = teamData.slice(0, DISPLAY_LIMITS.TOP_PERFORMERS);

  return (
    <CardBox className="h-full">
      <div className="flex items-center gap-2 mb-6">
        <IconTrophy size={20} className="text-warning" />
        <h5 className="card-title">Top vendeurs</h5>
      </div>

      <div className="space-y-4">
        {topPerformers.map((performer, index) => {
          const progressPercent = Math.min(
            (performer.totalLeads / (topPerformers[0]?.totalLeads || 1)) * 100,
            100
          );

          return (
            <div
              key={performer.userId}
              className="cursor-default"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <UserAvatar name={performer.userName} size="md" />
                  {index < 3 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-warning' : index === 1 ? 'bg-secondary' : 'bg-error'
                    }`}>
                      {index + 1}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ld truncate">{performer.userName}</p>
                  <p className="text-xs text-darklink">
                    {performer.totalLeads} leads • {performer.wonLeads} gagnés
                  </p>
                </div>

                <Badge
                  variant={
                    performer.conversionRate >= 20 ? 'success' :
                    performer.conversionRate >= 10 ? 'warning' : 'secondary'
                  }
                  size="sm"
                >
                  {performer.conversionRate}%
                </Badge>
              </div>

              <div className="h-1.5 bg-lightgray dark:bg-darkgray rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </CardBox>
  );
}
