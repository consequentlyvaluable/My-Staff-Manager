import { useEffect, useRef, useState } from "react";

export default function Header({
  onSidebarToggle,
  darkMode,
  onToggleDarkMode,
  user,
  onLogout,
  onChangePassword,
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
          Offyse 🏢
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className="group flex items-center gap-3 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur transition-all duration-300 hover:border-white/60 hover:bg-white/90 hover:text-gray-900 dark:border-white/10 dark:bg-white/10 dark:text-gray-200 dark:hover:border-white/20 dark:hover:bg-white/15 dark:hover:text-white"
          aria-pressed={darkMode}
        >
          <span
            className={`ios-toggle ${darkMode ? "ios-toggle--dark" : "ios-toggle--light"}`}
            aria-hidden
          >
            <span className="ios-toggle__glow" />
            <span className="ios-toggle__thumb" />
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
  const [renderMenu, setRenderMenu] = useState(false);
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

  useEffect(() => {
    if (open) {
      setRenderMenu(true);
      return;
    }

    const timeout = setTimeout(() => setRenderMenu(false), 180);

    return () => clearTimeout(timeout);
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
      {renderMenu && (
        <div
          className={`absolute right-0 top-12 z-10 w-56 origin-top-right rounded-lg bg-white p-3 shadow-lg ring-1 ring-black/5 transition-all duration-200 ease-out dark:bg-gray-800 dark:text-gray-100 dark:ring-white/10 ${open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-95 opacity-0"}`}
          role="menu"
          aria-hidden={!open}
        >
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
