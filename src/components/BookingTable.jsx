import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const hasTimeComponent =
    typeof value === "string" ? value.includes("T") : true;
  const pattern = hasTimeComponent ? "MMM d, yyyy h:mm a" : "MMM d, yyyy";
  return format(date, pattern);
};

export default function BookingTable({
  records,
  workflowDecisions = {},
  search,
  setSearch,
  sort,
  setSort,
  startEdit,
  deleteRecord,
  clearAll,
  isClearing = false,
  hasAnyRecords = false,
  canEditRecord = () => true,
  canDeleteRecord = () => true,
  canClearAll = true,
}) {
  const [pulsingId, setPulsingId] = useState(null);
  const pulseTimeoutRef = useRef();
  const [isEmailMenuOpen, setIsEmailMenuOpen] = useState(false);
  const emailMenuRef = useRef(null);
  const [showPastBookings, setShowPastBookings] = useState(false);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEmailMenuOpen) return undefined;

    const handleClickOutside = (event) => {
      if (emailMenuRef.current && !emailMenuRef.current.contains(event.target)) {
        setIsEmailMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsEmailMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEmailMenuOpen]);

  const toggleSort = (column) => {
    setSort((prev) => {
      const current = prev[column];
      let next;
      if (current === null) next = "asc";
      else if (current === "asc") next = "desc";
      else next = null;
      return { name: null, start: null, end: null, [column]: next };
    });
  };

  const handleEditClick = (record) => {
    if (pulseTimeoutRef.current) {
      clearTimeout(pulseTimeoutRef.current);
    }

    setPulsingId(record.id);
    pulseTimeoutRef.current = setTimeout(() => {
      setPulsingId(null);
    }, 400);

    startEdit(record);
  };

  const now = new Date();
  const visibleRecords = records.filter((record) => {
    if (showPastBookings) return true;

    if (!record.end) return true;

    const endDate = new Date(record.end);
    if (Number.isNaN(endDate.getTime())) return true;

    return endDate >= now;
  });

  const buildEmailDetails = () => {
    const subject = `Schedule Update – ${format(new Date(), "MMMM d, yyyy")}`;
    const scheduleSummary = visibleRecords.length
      ? visibleRecords
          .map((record, index) => {
            const typeLabel =
              record.type === "Vacation" ? "Vacation" : "Travel";
            const start = formatDateTime(record.start);
            const end = formatDateTime(record.end);
            return `${index + 1}) ${record.name} – ${typeLabel}\n    • Start: ${start}\n    • End: ${end}`;
          })
          .join("\n\n")
      : "No scheduled records.";

    const body = [
      "Hi Team,",
      "",
      "Here's our colleagues latest updates:",
      "",
      scheduleSummary,
      "",
      
      
    ].join("\n");

    return { subject, body };
  };

  const handleSendEmail = (destination) => {
    const { subject, body } = buildEmailDetails();
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    if (destination === "web") {
      const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?subject=${encodedSubject}&body=${encodedBody}`;
      window.open(outlookUrl, "_blank", "noopener,noreferrer");
    }

    if (destination === "desktop") {
      const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      window.location.href = mailtoUrl;
    }

    setIsEmailMenuOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Schedule</h2>
          <div className="relative" ref={emailMenuRef}>
            <button
              type="button"
              onClick={() => setIsEmailMenuOpen((prev) => !prev)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg shadow text-sm"
              aria-haspopup="true"
              aria-expanded={isEmailMenuOpen}
            >
              Send Email
            </button>
            {isEmailMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <p className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Choose an option
                </p>
                <div className="px-2 py-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleSendEmail("web")}
                    className="w-full rounded-md bg-blue-500 px-3 py-2 text-left text-sm font-medium text-white transition hover:bg-blue-600"
                  >
                    Outlook 365 on the Web
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendEmail("desktop")}
                    className="w-full rounded-md bg-blue-100 px-3 py-2 text-left text-sm font-medium text-blue-700 transition hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/40"
                  >
                    Outlook 365 Desktop
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by name or type..."
            className="border rounded px-2 py-1 text-sm w-full sm:w-48 bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPastBookings((prev) => !prev)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg border shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${
              showPastBookings
                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                : "bg-white text-blue-600 border-blue-500 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-300 dark:border-blue-400 dark:hover:bg-gray-700"
            }`}
          >
            {showPastBookings ? "Hide Past Bookings" : "Show Past Bookings"}
          </button>
          {hasAnyRecords && (
            <button
              className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg shadow text-sm"
              onClick={clearAll}
              disabled={isClearing || !canClearAll}
            >
              {isClearing ? "Clearing..." : "Clear All"}
            </button>
          )}
        </div>
      </div>

      <table className="w-full border-collapse rounded-lg overflow-hidden text-sm text-left">
        <thead className="bg-gray-100 text-gray-700 select-none dark:bg-gray-700 dark:text-gray-200">
          <tr>
            <th className="p-2 cursor-pointer" onClick={() => toggleSort("name")}>
              Name
              {sort.name === "asc" && " ▲"}
              {sort.name === "desc" && " ▼"}
            </th>
            <th className="p-2 text-center">Type</th>
            <th className="p-2 text-center cursor-pointer" onClick={() => toggleSort("start")}>
              Start
              {sort.start === "asc" && " ▲"}
              {sort.start === "desc" && " ▼"}
            </th>
            <th className="p-2 text-center cursor-pointer" onClick={() => toggleSort("end")}>
              End
              {sort.end === "asc" && " ▲"}
              {sort.end === "desc" && " ▼"}
            </th>
            <th className="p-2 text-center">Status</th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {visibleRecords.map((r) => {
            const allowEdit = canEditRecord(r);
            const allowDelete = canDeleteRecord(r);
            return (
              <tr
                key={r.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 dark:odd:bg-gray-800 dark:even:bg-gray-700 dark:hover:bg-gray-600"
              >
                <td className="border border-gray-100 p-2 dark:border-gray-600">
                  <span className="text-gray-800 dark:text-gray-100">{r.name}</span>
                </td>
                <td className="border border-gray-100 p-2 text-center dark:border-gray-600">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs font-medium ${
                      r.type === "Vacation" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  >
                    {r.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}
                  </span>
                </td>
                <td className="border border-gray-100 p-2 text-center text-gray-700 dark:border-gray-600 dark:text-gray-100">
                  {formatDateTime(r.start)}
                </td>
                <td className="border border-gray-100 p-2 text-center text-gray-700 dark:border-gray-600 dark:text-gray-100">
                  {formatDateTime(r.end)}
                </td>
                <td className="border border-gray-100 p-2 text-center text-gray-700 dark:border-gray-600 dark:text-gray-100">
                  {workflowDecisions[r.id] ? (
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                        workflowDecisions[r.id].status === "auto_approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100"
                          : workflowDecisions[r.id].status === "declined_quota"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100"
                      }`}
                      title={workflowDecisions[r.id].reason}
                    >
                      {workflowDecisions[r.id].status === "auto_approved"
                        ? "Auto-approved"
                        : workflowDecisions[r.id].status === "declined_quota"
                        ? "Declined"
                        : "Needs review"}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Pending</span>
                  )}
                </td>
                <td className="border border-gray-100 p-2 text-center space-x-2 dark:border-gray-600">
                  <button
                    onClick={() => allowEdit && handleEditClick(r)}
                    disabled={!allowEdit}
                    className={`bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-300 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs ${
                      pulsingId === r.id ? "pulse-once" : ""
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => allowDelete && deleteRecord(r.id)}
                    disabled={!allowDelete}
                    className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}

          {visibleRecords.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center text-gray-500 p-4 dark:text-gray-300">
                {showPastBookings ? "No matching records" : "No upcoming bookings"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
