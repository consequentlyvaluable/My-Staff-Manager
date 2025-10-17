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
import {
  fetchRecords,
  createRecord,
  updateRecord,
  removeRecord,
  removeRecords,
  isSupabaseConfigured,
} from "./lib/supabaseClient";


export default function App() {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  });
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

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Supabase sync
  useEffect(() => {
    let ignore = false;

    const loadRecords = async () => {
      if (!isSupabaseConfigured) {
        setErrorMessage(
          "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
        );
        setLoadingRecords(false);
        return;
      }

      setLoadingRecords(true);
      try {
        const data = await fetchRecords();
        if (!ignore) {
          setRecords(data);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Failed to load records", error);
          setErrorMessage("Failed to load records from Supabase.");
          setRecords([]);
        }
      } finally {
        if (!ignore) {
          setLoadingRecords(false);
        }
      }
    };

    loadRecords();

    return () => {
      ignore = true;
    };
  }, []);

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
  const handleSubmit = async () => {
    const error = validateRecord();
    if (error) {
      alert(error);
      return;
    }
    if (!isSupabaseConfigured) {
      alert("Supabase is not configured. Unable to save record.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateRecord(editingId, {
          name: form.name,
          type: form.type,
          start: form.start,
          end: form.end,
        });
        setRecords((prev) =>
          prev.map((rec) => (rec.id === editingId ? updated ?? rec : rec))
        );
        setEditingId(null);
      } else {
        const created = await createRecord({
          name: form.name,
          type: form.type,
          start: form.start,
          end: form.end,
        });
        if (created) {
          setRecords((prev) => [...prev, created]);
        }
      }
      setForm({ name: employees[0], type: "Vacation", start: "", end: "" });
    } catch (err) {
      console.error("Failed to save record", err);
      alert("Failed to save record. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (id) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;
    if (confirm(`Delete booking for ${rec.name}?`)) {
      if (!isSupabaseConfigured) {
        alert("Supabase is not configured. Unable to delete record.");
        return;
      }

      try {
        await removeRecord(id);
        setRecords((prev) => prev.filter((r) => r.id !== id));
        if (editingId === id) cancelEdit();
      } catch (error) {
        console.error("Failed to delete record", error);
        alert("Failed to delete record. Please try again.");
      }
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

  const clearAll = async () => {
    if (records.length === 0) return;
    if (!confirm("Clear all bookings?")) return;
    if (!isSupabaseConfigured) {
      alert("Supabase is not configured. Unable to clear records.");
      return;
    }

    setIsClearing(true);
    try {
      await removeRecords(records.map((record) => record.id));
      setRecords([]);
      cancelEdit();
    } catch (error) {
      console.error("Failed to clear records", error);
      alert("Failed to clear records. Please try again.");
    } finally {
      setIsClearing(false);
    }
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
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
      <Header
        onSidebarToggle={() => setSidebarOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />
      <div className="flex flex-1">
        <Sidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1 p-6 md:ml-0 transition-colors duration-300">
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
                  clearAll={clearAll}
                  records={records}
                  isSaving={isSaving}
                  isClearing={isClearing}
                />
                {errorMessage && (
                  <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                  </div>
                )}
                {loadingRecords ? (
                  <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                    Loading records...
                  </div>
                ) : (
                  <BookingTable
                    records={filteredSortedRecords}
                    search={search}
                    setSearch={setSearch}
                    sort={sort}
                    setSort={setSort}
                    startEdit={startEdit}
                    deleteRecord={deleteRecord}
                  />
                )}
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
