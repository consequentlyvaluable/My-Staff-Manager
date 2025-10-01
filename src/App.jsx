import { useState, useEffect, useMemo } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BookingForm from "./components/BookingForm";
import BookingTable from "./components/BookingTable";
import CalendarView from "./components/CalendarView";
import EmployeeList from "./components/EmployeeList";
import Reports from "./components/Reports";
import { employees } from "./data/employees";
import { isAfter, isBefore, isEqual } from "date-fns";


export default function App() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({
    name: employees[0],
    type: "Vacation",
    start: "",
    end: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ name: null, start: null, end: null });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  // localStorage sync
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("records")) || [];
    setRecords(saved);
  }, []);
  useEffect(() => {
    localStorage.setItem("records", JSON.stringify(records));
  }, [records]);

  // validation
  const validateRecord = () => {
    if (!form.start || !form.end)
      return "Both start and end dates are required.";
    const startDate = new Date(form.start);
    const endDate = new Date(form.end);
    if (isAfter(startDate, endDate))
      return "End date must be on or after start date.";

    for (const r of records) {
      if (r.name !== form.name) continue;
      if (editingId && r.id === editingId) continue;
      const rStart = new Date(r.start);
      const rEnd = new Date(r.end);
      if (
        (isBefore(startDate, rEnd) || isEqual(startDate, rEnd)) &&
        (isAfter(endDate, rStart) || isEqual(endDate, rStart))
      ) {
        return `${form.name} already has a booking that overlaps these dates.`;
      }
    }
    return null;
  };

  // handlers
  const handleSubmit = () => {
    const error = validateRecord();
    if (error) {
      alert(error);
      return;
    }
    if (editingId) {
      setRecords((prev) =>
        prev.map((rec) =>
          rec.id === editingId ? { ...form, id: editingId } : rec
        )
      );
      setEditingId(null);
    } else {
      setRecords((prev) => [...prev, { ...form, id: crypto.randomUUID() }]);
    }
    setForm({ name: employees[0], type: "Vacation", start: "", end: "" });
  };

  const deleteRecord = (id) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;
    if (confirm(`Delete booking for ${rec.name}?`)) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) cancelEdit();
    }
  };

  const startEdit = (record) => {
    setForm({
      name: record.name,
      type: record.type,
      start: record.start,
      end: record.end,
    });
    setEditingId(record.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: employees[0], type: "Vacation", start: "", end: "" });
  };

  // search + sort
  const filteredSortedRecords = useMemo(() => {
    let filtered = records;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
      );
    }
    const sortKeys = Object.keys(sort).filter((k) => sort[k]);
    if (sortKeys.length > 0) {
      const key = sortKeys[0];
      const direction = sort[key];
      filtered = [...filtered].sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];
        if (key === "start" || key === "end") {
          aVal = new Date(aVal).getTime();
          bVal = new Date(bVal).getTime();
        }
        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [records, search, sort]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header onSidebarToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 p-6 md:ml-0">
          {currentPage === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="md:col-span-2 space-y-6">
                <BookingForm
                  form={form}
                  setForm={setForm}
                  employees={employees}
                  handleSubmit={handleSubmit}
                  editingId={editingId}
                  cancelEdit={cancelEdit}
                  clearAll={() => setRecords([])}
                  records={records}
                />
                <BookingTable
                  records={filteredSortedRecords}
                  search={search}
                  setSearch={setSearch}
                  sort={sort}
                  setSort={setSort}
                  startEdit={startEdit}
                  deleteRecord={deleteRecord}
                />
              </div>
              <div className="md:col-span-3">
                <CalendarView
                  records={records}
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                />
              </div>
            </div>
          )}
          {currentPage === "employees" && (
            <EmployeeList
              employees={employees}
              records={records}
              search={search}
              setSearch={setSearch}
              startEdit={startEdit}
              deleteRecord={deleteRecord}
            />
          )}
          {currentPage === "reports" && <Reports records={records} />}
        </main>
      </div>
    </div>
  );
}
