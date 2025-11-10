import { useEffect } from "react";

const ACTION_ICONS = {
  created: "🆕",
  updated: "✏️",
  deleted: "🗑️",
};

const ACTION_ACCENTS = {
  created: "border-emerald-500/60 bg-emerald-50/90 dark:border-emerald-400/60 dark:bg-emerald-500/10",
  updated: "border-sky-500/60 bg-sky-50/90 dark:border-sky-400/60 dark:bg-sky-500/10",
  deleted: "border-rose-500/60 bg-rose-50/90 dark:border-rose-400/60 dark:bg-rose-500/10",
};

const DEFAULT_DURATION = 6000;

function ToastMessage({ toast, onDismiss }) {
  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION;
    if (!duration || duration < 0) return undefined;

    const timeout = window.setTimeout(() => {
      onDismiss(toast.id);
    }, duration);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [toast.id, toast.duration, onDismiss]);

  const accentClass = ACTION_ACCENTS[toast.action] ||
    "border-slate-300/70 bg-white/90 dark:border-slate-700/70 dark:bg-slate-800/90";
  const icon = ACTION_ICONS[toast.action] || "ℹ️";

  return (
    <div
      role="status"
      className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-2xl border backdrop-blur shadow-xl shadow-slate-900/10 transition transform hover:-translate-y-0.5 ${accentClass}`}
    >
      <div className="flex items-start gap-3 p-4">
        <span className="text-2xl leading-none" aria-hidden="true">
          {icon}
        </span>
        <div className="flex-1 space-y-1">
          {toast.title && (
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {toast.title}
            </p>
          )}
          {toast.description && (
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {toast.description}
            </p>
          )}
          {toast.meta && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{toast.meta}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="ml-2 rounded-full p-1 text-slate-500 transition hover:bg-slate-900/5 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Dismiss notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ToastStack({ toasts, onDismiss }) {
  if (!Array.isArray(toasts) || toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[1000] flex flex-col items-end gap-3 px-4 sm:px-6">
      {toasts.map((toast) => (
        <ToastMessage key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
