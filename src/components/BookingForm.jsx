import { useEffect, useState } from "react";

export default function BookingForm({
  form,
  setForm,
  employees,
  handleSubmit,
  editingId,
  cancelEdit,
  isSaving = false,
}) {
  const employeeInputId = "booking-form-employee";
  const employeeListId = "booking-form-employee-options";
  const [showEditPulse, setShowEditPulse] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setShowEditPulse(false);
      return;
    }

    setShowEditPulse(true);
    const timeout = setTimeout(() => {
      setShowEditPulse(false);
    }, 1200);

    return () => {
      clearTimeout(timeout);
    };
  }, [editingId]);

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/30 ${
        editingId && showEditPulse ? "edit-booking-pulse" : ""
      }`}
    >
      <div
        className="absolute inset-x-6 top-0 h-24 rounded-b-full bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-sky-500 dark:text-sky-300">
            {editingId ? "Currently editing" : "Create New"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {editingId ? "Edit Booking" : "Add Booking"}
          </h2>
        </div>
        {editingId && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-sky-200 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={cancelEdit}
          >
            <span aria-hidden="true">↺</span>
            Cancel editing
          </button>
        )}
      </div>

      <p className="relative mt-3 text-sm text-slate-500 dark:text-slate-400">
        Choose the employee, booking type, and exact time range.
      </p>

      <div className="relative mt-6 space-y-6">
        {/* Employee */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <label htmlFor={employeeInputId}>Employee</label>
            
          </div>
          <div className="group relative">
            <input
              id={employeeInputId}
              list={employeeListId}
              type="text"
              placeholder="Start typing a team member"
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-3 pr-10 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-sky-500 dark:focus:ring-sky-500/30"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 transition group-focus-within:text-sky-500 dark:text-slate-500">
              ▼
            </span>
            <datalist id={employeeListId}>
              {employees.map((emp) => (
                <option key={emp} value={emp} />
              ))}
            </datalist>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            You can type to search or select from the menu.
          </p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Booking type</label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-3 pr-10 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-sky-500 dark:focus:ring-sky-500/30"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Vacation</option>
              <option>Travel</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-slate-500">⌄</span>
          </div>
        </div>

        {/* Dates & Times */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Start date & time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 px-3 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-sky-500 dark:focus:ring-sky-500/30"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              step="60"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              End date & time
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 px-3 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-sky-500 dark:focus:ring-sky-500/30"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              step="60"
            />
          </div>
        </div>
      </div>

      <div className="relative mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {editingId
            ? "Review the details above, then update the booking."
            : ""}
        </p>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:from-sky-600 hover:via-blue-600 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          <span className="text-lg">{editingId ? "✓" : "+"}</span>
          <span>{isSaving ? "Saving..." : editingId ? "Update booking" : "Add booking"}</span>
        </button>
      </div>
    </div>
  );
}
