export default function BookingForm({
  form,
  setForm,
  employees,
  handleSubmit,
  editingId,
  cancelEdit,
  clearAll,
  records,
  isSaving = false,
  isClearing = false,
}) {
  const employeeInputId = "booking-form-employee";
  const employeeListId = "booking-form-employee-options";

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
        <label
          className="block text-sm font-medium text-gray-600 dark:text-gray-300"
          htmlFor={employeeInputId}
        >
          Employee
        </label>
        <div className="relative">
          <input
            id={employeeInputId}
            list={employeeListId}
            type="text"
            placeholder="Select or type an employee"
            className="w-full border py-2 pl-3 pr-10 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400 dark:text-gray-300">
            ▼
          </span>
          <datalist id={employeeListId}>
            {employees.map((emp) => (
              <option key={emp} value={emp} />
            ))}
          </datalist>
        </div>
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

      {/* Dates & Times */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
            Start date & time
          </label>
          <input
            type="datetime-local"
            className="w-full border p-2 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={form.start}
            onChange={(e) => setForm({ ...form, start: e.target.value })}
            step="60"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300">
            End date & time
          </label>
          <input
            type="datetime-local"
            className="w-full border p-2 rounded bg-white text-gray-900 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            value={form.end}
            onChange={(e) => setForm({ ...form, end: e.target.value })}
            step="60"
          />
        </div>
      </div>

      {/* Submit button */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-2.5 rounded-lg shadow flex items-center justify-center gap-2"
        onClick={handleSubmit}
        disabled={isSaving}
      >
        <span className="text-lg font-bold">{editingId ? "✓" : "+"}</span>
        <span>
          {isSaving ? (editingId ? "Saving..." : "Saving...") : editingId ? "Update" : "Add"}
        </span>
      </button>

      {/* Clear All */}
      {records.length > 0 && (
        <button
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white py-2 rounded-lg shadow text-sm"
          onClick={clearAll}
          disabled={isClearing}
        >
          {isClearing ? "Clearing..." : "Clear All"}
        </button>
      )}
    </div>
  );
}
