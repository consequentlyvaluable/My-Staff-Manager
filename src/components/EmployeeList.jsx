import { format } from "date-fns";

export default function EmployeeList({
  employees,
  records,
  search,
  setSearch,
  startEdit,
  deleteRecord,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Employees</h2>

      {/* Search bar */}
      <input
        type="text"
        placeholder="Search employees..."
        className="border rounded px-3 py-2 mb-4 w-full md:w-1/2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ul className="space-y-4">
        {employees
          .filter((emp) => emp.toLowerCase().includes(search.toLowerCase()))
          .map((emp) => {
            const empBookings = records.filter((r) => r.name === emp);

            return (
              <li
                key={emp}
                className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{emp}</span>
                  <span className="text-sm text-gray-500">
                    {empBookings.length} booking
                    {empBookings.length !== 1 && "s"}
                  </span>
                </div>

                {/* Show bookings if any */}
                {empBookings.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {empBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between border-b last:border-0 py-1"
                      >
                        <span>
                          {b.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}{" "}
                          ({format(new Date(b.start), "MMM d")} -{" "}
                          {format(new Date(b.end), "MMM d")})
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
