import { addDays, eachDayOfInterval, isAfter, isBefore, isEqual } from "date-fns";

export const defaultAutomationSettings = {
  quotas: {
    Vacation: 3,
    Travel: 4,
  },
  notifications: {
    slack: true,
    teams: true,
    email: true,
  },
  calendarSync: {
    google: true,
    outlook: true,
  },
  autoApproveThreshold: 0.6,
  forecastHorizonDays: 14,
};

const parseDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const doesOverlap = (aStart, aEnd, bStart, bEnd) => {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return !isAfter(aStart, bEnd) && !isBefore(aEnd, bStart);
};

const countOverlapsForWindow = (records, start, end) =>
  records.reduce((count, record) => {
    const recStart = parseDate(record.start);
    const recEnd = parseDate(record.end);
    if (!recStart || !recEnd) return count;
    return doesOverlap(recStart, recEnd, start, end) ? count + 1 : count;
  }, 0);

export const evaluateBookingAgainstPolicies = (
  booking,
  existingRecords = [],
  settings = defaultAutomationSettings
) => {
  const startDate = parseDate(booking.start);
  const endDate = parseDate(booking.end);

  if (!startDate || !endDate) {
    return {
      status: "needs_review",
      reason: "Missing start or end date.",
      utilization: 0,
    };
  }

  const overlapCount = countOverlapsForWindow(existingRecords, startDate, endDate);
  const quotaForType = settings.quotas?.[booking.type] ?? settings.quotas?.Vacation ?? 3;
  const utilization = Math.min(overlapCount / quotaForType, 1);

  if (overlapCount >= quotaForType) {
    return {
      status: "declined_quota",
      reason: `Quota reached for ${booking.type || "vacation"}.`,
      utilization,
    };
  }

  if (utilization >= settings.autoApproveThreshold) {
    return {
      status: "needs_review",
      reason: "At capacity threshold; requires manager review.",
      utilization,
    };
  }

  return {
    status: "auto_approved",
    reason: "Within quota and auto-approved by policy.",
    utilization,
  };
};

export const deriveDecisionsForRecords = (
  records = [],
  settings = defaultAutomationSettings
) => {
  const decisions = {};
  for (const record of records) {
    const otherRecords = records.filter((r) => r.id !== record.id);
    decisions[record.id] = evaluateBookingAgainstPolicies(
      record,
      otherRecords,
      settings
    );
  }
  return decisions;
};

export const buildCapacityForecast = (
  records = [],
  settings = defaultAutomationSettings
) => {
  const today = new Date();
  const horizonEnd = addDays(today, settings.forecastHorizonDays || 14);
  const days = eachDayOfInterval({ start: today, end: horizonEnd });
  const quotaCeiling = Math.max(
    settings.quotas?.Vacation ?? 0,
    settings.quotas?.Travel ?? 0,
    1
  );

  return days.map((day) => {
    const dayStart = day;
    const dayEnd = addDays(day, 1);
    const headcount = countOverlapsForWindow(records, dayStart, dayEnd);
    const utilization = Math.min(headcount / quotaCeiling, 1);
    return {
      date: dayStart.toISOString(),
      headcount,
      capacity: quotaCeiling,
      utilization,
    };
  });
};

export const summarizeDecisions = (decisions) => {
  const summary = {
    autoApproved: 0,
    needsReview: 0,
    declined: 0,
  };

  Object.values(decisions || {}).forEach((decision) => {
    if (decision?.status === "auto_approved") summary.autoApproved += 1;
    else if (decision?.status === "declined_quota") summary.declined += 1;
    else summary.needsReview += 1;
  });

  return summary;
};
