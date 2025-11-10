import { useEffect } from "react";

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
      href: "https://app.offyse.com/signup",
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900" />
          <div className="absolute inset-x-0 -top-1/2 h-[520px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.45),transparent_65%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
        </div>
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
          <a
            href="https://offyse.com"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/80 text-xl font-bold">
              O
            </span>
            Offyse
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-200 md:flex">
            {navigationLinks.map((link) => (
              <a key={link.label} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <a
              href="https://app.offyse.com/login"
              className="rounded-full border border-slate-500/60 px-4 py-2 text-sm text-slate-200 transition hover:border-indigo-400 hover:text-white"
            >
              Sign in
            </a>
            <a
              href="https://app.offyse.com/signup"
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Start free trial
            </a>
          </div>
        </nav>
        <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-10 text-center md:pt-20">
          <div className="mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-indigo-200">
              Team-friendly time off management
            </span>
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              Give every team clear visibility into time away
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-200 md:text-xl">
              Offyse keeps schedules aligned, approvals fast, and employees supported. No more spreadsheets, no more guesswork—just confident planning across hybrid and distributed teams.
            </p>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="https://app.offyse.com/signup"
              className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
            >
              Start your 14-day trial
            </a>
            <a
              href="mailto:hello@offyse.com"
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-white/10 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/20"
            >
              Book a walkthrough
            </a>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/5 bg-white/5 p-6 backdrop-blur"
              >
                <p className="text-sm uppercase tracking-wide text-indigo-200/80">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
                <p className="mt-2 text-sm text-slate-200/80">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-10 space-y-32 bg-slate-950 pb-32">
        <section
          id="product"
          className="mx-auto grid max-w-6xl gap-12 rounded-[32px] border border-white/5 bg-slate-900/60 px-6 py-16 shadow-xl shadow-slate-950/40 md:grid-cols-2 md:px-12"
        >
          <div>
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Everything you need to manage time off with confidence
            </h2>
            <p className="mt-4 text-lg text-slate-200">
              Offyse unifies requests, approvals, and reporting so everyone knows who is available. Tailor policies by team, set blackout dates, and keep staffing levels balanced automatically.
            </p>
            <ul className="mt-8 space-y-4 text-base text-slate-200/90">
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-500/20 text-lg">
                  ✓
                </span>
                Drag-and-drop calendar with instant conflict detection.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-500/20 text-lg">
                  ✓
                </span>
                Automatic holiday imports for over 190 countries and custom company observances.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-500/20 text-lg">
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
                className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur transition hover:border-indigo-400/60 hover:bg-indigo-500/10"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl" aria-hidden="true">
                    {feature.icon}
                  </span>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-200/80">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="mx-auto max-w-6xl px-6">
          <div className="rounded-[32px] border border-white/5 bg-slate-900/60 p-10 shadow-lg shadow-slate-950/40">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-white md:text-4xl">
                Launch in an afternoon, stay aligned forever
              </h2>
              <p className="mt-4 text-lg text-slate-200">
                We designed Offyse to slide into your existing workflow. Every step is fully guided so admins and managers can get back to leading their teams.
              </p>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-2">
              {workflowSteps.map((step) => (
                <div
                  key={step.step}
                  className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur"
                >
                  <span className="absolute -top-6 right-4 text-8xl font-black text-indigo-500/10">
                    {step.step}
                  </span>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-100">
                    {step.step}
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-200/80">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="mx-auto max-w-6xl px-6">
          <div className="rounded-[32px] border border-white/5 bg-slate-900/60 p-10 shadow-lg shadow-slate-950/40">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold text-white md:text-4xl">
                  Trusted by operations leaders who care about people
                </h2>
                <p className="mt-4 text-lg text-slate-200">
                  From creative agencies to professional services firms, Offyse helps teams deliver on schedule while protecting employee wellbeing.
                </p>
              </div>
              <a
                href="https://app.offyse.com/signup"
                className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Try Offyse for free
              </a>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <blockquote
                  key={testimonial.name}
                  className="flex h-full flex-col justify-between rounded-3xl border border-white/5 bg-white/5 p-6 text-left backdrop-blur"
                >
                  <p className="text-lg font-medium text-white">“{testimonial.quote}”</p>
                  <footer className="mt-6 text-sm text-slate-200/80">
                    <span className="font-semibold text-white">{testimonial.name}</span>
                    <span className="block text-xs text-slate-400/80">{testimonial.role}</span>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6">
          <div className="rounded-[32px] border border-white/5 bg-slate-900/60 p-10 shadow-lg shadow-slate-950/40">
            <div className="max-w-3xl text-center md:mx-auto">
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Pricing that scales with your team</h2>
              <p className="mt-4 text-lg text-slate-200">
                Every plan includes unlimited requests, approvals, and employees in multiple time zones. Upgrade when you need deeper insights and control.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex h-full flex-col rounded-3xl border p-6 backdrop-blur transition ${
                    plan.highlighted
                      ? "border-indigo-400/70 bg-indigo-500/15 shadow-lg shadow-indigo-500/30"
                      : "border-white/5 bg-white/5"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute right-6 top-6 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm text-slate-200/80">{plan.description}</p>
                  <p className="mt-6 text-4xl font-bold text-white">{plan.price}</p>
                  <p className="text-sm text-slate-200/80">{plan.cadence}</p>
                  <ul className="mt-6 space-y-3 text-sm text-slate-200/90">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-500/20 text-xs">
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
                        ? "bg-white text-slate-900 hover:bg-indigo-100"
                        : "bg-indigo-500 text-white hover:bg-indigo-400"
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
          <div className="rounded-[32px] border border-white/5 bg-slate-900/60 p-10 shadow-lg shadow-slate-950/40">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold text-white md:text-4xl">Questions, answered</h2>
              <p className="mt-4 text-lg text-slate-200">
                We’re here to help operations and people teams build a predictable, supportive time off experience. Reach out any time at
                <a href="mailto:hello@offyse.com" className="ml-2 text-indigo-300 underline decoration-indigo-500/60 decoration-2 underline-offset-4">
                  hello@offyse.com
                </a>
                .
              </p>
            </div>
            <dl className="mt-10 space-y-6">
              {faqs.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur"
                >
                  <dt className="text-lg font-semibold text-white">{faq.question}</dt>
                  <dd className="mt-3 text-sm leading-6 text-slate-200/80">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6">
          <div className="rounded-[32px] border border-indigo-500/40 bg-indigo-500/20 p-10 text-center shadow-lg shadow-indigo-500/30">
            <h2 className="text-3xl font-semibold text-white md:text-4xl">
              Ready to give your team clarity?
            </h2>
            <p className="mt-4 text-lg text-indigo-100">
              Launch Offyse in minutes and keep everyone aligned on who is out, when, and why. Your first 14 days are on us.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="https://app.offyse.com/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-base font-semibold text-slate-900 transition hover:bg-indigo-100"
              >
                Create your account
              </a>
              <a
                href="mailto:hello@offyse.com"
                className="inline-flex items-center justify-center rounded-full border border-white/70 px-8 py-3 text-base font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Talk to our team
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-slate-950/80 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/80 text-lg font-bold">
              O
            </span>
            <div>
              <p className="font-semibold">Offyse</p>
              <p className="text-xs text-slate-400">Modern time off planning for teams everywhere.</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-slate-400 md:flex-row md:items-center md:gap-6">
            <a href="mailto:hello@offyse.com" className="hover:text-white">
              Contact
            </a>
            <a href="https://offyse.com/privacy" className="hover:text-white">
              Privacy
            </a>
            <a href="https://offyse.com/terms" className="hover:text-white">
              Terms
            </a>
            <span className="text-slate-500">© {new Date().getFullYear()} Offyse Labs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
