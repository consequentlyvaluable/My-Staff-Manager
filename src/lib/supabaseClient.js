const DEFAULT_SUPABASE_URL = "https://qbjsccnnkwbrytywvruw.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianNjY25ua3dicnl0eXd2cnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI5OTMsImV4cCI6MjA3NjI3ODk5M30.J4qLO8w4kkO1V2B0PibVhWuOBROxsUzLcCUPMhvwFXU";

const envSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const envSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const hasEnvSupabaseConfig = Boolean(envSupabaseUrl && envSupabaseAnonKey);

const supabaseUrl = hasEnvSupabaseConfig ? envSupabaseUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = hasEnvSupabaseConfig
  ? envSupabaseAnonKey
  : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const TENANT_EMPLOYEES_TABLE = "tenant_employees";

const baseHeaders = isSupabaseConfigured
  ? {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    }
  : {};

const SESSION_STORAGE_KEY = "supabase.session";
let cachedSession = null;

const getStoredSession = () => {
  if (cachedSession) return cachedSession;
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    cachedSession = JSON.parse(raw);
    return cachedSession;
  } catch (error) {
    console.warn("Failed to parse stored Supabase session", error);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

const persistSession = (session) => {
  cachedSession = session ?? null;
  if (typeof window === "undefined") return;

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.warn("Failed to persist Supabase session", error);
  }
};

const SESSION_REFRESH_BUFFER_MS = 60 * 1000; // refresh one minute before expiry

const shouldRefreshSession = (session) => {
  if (!session?.access_token) return false;
  if (!session?.expires_at) return false;
  const expiresAtMs = session.expires_at * 1000;
  return Date.now() >= expiresAtMs - SESSION_REFRESH_BUFFER_MS;
};

const refreshSession = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Supabase session expired and cannot be refreshed.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const session = await parseResponse(response);
  if (!session?.user || !session?.access_token) {
    throw new Error("Invalid refresh response from Supabase.");
  }

  persistSession(session);
  return session;
};

const ensureActiveSession = async () => {
  const session = getStoredSession();
  if (!session) return null;
  if (!shouldRefreshSession(session)) return session;

  try {
    return await refreshSession(session.refresh_token);
  } catch (error) {
    persistSession(null);
    throw error;
  }
};

const getAuthHeaders = async () => {
  if (!isSupabaseConfigured) return {};

  try {
    const session = await ensureActiveSession();
    if (session?.access_token) {
      return {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      };
    }
  } catch (error) {
    console.warn("Failed to refresh Supabase session", error);
  }

  return baseHeaders;
};

const parseResponse = async (response) => {
  if (!response.ok) {
    let message = `Supabase request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      } else if (errorBody?.error_description) {
        message = errorBody.error_description;
      } else if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return null;
};

const tryRefreshSession = async () => {
  const session = getStoredSession();
  if (!session?.refresh_token) return null;

  try {
    return await refreshSession(session.refresh_token);
  } catch (error) {
    console.warn("Supabase session refresh failed", error);
    persistSession(null);
    return null;
  }
};

const request = async (path, { method = "GET", body, headers = {} } = {}) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const buildHeaders = async () => ({
    "Content-Type": "application/json",
    ...(await getAuthHeaders()),
    ...headers,
  });

  let response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: await buildHeaders(),
    body,
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed?.access_token) {
      response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${refreshed.access_token}`,
          ...headers,
        },
        body,
      });
    }
  }

  return parseResponse(response);
};

const rpc = async (functionName, args = {}, { method = "POST", headers = {} } = {}) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const invoke = async (headersOverride) =>
    fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headersOverride ?? (await getAuthHeaders())),
        ...headers,
      },
      body: JSON.stringify(args ?? {}),
    });

  let response = await invoke();

  if (response.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed?.access_token) {
      response = await invoke({
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${refreshed.access_token}`,
        ...headers,
      });
    }
  }

  return parseResponse(response);
};

export const getActiveSession = () => getStoredSession();

export const restoreSession = async () => {
  if (!isSupabaseConfigured) return null;

  try {
    return await ensureActiveSession();
  } catch (error) {
    console.warn("Unable to restore Supabase session", error);
    return null;
  }
};

export const signInEmployee = async ({ email, password }) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  const trimmedPassword = password?.trim();
  if (!trimmedPassword) {
    throw new Error("Password is required.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
  });

  const session = await parseResponse(response);
  if (!session?.user) {
    throw new Error("Invalid authentication response from Supabase.");
  }

  persistSession(session);
  return session;
};

export const signOutEmployee = async () => {
  if (!isSupabaseConfigured) return;

  const session = getStoredSession();
  if (!session?.access_token) {
    persistSession(null);
    return;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  try {
    await parseResponse(response);
  } catch (error) {
    // Logout should not block local cleanup. Log and continue.
    console.warn("Supabase logout returned an error", error);
  }

  persistSession(null);
};

const fetchProfileByPath = async (path) => {
  try {
    const data = await request(path);
    if (Array.isArray(data)) {
      return data[0] ?? null;
    }
    return data ?? null;
  } catch (error) {
    console.warn(`Failed to fetch profile via ${path}`, error);
    return null;
  }
};

export const fetchEmployeeProfile = async ({ userId, email, tenantId }) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const filters = [];
  if (tenantId) {
    filters.push(`tenant_id=eq.${encodeURIComponent(tenantId)}`);
  }

  const buildPath = (baseFilter) => {
    const params = new URLSearchParams();
    params.set(
      "select",
      "user_id,tenant_id,employee_label,display_name,email"
    );
    const combinedFilters = [...filters, baseFilter];
    const query = combinedFilters.join("&");
    return `employee_profiles?${query}&${params.toString()}`;
  };

  if (userId) {
    const profile = await fetchProfileByPath(
      buildPath(`user_id=eq.${encodeURIComponent(userId)}`)
    );
    if (profile) return profile;
  }

  if (email) {
    const profile = await fetchProfileByPath(
      buildPath(`email=eq.${encodeURIComponent(email.toLowerCase())}`)
    );
    if (profile) return profile;
  }

  return null;
};

export const fetchEmployees = async ({ tenantId } = {}) => {
  if (!tenantId) return [];
  const params = new URLSearchParams();
  params.set("select", "label,sort_order");
  params.append("order", "sort_order.asc");
  params.append("order", "label.asc");

  const data = await request(
    `${TENANT_EMPLOYEES_TABLE}?tenant_id=eq.${encodeURIComponent(
      tenantId
    )}&${params.toString()}`
  );

  if (!Array.isArray(data)) {
    return [];
  }

  const normalizeOrder = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : Number.POSITIVE_INFINITY;
  };

  const sorted = [...data].sort((a, b) => {
    const orderDelta = normalizeOrder(a?.sort_order) - normalizeOrder(b?.sort_order);
    if (orderDelta !== 0) return orderDelta;
    const aLabel = typeof a?.label === "string" ? a.label : "";
    const bLabel = typeof b?.label === "string" ? b.label : "";
    return aLabel.localeCompare(bLabel);
  });

  return sorted
    .map((row) => (typeof row?.label === "string" ? row.label.trim() : ""))
    .filter((label) => label.length > 0);
};

export const fetchRecords = async ({ tenantId } = {}) => {
  if (!tenantId) return [];
  const params = new URLSearchParams({ select: "*", order: "start.asc" });
  const data = await request(
    `records?tenant_id=eq.${encodeURIComponent(tenantId)}&${params.toString()}`
  );
  return Array.isArray(data) ? data : [];
};

export const createRecord = async (tenantId, record) => {
  if (!tenantId) {
    throw new Error("A tenant is required to create a record.");
  }
  const params = new URLSearchParams({ select: "*" });
  const data = await request(`records?${params.toString()}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ ...record, tenant_id: tenantId }),
  });
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
};

export const updateRecord = async (tenantId, id, record) => {
  if (!tenantId) {
    throw new Error("A tenant is required to update a record.");
  }
  const params = new URLSearchParams({ select: "*" });
  const data = await request(
    `records?tenant_id=eq.${encodeURIComponent(
      tenantId
    )}&id=eq.${encodeURIComponent(id)}&${params.toString()}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(record),
    }
  );
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
};

export const removeRecord = async (tenantId, id) => {
  if (!tenantId) {
    throw new Error("A tenant is required to delete a record.");
  }
  await request(
    `records?tenant_id=eq.${encodeURIComponent(
      tenantId
    )}&id=eq.${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
};

export const removeRecords = async (tenantId, ids) => {
  if (!tenantId || !ids.length) return;
  const quotedIds = ids.map((id) => `"${id}"`).join(",");
  await request(
    `records?tenant_id=eq.${encodeURIComponent(
      tenantId
    )}&id=in.(${quotedIds})`,
    {
      method: "DELETE",
    }
  );
};

const normalizeIdentifier = (value) => value?.trim().toLowerCase() ?? "";

const lookupTenantsViaMemberships = async (identifier) => {
  const params = new URLSearchParams();
  params.set(
    "select",
    "tenant:tenant_id(id,slug,name,primary_domain,is_active)"
  );
  params.append("identifier", `eq.${encodeURIComponent(identifier)}`);
  params.append("is_active", "is.true");
  params.append("tenant.is_active", "is.true");

  const rows = await request(`tenant_memberships?${params.toString()}`);
  if (!Array.isArray(rows)) return [];

  const unique = new Map();
  for (const row of rows) {
    const tenant = row?.tenant;
    if (!tenant?.id) continue;
    if (tenant.is_active === false) continue;
    if (unique.has(tenant.id)) continue;
    unique.set(tenant.id, {
      id: tenant.id,
      slug: typeof tenant.slug === "string" ? tenant.slug : null,
      name: typeof tenant.name === "string" ? tenant.name : tenant.slug,
      primary_domain:
        typeof tenant.primary_domain === "string"
          ? tenant.primary_domain
          : null,
    });
  }

  return Array.from(unique.values()).filter((tenant) => tenant?.id);
};

const isLookupFunctionMissing = (message) => {
  if (typeof message !== "string") return false;
  const normalized = message.toLowerCase();
  return (
    normalized.includes("lookup_tenants") &&
    (normalized.includes("schema cache") ||
      normalized.includes("not found") ||
      normalized.includes("does not exist"))
  );
};

export const fetchTenantsForIdentifier = async (identifier) => {
  if (!isSupabaseConfigured) return [];
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return [];

  try {
    const result = await rpc("lookup_tenants", { identifier: normalized });
    if (!result) return [];
    if (Array.isArray(result)) return result;
    return [result].filter(Boolean);
  } catch (error) {
    console.warn("lookup_tenants RPC failed, attempting fallback", error);

    try {
      const fallbackTenants = await lookupTenantsViaMemberships(normalized);
      if (fallbackTenants.length > 0) {
        return fallbackTenants;
      }

      if (isLookupFunctionMissing(error?.message)) {
        throw new Error(
          "The company directory is still syncing. Run supabase/multi-tenant-setup.sql in Supabase and refresh the page."
        );
      }

      return [];
    } catch (fallbackError) {
      console.error("Tenant lookup fallback failed", fallbackError);

      if (fallbackError?.message) {
        throw new Error(fallbackError.message);
      }

      if (isLookupFunctionMissing(error?.message)) {
        throw new Error(
          "The company directory function is missing. Apply supabase/multi-tenant-setup.sql and try again."
        );
      }

      if (error?.message) {
        throw new Error(error.message);
      }

      throw new Error(
        "Unable to look up companies for this account. Please try again."
      );
    }
  }
};

export const fetchTenantBySlug = async (slug) => {
  if (!isSupabaseConfigured) return null;
  if (!slug) return null;
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return null;

  const params = new URLSearchParams();
  params.set("select", "id,slug,name,primary_domain,is_active");
  params.append("slug", `eq.${encodeURIComponent(trimmed)}`);
  params.append("is_active", "is.true");

  const rows = await request(`tenants?${params.toString()}`);
  if (Array.isArray(rows)) {
    return rows.find((row) => row?.slug === trimmed) ?? rows[0] ?? null;
  }
  return rows ?? null;
};

export const verifyTenantMembership = async ({
  tenantId,
  userId,
  identifier,
}) => {
  if (!isSupabaseConfigured) return false;
  if (!tenantId) return false;

  const params = new URLSearchParams();
  params.set("select", "id");
  params.append("tenant_id", `eq.${encodeURIComponent(tenantId)}`);
  params.append("is_active", "is.true");

  const orConditions = [];
  if (userId) {
    orConditions.push(`user_id.eq.${encodeURIComponent(userId)}`);
  }
  const normalizedIdentifier = normalizeIdentifier(identifier);
  if (normalizedIdentifier) {
    orConditions.push(
      `identifier.eq.${encodeURIComponent(normalizedIdentifier)}`
    );
  }

  let path = `tenant_memberships?${params.toString()}`;
  if (orConditions.length) {
    path += `&or=(${orConditions.join(",")})`;
  }

  const rows = await request(path);
  return Array.isArray(rows) ? rows.length > 0 : Boolean(rows);
};
