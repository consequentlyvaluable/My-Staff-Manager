export default function Header({
  onSidebarToggle,
  darkMode,
  onToggleDarkMode,
  user,
  onLogout,
}) {
  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "TM"
    : "TM";

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={onSidebarToggle}
        >
          <div className="space-y-1">
            <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
            <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
            <div className="w-6 h-0.5 bg-gray-600 dark:bg-gray-300"></div>
          </div>
        </button>
        <h1 className="text-2xl font-bold text-purple-800 dark:text-purple-200">
          Offyse
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
          aria-pressed={darkMode}
        >
          <span className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${darkMode ? "bg-purple-500" : "bg-gray-300"}`}>
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : "translate-x-1"}`}
            />
          </span>
          <span className="hidden sm:inline">{darkMode ? "Dark" : "Light"} Mode</span>
          <span aria-hidden className="sm:hidden">
            {darkMode ? "🌙" : "☀️"}
          </span>
        </button>
        {user && (
          <>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white">
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-purple-200 px-3 py-1 text-sm font-medium text-purple-700 transition hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:border-purple-500/40 dark:text-purple-200 dark:hover:bg-purple-500/20 dark:focus:ring-offset-gray-800"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
