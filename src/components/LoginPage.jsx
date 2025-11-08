import { useEffect, useState } from "react";
import { isSupabaseConfigured, requestPasswordReset } from "../lib/supabaseClient";

export default function LoginPage({ onLogin, darkMode, onToggleDarkMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showResetPopover, setShowResetPopover] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  useEffect(() => {
    if (showResetPopover) {
      setResetEmail(email);
      setResetError("");
      setResetSuccess("");
    }
  }, [showResetPopover, email]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await onLogin({ email, password });
    } catch (authError) {
      setError(authError.message || "Unable to sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeResetPopover = () => {
    if (resetSubmitting) return;
    setShowResetPopover(false);
    setResetError("");
    setResetSuccess("");
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail.trim()) {
      setResetError("Please enter your email to reset your password.");
      return;
    }

    if (!isSupabaseConfigured) {
      setResetError(
        "Supabase is not configured. Please contact your administrator to reset your password."
      );
      return;
    }

    setResetSubmitting(true);

    try {
      const redirectTo =
        typeof window !== "undefined" ? window.location.origin : undefined;
      await requestPasswordReset({ email: resetEmail, redirectTo });
      setResetSuccess(
        "If your account exists, you'll receive an email with instructions to change your password."
      );
      setResetEmail("");
    } catch (resetError) {
      setResetError(
        resetError?.message ||
          "We couldn't process your request right now. Please try again later."
      );
    } finally {
      setResetSubmitting(false);
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
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowResetPopover(true)}
                className="text-sm font-medium text-purple-600 transition-colors hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:text-purple-300 dark:hover:text-purple-200 dark:focus:ring-offset-gray-900"
              >
                Forgot password?
              </button>
            </div>
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
      {showResetPopover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={resetSubmitting ? undefined : closeResetPopover}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Reset your password
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Enter the email associated with your account and we'll send instructions to change your password.
                </p>
              </div>
              <button
                type="button"
                className="rounded-full p-2 text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={closeResetPopover}
                disabled={resetSubmitting}
                aria-label="Close reset password form"
              >
                <span aria-hidden>✕</span>
              </button>
            </div>
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={resetEmail}
                  onChange={(event) => setResetEmail(event.target.value)}
                  disabled={resetSubmitting}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-800/60"
                  placeholder="you@example.com"
                />
              </div>
              {resetError && (
                <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-500/20 dark:text-red-200">
                  {resetError}
                </p>
              )}
              {resetSuccess && (
                <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-500/20 dark:text-green-200">
                  {resetSuccess}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeResetPopover}
                  disabled={resetSubmitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:ring-offset-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow transition-colors duration-200 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus:ring-offset-gray-900"
                >
                  {resetSubmitting ? "Sending..." : "Send instructions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
