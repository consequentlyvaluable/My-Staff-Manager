import { useState, useEffect, useMemo, useCallback } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BookingForm from "./components/BookingForm";
import BookingTable from "./components/BookingTable";
import CalendarView from "./components/CalendarView";
import EmployeeList from "./components/EmployeeList";
import Reports from "./components/Reports";
import ConfirmDialog from "./components/ConfirmDialog";
import ChangePasswordDialog from "./components/ChangePasswordDialog";
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
  verifyEmployeePassword,
  signOutEmployee,
  updateEmployeePassword,
  fetchEmployeeProfile,
  restoreSession,
  requestPasswordReset,
  completeAuthFromHash,
} from "./lib/supabaseClient";

const stripEmployeeLabel = (label) =>
  typeof label === "string" ? label.replace(/^\d+\.\s*/, "").trim() : "";

const inferTeamIdentifier = (label) => {
  if (typeof label !== "string") return "";
  const match = label.match(/\(([^)]+)\)\s*$/);
  if (!match) return "";
  return match[1]?.trim?.() ?? "";
};

const normalizeRole = (value) => {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().toLowerCase();
  if (!cleaned) return "";
  if (["admin", "administrator", "owner"].includes(cleaned)) return "admin";
  if (["viewer", "read_only", "read-only", "readonly", "view"].includes(cleaned)) {
    return "viewer";
  }
  if (["team_lead", "teamlead", "lead", "leader"].includes(cleaned)) {
    return "team_lead";
  }
  if (["self", "self_edit", "self-editor", "self_editor"].includes(cleaned)) {
    return "self_editor";
  }
  return cleaned;
};

const coerceBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  }
  if (value == null) return fallback;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
};

const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

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

  const resolvedRole = normalizeRole(profile?.role || metadata.role);
  const defaultManageAll = resolvedRole ? resolvedRole === "admin" : true;
  let canManageAll = coerceBoolean(
    profile?.can_manage_all ?? metadata.can_manage_all,
    defaultManageAll
  );
  let canEditTeam = coerceBoolean(
    profile?.can_edit_team ?? metadata.can_edit_team,
    resolvedRole ? resolvedRole === "team_lead" || canManageAll : canManageAll
  );
  let canEditSelf = coerceBoolean(
    profile?.can_edit_self ?? metadata.can_edit_self,
    canEditTeam || canManageAll || resolvedRole === "self_editor"
  );
  const isReadOnly = coerceBoolean(
    profile?.is_read_only ?? metadata.is_read_only,
    resolvedRole === "viewer"
  );

  if (isReadOnly) {
    canManageAll = false;
    canEditTeam = false;
    canEditSelf = false;
  }

  const teamIdentifier =
    (typeof profile?.team_identifier === "string"
      ? profile.team_identifier.trim()
      : "") ||
    (typeof metadata.team_identifier === "string"
      ? metadata.team_identifier.trim()
      : "") ||
    inferTeamIdentifier(employeeLabel);

  const explicitTeamMembers = toStringArray(
    profile?.team_member_labels ?? metadata.team_member_labels
  );

  const permissions = {
    role:
      resolvedRole ||
      (isReadOnly
        ? "viewer"
        : canManageAll
        ? "admin"
        : canEditTeam
        ? "team_lead"
        : canEditSelf
        ? "self_editor"
        : "viewer"),
    canManageAll,
    canEditTeam,
    canEditSelf,
    isReadOnly,
  };

  return {
    id: authUser.id,
    name,
    email,
    employeeLabel,
    role: permissions.role,
    permissions,
    teamIdentifier,
    teamMemberLabels: explicitTeamMembers,
  };
};

const clearSupabaseAuthParamsFromUrl = () => {
  if (typeof window === "undefined") return;

  const authKeys = [
    "access_token",
    "refresh_token",
    "expires_in",
    "token_type",
    "type",
    "token",
    "token_hash",
    "email",
    "email_address",
  ];

  const { pathname, search, hash } = window.location;
  const searchParams = new URLSearchParams(search);
  const hashParams = new URLSearchParams(hash.replace(/^#/, ""));

  let modified = false;

  for (const key of authKeys) {
    if (searchParams.has(key)) {
      searchParams.delete(key);
      modified = true;
    }
    if (hashParams.has(key)) {
      hashParams.delete(key);
      modified = true;
    }
  }

  if (!modified) return;

  const newSearch = searchParams.toString();
  const newHash = hashParams.toString();
  const nextUrl =
    `${pathname}` +
    (newSearch ? `?${newSearch}` : "") +
    (newHash ? `#${newHash}` : "");

  window.history.replaceState(null, document.title, nextUrl);
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
  const [form, setForm] = useState(() => createEmptyForm());
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ name: null, start: null, end: null });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState("");
  const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

  const canManageAll = currentUser?.permissions?.canManageAll ?? true;
  const canEditTeam = currentUser?.permissions?.canEditTeam ?? canManageAll;
  const canEditSelf = currentUser?.permissions?.canEditSelf ?? true;
  const isReadOnly = currentUser?.permissions?.isReadOnly ?? false;

  const teamIdentifierFromUser = useMemo(() => {
    if (!currentUser) return "";
    return (
      currentUser.teamIdentifier ||
      inferTeamIdentifier(currentUser.employeeLabel ?? "")
    );
  }, [currentUser]);

  const { allowedSet: allowedEmployeeSet, allowedList: allowedEmployeeList } = useMemo(() => {
    const set = new Set();
    if (currentUser?.employeeLabel) {
      set.add(currentUser.employeeLabel);
    }

    const explicit = Array.isArray(currentUser?.teamMemberLabels)
      ? currentUser.teamMemberLabels.filter((label) => typeof label === "string" && label.trim().length > 0)
      : [];
    for (const label of explicit) {
      set.add(label);
    }

    if (canManageAll) {
      for (const label of employees) {
        set.add(label);
      }
    } else if (canEditTeam) {
      const teamId = teamIdentifierFromUser;
      if (teamId) {
        for (const label of employees) {
          if (inferTeamIdentifier(label) === teamId) {
            set.add(label);
          }
        }
      }
    }

    return { allowedSet: set, allowedList: Array.from(set) };
  }, [currentUser, employees, canManageAll, canEditTeam, teamIdentifierFromUser]);

  const canModifyEmployee = useCallback(
    (label) => {
      if (!currentUser) return false;
      if (isReadOnly) return false;
      if (canManageAll) return true;
      const normalized = typeof label === "string" ? label.trim() : "";
      if (!normalized) return false;
      if (canEditSelf && normalized === currentUser.employeeLabel) return true;
      if (canEditTeam && allowedEmployeeSet.has(normalized)) return true;
      return false;
    },
    [currentUser, isReadOnly, canManageAll, canEditSelf, canEditTeam, allowedEmployeeSet]
  );

  const canEditRecord = useCallback(
    (record) => {
      if (!record) return false;
      return canModifyEmployee(record.name);
    },
    [canModifyEmployee]
  );

  const canClearAllRecords = canManageAll && !isReadOnly;

  const availableEmployeesForForm = useMemo(() => {
    if (!currentUser) return employees;
    if (canManageAll) return employees;
    if (allowedEmployeeList.length > 0) return allowedEmployeeList;
    return currentUser.employeeLabel ? [currentUser.employeeLabel] : [];
  }, [currentUser, employees, canManageAll, allowedEmployeeList]);

  const canCreateOrEdit = !isReadOnly && (canManageAll || canEditTeam || canEditSelf);

  const bookingFormHelperText = useMemo(() => {
    if (isReadOnly) {
      return "You currently have read-only access.";
    }
    if (canManageAll) {
      return "You can manage bookings for all employees.";
    }
    if (canEditTeam) {
      return "You can manage bookings for team members.";
    }
    if (canEditSelf) {
      return "You can manage your own bookings.";
    }
    return "You do not have permission to manage bookings.";
  }, [isReadOnly, canManageAll, canEditTeam, canEditSelf]);

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

  const openChangePasswordDialog = () => {
    setChangePasswordOpen(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");
    setChangePasswordLoading(false);
  };

  const closeChangePasswordDialog = () => {
    if (changePasswordLoading) return;
    setChangePasswordOpen(false);
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  const handleChangePasswordSubmit = async ({
    currentPassword,
    newPassword,
  }) => {
    if (!currentUser?.email) {
      setChangePasswordError(
        "Unable to verify your account. Please sign out and sign in again."
      );
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordError("");
    setChangePasswordSuccess("");

    try {
      await verifyEmployeePassword({
        email: currentUser.email,
        password: currentPassword,
      });
    } catch (error) {
      setChangePasswordLoading(false);
      setChangePasswordError(
        error?.message || "Your current password is incorrect."
      );
      return;
    }

    try {
      await updateEmployeePassword({ password: newPassword });
      const session = await signInEmployee({
        email: currentUser.email,
        password: newPassword,
      });
      const profile = await fetchEmployeeProfile({
        userId: session.user?.id,
        email: session.user?.email || currentUser.email,
      });
      const updatedUser = buildUserContext(
        session.user,
        profile,
        lookupEmployeeLabel
      );
      setCurrentUser(updatedUser);
      setChangePasswordSuccess("Your password has been updated.");
    } catch (error) {
      setChangePasswordError(
        error?.message ||
          "We couldn't update your password. Please try again."
      );
    } finally {
      setChangePasswordLoading(false);
    }
  };

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
      setEmployees([]);
      setLoadingEmployees(false);
      setEmployeesError(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
      return;
    }

    let ignore = false;

    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await fetchEmployees();
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
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (typeof window === "undefined") return;

    let ignore = false;

    const applyHashSession = async () => {
      const { hash, search } = window.location;
      if (!hash && !search) return;

      try {
        const result = await completeAuthFromHash(hash, search);
        if (!result?.session?.user || ignore) return;

        const { user } = result.session;
        const profile = await fetchEmployeeProfile({
          userId: user.id,
          email: user.email,
        });
        if (ignore) return;

        const userContext = buildUserContext(
          user,
          profile,
          lookupEmployeeLabel
        );

        setCurrentUser(userContext);
        setCurrentPage("dashboard");
        setSidebarOpen(false);
        setSearch("");
        setSort({ name: null, start: null, end: null });
        setForm(createEmptyForm(userContext?.employeeLabel ?? ""));

        if (result.eventType === "recovery") {
          setChangePasswordOpen(true);
          setChangePasswordError("");
          setChangePasswordSuccess("");
          setChangePasswordLoading(false);
        }

        clearSupabaseAuthParamsFromUrl();
      } catch (error) {
        console.warn("Unable to complete Supabase auth from URL", error);
      }
    };

    applyHashSession();

    return () => {
      ignore = true;
    };
  }, [lookupEmployeeLabel]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let ignore = false;

    const hydrateUser = async () => {
      try {
        const session = await restoreSession();
        if (!session?.user || ignore) return;
        const profile = await fetchEmployeeProfile({
          userId: session.user.id,
          email: session.user.email,
        });
        if (ignore) return;
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
  }, [lookupEmployeeLabel]);

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
  const handleCalendarUpdate = useCallback(
    async ({ event, start, end }) => {
      if (!event?.id) return;
      const target = records.find((r) => r.id === event.id);
      if (!target) return;
      if (!canEditRecord(target)) {
        alert("You do not have permission to modify this booking.");
        return;
      }

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
        const updated = await updateRecord(event.id, {
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
    [records, isSupabaseConfigured, canEditRecord]
  );

  const handleCalendarEventDrop = useCallback(
    (args) => {
      const target = records.find((r) => r.id === args?.event?.id);
      if (!target) return;
      if (!canEditRecord(target)) {
        alert("You do not have permission to modify this booking.");
        return;
      }
      void handleCalendarUpdate(args);
    },
    [records, canEditRecord, handleCalendarUpdate]
  );

  const handleCalendarEventResize = useCallback(
    (args) => {
      const target = records.find((r) => r.id === args?.event?.id);
      if (!target) return;
      if (!canEditRecord(target)) {
        alert("You do not have permission to modify this booking.");
        return;
      }
      void handleCalendarUpdate(args);
    },
    [records, canEditRecord, handleCalendarUpdate]
  );

  const handleSubmit = async () => {
    if (editingId) {
      const existing = records.find((r) => r.id === editingId);
      if (!existing) {
        alert("The booking you were editing is no longer available.");
        setEditingId(null);
        setForm(createEmptyForm(currentUser?.employeeLabel ?? ""));
        return;
      }
      if (!canEditRecord(existing)) {
        alert("You do not have permission to update this booking.");
        return;
      }
    } else if (!canCreateOrEdit) {
      alert("You do not have permission to create bookings.");
      return;
    }

    const error = validateRecord();
    if (error) {
      alert(error);
      return;
    }
    if (!canModifyEmployee(form.name)) {
      alert("You do not have permission to manage bookings for this employee.");
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
    if (!canEditRecord(rec)) {
      alert("You do not have permission to delete this booking.");
      return;
    }
    setDeleteError("");
    setPendingDelete(rec);
  };

  const startEdit = (record) => {
    if (!canEditRecord(record)) {
      alert("You do not have permission to edit this booking.");
      return;
    }
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
    if (!canEditRecord(pendingDelete)) {
      setDeleteError("You do not have permission to delete this booking.");
      return;
    }
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
    if (!canClearAllRecords) {
      alert("Only administrators can clear all bookings.");
      return;
    }
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

    if (!canClearAllRecords) {
      setClearError("You do not have permission to clear all bookings.");
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
    const user = buildUserContext(session.user, profile, lookupEmployeeLabel);
    setCurrentUser(user);
    setCurrentPage("dashboard");
    setSidebarOpen(false);
    setSearch("");
    setSort({ name: null, start: null, end: null });
    setForm(createEmptyForm(user?.employeeLabel ?? ""));
    return user;
  };

  const handlePasswordReset = async ({ email }) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        "Supabase is not configured. Please contact your administrator to enable password recovery."
      );
    }

    const redirectTo =
      typeof window !== "undefined" ? window.location.origin : undefined;

    await requestPasswordReset({ email, redirectTo });
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
    setChangePasswordOpen(false);
    setChangePasswordLoading(false);
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onPasswordReset={handlePasswordReset}
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
        onChangePassword={openChangePasswordDialog}
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
                  employees={availableEmployeesForForm}
                  handleSubmit={handleSubmit}
                  editingId={editingId}
                  cancelEdit={cancelEdit}
                  isSaving={isSaving}
                  isDisabled={!canCreateOrEdit}
                  helperText={bookingFormHelperText}
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
                    canEditRecord={canEditRecord}
                    canDeleteRecord={canEditRecord}
                    canClearAll={canClearAllRecords}
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
                  canModifyEmployee={canModifyEmployee}
                  allowEventEditing={canCreateOrEdit}
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
      <ChangePasswordDialog
        open={changePasswordOpen}
        onClose={closeChangePasswordDialog}
        onSubmit={handleChangePasswordSubmit}
        loading={changePasswordLoading}
        error={changePasswordError}
        successMessage={changePasswordSuccess}
      />
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
