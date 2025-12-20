'use client';

import React from 'react';
import { WelcomeCard } from '../components/welcome-card';
import { SalesQuickStats } from '../components/quick-stats-row';
import { LeadsStatusChart } from '../components/leads-status-chart';
import { ActivityTimeline } from '../components/activity-timeline';
import { LeadsTrendChart } from '../components/leads-trend-chart';
import type { SalesDashboardData } from '../types';

interface SalesDashboardViewProps {
  data: SalesDashboardData;
  userName: string;
  userAvatar?: string | null;
}

export function SalesDashboardView({ data, userName, userAvatar }: SalesDashboardViewProps) {
  const { stats, recentActivity, leadsTrend, activeLeads, wonLeads } = data;

  // Calculate trend percentage
  const trendData = leadsTrend.slice(-30);
  const currentMonthTotal = trendData.slice(-15).reduce((sum, point) => sum + point.created, 0);
  const previousMonthTotal = trendData.slice(0, 15).reduce((sum, point) => sum + point.created, 0);
  const trendPercentage =
    previousMonthTotal > 0
      ? Math.round(((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard
        userName={userName}
        userAvatar={userAvatar}
        totalLeads={stats.leads.total}
        trendPercentage={trendPercentage}
        isAdmin={false}
      />

      {/* Quick Stats Row */}
      <SalesQuickStats
        totalLeads={stats.leads.total}
        comments={stats.commentsCount}
        activeLeads={activeLeads}
        wonLeads={wonLeads}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Leads by Status */}
        <div className="lg:col-span-7 col-span-12">
          <LeadsStatusChart leadsByStatus={stats.leads.byStatus} totalLeads={stats.leads.total} />
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-5 col-span-12">
          <ActivityTimeline activities={recentActivity} />
        </div>
      </div>

      {/* Leads Trend Chart */}
      <LeadsTrendChart trendData={leadsTrend} />
    </div>
  );
}
