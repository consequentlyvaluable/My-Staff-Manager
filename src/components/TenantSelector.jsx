import { useMemo } from "react";

const toCleanString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeTenant = (tenant) => {
  if (!tenant) return null;

  const idCandidates = [tenant.id, tenant.tenant_id, tenant.value, tenant.slug];
  let id = "";
  for (const candidate of idCandidates) {
    const trimmed = toCleanString(candidate);
    if (trimmed) {
      id = trimmed;
      break;
    }
  }

  if (!id) return null;

  const nameSources = [
    tenant.name,
    tenant.label,
    tenant.display_name,
    tenant.tenant_name,
    tenant.slug,
  ];

  let name = "";
  for (const source of nameSources) {
    const trimmed = toCleanString(source);
    if (trimmed) {
      name = trimmed;
      break;
    }
  }

  return {
    id,
    name: name || id,
  };
};

export default function TenantSelector({
  tenants = [],
  activeTenantId = "",
  onTenantChange = () => {},
  loading = false,
  error = "",
}) {
  const normalizedTenants = useMemo(
    () =>
      (Array.isArray(tenants) ? tenants : [])
        .map(normalizeTenant)
        .filter(Boolean),
    [tenants]
  );

  const hasOptions = normalizedTenants.length > 0;
  const value = toCleanString(activeTenantId);

  const handleChange = (event) => {
    onTenantChange(event.target.value);
  };

  return (
    <div className="flex min-w-[190px] flex-col gap-1 text-left">
      <label
        htmlFor="tenant-selector"
        className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      >
        Team
      </label>
      <div className="relative">
        <select
          id="tenant-selector"
          value={hasOptions ? value : ""}
          onChange={handleChange}
          disabled={!hasOptions}
          className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-purple-400 dark:focus:ring-purple-500"
        >
          {!hasOptions && (
            <option value="" disabled>
              {loading ? "Loading..." : "No teams"}
            </option>
          )}
          {normalizedTenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
          {loading ? "⏳" : "▾"}
        </span>
      </div>
      {error && !loading && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
