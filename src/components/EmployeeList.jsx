import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";

const formatSummaryDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const hasTimeComponent =
    typeof value === "string" ? value.includes("T") : true;
  const pattern = hasTimeComponent ? "MMM d, h:mm a" : "MMM d";
  return format(date, pattern);
};

const toDateTimeLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
};

export default function EmployeeList({
  employees,
  records,
  search,
  setSearch,
  onUpdateBooking,
  deleteRecord,
  loading = false,
  canEditRecord = () => true,
}) {
  const [activeBookingId, setActiveBookingId] = useState(null);
  const [editValues, setEditValues] = useState({
    type: "Vacation",
    start: "",
    end: "",
  });
  const [editError, setEditError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const popoverRef = useRef(null);
  const firstFieldRef = useRef(null);

  const closePopover = useCallback(() => {
    setActiveBookingId(null);
    setEditError("");
    setEditValues({ type: "Vacation", start: "", end: "" });
  }, []);

  useEffect(() => {
    if (!activeBookingId) return undefined;

    const handlePointerDown = (event) => {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target)) return;
      closePopover();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closePopover();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeBookingId, closePopover]);

  useEffect(() => {
    if (!activeBookingId) return;
    if (!firstFieldRef.current) return;
    firstFieldRef.current.focus();
  }, [activeBookingId]);

  const handleEditClick = (booking) => {
    if (!canEditRecord(booking)) {
      return;
    }
    setActiveBookingId(booking.id);
    setEditValues({
      type: booking.type ?? "Vacation",
      start: toDateTimeLocalInput(booking.start),
      end: toDateTimeLocalInput(booking.end),
    });
    setEditError("");
  };

  const handleFieldChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!activeBookingId || typeof onUpdateBooking !== "function") {
      return;
    }
    setIsSubmitting(true);
    setEditError("");
    try {
      const result = await onUpdateBooking(activeBookingId, {
        type: editValues.type,
        start: editValues.start,
        end: editValues.end,
      });
      if (result?.error) {
        setEditError(result.error);
        return;
      }
      closePopover();
    } catch (error) {
      console.error("Failed to update booking", error);
      setEditError("Failed to update booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!activeBookingId) return;
    const exists = records.some((record) => record.id === activeBookingId);
    if (!exists) {
      closePopover();
    }
  }, [activeBookingId, records, closePopover]);

  const hasActiveBooking = activeBookingId
    ? records.some((record) => record.id === activeBookingId)
    : false;

  return (
    <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 dark:text-gray-200">Employees</h2>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search employees..."
        className="border rounded px-3 py-2 mb-4 w-full md:w-1/2 bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul className="space-y-4">
        {employees.length === 0 && !loading && (
          <li className="rounded-lg border border-dashed border-gray-300 bg-white/60 p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300">
            No employees available.
          </li>
        )}
        {employees
          .filter((emp) => emp.toLowerCase().includes(search.toLowerCase()))
          .map((emp) => {
            const empBookings = records.filter((r) => r.name === emp);
            const activeBooking = activeBookingId
              ? empBookings.find((b) => b.id === activeBookingId)
              : null;

            return (
              <li
                key={emp}
                className="relative border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 dark:text-gray-100">{emp}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-300">
                    {empBookings.length} booking
                    {empBookings.length !== 1 && "s"}
                  </span>
                </div>

                {/* Show bookings if any */}
                {empBookings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                    {empBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between border-b last:border-0 py-1 border-gray-200 dark:border-gray-600"
                      >
                        <span>
                          {b.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}{" "}
                          ({formatSummaryDate(b.start)} - {formatSummaryDate(b.end)})
                        </span>
                        <div className="space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(b)}
                            className="text-xs bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!canEditRecord(b)}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteRecord(b.id)}
                            className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {activeBooking && (
                  <div
                    ref={popoverRef}
                    className="absolute right-0 top-full z-50 mt-2 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Edit booking"
                  >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          Booking type
                        </label>
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={editValues.type}
                          onChange={(event) =>
                            handleFieldChange("type", event.target.value === "Travel" ? "Travel" : "Vacation")
                          }
                          disabled={isSubmitting}
                        >
                          <option value="Vacation">Vacation</option>
                          <option value="Travel">Travel</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          Start
                        </label>
                        <input
                          ref={firstFieldRef}
                          type="datetime-local"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={editValues.start}
                          onChange={(event) => handleFieldChange("start", event.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          End
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                          value={editValues.end}
                          onChange={(event) => handleFieldChange("end", event.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>

                      {editError && (
                        <p className="text-xs text-red-600 dark:text-red-400">{editError}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                          onClick={closePopover}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
      </ul>
      {hasActiveBooking && (
        <div
          className="pointer-events-none fixed inset-0 z-40 bg-black/20"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
