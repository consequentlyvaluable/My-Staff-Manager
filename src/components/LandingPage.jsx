import { useEffect, useState } from "react";

const navigationLinks = [
  { label: "Product", href: "#product" },
  { label: "Workflow", href: "#workflow" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const featureHighlights = [
  {
    title: "One calendar, zero confusion",
    description:
      "See approved vacations, pending requests, public holidays, and blackout periods in a single live view for every location.",
    icon: "📅",
  },
  {
    title: "Empower managers & teammates",
    description:
      "Give team leads controlled access to approve requests, balance workloads, and notify impacted collaborators instantly.",
    icon: "🤝",
  },
  {
    title: "Reduce back-and-forth",
    description:
      "Employees can request time off in seconds, upload context, and receive automatic confirmations or follow-ups via email.",
    icon: "⚡",
  },
];

const metrics = [
  {
    label: "Admin hours saved",
    value: "32%",
    detail: "Average reduction in manual coordination after the first month.",
  },
  {
    label: "Teams onboarded",
    value: "180+",
    detail: "Across agencies, consultancies, and distributed product organizations.",
  },
  {
    label: "Employee adoption",
    value: "98%",
    detail: "Staff members actively submitting requests within the first two weeks.",
  },
];

const workflowSteps = [
  {
    step: "1",
    title: "Invite your team",
    description:
      "Import from CSV, sync from HRIS, or send magic links. Everyone lands in the right team with the right permissions.",
  },
  {
    step: "2",
    title: "Create the rules",
    description:
      "Define approval flows, set minimum staffing thresholds, and mirror country-specific holidays with a click.",
  },
  {
    step: "3",
    title: "Approve with clarity",
    description:
      "Managers get context-rich requests and the impact on headcount instantly, so decisions take seconds instead of days.",
  },
  {
    step: "4",
    title: "Report & celebrate",
    description:
      "Automatic dashboards make it easy to spot burnout risks, stay compliant, and recognize well-earned breaks.",
  },
];

const testimonials = [
  {
    quote:
      "Offyse replaced a labyrinth of spreadsheets and Slack threads. Our producers can finally plan ahead, and approvals happen while we stay focused on client work.",
    name: "Leah Patterson",
    role: "Director of Operations, Northwind Studio",
  },
  {
    quote:
      "The visibility into who is out each week reduced scheduling conflicts to almost zero. Our hybrid team feels aligned even when we're miles apart.",
    name: "Mason Ortiz",
    role: "Head of Delivery, Brightline Labs",
  },
];

const faqs = [
  {
    question: "Can Offyse sync with our existing tools?",
    answer:
      "Yes. Connect your Google or Outlook calendar for company-wide visibility, and use our Zapier template to update HRIS or payroll systems automatically.",
  },
  {
    question: "Is there a minimum team size?",
    answer:
      "No minimums. We support growing teams from 5 to 5000 employees with the same intuitive experience and permission controls.",
  },
  {
    question: "Do employees need training?",
    answer:
      "Most teams are live in under 15 minutes. Employees receive a guided request wizard and contextual tips in-app so there's nothing new to learn.",
  },
  {
    question: "How secure is the platform?",
    answer:
      "We use Supabase for authentication, encrypt data at rest and in transit, and provide audit logs for enterprise accounts.",
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$4",
    cadence: "per active employee / month",
    description:
      "Core approval workflows, shared calendar, and unlimited requests for small but mighty teams.",
    features: [
      "Automated approval routing",
      "Google & Outlook calendar sync",
      "Email notifications & reminders",
      "Self-serve employee portal",
    ],
    cta: {
      label: "Start free trial",
      href: "mailto:hello@offyse.com",
    },
    highlighted: false,
  },
  {
    name: "Scale",
    price: "$7",
    cadence: "per active employee / month",
    description:
      "Advanced analytics, role-based permissions, and integrations built for multi-team organizations.",
    features: [
      "Advanced capacity forecasting",
      "Team-level quotas & alerts",
      "Slack & Teams notifications",
      "Priority email support",
    ],
    cta: {
      label: "Talk to sales",
      href: "mailto:hello@offyse.com",
    },
    highlighted: true,
  },
];

export default function LandingPage() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    const storedPreference = window.localStorage.getItem("landing-theme");
    if (storedPreference === "dark") {
      return true;
    }
    if (storedPreference === "light") {
      return false;
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("landing-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const previousTitle = document.title;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    document.title = "Offyse – Plan time off without the spreadsheets";
    root.classList.remove("dark");

    return () => {
      document.title = previousTitle;
      if (hadDark) {
        root.classList.add("dark");
      }
    };
  }, []);

  const toggleTheme = () => setIsDarkMode((previous) => !previous);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
      }`}
    >
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className={`absolute inset-0 bg-gradient-to-b transition-colors duration-300 ${
              isDarkMode
                ? "from-slate-900 via-slate-950 to-slate-900"
                : "from-indigo-50 via-white to-indigo-100"
            }`}
          />
          <div
            className={`absolute inset-x-0 -top-1/2 h-[520px] transition-opacity duration-300 ${
              isDarkMode
                ? "bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.45),transparent_65%)]"
                : "bg-[radial-gradient(circle_at_top,rgba(79,70,229,0.35),transparent_60%)]"
            }`}
          />
          <div
            className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t transition-colors duration-300 ${
              isDarkMode
                ? "from-slate-950 via-slate-950/60 to-transparent"
                : "from-white via-white/60 to-transparent"
            }`}
          />
        </div>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <a
            href="https://offyse.com"
            className={`flex items-center gap-2 text-lg font-semibold tracking-tight ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold ${
                isDarkMode ? "bg-indigo-500/80 text-white" : "bg-indigo-500 text-white"
              }`}
            >
              O
            </span>
            Offyse
          </a>
          <div
            className={`hidden items-center gap-8 text-sm font-medium md:flex ${
              isDarkMode ? "text-slate-200" : "text-slate-600"
            }`}
          >
            {navigationLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={`${
                  isDarkMode ? "hover:text-white" : "hover:text-slate-900"
                } transition-colors`}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="https://offyse.com"
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isDarkMode
                  ? "border-slate-500/60 text-slate-200 hover:border-indigo-400 hover:text-white"
                  : "border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
              }`}
            >
              Sign in
            </a>
            <a
              href="mailto:hello@offyse.com"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isDarkMode
                  ? "bg-indigo-500 text-white hover:bg-indigo-400"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }`}
            >
              Start free trial
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
                isDarkMode
                  ? "border-slate-500/60 text-slate-100 hover:border-indigo-400 hover:text-white"
                  : "border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
              }`}
              aria-label={isDarkMode ? "Activate light mode" : "Activate dark mode"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </nav>
        <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-10 text-center md:pt-20">
          <div className="mx-auto max-w-2xl">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs uppercase tracking-[0.2em] ${
                isDarkMode
                  ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
                  : "border-indigo-200 bg-indigo-50 text-indigo-600"
              }`}
            >
              Team-friendly time off management
            </span>
            <h1
              className={`mt-8 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Give every team clear visibility into time away
            </h1>
            <p
              className={`mt-6 text-lg leading-8 md:text-xl ${
                isDarkMode ? "text-slate-200" : "text-slate-600"
              }`}
            >
              Offyse keeps schedules aligned, approvals fast, and employees supported. No more spreadsheets, no more guesswork—just confident planning across hybrid and distributed teams.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://app.offyse.com/signup"
              className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold shadow-lg transition ${
                isDarkMode
                  ? "bg-indigo-500 text-white shadow-indigo-500/30 hover:bg-indigo-400"
                  : "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500"
              }`}
            >
              Start your 14-day trial
            </a>
            <a
              href="mailto:hello@offyse.com"
              className={`inline-flex items-center justify-center rounded-full border px-8 py-3 text-base font-semibold transition ${
                isDarkMode
                  ? "border-transparent bg-white/10 text-white hover:bg-white/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-indigo-50"
              }`}
            >
              Book a walkthrough
            </a>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className={`rounded-2xl border p-6 transition-colors ${
                  isDarkMode
                    ? "border-white/5 bg-white/5 backdrop-blur"
                    : "border-slate-200 bg-white shadow-sm"
                }`}
              >
                <p
                  className={`text-sm uppercase tracking-wide ${
                    isDarkMode ? "text-indigo-200/80" : "text-indigo-600"
                  }`}
                >
                  {metric.label}
                </p>
                <p
                  className={`mt-3 text-3xl font-semibold ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  {metric.value}
                </p>
                <p
                  className={`mt-2 text-sm ${
                    isDarkMode ? "text-slate-200/80" : "text-slate-600"
                  }`}
                >
                  {metric.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main
        className={`relative z-10 -mt-10 space-y-32 pb-32 transition-colors duration-300 ${
          isDarkMode ? "bg-slate-950" : "bg-transparent"
        }`}
      >
        <section
          id="product"
          className={`mx-auto grid max-w-6xl gap-12 rounded-[32px] border px-6 py-16 shadow-xl md:grid-cols-2 md:px-12 ${
            isDarkMode
              ? "border-white/5 bg-slate-900/60 shadow-slate-950/40"
              : "border-slate-200 bg-white shadow-slate-200/60"
          }`}
        >
          <div>
            <h2
              className={`text-3xl font-semibold md:text-4xl ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Everything you need to manage time off with confidence
            </h2>
            <p
              className={`mt-4 text-lg ${
                isDarkMode ? "text-slate-200" : "text-slate-600"
              }`}
            >
              Offyse unifies requests, approvals, and reporting so everyone knows who is available. Tailor policies by team, set blackout dates, and keep staffing levels balanced automatically.
            </p>
            <ul
              className={`mt-8 space-y-4 text-base ${
                isDarkMode ? "text-slate-200/90" : "text-slate-600"
              }`}
            >
              <li className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg ${
                    isDarkMode
                      ? "bg-indigo-500/20 text-indigo-100"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  ✓
                </span>
                Drag-and-drop calendar with instant conflict detection.
              </li>
              <li className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg ${
                    isDarkMode
                      ? "bg-indigo-500/20 text-indigo-100"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  ✓
                </span>
                Automatic holiday imports for over 190 countries and custom company observances.
              </li>
              <li className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg ${
                    isDarkMode
                      ? "bg-indigo-500/20 text-indigo-100"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  ✓
                </span>
                Real-time alerts when staffing dips below required coverage.
              </li>
            </ul>
          </div>
          <div className="space-y-6">
            {featureHighlights.map((feature) => (
              <div
                key={feature.title}
                className={`rounded-3xl border p-6 transition ${
                  isDarkMode
                    ? "border-white/5 bg-white/5 backdrop-blur hover:border-indigo-400/60 hover:bg-indigo-500/10"
                    : "border-slate-200 bg-white shadow-sm hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {feature.title}
                  </h3>
                </div>
                <p
                  className={`mt-4 text-sm leading-6 ${
                    isDarkMode ? "text-slate-200/80" : "text-slate-600"
                  }`}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-6xl px-6">
          <div
            className={`rounded-[32px] border p-10 shadow-lg transition-colors ${
              isDarkMode
                ? "border-white/5 bg-slate-900/60 shadow-slate-950/40"
                : "border-slate-200 bg-white shadow-slate-200/60"
            }`}
          >
            <div className="max-w-3xl">
              <h2
                className={`text-3xl font-semibold md:text-4xl ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Launch in an afternoon, stay aligned forever
              </h2>
              <p
                className={`mt-4 text-lg ${
                  isDarkMode ? "text-slate-200" : "text-slate-600"
                }`}
              >
                We designed Offyse to slide into your existing workflow. Every step is fully guided so admins and managers can get back to leading their teams.
              </p>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {workflowSteps.map((step) => (
                <div
                  key={step.step}
                  className={`relative overflow-hidden rounded-3xl border p-6 transition ${
                    isDarkMode
                      ? "border-white/5 bg-white/5 backdrop-blur"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  <span
                    className={`absolute -top-6 right-4 text-8xl font-black ${
                      isDarkMode ? "text-indigo-500/10" : "text-indigo-200"
                    }`}
                  >
                    {step.step}
                  </span>
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${
                      isDarkMode
                        ? "bg-indigo-500/20 text-indigo-100"
                        : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    {step.step}
                  </div>
                  <h3
                    className={`mt-6 text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-6 ${
                      isDarkMode ? "text-slate-200/80" : "text-slate-600"
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="mx-auto max-w-6xl px-6">
          <div
            className={`rounded-[32px] border p-10 shadow-lg transition-colors ${
              isDarkMode
                ? "border-white/5 bg-slate-900/60 shadow-slate-950/40"
                : "border-slate-200 bg-white shadow-slate-200/60"
            }`}
          >
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2
                  className={`text-3xl font-semibold md:text-4xl ${
                    isDarkMode ? "text-white" : "text-slate-900"
                  }`}
                >
                  Trusted by operations leaders who care about people
                </h2>
                <p
                  className={`mt-4 text-lg ${
                    isDarkMode ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  From creative agencies to professional services firms, Offyse helps teams deliver on schedule while protecting employee wellbeing.
                </p>
              </div>
              <a
                href="mailto:hello@offyse.com"
                className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                  isDarkMode
                    ? "bg-indigo-500 text-white hover:bg-indigo-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                Try Offyse for free
              </a>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.name}
                  className={`flex h-full flex-col justify-between rounded-3xl border p-6 text-left transition ${
                    isDarkMode
                      ? "border-white/5 bg-white/5 backdrop-blur"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  <p
                    className={`text-lg font-medium ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    “{testimonial.quote}”
                  </p>
                  <footer
                    className={`mt-6 text-sm ${
                      isDarkMode ? "text-slate-200/80" : "text-slate-600"
                    }`}
                  >
                    <span
                      className={`font-semibold ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {testimonial.name}
                    </span>
                    <span
                      className={`block text-xs ${
                        isDarkMode ? "text-slate-400/80" : "text-slate-500"
                      }`}
                    >
                      {testimonial.role}
                    </span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6">
          <div
            className={`rounded-[32px] border p-10 shadow-lg transition-colors ${
              isDarkMode
                ? "border-white/5 bg-slate-900/60 shadow-slate-950/40"
                : "border-slate-200 bg-white shadow-slate-200/60"
            }`}
          >
            <div className="max-w-3xl text-center md:mx-auto">
              <h2
                className={`text-3xl font-semibold md:text-4xl ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Pricing that scales with your team
              </h2>
              <p
                className={`mt-4 text-lg ${
                  isDarkMode ? "text-slate-200" : "text-slate-600"
                }`}
              >
                Every plan includes unlimited requests, approvals, and employees in multiple time zones. Upgrade when you need deeper insights and control.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex h-full flex-col rounded-3xl border p-6 transition ${
                    plan.highlighted
                      ? isDarkMode
                        ? "border-indigo-400/70 bg-indigo-500/15 shadow-lg shadow-indigo-500/30"
                        : "border-indigo-200 bg-indigo-50 shadow-lg shadow-indigo-200/60"
                      : isDarkMode
                      ? "border-white/5 bg-white/5 backdrop-blur"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {plan.highlighted && (
                    <span
                      className={`absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isDarkMode
                          ? "bg-indigo-500 text-white"
                          : "bg-indigo-600 text-white"
                      }`}
                    >
                      Most popular
                    </span>
                  )}
                  <h3
                    className={`text-xl font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-2 text-sm ${
                      isDarkMode ? "text-slate-200/80" : "text-slate-600"
                    }`}
                  >
                    {plan.description}
                  </p>
                  <p
                    className={`mt-6 text-4xl font-bold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.price}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-slate-200/80" : "text-slate-600"
                    }`}
                  >
                    {plan.cadence}
                  </p>
                  <ul
                    className={`mt-6 space-y-3 text-sm ${
                      isDarkMode ? "text-slate-200/90" : "text-slate-600"
                    }`}
                  >
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span
                          className={`mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs ${
                            isDarkMode
                              ? "bg-indigo-500/20 text-indigo-100"
                              : "bg-indigo-100 text-indigo-600"
                          }`}
                        >
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.cta.href}
                    className={`mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                      plan.highlighted
                        ? isDarkMode
                          ? "bg-white text-slate-900 hover:bg-indigo-100"
                          : "bg-indigo-600 text-white hover:bg-indigo-500"
                        : isDarkMode
                        ? "bg-indigo-500 text-white hover:bg-indigo-400"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    }`}
                  >
                    {plan.cta.label}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-6xl px-6">
          <div
            className={`rounded-[32px] border p-10 shadow-lg transition-colors ${
              isDarkMode
                ? "border-white/5 bg-slate-900/60 shadow-slate-950/40"
                : "border-slate-200 bg-white shadow-slate-200/60"
            }`}
          >
            <div className="max-w-3xl">
              <h2
                className={`text-3xl font-semibold md:text-4xl ${
                  isDarkMode ? "text-white" : "text-slate-900"
                }`}
              >
                Questions, answered
              </h2>
              <p
                className={`mt-4 text-lg ${
                  isDarkMode ? "text-slate-200" : "text-slate-600"
                }`}
              >
                We’re here to help operations and people teams build a predictable, supportive time off experience. Reach out any time at
                <a
                  href="mailto:hello@offyse.com"
                  className={`ml-2 underline decoration-2 underline-offset-4 ${
                    isDarkMode
                      ? "text-indigo-300 decoration-indigo-500/60"
                      : "text-indigo-600 decoration-indigo-300"
                  }`}
                >
                  hello@offyse.com
                </a>
                .
              </p>
            </div>
            <dl className="mt-10 space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className={`rounded-3xl border p-6 transition ${
                    isDarkMode
                      ? "border-white/5 bg-white/5 backdrop-blur"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  <dt
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {faq.question}
                  </dt>
                  <dd
                    className={`mt-3 text-sm leading-6 ${
                      isDarkMode ? "text-slate-200/80" : "text-slate-600"
                    }`}
                  >
                    {faq.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6">
          <div
            className={`rounded-[32px] border p-10 text-center shadow-lg transition ${
              isDarkMode
                ? "border-indigo-500/40 bg-indigo-500/20 shadow-indigo-500/30"
                : "border-indigo-200 bg-indigo-50 shadow-indigo-200/60"
            }`}
          >
            <h2
              className={`text-3xl font-semibold md:text-4xl ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Ready to give your team clarity?
            </h2>
            <p
              className={`mt-4 text-lg ${
                isDarkMode ? "text-indigo-100" : "text-indigo-700"
              }`}
            >
              Launch Offyse in minutes and keep everyone aligned on who is out, when, and why. Your first 14 days are on us.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:hello@offyse.com"
                className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold transition ${
                  isDarkMode
                    ? "bg-white text-slate-900 hover:bg-indigo-100"
                    : "bg-indigo-600 text-white hover:bg-indigo-500"
                }`}
              >
                Create your account
              </a>
              <a
                href="mailto:hello@offyse.com"
                className={`inline-flex items-center justify-center rounded-full border px-8 py-3 text-base font-semibold transition ${
                  isDarkMode
                    ? "border-white/70 text-white hover:border-white hover:bg-white/10"
                    : "border-indigo-200 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100"
                }`}
              >
                Talk to our team
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer
        className={`border-t py-10 transition-colors duration-300 ${
          isDarkMode
            ? "border-white/5 bg-slate-950/80"
            : "border-slate-200 bg-white/70"
        }`}
      >
        <div
          className={`mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm md:flex-row md:items-center md:justify-between ${
            isDarkMode ? "text-slate-400" : "text-slate-600"
          }`}
        >
          <div
            className={`flex items-center gap-3 ${
              isDarkMode ? "text-white" : "text-slate-900"
            }`}
          >
            <span
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${
                isDarkMode ? "bg-indigo-500/80 text-white" : "bg-indigo-500 text-white"
              }`}
            >
              O
            </span>
            <div>
              <p className="font-semibold">Offyse</p>
              <p
                className={`text-xs ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Modern time off planning for teams everywhere.
              </p>
            </div>
          </div>
          <div
            className={`flex flex-col gap-2 md:flex-row md:items-center md:gap-6 ${
              isDarkMode ? "text-slate-400" : "text-slate-600"
            }`}
          >
            <a
              href="mailto:hello@offyse.com"
              className={`transition-colors ${
                isDarkMode ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Contact
            </a>
            <a
              href="/landing/privacy"
              className={`transition-colors ${
                isDarkMode ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Privacy
            </a>
            <a
              href="/landing/terms"
              className={`transition-colors ${
                isDarkMode ? "hover:text-white" : "hover:text-slate-900"
              }`}
            >
              Terms
            </a>
            <span className={isDarkMode ? "text-slate-500" : "text-slate-500"}>
              © {new Date().getFullYear()} Offyse.com
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
