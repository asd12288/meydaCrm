import type { AccountStats } from '@/modules/account/types';
import type { LeadStatus } from '@/db/types';

// Chart data types for ApexCharts
export interface ChartSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface ChartData {
  series: ChartSeries[];
  categories?: string[];
  labels?: string[];
}

// Activity timeline item
export interface ActivityItem {
  id: string;
  date: string;
  leadId: string;
  leadName: string;
  action: string;
  status?: LeadStatus;
  actorName?: string;
}

// Team performance item
export interface TeamPerformanceItem {
  userId: string;
  userName: string;
  totalLeads: number;
  wonLeads: number;
  conversionRate: number;
}

// Import activity item
export interface ImportActivityItem {
  id: string;
  date: string;
  fileName: string;
  status: string;
  validRows: number;
  invalidRows: number;
  importedRows: number;
  totalRows: number;
}

// Leads trend data point (daily)
export interface LeadsTrendPoint {
  date: string;
  created: number;
  updated: number;
  assigned?: number;
}

// Monthly trend data point
export interface MonthlyTrendPoint {
  month: number; // 1-12
  year: number;
  created: number;
  updated: number;
  assigned?: number;
}

// Available years for trend chart
export interface TrendYearsData {
  years: number[];
  monthlyData: Record<number, MonthlyTrendPoint[]>; // year -> monthly data
}

// Sales Dashboard Data
export interface SalesDashboardData {
  stats: AccountStats;
  recentActivity: ActivityItem[];
  leadsTrend: LeadsTrendPoint[];
  activeLeads: number;
  wonLeads: number;
}

// Admin Dashboard Data
export interface AdminDashboardData {
  totalLeads: number;
  totalLeadsLastMonth: number;
  totalUsers: number;
  recentImports: number;
  activeSales: number;
  unassignedLeads: number;
  leadsByStatus: Record<string, number>;
  teamPerformance: TeamPerformanceItem[];
  importActivity: ImportActivityItem[];
  leadsTrend: LeadsTrendPoint[];
  recentActivity: ActivityItem[];
}
