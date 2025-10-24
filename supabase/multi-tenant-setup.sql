-- Multi-tenant schema and RLS policies for the Staff Manager app.
-- Run this script in the Supabase SQL editor (or via the Supabase CLI)
-- after the base schema has been created.

-- Required for gen_random_uuid().
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Core tenant tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_unique
  ON public.tenants (lower(slug))
  WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_name text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS tenant_memberships_user_idx
  ON public.tenant_memberships (user_id);

CREATE INDEX IF NOT EXISTS tenant_memberships_tenant_idx
  ON public.tenant_memberships (tenant_id);

-- ---------------------------------------------------------------------------
-- Existing application tables
-- ---------------------------------------------------------------------------

-- Records -------------------------------------------------------------------

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

ALTER TABLE public.records
  ADD CONSTRAINT records_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants (id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS records_tenant_idx
  ON public.records (tenant_id);

-- Employee roster -----------------------------------------------------------

ALTER TABLE public."Duferco Employees"
  ADD COLUMN IF NOT EXISTS tenant_id uuid;

ALTER TABLE public."Duferco Employees"
  ADD CONSTRAINT duferco_employees_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants (id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS duferco_employees_tenant_idx
  ON public."Duferco Employees" (tenant_id);

-- Optional: store the tenant on the profile table so it can be read from the
-- app metadata when the session is restored.
ALTER TABLE public.employee_profiles
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Row-Level Security policies
-- ---------------------------------------------------------------------------

-- Enable RLS on every table that the client can query directly.
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Duferco Employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Helper policy condition reused below:
--   The authenticated user must belong to the tenant referenced by the row.
-- This condition is duplicated on each table to keep policies simple.

-- Records -------------------------------------------------------------------

DROP POLICY IF EXISTS "Tenant members can read records" ON public.records;
CREATE POLICY "Tenant members can read records"
  ON public.records
  FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public.records.tenant_id
        AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant members can insert records" ON public.records;
CREATE POLICY "Tenant members can insert records"
  ON public.records
  FOR INSERT
  WITH CHECK (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public.records.tenant_id
        AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant members can update records" ON public.records;
CREATE POLICY "Tenant members can update records"
  ON public.records
  FOR UPDATE
  USING (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public.records.tenant_id
        AND tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public.records.tenant_id
        AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Tenant members can delete records" ON public.records;
CREATE POLICY "Tenant members can delete records"
  ON public.records
  FOR DELETE
  USING (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public.records.tenant_id
        AND tm.user_id = auth.uid()
    )
  );

-- Duferco Employees ---------------------------------------------------------

DROP POLICY IF EXISTS "Tenant members can read employees" ON public."Duferco Employees";
CREATE POLICY "Tenant members can read employees"
  ON public."Duferco Employees"
  FOR SELECT
  USING (
    tenant_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public."Duferco Employees".tenant_id
        AND tm.user_id = auth.uid()
    )
  );

-- Tenant memberships --------------------------------------------------------

DROP POLICY IF EXISTS "Users can read their memberships" ON public.tenant_memberships;
CREATE POLICY "Users can read their memberships"
  ON public.tenant_memberships
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access to memberships" ON public.tenant_memberships;
CREATE POLICY "Service role full access to memberships"
  ON public.tenant_memberships
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Tenants -------------------------------------------------------------------

DROP POLICY IF EXISTS "Tenant visibility limited to members" ON public.tenants;
CREATE POLICY "Tenant visibility limited to members"
  ON public.tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.tenant_memberships tm
      WHERE tm.tenant_id = public.tenants.id
        AND tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to tenants" ON public.tenants;
CREATE POLICY "Service role full access to tenants"
  ON public.tenants
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Seed helpers
-- ---------------------------------------------------------------------------

-- Example tenant records ----------------------------------------------------
-- Replace these with the teams that exist in your organisation.
INSERT INTO public.tenants (id, slug, name)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'engineering', 'Engineering'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'sales', 'Sales')
ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      slug = EXCLUDED.slug;

-- Map Supabase auth users to tenants. Replace the user_id values with the
-- UUIDs from the auth.users table for your project.
INSERT INTO public.tenant_memberships (user_id, tenant_id, tenant_name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Engineering'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sales')
ON CONFLICT (user_id, tenant_id) DO UPDATE
  SET tenant_name = EXCLUDED.tenant_name;

-- Assign employees to a tenant. All 49 Duferco employees are mapped here to
-- the Engineering tenant as an example; split them between tenants as needed.
UPDATE public."Duferco Employees"
SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
WHERE tenant_id IS DISTINCT FROM 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Ensure existing booking records are associated with a tenant so they remain
-- visible once RLS is enabled.
UPDATE public.records
SET tenant_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
WHERE tenant_id IS NULL;
