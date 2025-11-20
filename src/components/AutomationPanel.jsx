import { format } from "date-fns";

const statusPillStyles = {
  auto_approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  needs_review: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-100",
  declined_quota: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100",
};

export default function AutomationPanel({
  summary,
  settings,
  forecast,
}) {
  const nextBottlenecks = forecast
    .filter((entry) => entry.utilization >= 0.6)
    .slice(0, 3);

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow transition-colors duration-300 dark:bg-gray-800 dark:shadow-black/20">
      <header className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
            Workflow automation
          </p>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Approvals, sync, and alerts
          </h3>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-900/50 dark:text-purple-100">
          Live
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-700/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Automated approvals
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {summary.autoApproved}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">auto-approved this week</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-700/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Review queue
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {summary.needsReview}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">awaiting manager attention</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-700/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Quota declines
          </p>
          <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-gray-100">
            {summary.declined}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">blocked for staffing limits</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Calendar sync
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                Google Calendar · Outlook 365
              </p>
            </div>
            <div className="flex gap-2">
              {settings.calendarSync.google && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
                  Google
                </span>
              )}
              {settings.calendarSync.outlook && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-100">
                  Outlook
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            Events publish automatically to subscribed calendars and respect the same approval status shown below.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Notifications
              </p>
              <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
                Slack · Teams · Email digests
              </p>
            </div>
            <div className="flex gap-2">
              {settings.notifications.slack && (
                <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-100">
                  Slack
                </span>
              )}
              {settings.notifications.teams && (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-100">
                  Teams
                </span>
              )}
              {settings.notifications.email && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                  Email
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            Alerts fire when utilization crosses 60%, when quotas block a request, and after every auto-approval.
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
            Upcoming capacity forecast (next {forecast.length} days)
          </p>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-[11px] font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-100">
            Quotas: {settings.quotas.Vacation} PTO · {settings.quotas.Travel} travel
          </span>
        </div>
        {nextBottlenecks.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            No capacity risks detected in the next two weeks.
          </p>
        ) : (
          <ul className="space-y-2">
            {nextBottlenecks.map((entry) => (
              <li
                key={entry.date}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-gray-700/40"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {format(new Date(entry.date), "EEE, MMM d")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {entry.headcount} booked · capacity {entry.capacity}
                  </p>
                </div>
                <span
                  className={`${
                    entry.utilization >= 1
                      ? statusPillStyles.declined_quota
                      : statusPillStyles.needs_review
                  } rounded-full px-3 py-1 text-[11px] font-semibold`}
                >
                  {Math.round(entry.utilization * 100)}% utilization
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
          Priority support
        </p>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
          Enterprise requests are routed directly to the dedicated inbox with a 4-hour SLA and escalation path.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100">
            Fast-track responses
          </span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-800 dark:bg-purple-900/40 dark:text-purple-100">
            Shared Slack channel
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
            On-call escalation
          </span>
        </div>
      </div>
    </div>
  );
}
