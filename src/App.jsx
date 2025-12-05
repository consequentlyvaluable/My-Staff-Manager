import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import ToastStack from "./components/ToastStack";
import LandingPage from "./components/LandingPage";
import AutomationPanel from "./components/AutomationPanel";
import TicketingWorkspace from "./components/TicketingWorkspace";
import ExpenseReports from "./components/ExpenseReports";
import SpreadsheetLab from "./components/SpreadsheetLab";
import WordWorkspace from "./components/WordWorkspace";
import {
  addDays,
  endOfDay,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
} from "date-fns";
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
  subscribeToBookingNotifications,
  broadcastBookingNotification,
} from "./lib/supabaseClient";
import {
  defaultAutomationSettings,
  deriveDecisionsForRecords,
  evaluateBookingAgainstPolicies,
  buildCapacityForecast,
  summarizeDecisions,
} from "./lib/policyEngine";

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

const shouldRenderLandingPage = () => {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname?.toLowerCase?.() ?? "";
  if (!hostname) return false;

  if (hostname === "landing.offyse.com") {
    return true;
  }

  if (hostname === "offyse.com" || hostname === "www.offyse.com") {
    return true;
  }

  if (hostname === "offyse.netlify.app" || hostname === "www.offyse.netlify.app") {
    return true;
  }

  if (
    hostname.startsWith("landing.") &&
    (hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".test"))
  ) {
    return true;
  }

  const search = window.location.search ?? "";
  if (search) {
    const params = new URLSearchParams(search);
    if (params.has("landing")) {
      return true;
    }
  }

  const pathname = window.location.pathname?.toLowerCase?.() ?? "";
  if (pathname.startsWith("/landing")) {
    return true;
  }

  return false;
};

const resolveLandingRoute = () => {
  if (typeof window === "undefined") {
    return { renderLanding: false };
  }

  const rawPathname = window.location.pathname ?? "";
  const normalizedPathname = rawPathname.toLowerCase();
  const trimmedPathname = normalizedPathname.replace(/\/+$/, "");

  const matchesPath = (target) =>
    trimmedPathname === target || trimmedPathname.startsWith(`${target}/`);

  if (matchesPath("/login")) {
    return { renderLanding: false };
  }

  if (shouldRenderLandingPage()) {
    return { renderLanding: true };
  }

  return { renderLanding: false };
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
  const companyId =
    (typeof profile?.company_id === "string" && profile.company_id.trim()) ||
    (typeof metadata.company_id === "string" && metadata.company_id.trim()) ||
    "";
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
    companyId,
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
    "code",
    "state",
    "token",
    "token_hash",
    "email",
    "email_address",
    "error",
    "error_code",
    "error_description",
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

const ALL_DAY_START_TIME = "00:00";
const ALL_DAY_END_TIME = "23:59";

const getDatePart = (value) => {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const [datePart] = trimmed.split("T");
  return datePart || "";
};

const combineDateAndTime = (datePart, timePart) =>
  datePart ? `${datePart}T${timePart}` : "";

const ensureAllDayRange = (startValue, endValue) => {
  const startDate = getDatePart(startValue);
  const endDate = getDatePart(endValue) || startDate;
  const normalizedStart = combineDateAndTime(startDate, ALL_DAY_START_TIME);
  const normalizedEnd = combineDateAndTime(endDate, ALL_DAY_END_TIME);
  return [normalizedStart, normalizedEnd];
};

const deriveAllDayInputsFromIso = (startIso, endIso) => {
  const [startValue, endValue] = ensureAllDayRange(
    toDateTimeLocalInput(startIso),
    toDateTimeLocalInput(endIso)
  );
  return [startValue, endValue];
};

const isAllDayRange = (start, end) => {
  if (!start || !end) return false;
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return false;
  }

  const startIsMidnight =
    startDate.getHours() === 0 &&
    startDate.getMinutes() === 0 &&
    startDate.getSeconds() === 0;

  const endSeconds = endDate.getSeconds();
  const endIsEndOfDay =
    endDate.getHours() === 23 &&
    endDate.getMinutes() === 59 &&
    (endSeconds === 0 || endSeconds === 59);

  return startIsMidnight && endIsEndOfDay;
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

const createUniqueId = (prefix = "id") => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${random}-${Date.now()}`;
};

const CALENDAR_POPOVER_WIDTH = 352;
const CALENDAR_POPOVER_HEIGHT = 320;
const CALENDAR_POPOVER_PADDING = 16;
const CALENDAR_POPOVER_VERTICAL_OFFSET = 12;

const clampCalendarPopoverPosition = (position, size) => {
  if (typeof window === "undefined") return position;
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const width = Math.min(size.width, viewportWidth - CALENDAR_POPOVER_PADDING * 2);
  const height = Math.min(size.height, viewportHeight - CALENDAR_POPOVER_PADDING * 2);
  const maxLeft = viewportWidth - CALENDAR_POPOVER_PADDING - width;
  const maxTop = viewportHeight - CALENDAR_POPOVER_PADDING - height;
  const left = Math.min(
    Math.max(CALENDAR_POPOVER_PADDING, position.left),
    Math.max(CALENDAR_POPOVER_PADDING, maxLeft)
  );
  const top = Math.min(
    Math.max(CALENDAR_POPOVER_PADDING, position.top),
    Math.max(CALENDAR_POPOVER_PADDING, maxTop)
  );
  return { top, left };
};

function createEmptyForm(name = "") {
  return {
    name,
    type: "Vacation",
    start: "",
    end: "",
    allDay: false,
  };
}

function StaffManagerApp() {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(
    () => !!isSupabaseConfigured
  );
  const [employeesError, setEmployeesError] = useState(null);
  const [companyId, setCompanyId] = useState(() => {
    const envCompanyId = (import.meta.env.VITE_DEFAULT_COMPANY_ID || "").trim();
    if (typeof window === "undefined") return envCompanyId;
    const stored = window.localStorage.getItem("selectedCompanyId") || "";
    return stored.trim() || envCompanyId;
  });
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
  const [toasts, setToasts] = useState([]);
  const [automationSettings] = useState(defaultAutomationSettings);
  const [workflowDecisions, setWorkflowDecisions] = useState({});
  const [capacityForecast, setCapacityForecast] = useState([]);
  const [calendarEditingId, setCalendarEditingId] = useState(null);
  const [calendarPopoverPosition, setCalendarPopoverPosition] = useState({
    top: 0,
    left: 0,
  });
  const [calendarEditValues, setCalendarEditValues] = useState({
    type: "Vacation",
    start: "",
    end: "",
  });
  const [calendarEditError, setCalendarEditError] = useState("");
  const [calendarEditSubmitting, setCalendarEditSubmitting] = useState(false);
  const calendarPopoverRef = useRef(null);
  const calendarPopoverFirstFieldRef = useRef(null);
  const employeesTableName = useMemo(
    () =>
      (import.meta.env.VITE_SUPABASE_EMPLOYEES_TABLE || "Duferco Employees").trim(),
    []
  );
  const companyOptions = useMemo(
    () => toStringArray(import.meta.env.VITE_COMPANY_OPTIONS),
    []
  );
  const calendarEditingRecord = useMemo(
    () =>
      calendarEditingId
        ? records.find((record) => record.id === calendarEditingId) || null
        : null,
    [calendarEditingId, records]
  );

  const clientInstanceId = useMemo(() => createUniqueId("client"), []);

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

  const pushToast = useCallback((toast) => {
    if (!toast) return;
    const normalized = toast.id ? toast : { ...toast, id: createUniqueId("toast") };

    setToasts((prev) => {
      const next = [...prev, normalized];
      if (next.length > 5) {
        next.shift();
      }
      return next;
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const closeCalendarPopover = useCallback(() => {
    setCalendarEditingId(null);
    setCalendarEditValues({ type: "Vacation", start: "", end: "" });
    setCalendarEditError("");
    setCalendarEditSubmitting(false);
  }, []);

  const handleCalendarEventDoubleClick = useCallback(
    (event, nativeEvent) => {
      if (!event) return;
      const booking = records.find((record) => record.id === event.id);
      if (!booking) return;
      if (!canEditRecord(booking)) {
        alert("You do not have permission to edit this booking.");
        return;
      }

      const sourceEvent = nativeEvent?.nativeEvent ?? nativeEvent;
      const pointerX =
        typeof sourceEvent?.clientX === "number"
          ? sourceEvent.clientX
          : typeof sourceEvent?.pageX === "number"
          ? sourceEvent.pageX
          : typeof window !== "undefined"
          ? window.innerWidth / 2
          : 0;
      const pointerY =
        typeof sourceEvent?.clientY === "number"
          ? sourceEvent.clientY
          : typeof sourceEvent?.pageY === "number"
          ? sourceEvent.pageY
          : typeof window !== "undefined"
          ? window.innerHeight / 2
          : 0;

      if (typeof sourceEvent?.preventDefault === "function") {
        sourceEvent.preventDefault();
      }

      let nextPosition = {
        left: pointerX - CALENDAR_POPOVER_WIDTH / 2,
        top: pointerY + CALENDAR_POPOVER_VERTICAL_OFFSET,
      };
      const size = { width: CALENDAR_POPOVER_WIDTH, height: CALENDAR_POPOVER_HEIGHT };
      if (typeof window !== "undefined") {
        nextPosition = clampCalendarPopoverPosition(nextPosition, size);
      }

      setCalendarPopoverPosition(nextPosition);
      setCalendarEditValues({
        type: booking.type === "Travel" ? "Travel" : "Vacation",
        start: toDateTimeLocalInput(booking.start),
        end: toDateTimeLocalInput(booking.end),
      });
      setCalendarEditError("");
      setCalendarEditSubmitting(false);
      setCalendarEditingId(booking.id);
    },
    [records, canEditRecord]
  );

  const showToastForEvent = useCallback(
    (event) => {
      if (!event?.booking) return;

      const normalizedAction =
        event.action === "deleted"
          ? "deleted"
          : event.action === "updated"
          ? "updated"
          : "created";

      const actionVerb =
        normalizedAction === "created"
          ? "added"
          : normalizedAction === "deleted"
          ? "deleted"
          : "edited";

      const actorEmail =
        typeof event.actor?.email === "string" ? event.actor.email : "";
      const actorName =
        (typeof event.actor?.name === "string" && event.actor.name.trim()) ||
        fallbackNameFromEmail(actorEmail);

      const bookingName =
        (typeof event.booking?.name === "string" &&
          event.booking.name.trim()) ||
        "an employee";
      const bookingType =
        event.booking?.type === "Travel" ? "✈️ Travel" : "🌴 Vacation";
      const range = formatBookingRange(
        event.booking?.start,
        event.booking?.end
      );
      const meta = range && range !== "-" ? range : null;

      const toast = {
        action: normalizedAction,
        title: `${actorName} ${actionVerb} a booking`,
        description: `Booking for ${bookingName} · ${bookingType}`,
        meta,
      };

      pushToast(toast);
    },
    [pushToast]
  );

  const pushAutomationToast = useCallback((title, description, meta = null) => {
    const toast = {
      action: "automation",
      title,
      description,
      meta,
    };

    pushToast(toast);
  }, [pushToast]);

  const notifyBookingEvent = useCallback(
    async ({ action, booking }) => {
      if (!booking) return;

      const payload = {
        action:
          action === "deleted"
            ? "deleted"
            : action === "updated"
            ? "updated"
            : "created",
        booking: {
          id: booking.id ?? null,
          name: booking.name ?? "",
          type: booking.type ?? "Vacation",
          start: booking.start ?? "",
          end: booking.end ?? "",
        },
        actor: {
          id: currentUser?.id ?? null,
          name: currentUser?.name ?? "",
          email: currentUser?.email ?? "",
        },
        clientId: clientInstanceId,
        timestamp: new Date().toISOString(),
      };

      showToastForEvent(payload);

      if (!isSupabaseConfigured) return;

      try {
        await broadcastBookingNotification(payload);
      } catch (error) {
        console.warn("Unable to broadcast booking notification", error);
      }
    },
    [currentUser, clientInstanceId, showToastForEvent]
  );

  const handleIncomingNotification = useCallback(
    (event) => {
      if (!event) return;
      if (event.clientId && event.clientId === clientInstanceId) return;
      showToastForEvent(event);
    },
    [clientInstanceId, showToastForEvent]
  );

  const canClearAllRecords = canManageAll && !isReadOnly;

  const availableEmployeesForForm = useMemo(() => {
    if (!currentUser) return employees;
    if (canManageAll) return employees;
    if (allowedEmployeeList.length > 0) return allowedEmployeeList;
    return currentUser.employeeLabel ? [currentUser.employeeLabel] : [];
  }, [currentUser, employees, canManageAll, allowedEmployeeList]);

  const workflowSummary = useMemo(
    () => summarizeDecisions(workflowDecisions),
    [workflowDecisions]
  );

  const outOfOfficeSummary = useMemo(() => {
    const totalEmployees = employees.length;
    if (totalEmployees === 0) {
      return {
        totalEmployees: 0,
        outToday: 0,
        outTomorrow: 0,
        percentage: 0,
        tomorrowPercentage: 0,
      };
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());
    const tomorrowStart = startOfDay(addDays(todayStart, 1));
    const tomorrowEnd = endOfDay(tomorrowStart);

    const employeeSet = new Set(employees);
    const outToday = new Set();
    const outTomorrow = new Set();

    const isRecordInRange = (recordStart, recordEnd, rangeStart, rangeEnd) => {
      const startsBeforeEnd =
        isBefore(recordStart, rangeEnd) || isEqual(recordStart, rangeEnd);
      const endsAfterStart =
        isAfter(recordEnd, rangeStart) || isEqual(recordEnd, rangeStart);

      return startsBeforeEnd && endsAfterStart;
    };

    for (const record of records) {
      const name = record?.name;
      if (!name || !employeeSet.has(name)) continue;

      const startDate = new Date(record.start);
      const endDate = new Date(record.end);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        continue;
      }

      if (isRecordInRange(startDate, endDate, todayStart, todayEnd)) {
        outToday.add(name);
      }

      if (
        isRecordInRange(startDate, endDate, tomorrowStart, tomorrowEnd)
      ) {
        outTomorrow.add(name);
      }
    }

    const todayPercentage = Math.round((outToday.size / totalEmployees) * 100);
    const tomorrowPercentage = Math.round(
      (outTomorrow.size / totalEmployees) * 100
    );

    return {
      totalEmployees,
      outToday: outToday.size,
      outTomorrow: outTomorrow.size,
      percentage: Math.min(100, Math.max(0, todayPercentage)),
      tomorrowPercentage: Math.min(100, Math.max(0, tomorrowPercentage)),
    };
  }, [employees, records]);

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

  const handleCompanyChange = useCallback((value) => {
    setCompanyId((value ?? "").trim());
  }, []);

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
    if (typeof window === "undefined") return;
    if (companyId) {
      window.localStorage.setItem("selectedCompanyId", companyId);
    } else {
      window.localStorage.removeItem("selectedCompanyId");
    }
  }, [companyId]);

  useEffect(() => {
    const userCompanyId = currentUser?.companyId;
    if (!userCompanyId || userCompanyId === companyId) return;
    setCompanyId(userCompanyId);
  }, [companyId, currentUser]);

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

    const trimmedCompanyId = companyId?.toString?.().trim?.() ?? "";
    if (!trimmedCompanyId) {
      setEmployees([]);
      setLoadingEmployees(false);
      setEmployeesError("Select a company to load employees.");
      return;
    }

    let ignore = false;

    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const data = await fetchEmployees({
          tableName: employeesTableName,
          companyId: trimmedCompanyId,
        });
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
  }, [companyId, employeesTableName, isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (typeof window === "undefined") return;

    let ignore = false;

    const applyHashSession = async () => {
      const { hash, search } = window.location;
      if (!hash && !search) return;

      try {
        const result = await completeAuthFromHash(hash, search);
        if (ignore) return;

        if (result?.error) {
          const description =
            result.error.description ||
            result.error.message ||
            "We couldn't verify that sign-in link. Please request a new one.";
          setErrorMessage(description);
          clearSupabaseAuthParamsFromUrl();
          return;
        }

        if (!result?.session?.user) return;

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
    if (!isSupabaseConfigured) return undefined;
    if (!currentUser) return undefined;

    let isActive = true;
    let unsubscribe = null;

    const subscribeToNotifications = async () => {
      try {
        const cleanup = await subscribeToBookingNotifications((event) => {
          if (!isActive) return;
          handleIncomingNotification(event);
        });
        if (!isActive) {
          if (cleanup) {
            cleanup();
          }
          return;
        }
        unsubscribe = cleanup;
      } catch (error) {
        console.warn("Failed to subscribe to booking notifications", error);
      }
    };

    subscribeToNotifications();

    return () => {
      isActive = false;
      if (unsubscribe) {
        void unsubscribe();
      }
    };
  }, [currentUser, handleIncomingNotification]);

  useEffect(() => {
    setWorkflowDecisions(deriveDecisionsForRecords(records, automationSettings));
    setCapacityForecast(buildCapacityForecast(records, automationSettings));
  }, [records, automationSettings]);

  useEffect(() => {
    if (editingId) return;
    setForm(createEmptyForm(currentUser?.employeeLabel ?? ""));
  }, [currentUser, editingId]);

  useEffect(() => {
    if (!calendarEditingId) return undefined;
    const bookingExists = records.some((record) => record.id === calendarEditingId);
    if (!bookingExists) {
      closeCalendarPopover();
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!calendarPopoverRef.current) return;
      if (calendarPopoverRef.current.contains(event.target)) return;
      closeCalendarPopover();
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCalendarPopover();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [calendarEditingId, records, closeCalendarPopover]);

  useEffect(() => {
    if (!calendarEditingId) return;
    if (!calendarPopoverFirstFieldRef.current) return;
    const focusTimer = requestAnimationFrame(() => {
      calendarPopoverFirstFieldRef.current?.focus?.();
    });
    return () => {
      cancelAnimationFrame(focusTimer);
    };
  }, [calendarEditingId]);

  useEffect(() => {
    if (!calendarEditingId) return undefined;
    if (typeof window === "undefined") return undefined;

    const handleResize = () => {
      setCalendarPopoverPosition((prev) =>
        clampCalendarPopoverPosition(prev, {
          width: CALENDAR_POPOVER_WIDTH,
          height: CALENDAR_POPOVER_HEIGHT,
        })
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [calendarEditingId]);

  useEffect(() => {
    if (!calendarEditingId) return;
    if (currentPage !== "dashboard" || !canCreateOrEdit) {
      closeCalendarPopover();
    }
  }, [calendarEditingId, currentPage, canCreateOrEdit, closeCalendarPopover]);

  const validateRecordDetails = useCallback(
    ({ name, start, end }, editingRecordId = null) => {
      if (!name) return "Please select an employee.";
      if (!start || !end)
        return "Both start and end date & time values are required.";

      const startDate = new Date(start);
      const endDate = new Date(end);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return "Please provide valid start and end dates.";
      }
      if (isAfter(startDate, endDate))
        return "End date must be on or after start date.";

      for (const r of records) {
        if (r.name !== name) continue;
        if (editingRecordId && r.id === editingRecordId) continue;
        const rStart = new Date(r.start);
        const rEnd = new Date(r.end);
        if (
          Number.isNaN(rStart.getTime()) ||
          Number.isNaN(rEnd.getTime())
        ) {
          continue;
        }
        if (
          (isBefore(startDate, rEnd) || isEqual(startDate, rEnd)) &&
          (isAfter(endDate, rStart) || isEqual(endDate, rStart))
        ) {
          return `${name} already has a booking that overlaps these dates.`;
        }
      }

      return null;
    },
    [records]
  );

  // validation
  const validateRecord = () => {
    const [normalizedStart, normalizedEnd] = form.allDay
      ? ensureAllDayRange(form.start, form.end)
      : [form.start, form.end];
    return validateRecordDetails(
      { name: form.name, start: normalizedStart, end: normalizedEnd },
      editingId
    );
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
      let notificationRecord = { ...target, start: nextStartIso, end: nextEndIso };
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec.id !== event.id) return rec;
          previousEvent = { ...rec };
          const nextValue = {
            ...rec,
            start: nextStartIso,
            end: nextEndIso,
          };
          notificationRecord = nextValue;
          return nextValue;
        })
      );

      let updateFailed = false;

      try {
        const updated = await updateRecord(event.id, {
          start: nextStartIso,
          end: nextEndIso,
        });

        if (updated) {
          notificationRecord = {
            ...notificationRecord,
            ...updated,
            start: updated.start ?? nextStartIso,
            end: updated.end ?? nextEndIso,
          };
          setRecords((prev) =>
            prev.map((rec) =>
              rec.id === event.id ? notificationRecord : rec
            )
          );
        }
      } catch (error) {
        updateFailed = true;
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

      if (!updateFailed) {
        await notifyBookingEvent({
          action: "updated",
          booking: notificationRecord,
        });
      }
    },
    [records, canEditRecord, notifyBookingEvent]
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
      const [normalizedStart, normalizedEnd] = form.allDay
        ? ensureAllDayRange(form.start, form.end)
        : [form.start, form.end];
      const payload = {
        name: form.name,
        type: form.type,
        start: toIsoStringIfPossible(normalizedStart),
        end: toIsoStringIfPossible(normalizedEnd),
      };

      if (editingId) {
        let notificationRecord = { id: editingId, ...payload };
        const updated = await updateRecord(editingId, payload);
        setRecords((prev) =>
          prev.map((rec) => {
            if (rec.id !== editingId) return rec;
            const nextValue = updated
              ? {
                  ...rec,
                  ...updated,
                  start: updated.start ?? payload.start,
                  end: updated.end ?? payload.end,
                }
              : { ...rec, ...payload };
            notificationRecord = nextValue;
            return nextValue;
          })
        );
        setEditingId(null);
        await notifyBookingEvent({
          action: "updated",
          booking: notificationRecord,
        });
      } else {
        const created = await createRecord(payload);
        let recordWithFallback = { ...payload };
        if (created) {
          recordWithFallback = {
            ...created,
            start: created.start ?? payload.start,
            end: created.end ?? payload.end,
          };
          setRecords((prev) => [...prev, recordWithFallback]);
        }
        const decision = evaluateBookingAgainstPolicies(
          recordWithFallback,
          records,
          automationSettings
        );
        setWorkflowDecisions((prev) => ({
          ...prev,
          [recordWithFallback.id ?? createUniqueId("booking")]: decision,
        }));
        if (decision.status === "auto_approved") {
          pushAutomationToast(
            "Auto-approved",
            `${recordWithFallback.name || "New request"} was auto-approved with ${Math.round(
              decision.utilization * 100
            )}% capacity utilization.`,
            decision.reason
          );
        } else if (decision.status === "declined_quota") {
          pushAutomationToast(
            "Declined by quota",
            `${recordWithFallback.name || "Request"} cannot be scheduled because ${decision.reason.toLowerCase()}`,
            "Notifications sent to Slack/Teams"
          );
        } else {
          pushAutomationToast(
            "Needs review",
            `${recordWithFallback.name || "Request"} is queued for manager approval due to capacity thresholds.`,
            decision.reason
          );
        }
        await notifyBookingEvent({
          action: "created",
          booking: recordWithFallback,
        });
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

  const handleInlineBookingUpdate = useCallback(
    async (recordId, updates) => {
      const target = records.find((r) => r.id === recordId);
      if (!target) {
        return { error: "The booking you tried to edit could not be found." };
      }
      if (!canEditRecord(target)) {
      return { error: "You do not have permission to edit this booking." };
    }

    const sanitizedType = updates?.type === "Travel" ? "Travel" : "Vacation";
    const startValue = updates?.start ?? "";
    const endValue = updates?.end ?? "";

    const validationError = validateRecordDetails(
      { name: target.name, start: startValue, end: endValue },
      recordId
    );
    if (validationError) {
      return { error: validationError };
    }
    if (!canModifyEmployee(target.name)) {
      return {
        error: "You do not have permission to manage bookings for this employee.",
      };
    }
    if (!isSupabaseConfigured) {
      return { error: "Supabase is not configured. Unable to update booking." };
    }

    const payload = {
      name: target.name,
      type: sanitizedType,
      start: toIsoStringIfPossible(startValue),
      end: toIsoStringIfPossible(endValue),
    };

    try {
      const updated = await updateRecord(recordId, payload);
      let notificationRecord = {
        ...target,
        ...payload,
        id: recordId,
      };
      setRecords((prev) =>
        prev.map((rec) => {
          if (rec.id !== recordId) return rec;
          const nextValue = updated
            ? {
                ...rec,
                ...updated,
                start: updated.start ?? payload.start,
                end: updated.end ?? payload.end,
              }
            : {
                ...rec,
                ...payload,
              };
          notificationRecord = nextValue;
          return nextValue;
        })
      );

      if (editingId === recordId) {
        setEditingId(null);
        setForm(createEmptyForm(currentUser?.employeeLabel ?? ""));
      }

      await notifyBookingEvent({
        action: "updated",
        booking: notificationRecord,
      });

      return { success: true };
    } catch (error) {
      console.error("Failed to update booking", error);
      return { error: "Failed to update booking. Please try again." };
    }
    },
    [
      records,
      canEditRecord,
      validateRecordDetails,
      canModifyEmployee,
      editingId,
      currentUser?.employeeLabel,
      notifyBookingEvent,
    ]
  );

  const handleCalendarEditFieldChange = useCallback((field, value) => {
    setCalendarEditValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCalendarPopoverSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!calendarEditingId) return;
      setCalendarEditSubmitting(true);
      setCalendarEditError("");
      try {
        const result = await handleInlineBookingUpdate(calendarEditingId, {
          type: calendarEditValues.type,
          start: calendarEditValues.start,
          end: calendarEditValues.end,
        });
        if (result?.error) {
          setCalendarEditError(result.error);
          return;
        }
        closeCalendarPopover();
      } catch (error) {
        console.error("Failed to update booking", error);
        setCalendarEditError("Failed to update booking. Please try again.");
      } finally {
        setCalendarEditSubmitting(false);
      }
    },
    [calendarEditingId, calendarEditValues, handleInlineBookingUpdate, closeCalendarPopover]
  );

  const startEdit = (record) => {
    if (!canEditRecord(record)) {
      alert("You do not have permission to edit this booking.");
      return;
    }
    const recordAllDay = isAllDayRange(record.start, record.end);
    const [allDayStart, allDayEnd] = recordAllDay
      ? deriveAllDayInputsFromIso(record.start, record.end)
      : ["", ""];
    const fallbackStart = toDateTimeLocalInput(record.start);
    const fallbackEnd = toDateTimeLocalInput(record.end);
    setForm({
      name: record.name,
      type: record.type,
      start: recordAllDay ? allDayStart || fallbackStart : fallbackStart,
      end: recordAllDay ? allDayEnd || fallbackEnd : fallbackEnd,
      allDay: recordAllDay,
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

    const recordToDelete = pendingDelete;

    try {
      await removeRecord(recordToDelete.id);
      setRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      if (editingId === recordToDelete.id) cancelEdit();
      await notifyBookingEvent({
        action: "deleted",
        booking: recordToDelete,
      });
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
    setToasts([]);
    setChangePasswordOpen(false);
    setChangePasswordLoading(false);
    setChangePasswordError("");
    setChangePasswordSuccess("");
  };

  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLogin={handleLogin}
          onPasswordReset={handlePasswordReset}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        />
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </>
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
        outOfOfficeSummary={outOfOfficeSummary}
        companyId={companyId}
        onCompanyChange={handleCompanyChange}
        companyOptions={companyOptions}
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
                    workflowDecisions={workflowDecisions}
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
              <div className="md:col-span-3 space-y-6">
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
                  onEventDoubleClick={handleCalendarEventDoubleClick}
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
                onUpdateBooking={handleInlineBookingUpdate}
                deleteRecord={deleteRecord}
                loading={loadingEmployees}
                canEditRecord={canEditRecord}
              />
            </div>
          )}
          {currentPage === "reports" && <Reports records={records} />}
          {currentPage === "expenses" && (
            <ExpenseReports currentUser={currentUser} onToast={pushToast} />
          )}
          {currentPage === "spreadsheet" && <SpreadsheetLab />}
          {currentPage === "word" && <WordWorkspace />}
          {currentPage === "ticketing" && (
            <TicketingWorkspace currentUser={currentUser} onToast={pushToast} />
          )}
          {currentPage === "automation" && (
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/30">
                <p className="text-sm font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Automation
                </p>
                <h2 className="mt-1 text-3xl font-semibold text-slate-800 dark:text-slate-100">
                  Workflow Automation
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                  Review automated approvals, sync coverage with calendars, and monitor capacity alerts in one focused workspace.
                </p>
              </div>
              <AutomationPanel
                summary={workflowSummary}
                settings={automationSettings}
                forecast={capacityForecast}
              />
            </div>
          )}
        </main>
      </div>
      {calendarEditingId && calendarEditingRecord && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            aria-hidden="true"
            onClick={closeCalendarPopover}
          />
          <div
            ref={calendarPopoverRef}
            className="fixed z-50 w-[22rem] max-w-full rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl dark:border-gray-600 dark:bg-gray-800"
            style={{
              top: calendarPopoverPosition.top,
              left: calendarPopoverPosition.left,
              width: "min(22rem, calc(100vw - 32px))",
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Edit booking"
          >
            <form className="space-y-4" onSubmit={handleCalendarPopoverSubmit}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  Editing booking for
                </p>
                <p className="mt-1 text-base font-semibold text-gray-800 dark:text-gray-100">
                  {calendarEditingRecord.name}
                </p>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  Booking type
                </label>
                <select
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={calendarEditValues.type}
                  onChange={(event) =>
                    handleCalendarEditFieldChange(
                      "type",
                      event.target.value === "Travel" ? "Travel" : "Vacation"
                    )
                  }
                  disabled={calendarEditSubmitting}
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Travel">Travel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  Start
                </label>
                <input
                  ref={calendarPopoverFirstFieldRef}
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={calendarEditValues.start}
                  onChange={(event) =>
                    handleCalendarEditFieldChange("start", event.target.value)
                  }
                  required
                  disabled={calendarEditSubmitting}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                  End
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                  value={calendarEditValues.end}
                  onChange={(event) =>
                    handleCalendarEditFieldChange("end", event.target.value)
                  }
                  required
                  disabled={calendarEditSubmitting}
                />
              </div>

              {calendarEditError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {calendarEditError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={closeCalendarPopover}
                  disabled={calendarEditSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={calendarEditSubmitting}
                >
                  {calendarEditSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
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
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default function App() {
  const [landingState, setLandingState] = useState(() => resolveLandingRoute());

  useEffect(() => {
    if (typeof window === "undefined") {
      setLandingState(resolveLandingRoute());
      return;
    }

    const handleLocationChange = () => {
      setLandingState(resolveLandingRoute());
    };

    handleLocationChange();

    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  if (landingState.renderLanding) {
    return <LandingPage />;
  }

  return <StaffManagerApp />;
}
