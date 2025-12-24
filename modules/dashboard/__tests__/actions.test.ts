import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase client
const mockSupabaseAuth = {
  getUser: vi.fn(),
};

const mockSupabaseRpc = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() =>
    Promise.resolve({
      auth: mockSupabaseAuth,
      rpc: mockSupabaseRpc,
      from: mockSupabaseFrom,
    })
  ),
}));

// Mock cache - bypass caching for tests
vi.mock('@/lib/cache', () => ({
  getCached: vi.fn((key, fetcher) => fetcher()),
  CACHE_KEYS: {
    DASHBOARD_ADMIN: 'dashboard:admin',
    DASHBOARD_SALES: (id: string) => `dashboard:sales:${id}`,
  },
  CACHE_TTL: { DASHBOARD: 60 },
}));

// Mock auth module
const mockGetCurrentUser = vi.fn();
vi.mock('@/modules/auth', () => ({
  getCurrentUser: () => mockGetCurrentUser(),
}));

// Mock auth utils
vi.mock('@/modules/auth/lib/utils', () => ({
  isAdmin: vi.fn((user) => user?.profile?.role === 'admin'),
}));

// Import after mocks are set up
import {
  getAdminWelcomeData,
  getAdminQuickStatsData,
  getStatusChartData,
  getTeamPerformanceData,
  getImportActivityData,
  getAdminTrendData,
  getAdminRecentActivityData,
  getSalesWelcomeData,
  getSalesQuickStatsData,
  getSalesStatusChartData,
  getSalesActivityData,
  getSalesTrendData,
} from '../lib/actions';

// Helper to create mock users
const createMockUser = (role: 'admin' | 'sales') => ({
  id: 'user-123',
  email: 'test@crm.local',
  profile: {
    id: 'user-123',
    displayName: 'Test User',
    role,
    avatar: null,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
});

describe('Dashboard Server Actions - Authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Supabase mocks
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  describe('Admin-only functions return empty for non-admins', () => {
    beforeEach(() => {
      // Mock as sales user
      mockGetCurrentUser.mockResolvedValue(createMockUser('sales'));
    });

    it('getAdminWelcomeData returns empty for sales user', async () => {
      const result = await getAdminWelcomeData();
      expect(result).toEqual({ totalLeads: 0, trendPercentage: 0 });
    });

    it('getAdminQuickStatsData returns empty for sales user', async () => {
      const result = await getAdminQuickStatsData();
      expect(result).toEqual({
        totalUsers: 0,
        unassignedLeads: 0,
        activeSales: 0,
        wonLeads: 0,
      });
    });

    it('getStatusChartData returns empty for sales user', async () => {
      const result = await getStatusChartData();
      expect(result).toEqual({ leadsByStatus: {}, totalLeads: 0 });
    });

    it('getTeamPerformanceData returns empty for sales user', async () => {
      const result = await getTeamPerformanceData();
      expect(result).toEqual({
        teamPerformance: [],
        unassignedLeads: 0,
        totalLeads: 0,
      });
    });

    it('getImportActivityData returns empty for sales user', async () => {
      const result = await getImportActivityData();
      expect(result).toEqual([]);
    });

    it('getAdminTrendData returns empty for sales user', async () => {
      const result = await getAdminTrendData();
      expect(result).toEqual([]);
    });

    it('getAdminRecentActivityData returns empty for sales user', async () => {
      const result = await getAdminRecentActivityData();
      expect(result).toEqual([]);
    });
  });

  describe('Admin-only functions return empty for unauthenticated', () => {
    beforeEach(() => {
      // Mock as unauthenticated
      mockGetCurrentUser.mockResolvedValue(null);
    });

    it('getAdminWelcomeData returns empty for unauthenticated user', async () => {
      const result = await getAdminWelcomeData();
      expect(result).toEqual({ totalLeads: 0, trendPercentage: 0 });
    });

    it('getStatusChartData returns empty for unauthenticated user', async () => {
      const result = await getStatusChartData();
      expect(result).toEqual({ leadsByStatus: {}, totalLeads: 0 });
    });
  });

  describe('Admin functions work for admin users', () => {
    beforeEach(() => {
      // Mock as admin user
      mockGetCurrentUser.mockResolvedValue(createMockUser('admin'));
    });

    it('getStatusChartData fetches data for admin via RPC', async () => {
      // Mock RPC to return actual data
      mockSupabaseRpc.mockResolvedValue({
        data: { totalLeads: 500, leadsByStatus: { won: 100, lost: 50 } },
        error: null,
      });

      const result = await getStatusChartData();

      // Admin should get real data, not empty
      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_leads_stats');
      expect(result.totalLeads).toBe(500);
      expect(result.leadsByStatus).toEqual({ won: 100, lost: 50 });
    });

    it('getTeamPerformanceData fetches data for admin via RPC', async () => {
      // Mock RPC calls
      mockSupabaseRpc
        .mockResolvedValueOnce({
          data: { totalLeads: 1000, unassignedCount: 100 },
          error: null,
        })
        .mockResolvedValueOnce({
          data: [{ user_id: '1', user_name: 'Alice', total_leads: 200, won_leads: 50 }],
          error: null,
        });

      const result = await getTeamPerformanceData();

      expect(result.totalLeads).toBe(1000);
      expect(result.unassignedLeads).toBe(100);
      expect(result.teamPerformance).toHaveLength(1);
      expect(result.teamPerformance[0].userName).toBe('Alice');
    });
  });
});

describe('Dashboard Server Actions - Sales functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sales functions return empty for unauthenticated', () => {
    beforeEach(() => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });
    });

    it('getSalesWelcomeData returns empty for unauthenticated', async () => {
      const result = await getSalesWelcomeData();
      expect(result).toEqual({ totalLeads: 0, trendPercentage: 0 });
    });

    it('getSalesQuickStatsData returns empty for unauthenticated', async () => {
      const result = await getSalesQuickStatsData();
      expect(result).toEqual({
        totalLeads: 0,
        newLeads: 0,
        callbackLeads: 0,
        wonLeads: 0,
      });
    });

    it('getSalesStatusChartData returns empty for unauthenticated', async () => {
      const result = await getSalesStatusChartData();
      expect(result).toEqual({ leadsByStatus: {}, totalLeads: 0 });
    });

    it('getSalesActivityData returns empty for unauthenticated', async () => {
      const result = await getSalesActivityData();
      expect(result).toEqual([]);
    });

    it('getSalesTrendData returns empty for unauthenticated', async () => {
      const result = await getSalesTrendData();
      expect(result).toEqual([]);
    });
  });

  describe('Sales functions fetch data for authenticated user', () => {
    beforeEach(() => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: { id: 'sales-user-123' } },
        error: null,
      });
    });

    it('getSalesWelcomeData uses current user ID', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: { totalLeads: 50, leadsByStatus: { won: 10 } },
        error: null,
      });

      const result = await getSalesWelcomeData();

      expect(mockSupabaseRpc).toHaveBeenCalledWith('get_user_leads_stats', {
        target_user_id: 'sales-user-123',
      });
      expect(result.totalLeads).toBe(50);
    });

    it('getSalesQuickStatsData calculates stats correctly', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: {
          totalLeads: 100,
          leadsByStatus: {
            new: 12,
            callback: 5,
            relance: 3,
            deposit: 5,
          },
        },
        error: null,
      });

      const result = await getSalesQuickStatsData();

      expect(result.totalLeads).toBe(100);
      expect(result.newLeads).toBe(12);
      expect(result.callbackLeads).toBe(8); // callback + relance
      expect(result.wonLeads).toBe(5);
    });
  });
});

describe('Dashboard Server Actions - Edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty RPC response gracefully', async () => {
    mockGetCurrentUser.mockResolvedValue(createMockUser('admin'));
    mockSupabaseRpc.mockResolvedValue({
      data: null,
      error: null,
    });

    const result = await getStatusChartData();

    expect(result).toEqual({ leadsByStatus: {}, totalLeads: 0 });
  });

  it('handles empty database for sales user', async () => {
    mockSupabaseAuth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockSupabaseRpc.mockResolvedValue({
      data: { totalLeads: 0, leadsByStatus: {} },
      error: null,
    });

    const result = await getSalesQuickStatsData();

    expect(result).toEqual({
      totalLeads: 0,
      newLeads: 0,
      callbackLeads: 0,
      wonLeads: 0,
    });
  });
});
