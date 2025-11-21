import { useEffect, useMemo, useRef, useState } from "react";

const ALL_DAY_START_TIME = "00:00";
const ALL_DAY_END_TIME = "23:59";

const getDatePart = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const [datePart] = trimmed.split("T");
  return datePart || "";
};

const combineDateAndTime = (datePart, timePart) =>
  datePart ? `${datePart}T${timePart}` : "";

const ensureAllDayRange = (startValue, endValue) => {
  const startDate = getDatePart(startValue);
  const endDate = getDatePart(endValue) || startDate;
  const normalizedStart = combineDateAndTime(startDate, ALL_DAY_START_TIME);
  const normalizedEnd = combineDateAndTime(endDate, ALL_DAY_END_TIME);
  return [normalizedStart, normalizedEnd];
};

export default function BookingForm({
  form,
  setForm,
  employees,
  handleSubmit,
  editingId,
  cancelEdit,
  isSaving = false,
  isDisabled = false,
  helperText = "",
}) {
  const employeeInputId = "booking-form-employee";
  const employeeListId = "booking-form-employee-options";
  const [showEditPulse, setShowEditPulse] = useState(false);
  const [employeeQuery, setEmployeeQuery] = useState(form.name ?? "");
  const [isEmployeeListOpen, setIsEmployeeListOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const employeeFieldRef = useRef(null);

  const filteredEmployees = useMemo(() => {
    if (!employeeQuery.trim()) {
      return employees;
    }

    return employees.filter((emp) =>
      emp.toLowerCase().includes(employeeQuery.trim().toLowerCase()),
    );
  }, [employeeQuery, employees]);

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

  useEffect(() => {
    setEmployeeQuery(form.name ?? "");
  }, [form.name]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!employeeFieldRef.current) {
        return;
      }

      if (!employeeFieldRef.current.contains(event.target)) {
        setIsEmployeeListOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isEmployeeListOpen) {
      setHighlightedIndex(-1);
    } else {
      setHighlightedIndex((prev) => {
        if (prev >= filteredEmployees.length) {
          return filteredEmployees.length - 1;
        }
        return prev;
      });
    }
  }, [isEmployeeListOpen, filteredEmployees.length]);

  useEffect(() => {
    if (isDisabled) {
      setIsEmployeeListOpen(false);
    }
  }, [isDisabled]);

  const handleEmployeeSelect = (name) => {
    setForm({ ...form, name });
    setEmployeeQuery(name);
    setIsEmployeeListOpen(false);
    setHighlightedIndex(-1);
  };

  const handleEmployeeKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsEmployeeListOpen(true);
      setHighlightedIndex((prev) => {
        if (!filteredEmployees.length) {
          return -1;
        }

        const nextIndex = Math.min(prev + 1, filteredEmployees.length - 1);
        return nextIndex < 0 ? 0 : nextIndex;
      });
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) => {
        if (!filteredEmployees.length) {
          return -1;
        }

        if (!isEmployeeListOpen) {
          return filteredEmployees.length - 1;
        }

        const nextIndex = Math.max(prev - 1, -1);
        return nextIndex === -1 ? filteredEmployees.length - 1 : nextIndex;
      });
    }

    if (event.key === "Enter") {
      if (highlightedIndex >= 0 && filteredEmployees[highlightedIndex]) {
        event.preventDefault();
        handleEmployeeSelect(filteredEmployees[highlightedIndex]);
      }
    }

    if (event.key === "Escape") {
      setIsEmployeeListOpen(false);
    }
  };

  const isAllDay = Boolean(form.allDay);
  const startInputValue = isAllDay
    ? getDatePart(form.start)
    : form.start ?? "";
  const endInputValue = isAllDay
    ? getDatePart(form.end)
    : form.end ?? "";

  const handleAllDayToggle = (event) => {
    const checked = event.target.checked;
    if (checked) {
      const [nextStart, nextEnd] = ensureAllDayRange(
        form.start,
        form.end || form.start
      );
      setForm({
        ...form,
        allDay: true,
        start: nextStart,
        end: nextEnd,
      });
      return;
    }

    setForm({ ...form, allDay: false });
  };

  const handleAllDayStartChange = (value) => {
    const [nextStart, potentialEnd] = ensureAllDayRange(value, form.end);
    const nextStartDate = getDatePart(nextStart);
    const currentEndDate = getDatePart(form.end);
    const normalizedEnd =
      currentEndDate && nextStartDate && currentEndDate < nextStartDate
        ? combineDateAndTime(nextStartDate, ALL_DAY_END_TIME)
        : potentialEnd;

    setForm({
      ...form,
      start: nextStart,
      end: normalizedEnd,
    });
  };

  const handleAllDayEndChange = (value) => {
    const [potentialStart, nextEnd] = ensureAllDayRange(form.start, value);
    const currentStartDate = getDatePart(form.start);
    const nextEndDate = getDatePart(nextEnd);
    const normalizedStart =
      currentStartDate && nextEndDate && nextEndDate < currentStartDate
        ? combineDateAndTime(nextEndDate, ALL_DAY_START_TIME)
        : potentialStart;

    setForm({
      ...form,
      start: normalizedStart,
      end: nextEnd,
    });
  };

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/30 ${
        editingId && showEditPulse ? "edit-booking-pulse" : ""
      }`}
    >
      <div
        className="absolute inset-x-6 top-0 h-24 rounded-b-full bg-gradient-to-br from-purple-500/10 via-transparent to-fuchsia-500/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-purple-600 dark:text-purple-300">
            {editingId ? "Currently editing" : "Create New"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {editingId ? "Edit Booking" : "Add Booking"}
          </h2>
        </div>
        {editingId && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-4 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-purple-200 hover:text-purple-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={cancelEdit}
            disabled={isDisabled}
          >
            <span aria-hidden="true">↺</span>
            Cancel editing
          </button>
        )}
      </div>

      <p className="relative mt-3 text-sm text-slate-500 dark:text-slate-400">
        Choose the employee, booking type, and exact time range.
      </p>
      {helperText && (
        <p className="relative mt-2 text-xs text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      )}
      {isDisabled && (
        <p className="relative mt-2 text-xs text-amber-600 dark:text-amber-300">
          Editing is disabled for your account.
        </p>
      )}

      <div className="relative mt-6 space-y-6">
        {/* Employee */}
        <div className="space-y-2" ref={employeeFieldRef}>
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <label htmlFor={employeeInputId}>Employee</label>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-300">
              Smart search
            </span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.9 14.32a6.5 6.5 0 1 1 1.414-1.414l3.387 3.387a1 1 0 0 1-1.414 1.414l-3.387-3.387ZM14.5 8a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              id={employeeInputId}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isEmployeeListOpen}
              aria-controls={employeeListId}
              aria-activedescendant={
                highlightedIndex >= 0
                  ? `${employeeListId}-option-${highlightedIndex}`
                  : undefined
              }
              placeholder="Search by name"
              className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-9 pr-11 text-sm text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-purple-500 dark:focus:ring-purple-500/30"
              value={employeeQuery}
              onChange={(event) => {
                const nextValue = event.target.value;
                setEmployeeQuery(nextValue);
                setForm({ ...form, name: nextValue });
                setIsEmployeeListOpen(true);
              }}
              onFocus={() => {
                if (!isDisabled) {
                  setIsEmployeeListOpen(true);
                }
              }}
              onClick={() => {
                if (!isDisabled) {
                  setIsEmployeeListOpen(true);
                }
              }}
              onKeyDown={handleEmployeeKeyDown}
              disabled={isDisabled}
              autoComplete="off"
            />
            {form.name && !isDisabled && (
              <button
                type="button"
                className="absolute inset-y-0 right-8 flex items-center text-slate-300 transition hover:text-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:text-slate-500 dark:hover:text-slate-300"
                onClick={() => {
                  setEmployeeQuery("");
                  setForm({ ...form, name: "" });
                  setIsEmployeeListOpen(true);
                }}
              >
                <span className="sr-only">Clear selection</span>
                ×
              </button>
            )}
            <button
              type="button"
              className="absolute inset-y-0 right-2 flex items-center text-slate-400 transition hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 dark:text-slate-500 dark:hover:text-slate-300"
              onClick={() => {
                if (isDisabled) {
                  return;
                }
                setIsEmployeeListOpen((prev) => !prev);
              }}
              disabled={isDisabled}
              aria-label={isEmployeeListOpen ? "Hide employee suggestions" : "Show employee suggestions"}
            >
              <span aria-hidden="true" className={`transition ${isEmployeeListOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>
            {isEmployeeListOpen && !isDisabled && (
              <div
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/40"
                role="listbox"
                id={employeeListId}
              >
                {filteredEmployees.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                    No team members match "{employeeQuery}".
                  </p>
                ) : (
                  <ul className="max-h-56 overflow-y-auto py-2">
                    {filteredEmployees.map((employeeName, index) => {
                      const isHighlighted = index === highlightedIndex;
                      const isSelected = employeeName === form.name;

                      return (
                        <li key={employeeName} className="px-2">
                          <button
                            type="button"
                            role="option"
                            id={`${employeeListId}-option-${index}`}
                            aria-selected={isSelected}
                            className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 ${
                              isHighlighted
                                ? "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-100"
                                : "text-slate-600 hover:bg-slate-100/80 dark:text-slate-200 dark:hover:bg-slate-800/70"
                            } ${isSelected ? "ring-1 ring-purple-400 dark:ring-purple-500" : ""}`}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onMouseLeave={() => setHighlightedIndex(-1)}
                            onClick={() => handleEmployeeSelect(employeeName)}
                          >
                            <span>{employeeName}</span>
                            {isSelected && <span className="text-xs text-purple-600 dark:text-purple-300">Selected</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="border-t border-slate-100/80 bg-slate-50/70 px-4 py-2 text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-500">
                  {filteredEmployees.length} suggestion{filteredEmployees.length === 1 ? "" : "s"}
                </div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Start typing to filter down your team, or open the menu to browse.
          </p>
        </div>

        {/* Type */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Booking type</label>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-3 pr-10 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-purple-500 dark:focus:ring-purple-500/30"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              disabled={isDisabled}
            >
              <option>Vacation</option>
              <option>Travel</option>
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400 dark:text-slate-500">⌄</span>
          </div>
        </div>

        {/* All day toggle */}
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-inner shadow-slate-900/5 transition dark:border-slate-700/70 dark:bg-slate-800/70">
          <div>
            <label
              htmlFor="booking-form-all-day"
              className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
            >
              All day booking
            </label>
            <p className="mt-1 text-[11px] leading-4 text-slate-400 dark:text-slate-500">
              Skip choosing exact times when the time off lasts the entire day.
            </p>
          </div>
          <label
            htmlFor="booking-form-all-day"
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center ${
              isDisabled ? "opacity-60" : ""
            }`}
          >
            <input
              id="booking-form-all-day"
              type="checkbox"
              className="peer sr-only"
              checked={isAllDay}
              onChange={handleAllDayToggle}
              disabled={isDisabled}
            />
            <span className="absolute inset-0 rounded-full bg-slate-200 transition peer-checked:bg-purple-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-purple-500 dark:bg-slate-700 dark:peer-checked:bg-purple-500/80"></span>
            <span className="absolute left-1 h-4 w-4 rounded-full bg-white shadow transition peer-checked:translate-x-5 peer-checked:bg-white dark:bg-slate-300"></span>
          </label>
        </div>

        {/* Dates & Times */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Start date & time
            </label>
            <input
              type={isAllDay ? "date" : "datetime-local"}
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 px-3 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-purple-500 dark:focus:ring-purple-500/30"
              value={startInputValue}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (isAllDay) {
                  handleAllDayStartChange(nextValue);
                } else {
                  setForm({ ...form, start: nextValue });
                }
              }}
              step={isAllDay ? undefined : "60"}
              disabled={isDisabled}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              End date & time
            </label>
            <input
              type={isAllDay ? "date" : "datetime-local"}
              className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 px-3 text-slate-900 shadow-inner shadow-slate-900/5 transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:shadow-black/40 dark:focus:border-purple-500 dark:focus:ring-purple-500/30"
              value={endInputValue}
              onChange={(e) => {
                const nextValue = e.target.value;
                if (isAllDay) {
                  handleAllDayEndChange(nextValue);
                } else {
                  setForm({ ...form, end: nextValue });
                }
              }}
              step={isAllDay ? undefined : "60"}
              disabled={isDisabled}
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
          className="group relative inline-flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-500 to-rose-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          onClick={handleSubmit}
          disabled={isSaving || isDisabled}
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-white/10 opacity-0 transition duration-300 group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 h-full w-24 -translate-x-full skew-x-12 bg-white/20 blur-md transition-transform duration-500 group-hover:translate-x-full"
          />
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-base font-semibold shadow-inner shadow-white/10 ring-1 ring-white/20">
            {editingId ? "✓" : "+"}
          </span>
          <span className="relative text-sm tracking-wide">
            {isSaving ? "Saving..." : editingId ? "Update booking" : "Add booking"}
          </span>
        </button>
      </div>
    </div>
  );
}
