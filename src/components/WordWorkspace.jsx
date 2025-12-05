import { useMemo, useState } from "react";

const featureGroups = [
  {
    title: "Document fundamentals",
    items: [
      "Styles, headings, tables, and media blocks",
      "Page layout controls for margins, columns, and section breaks",
      "Smart templates for reports, letters, and meeting notes",
      "Cloud autosave with version history and restore",
    ],
  },
  {
    title: "Collaboration & review",
    items: [
      "Real-time co-authoring with presence indicators",
      "Inline comments, mentions, and tracked changes",
      "Approval-ready export to PDF or print",
      "Share links with view, comment, or edit permissions",
    ],
  },
  {
    title: "Intelligence & polish",
    items: [
      "Grammar, spelling, and readability suggestions",
      "Citation helper with bibliography presets",
      "Accessibility checker for contrast and heading order",
      "Translation, dictation, and immersive reader modes",
    ],
  },
];

const templates = [
  {
    name: "Executive summary",
    description: "Concise 1–2 page brief with hero statement and key risks.",
    audience: "Leadership",
  },
  {
    name: "Project proposal",
    description: "Milestones, scope, budget, and dependencies in one outline.",
    audience: "Stakeholders",
  },
  {
    name: "Meeting minutes",
    description: "Decisions, owners, and follow-ups with timing cues.",
    audience: "Teams",
  },
  {
    name: "Policy doc",
    description: "Numbered sections, appendices, and approval tracking.",
    audience: "Operations",
  },
];

export default function WordWorkspace() {
  const [docTitle, setDocTitle] = useState("Untitled Word 365 doc");
  const [content, setContent] = useState(
    "Start drafting with full-fidelity Word controls—styling, layout, and live collaboration."
  );
  const [fontSize, setFontSize] = useState(16);
  const [alignment, setAlignment] = useState("left");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [spellCheck, setSpellCheck] = useState(true);
  const [trackChanges, setTrackChanges] = useState(true);
  const [coAuthoring, setCoAuthoring] = useState(true);

  const previewStyle = useMemo(
    () => ({
      fontWeight: bold ? 700 : 500,
      fontStyle: italic ? "italic" : "normal",
      textDecoration: underline ? "underline" : "none",
      textAlign: alignment,
      lineHeight,
      fontSize: `${fontSize}px`,
    }),
    [alignment, bold, fontSize, italic, lineHeight, underline]
  );

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200/60 bg-gradient-to-r from-indigo-50 via-white to-purple-50 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.3)] transition-colors duration-300 dark:border-slate-700/60 dark:from-slate-900/60 dark:via-slate-900/30 dark:to-indigo-900/30 dark:shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-[0.25rem] text-slate-400 dark:text-slate-500">
          Word 365 workspace
        </p>
        <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
              Full-fidelity document editing
            </h1>
            <p className="mt-1 max-w-3xl text-base text-slate-600 dark:text-slate-300">
              Create polished docs with styles, tracked changes, review notes, export options, and cloud collaboration—mirroring
              the Microsoft Word 365 toolset your teams expect.
            </p>
          </div>
          <div className="inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 transition dark:bg-slate-800 dark:text-indigo-200 dark:ring-indigo-800/60">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            Auto-save and co-authoring active
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3rem] text-slate-400 dark:text-slate-500">
                  Document title
                </p>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-lg font-semibold text-slate-900 shadow-sm outline-none transition hover:border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/60"
                  value={docTitle}
                  onChange={(event) => setDocTitle(event.target.value)}
                  aria-label="Document title"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                <label className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/80">
                  <input
                    type="checkbox"
                    checked={spellCheck}
                    onChange={(event) => setSpellCheck(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Spell check
                </label>
                <label className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/80">
                  <input
                    type="checkbox"
                    checked={trackChanges}
                    onChange={(event) => setTrackChanges(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Track changes
                </label>
                <label className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700/80">
                  <input
                    type="checkbox"
                    checked={coAuthoring}
                    onChange={(event) => setCoAuthoring(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Live co-authoring
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800/80">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-indigo-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/80">
                  <button
                    className={`rounded-lg px-2 py-1 transition ${bold ? "bg-indigo-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    onClick={() => setBold((value) => !value)}
                    aria-pressed={bold}
                    aria-label="Toggle bold"
                  >
                    B
                  </button>
                  <button
                    className={`rounded-lg px-2 py-1 transition ${italic ? "bg-indigo-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    onClick={() => setItalic((value) => !value)}
                    aria-pressed={italic}
                    aria-label="Toggle italic"
                  >
                    I
                  </button>
                  <button
                    className={`rounded-lg px-2 py-1 transition ${underline ? "bg-indigo-600 text-white" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    onClick={() => setUnderline((value) => !value)}
                    aria-pressed={underline}
                    aria-label="Toggle underline"
                  >
                    U
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-indigo-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/80">
                  <label className="flex items-center gap-2">
                    Font size
                    <input
                      type="number"
                      min={10}
                      max={48}
                      value={fontSize}
                      onChange={(event) => setFontSize(Number(event.target.value) || 16)}
                      className="w-20 rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-800 shadow-inner focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/60"
                      aria-label="Font size"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    Line spacing
                    <input
                      type="number"
                      min={1}
                      step={0.1}
                      value={lineHeight}
                      onChange={(event) => setLineHeight(Number(event.target.value) || 1.5)}
                      className="w-20 rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-800 shadow-inner focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/60"
                      aria-label="Line spacing"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80 transition hover:ring-indigo-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700/80">
                  {[
                    { value: "left", label: "Left" },
                    { value: "center", label: "Center" },
                    { value: "right", label: "Right" },
                    { value: "justify", label: "Justify" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`rounded-lg px-2 py-1 transition ${
                        alignment === option.value
                          ? "bg-indigo-600 text-white"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                      onClick={() => setAlignment(option.value)}
                      aria-pressed={alignment === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
              <label className="text-xs font-semibold uppercase tracking-[0.3rem] text-slate-400 dark:text-slate-500">
                Drafting canvas
              </label>
              <textarea
                spellCheck={spellCheck}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="mt-2 h-48 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-800 shadow-inner outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/60"
                aria-label="Document body"
              />
              <div
                className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-4 text-slate-800 shadow-inner transition-colors duration-300 dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 dark:text-slate-50"
                style={previewStyle}
              >
                {content || "Start typing to preview your formatted Word doc..."}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2rem] text-slate-400 dark:text-slate-500">
                <span>Revision history · {trackChanges ? "Tracked" : "Off"}</span>
                <span>Spelling · {spellCheck ? "On" : "Off"}</span>
                <span>Co-authoring · {coAuthoring ? "Live" : "Solo"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3rem] text-slate-400 dark:text-slate-500">
                  Templates
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Start from best-practice docs</h2>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:ring-indigo-800/50">
                Word 365-ready
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {templates.map((template) => (
                <article
                  key={template.name}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-indigo-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:ring-indigo-800/50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {template.name}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                      {template.audience}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{template.description}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-xl transition-colors duration-300 dark:border-slate-700/70 dark:bg-slate-900/70 dark:shadow-black/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3rem] text-slate-400 dark:text-slate-500">
                  Word-grade coverage
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">All the controls your team expects</h2>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800/50">
                Feature parity
              </span>
            </div>
            <div className="mt-4 space-y-4">
              {featureGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm transition dark:border-slate-700 dark:bg-slate-800/80">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{group.title}</h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
