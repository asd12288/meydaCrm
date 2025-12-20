'use client';

import React from 'react';
import { CardBox } from '@/modules/shared';
import {
  IconUsers,
  IconMessage,
  IconTrophy,
  IconCalendar,
  IconFileUpload,
  IconUserCheck,
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
  comments,
  activeLeads,
  wonLeads,
}: {
  totalLeads: number;
  comments: number;
  activeLeads: number;
  wonLeads: number;
}) {
  const stats: QuickStat[] = [
    {
      label: 'Leads assignés',
      value: totalLeads,
      icon: <IconUsers size={22} />,
    },
    {
      label: 'Commentaires',
      value: comments,
      icon: <IconMessage size={22} />,
    },
    {
      label: 'Leads actifs',
      value: activeLeads,
      icon: <IconCalendar size={22} />,
    },
    {
      label: 'Leads gagnés',
      value: wonLeads,
      icon: <IconTrophy size={22} />,
    },
  ];

  return <QuickStatsRow stats={stats} />;
}

// Pre-configured stats for Admin Dashboard
export function AdminQuickStats({
  totalUsers,
  recentImports,
  activeSales,
  wonLeads,
}: {
  totalUsers: number;
  recentImports: number;
  activeSales: number;
  wonLeads: number;
}) {
  const stats: QuickStat[] = [
    {
      label: 'Utilisateurs',
      value: totalUsers,
      icon: <IconUserCheck size={22} />,
    },
    {
      label: 'Imports (7j)',
      value: recentImports,
      icon: <IconFileUpload size={22} />,
    },
    {
      label: 'Vendeurs actifs',
      value: activeSales,
      icon: <IconUsers size={22} />,
    },
    {
      label: 'Leads gagnés',
      value: wonLeads,
      icon: <IconTrophy size={22} />,
    },
  ];

  return <QuickStatsRow stats={stats} />;
}
