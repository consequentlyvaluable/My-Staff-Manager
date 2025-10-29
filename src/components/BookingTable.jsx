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

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

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

  return (
    <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Schedule</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            placeholder="Search by name or type..."
            className="border rounded px-2 py-1 text-sm w-full sm:w-48 bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
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
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
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

          {records.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 p-4 dark:text-gray-300">
                No matching records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
