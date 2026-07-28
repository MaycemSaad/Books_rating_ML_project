import { useState } from "react";
import { api, type PredictInput } from "../api/client";
import { ratingColor } from "../lib/format";
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

const EMPTY: PredictInput = {
  title: "",
  authors: "",
  language_code: "eng",
  num_pages: 300,
  ratings_count: 1000,
  text_reviews_count: 100,
  publication_date: "1/1/2015",
  publisher: "",
};

export function Predict() {
  const [form, setForm] = useState<PredictInput>(EMPTY);
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PredictInput>(key: K, value: PredictInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.predict(form);
      setResult(res.predictedRating);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <span className="eyebrow">Rating estimator</span>
        <h1 className="section-title mt-4 text-4xl">Rating Predictor</h1>
        <p className="mx-auto mt-2 max-w-xl text-stone-500">
          Enter a book's details and get an estimated rating on a 0–5 scale.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <form onSubmit={submit} className="card space-y-4 p-6">
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Language</label>
              <select className="input" value={form.language_code} onChange={(e) => set("language_code", e.target.value)}>
                {["eng", "en-US", "en-GB", "spa", "fre", "ger", "jpn", "ita", "por"].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Pages</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.num_pages}
                onChange={(e) => set("num_pages", Number(e.target.value))}
              />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Ratings count</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.ratings_count}
                onChange={(e) => set("ratings_count", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Text reviews count</label>
              <input
                type="number"
                min={0}
                className="input"
                value={form.text_reviews_count}
                onChange={(e) => set("text_reviews_count", Number(e.target.value))}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Predicting…" : "Predict rating"}
          </button>
        </form>

        {/* Result gauge */}
        <div className="card flex flex-col items-center justify-center gap-4 p-8 text-center">
          {result === null ? (
            <div className="flex flex-col items-center text-stone-400">
              <span className="mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-parchment-100 text-forest-400">
                <Icon name="gauge" size={30} />
              </span>
              <p className="text-sm">Your prediction will appear here.</p>
            </div>
          ) : (
            <div className="animate-fade-up space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Predicted rating</div>
              <div className={`font-display text-6xl font-bold ${ratingColor(result)}`}>{result.toFixed(2)}</div>
              <StarRating value={result} size={26} />
              <RatingBar value={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2.5 w-48 overflow-hidden rounded-full bg-parchment-200">
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-400 via-gold-400 to-forest-500 transition-all"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
  );
}
