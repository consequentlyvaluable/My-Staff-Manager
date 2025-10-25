-- Multi-tenant schema and policy setup for the Offyse application.
-- Run this script in your Supabase project's SQL editor (or via the CLI)
-- before deploying the updated frontend.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  primary_domain text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  identifier citext NOT NULL,
  role text NOT NULL DEFAULT 'member',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT tenant_memberships_identifier UNIQUE (tenant_id, identifier),
  CONSTRAINT tenant_memberships_user UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.tenant_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT tenant_employees_unique_label UNIQUE (tenant_id, label),
  CONSTRAINT tenant_employees_unique_sort UNIQUE (tenant_id, sort_order)
);

CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email citext,
  display_name text,
  employee_label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT employee_profiles_unique_user UNIQUE (tenant_id, user_id),
  CONSTRAINT employee_profiles_unique_email UNIQUE (tenant_id, email)
);

ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_records_tenant_id ON public.records (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_employees_tenant_id ON public.tenant_employees (tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_identifier ON public.tenant_memberships (identifier);
CREATE INDEX IF NOT EXISTS idx_employee_profiles_tenant_id ON public.employee_profiles (tenant_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenants_set_updated_at ON public.tenants;
CREATE TRIGGER tenants_set_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tenant_memberships_set_updated_at ON public.tenant_memberships;
CREATE TRIGGER tenant_memberships_set_updated_at
  BEFORE UPDATE ON public.tenant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tenant_employees_set_updated_at ON public.tenant_employees;
CREATE TRIGGER tenant_employees_set_updated_at
  BEFORE UPDATE ON public.tenant_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS employee_profiles_set_updated_at ON public.employee_profiles;
CREATE TRIGGER employee_profiles_set_updated_at
  BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS records_set_updated_at ON public.records;
CREATE TRIGGER records_set_updated_at
  BEFORE UPDATE ON public.records
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.is_active
      AND (
        tm.user_id = auth.uid() OR
        tm.identifier = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_tenant_member(uuid) TO authenticated;

DROP FUNCTION IF EXISTS public.lookup_tenants(text);

CREATE OR REPLACE FUNCTION public.lookup_tenants(identifier text)
RETURNS TABLE (
  id uuid,
  slug text,
  name text,
  primary_domain text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    t.slug,
    t.name,
    t.primary_domain
  FROM public.tenants t
  JOIN public.tenant_memberships tm
    ON tm.tenant_id = t.id
  WHERE t.is_active
    AND tm.is_active
    AND tm.identifier = identifier::citext
  ORDER BY t.name;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_tenants(text) TO anon, authenticated;

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenants are public" ON public.tenants;
CREATE POLICY "Tenants are public" ON public.tenants
  FOR SELECT
  TO anon, authenticated
  USING (is_active);

DROP POLICY IF EXISTS "Memberships self access" ON public.tenant_memberships;
CREATE POLICY "Memberships self access" ON public.tenant_memberships
  FOR SELECT
  TO authenticated
  USING (
    is_active AND (
      user_id = auth.uid() OR
      identifier = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS "Tenant employees visible" ON public.tenant_employees;
CREATE POLICY "Tenant employees visible" ON public.tenant_employees
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Employee profiles readable" ON public.employee_profiles;
CREATE POLICY "Employee profiles readable" ON public.employee_profiles
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Employee profiles manage self" ON public.employee_profiles;
CREATE POLICY "Employee profiles manage self" ON public.employee_profiles
  FOR UPDATE USING (
    public.is_tenant_member(tenant_id) AND user_id = auth.uid()
  )
  WITH CHECK (
    public.is_tenant_member(tenant_id) AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Tenant records select" ON public.records;
CREATE POLICY "Tenant records select" ON public.records
  FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Tenant records insert" ON public.records;
CREATE POLICY "Tenant records insert" ON public.records
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Tenant records update" ON public.records;
CREATE POLICY "Tenant records update" ON public.records
  FOR UPDATE
  TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "Tenant records delete" ON public.records;
CREATE POLICY "Tenant records delete" ON public.records
  FOR DELETE
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- Ensure PostgREST (and thus Supabase) reloads the function definitions immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;

-- Seed helpers -------------------------------------------------------------
-- Insert a tenant (replace the slug/name to suit your organisation):
-- INSERT INTO public.tenants (slug, name, primary_domain)
-- VALUES ('acme', 'Acme Corporation', 'acme.example.com')
-- ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, primary_domain = EXCLUDED.primary_domain;
--
-- Grant a user access to the tenant (identifier should match the login email):
-- INSERT INTO public.tenant_memberships (tenant_id, identifier, user_id, role)
-- VALUES (
--   (SELECT id FROM public.tenants WHERE slug = 'acme'),
--   'someone@acme.com',
--   (SELECT id FROM auth.users WHERE email = 'someone@acme.com'),
--   'admin'
-- )
-- ON CONFLICT (tenant_id, identifier) DO UPDATE SET is_active = true, role = EXCLUDED.role;
--
-- Copy existing roster entries into the per-tenant table:
-- INSERT INTO public.tenant_employees (tenant_id, label, sort_order)
-- SELECT
--   (SELECT id FROM public.tenants WHERE slug = 'acme') AS tenant_id,
--   label,
--   sort_order
-- FROM "Duferco Employees";
--
-- After seeding, update records and profiles so each row references the
-- appropriate tenant, then (optionally) enforce NOT NULL on tenant_id:
-- ALTER TABLE public.records ALTER COLUMN tenant_id SET NOT NULL;
-- ALTER TABLE public.employee_profiles ALTER COLUMN tenant_id SET NOT NULL;
