# Dashboard Module Security & Test Fixes Plan

## Overview

Fix CRITICAL security issues in dashboard module and add test coverage.

---

## Issues to Fix

### CRITICAL 1: Admin-only server actions have no authorization checks

**Problem**: Functions like `getStatusChartData()`, `getAdminQuickStatsData()`, etc. are exported with `'use server'` and can be called directly by any authenticated user (including sales). The `get_leads_stats` RPC is `SECURITY DEFINER`, bypassing RLS.

**Solution**: Add a helper function `getAdminDataOrEmpty<T>()` that checks if the current user is admin and returns empty data if not.

**Files to modify**:
- `modules/dashboard/lib/actions.ts`

**Implementation**:
```typescript
// Add at top of actions.ts after imports
import { getCurrentUser } from '@/modules/auth';
import { isAdmin } from '@/modules/auth/lib/utils';

/**
 * Helper for admin-only data fetching
 * Returns empty data if user is not admin (security guard for server actions)
 */
async function requireAdminForData<T>(emptyValue: T): Promise<{ isAdmin: true } | { isAdmin: false; value: T }> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return { isAdmin: false, value: emptyValue };
  }
  return { isAdmin: true };
}
```

Then wrap each admin function:
```typescript
export async function getAdminQuickStatsData(): Promise<AdminQuickStatsData> {
  const auth = await requireAdminForData<AdminQuickStatsData>({
    totalUsers: 0, recentImports: 0, activeSales: 0, wonLeads: 0
  });
  if (!auth.isAdmin) return auth.value;

  // ... rest of function
}
```

**Functions to update**:
1. `getAdminWelcomeData()` - empty: `{ totalLeads: 0, trendPercentage: 0 }`
2. `getAdminQuickStatsData()` - empty: `{ totalUsers: 0, recentImports: 0, activeSales: 0, wonLeads: 0 }`
3. `getStatusChartData()` - empty: `{ leadsByStatus: {}, totalLeads: 0 }`
4. `getTeamPerformanceData()` - empty: `{ teamPerformance: [], unassignedLeads: 0, totalLeads: 0 }`
5. `getImportActivityData()` - empty: `[]`
6. `getAdminTrendData()` - empty: `[]`
7. `getAdminRecentActivityData()` - empty: `[]`
8. `getAdminDashboardData()` - empty: `null`

---

### CRITICAL 2: RPC `get_user_leads_stats` allows stats enumeration

**Problem**: Any user can call `supabase.rpc('get_user_leads_stats', { target_user_id: 'other-user-id' })` and get another user's stats.

**Solution**: Add validation in the SQL function to ensure caller can only query their own stats (or is admin).

**Database migration**:
```sql
-- Migration: secure_get_user_leads_stats

CREATE OR REPLACE FUNCTION public.get_user_leads_stats(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Security check: only allow querying own stats, unless admin
  IF target_user_id != auth.uid() AND get_user_role() != 'admin' THEN
    RETURN json_build_object('totalLeads', 0, 'leadsByStatus', '{}'::json);
  END IF;

  RETURN (
    SELECT json_build_object(
      'totalLeads', (
        SELECT COUNT(*)
        FROM leads
        WHERE assigned_to = target_user_id
        AND deleted_at IS NULL
      ),
      'leadsByStatus', (
        SELECT COALESCE(json_object_agg(status, cnt), '{}'::json)
        FROM (
          SELECT status, COUNT(*) as cnt
          FROM leads
          WHERE assigned_to = target_user_id
          AND deleted_at IS NULL
          GROUP BY status
        ) s
      )
    )
  );
END;
$$;
```

---

### MAJOR: Remove legacy monolithic functions

**Problem**: `getSalesDashboardData()` and `getAdminDashboardData()` are duplicates of section-specific functions.

**Solution**:
1. Check if they're used anywhere
2. If not used, remove them entirely
3. If used, mark as `@deprecated` and add TODO comment

**Files to modify**:
- `modules/dashboard/lib/actions.ts` - remove lines 502-871
- `modules/dashboard/index.ts` - remove exports

---

### MAJOR: Remove legacy dashboard view components

**Problem**: `AdminDashboardView` and `SalesDashboardView` are unused client components.

**Solution**:
1. Verify they're not imported anywhere
2. Delete the files
3. Remove exports from index.ts

**Files to delete**:
- `modules/dashboard/views/admin-dashboard-view.tsx`
- `modules/dashboard/views/sales-dashboard-view.tsx`

**Files to modify**:
- `modules/dashboard/index.ts` - remove exports

---

## Tests to Add

### Test file: `modules/dashboard/__tests__/actions.test.ts`

Test cases:
1. **Authorization tests** (most important):
   - `getAdminQuickStatsData()` returns empty for sales user
   - `getStatusChartData()` returns empty for sales user
   - `getTeamPerformanceData()` returns empty for sales user
   - `getImportActivityData()` returns empty for sales user
   - Admin functions return data for admin user

2. **Sales-specific functions**:
   - `getSalesWelcomeData()` returns data for authenticated user
   - `getSalesQuickStatsData()` returns stats for current user
   - `getSalesStatusChartData()` returns data for current user
   - `getSalesActivityData()` returns only user's activity
   - `getSalesTrendData()` returns trend for assigned leads

3. **Edge cases**:
   - Unauthenticated user returns empty/null
   - Empty database returns zeros, not errors

**Test structure** (following existing patterns from `modules/auth/__tests__/actions.test.ts`):
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock next modules
vi.mock('next/navigation', ...);
vi.mock('next/cache', ...);

// Mock Supabase
const mockSupabaseAuth = { getUser: vi.fn() };
const mockSupabaseRpc = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve({
    auth: mockSupabaseAuth,
    rpc: mockSupabaseRpc,
    from: mockSupabaseFrom,
  })),
}));

// Mock cache
vi.mock('@/lib/cache', () => ({
  getCached: vi.fn((key, fetcher) => fetcher()),
  CACHE_KEYS: { DASHBOARD_ADMIN: 'dashboard:admin', DASHBOARD_SALES: (id: string) => `dashboard:sales:${id}` },
  CACHE_TTL: { DASHBOARD: 60 },
}));

describe('Dashboard Server Actions', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('Admin Authorization', () => {
    it('getAdminQuickStatsData returns empty for sales user', async () => {
      // Setup: mock sales user
      // Assert: returns zeros
    });

    it('getAdminQuickStatsData returns data for admin user', async () => {
      // Setup: mock admin user
      // Assert: returns real data
    });
  });

  // ... more test groups
});
```

---

## Implementation Order

1. **Add helper function** `requireAdminForData()` to `actions.ts`
2. **Update all admin functions** to use the helper
3. **Write tests** to verify authorization works
4. **Apply database migration** to secure `get_user_leads_stats`
5. **Verify legacy functions are unused**, then remove them
6. **Verify legacy views are unused**, then delete them
7. **Run full test suite** to ensure nothing broke

---

## Files Changed Summary

| File | Action |
|------|--------|
| `modules/dashboard/lib/actions.ts` | Add auth check, remove legacy functions |
| `modules/dashboard/index.ts` | Remove legacy exports |
| `modules/dashboard/__tests__/actions.test.ts` | Create (new) |
| `modules/dashboard/views/admin-dashboard-view.tsx` | Delete |
| `modules/dashboard/views/sales-dashboard-view.tsx` | Delete |
| Database migration | Secure `get_user_leads_stats` RPC |

---

## Verification

After implementation:
1. Run `npm run typecheck` - no errors
2. Run `npm test` - all tests pass
3. Manual test: log in as sales user, verify dashboard shows only their data
4. Verify admin dashboard still works correctly
