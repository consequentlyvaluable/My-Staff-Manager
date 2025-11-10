import { createClient } from "@supabase/supabase-js";

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

const supabaseAuthClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false,
      },
    })
  : null;

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

const createSessionFromAccessToken = async ({
  accessToken,
  refreshToken,
  expiresIn,
  tokenType,
}) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const user = await parseResponse(response);
  if (!user) {
    throw new Error("Supabase did not return a user for the provided token.");
  }

  const expiresInNumber = Number(expiresIn);
  const expiresInSeconds = Number.isFinite(expiresInNumber)
    ? expiresInNumber
    : 3600;

  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: tokenType || "bearer",
    expires_in: expiresInSeconds,
    expires_at: Math.round(Date.now() / 1000 + expiresInSeconds),
    user,
  };

  persistSession(session);
  return session;
};

const createSearchParams = (value) => {
  if (!value) return null;

  if (value instanceof URLSearchParams) {
    return value;
  }

  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/^[?#]/, "");
  if (!normalized) return null;

  return new URLSearchParams(normalized);
};

const mergeSearchParams = (...sources) => {
  const merged = new URLSearchParams();

  for (const source of sources) {
    const params = createSearchParams(source);
    if (!params) continue;

    for (const [key, value] of params.entries()) {
      if (!merged.has(key)) {
        merged.set(key, value);
      }
    }
  }

  return merged;
};

const extractFirstSessionLike = (value) => {
  if (!value || typeof value !== "object") return null;
  if (value.access_token) return value;
  if (value.session && typeof value.session === "object") {
    return extractFirstSessionLike(value.session);
  }
  if (value.data && typeof value.data === "object") {
    return extractFirstSessionLike(value.data);
  }
  return null;
};

const verifyOtpToken = async ({ token, type, email }) => {
  if (!token) {
    throw new Error("A Supabase OTP token is required to complete verification.");
  }

  if (!supabaseAuthClient) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const verificationType = type || "magiclink";

  const payload = email
    ? { email, token, type: verificationType }
    : { token_hash: token, type: verificationType };

  const { data, error } = await supabaseAuthClient.auth.verifyOtp(payload);
  if (error) {
    throw new Error(error.message || "Supabase rejected the provided token.");
  }

  const sessionLike = extractFirstSessionLike(data) || data?.session || null;
  if (!sessionLike?.access_token) {
    throw new Error("Supabase did not return an access token for the provided token.");
  }

  const session = {
    ...sessionLike,
    user: sessionLike.user || data?.user || null,
  };

  if (!session.user) {
    return createSessionFromAccessToken({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresIn: session.expires_in,
      tokenType: session.token_type,
    });
  }

  if (!session.expires_at && session.expires_in) {
    const expiresInNumber = Number(session.expires_in);
    if (Number.isFinite(expiresInNumber)) {
      session.expires_at = Math.round(Date.now() / 1000 + expiresInNumber);
    }
  }

  persistSession(session);
  return session;
};

export const completeAuthFromHash = async (hashFragment, searchQuery) => {
  if (!isSupabaseConfigured) return null;

  if (
    typeof hashFragment === "undefined" ||
    typeof searchQuery === "undefined"
  ) {
    if (typeof window === "undefined") return null;
    if (typeof hashFragment === "undefined") {
      hashFragment = window.location.hash;
    }
    if (typeof searchQuery === "undefined") {
      searchQuery = window.location.search;
    }
  }

  const params = mergeSearchParams(hashFragment, searchQuery);
  const eventType = params.get("type") || null;

  const accessToken = params.get("access_token");
  if (accessToken) {
    const refreshToken = params.get("refresh_token");
    const expiresIn = params.get("expires_in");
    const tokenType = params.get("token_type");

    const session = await createSessionFromAccessToken({
      accessToken,
      refreshToken,
      expiresIn,
      tokenType,
    });

    return { session, eventType };
  }

  const otpToken = params.get("token") || params.get("token_hash");
  if (!otpToken) return null;

  const email = params.get("email") || params.get("email_address");
  const session = await verifyOtpToken({
    token: otpToken,
    type: eventType,
    email,
  });
};

const verifyOtpToken = async ({ token, type, email }) => {
  if (!token) {
    throw new Error("A Supabase OTP token is required to complete verification.");
  }

  const payload = {
    type: type || "magiclink",
    token,
    token_hash: token,
  };

  if (email) {
    payload.email = email;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    body: JSON.stringify(payload),
  });

  const data = await parseResponse(response);
  return createSessionFromVerifyResponse(data);
};

export const completeAuthFromHash = async (hashFragment, searchQuery) => {
  if (!isSupabaseConfigured) return null;

  if (
    typeof hashFragment === "undefined" ||
    typeof searchQuery === "undefined"
  ) {
    if (typeof window === "undefined") return null;
    if (typeof hashFragment === "undefined") {
      hashFragment = window.location.hash;
    }
    if (typeof searchQuery === "undefined") {
      searchQuery = window.location.search;
    }
  }

  const params = mergeSearchParams(hashFragment, searchQuery);
  const eventType = params.get("type") || null;

  const accessToken = params.get("access_token");
  if (accessToken) {
    const refreshToken = params.get("refresh_token");
    const expiresIn = params.get("expires_in");
    const tokenType = params.get("token_type");

    const session = await createSessionFromAccessToken({
      accessToken,
      refreshToken,
      expiresIn,
      tokenType,
    });

    return { session, eventType };
  }

  const otpToken = params.get("token") || params.get("token_hash");
  if (!otpToken) return null;

  const email = params.get("email") || params.get("email_address");
  const session = await verifyOtpToken({
    token: otpToken,
    type: eventType,
    email,
  });

  return { session, eventType };
};

const authenticateWithPassword = async ({
  email,
  password,
  shouldPersistSession = true,
}) => {
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

  const response = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...baseHeaders,
      },
      body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
    }
  );

  const session = await parseResponse(response);
  if (!session?.user) {
    throw new Error("Invalid authentication response from Supabase.");
  }

  if (shouldPersistSession) {
    persistSession(session);
  }

  return session;
};

export const signInEmployee = async ({ email, password }) =>
  authenticateWithPassword({ email, password, shouldPersistSession: true });

export const verifyEmployeePassword = async ({ email, password }) =>
  authenticateWithPassword({
    email,
    password,
    shouldPersistSession: false,
  });

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

export const requestPasswordReset = async ({ email, redirectTo }) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  if (!supabaseAuthClient) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const { error } = await supabaseAuthClient.auth.resetPasswordForEmail(
    trimmedEmail,
    {
      redirectTo,
    }
  );

  if (error) {
    throw new Error(error.message || "Supabase could not send the reset email.");
  }
};

export const updateEmployeePassword = async ({ password }) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const trimmedPassword = password?.trim();
  if (!trimmedPassword) {
    throw new Error("New password is required.");
  }

  const session = getStoredSession();
  if (!session?.access_token) {
    throw new Error("You must be signed in to update your password.");
  }

  const performUpdate = async (accessToken) =>
    fetch(`${supabaseUrl}/auth/v1/user`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ password: trimmedPassword }),
    });

  let response = await performUpdate(session.access_token);

  if (response.status === 401) {
    const refreshed = await tryRefreshSession();
    if (refreshed?.access_token) {
      response = await performUpdate(refreshed.access_token);
    }
  }

  await parseResponse(response);
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
      `employee_profiles?user_id=eq.${encodeURIComponent(
        userId
      )}&select=*`
    );
    if (profile) return profile;
  }

  if (email) {
    const profile = await fetchProfileByPath(
      `employee_profiles?email=eq.${encodeURIComponent(
        email.toLowerCase()
      )}&select=*`
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
  const params = new URLSearchParams({ select: "*" });
  const data = await request(`records?${params.toString()}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(record),
  });
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }
  return data;
};

export const updateRecord = async (id, record) => {
  const params = new URLSearchParams({ select: "*" });
  const data = await request(`records?id=eq.${id}&${params.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(record),
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
