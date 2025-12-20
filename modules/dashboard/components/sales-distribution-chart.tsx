'use client';

import React from 'react';
import { CardBox } from '@/modules/shared';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { TeamPerformanceItem } from '../types';

interface SalesDistributionChartProps {
  teamData: TeamPerformanceItem[];
  unassignedLeads: number;
  totalLeads: number;
}

export function SalesDistributionChart({
  teamData,
  unassignedLeads,
  totalLeads,
}: SalesDistributionChartProps) {
  // Calculate unassigned percentage
  const unassignedPercentage = totalLeads > 0 
    ? Math.round((unassignedLeads / totalLeads) * 100) 
    : 0;

  // Build items list with unassigned first if any
  const items: { name: string; count: number; isUnassigned: boolean }[] = [];
  
  if (unassignedLeads > 0) {
    items.push({ name: 'Non assignés', count: unassignedLeads, isUnassigned: true });
  }
  
  teamData.slice(0, 8).forEach((member) => {
    items.push({ name: member.userName, count: member.totalLeads, isUnassigned: false });
  });

  return (
    <CardBox className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h5 className="card-title">Distribution par commercial</h5>
        {unassignedLeads > 0 && (
          <span className="text-xs text-darklink">
            {unassignedPercentage}% non assignés
          </span>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const percentage = totalLeads > 0 ? Math.round((item.count / totalLeads) * 100) : 0;
          
          return (
            <div key={index} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm truncate ${item.isUnassigned ? 'text-darklink' : 'text-ld'}`}>
                    {item.isUnassigned && <IconAlertTriangle size={14} className="inline mr-1 text-warning" />}
                    {item.name}
                  </span>
                  <span className="text-xs text-darklink ml-2">
                    {item.count.toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="dashboard-progress-bar">
                  <div
                    className={`dashboard-progress-fill ${item.isUnassigned ? 'negative' : ''}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </CardBox>
  );
}
