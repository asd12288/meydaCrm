-- Migration: Add RPC functions for efficient aggregations
-- These functions replace client-side aggregation of large datasets

-- Function: get_team_performance()
-- Replaces fetching 100k+ rows to count by user/status
-- Returns aggregated team performance stats in a single query
CREATE OR REPLACE FUNCTION public.get_team_performance()
RETURNS TABLE (
  user_id uuid,
  user_name text,
  total_leads bigint,
  won_leads bigint
)
LANGUAGE plpgsql
SECURITY INVOKER  -- Respects RLS
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.assigned_to as user_id,
    p.display_name as user_name,
    COUNT(*)::bigint as total_leads,
    COUNT(*) FILTER (WHERE l.status = 'won')::bigint as won_leads
  FROM leads l
  JOIN profiles p ON l.assigned_to = p.id
  WHERE l.assigned_to IS NOT NULL
    AND l.deleted_at IS NULL
  GROUP BY l.assigned_to, p.display_name
  ORDER BY total_leads DESC;
END;
$$;

-- Function: get_ticket_counts_by_status()
-- Replaces fetching all tickets to count by status
-- Returns count per status in a single aggregated query
CREATE OR REPLACE FUNCTION public.get_ticket_counts_by_status()
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER  -- Respects RLS
AS $$
  SELECT 
    status::text,
    COUNT(*)::bigint
  FROM support_tickets
  GROUP BY status;
$$;
