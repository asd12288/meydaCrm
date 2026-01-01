# Performance Audit Report

**Date:** 2025-01-27  
**Codebase:** Pulse CRM (Next.js 16 + Supabase)  
**Database Size:** ~290k leads

## Executive Summary

This audit identified **8 critical performance issues** and **5 optimization opportunities** that could lead to bottlenecks, slow queries, and poor user experience, especially as data grows.

---

## 🔴 Critical Issues (High Priority)

### 1. **N+1 Query Problem in Support Tickets** ⚠️ CRITICAL
**Location:** `modules/support/lib/actions.ts:177-193`

**Problem:**
```typescript
// Fetches tickets first
const { data, error, count } = await query;

// Then makes separate query for comment counts (N+1)
const ticketIds = (data || []).map((t: any) => t.id);
const { data: commentsData } = await supabase
  .from('support_ticket_comments')
  .select('ticket_id')
  .in('ticket_id', ticketIds);
```

**Impact:**
- For 20 tickets: 1 query + 1 additional query (acceptable)
- For 100+ tickets: 1 query + 1 large IN query (slower)
- Better: Use SQL aggregation with GROUP BY

**Fix:**
```typescript
// Use SQL aggregation instead
const { data: ticketsWithCounts } = await supabase
  .from('support_tickets')
  .select(`
    *,
    createdByProfile:profiles!support_tickets_created_by_fkey(id, display_name),
    commentCount:support_ticket_comments(count)
  `, { count: 'exact' })
  // ... filters
```

**Priority:** HIGH - Fix immediately

---

### 2. **Inefficient Team Performance Query** ⚠️ CRITICAL
**Location:** `modules/dashboard/lib/actions.ts:801-805`

**Problem:**
```typescript
// Fetches ALL assigned leads (could be 100k+ rows) just to count by user/status
supabase
  .from('leads')
  .select('assigned_to, status')
  .not('assigned_to', 'is', null)
  .is('deleted_at', null)
```

**Impact:**
- Fetches potentially 100k+ rows into memory
- Client-side aggregation (slow, memory-intensive)
- With 290k leads, this could fetch 200k+ rows
- No pagination or limits

**Fix:**
Create a database RPC function for aggregation:
```sql
CREATE OR REPLACE FUNCTION get_team_performance()
RETURNS TABLE (
  user_id uuid,
  user_name text,
  total_leads bigint,
  won_leads bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.assigned_to as user_id,
    p.display_name as user_name,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE l.status = 'won') as won_leads
  FROM leads l
  JOIN profiles p ON l.assigned_to = p.id
  WHERE l.assigned_to IS NOT NULL
    AND l.deleted_at IS NULL
  GROUP BY l.assigned_to, p.display_name
  ORDER BY total_leads DESC;
END;
$$ LANGUAGE plpgsql;
```

**Priority:** CRITICAL - This is a major bottleneck

---

### 3. **Missing Text Search Indexes** ⚠️ CRITICAL
**Location:** `modules/leads/lib/actions.ts:45-49`, `modules/support/lib/actions.ts:137-139`

**Problem:**
```typescript
// ILIKE queries without trigram indexes
query = query.or(
  `first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},company.ilike.${searchTerm}`
);
```

**Impact:**
- Full table scans on 290k rows for every search
- ILIKE with `%term%` (leading wildcard) cannot use B-tree indexes
- Searches become exponentially slower as data grows
- Mentioned in CLAUDE.md but not implemented

**Fix:**
Add PostgreSQL trigram indexes:
```sql
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fast text search
CREATE INDEX IF NOT EXISTS leads_first_name_trgm_idx 
  ON leads USING gin (first_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS leads_last_name_trgm_idx 
  ON leads USING gin (last_name gin_trgm_ops) 
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS leads_email_trgm_idx 
  ON leads USING gin (email gin_trgm_ops) 
  WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_company_trgm_idx 
  ON leads USING gin (company gin_trgm_ops) 
  WHERE deleted_at IS NULL;

-- For support tickets
CREATE INDEX IF NOT EXISTS support_tickets_subject_trgm_idx 
  ON support_tickets USING gin (subject gin_trgm_ops);

CREATE INDEX IF NOT EXISTS support_tickets_description_trgm_idx 
  ON support_tickets USING gin (description gin_trgm_ops);
```

**Priority:** CRITICAL - Search is a core feature

---

### 4. **Inefficient Ticket Counts Query** ⚠️ HIGH
**Location:** `modules/support/lib/actions.ts:335-373`

**Problem:**
```typescript
// Fetches ALL tickets just to count by status
const { data: statusCounts } = await supabase
  .from('support_tickets')
  .select('status');

// Client-side counting
statusCounts.forEach((ticket) => {
  counts[ticket.status]++;
});
```

**Impact:**
- Fetches all ticket rows (could be thousands)
- Unnecessary data transfer
- Client-side aggregation instead of SQL

**Fix:**
Use SQL aggregation:
```typescript
const { data: statusCounts } = await supabase
  .from('support_tickets')
  .select('status')
  .select('status', { count: 'exact', head: false });

// Or better: Use RPC function
const { data } = await supabase.rpc('get_ticket_counts_by_status');
```

Or create RPC:
```sql
CREATE OR REPLACE FUNCTION get_ticket_counts_by_status()
RETURNS TABLE (
  status text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    status::text,
    COUNT(*) as count
  FROM support_tickets
  GROUP BY status;
END;
$$ LANGUAGE plpgsql;
```

**Priority:** HIGH - Called frequently

---

### 5. **Large Data Fetching in Dashboard** ⚠️ MEDIUM
**Location:** `modules/dashboard/lib/actions.ts:795-805`

**Problem:**
```typescript
// Fetches ALL leads created in last 30 days for trend calculation
supabase
  .from('leads')
  .select('created_at, assigned_to')
  .gte('created_at', thirtyDaysAgo)
  .is('deleted_at', null)
```

**Impact:**
- Could fetch 10k+ rows for trend calculation
- Client-side date grouping
- Better: Use SQL date_trunc aggregation

**Fix:**
Use SQL aggregation:
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as created,
  COUNT(*) FILTER (WHERE assigned_to IS NOT NULL) as assigned
FROM leads
WHERE created_at >= $1
  AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date;
```

**Priority:** MEDIUM - Optimize when dashboard becomes slow

---

### 6. **Missing React.memo on Table Components** ⚠️ MEDIUM
**Location:** Multiple table components

**Problem:**
- `LeadsTable`, `UsersTable`, `TicketsTable` don't use `React.memo`
- Re-renders entire table on parent state changes
- Virtualization helps but memoization would prevent unnecessary re-renders

**Impact:**
- Unnecessary re-renders when filters change
- Re-rendering 20+ rows when only filter state changes
- Virtualization helps but memoization is still needed

**Fix:**
```typescript
export const LeadsTable = React.memo(function LeadsTable({ 
  leads, 
  isAdmin, 
  salesUsers 
}: LeadsTableProps) {
  // ... component code
});
```

**Priority:** MEDIUM - Improves UX responsiveness

---

### 7. **User List Filtering in Memory** ⚠️ MEDIUM
**Location:** `modules/users/lib/actions.ts:28-103`

**Problem:**
```typescript
// Fetches ALL users, then filters in memory
const { data: allUsers } = await supabase.rpc('get_users_with_auth');

// Client-side filtering
filteredUsers = filteredUsers.filter(
  (user) => user.display_name?.toLowerCase().includes(searchLower)
);
```

**Impact:**
- Acceptable for small user counts (< 100)
- Will become slow if user base grows
- Better: Move filtering to SQL

**Fix:**
Move search to RPC function or use Supabase query:
```typescript
if (filters?.search) {
  query = query.or(`display_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
}
```

**Priority:** MEDIUM - Monitor as user base grows

---

### 8. **Missing Composite Index for Common Queries** ⚠️ MEDIUM
**Location:** Database schema

**Problem:**
- Leads search often combines: `assigned_to + status + search`
- Current indexes are separate
- Missing composite index for common filter combinations

**Impact:**
- Database may not use optimal index
- Sequential scans on large result sets

**Fix:**
Add composite indexes for common query patterns:
```sql
-- For sales users: assigned_to + status + updated_at
CREATE INDEX IF NOT EXISTS leads_assigned_status_updated_idx 
  ON leads (assigned_to, status, updated_at DESC) 
  WHERE deleted_at IS NULL;

-- For admin: status + updated_at (when filtering by status)
CREATE INDEX IF NOT EXISTS leads_status_updated_idx 
  ON leads (status, updated_at DESC) 
  WHERE deleted_at IS NULL;
```

**Priority:** MEDIUM - Optimize query plans

---

## 🟡 Optimization Opportunities (Low Priority)

### 9. **Dashboard Caching TTL Too Short**
**Location:** `lib/cache/redis.ts:20`

**Current:** 60 seconds  
**Recommendation:** 120-300 seconds for dashboard (less frequently changing)

---

### 10. **Import Worker Batch Sizes**
**Location:** `modules/import/workers/commit-worker.ts`

**Current:** `FETCH_BATCH_SIZE` and `INSERT_BATCH_SIZE` are reasonable  
**Recommendation:** Monitor and adjust based on actual performance

---

### 11. **Missing Database Connection Pooling Tuning**
**Location:** `db/index.ts:15-21`

**Current:**
```typescript
max: 10,
idle_timeout: 20,
connect_timeout: 10,
```

**Recommendation:** Monitor connection pool usage and adjust based on load

---

### 12. **Support Ticket Search Without Index**
**Location:** `modules/support/lib/actions.ts:137-139`

Same issue as #3 - needs trigram indexes for `subject` and `description` fields.

---

### 13. **Lead History Query Optimization**
**Location:** `modules/dashboard/lib/actions.ts:781-793`

Fetches 20 recent history events with joins. Consider:
- Materialized view for recent activity
- Denormalized actor names in history table (if acceptable)

---

## 📊 Performance Metrics to Monitor

1. **Query Execution Time**
   - Dashboard queries (should be < 500ms)
   - Leads list queries (should be < 200ms)
   - Search queries (should be < 300ms)

2. **Database Load**
   - Connection pool usage
   - Slow query log (> 1 second)
   - Index usage statistics

3. **Frontend Performance**
   - Time to First Byte (TTFB)
   - Largest Contentful Paint (LCP)
   - React render times

---

## 🎯 Recommended Fix Order

1. **Fix #3 (Text Search Indexes)** - Highest impact, easy to implement
2. **Fix #2 (Team Performance Query)** - Major bottleneck
3. **Fix #1 (N+1 Query in Tickets)** - Common pattern
4. **Fix #4 (Ticket Counts)** - Frequently called
5. **Fix #6 (React.memo)** - Quick win for UX
6. **Fix #8 (Composite Indexes)** - Query optimization
7. **Fix #5 (Dashboard Trends)** - When dashboard becomes slow
8. **Fix #7 (User Filtering)** - When user base grows

---

## 🔧 Implementation Notes

### For Text Search Indexes:
- Requires `pg_trgm` extension (may need Supabase support to enable)
- GIN indexes are larger but much faster for ILIKE queries
- Consider full-text search (tsvector) for advanced search features

### For RPC Functions:
- Test thoroughly with large datasets
- Use EXPLAIN ANALYZE to verify query plans
- Consider materialized views for frequently accessed aggregations

### For React Optimization:
- Use React DevTools Profiler to verify improvements
- Test with realistic data volumes
- Monitor bundle size impact

---

## 📝 Next Steps

1. Create migration for text search indexes (#3)
2. Create RPC function for team performance (#2)
3. Refactor support tickets query (#1)
4. Add React.memo to table components (#6)
5. Monitor query performance after fixes
6. Set up database query monitoring

---

**End of Report**


