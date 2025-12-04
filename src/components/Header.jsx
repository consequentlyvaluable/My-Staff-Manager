import { useEffect, useId, useRef, useState } from "react";

export default function Header({
  onSidebarToggle,
  darkMode,
  onToggleDarkMode,
  user,
  onLogout,
  onChangePassword,
  outOfOfficeSummary,
  companyId,
  onCompanyChange,
  companyOptions = [],
}) {
  const companyInputId = useId();
  const companyListId = useId();
  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "TM"
    : "TM";

  const outToday = outOfOfficeSummary?.outToday ?? 0;
  const outTomorrow = outOfOfficeSummary?.outTomorrow ?? 0;
  const totalEmployees = outOfOfficeSummary?.totalEmployees ?? 0;
  const outTodayPercentage = outOfOfficeSummary?.percentage ?? 0;
  const outTomorrowPercentage = outOfOfficeSummary?.tomorrowPercentage ?? 0;
  const outHelperLabel =
    totalEmployees > 0
      ? `${outToday} of ${totalEmployees} ${
          totalEmployees === 1 ? "employee" : "employees"
        }`
      : "No employees yet";
  const outTomorrowHelperLabel =
    totalEmployees > 0
      ? `${outTomorrow} of ${totalEmployees} ${
          totalEmployees === 1 ? "employee" : "employees"
        }`
      : "No employees yet";
  const handleCompanyChange = (event) => {
    if (typeof onCompanyChange !== "function") return;
    onCompanyChange(event.target.value);
  };
  const hasCompanySelector = typeof onCompanyChange === "function";

  return (
    <header className="bg-white shadow px-6 py-4 flex flex-wrap items-center justify-between gap-4 transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
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
          Offyse 🏢
        </h1>
      </div>
      <div className="flex flex-1 justify-center">
        <div className="flex items-center gap-6 rounded-2xl bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-800 shadow-sm ring-1 ring-purple-100 transition-colors duration-300 dark:bg-purple-900/40 dark:text-purple-100 dark:ring-purple-800/60">
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{outTodayPercentage}%</span>
              <span className="text-[0.7rem] uppercase tracking-wide text-purple-600 dark:text-purple-200/80">
                Out today
              </span>
            </div>
            <span className="text-xs font-normal text-purple-700 dark:text-purple-200/80">
              {outHelperLabel}
            </span>
          </div>
          <div className="hidden h-10 w-px bg-purple-200 dark:bg-purple-800 sm:block" aria-hidden></div>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{outTomorrowPercentage}%</span>
              <span className="text-[0.7rem] uppercase tracking-wide text-purple-600 dark:text-purple-200/80">
                Out tomorrow
              </span>
            </div>
            <span className="text-xs font-normal text-purple-700 dark:text-purple-200/80">
              {outTomorrowHelperLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {hasCompanySelector && (
          <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200/80 transition-colors duration-200 dark:bg-gray-700/70 dark:text-gray-100 dark:ring-gray-600/80">
            <label
              className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-300"
              htmlFor={companyInputId}
            >
              Company
            </label>
            <div className="relative">
              <input
                id={companyInputId}
                list={companyOptions?.length ? companyListId : undefined}
                value={companyId ?? ""}
                onChange={handleCompanyChange}
                placeholder="Enter company id"
                className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 shadow-inner focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-purple-400 dark:focus:ring-purple-400"
              />
              {companyOptions?.length ? (
                <datalist id={companyListId}>
                  {companyOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              ) : null}
            </div>
          </div>
        )}
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
          <UserMenu
            user={user}
            initials={initials}
            onLogout={onLogout}
            onChangePassword={onChangePassword}
          />
        )}
      </div>
    </header>
  );
}

function UserMenu({ user, initials, onLogout, onChangePassword }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  const toggleMenu = () => setOpen((previous) => !previous);

  const handleLogout = () => {
    setOpen(false);
    onLogout();
  };

  const handleChangePassword = () => {
    setOpen(false);
    if (typeof onChangePassword === "function") {
      onChangePassword();
    }
  };

  return (
    <div className="relative flex items-center gap-3" ref={menuRef}>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {user.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={toggleMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-sm font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:shadow-purple-900/40 dark:focus:ring-offset-gray-900"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-10 w-56 rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5 transition-colors duration-200 dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10">
          <div className="mb-3 border-b border-gray-100 pb-3 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={handleChangePassword}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-purple-200 px-3 py-2 text-sm font-medium text-gray-800 transition-colors duration-200 hover:bg-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:border-gray-700 dark:bg-purple-700 dark:text-white dark:hover:bg-purple-600 dark:focus:ring-offset-gray-900"
          >
            Change password
          </button>


          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-purple-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus:ring-offset-gray-900"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
