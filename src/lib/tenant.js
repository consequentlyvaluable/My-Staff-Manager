const STORAGE_KEY = "app.activeTenant";

const LOCALHOST_IDENTIFIERS = new Set([
  "localhost",
  "local",
  "127.0.0.1",
  "0.0.0.0",
]);

export const detectTenantSlugFromHost = (host) => {
  if (!host) return null;
  const sanitized = host.split(":")[0]?.trim().toLowerCase();
  if (!sanitized) return null;

  const parts = sanitized.split(".").filter(Boolean);
  if (parts.length === 0) return null;

  if (parts.length === 1) return null;

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];

  if (LOCALHOST_IDENTIFIERS.has(last) || LOCALHOST_IDENTIFIERS.has(secondLast)) {
    if (parts.length < 2) return null;
    return parts[0];
  }

  if (parts.length <= 2) return null;

  return parts[0];
};

export const detectTenantSlugFromLocation = () => {
  if (typeof window === "undefined") return null;
  return detectTenantSlugFromHost(window.location.host || "");
};

export const loadStoredTenant = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof parsed.id === "string" &&
      typeof parsed.slug === "string"
    ) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to load stored tenant", error);
    window.localStorage.removeItem(STORAGE_KEY);
  }
  return null;
};

export const storeActiveTenant = (tenant) => {
  if (typeof window === "undefined") return;
  if (!tenant || typeof tenant !== "object") {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    const payload = {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      primary_domain: tenant.primary_domain ?? null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist active tenant", error);
  }
};

export const clearStoredTenant = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};
