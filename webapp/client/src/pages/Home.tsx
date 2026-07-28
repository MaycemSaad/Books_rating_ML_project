import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Book } from "../types";
import { BookCard } from "../components/BookCard";
import { Icon, type IconName } from "../components/Icon";
import { useAuth } from "../context/AuthContext";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1920&q=80";

const DOMAINS: {
  icon: IconName;
  title: string;
  desc: string;
  tag: string;
  to: string;
  tone: "forest" | "gold";
}[] = [
  {
    icon: "layers",
    title: "Book Catalog",
    desc: "Browse 11,000+ titles with full-text search and advanced filters.",
    tag: "Explore",
    to: "/catalog",
    tone: "forest",
  },
  {
    icon: "gauge",
    title: "Rating Predictor",
    desc: "Estimate any book's rating from its details in seconds.",
    tag: "Smart insight",
    to: "/predict",
    tone: "gold",
  },
  {
    icon: "sparkles",
    title: "Recommendations",
    desc: "Personalized picks that learn from your searches and reading.",
    tag: "For you",
    to: "/recommendations",
    tone: "forest",
  },
  {
    icon: "user",
    title: "Your Library",
    desc: "Favorites, search history and past predictions in one place.",
    tag: "Account",
    to: "/profile",
    tone: "gold",
  },
];

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Book[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.recommendations(8).then((r) => setFeatured(r.items)).catch(() => setFeatured([]));
  }, [user]);

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-forest-800 shadow-card">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-forest-900/95 via-forest-800/85 to-forest-700/70" />
        <div className="relative px-6 py-20 sm:px-14 sm:py-24">
          <div className="max-w-2xl animate-fade-up">
            <h1 className="font-display text-4xl font-bold leading-[1.1] text-white sm:text-6xl">
              Discover your next read and{" "}
              <span className="italic text-gold-300">predict its rating</span> before the crowd.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-parchment-100/90">
              Explore a curated catalog of 11,000+ books, search with advanced filters, and get
              recommendations tailored to your reading — plus a smart estimate of any book's rating
              before you commit.
            </p>
            <form
              className="mt-8 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/catalog?q=${encodeURIComponent(query)}`);
              }}
            >
              <input
                className="input border-transparent bg-white/95 sm:flex-1"
                placeholder="Search a title, author or publisher…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn-gold whitespace-nowrap">
                Explore catalog →
              </button>
            </form>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                to="/predict"
                className="btn border border-white/25 text-white hover:bg-white/10"
              >
                Try the rating predictor
              </Link>
              <Link
                to="/recommendations"
                className="btn border border-white/25 text-white hover:bg-white/10"
              >
                Personalized picks
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { k: "11,127", v: "Books in catalog" },
          { k: "440K+", v: "Books analyzed" },
          { k: "0–5", v: "Rating scale" },
          { k: "Instant", v: "Rating estimates" },
        ].map((s) => (
          <div key={s.v} className="card p-6 text-center">
            <div className="font-display text-4xl font-bold text-forest-700">{s.k}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-wide text-stone-500">{s.v}</div>
          </div>
        ))}
      </section>

      {/* Domains */}
      <section>
        <div className="mb-10 text-center">
          <span className="eyebrow">Our domains</span>
          <h2 className="section-title mt-4 text-4xl">
            Explore everything <span className="italic text-gold-500">BookWise</span> offers
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-stone-500">
            A complete reading companion — from discovery to your next favorite.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DOMAINS.map((d) => (
            <Link
              key={d.title}
              to={d.to}
              className="card group flex flex-col p-6 transition duration-300 hover:-translate-y-1.5 hover:border-forest-300 hover:shadow-card"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-2xl shadow-sm ${
                  d.tone === "gold" ? "bg-gold-100 text-gold-600" : "bg-forest-50 text-forest-600"
                }`}
              >
                <Icon name={d.icon} size={26} />
              </span>
              <span
                className={`mt-5 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  d.tone === "gold"
                    ? "bg-gold-100 text-gold-600"
                    : "bg-forest-50 text-forest-600"
                }`}
              >
                {d.tag}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-forest-800">{d.title}</h3>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-stone-500">{d.desc}</p>
              <span className="mt-4 text-sm font-semibold text-forest-600 transition group-hover:text-gold-500">
                Open →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="eyebrow">Handpicked</span>
            <h2 className="section-title mt-3">
              {user ? "Recommended for you" : "Highly rated favorites"}
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              {user ? "Based on what you search and open" : "Log in to unlock personalized recommendations"}
            </p>
          </div>
          <Link
            to="/recommendations"
            className="text-sm font-semibold text-forest-600 hover:text-gold-500"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>
    </div>
  );
}
