'use client';

import React from 'react';
import { WelcomeCard } from '../components/welcome-card';
import { AdminQuickStats } from '../components/quick-stats-row';
import { LeadsStatusChart } from '../components/leads-status-chart';
import { SalesDistributionChart } from '../components/sales-distribution-chart';
import { QuickActions } from '../components/quick-actions';
import { ImportActivityTable } from '../components/import-activity-table';
import { LeadsTrendChart } from '../components/leads-trend-chart';
import type { AdminDashboardData } from '../types';

interface AdminDashboardViewProps {
  data: AdminDashboardData;
  userName: string;
  userAvatar?: string | null;
}

export function AdminDashboardView({ data, userName, userAvatar }: AdminDashboardViewProps) {
  const {
    totalLeads,
    totalLeadsLastMonth,
    totalUsers,
    recentImports,
    activeSales,
    unassignedLeads,
    leadsByStatus,
    teamPerformance,
    importActivity,
    leadsTrend,
  } = data;

  // Calculate won leads from status
  const wonLeads = leadsByStatus['won'] || 0;

  // Calculate trend percentage
  const trendPercentage =
    totalLeadsLastMonth > 0
      ? Math.round(((totalLeads - totalLeadsLastMonth) / totalLeadsLastMonth) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <WelcomeCard
        userName={userName}
        userAvatar={userAvatar}
        totalLeads={totalLeads}
        trendPercentage={trendPercentage}
        isAdmin={true}
      />

      {/* Quick Stats Row */}
      <AdminQuickStats
        totalUsers={totalUsers}
        recentImports={recentImports}
        activeSales={activeSales}
        wonLeads={wonLeads}
      />

      {/* Status Chart + Quick Actions */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8 col-span-12 flex">
          <LeadsStatusChart leadsByStatus={leadsByStatus} totalLeads={totalLeads} />
        </div>
        <div className="lg:col-span-4 col-span-12 flex">
          <QuickActions />
        </div>
      </div>

      {/* Sales Distribution + Import Activity */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-4 col-span-12 flex">
          <SalesDistributionChart
            teamData={teamPerformance}
            unassignedLeads={unassignedLeads}
            totalLeads={totalLeads}
          />
        </div>
        <div className="lg:col-span-8 col-span-12 flex">
          <ImportActivityTable imports={importActivity} />
        </div>
      </div>

      {/* Leads Trend Chart */}
      <LeadsTrendChart trendData={leadsTrend} showAssigned={true} />
    </div>
  );
}
