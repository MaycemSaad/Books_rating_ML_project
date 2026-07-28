import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import type { Book, Facets } from "../types";
import { BookCard } from "../components/BookCard";

interface Filters {
  q: string;
  language: string;
  minRating: string;
  minPages: string;
  maxPages: string;
  minYear: string;
  maxYear: string;
  sort: string;
  order: string;
}

const EMPTY: Filters = {
  q: "",
  language: "",
  minRating: "",
  minPages: "",
  maxPages: "",
  minYear: "",
  maxYear: "",
  sort: "relevance",
  order: "desc",
};

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<Filters>({ ...EMPTY, q: searchParams.get("q") ?? "" });
  const [facets, setFacets] = useState<Facets | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.facets().then(setFacets).catch(() => undefined);
  }, []);

  // Reset to first page whenever a filter changes.
  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);
  useEffect(() => {
    setPage(1);
  }, [filterKey]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      api
        .searchBooks({
          q: filters.q,
          language: filters.language,
          minRating: filters.minRating,
          minPages: filters.minPages,
          maxPages: filters.maxPages,
          minYear: filters.minYear,
          maxYear: filters.maxYear,
          sort: filters.sort,
          order: filters.order,
          page,
          pageSize: 24,
        })
        .then((res) => {
          setBooks(res.items);
          setTotal(res.total);
          setTotalPages(res.totalPages);
        })
        .catch(() => setBooks([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [filterKey, page]);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    if (key === "q") setSearchParams(value ? { q: value } : {});
  }

  const activeCount = Object.entries(filters).filter(
    ([k, v]) => v && k !== "sort" && k !== "order" && k !== "q",
  ).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Filter sidebar */}
      <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-forest-800">Filters</h2>
          {activeCount > 0 && (
            <button
              className="text-xs font-semibold text-forest-600 hover:text-gold-500"
              onClick={() => setFilters({ ...EMPTY, q: filters.q, sort: filters.sort, order: filters.order })}
            >
              Clear ({activeCount})
            </button>
          )}
        </div>

        <div>
          <label className="label">Language</label>
          <select className="input" value={filters.language} onChange={(e) => update("language", e.target.value)}>
            <option value="">All languages</option>
            {facets?.languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code} ({l.count})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Minimum rating: {filters.minRating || "any"}</label>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={filters.minRating || 0}
            onChange={(e) => update("minRating", e.target.value === "0" ? "" : e.target.value)}
            className="w-full accent-forest-600"
          />
        </div>

        <div>
          <label className="label">Pages</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="min"
              inputMode="numeric"
              value={filters.minPages}
              onChange={(e) => update("minPages", e.target.value)}
            />
            <input
              className="input"
              placeholder="max"
              inputMode="numeric"
              value={filters.maxPages}
              onChange={(e) => update("maxPages", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Publication year</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="from"
              inputMode="numeric"
              value={filters.minYear}
              onChange={(e) => update("minYear", e.target.value)}
            />
            <input
              className="input"
              placeholder="to"
              inputMode="numeric"
              value={filters.maxYear}
              onChange={(e) => update("maxYear", e.target.value)}
            />
          </div>
        </div>
      </aside>

      {/* Results */}
      <section className="space-y-4">
        <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input
            className="input sm:flex-1"
            placeholder="Search titles, authors, publishers…"
            value={filters.q}
            onChange={(e) => update("q", e.target.value)}
          />
          <div className="flex gap-2">
            <select className="input" value={filters.sort} onChange={(e) => update("sort", e.target.value)}>
              <option value="relevance">Most popular</option>
              <option value="rating">Top rated</option>
              <option value="reviews">Most reviewed</option>
              <option value="year">Newest</option>
              <option value="pages">Longest</option>
              <option value="title">Title A–Z</option>
            </select>
            <select className="input" value={filters.order} onChange={(e) => update("order", e.target.value)}>
              <option value="desc">↓</option>
              <option value="asc">↑</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>
            {loading ? "Searching…" : `${total.toLocaleString()} books found`}
          </span>
          <span>
            Page {page} / {totalPages}
          </span>
        </div>

        {books.length === 0 && !loading ? (
          <div className="card grid place-items-center p-16 text-center text-stone-500">
            No books match these filters. Try widening your search.
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 ${loading ? "opacity-50" : ""}`}>
            {books.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span className="px-3 text-sm text-stone-500">
              {page} / {totalPages}
            </span>
            <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
