const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const baseHeaders = isSupabaseConfigured
  ? {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    }
  : {};

const parseResponse = async (response) => {
  if (!response.ok) {
    let message = `Supabase request failed with status ${response.status}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
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
      ...baseHeaders,
      ...headers,
    },
    body,
  });

  return parseResponse(response);
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
