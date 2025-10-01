import { format, parseISO } from "date-fns";

export default function BookingTable({
  records,
  search,
  setSearch,
  sort,
  setSort,
  startEdit,
  deleteRecord,
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
    <div className="bg-white p-6 rounded-2xl shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Schedule</h2>
        <input
          type="text"
          placeholder="Search by name or type..."
          className="border rounded px-2 py-1 text-sm w-48 bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
            const startDate = r.start ? parseISO(r.start) : null;
            const endDate = r.end ? parseISO(r.end) : null;

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
                  {startDate ? format(startDate, "MMM d, yyyy") : "-"}
                </td>
                <td className="border border-gray-100 p-2 text-center text-gray-700 dark:border-gray-600 dark:text-gray-100">
                  {endDate ? format(endDate, "MMM d, yyyy") : "-"}
                </td>
                <td className="border border-gray-100 p-2 text-center space-x-2 dark:border-gray-600">
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
