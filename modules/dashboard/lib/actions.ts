'use server';

import { createClient } from '@/lib/supabase/server';
import { HISTORY_EVENT_LABELS } from '@/db/types';
import { getCurrentUser } from '@/modules/auth';
import { isAdmin } from '@/modules/auth/lib/utils';
import type { LeadStatus } from '@/db/types';
import type {
  ActivityItem,
  TeamPerformanceItem,
  ImportActivityItem,
  LeadsTrendPoint,
  MonthlyTrendPoint,
  TrendYearsData,
} from '../types';

// =============================================================================
// AUTHORIZATION HELPER
// =============================================================================

/**
 * Check if current user is admin for data fetching.
 * Returns true if admin, false otherwise.
 * Use this to guard admin-only server actions.
 */
async function checkIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null && isAdmin(user);
}

// =============================================================================
// DATE HELPERS
// =============================================================================

// Helper to get date 30 days ago
function getThirtyDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString();
}

// Helper to get date 1 month ago
function getOneMonthAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString();
}

// =============================================================================
// SECTION-SPECIFIC DATA FETCHING (for Suspense streaming)
// =============================================================================

/**
 * Welcome card data - total leads and trend percentage
 */
export interface WelcomeData {
  totalLeads: number;
  trendPercentage: number;
}

export async function getAdminWelcomeData(): Promise<WelcomeData> {
  // Security: Only admins can see global lead stats
  if (!(await checkIsAdmin())) {
    return { totalLeads: 0, trendPercentage: 0 };
  }

  const supabase = await createClient();
  const oneMonthAgo = getOneMonthAgo();

  const [totalResult, lastMonthResult] = await Promise.all([
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .lt('created_at', oneMonthAgo),
  ]);

  const totalLeads = totalResult.count || 0;
  const totalLeadsLastMonth = lastMonthResult.count || 0;
  const trendPercentage =
    totalLeadsLastMonth > 0
      ? Math.round(((totalLeads - totalLeadsLastMonth) / totalLeadsLastMonth) * 100)
      : 0;

  return { totalLeads, trendPercentage };
}

/**
 * Quick stats data for admin dashboard
 */
export interface AdminQuickStatsData {
  totalUsers: number;
  unassignedLeads: number;
  activeSales: number;
  wonLeads: number;
}

export async function getAdminQuickStatsData(): Promise<AdminQuickStatsData> {
  // Security: Only admins can see global stats
  if (!(await checkIsAdmin())) {
    return { totalUsers: 0, unassignedLeads: 0, activeSales: 0, wonLeads: 0 };
  }

  const supabase = await createClient();

  const [usersResult, statsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'sales'),
    supabase.rpc('get_leads_stats'),
  ]);

  const stats = statsResult.data as { activeSalesCount?: number; unassignedCount?: number; leadsByStatus?: Record<string, number> } | null;

  return {
    totalUsers: usersResult.count || 0,
    unassignedLeads: stats?.unassignedCount || 0,
    activeSales: stats?.activeSalesCount || 0,
    wonLeads: stats?.leadsByStatus?.['deposit'] || 0,
  };
}

/**
 * Status chart data - leads grouped by status
 */
export interface StatusChartData {
  leadsByStatus: Record<string, number>;
  totalLeads: number;
}

export async function getStatusChartData(): Promise<StatusChartData> {
  // Security: Only admins can see global status distribution
  if (!(await checkIsAdmin())) {
    return { leadsByStatus: {}, totalLeads: 0 };
  }

  const supabase = await createClient();

  const result = await supabase.rpc('get_leads_stats');
  const stats = result.data as { totalLeads?: number; leadsByStatus?: Record<string, number> } | null;

  return {
    leadsByStatus: stats?.leadsByStatus || {},
    totalLeads: stats?.totalLeads || 0,
  };
}

/**
 * Team performance / sales distribution data
 * Optimized: Uses RPC function for server-side aggregation (instead of fetching 100k+ rows)
 */
export interface TeamPerformanceData {
  teamPerformance: TeamPerformanceItem[];
  unassignedLeads: number;
  totalLeads: number;
}

// Type for the get_team_performance RPC result
interface TeamPerformanceRpcResult {
  user_id: string;
  user_name: string;
  total_leads: number;
  won_leads: number;
}

export async function getTeamPerformanceData(): Promise<TeamPerformanceData> {
  // Security: Only admins can see team performance
  if (!(await checkIsAdmin())) {
    return { teamPerformance: [], unassignedLeads: 0, totalLeads: 0 };
  }

  const supabase = await createClient();

  // Parallel fetch: stats (for totals) and team performance (via RPC)
  const [statsResult, teamResult] = await Promise.all([
    supabase.rpc('get_leads_stats'),
    // Use RPC for efficient aggregation - replaces fetching all leads
    supabase.rpc('get_team_performance'),
  ]);

  const stats = statsResult.data as { totalLeads?: number; unassignedCount?: number } | null;
  const totalLeads = stats?.totalLeads || 0;
  const unassignedLeads = stats?.unassignedCount || 0;

  // Transform RPC result to TeamPerformanceItem format
  const teamPerformance: TeamPerformanceItem[] = (
    (teamResult.data as TeamPerformanceRpcResult[]) || []
  ).map((row) => ({
    userId: row.user_id,
    userName: row.user_name || 'Inconnu',
    totalLeads: Number(row.total_leads),
    wonLeads: Number(row.won_leads),
    conversionRate:
      row.total_leads > 0 ? Math.round((row.won_leads / row.total_leads) * 100) : 0,
  }));

  return { teamPerformance, unassignedLeads, totalLeads };
}

/**
 * Import activity data
 */
export async function getImportActivityData(): Promise<ImportActivityItem[]> {
  // Security: Only admins can see import activity
  if (!(await checkIsAdmin())) {
    return [];
  }

  const supabase = await createClient();

  const result = await supabase
    .from('import_jobs')
    .select('id, created_at, file_name, status, valid_rows, invalid_rows, imported_rows, total_rows')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    result.data?.map((job) => ({
      id: job.id,
      date: job.created_at,
      fileName: job.file_name,
      status: job.status,
      validRows: job.valid_rows || 0,
      invalidRows: job.invalid_rows || 0,
      importedRows: job.imported_rows || 0,
      totalRows: job.total_rows || 0,
    })) || []
  );
}

/**
 * Leads trend data (30 days)
 */
export async function getAdminTrendData(): Promise<LeadsTrendPoint[]> {
  // Security: Only admins can see global trend data
  if (!(await checkIsAdmin())) {
    return [];
  }

  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();

  const result = await supabase
    .from('leads')
    .select('created_at, assigned_to')
    .gte('created_at', thirtyDaysAgo)
    .is('deleted_at', null);

  const trendMap = new Map<string, { created: number; assigned: number }>();

  if (result.data) {
    for (const lead of result.data) {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { created: 0, assigned: 0 };
      existing.created += 1;
      if (lead.assigned_to) {
        existing.assigned += 1;
      }
      trendMap.set(date, existing);
    }
  }

  // Fill missing dates
  const leadsTrend: LeadsTrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const data = trendMap.get(dateStr) || { created: 0, assigned: 0 };
    leadsTrend.push({
      date: dateStr,
      created: data.created,
      updated: 0,
      assigned: data.assigned,
    });
  }

  return leadsTrend;
}

/**
 * Monthly trend data grouped by year
 * Returns all available years and monthly data for each year
 * Uses database function for efficient aggregation
 */
export async function getMonthlyTrendData(): Promise<TrendYearsData> {
  // Security: Only admins can see global trend data
  if (!(await checkIsAdmin())) {
    return { years: [], monthlyData: {} };
  }

  const supabase = await createClient();

  // Use database function for efficient aggregation
  const { data, error } = await supabase.rpc('get_monthly_leads_trend');

  if (error || !data) {
    console.error('Error fetching monthly trend data:', error);
    return { years: [], monthlyData: {} };
  }

  // Group data by year
  const monthlyData: Record<number, MonthlyTrendPoint[]> = {};
  const yearsSet = new Set<number>();

  for (const row of data as { year: number; month: number; created: number; assigned: number }[]) {
    const year = Number(row.year);
    const month = Number(row.month);
    yearsSet.add(year);

    if (!monthlyData[year]) {
      monthlyData[year] = [];
    }

    monthlyData[year].push({
      year,
      month,
      created: Number(row.created),
      updated: 0,
      assigned: Number(row.assigned),
    });
  }

  // Sort monthly data within each year and fill missing months
  const years = Array.from(yearsSet).sort((a, b) => b - a); // Descending order

  for (const year of years) {
    // Create full 12-month array
    const fullYear: MonthlyTrendPoint[] = [];
    const existingData = new Map(monthlyData[year].map((d) => [d.month, d]));

    for (let month = 1; month <= 12; month++) {
      const existing = existingData.get(month);
      if (existing) {
        fullYear.push(existing);
      } else {
        fullYear.push({ year, month, created: 0, updated: 0, assigned: 0 });
      }
    }

    monthlyData[year] = fullYear;
  }

  return { years, monthlyData };
}

/**
 * Recent activity data for admin dashboard
 */
export async function getAdminRecentActivityData(): Promise<ActivityItem[]> {
  // Security: Only admins can see all activity
  if (!(await checkIsAdmin())) {
    return [];
  }

  const supabase = await createClient();

  const result = await supabase
    .from('lead_history')
    .select(`
      id,
      created_at,
      event_type,
      lead_id,
      actor_id,
      leads!inner(id, first_name, last_name, status),
      profiles!lead_history_actor_id_fkey(id, display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    result.data?.map((event) => {
      const lead = (event.leads as { first_name?: string; last_name?: string; status?: string }) || {};
      const actor = (event.profiles as { display_name?: string }) || {};
      return {
        id: event.id,
        date: event.created_at,
        leadId: event.lead_id,
        leadName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sans nom',
        action: (HISTORY_EVENT_LABELS as Record<string, string>)[event.event_type] || event.event_type,
        status: lead.status as LeadStatus,
        actorName: actor?.display_name || 'Inconnu',
      };
    }) || []
  );
}

// =============================================================================
// SALES DASHBOARD SECTION-SPECIFIC DATA
// =============================================================================

/**
 * Sales welcome data - their leads and trend
 */
export async function getSalesWelcomeData(): Promise<WelcomeData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { totalLeads: 0, trendPercentage: 0 };

  const result = await supabase.rpc('get_user_leads_stats', { target_user_id: user.id });
  const stats = result.data as { totalLeads?: number } | null;
  const totalLeads = stats?.totalLeads || 0;

  // For sales, we calculate trend from their leads created over time
  return { totalLeads, trendPercentage: 0 };
}

/**
 * Sales quick stats data
 */
export interface SalesQuickStatsData {
  totalLeads: number;
  newLeads: number;
  callbackLeads: number;
  wonLeads: number;
}

export async function getSalesQuickStatsData(): Promise<SalesQuickStatsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { totalLeads: 0, newLeads: 0, callbackLeads: 0, wonLeads: 0 };

  const result = await supabase.rpc('get_user_leads_stats', { target_user_id: user.id });
  const stats = result.data as { totalLeads?: number; leadsByStatus?: Record<string, number> } | null;
  const leadsByStatus = stats?.leadsByStatus || {};

  return {
    totalLeads: stats?.totalLeads || 0,
    newLeads: leadsByStatus['new'] || 0,
    callbackLeads: (leadsByStatus['callback'] || 0) + (leadsByStatus['relance'] || 0),
    wonLeads: leadsByStatus['deposit'] || 0,
  };
}

/**
 * Sales status chart data
 */
export async function getSalesStatusChartData(): Promise<StatusChartData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { leadsByStatus: {}, totalLeads: 0 };

  const result = await supabase.rpc('get_user_leads_stats', { target_user_id: user.id });
  const stats = result.data as { totalLeads?: number; leadsByStatus?: Record<string, number> } | null;

  return {
    leadsByStatus: stats?.leadsByStatus || {},
    totalLeads: stats?.totalLeads || 0,
  };
}

/**
 * Sales activity timeline data
 */
export async function getSalesActivityData(): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [historyResult, commentsResult] = await Promise.all([
    supabase
      .from('lead_history')
      .select(`
        id,
        created_at,
        event_type,
        lead_id,
        actor_id,
        leads!inner(id, first_name, last_name, status, assigned_to)
      `)
      .eq('actor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('lead_comments')
      .select(`
        id,
        created_at,
        lead_id,
        author_id,
        leads!inner(id, first_name, last_name, status, assigned_to)
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const activityItems: ActivityItem[] = [];

  if (historyResult.data) {
    for (const event of historyResult.data) {
      const lead = (event.leads as { first_name?: string; last_name?: string; status?: string }) || {};
      activityItems.push({
        id: event.id,
        date: event.created_at,
        leadId: event.lead_id,
        leadName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sans nom',
        action: (HISTORY_EVENT_LABELS as Record<string, string>)[event.event_type] || event.event_type,
        status: lead.status as LeadStatus,
      });
    }
  }

  if (commentsResult.data) {
    for (const comment of commentsResult.data) {
      const lead = (comment.leads as { first_name?: string; last_name?: string; status?: string }) || {};
      activityItems.push({
        id: `comment-${comment.id}`,
        date: comment.created_at,
        leadId: comment.lead_id,
        leadName: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sans nom',
        action: 'Commentaire ajouté',
        status: lead.status as LeadStatus,
      });
    }
  }

  // Sort and limit
  activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return activityItems.slice(0, 10);
}

/**
 * Sales trend data
 */
export async function getSalesTrendData(): Promise<LeadsTrendPoint[]> {
  const supabase = await createClient();
  const thirtyDaysAgo = getThirtyDaysAgo();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const [createdResult, updatedResult] = await Promise.all([
    supabase
      .from('leads')
      .select('created_at')
      .eq('assigned_to', user.id)
      .gte('created_at', thirtyDaysAgo)
      .is('deleted_at', null),
    supabase
      .from('leads')
      .select('updated_at')
      .eq('assigned_to', user.id)
      .gte('updated_at', thirtyDaysAgo)
      .is('deleted_at', null),
  ]);

  const trendMap = new Map<string, { created: number; updated: number }>();

  if (createdResult.data) {
    for (const lead of createdResult.data) {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { created: 0, updated: 0 };
      existing.created += 1;
      trendMap.set(date, existing);
    }
  }

  if (updatedResult.data) {
    for (const lead of updatedResult.data) {
      const date = new Date(lead.updated_at).toISOString().split('T')[0];
      const existing = trendMap.get(date) || { created: 0, updated: 0 };
      existing.updated += 1;
      trendMap.set(date, existing);
    }
  }

  // Fill missing dates
  const leadsTrend: LeadsTrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const data = trendMap.get(dateStr) || { created: 0, updated: 0 };
    leadsTrend.push({
      date: dateStr,
      created: data.created,
      updated: data.updated,
    });
  }

  return leadsTrend;
}
