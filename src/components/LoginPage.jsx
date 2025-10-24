import { useEffect, useMemo, useState } from "react";

export default function LoginPage({
  onLogin,
  darkMode,
  onToggleDarkMode,
  tenantOptions = [],
  selectedTenant,
  onSelectTenant,
  onLookupTenants,
  tenantLookupLoading = false,
  tenantLookupError = "",
  tenantDetectionError = "",
  isTenantSelectionLocked = false,
  enforcedTenantSlug,
  enforcedTenantName,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof onLookupTenants !== "function") return;
    const trimmed = email.trim();
    if (trimmed.length < 3) {
      onLookupTenants("");
      return;
    }

    if (typeof window === "undefined") {
      onLookupTenants(trimmed);
      return;
    }

    const timeout = window.setTimeout(() => {
      onLookupTenants(trimmed);
    }, 400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [email, onLookupTenants]);

  const combinedTenantError = useMemo(() => {
    if (tenantLookupError && tenantDetectionError) {
      return `${tenantDetectionError} ${tenantLookupError}`;
    }
    return tenantDetectionError || tenantLookupError || "";
  }, [tenantDetectionError, tenantLookupError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email and password.");
      return;
    }

    if (!selectedTenant?.id) {
      setError("Please choose a company to sign in.");
      return;
    }

    setSubmitting(true);
    try {
      await onLogin({ email, password, tenant: selectedTenant });
    } catch (authError) {
      setError(authError.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-white to-purple-200 transition-colors duration-300 dark:from-gray-900 dark:via-gray-950 dark:to-purple-950">
      <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex w-full justify-end pb-6">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-white dark:bg-gray-800/80 dark:text-gray-200 dark:hover:bg-gray-800"
            aria-pressed={darkMode}
          >
            <span className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${darkMode ? "bg-purple-500" : "bg-gray-300"}`}>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-1"}`}
              />
            </span>
            <span>{darkMode ? "Dark" : "Light"} Mode</span>
          </button>
        </div>
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-purple-200/70 transition-colors duration-300 dark:bg-gray-900 dark:shadow-black/40">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-purple-800 dark:text-purple-200 whitespace-nowrap">
              Welcome to Offyse 🏢
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Sign in with your employee account to access the dashboard.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                User ID
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Enter your User ID"
              />
            </div>
            <div>
              <label
                htmlFor="tenant"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Company
              </label>
              <select
                id="tenant"
                name="tenant"
                value={selectedTenant?.id ?? ""}
                onChange={(event) => {
                  const nextId = event.target.value;
                  if (typeof onSelectTenant === "function") {
                    const nextTenant = tenantOptions.find(
                      (tenant) => tenant.id === nextId
                    );
                    onSelectTenant(nextTenant ?? null);
                  }
                }}
                disabled={
                  submitting ||
                  isTenantSelectionLocked ||
                  tenantOptions.length === 0
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {tenantOptions.length
                    ? "Select the company you want to access"
                    : "No companies available"}
                </option>
                {tenantOptions.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name || tenant.slug}
                  </option>
                ))}
              </select>
              {isTenantSelectionLocked && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {`This subdomain is locked to ${
                    enforcedTenantName || enforcedTenantSlug || "this company"
                  }.`}
                </p>
              )}
              {tenantLookupLoading && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Looking up companies for this account...
                </p>
              )}
              {combinedTenantError && (
                <p className="mt-2 rounded-lg bg-amber-50 px-4 py-2 text-xs text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                  {combinedTenantError}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                placeholder="Enter your Password"
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-200">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
