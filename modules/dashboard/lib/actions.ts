'use server';

import { createClient } from '@/lib/supabase/server';
import { getCached, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { HISTORY_EVENT_LABELS } from '@/db/types';
import type { LeadStatus } from '@/db/types';
import type {
  SalesDashboardData,
  AdminDashboardData,
  ActivityItem,
  TeamPerformanceItem,
  ImportActivityItem,
  LeadsTrendPoint,
} from '../types';

// Helper to get date 7 days ago
function getSevenDaysAgo(): string {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date.toISOString();
}

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
  recentImports: number;
  activeSales: number;
  wonLeads: number;
}

export async function getAdminQuickStatsData(): Promise<AdminQuickStatsData> {
  const supabase = await createClient();
  const sevenDaysAgo = getSevenDaysAgo();

  const [usersResult, importsResult, statsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'sales'),
    supabase
      .from('import_jobs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabase.rpc('get_leads_stats'),
  ]);

  const stats = statsResult.data as { activeSalesCount?: number; leadsByStatus?: Record<string, number> } | null;

  return {
    totalUsers: usersResult.count || 0,
    recentImports: importsResult.count || 0,
    activeSales: stats?.activeSalesCount || 0,
    wonLeads: stats?.leadsByStatus?.['won'] || 0,
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
 * Recent activity data for admin dashboard
 */
export async function getAdminRecentActivityData(): Promise<ActivityItem[]> {
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
      profiles!lead_history_actor_id_profiles_id_fk(id, display_name)
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
  commentsCount: number;
  activeLeads: number;
  wonLeads: number;
}

export async function getSalesQuickStatsData(): Promise<SalesQuickStatsData> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { totalLeads: 0, commentsCount: 0, activeLeads: 0, wonLeads: 0 };

  const result = await supabase.rpc('get_user_leads_stats', { target_user_id: user.id });
  const stats = result.data as { totalLeads?: number; leadsByStatus?: Record<string, number> } | null;
  const leadsByStatus = stats?.leadsByStatus || {};

  const activeLeads =
    (leadsByStatus['rdv'] || 0) +
    (leadsByStatus['contacted'] || 0) +
    (leadsByStatus['qualified'] || 0);

  return {
    totalLeads: stats?.totalLeads || 0,
    commentsCount: 0,
    activeLeads,
    wonLeads: leadsByStatus['won'] || 0,
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

// =============================================================================
// LEGACY MONOLITHIC FUNCTIONS (kept for backwards compatibility)
// =============================================================================

// Type for the get_leads_stats RPC result
interface LeadsStatsResult {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  activeSalesCount: number;
  unassignedCount: number;
}

// Type for the get_user_leads_stats RPC result
interface UserLeadsStatsResult {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
}

/**
 * Get dashboard data for sales users
 * Optimized with caching and parallel queries
 */
export async function getSalesDashboardData(): Promise<SalesDashboardData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use caching for sales dashboard data (per-user cache)
  return getCached(
    CACHE_KEYS.DASHBOARD_SALES(user.id),
    async () => {
      const thirtyDaysAgo = getThirtyDaysAgo();

      // Parallel fetch: stats, activity, and trends
      const [
        statsResult,
        recentHistoryResult,
        recentCommentsResult,
        createdLeadsResult,
        updatedLeadsResult,
      ] = await Promise.all([
        // Use RPC for efficient stats aggregation
        supabase.rpc('get_user_leads_stats', { target_user_id: user.id }),
        // Recent history
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
        // Recent comments
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
        // Created leads for trend
        supabase
          .from('leads')
          .select('created_at')
          .eq('assigned_to', user.id)
          .gte('created_at', thirtyDaysAgo)
          .is('deleted_at', null),
        // Updated leads for trend
        supabase
          .from('leads')
          .select('updated_at')
          .eq('assigned_to', user.id)
          .gte('updated_at', thirtyDaysAgo)
          .is('deleted_at', null),
      ]);

      // Extract stats from RPC result
      const stats = statsResult.data as UserLeadsStatsResult | null;
      const leadsByStatus = stats?.leadsByStatus || {};
      const totalLeads = stats?.totalLeads || 0;

      // Combine and format activity items
      const activityItems: ActivityItem[] = [];

      if (recentHistoryResult.data) {
        for (const event of recentHistoryResult.data) {
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

      if (recentCommentsResult.data) {
        for (const comment of recentCommentsResult.data) {
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

      // Sort by date descending and limit to 10
      activityItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const recentActivity = activityItems.slice(0, 10);

      // Build leads trend
      const trendMap = new Map<string, { created: number; updated: number }>();

      if (createdLeadsResult.data) {
        for (const lead of createdLeadsResult.data) {
          const date = new Date(lead.created_at).toISOString().split('T')[0];
          const existing = trendMap.get(date) || { created: 0, updated: 0 };
          existing.created += 1;
          trendMap.set(date, existing);
        }
      }

      if (updatedLeadsResult.data) {
        for (const lead of updatedLeadsResult.data) {
          const date = new Date(lead.updated_at).toISOString().split('T')[0];
          const existing = trendMap.get(date) || { created: 0, updated: 0 };
          existing.updated += 1;
          trendMap.set(date, existing);
        }
      }

      // Convert to array and fill missing dates
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

      // Calculate active and won leads
      const activeLeads =
        (leadsByStatus['rdv'] || 0) +
        (leadsByStatus['contacted'] || 0) +
        (leadsByStatus['qualified'] || 0);
      const wonLeads = leadsByStatus['won'] || 0;

      return {
        stats: {
          leads: {
            total: totalLeads,
            byStatus: leadsByStatus,
          },
          commentsCount: 0, // Not needed for sales dashboard
          lastActivity: null,
        },
        recentActivity,
        leadsTrend,
        activeLeads,
        wonLeads,
      };
    },
    CACHE_TTL.DASHBOARD
  );
}

/**
 * Get dashboard data for admin users
 * Optimized with:
 * - Redis caching (60s TTL)
 * - SQL aggregation via RPC (instead of fetching 290k rows)
 * - Parallel queries with Promise.all()
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use caching for admin dashboard data
  return getCached(
    CACHE_KEYS.DASHBOARD_ADMIN,
    async () => {
      const sevenDaysAgo = getSevenDaysAgo();
      const oneMonthAgo = getOneMonthAgo();
      const thirtyDaysAgo = getThirtyDaysAgo();

      // Parallel fetch - all queries run at once
      // Optimized: Uses RPC for team performance (replaces fetching 100k+ rows)
      const [
        statsResult,
        totalLeadsLastMonthResult,
        totalUsersResult,
        recentImportsResult,
        importActivityResult,
        recentActivityResult,
        createdLeadsResult,
        teamPerformanceResult,
      ] = await Promise.all([
        // Use RPC for efficient stats (replaces fetching all 290k rows)
        supabase.rpc('get_leads_stats'),
        // Total leads from last month (for trend calculation)
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .lt('created_at', oneMonthAgo),
        // Total sales users
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'sales'),
        // Recent imports count
        supabase
          .from('import_jobs')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', sevenDaysAgo),
        // Import activity (last 10)
        supabase
          .from('import_jobs')
          .select('id, created_at, file_name, status, valid_rows, invalid_rows, imported_rows, total_rows')
          .order('created_at', { ascending: false })
          .limit(10),
        // Recent activity (last 20 history events)
        supabase
          .from('lead_history')
          .select(`
            id,
            created_at,
            event_type,
            lead_id,
            actor_id,
            leads!inner(id, first_name, last_name, status),
            profiles!lead_history_actor_id_profiles_id_fk(id, display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(20),
        // Created leads for trend (last 30 days)
        supabase
          .from('leads')
          .select('created_at, assigned_to')
          .gte('created_at', thirtyDaysAgo)
          .is('deleted_at', null),
        // Team performance via RPC (replaces fetching all assigned leads)
        supabase.rpc('get_team_performance'),
      ]);

      // Extract stats from RPC result
      const stats = statsResult.data as LeadsStatsResult | null;
      const totalLeads = stats?.totalLeads || 0;
      const leadsByStatus = stats?.leadsByStatus || {};
      const activeSales = stats?.activeSalesCount || 0;
      const unassignedLeads = stats?.unassignedCount || 0;

      // Transform team performance RPC result
      const teamPerformance: TeamPerformanceItem[] = (
        (teamPerformanceResult.data as TeamPerformanceRpcResult[]) || []
      ).map((row) => ({
        userId: row.user_id,
        userName: row.user_name || 'Inconnu',
        totalLeads: Number(row.total_leads),
        wonLeads: Number(row.won_leads),
        conversionRate:
          row.total_leads > 0 ? Math.round((row.won_leads / row.total_leads) * 100) : 0,
      }));

      // Format import activity
      const importActivity: ImportActivityItem[] =
        importActivityResult.data?.map((job) => ({
          id: job.id,
          date: job.created_at,
          fileName: job.file_name,
          status: job.status,
          validRows: job.valid_rows || 0,
          invalidRows: job.invalid_rows || 0,
          importedRows: job.imported_rows || 0,
          totalRows: job.total_rows || 0,
        })) || [];

      // Build leads trend
      const trendMap = new Map<string, { created: number; assigned: number }>();

      if (createdLeadsResult.data) {
        for (const lead of createdLeadsResult.data) {
          const date = new Date(lead.created_at).toISOString().split('T')[0];
          const existing = trendMap.get(date) || { created: 0, assigned: 0 };
          existing.created += 1;
          if (lead.assigned_to) {
            existing.assigned += 1;
          }
          trendMap.set(date, existing);
        }
      }

      // Convert to array and fill missing dates
      const leadsTrend: LeadsTrendPoint[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const data = trendMap.get(dateStr) || { created: 0, assigned: 0 };
        leadsTrend.push({
          date: dateStr,
          created: data.created,
          updated: 0, // Admin trend focuses on created/assigned
          assigned: data.assigned,
        });
      }

      // Format recent activity
      const recentActivity: ActivityItem[] =
        recentActivityResult.data?.map((event) => {
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
        }) || [];

      return {
        totalLeads,
        totalLeadsLastMonth: totalLeadsLastMonthResult.count || 0,
        totalUsers: totalUsersResult.count || 0,
        recentImports: recentImportsResult.count || 0,
        activeSales,
        unassignedLeads,
        leadsByStatus,
        teamPerformance,
        importActivity,
        leadsTrend,
        recentActivity,
      };
    },
    CACHE_TTL.DASHBOARD
  );
}
