'use client';

import React from 'react';
import { CardBox } from '@/modules/shared';
import {
  IconUsers,
  IconTrophy,
  IconUserCheck,
  IconUserQuestion,
  IconSparkles,
  IconPhoneCall,
} from '@tabler/icons-react';

interface QuickStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}

interface QuickStatsRowProps {
  stats: QuickStat[];
}

export function QuickStatsRow({ stats }: QuickStatsRowProps) {
  return (
    <CardBox>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl bg-lightgray dark:bg-darkgray cursor-default"
          >
            <span className="dashboard-stat-icon">
              {stat.icon}
            </span>
            <div>
              <p className="text-2xl font-bold text-ld">{stat.value}</p>
              <p className="text-xs text-darklink">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  );
}

// Pre-configured stats for Sales Dashboard
export function SalesQuickStats({
  totalLeads,
  newLeads,
  callbackLeads,
  wonLeads,
}: {
  totalLeads: number;
  newLeads: number;
  callbackLeads: number;
  wonLeads: number;
}) {
  const stats: QuickStat[] = [
    {
      label: 'Nouveaux leads',
      value: newLeads,
      icon: <IconSparkles size={28} />,
    },
    {
      label: 'À rappeler',
      value: callbackLeads,
      icon: <IconPhoneCall size={28} />,
    },
    {
      label: 'Leads assignés',
      value: totalLeads,
      icon: <IconUsers size={28} />,
    },
    {
      label: 'Leads gagnés',
      value: wonLeads,
      icon: <IconTrophy size={28} />,
    },
  ];

  return <QuickStatsRow stats={stats} />;
}

// Pre-configured stats for Admin Dashboard
export function AdminQuickStats({
  totalUsers,
  unassignedLeads,
  activeSales,
  wonLeads,
}: {
  totalUsers: number;
  unassignedLeads: number;
  activeSales: number;
  wonLeads: number;
}) {
  const stats: QuickStat[] = [
    {
      label: 'Non assignés',
      value: unassignedLeads,
      icon: <IconUserQuestion size={28} />,
    },
    {
      label: 'Utilisateurs',
      value: totalUsers,
      icon: <IconUserCheck size={28} />,
    },
    {
      label: 'Vendeurs actifs',
      value: activeSales,
      icon: <IconUsers size={28} />,
    },
    {
      label: 'Leads gagnés',
      value: wonLeads,
      icon: <IconTrophy size={28} />,
    },
  ];

  return <QuickStatsRow stats={stats} />;
}
