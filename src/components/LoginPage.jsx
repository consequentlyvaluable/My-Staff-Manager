import { useState } from "react";

export default function LoginPage({
  onLogin,
  onPasswordReset,
  darkMode,
  onToggleDarkMode,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);

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

  const openResetDialog = () => {
    setResetEmail(email);
    setResetError("");
    setResetSuccess("");
    setResetOpen(true);
  };

  const closeResetDialog = () => {
    setResetOpen(false);
    setResetSubmitting(false);
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    setResetError("");
    setResetSuccess("");

    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail) {
      setResetError("Enter the email you use to sign in.");
      return;
    }

    if (typeof onPasswordReset !== "function") {
      setResetError("Password recovery is currently unavailable.");
      return;
    }

    setResetSubmitting(true);
    try {
      await onPasswordReset({ email: trimmedEmail });
      setResetSuccess(
        "Check your inbox for a reset link. It expires in 1 hour."
      );
    } catch (resetProblem) {
      setResetError(
        resetProblem.message ||
          "We couldn't start the reset flow. Please try again."
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
              
            </p>
            <p className="mt-3 text-sm">
              <a
                href="https://offyse.com/"
                className="font-medium text-purple-600 hover:text-purple-500 dark:text-purple-300 dark:hover:text-purple-200"
              >
                New to Offyse? Learn more about this app
              </a>
            </p>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Contact: <a href="mailto:support@offyse.com" className="font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-300 dark:hover:text-purple-200">support@offyse.com</a>
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
                onClick={openResetDialog}
                className="text-sm font-semibold text-purple-600 transition hover:text-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-purple-300 dark:hover:text-purple-200 dark:focus-visible:ring-offset-gray-900"
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
      {resetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={closeResetDialog}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-500 to-rose-500 p-[2px] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative rounded-[1.5rem] bg-white/95 p-8 text-gray-800 shadow-xl dark:bg-gray-900/95 dark:text-gray-100">
              <button
                type="button"
                onClick={closeResetDialog}
                className="absolute right-4 top-4 rounded-full bg-white/80 p-2 text-gray-500 shadow-sm transition hover:scale-105 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 dark:bg-gray-800/80 dark:text-gray-300 dark:hover:text-white"
                aria-label="Close password reset dialog"
              >
                <span aria-hidden="true">×</span>
              </button>
              <div className="mb-6 text-center">
                <p className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-purple-600 shadow-sm dark:bg-gray-800/70 dark:text-purple-300">
                  Reset Access
                </p>
                <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
                  Let's get you back in
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Enter your work email and we'll send a shimmering reset link.
                </p>
              </div>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-200"
                  >
                    Work email
                  </label>
                  <input
                    id="reset-email"
                    name="reset-email"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/50 bg-white/80 px-4 py-2 text-gray-900 shadow-inner shadow-purple-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800/70 dark:text-gray-100"
                    placeholder="you@company.com"
                  />
                </div>
                {resetError && (
                  <p className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700 shadow-inner dark:bg-rose-500/20 dark:text-rose-100">
                    {resetError}
                  </p>
                )}
                {resetSuccess && (
                  <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 shadow-inner dark:bg-emerald-500/20 dark:text-emerald-100">
                    {resetSuccess}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
                >
                  <span className="absolute inset-0 opacity-0 transition-opacity group-hover:opacity-30" />
                  {resetSubmitting ? "Sending magic..." : "Send reset link"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
