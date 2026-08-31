-- 0011_portfolio_reads.sql — let an authorized cross-tenant principal read.
--
-- A ministry or regulator principal holds a governed portfolio across
-- tenants, so no single `app.tenant_id` can admit their scope. The contract's
-- answer is explicit: cross-tenant endpoints require a cross-tenant
-- capability, calculate an authorised resource set, and query only that set —
-- RLS is defence in depth, not the policy engine.
--
-- So the read policy gains one escape, and the app only ever sets
-- `app.portfolio` for a principal whose jurisdiction assignment actually
-- grants a platform portfolio. The real clipping stays in the authorized
-- mine-id set the query layer applies.
--
-- WITH CHECK is deliberately NOT relaxed. Reading across tenants is a
-- governed act; writing across them is not something this system permits at
-- all, and leaving the write half tenant-bound means a portfolio session
-- cannot create or modify another tenant's rows even by mistake.

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
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I
         USING (
           tenant_id = current_setting(''app.tenant_id'', true)
           OR current_setting(''app.portfolio'', true) = ''on''
         )
         WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true));',
      t || '_tenant_isolation', t);
  END LOOP;

  FOREACH t IN ARRAY shared_tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON %I
         USING (
           tenant_id IS NULL
           OR tenant_id = current_setting(''app.tenant_id'', true)
           OR current_setting(''app.portfolio'', true) = ''on''
         )
         WITH CHECK (
           tenant_id IS NULL
           OR tenant_id = current_setting(''app.tenant_id'', true)
         );',
      t || '_tenant_isolation', t);
  END LOOP;
END $$;
