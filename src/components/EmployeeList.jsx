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

export default function EmployeeList({
  employees,
  records,
  search,
  setSearch,
  startEdit,
  deleteRecord,
  loading = false,
}) {
  const searchInputId = "employee-list-search";
  return (
    <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <h2 className="text-xl font-semibold text-gray-700 mb-4 dark:text-gray-200">Employees</h2>

      {/* Search bar */}
      <label htmlFor={searchInputId} className="sr-only">
        Search employees by name
      </label>
      <input
        id={searchInputId}
        name="employeeSearch"
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

            return (
              <li
                key={emp}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
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
                            onClick={() => startEdit(b)}
                            className="text-xs bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded"
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
              </li>
            );
          })}
      </ul>
    </div>
  );
}
