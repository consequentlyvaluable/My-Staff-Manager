import { useMemo, useState } from "react";

const priorityColors = {
  Critical: "bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-100 dark:border-red-500/40",
  High: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-500/20 dark:text-orange-100 dark:border-orange-500/40",
  Medium: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/40",
  Low: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/40",
};

const statusColors = {
  "New": "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/40",
  "In Progress": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-500/20 dark:text-purple-100 dark:border-purple-500/40",
  "Waiting": "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/20 dark:text-amber-100 dark:border-amber-500/40",
  "Resolved": "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-100 dark:border-emerald-500/40",
  "Closed": "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-500/20 dark:text-slate-100 dark:border-slate-500/40",
};

const priorityOrder = ["Critical", "High", "Medium", "Low"];
const statusOrder = ["New", "In Progress", "Waiting", "Resolved", "Closed"];

export default function TicketingWorkspace({ currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "Medium",
    requester: currentUser?.email ?? "",
    category: "Access",
  });

  const filteredTickets = useMemo(() => {
    return tickets
      .filter((ticket) => {
        if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
        if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
        if (!search.trim()) return true;
        const query = search.trim().toLowerCase();
        return (
          ticket.title.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.id.toLowerCase().includes(query) ||
          ticket.requester.toLowerCase().includes(query) ||
          ticket.assignee.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        const priorityDelta =
          priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        if (priorityDelta !== 0) return priorityDelta;
        return new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [tickets, search, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const totals = { New: 0, "In Progress": 0, Waiting: 0, Resolved: 0, Closed: 0 };
    for (const ticket of tickets) {
      totals[ticket.status] = (totals[ticket.status] ?? 0) + 1;
    }
    return totals;
  }, [tickets]);

  const handleStatusChange = (id, status) => {
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === id
          ? { ...ticket, status, updatedAt: new Date().toISOString() }
          : ticket
      )
    );
  };

  const handleNewTicketSubmit = (event) => {
    event.preventDefault();
    if (!newTicket.title.trim() || !newTicket.description.trim()) return;

    const now = new Date().toISOString();
    const prefix = newTicket.category === "Access" ? "REQ" : "INC";
    const padded = String(tickets.length + 1045).padStart(4, "0");
    const id = `${prefix}-${padded}`;

    setTickets((prev) => [
      {
        id,
        title: newTicket.title.trim(),
        description: newTicket.description.trim(),
        priority: newTicket.priority,
        status: "New",
        requester: newTicket.requester || "Unspecified",
        assignee: "Unassigned",
        category: newTicket.category,
        createdAt: now,
        updatedAt: now,
      },
      ...prev,
    ]);

    setNewTicket({
      title: "",
      description: "",
      priority: newTicket.priority,
      requester: newTicket.requester,
      category: newTicket.category,
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          Service Desk
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Ticketing workspace
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
              Log new requests, triage live incidents, and track progress in a ServiceNow-style queue built for fast response.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-600 shadow-inner dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300">
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
              {tickets.length} open items
            </span>
            <span className="text-slate-400">•</span>
            <span>
              Signed in as <span className="font-semibold">{currentUser?.email || "agent"}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Create ticket</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Capture incident details with priority and category so the right team can respond.
            </p>
            <form className="mt-4 space-y-3" onSubmit={handleNewTicketSubmit}>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Title</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket((prev) => ({ ...prev, title: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
                  placeholder="Short summary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) =>
                    setNewTicket((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
                  rows={3}
                  placeholder="What happened?"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
                  >
                    {priorityOrder.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket((prev) => ({ ...prev, category: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
                  >
                    {["Access", "Hardware", "Network", "HR", "Facilities"].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Requester</label>
                <input
                  type="email"
                  value={newTicket.requester}
                  onChange={(e) =>
                    setNewTicket((prev) => ({ ...prev, requester: e.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
                  placeholder="requester@company.com"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-white dark:bg-purple-500 dark:hover:bg-purple-600 dark:focus:ring-purple-400 dark:focus:ring-offset-slate-900"
              >
                Log ticket
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-900">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Queue snapshot
            </h4>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {statusOrder.map((status) => (
                <div
                  key={status}
                  className="rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-inner dark:border-slate-700/70 dark:bg-slate-800 dark:text-slate-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{status}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{stats[status] ?? 0}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                      style={{ width: `${Math.min((stats[status] ?? 0) * 25, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-900">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets, requesters, assignees..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
            >
              <option value="all">All statuses</option>
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
            >
              <option value="all">All priorities</option>
              {priorityOrder.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-sm transition-colors duration-300 dark:border-slate-800/70 dark:bg-slate-900">
            <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <div className="col-span-2">Ticket</div>
              <div className="col-span-4">Summary</div>
              <div className="col-span-2">Requester</div>
              <div className="col-span-2">Assignee</div>
              <div className="col-span-2 text-right">Status</div>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTickets.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  No tickets match your filters. Try a different search or status.
                </div>
              )}
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                >
                  <div className="col-span-2">
                    <div className="font-semibold text-slate-800 dark:text-white">{ticket.id}</div>
                    <div
                      className={`mt-1 inline-flex items-center gap-2 rounded-full border px-2 py-0.5 text-xs font-semibold ${priorityColors[ticket.priority]}`}
                    >
                      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
                      {ticket.priority}
                    </div>
                  </div>
                  <div className="col-span-4">
                    <div className="font-medium text-slate-900 dark:text-slate-50">
                      {ticket.title}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {ticket.description}
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {ticket.category}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {ticket.requester}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <div className="font-medium text-slate-800 dark:text-slate-100">
                      {ticket.assignee}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColors[ticket.status]}`}
                      >
                        {ticket.status}
                      </span>
                      <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
                      >
                        {statusOrder.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
