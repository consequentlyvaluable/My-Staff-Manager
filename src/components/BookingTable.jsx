import { parseISO } from "date-fns";
import utcToZonedTime from "date-fns-tz/utcToZonedTime";

// ...rest of your imports

const { utcToZonedTime } = tz;

export default function BookingTable({
  records,
  search,
  setSearch,
  sort,
  setSort,
  startEdit,
  deleteRecord,
  timeZone,
}) {
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

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">Schedule</h2>
        <input
          type="text"
          placeholder="Search by name or type..."
          className="border rounded px-2 py-1 text-sm w-48"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <table className="w-full border-collapse rounded-lg overflow-hidden text-sm">
        <thead className="bg-gray-100 text-gray-700 select-none">
          <tr>
            <th
              className="p-2 text-left cursor-pointer"
              onClick={() => toggleSort("name")}
            >
              Name
              {sort.name === "asc" && " ▲"}
              {sort.name === "desc" && " ▼"}
            </th>
            <th className="p-2 text-center">Type</th>
            <th
              className="p-2 text-center cursor-pointer"
              onClick={() => toggleSort("start")}
            >
              Start
              {sort.start === "asc" && " ▲"}
              {sort.start === "desc" && " ▼"}
            </th>
            <th
              className="p-2 text-center cursor-pointer"
              onClick={() => toggleSort("end")}
            >
              End
              {sort.end === "asc" && " ▲"}
              {sort.end === "desc" && " ▼"}
            </th>
            <th className="p-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            // ✅ do calculations here, not inline in JSX
            const zonedStart = r.start
              ? utcToZonedTime(parseISO(r.start), timeZone)
              : null;
            const zonedEnd = r.end
              ? utcToZonedTime(parseISO(r.end), timeZone)
              : null;

            return (
              <tr
                key={r.id}
                className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
              >
                <td className="border p-2">{r.name}</td>
                <td className="border p-2 text-center">
                  <span
                    className={`px-2 py-1 rounded text-white text-xs font-medium ${
                      r.type === "Vacation" ? "bg-green-500" : "bg-blue-500"
                    }`}
                  >
                    {r.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}
                  </span>
                </td>
                <td className="border p-2 text-center">
                  {zonedStart
                    ? format(zonedStart, "MMM d, yyyy", { timeZone })
                    : "-"}
                </td>
                <td className="border p-2 text-center">
                  {zonedEnd
                    ? format(zonedEnd, "MMM d, yyyy", { timeZone })
                    : "-"}
                </td>
                <td className="border p-2 text-center space-x-2">
                  <button
                    onClick={() => startEdit(r)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteRecord(r.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}

          {records.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-gray-500 p-4">
                No matching records
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
