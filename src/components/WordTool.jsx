import { useEffect, useMemo, useRef, useState } from "react";

const toolbarActions = [
  { label: "Undo", command: "undo" },
  { label: "Redo", command: "redo" },
  { label: "Bold", command: "bold" },
  { label: "Italic", command: "italic" },
  { label: "Underline", command: "underline" },
  { label: "Strike", command: "strikeThrough" },
  { label: "Bullets", command: "insertUnorderedList" },
  { label: "Numbered", command: "insertOrderedList" },
  { label: "Indent", command: "indent" },
  { label: "Outdent", command: "outdent" },
  { label: "Align L", command: "justifyLeft" },
  { label: "Align C", command: "justifyCenter" },
  { label: "Align R", command: "justifyRight" },
];

const fontSizeOptions = [
  { label: "Small", value: "2" },
  { label: "Normal", value: "3" },
  { label: "Large", value: "4" },
  { label: "Heading", value: "5" },
];

export default function WordTool() {
  const editorRef = useRef(null);
  const [documentTitle, setDocumentTitle] = useState("Untitled");
  const [content, setContent] = useState("<p class='text-slate-500'>Start typing to draft your document...</p>");
  const [lastSaved, setLastSaved] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");

  const storageKey = useMemo(() => `wordpad-document-${documentTitle.trim() || "untitled"}`, [documentTitle]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setContent(saved);
      setLastSaved(new Date());
    }
  }, [storageKey]);

  const handleCommand = (command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    setContent(editorRef.current?.innerHTML || "");
  };

  const handleLinkInsert = () => {
    if (!linkUrl.trim()) return;
    handleCommand("createLink", linkUrl.trim());
    setLinkUrl("");
  };

  const clearFormatting = () => {
    handleCommand("removeFormat");
  };

  const saveDocument = () => {
    const html = editorRef.current?.innerHTML || "";
    localStorage.setItem(storageKey, html);
    setContent(html);
    setLastSaved(new Date());
  };

  const downloadHtml = () => {
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${documentTitle || "document"}.html`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200/60 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/80 dark:shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Word Tool
            </p>
            <div className="flex flex-wrap gap-3">
              <input
                className="w-72 rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-base font-semibold text-slate-800 shadow-sm outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-purple-400"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Document name"
              />
              <button
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
                onClick={saveDocument}
              >
                Save Draft
              </button>
              <button
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-purple-300 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:text-slate-100 dark:hover:border-purple-400 dark:hover:text-purple-200"
                onClick={downloadHtml}
              >
                Export HTML
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autosave-ready rich text drafting with familiar shortcuts (⌘/Ctrl + B, I, U, Z, Y).{" "}
              <span className="text-purple-500">This is a lightweight editor, not a full Microsoft Word clone.</span>
            </p>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {lastSaved ? `Last saved ${lastSaved.toLocaleTimeString()}` : "No saves yet"}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-800/60">
          {toolbarActions.map((action) => (
            <button
              key={action.command}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-purple-50 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-700"
              onClick={() => handleCommand(action.command)}
              type="button"
            >
              {action.label}
            </button>
          ))}
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            onChange={(e) => handleCommand("fontSize", e.target.value)}
            defaultValue="3"
          >
            {fontSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <input
              className="w-48 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://link.com"
            />
            <button
              type="button"
              onClick={handleLinkInsert}
              className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200"
            >
              Insert Link
            </button>
          </div>
          <button
            type="button"
            onClick={clearFormatting}
            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 shadow-sm hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:border-amber-300/30 dark:bg-amber-900/30 dark:text-amber-200"
          >
            Clear Formatting
          </button>
        </div>

        <div
          className="mt-4 min-h-[420px] rounded-2xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-800 shadow-inner focus-within:border-purple-300 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.3)] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          contentEditable
          ref={editorRef}
          dangerouslySetInnerHTML={{ __html: content }}
          onInput={(e) => setContent(e.currentTarget.innerHTML)}
          suppressContentEditableWarning
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Tips</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-400">
            <li>Use keyboard shortcuts for speed: ⌘/Ctrl + B, I, U, Z, Y.</li>
            <li>Click "Export HTML" to download your draft as a portable file.</li>
            <li>Formatting buttons act on the current selection, just like Word.</li>
            <li>Use the size dropdown to promote headings or shrink body text.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Limitations</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            This workspace focuses on fast drafting and light formatting. It does not replicate advanced Microsoft Word 365 features like real-time collaboration, track changes, mail merge, or macros.
          </p>
        </div>
      </div>
    </div>
  );
}
