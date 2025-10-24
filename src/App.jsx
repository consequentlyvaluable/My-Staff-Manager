import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BookingForm from "./components/BookingForm";
import BookingTable from "./components/BookingTable";
import CalendarView from "./components/CalendarView";
import EmployeeList from "./components/EmployeeList";
import Reports from "./components/Reports";
import ConfirmDialog from "./components/ConfirmDialog";
import LoginPage from "./components/LoginPage";
import { isAfter, isBefore, isEqual } from "date-fns";
import {
  fetchRecords,
  createRecord,
  updateRecord,
  removeRecord,
  removeRecords,
  isSupabaseConfigured,
  fetchEmployees,
  signInEmployee,
  signOutEmployee,
  fetchEmployeeProfile,
  restoreSession,
  fetchTenantsForIdentifier,
  fetchTenantBySlug,
  verifyTenantMembership,
} from "./lib/supabaseClient";
import {
  detectTenantSlugFromLocation,
  loadStoredTenant,
  storeActiveTenant,
  clearStoredTenant,
} from "./lib/tenant";

const stripEmployeeLabel = (label) =>
  typeof label === "string" ? label.replace(/^\d+\.\s*/, "").trim() : "";

const buildEmployeeLookup = (list) => {
  const lookup = new Map();
  for (const entry of list) {
    const label =
      typeof entry === "string"
        ? entry.trim()
        : typeof entry?.label === "string"
        ? entry.label.trim()
        : "";
    if (!label) continue;
    const key = stripEmployeeLabel(label).toLowerCase();
    if (!key) continue;
    lookup.set(key, label);
  }
  return lookup;
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

const buildUserContext = (authUser, profile, lookupEmployeeLabel = () => "") => {
  if (!authUser) return null;
  const resolveEmployeeLabel =
    typeof lookupEmployeeLabel === "function"
      ? lookupEmployeeLabel
      : () => "";
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
    employeeLabel = resolveEmployeeLabel(source);
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
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(
    () => !!isSupabaseConfigured
  );
  const [employeesError, setEmployeesError] = useState(null);
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
  const [currentTenant, setCurrentTenant] = useState(null);
  const [enforcedTenant, setEnforcedTenant] = useState(null);
  const [enforcedTenantSlug, setEnforcedTenantSlug] = useState(null);
  const [tenantLookupOptions, setTenantLookupOptions] = useState([]);
  const [tenantLookupLoading, setTenantLookupLoading] = useState(false);
  const [tenantLookupError, setTenantLookupError] = useState("");
  const [selectedTenantForLogin, setSelectedTenantForLogin] = useState(null);
  const [tenantDetectionError, setTenantDetectionError] = useState("");
  const [tenantDetectionResolved, setTenantDetectionResolved] = useState(false);
  const [form, setForm] = useState(() => createEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ name: null, start: null, end: null });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const tenantLookupRequestIdRef = useRef(0);
  const lastLookupIdentifierRef = useRef("");

  const employeeLookup = useMemo(
    () => buildEmployeeLookup(employees),
    [employees]
  );

  const lookupEmployeeLabel = useCallback(
    (value) => {
      if (!value) return "";
      return (
        employeeLookup.get(stripEmployeeLabel(value).toLowerCase()) ?? ""
      );
    },
    [employeeLookup]
  );

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
    if (!isSupabaseConfigured) {
      setTenantDetectionResolved(true);
      return;
    }

    const slug = detectTenantSlugFromLocation();
    setEnforcedTenantSlug(slug);
    if (!slug) {
      setTenantDetectionResolved(true);
      return;
    }

    let ignore = false;

    const resolveTenant = async () => {
      try {
        const tenant = await fetchTenantBySlug(slug);
        if (ignore) return;

        if (!tenant) {
          setTenantDetectionError(
            "The company associated with this subdomain is inactive or missing."
          );
          setEnforcedTenant(null);
          setTenantLookupOptions([]);
          setSelectedTenantForLogin(null);
        } else {
          setEnforcedTenant(tenant);
          setTenantDetectionError("");
          setTenantLookupOptions([tenant]);
          setSelectedTenantForLogin(tenant);
        }
      } catch (error) {
        if (ignore) return;
        console.error("Failed to resolve tenant for subdomain", error);
        setTenantDetectionError(
          "Unable to resolve the company for this subdomain. Please try again later."
        );
        setEnforcedTenant(null);
      } finally {
        if (!ignore) {
          setTenantDetectionResolved(true);
        }
      }
    };

    resolveTenant();

    return () => {
      ignore = true;
    };
  }, [isSupabaseConfigured]);

  useEffect(() => {
    if (!tenantDetectionResolved) return;
    if (!isSupabaseConfigured) return;
    if (enforcedTenant) return;

    const stored = loadStoredTenant();
    if (!stored?.slug) return;

    let ignore = false;

    const hydrateStoredTenant = async () => {
      try {
        const tenant = await fetchTenantBySlug(stored.slug);
        if (ignore) return;
        if (!tenant) {
          clearStoredTenant();
          return;
        }
        setSelectedTenantForLogin((prev) => {
          if (prev?.id === tenant.id) return prev;
          return tenant;
        });
        setTenantLookupOptions((prev) => {
          if (prev.some((option) => option.id === tenant.id)) return prev;
          return [...prev, tenant];
        });
      } catch (error) {
        console.warn("Unable to restore tenant from storage", error);
      }
    };

    hydrateStoredTenant();

    return () => {
      ignore = true;
    };
  }, [tenantDetectionResolved, enforcedTenant, isSupabaseConfigured]);

  const lookupTenantsForIdentifier = useCallback(
    async (identifier) => {
      const normalized = identifier?.trim().toLowerCase() ?? "";
      const requestId = tenantLookupRequestIdRef.current + 1;
      tenantLookupRequestIdRef.current = requestId;

      if (!isSupabaseConfigured) {
        if (tenantLookupRequestIdRef.current === requestId) {
          setTenantLookupError(
            "Supabase is not configured. Please contact your administrator."
          );
          setTenantLookupLoading(false);
          if (enforcedTenant) {
            setTenantLookupOptions([enforcedTenant]);
            setSelectedTenantForLogin(enforcedTenant);
          } else {
            setTenantLookupOptions([]);
            setSelectedTenantForLogin(null);
          }
          lastLookupIdentifierRef.current = normalized;
        }
        return;
      }

      if (!normalized) {
        if (tenantLookupRequestIdRef.current === requestId) {
          setTenantLookupError("");
          setTenantLookupLoading(false);
          if (enforcedTenant) {
            setTenantLookupOptions([enforcedTenant]);
            setSelectedTenantForLogin(enforcedTenant);
          } else {
            setTenantLookupOptions([]);
            setSelectedTenantForLogin(null);
          }
          lastLookupIdentifierRef.current = normalized;
        }
        return;
      }

      setTenantLookupLoading(true);
      setTenantLookupError("");

      try {
        const tenants = await fetchTenantsForIdentifier(normalized);
        if (tenantLookupRequestIdRef.current !== requestId) return;

        let options = tenants;
        if (enforcedTenant) {
          options = tenants.filter((tenant) => tenant.id === enforcedTenant.id);
          if (!options.length) {
            setTenantLookupOptions([]);
            setSelectedTenantForLogin(null);
            setTenantLookupError(
              "This account is not linked to the company for this subdomain."
            );
            lastLookupIdentifierRef.current = normalized;
            return;
          }
        }

        setTenantLookupOptions(options);
        setSelectedTenantForLogin((prev) => {
          if (prev && options.some((option) => option.id === prev.id)) {
            return (
              options.find((option) => option.id === prev.id) ??
              options[0] ??
              null
            );
          }
          if (options.length > 0) return options[0];
          if (enforcedTenant) return enforcedTenant;
          return null;
        });
        if (!options.length) {
          setTenantLookupError("No active companies found for this account.");
        } else {
          setTenantLookupError("");
        }
        lastLookupIdentifierRef.current = normalized;
      } catch (error) {
        if (tenantLookupRequestIdRef.current !== requestId) return;
        console.error("Failed to lookup tenants", error);
        setTenantLookupOptions(enforcedTenant ? [enforcedTenant] : []);
        setSelectedTenantForLogin(enforcedTenant ?? null);
        setTenantLookupError(
          error?.message || "Unable to look up companies for this account."
        );
        lastLookupIdentifierRef.current = normalized;
      } finally {
        if (tenantLookupRequestIdRef.current === requestId) {
          setTenantLookupLoading(false);
        }
      }
    },
    [enforcedTenant, isSupabaseConfigured]
  );

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setEmployees([]);
      setLoadingEmployees(false);
      setEmployeesError(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    if (!currentTenant) {
      setEmployees([]);
      setEmployeesError(null);
      setLoadingEmployees(false);
      return;
    }

    let ignore = false;

    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await fetchEmployees({ tenantId: currentTenant.id });
        if (ignore) return;
        setEmployees(data);
        setEmployeesError(null);
      } catch (error) {
        if (ignore) return;
        console.error("Failed to load employees", error);
        setEmployees([]);
        setEmployeesError("Failed to load employees from Supabase.");
      } finally {
        if (!ignore) {
          setLoadingEmployees(false);
        }
      }
    };

    loadEmployees();

    return () => {
      ignore = true;
    };
  }, [currentTenant, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!tenantDetectionResolved) return;

    let ignore = false;

    const hydrateUser = async () => {
      try {
        const session = await restoreSession();
        if (!session?.user) return;

        let tenantCandidate = null;

        if (enforcedTenant) {
          const allowed = await verifyTenantMembership({
            tenantId: enforcedTenant.id,
            userId: session.user.id,
            identifier: session.user.email,
          });
          if (!allowed) {
            await signOutEmployee();
            clearStoredTenant();
            setCurrentTenant(enforcedTenant);
            setSelectedTenantForLogin(enforcedTenant);
            setTenantLookupOptions([enforcedTenant]);
            return;
          }
          tenantCandidate = enforcedTenant;
        } else {
          const storedTenant = loadStoredTenant();
          if (storedTenant?.slug) {
            const tenant = await fetchTenantBySlug(storedTenant.slug);
            if (tenant) {
              const allowed = await verifyTenantMembership({
                tenantId: tenant.id,
                userId: session.user.id,
                identifier: session.user.email,
              });
              if (allowed) {
                tenantCandidate = tenant;
              } else {
                clearStoredTenant();
              }
            } else {
              clearStoredTenant();
            }
          }

          if (!tenantCandidate) {
            const availableTenants = await fetchTenantsForIdentifier(
              session.user.email || ""
            );
            tenantCandidate = availableTenants[0] ?? null;
          }
        }

        if (!tenantCandidate) {
          await signOutEmployee();
          clearStoredTenant();
          if (enforcedTenant) {
            setCurrentTenant(enforcedTenant);
            setSelectedTenantForLogin(enforcedTenant);
            setTenantLookupOptions([enforcedTenant]);
          } else {
            setCurrentTenant(null);
            setSelectedTenantForLogin(null);
            setTenantLookupOptions([]);
          }
          return;
        }

        const profile = await fetchEmployeeProfile({
          userId: session.user.id,
          email: session.user.email,
          tenantId: tenantCandidate.id,
        });

        if (ignore) return;

        setCurrentTenant(tenantCandidate);
        setSelectedTenantForLogin(tenantCandidate);
        setTenantLookupOptions((prev) => {
          if (prev.some((option) => option.id === tenantCandidate.id)) return prev;
          return [...prev, tenantCandidate];
        });
        setTenantLookupError("");
        storeActiveTenant(tenantCandidate);

        const userContext = buildUserContext(
          session.user,
          profile,
          lookupEmployeeLabel
        );
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
  }, [
    enforcedTenant,
    isSupabaseConfigured,
    lookupEmployeeLabel,
    tenantDetectionResolved,
    fetchEmployeeProfile,
    fetchTenantBySlug,
    fetchTenantsForIdentifier,
    verifyTenantMembership,
    signOutEmployee,
    clearStoredTenant,
    loadStoredTenant,
    storeActiveTenant,
  ]);

  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.employeeLabel) return;
    const derivedLabel = lookupEmployeeLabel(
      currentUser.employeeLabel || currentUser.name
    );
    if (!derivedLabel) return;
    setCurrentUser((prev) =>
      prev
        ? {
            ...prev,
            employeeLabel: derivedLabel,
          }
        : prev
    );
  }, [currentUser, lookupEmployeeLabel]);

  // Supabase sync
  useEffect(() => {
    let ignore = false;

    if (!currentUser || !currentTenant) {
      setRecords([]);
      setLoadingRecords(false);
      setErrorMessage(null);
      return () => {
        ignore = true;
      };
    }

    if (!isSupabaseConfigured) {
      setErrorMessage(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      setLoadingRecords(false);
      return () => {
        ignore = true;
      };
    }

    const loadRecords = async () => {
      setLoadingRecords(true);
      try {
        const data = await fetchRecords({ tenantId: currentTenant.id });
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
  }, [currentUser, currentTenant, isSupabaseConfigured]);

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
  const handleCalendarUpdate = useCallback(
    async ({ event, start, end }) => {
      if (!event?.id) return;
      const target = records.find((r) => r.id === event.id);
      if (!target) return;

      const nextStart = start instanceof Date ? start : new Date(start);
      const nextEnd = end instanceof Date ? end : new Date(end);
      if (
        Number.isNaN(nextStart.getTime()) ||
        Number.isNaN(nextEnd.getTime())
      ) {
        return;
      }

      if (isAfter(nextStart, nextEnd)) {
        alert("End date must be on or after start date.");
        return;
      }

      const hasConflict = records.some((record) => {
        if (record.id === event.id) return false;
        if (record.name !== target.name) return false;
        const recordStart = new Date(record.start);
        const recordEnd = new Date(record.end);
        if (
          Number.isNaN(recordStart.getTime()) ||
          Number.isNaN(recordEnd.getTime())
        ) {
          return false;
        }
        return (
          (isBefore(recordStart, nextEnd) || isEqual(recordStart, nextEnd)) &&
          (isAfter(recordEnd, nextStart) || isEqual(recordEnd, nextStart))
        );
      });

      if (hasConflict) {
        alert(
          `${target.name} already has a booking that overlaps these dates.`
        );
        return;
      }

      if (!isSupabaseConfigured) {
        alert("Supabase is not configured. Unable to update booking.");
        return;
      }

      if (!currentTenant) {
        alert("Select a company before managing bookings.");
        return;
      }

      const nextStartIso = nextStart.toISOString();
      const nextEndIso = nextEnd.toISOString();

      let previousEvent = null;
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec.id !== event.id) return rec;
          previousEvent = { ...rec };
          return {
            ...rec,
            start: nextStartIso,
            end: nextEndIso,
          };
        })
      );

      try {
        const updated = await updateRecord(currentTenant.id, event.id, {
          start: nextStartIso,
          end: nextEndIso,
        });

        if (updated) {
          setRecords((prev) =>
            prev.map((rec) =>
              rec.id === event.id
                ? {
                    ...rec,
                    ...updated,
                    start: updated.start ?? nextStartIso,
                    end: updated.end ?? nextEndIso,
                  }
                : rec
            )
          );
        }
      } catch (error) {
        console.error(
          "Failed to update record from calendar interaction",
          error
        );
        alert("Failed to update booking. Please try again.");
        if (previousEvent) {
          setRecords((prev) =>
            prev.map((rec) => (rec.id === event.id ? previousEvent : rec))
          );
        }
      }
    },
    [records, isSupabaseConfigured, currentTenant]
  );

  const handleCalendarEventDrop = useCallback(
    (args) => {
      void handleCalendarUpdate(args);
    },
    [handleCalendarUpdate]
  );

  const handleCalendarEventResize = useCallback(
    (args) => {
      void handleCalendarUpdate(args);
    },
    [handleCalendarUpdate]
  );

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
    if (!currentTenant) {
      alert("Select a company before managing bookings.");
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
        const updated = await updateRecord(currentTenant.id, editingId, payload);
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
        const created = await createRecord(currentTenant.id, payload);
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
    if (!currentTenant) {
      setDeleteError("Select a company before managing bookings.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      await removeRecord(currentTenant.id, pendingDelete.id);
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
    if (!currentTenant) {
      setClearError("Select a company before managing bookings.");
      return;
    }

    setIsClearing(true);
    setClearError("");

    const ids = records.map((record) => record.id);

    try {
      await removeRecords(currentTenant.id, ids);
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

  const handleLogin = async ({ email, password, tenant }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Please contact your administrator to enable sign-in."
      );
    }

    if (!tenant?.id) {
      throw new Error("Please select a company before signing in.");
    }

    if (enforcedTenant && tenant.id !== enforcedTenant.id) {
      throw new Error(
        "You must sign in using the company associated with this subdomain."
      );
    }

    const session = await signInEmployee({ email, password });
    const membershipOk = await verifyTenantMembership({
      tenantId: tenant.id,
      userId: session.user?.id,
      identifier: email,
    });

    if (!membershipOk) {
      await signOutEmployee();
      throw new Error(
        "Your account does not have access to the selected company."
      );
    }

    const profile = await fetchEmployeeProfile({
      userId: session.user?.id,
      email: session.user?.email || email,
      tenantId: tenant.id,
    });
    const user = buildUserContext(session.user, profile, lookupEmployeeLabel);
    setCurrentUser(user);
    setCurrentTenant(tenant);
    setSelectedTenantForLogin(tenant);
    setTenantLookupOptions((prev) => {
      if (prev.some((option) => option.id === tenant.id)) return prev;
      return [...prev, tenant];
    });
    setTenantLookupError("");
    storeActiveTenant(tenant);
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
    if (enforcedTenant) {
      setCurrentTenant(enforcedTenant);
      setSelectedTenantForLogin(enforcedTenant);
      setTenantLookupOptions([enforcedTenant]);
      storeActiveTenant(enforcedTenant);
    } else {
      setCurrentTenant(null);
      setSelectedTenantForLogin(null);
      setTenantLookupOptions([]);
      clearStoredTenant();
    }
    setTenantLookupError("");
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
        tenantOptions={tenantLookupOptions}
        selectedTenant={selectedTenantForLogin}
        onSelectTenant={setSelectedTenantForLogin}
        onLookupTenants={lookupTenantsForIdentifier}
        tenantLookupLoading={tenantLookupLoading}
        tenantLookupError={tenantLookupError}
        tenantDetectionError={tenantDetectionError}
        isTenantSelectionLocked={Boolean(enforcedTenant)}
        enforcedTenantSlug={enforcedTenantSlug}
        enforcedTenantName={enforcedTenant?.name}
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
                {loadingEmployees && (
                  <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                    Loading employees...
                  </div>
                )}
                {employeesError && (
                  <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {employeesError}
                  </div>
                )}
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
                  onEventDrop={handleCalendarEventDrop}
                  onEventResize={handleCalendarEventResize}
                />
              </div>
            </div>
          )}
          {currentPage === "employees" && (
            <div className="space-y-4">
              {loadingEmployees && (
                <div className="bg-white p-6 rounded-2xl shadow text-center text-gray-600 dark:bg-gray-800 dark:text-gray-200">
                  Loading employees...
                </div>
              )}
              {employeesError && (
                <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
                  {employeesError}
                </div>
              )}
              <EmployeeList
                employees={employees}
                records={records}
                search={search}
                setSearch={setSearch}
                startEdit={startEdit}
                deleteRecord={deleteRecord}
                loading={loadingEmployees}
              />
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
