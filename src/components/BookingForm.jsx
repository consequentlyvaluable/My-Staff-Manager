import { format } from "date-fns";

export default function BookingForm({
  form,
  setForm,
  employees,
  handleSubmit,
  editingId,
  cancelEdit,
  clearAll,
  records,
}) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-4 transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          {editingId ? "Edit Booking" : "Add Booking"}
        </h2>
        {editingId && (
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={cancelEdit}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Employee */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
          Employee
        </label>
        <select
          className="w-full border p-2 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        >
          {employees.map((emp) => (
            <option key={emp.id} value={emp.name}>
              {emp.name}
            </option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">Type</label>
        <select
          className="w-full border p-2 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option>Vacation</option>
          <option>Travel</option>
        </select>
      </div>

      {/* Dates */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
            Start
          </label>
          <input
            type="date"
            className="w-full border p-2 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">End</label>
          <input
            type="date"
            className="w-full border p-2 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={form.end}
            onChange={(e) => setForm({ ...form, end: e.target.value })}
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg shadow flex items-center justify-center gap-2"
        onClick={handleSubmit}
      >
        <span className="text-lg font-bold">{editingId ? "✓" : "+"}</span>
        <span>{editingId ? "Update" : "Add"}</span>
      </button>

      {/* Clear All */}
      {records.length > 0 && (
        <button
          className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg shadow text-sm"
          onClick={clearAll}
        >
          Clear All
        </button>
      )}
    </div>
  );
}
