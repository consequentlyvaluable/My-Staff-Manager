const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

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

const getAuthHeaders = () => {
  if (!isSupabaseConfigured) return {};
  const session = getStoredSession();
  if (session?.access_token) {
    return {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${session.access_token}`,
    };
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
    } catch (error) {
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

const request = async (path, { method = "GET", body, headers = {} } = {}) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...headers,
    },
    body,
  });

  return parseResponse(response);
};

export const getActiveSession = () => getStoredSession();

export const signInEmployee = async ({ email, password }) => {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const trimmedEmail = email?.trim().toLowerCase();
  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    body: JSON.stringify({ email: trimmedEmail, password }),
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
