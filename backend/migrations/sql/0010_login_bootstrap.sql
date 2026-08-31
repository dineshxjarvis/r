-- 0010_login_bootstrap.sql — resolve a principal's tenant before RLS applies.
--
-- The bootstrap problem: `SET LOCAL app.tenant_id` is what makes RLS admit a
-- row, but at login we do not yet know the tenant — that is precisely what we
-- are trying to discover, and the `organization` row holding the answer is
-- itself tenant-protected. Reading it as the app role returns nothing, so the
-- session is created with a NULL tenant and every subsequent read is empty.
--
-- The fix is one SECURITY DEFINER function with a deliberately tiny surface:
-- it takes a person id, and returns a tenant id. It exposes no row, no name,
-- no other column, and it cannot be used to read across tenants because a
-- tenant id is the only thing it can ever return.
--
-- Everything else keeps going through RLS.

CREATE OR REPLACE FUNCTION resolve_login_tenant(p_person_id TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.tenant_id
  FROM affiliation a
  JOIN organization o ON o.id = a.organization_id
  WHERE a.person_id = p_person_id
    AND a.revoked_at IS NULL
    AND a.valid_from <= now()
    AND (a.valid_until IS NULL OR a.valid_until > now())
    AND o.tenant_id IS NOT NULL
    AND o.status = 'ACTIVE'
  ORDER BY a.valid_from DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION resolve_login_tenant(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_login_tenant(TEXT) TO strata_app;

-- Session resolution has the same shape of problem: `principal`, `person` and
-- `session` are not tenant-scoped, so they are readable, but the mine scope a
-- principal is entitled to must be computed before the tenant context exists.
-- This returns ids only, for the same reason.
CREATE OR REPLACE FUNCTION resolve_tenant_mines(p_tenant_id TEXT)
RETURNS TABLE (mine_id TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM mine WHERE tenant_id = p_tenant_id AND status <> 'CLOSED';
$$;

REVOKE ALL ON FUNCTION resolve_tenant_mines(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_tenant_mines(TEXT) TO strata_app;

CREATE OR REPLACE FUNCTION resolve_mines_by_state(p_state_codes TEXT[])
RETURNS TABLE (mine_id TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM mine WHERE state_code = ANY(p_state_codes) AND status <> 'CLOSED';
$$;

REVOKE ALL ON FUNCTION resolve_mines_by_state(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_mines_by_state(TEXT[]) TO strata_app;

-- A platform/portfolio principal reads unclipped by mine, so it needs the
-- full list before any tenant is selected.
CREATE OR REPLACE FUNCTION resolve_all_mines()
RETURNS TABLE (mine_id TEXT, tenant_id TEXT, name TEXT, code TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, tenant_id, name, code FROM mine WHERE status <> 'CLOSED';
$$;

REVOKE ALL ON FUNCTION resolve_all_mines() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION resolve_all_mines() TO strata_app;
