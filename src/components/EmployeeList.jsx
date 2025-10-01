import { format } from "date-fns";

export default function EmployeeList({
  employees,
  records,
  search,
  setSearch,
  startEdit,
  deleteRecord,
}) {
  const normalizedSearch = search.trim().toLowerCase();
  const filteredEmployees = employees.filter((emp) => {
    if (!normalizedSearch) return true;
    return [emp.name, emp.fullName, emp.username, emp.email]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedSearch));
  });

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
        {filteredEmployees.map((emp) => {
          const empBookings = records.filter((r) => r.name === emp.name);

          return (
            <li
              key={emp.id}
              className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="block font-medium text-gray-800 dark:text-gray-100">{emp.name}</span>
                  <span className="block text-sm text-gray-500 dark:text-gray-300">{emp.fullName}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-300">
                  {empBookings.length} booking
                  {empBookings.length !== 1 && "s"}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                <p>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">Email:</span>{" "}
                  <span className="font-mono text-gray-800 dark:text-gray-100">{emp.email}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">Username:</span>{" "}
                  <span className="font-mono text-gray-800 dark:text-gray-100">{emp.username}</span>
                </p>
                <p>
                  <span className="font-semibold text-gray-600 dark:text-gray-300">Password:</span>{" "}
                  <span className="font-mono text-gray-800 dark:text-gray-100">{emp.password}</span>
                </p>
              </div>

              {/* Show bookings if any */}
              {empBookings.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                  {empBookings.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between border-b last:border-0 py-1 border-gray-200 dark:border-gray-600"
                    >
                      <span>
                        {b.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}{" "}
                        ({format(new Date(b.start), "MMM d")} - {format(new Date(b.end), "MMM d")})
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

        {filteredEmployees.length === 0 && (
          <li className="text-center text-sm text-gray-500 dark:text-gray-300">
            No employees match your search.
          </li>
        )}
      </ul>
    </div>
  );
}
