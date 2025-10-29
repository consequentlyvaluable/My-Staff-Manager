const DEFAULT_SUPABASE_URL = "https://qbjsccnnkwbrytywvruw.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFianNjY25ua3dicnl0eXd2cnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MDI5OTMsImV4cCI6MjA3NjI3ODk5M30.J4qLO8w4kkO1V2B0PibVhWuOBROxsUzLcCUPMhvwFXU";

const envSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const envSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const envSupabaseTenantId = (import.meta.env.VITE_SUPABASE_TENANT_ID || "").trim();

const hasEnvSupabaseConfig = Boolean(envSupabaseUrl && envSupabaseAnonKey);

const supabaseUrl = hasEnvSupabaseConfig ? envSupabaseUrl : DEFAULT_SUPABASE_URL;
const supabaseAnonKey = hasEnvSupabaseConfig
  ? envSupabaseAnonKey
  : DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const DUFERCO_EMPLOYEES_TABLE = "Duferco Employees";

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

  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...baseHeaders,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch (error) {
    throw new Error(
      `Unable to refresh Supabase session. ${error?.message || "Network request failed."}`
    );
  }

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

const base64UrlDecode = (value) => {
  if (typeof value !== "string" || !value) return null;

  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : normalized.padEnd(normalized.length + (4 - padding), "=");

  try {
    if (typeof atob === "function") {
      const binary = atob(padded);
      if (typeof TextDecoder === "function") {
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        return new TextDecoder().decode(bytes);
      }
      return binary;
    }
  } catch (error) {
    console.warn("Failed to decode base64 token with atob", error);
  }

  try {
    if (typeof Buffer !== "undefined") {
      return Buffer.from(padded, "base64").toString("utf-8");
    }
  } catch (error) {
    console.warn("Failed to decode base64 token with Buffer", error);
  }

  return null;
};

const decodeJwtPayload = (token) => {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) return null;
  try {
    return JSON.parse(decoded);
  } catch (error) {
    console.warn("Failed to parse JWT payload", error);
    return null;
  }
};

const TENANT_ID_KEYS = [
  "tenant_id",
  "tenantId",
  "tenant",
  "default_tenant_id",
  "defaultTenantId",
];

const normalizeTenantIdValue = (value) => {
  if (!value) return null;

  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized || null;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const normalized = normalizeTenantIdValue(entry);
      if (normalized) return normalized;
    }
    return null;
  }

  if (typeof value === "object") {
    for (const key of TENANT_ID_KEYS) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const normalized = normalizeTenantIdValue(value[key]);
        if (normalized) return normalized;
      }
    }
    // Sometimes metadata is a nested object like { tenants: [{ id: "..." }] }
    for (const entry of Object.values(value)) {
      const normalized = normalizeTenantIdValue(entry);
      if (normalized) return normalized;
    }
  }

  return null;
};

const extractTenantIdFromSession = (session) => {
  if (!session) return null;

  const fromMetadata =
    normalizeTenantIdValue(session.user?.app_metadata) ||
    normalizeTenantIdValue(session.user?.user_metadata);
  if (fromMetadata) return fromMetadata;

  const claims = decodeJwtPayload(session.access_token);
  const fromClaims =
    normalizeTenantIdValue(claims) ||
    normalizeTenantIdValue(claims?.app_metadata) ||
    normalizeTenantIdValue(claims?.user_metadata);
  if (fromClaims) return fromClaims;

  return null;
};

const ensureTenantScopedPayload = async (payload, { action = "perform this action" } = {}) => {
  if (payload?.tenant_id && `${payload.tenant_id}`.trim() !== "") {
    return payload;
  }

  if (!isSupabaseConfigured) {
    throw new Error(`Supabase is not configured. Unable to ${action}.`);
  }

  const session = await ensureActiveSession();
  if (!session) {
    throw new Error(`You must be signed in before you can ${action}.`);
  }

  const tenantId = envSupabaseTenantId || extractTenantIdFromSession(session);
  if (!tenantId) {
    throw new Error(
      "Authenticated session is missing a tenant context. Set VITE_SUPABASE_TENANT_ID or update the Supabase JWT claims."
    );
  }

  return { ...payload, tenant_id: String(tenantId).trim() };
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

  let response;
  try {
    response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
      method,
      headers: await buildHeaders(),
      body,
    });
  } catch (error) {
    throw new Error(
      `Unable to reach Supabase REST endpoint. ${error?.message || "Network request failed."}`
    );
  }

  if (response.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed?.access_token) {
      try {
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
      } catch (error) {
        throw new Error(
          `Unable to reach Supabase REST endpoint after refreshing the session. ${
            error?.message || "Network request failed."
          }`
        );
      }
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

  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...baseHeaders,
      },
      body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
    });
  } catch (error) {
    throw new Error(
      `Unable to contact Supabase authentication. ${error?.message || "Network request failed."}`
    );
  }

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

  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
    });
  } catch (error) {
    console.warn(
      "Supabase logout network request failed",
      error?.message || error
    );
    persistSession(null);
    return;
  }

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

export const fetchEmployeeProfile = async ({ userId, email }) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (userId) {
    const profile = await fetchProfileByPath(
      `employee_profiles?user_id=eq.${encodeURIComponent(userId)}&select=user_id,employee_label,display_name,email`
    );
    if (profile) return profile;
  }

  if (email) {
    const profile = await fetchProfileByPath(
      `employee_profiles?email=eq.${encodeURIComponent(email.toLowerCase())}&select=user_id,employee_label,display_name,email`
    );
    if (profile) return profile;
  }

  return null;
};

export const fetchEmployees = async () => {
  const params = new URLSearchParams();
  params.set("select", "label,sort_order");
  params.append("order", "sort_order.asc");
  params.append("order", "label.asc");

  const data = await request(
    `${encodeURIComponent(DUFERCO_EMPLOYEES_TABLE)}?${params.toString()}`
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

export const fetchRecords = async () => {
  const params = new URLSearchParams({ select: "*", order: "start.asc" });
  const data = await request(`records?${params.toString()}`);
  return Array.isArray(data) ? data : [];
};

export const createRecord = async (record) => {
  const payload = await ensureTenantScopedPayload({ ...record }, {
    action: "create a booking",
  });

  const params = new URLSearchParams({ select: "*" });
  const data = await request(`records?${params.toString()}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
};

export const updateRecord = async (id, record) => {
  const payload = await ensureTenantScopedPayload({ ...record }, {
    action: "update this booking",
  });

  const params = new URLSearchParams({ select: "*" });
  const data = await request(`records?id=eq.${id}&${params.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
};

export const removeRecord = async (id) => {
  await request(`records?id=eq.${id}`, {
    method: "DELETE",
  });
};

export const removeRecords = async (ids) => {
  if (!ids.length) return;
  const quotedIds = ids.map((id) => `"${id}"`).join(",");
  await request(`records?id=in.(${quotedIds})`, {
    method: "DELETE",
  });
};
