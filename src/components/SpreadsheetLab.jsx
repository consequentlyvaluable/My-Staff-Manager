import { useMemo, useState, useCallback } from "react";

const DEFAULT_CELLS = {
  A1: "12500",
  B1: "3200",
  C1: "=A1-B1",
  A2: "175",
  B2: "=A2*6",
  C2: "=SUM(A2,B2)",
  A3: "Hours",
  B3: "Rate",
  C3: "=A3&\" @ \"&B3",
  D4: "=AVERAGE(A1,B1,C1)",
  E5: "=MAX(A1,C1,B2)",
};

const COLUMNS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS = Array.from({ length: 10 }, (_, index) => index + 1);

const FUNCTION_HANDLERS = {
  SUM: (args) => args.reduce((total, value) => total + value, 0),
  AVERAGE: (args) =>
    args.length === 0 ? 0 : args.reduce((total, value) => total + value, 0) / args.length,
  MAX: (args) => (args.length === 0 ? 0 : Math.max(...args)),
  MIN: (args) => (args.length === 0 ? 0 : Math.min(...args)),
};

const isCellReference = (token) => /^[A-H](?:10|[1-9])$/i.test(token);

const getReferenceValue = (ref, cells, visited, evaluateCell) => {
  if (visited.has(ref)) return Number.NaN;
  visited.add(ref);
  const raw = cells[ref];
  if (typeof raw !== "string") return Number.NaN;
  const evaluated = evaluateCell(ref, visited);
  visited.delete(ref);
  const numeric = Number.parseFloat(evaluated);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
};

const parseArguments = (argString, cells, visited, evaluateCell) =>
  argString
    .split(",")
    .map((part) => part.trim())
    .map((token) => {
      if (isCellReference(token)) {
        return getReferenceValue(token.toUpperCase(), cells, visited, evaluateCell);
      }
      const numeric = Number.parseFloat(token);
      return Number.isFinite(numeric) ? numeric : Number.NaN;
    })
    .filter((value) => Number.isFinite(value));

const evaluateFunction = (name, args) => {
  const handler = FUNCTION_HANDLERS[name];
  if (!handler) return Number.NaN;
  try {
    return handler(args);
  } catch {
    return Number.NaN;
  }
};

const evaluateFormula = (formula, cells, visited, evaluateCell) => {
  const trimmed = formula.slice(1).trim();
  if (!trimmed) return "";

  // Handle a subset of Excel-style functions for quick prototyping.
  const functionMatch = trimmed.match(/^([A-Z]+)\((.*)\)$/i);
  if (functionMatch) {
    const [, fnName, argString] = functionMatch;
    const args = parseArguments(argString, cells, visited, evaluateCell);
    const result = evaluateFunction(fnName.toUpperCase(), args);
    return Number.isFinite(result) ? result : "#ERR";
  }

  // Handle concatenation using '&' similar to Excel.
  const concatParts = trimmed.split("&").map((part) => part.trim());
  if (concatParts.length > 1) {
    return concatParts
      .map((token) => {
        if (isCellReference(token)) {
          const ref = token.toUpperCase();
          return String(evaluateCell(ref, visited));
        }
        return token.replace(/^\"|\"$/g, "");
      })
      .join("");
  }

  const safeExpression = trimmed.replace(/([A-H](?:10|[1-9]))/gi, (match) => {
    const ref = match.toUpperCase();
    const value = getReferenceValue(ref, cells, visited, evaluateCell);
    return Number.isFinite(value) ? value : 0;
  });

  if (!/^[-+/*().,\d\s]+$/.test(safeExpression)) {
    return "#ERR";
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${safeExpression});`)();
    return Number.isFinite(result) ? result : "#ERR";
  } catch {
    return "#ERR";
  }
};

export default function SpreadsheetLab() {
  const [cells, setCells] = useState(DEFAULT_CELLS);

  const cellKeys = useMemo(
    () =>
      ROWS.map((row) =>
        COLUMNS.map((column) => ({
          column,
          row,
          key: `${column}${row}`,
        }))
      ),
    []
  );

  const evaluateCell = useCallback(
    (cellKey, visited = new Set()) => {
      const value = cells[cellKey];
      if (typeof value !== "string") return "";
      if (!value.startsWith("=")) return value;
      return evaluateFormula(value, cells, visited, evaluateCell);
    },
    [cells]
  );

  const handleCellChange = (cellKey, value) => {
    setCells((prev) => ({ ...prev, [cellKey]: value }));
  };

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.75)] backdrop-blur-xl transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-black/30">
        <p className="text-sm font-semibold uppercase tracking-widest text-purple-500">Spreadsheet</p>
        <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
              Spreadsheet Lab (Excel-inspired)
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
              Explore a focused spreadsheet workspace with familiar grid editing, lightweight formulas, and quick summaries. This
              lab captures the feel of Excel 365 for planning and note-taking while keeping the experience fast inside Offyse.
            </p>
          </div>
          <div className="rounded-2xl bg-purple-50 px-4 py-3 text-xs font-medium text-purple-800 ring-1 ring-purple-200 dark:bg-purple-500/10 dark:text-purple-100 dark:ring-purple-400/30">
            Prototype scope: core grid + common functions (SUM, AVERAGE, MAX, MIN, concatenation).
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Familiar grid editing</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Click any cell to type numbers, words, or formulas that start with <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">=</code>. Values update instantly and support the same copy + edit gestures you expect.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Lightweight formulas</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Reference cells like <strong>A1</strong> or <strong>C3</strong> inside formulas and combine them with functions such as <strong>SUM</strong> and <strong>AVERAGE</strong>. String concatenation with <strong>&amp;</strong> lets you stitch together quick notes.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Status at a glance</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Sample formulas prefill the grid so you can immediately see totals, averages, and max values. Adjust them to mirror your own working model.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100">
          Mini workbook
        </div>
        <div className="overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                   
                </th>
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="bg-slate-100 px-3 py-2 text-left font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cellKeys.map((rowCells, rowIndex) => (
                <tr key={ROWS[rowIndex]} className="even:bg-slate-50/60 dark:even:bg-slate-800/40">
                  <td className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    {ROWS[rowIndex]}
                  </td>
                  {rowCells.map(({ key }) => (
                    <td key={key} className="border border-slate-200 dark:border-slate-800">
                      <input
                        className="h-10 w-full px-2 text-sm text-slate-900 outline-none transition-colors duration-200 focus:bg-purple-50 focus:ring-2 focus:ring-purple-200 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-800"
                        value={cells[key] ?? ""}
                        onChange={(event) => handleCellChange(key, event.target.value)}
                      />
                      <div className="border-t border-slate-200 px-2 py-1 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        {String(evaluateCell(key))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
