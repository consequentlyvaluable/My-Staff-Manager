const variantStyles = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100",
  error:
    "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100",
  info:
    "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
};

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts?.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-full max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => {
        const variantClass = variantStyles[toast.variant] ?? variantStyles.success;

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto overflow-hidden rounded-xl border shadow-lg backdrop-blur transition-all dark:shadow-black/40 ${variantClass}`}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="flex-1 text-sm font-medium leading-5">{toast.message}</div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full p-1 text-xs font-semibold uppercase tracking-wide text-gray-500 transition hover:bg-black/10 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Dismiss notification"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
