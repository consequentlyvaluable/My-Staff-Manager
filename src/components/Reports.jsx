import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";
import { differenceInCalendarDays, format, startOfMonth } from "date-fns";

function EmptyState({ message }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200/70 bg-slate-50/60 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-400">
      <span className="text-lg">📭</span>
      <p className="mt-2 max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}

export default function Reports({ records }) {
  // Bookings per employee
  const bookingsPerEmployee = useMemo(() => {
    const counts = new Map();
    records.forEach((r) => {
      if (!r?.name) return;
      const current = counts.get(r.name) ?? 0;
      counts.set(r.name, current + 1);
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [records]);

  // Vacation vs Travel
  const typeBreakdown = useMemo(() => {
    const counts = { Vacation: 0, Travel: 0 };
    records.forEach((r) => counts[r.type]++);
    return Object.entries(counts).map(([type, value]) => ({ type, value }));
  }, [records]);

  // Monthly distribution
  const monthlyDistribution = useMemo(() => {
    const monthMap = new Map();
    records.forEach((r) => {
      if (!r?.start) return;
      const startDate = new Date(r.start);
      if (Number.isNaN(startDate.getTime())) return;
      const monthKey = format(startDate, "yyyy-MM");
      const existing = monthMap.get(monthKey);
      if (existing) {
        existing.value += 1;
      } else {
        monthMap.set(monthKey, {
          month: format(startDate, "MMM yyyy"),
          value: 1,
          order: startOfMonth(startDate).getTime(),
        });
      }
    });
    return Array.from(monthMap.values())
      .sort((a, b) => a.order - b.order)
      .map(({ month, value }) => ({ month, value }));
  }, [records]);

  const { totalBookings, uniqueEmployees, averageDuration, upcomingWithin30 } =
    useMemo(() => {
      const today = new Date();
      let durationTotal = 0;
      let durationCount = 0;
      let upcomingSoon = 0;
      const employees = new Set();

      records.forEach((record) => {
        if (record?.name) {
          employees.add(record.name);
        }

        const startDate = record?.start ? new Date(record.start) : null;
        const endDate = record?.end ? new Date(record.end) : null;
        const startTime = startDate?.getTime();
        const endTime = endDate?.getTime();

        if (typeof startTime === "number" && !Number.isNaN(startTime)) {
          const daysUntilStart = differenceInCalendarDays(startDate, today);
          if (daysUntilStart >= 0 && daysUntilStart <= 30) {
            upcomingSoon += 1;
          }
        }

        if (
          typeof startTime === "number" &&
          !Number.isNaN(startTime) &&
          typeof endTime === "number" &&
          !Number.isNaN(endTime)
        ) {
          const duration = differenceInCalendarDays(endDate, startDate) + 1;
          if (duration > 0) {
            durationTotal += duration;
            durationCount += 1;
          }
        }
      });

      return {
        totalBookings: records.length,
        uniqueEmployees: employees.size,
        averageDuration: durationCount ? durationTotal / durationCount : 0,
        upcomingWithin30: upcomingSoon,
      };
    }, [records]);

  const mostActiveEmployee = bookingsPerEmployee[0] ?? null;
  const averageDurationLabel = averageDuration
    ? `${averageDuration.toFixed(1)} day${averageDuration >= 1.5 ? "s" : ""}`
    : "—";
  const pieColors = ["#22c55e", "#3b82f6"];
  const summaryCards = [
    {
      title: "Total Bookings",
      value: totalBookings,
      helper:
        uniqueEmployees > 0
          ? `Across ${uniqueEmployees} team member${
              uniqueEmployees === 1 ? "" : "s"
            }`
          : "Add your first booking to get started",
      icon: "🗂️",
      gradient: "from-indigo-500/20 via-indigo-500/10 to-indigo-500/0",
    },
    {
      title: "Starting Soon",
      value: upcomingWithin30,
      helper:
        upcomingWithin30 > 0
          ? "Beginning within the next 30 days"
          : "No trips in the next month",
      icon: "🛫",
      gradient: "from-sky-500/20 via-sky-500/10 to-sky-500/0",
    },
    {
      title: "Average Duration",
      value: averageDurationLabel,
      helper:
        averageDuration > 0
          ? "Based on bookings with start & end dates"
          : "Add dates to track trip length",
      icon: "⏱️",
      gradient: "from-emerald-500/20 via-emerald-500/10 to-emerald-500/0",
    },
    {
      title: "Most Active",
      value: mostActiveEmployee?.name ?? "—",
      helper: mostActiveEmployee
        ? `${mostActiveEmployee.count} booking${
            mostActiveEmployee.count === 1 ? "" : "s"
          } this year`
        : "Waiting for activity",
      icon: "🏆",
      gradient: "from-amber-500/20 via-amber-500/10 to-amber-500/0",
    },
  ];

  return (
    <div className="space-y-10 rounded-3xl border border-slate-200/60 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Insights
          </p>
          <h2 className="mt-1 text-3xl font-semibold text-slate-800 dark:text-slate-100">
            Reports & Analytics
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Monitor team activity, spot travel trends, and keep an eye on upcoming schedules with
            refreshed visuals designed for clarity.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.title}
            className={`group relative overflow-hidden rounded-2xl border border-transparent bg-gradient-to-br ${card.gradient} p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/60`}
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl transition-opacity duration-300 group-hover:opacity-60 dark:bg-slate-700/40" />
            <div className="flex items-start justify-between gap-4">
              <span className="text-2xl" aria-hidden>
                {card.icon}
              </span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 shadow-sm dark:bg-slate-800/70 dark:text-slate-300">
                {card.title}
              </span>
            </div>
            <p className="mt-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">
              Bookings per Employee
            </h3>
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Team Load
            </span>
          </div>
          <div className="mt-4 h-72 w-full">
            {bookingsPerEmployee.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsPerEmployee}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#475569", fontSize: 12 }}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5f5" }}
                    height={60}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: "#475569" }} axisLine={{ stroke: "#cbd5f5" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.08)" }}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "none",
                      boxShadow: "0 20px 45px -25px rgba(15,23,42,0.45)",
                    }}
                    labelStyle={{ fontWeight: 600, color: "#1f2937" }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Bookings" fill="url(#colorBookings)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Once bookings are logged, you'll see a breakdown of activity by team member." />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">
              Vacation vs Travel
            </h3>
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Trip Type
            </span>
          </div>
          <div className="mt-4 flex h-72 items-center justify-center">
            {typeBreakdown.some((entry) => entry.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdown}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={0}
                    stroke="none"
                  >
                    {typeBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} booking${value === 1 ? "" : "s"}`]}
                    contentStyle={{
                      borderRadius: "0.75rem",
                      border: "none",
                      boxShadow: "0 20px 45px -25px rgba(15,23,42,0.45)",
                    }}
                    labelStyle={{ fontWeight: 600, color: "#1f2937" }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="Bookings will be grouped here as Vacation or Travel once they're added." />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-lg transition-all duration-300 hover:shadow-xl dark:border-slate-700/60 dark:bg-slate-900/60">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-100">
            Monthly Distribution of Bookings
          </h3>
          <span className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Trendline
          </span>
        </div>
        <div className="mt-4 h-72 w-full">
          {monthlyDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyDistribution}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#475569" }}
                  tickLine={false}
                  axisLine={{ stroke: "#cbd5f5" }}
                />
                <YAxis tick={{ fill: "#475569" }} axisLine={{ stroke: "#cbd5f5" }} allowDecimals={false} />
                <Tooltip
                  cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "none",
                    boxShadow: "0 20px 45px -25px rgba(15,23,42,0.45)",
                  }}
                  labelStyle={{ fontWeight: 600, color: "#1f2937" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Bookings"
                  stroke="url(#colorTrend)"
                  strokeWidth={3}
                  dot={{ r: 4, stroke: "#0ea5e9", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState message="After a few bookings, you'll unlock a month-by-month trend line here." />
          )}
        </div>
      </div>
    </div>
  );
}
