-- 0009_triggers_rls.sql — updated_at triggers, the strata_app role, grants,
-- and row-level security.
--
-- RLS is defence in depth, not the policy engine (identity-authority-model.md
-- §9). The app opens each request transaction with
--   SET LOCAL app.tenant_id = '<resolved tenant>'
-- from the RESOLVED PRINCIPAL, never from the request. Policies are the flat
-- column check — no recursive joins. current_setting(..., true) returns NULL
-- when unset, so an unset context fails closed.
--
-- The app connects as strata_app (LOGIN, NOBYPASSRLS). Never as postgres /
-- the service role — that silently disables every policy. Set the password
-- out of band:  ALTER ROLE strata_app PASSWORD '<secret>';
-- Supavisor must run in SESSION mode or SET LOCAL breaks.

-- === updated_at triggers: attach to every table that has the column ===
DO $$
DECLARE t RECORD;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN pg_tables p ON p.tablename = c.table_name AND p.schemaname = 'public'
    WHERE c.table_schema = 'public' AND c.column_name = 'updated_at'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON %I;
       CREATE TRIGGER %I BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      t.table_name || '_set_updated_at', t.table_name,
      t.table_name || '_set_updated_at', t.table_name);
  END LOOP;
END $$;

-- === application role ===
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'strata_app') THEN
    CREATE ROLE strata_app LOGIN NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO strata_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO strata_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO strata_app;

-- No DELETE anywhere by default — "no hard deletes" enforced by privilege,
-- not convention. The only deletable rows are operational scratch:
GRANT DELETE ON idempotency_key, upload, inbox_message TO strata_app;

-- Audit rows are insert-only for the application: no UPDATE path exists.
REVOKE UPDATE ON domain_audit_event, security_event, access_event,
  authorization_decision, inspection_decision, spatial_evaluation,
  metric_manifest FROM strata_app;

-- === row-level security ===
-- Applied where a flat tenant_id column exists. 'strict' = tenant_id NOT NULL;
-- 'shared' = NULL rows are platform defaults/catalogue visible to every tenant.
DO $$
DECLARE
  strict_tables TEXT[] := ARRAY[
    'mine', 'subunit', 'asset',
    'upload', 'document', 'extraction',
    'obligation', 'obligation_instance', 'obligation_conflict',
    'inspection', 'defect', 'observation', 'finding', 'capa',
    'evidence', 'evidence_verification_attempt',
    'governed_geometry', 'spatial_evaluation', 'map_composition_version',
    'notification', 'notification_delegate', 'signal_instance'
  ];
  shared_tables TEXT[] := ARRAY[
    'organization', 'extraction_triage_config', 'defect_ageing_band_config',
    'spatial_layer_definition', 'metric_manifest', 'ai_run',
    'break_glass_grant', 'operation', 'outbox_message'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY strict_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I
         USING (tenant_id = current_setting(''app.tenant_id'', true))
         WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true));',
      t || '_tenant_isolation', t);
  END LOOP;

  FOREACH t IN ARRAY shared_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I
         USING (tenant_id IS NULL OR tenant_id = current_setting(''app.tenant_id'', true))
         WITH CHECK (tenant_id IS NULL OR tenant_id = current_setting(''app.tenant_id'', true));',
      t || '_tenant_isolation', t);
  END LOOP;
END $$;

-- Cross-tenant portfolio reads (ministry/regulator) do NOT bypass RLS with a
-- privileged role. The authz layer computes the authorized mine/tenant set
-- and the kernel query path uses a dedicated policy context:
--   SET LOCAL app.tenant_id = '<each authorized tenant in turn>'
-- or a SECURITY DEFINER read function added when the portfolio views land.
-- An unrestricted inspector bypass is exactly what this schema refuses.
