import { useMemo, useState } from "react";

const defaultForm = () => ({
  date: new Date().toISOString().slice(0, 10),
  merchant: "",
  category: "Travel",
  amount: "",
  currency: "USD",
  status: "Draft",
  notes: "",
  receiptImage: "",
  receiptText: "",
});

const expenseCategories = [
  "Travel",
  "Lodging",
  "Meals",
  "Supplies",
  "Training",
  "Entertainment",
  "Mileage",
  "Other",
];

let tesseractPromise;
const loadTesseract = () => {
  if (!tesseractPromise) {
    tesseractPromise = import(
      /* @vite-ignore */
      "https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.esm.min.js"
    );
  }
  return tesseractPromise;
};

const statusBadges = {
  Draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200",
  Submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  Approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200",
  Reimbursed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
  Rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200",
};

const extractLikelyAmount = (text = "") => {
  const candidates = [...text.matchAll(/\b(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2}))/g)].map(
    (match) => match[1] ?? ""
  );
  if (!candidates.length) return "";
  const normalized = candidates
    .map((value) => value.replace(/,/g, "").replace(/(\d)\.(\d{3})$/, "$1$2"))
    .map((value) => Number.parseFloat(value));
  const max = Math.max(...normalized.filter((num) => Number.isFinite(num)));
  return Number.isFinite(max) ? max.toFixed(2) : "";
};

const deriveMerchant = (text = "") => {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  const wordyLine = lines.find((line) => /[A-Za-z]{3,}/.test(line)) ?? lines[0];
  const cleaned = wordyLine.replace(/[^A-Za-z0-9 &'-]/g, " ").trim();
  if (!cleaned) return "";
  return cleaned
    .split(/\s+/)
    .slice(0, 4)
    .map((part) => part[0]?.toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

export default function ExpenseReports({ currentUser }) {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [receiptFile, setReceiptFile] = useState(null);
  const [scanMessage, setScanMessage] = useState("");
  const [scanError, setScanError] = useState("");
  const [search, setSearch] = useState("");

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const submitted = expenses
      .filter((expense) => ["Submitted", "Approved", "Reimbursed"].includes(expense.status))
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const reimbursed = expenses
      .filter((expense) => expense.status === "Reimbursed")
      .reduce((sum, expense) => sum + (expense.amount || 0), 0);

    return { total, submitted, reimbursed };
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    if (!search.trim()) return expenses;
    const query = search.toLowerCase();
    return expenses.filter((expense) =>
      [
        expense.merchant,
        expense.category,
        expense.status,
        expense.notes,
        expense.date,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [expenses, search]);

  const updateForm = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleReceipt = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setScanError("");
    setScanMessage("");
    setReceiptFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      updateForm("receiptImage", reader.result?.toString() ?? "");
      updateForm("receiptText", "");
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!receiptFile) {
      setScanError("Upload a receipt image before scanning.");
      return;
    }
    setScanError("");
    setScanMessage("Scanning receipt for readable text...");
    try {
      const { default: Tesseract } = await loadTesseract();
      const result = await Tesseract.recognize(receiptFile, "eng", {
        logger: (info) => {
          if (info.status === "recognizing text" && info.progress) {
            setScanMessage(`Reading characters... ${(info.progress * 100).toFixed(0)}%`);
          }
        },
      });
      const text = result?.data?.text ?? "";
      const suggestedAmount = extractLikelyAmount(text);
      const suggestedMerchant = deriveMerchant(text);
      setScanMessage("Finished scanning the receipt.");
      setForm((previous) => ({
        ...previous,
        receiptText: text,
        amount: previous.amount || suggestedAmount,
        merchant: previous.merchant || suggestedMerchant,
      }));
    } catch (error) {
      console.error("Failed to scan receipt", error);
      const offlineHint =
        typeof navigator !== "undefined" && navigator.onLine === false
          ? " Check your connection to load the OCR engine."
          : "";
      setScanError(
        `Could not read characters from the uploaded receipt. Please try again.${offlineHint}`
      );
      setScanMessage("");
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const amountNumber = Number.parseFloat(form.amount);
    const safeAmount = Number.isFinite(amountNumber) ? amountNumber : 0;
    const newExpense = {
      ...form,
      id: crypto.randomUUID(),
      amount: safeAmount,
    };
    setExpenses((previous) => [newExpense, ...previous]);
    setForm(defaultForm());
    setReceiptFile(null);
    setScanMessage("");
    setScanError("");
  };

  const updateStatus = (id, status) => {
    setExpenses((previous) =>
      previous.map((expense) => (expense.id === id ? { ...expense, status } : expense))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-300">
            Expenses
          </p>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            Receipt-driven expense reporting
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">
            Upload receipts, extract characters automatically, and keep reimbursements moving without leaving Offyse.
          </p>
          {currentUser?.email && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Signed in as {currentUser.email}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SummaryCard label="Total logged" value={totals.total} tone="purple" />
          <SummaryCard label="Submitted" value={totals.submitted} tone="blue" />
          <SummaryCard label="Reimbursed" value={totals.reimbursed} tone="green" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-sm transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/70 dark:shadow-black/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500 dark:text-purple-300">
                New expense
              </p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Add receipt details
              </h3>
            </div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 dark:bg-purple-800/40 dark:text-purple-200">
              OCR enabled
            </span>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Date
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) => updateForm("date", event.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Merchant
                <input
                  type="text"
                  required
                  value={form.merchant}
                  placeholder="Vendor or service"
                  onChange={(event) => updateForm("merchant", event.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Amount
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount}
                  onChange={(event) => updateForm("amount", event.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                />
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Currency
                <select
                  value={form.currency}
                  onChange={(event) => updateForm("currency", event.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                >
                  {["USD", "EUR", "GBP", "CAD", "AUD"].map((code) => (
                    <option key={code}>{code}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Category
                <select
                  value={form.category}
                  onChange={(event) => updateForm("category", event.target.value)}
                  className="mt-1 w-full rounded-lg border-gray-200 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                >
                  {expenseCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Notes
              <textarea
                value={form.notes}
                rows={3}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Add context for approvers or finance"
                className="mt-1 w-full rounded-lg border-gray-200 text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
              />
            </label>

            <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/70 p-4 dark:border-purple-800/60 dark:bg-purple-900/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                    Receipt capture
                  </p>
                  <p className="text-xs text-purple-700/80 dark:text-purple-200/80">
                    Attach a photo or PDF. We will read the characters to pre-fill your expense.
                  </p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-purple-700 shadow-sm ring-1 ring-purple-100 transition-colors duration-200 hover:bg-purple-50 dark:bg-purple-800/50 dark:text-purple-100 dark:ring-purple-700">
                  Upload
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceipt} />
                </label>
              </div>

              {form.receiptImage && (
                <div className="mt-3 overflow-hidden rounded-xl border border-purple-100 shadow-sm dark:border-purple-800/60">
                  <img src={form.receiptImage} alt="Uploaded receipt" className="h-48 w-full object-cover" />
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={handleScan}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3 py-2 font-semibold text-white shadow hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-purple-50 dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus:ring-offset-purple-900"
                >
                  Scan receipt text
                </button>
                <span className="text-xs text-purple-700 dark:text-purple-200">
                  We use OCR to extract merchant names and totals.
                </span>
              </div>
              {scanMessage && (
                <p className="mt-2 rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-100">
                  {scanMessage}
                </p>
              )}
              {scanError && (
                <p className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-200">
                  {scanError}
                </p>
              )}
              {form.receiptText && (
                <div className="mt-3 rounded-xl bg-white/70 p-3 text-xs text-gray-700 ring-1 ring-purple-100 dark:bg-gray-900/60 dark:text-gray-200 dark:ring-purple-800/40">
                  <p className="font-semibold text-purple-700 dark:text-purple-200">Extracted characters</p>
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">{form.receiptText}</pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                OCR stays in-browser; images never leave Offyse.
              </div>
              <button
                type="submit"
                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:bg-purple-500 dark:hover:bg-purple-400 dark:focus:ring-offset-gray-900"
              >
                Add expense
              </button>
            </div>
          </form>
        </section>

        <section className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Expense queue
              </p>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Ready for approval and reimbursement
              </h3>
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by merchant, category, status"
              className="w-full max-w-xs rounded-lg border-gray-200 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
            />
          </div>

          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 shadow-sm transition-colors duration-300 dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-black/30">
            <div className="grid grid-cols-12 items-center bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <div className="col-span-3">Merchant</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((expense) => (
                <article
                  key={expense.id}
                  className="grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm text-gray-800 transition-colors duration-200 hover:bg-purple-50/60 dark:text-gray-100 dark:hover:bg-purple-900/20"
                >
                  <div className="col-span-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{expense.merchant}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{expense.notes}</p>
                  </div>
                  <div className="col-span-2 text-sm text-gray-700 dark:text-gray-200">
                    {expense.date}
                  </div>
                  <div className="col-span-2">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                      {expense.category}
                    </span>
                  </div>
                  <div className="col-span-2 font-semibold text-gray-900 dark:text-gray-100">
                    {expense.currency} {expense.amount.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusBadges[expense.status]}`}>
                      <span className="h-2 w-2 rounded-full bg-current opacity-80"></span>
                      {expense.status}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <select
                      value={expense.status}
                      onChange={(event) => updateStatus(expense.id, event.target.value)}
                      className="rounded-md border-gray-200 bg-white text-xs font-semibold text-gray-700 shadow-sm focus:border-purple-500 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    >
                      {["Draft", "Submitted", "Approved", "Reimbursed", "Rejected"].map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                </article>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-300">
                  No expenses match your search yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "purple" }) {
  const tones = {
    purple: {
      bg: "bg-purple-100/70 dark:bg-purple-900/30",
      text: "text-purple-800 dark:text-purple-200",
      accent: "bg-purple-500",
    },
    blue: {
      bg: "bg-blue-100/70 dark:bg-blue-900/30",
      text: "text-blue-800 dark:text-blue-200",
      accent: "bg-blue-500",
    },
    green: {
      bg: "bg-green-100/70 dark:bg-green-900/30",
      text: "text-green-800 dark:text-green-200",
      accent: "bg-green-500",
    },
  };

  const palette = tones[tone] ?? tones.purple;

  return (
    <div className={`rounded-2xl ${palette.bg} p-4 shadow-sm ring-1 ring-white/60 backdrop-blur dark:ring-white/10`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${palette.text}`}>{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${palette.text}`}>${value.toFixed(2)}</span>
        <span className={`h-2 w-2 rounded-full ${palette.accent}`}></span>
      </div>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        OCR-ready receipts included
      </p>
    </div>
  );
}
