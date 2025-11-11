import { useEffect, useMemo, useState } from "react";
import { handleLandingNavigation } from "../lib/landingNavigation";

const legalContent = {
  privacy: {
    title: "Privacy Policy",
    subtitle:
      "We respect the trust you place in Offyse and are committed to protecting the data your team relies on.",
    sections: [
      {
        heading: "Information we collect",
        paragraphs: [
          "We only collect the information required to provide and improve the Offyse service. This includes details that administrators and employees enter as part of managing time off workflows.",
        ],
        bullets: [
          "Profile details such as name, email address, role assignments, and optional avatar uploads.",
          "Booking data including leave types, start and end dates, notes, and approval activity.",
          "Usage metadata like login timestamps, device/browser information, and event logs that help us secure the platform.",
        ],
      },
      {
        heading: "How we use information",
        paragraphs: [
          "The data we process allows Offyse to deliver collaborative scheduling features, maintain account security, and keep administrators informed.",
        ],
        bullets: [
          "Powering calendars, reports, and notifications that teams configure inside Offyse.",
          "Providing support responses, incident follow ups, and guidance that references your workspace configuration.",
          "Improving product reliability through aggregated, de-identified analytics.",
        ],
      },
      {
        heading: "Data sharing and storage",
        paragraphs: [
          "We never sell customer data. Access is limited to vetted Offyse employees and subprocessors that support secure infrastructure hosting, authentication, and email delivery.",
          "All data is encrypted in transit and at rest. You can request removal of personal information by emailing hello@offyse.com from a verified administrator account.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "Workspace owners control which teammates can view or edit employee information. Administrators can export data at any time and request full deletion of an account by contacting our support team.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    subtitle:
      "These terms describe your responsibilities when using Offyse to coordinate time away from work.",
    
    sections: [
      {
        heading: "Acceptance of terms",
        paragraphs: [
          "By accessing or using Offyse, you agree to these terms on behalf of the organization that controls your workspace. If you do not agree, you must discontinue use of the service.",
        ],
      },
      {
        heading: "Account responsibilities",
        paragraphs: [
          "You are responsible for maintaining accurate employee information, safeguarding login credentials, and ensuring that only authorized teammates receive access.",
        ],
        bullets: [
          "Notify us immediately if you suspect unauthorized access to your workspace.",
          "Configure appropriate approval workflows and permissions for each team.",
          "Comply with all applicable employment and privacy regulations in your region.",
        ],
      },
      {
        heading: "Service availability",
        paragraphs: [
          "We strive to keep Offyse available 24/7, with routine maintenance scheduled outside of peak working hours. We may modify features to improve the service, and will provide notice of any material changes to functionality.",
        ],
      },
      {
        heading: "Payment terms",
        paragraphs: [
          "Subscription fees are billed based on active employees unless otherwise outlined in a separate agreement. Charges are non-refundable except where required by law.",
        ],
      },
      {
        heading: "Limitation of liability",
        paragraphs: [
          "Offyse is provided on an \"as is\" basis. To the fullest extent permitted by law, Offyse and its affiliates are not liable for indirect, incidental, or consequential damages arising from use of the service.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          "Questions about these terms can be sent to hello@offyse.com. We will work with you to resolve concerns and clarify obligations.",
        ],
      },
    ],
  },
};

export default function LandingLegalPage({ variant = "privacy" }) {
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

  const content = useMemo(() => {
    if (variant === "terms") {
      return legalContent.terms;
    }
    return legalContent.privacy;
  }, [variant]);

  useEffect(() => {
    const previousTitle = document.title;
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");

    document.title = `${content.title} – Offyse`;
    root.classList.remove("dark");

    return () => {
      document.title = previousTitle;
      if (hadDark) {
        root.classList.add("dark");
      }
    };
  }, [content.title]);

  const toggleTheme = () => setIsDarkMode((previous) => !previous);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
      }`}
    >
      <header className="relative overflow-hidden border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="absolute inset-0 -z-10">
          <div
            className={`absolute inset-0 bg-gradient-to-b transition-colors duration-300 ${
              isDarkMode
                ? "from-slate-900 via-slate-950 to-slate-900"
                : "from-indigo-50 via-white to-indigo-100"
            }`}
          />
        </div>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 md:px-8">
          <a
            href="/landing"
            onClick={(event) => handleLandingNavigation(event, "/landing")}
            className="flex items-center gap-3 text-lg font-semibold"
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-xl font-bold transition-colors ${
                isDarkMode ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-500/10 text-indigo-600"
              }`}
            >
              O
            </span>
            Offyse
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isDarkMode
                ? "border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {isDarkMode ? "Light mode" : "Dark mode"}
          </button>
        </div>
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-8 md:px-8">
          <p className="text-sm uppercase tracking-wide text-indigo-500">Legal</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            {content.title}
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {content.subtitle}
          </p>
          
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:px-8 md:py-16">
        <div className="space-y-12">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                {section.paragraphs?.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-300">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </div>
        <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/40">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Need to talk to a human?
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Our team is happy to help with privacy or compliance reviews. Reach out at
            <a
              href="mailto:hello@offyse.com"
              className="ml-1 font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
            >
              hello@offyse.com
            </a>
            .
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-10 dark:border-slate-800 dark:bg-slate-950/40">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-6 px-6 text-sm text-slate-500 md:flex-row md:items-center md:px-8 dark:text-slate-400">
          <div className="flex flex-col gap-2">
            <span>© {new Date().getFullYear()} Offyse.com</span>
            <span className="text-slate-400 dark:text-slate-500">
              Built for teams that plan thoughtfully.
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="/landing"
              onClick={(event) => handleLandingNavigation(event, "/landing")}
              className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
            >
              Back to overview
            </a>
            {variant !== "privacy" && (
              <a
                href="/landing/privacy"
                onClick={(event) =>
                  handleLandingNavigation(event, "/landing/privacy")
                }
                className="hover:text-slate-700 dark:hover:text-white"
              >
                Privacy
              </a>
            )}
            {variant !== "terms" && (
              <a
                href="/landing/terms"
                onClick={(event) =>
                  handleLandingNavigation(event, "/landing/terms")
                }
                className="hover:text-slate-700 dark:hover:text-white"
              >
                Terms
              </a>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
