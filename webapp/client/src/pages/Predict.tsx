import { useCallback, useEffect, useRef, useState } from "react";
import { api, type PredictInput, type BatchPredictionRow } from "../api/client";
import { formatCount, ratingColor } from "../lib/format";
import { StarRating } from "../components/StarRating";
import { Icon } from "../components/Icon";

const SAMPLE: PredictInput = {
  title: "The Name of the Wind (The Kingkiller Chronicle #1)",
  authors: "Patrick Rothfuss",
  language_code: "eng",
  num_pages: 662,
  ratings_count: 500000,
  text_reviews_count: 30000,
  publication_date: "3/27/2007",
  publisher: "DAW Books",
};

/* ---- small helpers ------------------------------------------------------- */

function yearFromDate(date: string): number {
  const m = date.match(/(\d{4})/);
  return m ? Number(m[1]) : 2010;
}

/** Animated number that eases toward `target` (used for the big rating). */
function useCountUp(target: number | null, duration = 550): number {
  const [display, setDisplay] = useState(target ?? 0);
  const fromRef = useRef(target ?? 0);
  useEffect(() => {
    if (target === null) return;
    const start = fromRef.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + (target - start) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return display;
}

/** Minimal CSV parser that respects quoted fields (commas inside titles). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows
    .slice(1)
    .filter((r) => r.some((v) => v.trim() !== ""))
    .map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = (r[i] ?? "").trim()));
      return obj;
    });
}

function rowToInput(row: Record<string, string>): PredictInput {
  const num = (v: string, d: number) => (v !== "" && Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    title: row.title || "Untitled",
    authors: row.authors || "Unknown",
    language_code: row.language_code || "eng",
    num_pages: num(row.num_pages, 0),
    ratings_count: num(row.ratings_count, 0),
    text_reviews_count: num(row.text_reviews_count, 0),
    publication_date: row.publication_date || "1/1/2015",
    publisher: row.publisher || "",
  };
}

const CSV_COLUMNS = [
  "title", "authors", "language_code", "num_pages", "ratings_count",
  "text_reviews_count", "publication_date", "publisher", "predicted_rating",
];

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [columns.join(","), ...rows.map((r) => columns.map((c) => esc(r[c])).join(","))].join("\n");
}

function download(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATE_CSV =
  "title,authors,language_code,num_pages,ratings_count,text_reviews_count,publication_date,publisher\n" +
  "The Hobbit,J.R.R. Tolkien,eng,366,3000000,50000,9/15/1937,Houghton Mifflin\n" +
  "1984,George Orwell,eng,328,3000000,60000,6/8/1949,Signet Classics\n";

/* ---- page ---------------------------------------------------------------- */

export function Predict() {
  const [form, setForm] = useState<PredictInput>(SAMPLE);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<number>();

  const animated = useCountUp(result);

  const runPredict = useCallback((f: PredictInput) => {
    if (!f.title.trim() || !f.authors.trim()) return;
    setLoading(true);
    setError(null);
    api
      .predict(f)
      .then((res) => setResult(res.predictedRating))
      .catch((err) => setError(err instanceof Error ? err.message : "Prediction failed"))
      .finally(() => setLoading(false));
  }, []);

  // Live prediction: re-run (debounced) whenever any input changes.
  useEffect(() => {
    window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => runPredict(form), 350);
    return () => window.clearTimeout(debounce.current);
  }, [form, runPredict]);

  function set<K extends keyof PredictInput>(key: K, value: PredictInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="text-center">
        <span className="eyebrow">Rating estimator</span>
        <h1 className="section-title mt-4 text-4xl">Rating Predictor</h1>
        <p className="mx-auto mt-2 max-w-xl text-stone-500">
          Enter a book's details — the estimate updates <strong>live</strong> as you type or drag the sliders.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* form */}
        <form onSubmit={(e) => { e.preventDefault(); runPredict(form); }} className="card space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-forest-800">Book attributes</h2>
            <button
              type="button"
              className="rounded-full border border-parchment-300 px-3 py-1 text-xs font-semibold text-forest-600 hover:bg-parchment-100"
              onClick={() => setForm(SAMPLE)}
            >
              Fill sample
            </button>
          </div>

          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Author(s)</label>
              <input className="input" value={form.authors} onChange={(e) => set("authors", e.target.value)} required />
            </div>
            <div>
              <label className="label">Publisher</label>
              <input className="input" value={form.publisher} onChange={(e) => set("publisher", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Language</label>
              <select className="input" value={form.language_code} onChange={(e) => set("language_code", e.target.value)}>
                {["eng", "en-US", "en-GB", "spa", "fre", "ger", "jpn", "ita", "por"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Publication date</label>
              <input
                className="input"
                placeholder="M/D/YYYY"
                value={form.publication_date}
                onChange={(e) => set("publication_date", e.target.value)}
              />
            </div>
          </div>

          {/* What-if sliders */}
          <div className="rounded-xl border border-parchment-200 bg-parchment-50 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-forest-700">
              <Icon name="gauge" size={16} /> What-if sliders
            </div>
            <div className="space-y-3">
              <Slider
                label="Pages" value={form.num_pages} min={0} max={1200} step={10}
                display={`${form.num_pages}`} onChange={(v) => set("num_pages", v)}
              />
              <Slider
                label="Ratings count" value={form.ratings_count} min={0} max={1_500_000} step={5000}
                display={formatCount(form.ratings_count)} onChange={(v) => set("ratings_count", v)}
              />
              <Slider
                label="Text reviews" value={form.text_reviews_count} min={0} max={60_000} step={500}
                display={formatCount(form.text_reviews_count)} onChange={(v) => set("text_reviews_count", v)}
              />
              <Slider
                label="Publication year" value={yearFromDate(form.publication_date)} min={1950} max={2024} step={1}
                display={`${yearFromDate(form.publication_date)}`}
                onChange={(v) => set("publication_date", `1/1/${v}`)}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </form>

        {/* result gauge */}
        <div className="card flex flex-col items-center justify-center gap-4 p-8 text-center lg:sticky lg:top-24 lg:self-start">
          {result === null ? (
            <div className="flex flex-col items-center text-stone-400">
              <span className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-parchment-100 text-forest-400">
                <Icon name="gauge" size={30} />
              </span>
              <p className="text-sm">Add a title & author to see a live prediction.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                Predicted rating {loading && <span className="h-2 w-2 animate-ping rounded-full bg-forest-400" />}
              </div>
              <div className={`font-display text-6xl font-bold tabular-nums ${ratingColor(animated)}`}>
                {animated.toFixed(2)}
              </div>
              <StarRating value={animated} size={26} />
              <div className="mx-auto mt-2 h-2.5 w-48 overflow-hidden rounded-full bg-parchment-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 via-gold-400 to-forest-500 transition-all duration-300"
                  style={{ width: `${(animated / 5) * 100}%` }}
                />
              </div>
              <p className="pt-1 text-xs text-stone-400">Updates live as you edit the inputs.</p>
            </div>
          )}
        </div>
      </div>

      <BatchPredict />
    </div>
  );
}

function Slider(props: {
  label: string; value: number; min: number; max: number; step: number;
  display: string; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-600">{props.label}</span>
        <span className="font-semibold tabular-nums text-forest-700">{props.display}</span>
      </div>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-forest-500"
      />
    </div>
  );
}

/* ---- CSV batch prediction ------------------------------------------------ */

function BatchPredict() {
  const [rows, setRows] = useState<BatchPredictionRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setBusy(true);
    setStatus(null);
    setRows([]);
    try {
      const text = await file.text();
      const parsed = parseCsv(text).map(rowToInput);
      if (!parsed.length) throw new Error("No rows found in the file.");
      if (parsed.length > 2000) throw new Error(`Too many rows (${parsed.length}). Max is 2000.`);
      const res = await api.predictBatch(parsed);
      setRows(res.predictions);
      setStatus(`Scored ${res.count} book${res.count > 1 ? "s" : ""} with ${res.model_name ?? "the model"}.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Batch prediction failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-forest-800">Batch prediction (CSV)</h2>
          <p className="text-sm text-stone-500">Upload a CSV of books and score them all at once.</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-parchment-300 px-3 py-1 text-xs font-semibold text-forest-600 hover:bg-parchment-100"
          onClick={() => download("book_template.csv", TEMPLATE_CSV)}
        >
          Download template
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? "border-forest-400 bg-forest-50" : "border-parchment-300 bg-parchment-50 hover:border-forest-300"
        }`}
      >
        <span className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-white text-forest-500 shadow-sm">
          <Icon name="gauge" size={22} />
        </span>
        <p className="text-sm font-semibold text-forest-700">
          {busy ? "Scoring…" : "Drop a CSV here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          Columns: title, authors, language_code, num_pages, ratings_count, text_reviews_count, publication_date, publisher
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {status && <p className="text-sm text-stone-600">{status}</p>}

      {rows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-forest-700">{rows.length} results</span>
            <button
              type="button"
              className="btn-primary px-4 py-1.5 text-sm"
              onClick={() => download("predictions.csv", toCsv(rows as unknown as Record<string, unknown>[], CSV_COLUMNS))}
            >
              Download results (CSV)
            </button>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-parchment-200">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-parchment-100 text-xs uppercase text-stone-500">
                <tr>
                  <th className="px-3 py-2">Title</th>
                  <th className="px-3 py-2">Author</th>
                  <th className="px-3 py-2 text-right">Rating</th>
                  <th className="px-3 py-2">Stars</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((r, i) => (
                  <tr key={i} className="border-t border-parchment-200">
                    <td className="max-w-xs truncate px-3 py-2 text-stone-700">{r.title}</td>
                    <td className="max-w-[10rem] truncate px-3 py-2 text-stone-500">{r.authors}</td>
                    <td className={`px-3 py-2 text-right font-bold tabular-nums ${ratingColor(r.predicted_rating)}`}>
                      {r.predicted_rating.toFixed(2)}
                    </td>
                    <td className="px-3 py-2"><StarRating value={r.predicted_rating} size={15} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 200 && (
            <p className="text-xs text-stone-400">Showing the first 200 rows — download the CSV for all {rows.length}.</p>
          )}
        </div>
      )}
    </div>
  );
}
