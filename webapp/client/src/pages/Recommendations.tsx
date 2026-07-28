import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { RecommendationResponse } from "../types";
import { BookCard } from "../components/BookCard";
import { useAuth } from "../context/AuthContext";

export function Recommendations() {
  const { user } = useAuth();
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .recommendations(24)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <span className="eyebrow">Personalized</span>
        <h1 className="section-title mt-3">For You</h1>
        <p className="mt-1 text-stone-500">{data?.reason ?? "Loading recommendations…"}</p>
      </div>

      {data?.personalized && data.basedOn && (
        <div className="card space-y-3 p-5">
          <h2 className="font-display text-base font-bold text-forest-800">Your reading profile</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <ProfileGroup title="Favorite authors" items={data.basedOn.authors} />
            <ProfileGroup title="Interests" items={data.basedOn.keywords} />
            <ProfileGroup title="Languages" items={data.basedOn.languages} />
          </div>
        </div>
      )}

      {!user && (
        <div className="card flex items-center justify-between gap-4 border-forest-200 bg-forest-50/50 p-5">
          <p className="text-sm text-stone-600">
            Log in to get recommendations tailored to your searches and reading history.
          </p>
          <Link to="/login" className="btn-primary whitespace-nowrap">
            Log in
          </Link>
        </div>
      )}

      {loading ? (
        <div className="grid min-h-[30vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-parchment-200 border-t-forest-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data?.items.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileGroup({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span key={i} className="chip">
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
