import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BookingForm from "./components/BookingForm";
import BookingTable from "./components/BookingTable";
import CalendarView from "./components/CalendarView";
import EmployeeList from "./components/EmployeeList";
import Reports from "./components/Reports";
import ConfirmDialog from "./components/ConfirmDialog";
import { employees } from "./data/employees";
import LoginPage from "./components/LoginPage";
import { isAfter, isBefore, isEqual } from "date-fns";
import {
  fetchRecords,
  createRecord,
  updateRecord,
  removeRecord,
  removeRecords,
  isSupabaseConfigured,
  signInEmployee,
  signOutEmployee,
  fetchEmployeeProfile,
  restoreSession,
} from "./lib/supabaseClient";

const stripEmployeeLabel = (label) =>
  typeof label === "string" ? label.replace(/^\d+\.\s*/, "").trim() : "";

const employeeLabelLookup = new Map(
  employees.map((entry) => [stripEmployeeLabel(entry).toLowerCase(), entry])
);

const lookupEmployeeLabel = (value) => {
  if (!value) return "";
  return employeeLabelLookup.get(stripEmployeeLabel(value).toLowerCase()) ?? "";
};

const fallbackNameFromEmail = (email) => {
  if (!email) return "Team member";
  const localPart = email.split("@")[0] ?? "";
  if (!localPart) return email;
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return email;
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
};

const buildUserContext = (authUser, profile) => {
  if (!authUser) return null;
  const metadata = authUser.user_metadata ?? {};
  const email = profile?.email || authUser.email || metadata.email || "";
  const rawName =
    (typeof profile?.display_name === "string" && profile.display_name.trim()) ||
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    (typeof metadata.display_name === "string" && metadata.display_name.trim()) ||
    "";
  const name = rawName || fallbackNameFromEmail(email);
  const labelSources = [
    profile?.employee_label,
    metadata.employee_label,
    metadata.full_name,
    metadata.preferred_name,
    rawName,
    name,
  ];
  let employeeLabel = "";
  for (const source of labelSources) {
    employeeLabel = lookupEmployeeLabel(source);
    if (employeeLabel) break;
  }

  return {
    id: authUser.id,
    name,
    email,
    employeeLabel,
  };
};

const toDateTimeLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffsetMs = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
};

const toIsoStringIfPossible = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
};

const formatDateForSummary = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  };
  return new Intl.DateTimeFormat(undefined, options).format(date);
};

const formatBookingRange = (start, end) => {
  const formattedStart = formatDateForSummary(start);
  const formattedEnd = formatDateForSummary(end);
  if (formattedStart === "-" && formattedEnd === "-") return "-";
  return `${formattedStart} → ${formattedEnd}`;
};

function createEmptyForm(name = "") {
  return {
    name,
    type: "Vacation",
    start: "",
    end: "",
  };
}


export default function App() {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearError, setClearError] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [form, setForm] = useState(() => createEmptyForm());
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

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let ignore = false;

    const hydrateUser = async () => {
      try {
        const session = await restoreSession();
        if (!session?.user) return;
        const profile = await fetchEmployeeProfile({
          userId: session.user.id,
          email: session.user.email,
        });
        if (ignore) return;
        const userContext = buildUserContext(session.user, profile);
        setCurrentUser(userContext);
        setForm(createEmptyForm(userContext?.employeeLabel ?? ""));
      } catch (error) {
        console.warn("Failed to restore Supabase session", error);
      }
    };

    hydrateUser();

    return () => {
      ignore = true;
    };
  }, []);

  // Supabase sync
  useEffect(() => {
    let ignore = false;

    if (!currentUser) {
      setRecords([]);
      setLoadingRecords(false);
      setErrorMessage(null);
      return () => {
        ignore = true;
      };
    }

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
  }, [currentUser]);

  useEffect(() => {
    if (editingId) return;
    setForm(createEmptyForm(currentUser?.employeeLabel ?? ""));
  }, [currentUser, editingId]);

  // validation
  const validateRecord = () => {
    if (!form.name) return "Please select an employee.";
    if (!form.start || !form.end)
      return "Both start and end date & time values are required.";
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
      const payload = {
        name: form.name,
        type: form.type,
        start: toIsoStringIfPossible(form.start),
        end: toIsoStringIfPossible(form.end),
      };

      if (editingId) {
        const updated = await updateRecord(editingId, payload);
        setRecords((prev) =>
          prev.map((rec) => {
            if (rec.id !== editingId) return rec;
            if (!updated) {
              return { ...rec, ...payload };
            }
            return {
              ...rec,
              ...updated,
              start: updated.start ?? payload.start,
              end: updated.end ?? payload.end,
            };
          })
        );
        setEditingId(null);
      } else {
        const created = await createRecord(payload);
        if (created) {
          const recordWithFallback = {
            ...created,
            start: created.start ?? payload.start,
            end: created.end ?? payload.end,
          };
          setRecords((prev) => [...prev, recordWithFallback]);
        }
      }
      setForm(createEmptyForm(currentUser?.employeeLabel ?? ""));
    } catch (err) {
      console.error("Failed to save record", err);
      alert("Failed to save record. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = (id) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return;
    setDeleteError("");
    setPendingDelete(rec);
  };

  const startEdit = (record) => {
    setForm({
      name: record.name,
      type: record.type,
      start: toDateTimeLocalInput(record.start),
      end: toDateTimeLocalInput(record.end),
    });
    setEditingId(record.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(createEmptyForm(currentUser?.employeeLabel ?? ""));
  };

  const cancelDelete = () => {
    if (isDeleting) return;
    setPendingDelete(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    if (!isSupabaseConfigured) {
      setDeleteError("Supabase is not configured. Unable to delete record.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await removeRecord(pendingDelete.id);
      setRecords((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      if (editingId === pendingDelete.id) cancelEdit();
      setPendingDelete(null);
    } catch (error) {
      console.error("Failed to delete record", error);
      setDeleteError("Failed to delete record. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const clearAll = () => {
    if (records.length === 0 || isClearing) return;
    setClearError("");
    setClearDialogOpen(true);
  };

  const cancelClear = () => {
    if (isClearing) return;
    setClearDialogOpen(false);
    setClearError("");
  };

  const confirmClearAll = async () => {
    if (records.length === 0) {
      setClearDialogOpen(false);
      setClearError("");
      return;
    }

    if (!isSupabaseConfigured) {
      setClearError("Supabase is not configured. Unable to clear records.");
      return;
    }

    setIsClearing(true);
    setClearError("");

    const ids = records.map((record) => record.id);

    try {
      await removeRecords(ids);
      setClearDialogOpen(false);
      setClearError("");
      setRecords([]);
      cancelEdit();
    } catch (error) {
      console.error("Failed to clear records", error);
      setClearError("Failed to clear records. Please try again.");
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

  const handleLogin = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Please contact your administrator to enable sign-in."
      );
    }

    const session = await signInEmployee({ email, password });
    const profile = await fetchEmployeeProfile({
      userId: session.user?.id,
      email: session.user?.email || email,
    });
    const user = buildUserContext(session.user, profile);
    setCurrentUser(user);
    setCurrentPage("dashboard");
    setSidebarOpen(false);
    setSearch("");
    setSort({ name: null, start: null, end: null });
    setForm(createEmptyForm(user?.employeeLabel ?? ""));
    return user;
  };

  const handleLogout = async () => {
    try {
      await signOutEmployee();
    } catch (error) {
      console.warn("Supabase logout failed", error);
    }

    setCurrentUser(null);
    setCurrentPage("dashboard");
    setSidebarOpen(false);
    setSearch("");
    setSort({ name: null, start: null, end: null });
    setEditingId(null);
    setForm(createEmptyForm());
    setRecords([]);
  };

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900 transition-colors duration-300 dark:bg-gray-900 dark:text-gray-100">
      <Header
        onSidebarToggle={() => setSidebarOpen(true)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        user={currentUser}
        onLogout={handleLogout}
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
                  isSaving={isSaving}
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
                    clearAll={clearAll}
                    isClearing={isClearing}
                    hasAnyRecords={records.length > 0}
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
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
              <div className="order-2 xl:order-1">
                <EmployeeList
                  employees={employees}
                  records={records}
                  search={search}
                  setSearch={setSearch}
                  startEdit={startEdit}
                  deleteRecord={deleteRecord}
                  editingId={editingId}
                />
              </div>
              <div className="order-1 space-y-6 xl:order-2">
                {editingId ? (
                  <BookingForm
                    form={form}
                    setForm={setForm}
                    employees={employees}
                    handleSubmit={handleSubmit}
                    editingId={editingId}
                    cancelEdit={cancelEdit}
                    isSaving={isSaving}
                  />
                ) : (
                  <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-white/80 p-8 text-center text-slate-500 shadow-lg shadow-slate-900/5 transition-colors dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-black/30">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300">
                      ✏️
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">
                      Select a booking to edit
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed">
                      Choose a booking from the list to review and update it without leaving the Employees tab.
                    </p>
                  </div>
                )}
                {errorMessage && (
                  <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm dark:border-red-500/50 dark:bg-red-500/10 dark:text-red-200">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          )}
          {currentPage === "reports" && <Reports records={records} />}
        </main>
      </div>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete booking"
        message={
          pendingDelete
            ? `Are you sure you want to delete the booking for ${pendingDelete.name}?`
            : ""
        }
        confirmLabel="Delete booking"
        cancelLabel="Keep booking"
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
        loading={isDeleting}
        loadingLabel="Deleting..."
        error={deleteError}
      >
        {pendingDelete && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/60 dark:text-gray-200">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {pendingDelete.name}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-200">
              {pendingDelete.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-300">
              {formatBookingRange(pendingDelete.start, pendingDelete.end)}
            </p>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={clearDialogOpen}
        title="Clear all bookings"
        message={
          records.length
            ? `This will permanently remove ${records.length} booking${
                records.length === 1 ? "" : "s"
              }.`
            : "There are no bookings to clear."
        }
        confirmLabel="Clear all bookings"
        cancelLabel="Go back"
        onCancel={cancelClear}
        onConfirm={confirmClearAll}
        loading={isClearing}
        loadingLabel="Clearing..."
        error={clearError}
      >
        {records.length > 0 && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-700/60 dark:text-gray-200">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {records.length === 1
                ? "The following booking will be removed:"
                : `The first ${Math.min(records.length, 3)} bookings to be removed:`}
            </p>
            <ul className="mt-3 space-y-2 text-xs text-gray-500 dark:text-gray-300">
              {records.slice(0, 3).map((record) => (
                <li key={record.id} className="rounded-lg bg-white/60 p-2 dark:bg-gray-800/50">
                  <p className="font-medium text-gray-700 dark:text-gray-100">{record.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-400">
                    {record.type === "Vacation" ? "🌴 Vacation" : "✈️ Travel"}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-300">
                    {formatBookingRange(record.start, record.end)}
                  </p>
                </li>
              ))}
            </ul>
            {records.length > 3 && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                + {records.length - 3} more booking{records.length - 3 === 1 ? "" : "s"}
              </p>
            )}
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              This action cannot be undone.
            </p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
