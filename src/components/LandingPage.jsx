import { useEffect, useState } from "react";
import { handleLandingNavigation } from "../lib/landingNavigation";
import approvalsScreenshot from "../assets/screenshot-approvals.svg";
import calendarScreenshot from "../assets/screenshot-calendar.png";
import requestScreenshot from "../assets/screenshot-request.svg";

const navigationMenu = [
  {
    label: "Product",
    description: "Everything you need to run time off",
    children: [
      {
        label: "Overview",
        href: "#product",
        description: "See how Offyse keeps every team aligned.",
      },
      {
        label: "Workflow",
        href: "#workflow",
        description: "Guide requests, approvals, and reporting.",
      },
      {
        label: "Screenshots",
        href: "#screenshots",
        description: "Preview the live experience before trying.",
        children: [
          { label: "Calendar clarity", href: "#screenshots" },
          { label: "Guided requests", href: "#screenshots" },
          { label: "Manager approvals", href: "#screenshots" },
        ],
      },
    ],
  },
  {
    label: "Pricing",
    href: "#pricing",
    description: "Simple, transparent pricing for every stage.",
  },
  {
    label: "Resources",
    description: "Learn more and get help fast",
    children: [
      {
        label: "FAQ",
        href: "#faq",
        description: "Answers to the most common team questions.",
      },
      {
        label: "Talk to sales",
        href: "mailto:hello@offyse.com",
        description: "Book a tailored walkthrough for your org.",
      },
      {
        label: "Login",
        href: "/login",
        description: "Jump back into the scheduling workspace.",
        isInternal: true,
      },
    ],
  },
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
    label: "Admin time you reclaim",
    value: "Less Admin / More Focus",
    detail:
      "",
  },
  {
    label: "Visibility you gain",
    value: "1 Source of Truth - Better Co-ordination",
    detail:
      "",
  },
  {
    label: "Adoption you can expect",
    value: "Painless, Seemless",
    detail:
      "",
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

const screenshots = [
  {
    title: "Team availability calendar",
    description:
      "Track approved time off, pending requests, holidays, and staffing thresholds in one view so managers can plan confidently.",
    image: calendarScreenshot,
    alt: "Calendar view showing scheduled time off and staffing levels.",
  },
  {
    title: "Guided request workflow",
    description:
      "Employees submit context-rich requests in minutes with clear prompts, document uploads, and automatic routing.",
    image: requestScreenshot,
    alt: "Time-off request form with guided steps and summary panel.",
  },
  {
    title: "Approval inbox",
    description:
      "Leads review conflicts, staffing impact, and policy checks side-by-side so approvals stay fast and transparent.",
    image: approvalsScreenshot,
    alt: "Manager approvals list with quick actions and policy highlights.",
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
      "No minimums. The app provides the same intuitive user friendly experience whether you're a team of 2 or more.",
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
    name: "Free",
    price: "$0",
    cadence: "up to 50 employees",
    description: "All features included for growing teams getting started.",
    features: [
      "Automated approval routing",
      "Google & Outlook calendar sync",
      "Email notifications & reminders",
      "Self-serve employee portal",
      "Advanced capacity forecasting",
      "Team-level quotas & alerts",
      "Slack & Teams notifications",
      "Priority email support",
    ],
    cta: {
      label: "Start for free",
      href: "mailto:hello@offyse.com",
    },
    highlighted: false,
  },
  {
    name: "Scale",
    price: "$7",
    cadence: "per active employee / month (unlimited employees)",
    description: "Everything in Free with unlimited employee seats for larger organizations.",
    features: [
      "Automated approval routing",
      "Google & Outlook calendar sync",
      "Email notifications & reminders",
      "Self-serve employee portal",
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedSubsections, setExpandedSubsections] = useState({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setOpenSubmenu(null);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
  const toggleSection = (label) =>
    setExpandedSections((previous) => ({
      ...previous,
      [label]: !previous[label],
    }));
  const toggleSubsection = (parentLabel, childLabel) =>
    setExpandedSubsections((previous) => ({
      ...previous,
      [`${parentLabel}-${childLabel}`]: !previous[`${parentLabel}-${childLabel}`],
    }));
  const resetMenus = () => {
    setOpenMenu(null);
    setOpenSubmenu(null);
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br transition-colors duration-300 ${
        isDarkMode
          ? "from-gray-900 via-gray-950 to-purple-950 text-slate-100"
          : "from-purple-100 via-white to-purple-200 text-slate-900"
      }`}
    >
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div
            className={`absolute inset-0 bg-gradient-to-b transition-colors duration-300 ${
              isDarkMode
                ? "from-slate-900 via-slate-950 to-slate-900"
                : "from-purple-50 via-white to-purple-100"
            }`}
          />
          <div
            className={`absolute inset-x-0 -top-1/2 h-[520px] transition-opacity duration-300 ${
              isDarkMode
                ? "bg-[radial-gradient(circle_at_top,rgba(147,51,234,0.45),transparent_65%)]"
                : "bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.35),transparent_60%)]"
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
            className={`flex items-center gap-2 text-2xl font-bold ${
              isDarkMode ? "text-purple-200" : "text-purple-800"
            }`}
            aria-label="Offyse home"
          >
            <span className="text-lg sm:text-xl" aria-hidden>
              Offyse 🏢
            </span>
          </a>
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium md:hidden ${
              isDarkMode
                ? "bg-slate-800/80 text-slate-100 shadow-black/40"
                : "bg-white/80 text-slate-700 shadow-purple-100"
            }`}
            onClick={() => setIsMenuOpen((previous) => !previous)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <span className="text-lg" aria-hidden>
              {isMenuOpen ? "✕" : "☰"}
            </span>
            <span>{isMenuOpen ? "Close" : "Menu"}</span>
          </button>
          <div
            className={`relative hidden items-center gap-4 text-sm font-medium md:flex ${
              isDarkMode ? "text-slate-200" : "text-slate-600"
            }`}
            onMouseLeave={resetMenus}
          >
            {navigationMenu.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0;
              const isOpen = openMenu === item.label;

              const baseButtonClasses = `${
                isDarkMode
                  ? "hover:text-white focus-visible:text-white"
                  : "hover:text-slate-900 focus-visible:text-slate-900"
              } relative inline-flex items-center gap-2 rounded-full px-3 py-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isDarkMode ? "focus-visible:outline-purple-400" : "focus-visible:outline-purple-500"
              }`;

              const menuSurfaceClasses = `${
                isDarkMode
                  ? "border-white/10 bg-slate-900/80 text-slate-100 shadow-slate-950/40"
                  : "border-slate-200 bg-white text-slate-900 shadow-slate-200/60"
              }`;

              return (
                <div key={item.label} className="relative">
                  {hasChildren ? (
                    <button
                      type="button"
                      className={baseButtonClasses}
                      onMouseEnter={() => {
                        setOpenMenu(item.label);
                        setOpenSubmenu(null);
                      }}
                      onFocus={() => {
                        setOpenMenu(item.label);
                        setOpenSubmenu(null);
                      }}
                      onClick={() =>
                        setOpenMenu((previous) => {
                          if (previous === item.label) {
                            setOpenSubmenu(null);
                            return null;
                          }
                          setOpenSubmenu(null);
                          return item.label;
                        })
                      }
                      aria-expanded={isOpen}
                      aria-haspopup
                    >
                      <span>{item.label}</span>
                      <span className="text-xs" aria-hidden>
                        ▾
                      </span>
                    </button>
                  ) : (
                    <a
                      className={baseButtonClasses}
                      href={item.href}
                      onClick={(event) => {
                        if (item.isInternal) {
                          handleLandingNavigation(event, item.href);
                        }
                        resetMenus();
                      }}
                    >
                      {item.label}
                    </a>
                  )}

                  {hasChildren ? (
                    <div
                      className={`absolute left-0 top-full z-20 mt-3 w-[320px] overflow-hidden rounded-2xl border shadow-lg transition-all duration-200 ${
                        menuSurfaceClasses
                      } ${
                        isOpen
                          ? "pointer-events-auto scale-100 opacity-100"
                          : "pointer-events-none -translate-y-2 scale-95 opacity-0"
                      }`}
                      onMouseEnter={() => {
                        setOpenMenu(item.label);
                        setOpenSubmenu(null);
                      }}
                    >
                      <div className="space-y-3 p-4">
                        <p
                          className={`text-xs uppercase tracking-[0.25em] ${
                            isDarkMode ? "text-purple-200/80" : "text-purple-600"
                          }`}
                        >
                          {item.description}
                        </p>
                        {item.children?.map((child) => {
                          const childHasChildren = (child.children?.length ?? 0) > 0;
                          const childIsOpen = openSubmenu === child.label && isOpen;
                          const childKey = `${item.label}-${child.label}`;

                          return (
                            <div
                              key={childKey}
                              className={`rounded-xl border transition-colors ${
                                isDarkMode
                                  ? "border-white/5 bg-white/5 hover:border-purple-400/40"
                                  : "border-slate-200 bg-white hover:border-purple-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 p-3">
                                <div className="space-y-1">
                                  <a
                                    href={child.href}
                                    onClick={(event) => {
                                      if (child.isInternal) {
                                        handleLandingNavigation(event, child.href);
                                      }
                                      resetMenus();
                                    }}
                                    onMouseEnter={() => {
                                      if (childHasChildren) {
                                        setOpenSubmenu(child.label);
                                      }
                                    }}
                                    className={`text-base font-semibold transition-colors ${
                                      isDarkMode ? "text-white" : "text-slate-900"
                                    }`}
                                  >
                                    {child.label}
                                  </a>
                                  {child.description ? (
                                    <p
                                      className={`text-sm leading-relaxed ${
                                        isDarkMode ? "text-slate-200/80" : "text-slate-600"
                                      }`}
                                    >
                                      {child.description}
                                    </p>
                                  ) : null}
                                </div>
                                {childHasChildren ? (
                                  <button
                                    type="button"
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                                      isDarkMode
                                        ? "bg-white/10 text-purple-200 hover:bg-white/20"
                                        : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                                    }`}
                                    aria-expanded={childIsOpen}
                                    onMouseEnter={() => setOpenSubmenu(child.label)}
                                    onClick={() =>
                                      setOpenSubmenu((previous) =>
                                        previous === child.label ? null : child.label
                                      )
                                    }
                                  >
                                    <span aria-hidden>{childIsOpen ? "–" : "+"}</span>
                                    <span className="sr-only">Toggle nested menu</span>
                                  </button>
                                ) : null}
                              </div>
                              {childHasChildren ? (
                                <div
                                  className={`space-y-1 px-3 pb-3 transition-all duration-200 ${
                                    childIsOpen
                                      ? "max-h-40 opacity-100"
                                      : "max-h-0 overflow-hidden opacity-0"
                                  }`}
                                >
                                  {child.children.map((grandchild) => (
                                    <a
                                      key={`${childKey}-${grandchild.label}`}
                                      href={grandchild.href}
                                      onClick={resetMenus}
                                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                                        isDarkMode
                                          ? "text-slate-200 hover:bg-white/10"
                                          : "text-slate-700 hover:bg-purple-50"
                                      }`}
                                    >
                                      <span>{grandchild.label}</span>
                                      <span aria-hidden>→</span>
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="/login"
              onClick={(event) => handleLandingNavigation(event, "/login")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                isDarkMode
                  ? "border-slate-500/60 text-slate-200 hover:border-purple-400 hover:text-white"
                  : "border-slate-200 text-slate-700 hover:border-purple-400 hover:text-purple-600"
              }`}
            >
              Login
            </a>
            <a
              href="mailto:hello@offyse.com"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isDarkMode
                  ? "bg-purple-500 text-white hover:bg-purple-400"
                  : "bg-purple-600 text-white hover:bg-purple-500"
              }`}
            >
              Start free trial
            </a>
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow transition ${
                isDarkMode
                  ? "bg-slate-800/80 text-slate-100 shadow-black/40 hover:bg-slate-800"
                  : "bg-white/80 text-slate-700 shadow-purple-100 hover:bg-white"
              }`}
              aria-pressed={isDarkMode}
            >
              <span
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  isDarkMode ? "bg-purple-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isDarkMode ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
              <span>{isDarkMode ? "Dark" : "Light"} Mode</span>
            </button>
          </div>
        </nav>
        {isMenuOpen ? (
          <div
            className={`mx-auto mt-2 grid max-w-6xl gap-4 rounded-2xl border px-6 py-5 text-left shadow-lg md:hidden ${
              isDarkMode
                ? "border-white/5 bg-slate-900/80 text-slate-100 shadow-slate-950/40"
                : "border-slate-200 bg-white text-slate-800 shadow-slate-200/60"
            }`}
          >
            <div className="space-y-2 text-sm font-medium">
              {navigationMenu.map((item) => {
                const hasChildren = (item.children?.length ?? 0) > 0;
                const isExpanded = expandedSections[item.label];

                const itemSurfaceClasses = `${
                  isDarkMode
                    ? "border-white/5 bg-white/5"
                    : "border-slate-200 bg-purple-50/40"
                }`;

                if (!hasChildren) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={(event) => {
                        if (item.isInternal) {
                          handleLandingNavigation(event, item.href);
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 transition ${
                        itemSurfaceClasses
                      } ${
                        isDarkMode
                          ? "text-slate-100 hover:border-purple-400/50 hover:bg-white/10"
                          : "text-slate-800 hover:border-purple-300 hover:bg-purple-50"
                      }`}
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-base font-semibold">{item.label}</span>
                        {item.description ? (
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <span aria-hidden>→</span>
                    </a>
                  );
                }

                return (
                  <div
                    key={item.label}
                    className={`rounded-2xl border transition ${
                      itemSurfaceClasses
                    } ${
                      isDarkMode
                        ? "hover:border-purple-400/50 hover:bg-white/10"
                        : "hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                      onClick={() => toggleSection(item.label)}
                      aria-expanded={isExpanded}
                    >
                      <div className="space-y-1">
                        <span className="text-base font-semibold">{item.label}</span>
                        {item.description ? (
                          <p
                            className={`text-xs ${
                              isDarkMode ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <span aria-hidden>{isExpanded ? "–" : "+"}</span>
                    </button>
                    <div
                      className={`space-y-2 border-t px-4 pb-4 transition-all duration-200 ${
                        isExpanded ? "max-h-96 opacity-100" : "max-h-0 overflow-hidden opacity-0"
                      } ${isDarkMode ? "border-white/5" : "border-purple-100"}`}
                    >
                      {item.children.map((child) => {
                        const childHasChildren = (child.children?.length ?? 0) > 0;
                        const childKey = `${item.label}-${child.label}`;
                        const childExpanded = expandedSubsections[childKey];

                        return (
                          <div
                            key={childKey}
                            className={`rounded-xl border transition ${
                              isDarkMode
                                ? "border-white/5 bg-white/5"
                                : "border-purple-100 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3 p-3">
                              <div className="space-y-1">
                                <a
                                  href={child.href}
                                  onClick={(event) => {
                                    if (child.isInternal) {
                                      handleLandingNavigation(event, child.href);
                                    }
                                    setIsMenuOpen(false);
                                  }}
                                  className={`text-base font-semibold ${
                                    isDarkMode ? "text-white" : "text-slate-900"
                                  }`}
                                >
                                  {child.label}
                                </a>
                                {child.description ? (
                                  <p
                                    className={`text-xs ${
                                      isDarkMode ? "text-slate-300" : "text-slate-500"
                                    }`}
                                  >
                                    {child.description}
                                  </p>
                                ) : null}
                              </div>
                              {childHasChildren ? (
                                <button
                                  type="button"
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition ${
                                    isDarkMode
                                      ? "bg-white/10 text-purple-200 hover:bg-white/20"
                                      : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                                  }`}
                                  aria-expanded={childExpanded}
                                  onClick={() => toggleSubsection(item.label, child.label)}
                                >
                                  <span aria-hidden>{childExpanded ? "–" : "+"}</span>
                                  <span className="sr-only">Toggle nested menu</span>
                                </button>
                              ) : null}
                            </div>
                            {childHasChildren ? (
                              <div
                                className={`space-y-1 px-3 pb-3 transition-all duration-200 ${
                                  childExpanded
                                    ? "max-h-40 opacity-100"
                                    : "max-h-0 overflow-hidden opacity-0"
                                } ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}
                              >
                                {child.children.map((grandchild) => (
                                  <a
                                    key={`${childKey}-${grandchild.label}`}
                                    href={grandchild.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-purple-50/40"
                                  >
                                    <span>{grandchild.label}</span>
                                    <span aria-hidden>→</span>
                                  </a>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href="/login"
                onClick={(event) => {
                  handleLandingNavigation(event, "/login");
                  setIsMenuOpen(false);
                }}
                className={`rounded-full border px-4 py-3 text-center text-sm font-semibold transition ${
                  isDarkMode
                    ? "border-slate-500/60 text-slate-200 hover:border-purple-400 hover:text-white"
                    : "border-slate-200 text-slate-700 hover:border-purple-400 hover:text-purple-600"
                }`}
              >
                Login
              </a>
              <a
                href="mailto:hello@offyse.com"
                className={`rounded-full px-4 py-3 text-center text-sm font-semibold transition ${
                  isDarkMode
                    ? "bg-purple-500 text-white hover:bg-purple-400"
                    : "bg-purple-600 text-white hover:bg-purple-500"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Start free trial
              </a>
            </div>
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                setIsMenuOpen(false);
              }}
              className={`flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow transition ${
                isDarkMode
                  ? "bg-slate-800/80 text-slate-100 shadow-black/40 hover:bg-slate-800"
                  : "bg-white/80 text-slate-700 shadow-purple-100 hover:bg-white"
              }`}
              aria-pressed={isDarkMode}
            >
              <span
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                  isDarkMode ? "bg-purple-500" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    isDarkMode ? "translate-x-5" : "translate-x-1"
                  }`}
                />
              </span>
              <span>{isDarkMode ? "Dark" : "Light"} Mode</span>
            </button>
          </div>
        ) : null}
        <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-10 text-center md:pt-20">
          <div className="mx-auto max-w-2xl">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs uppercase tracking-[0.2em] ${
                isDarkMode
                  ? "border-purple-400/30 bg-purple-500/10 text-purple-200"
                  : "border-purple-200 bg-purple-50 text-purple-600"
              }`}
            >
              Team friendly time away management
            </span>
            <h1
              className={`mt-8 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Clear Visibility - For Every Team
            </h1>
            <p
              className={`mt-6 text-lg leading-8 md:text-xl ${
                isDarkMode ? "text-slate-200" : "text-slate-600"
              }`}
            >
              Offyse keeps schedules aligned. No more spreadsheets, no more guesswork — just confident planning for teams.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="mailto:hello@offyse.com"
              className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold shadow-lg transition ${
                isDarkMode
                  ? "bg-purple-500 text-white shadow-purple-500/30 hover:bg-purple-400"
                  : "bg-purple-600 text-white shadow-purple-500/20 hover:bg-purple-500"
              }`}
            >
              Start your 14-day trial
            </a>
            <a
              href="mailto:hello@offyse.com"
              className={`inline-flex items-center justify-center rounded-full border px-8 py-3 text-base font-semibold transition ${
                isDarkMode
                  ? "border-transparent bg-white/10 text-white hover:bg-white/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-purple-50"
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
                    isDarkMode ? "text-purple-200/80" : "text-purple-600"
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
                      ? "bg-purple-500/20 text-purple-100"
                      : "bg-purple-100 text-purple-600"
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
                      ? "bg-purple-500/20 text-purple-100"
                      : "bg-purple-100 text-purple-600"
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
                      ? "bg-purple-500/20 text-purple-100"
                      : "bg-purple-100 text-purple-600"
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
                    ? "border-white/5 bg-white/5 backdrop-blur hover:border-purple-400/60 hover:bg-purple-500/10"
                    : "border-slate-200 bg-white shadow-sm hover:border-purple-300 hover:bg-purple-50"
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
                      isDarkMode ? "text-purple-500/10" : "text-purple-200"
                    }`}
                  >
                    {step.step}
                  </span>
                  <div
                    className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold ${
                      isDarkMode
                        ? "bg-purple-500/20 text-purple-100"
                        : "bg-purple-100 text-purple-600"
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

        <section id="screenshots" className="mx-auto max-w-6xl px-6">
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
                  See Offyse in action
                </h2>
                <p
                  className={`mt-4 text-lg ${
                    isDarkMode ? "text-slate-200" : "text-slate-600"
                  }`}
                >
                  Explore the core workflows your teams will use every day—built to keep requests clear, approvals quick, and schedules predictable.
                </p>
              </div>
              <a
                href="mailto:hello@offyse.com"
                className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                  isDarkMode
                    ? "bg-purple-500 text-white hover:bg-purple-400"
                    : "bg-purple-600 text-white hover:bg-purple-500"
                }`}
              >
                Book a live demo
              </a>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {screenshots.map((screenshot) => (
                <figure
                  key={screenshot.title}
                  className={`flex h-full flex-col overflow-hidden rounded-3xl border transition ${
                    isDarkMode
                      ? "border-white/5 bg-white/5 backdrop-blur"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  <div className="relative bg-slate-950/40">
                    <img
                      src={screenshot.image}
                      alt={screenshot.alt}
                      loading="lazy"
                      className="h-56 w-full object-cover"
                    />
                    <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 backdrop-blur">
                      Product view
                    </div>
                  </div>
                  <figcaption className="flex flex-1 flex-col p-6">
                    <h3
                      className={`text-xl font-semibold ${
                        isDarkMode ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {screenshot.title}
                    </h3>
                    <p
                      className={`mt-3 text-sm leading-6 ${
                        isDarkMode ? "text-slate-200/80" : "text-slate-600"
                      }`}
                    >
                      {screenshot.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-purple-500">
                      <span className="h-2 w-2 rounded-full bg-purple-500" aria-hidden />
                      Included in every plan
                    </div>
                  </figcaption>
                </figure>
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
                Both plans include every feature—automations, calendars, alerts, and support. Choose Free for up to 50 employees or Scale for unlimited seats.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex h-full flex-col rounded-3xl border p-6 transition ${
                    plan.highlighted
                      ? isDarkMode
                        ? "border-purple-400/70 bg-purple-500/15 shadow-lg shadow-purple-500/30"
                        : "border-purple-200 bg-purple-50 shadow-lg shadow-purple-200/60"
                      : isDarkMode
                      ? "border-white/5 bg-white/5 backdrop-blur"
                      : "border-slate-200 bg-white shadow-sm"
                  }`}
                >
                  {plan.highlighted && (
                    <span
                      className={`absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        isDarkMode
                          ? "bg-purple-500 text-white"
                          : "bg-purple-600 text-white"
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
                              ? "bg-purple-500/20 text-purple-100"
                              : "bg-purple-100 text-purple-600"
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
                          ? "bg-white text-slate-900 hover:bg-purple-100"
                          : "bg-purple-600 text-white hover:bg-purple-500"
                        : isDarkMode
                        ? "bg-purple-500 text-white hover:bg-purple-400"
                        : "bg-purple-600 text-white hover:bg-purple-500"
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
                      ? "text-purple-300 decoration-purple-500/60"
                      : "text-purple-600 decoration-purple-300"
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
                ? "border-purple-500/40 bg-purple-500/20 shadow-purple-500/30"
                : "border-purple-200 bg-purple-50 shadow-purple-200/60"
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
                isDarkMode ? "text-purple-100" : "text-purple-700"
              }`}
            >
              Launch Offyse in minutes and keep everyone aligned on who is out, when, and why.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="mailto:hello@offyse.com"
                className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-semibold transition ${
                  isDarkMode
                    ? "bg-white text-slate-900 hover:bg-purple-100"
                    : "bg-purple-600 text-white hover:bg-purple-500"
                }`}
              >
                Create your account
              </a>
              <a
                href="mailto:hello@offyse.com"
                className={`inline-flex items-center justify-center rounded-full border px-8 py-3 text-base font-semibold transition ${
                  isDarkMode
                    ? "border-white/70 text-white hover:border-white hover:bg-white/10"
                    : "border-purple-200 text-purple-700 hover:border-purple-400 hover:bg-purple-100"
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
              isDarkMode ? "text-purple-200" : "text-purple-800"
            }`}
          >
            <div>
              <p className="text-lg font-bold leading-none">Offyse 🏢</p>
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
            <span className={isDarkMode ? "text-slate-500" : "text-slate-500"}>
              © {new Date().getFullYear()} Offyse.com
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
