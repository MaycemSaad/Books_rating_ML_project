import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Book } from "../types";
import { BookCard } from "../components/BookCard";
import { BookCover } from "../components/BookCover";
import { StarRating } from "../components/StarRating";
import { Icon } from "../components/Icon";
import { formatCount, ratingColor } from "../lib/format";
import { useAuth } from "../context/AuthContext";

export function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [similar, setSimilar] = useState<Book[]>([]);
  const [predicted, setPredicted] = useState<number | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [favorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!id) return;
    setBook(null);
    setPredicted(null);
    api.book(id).then((r) => {
      setBook(r.book);
      setSimilar(r.similar);
    });
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api.favorites().then((r) => setFavorited(r.items.some((b) => b.id === id))).catch(() => undefined);
  }, [id, user]);

  async function toggleFavorite() {
    if (!book) return;
    const res = await api.toggleFavorite(book.id);
    setFavorited(res.favorited);
  }

  async function runPrediction() {
    if (!book) return;
    setPredicting(true);
    try {
      const res = await api.predict({
        title: book.title,
        authors: book.authors,
        language_code: book.languageCode,
        num_pages: book.numPages,
        ratings_count: book.ratingsCount,
        text_reviews_count: book.textReviewsCount,
        publication_date: book.publicationDate,
        publisher: book.publisher,
      });
      setPredicted(res.predictedRating);
    } finally {
      setPredicting(false);
    }
  }

  if (!book) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-parchment-200 border-t-forest-600" />
      </div>
    );
  }

  const delta = predicted !== null ? predicted - book.averageRating : null;

  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <BookCover
          book={book}
          size="L"
          className="h-96 rounded-2xl border border-parchment-200 shadow-card"
          initialsSize={64}
        />

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="chip">{book.languageCode}</span>
            {book.publicationYear && <span className="chip">{book.publicationYear}</span>}
            <span className="chip">{book.numPages} pages</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <h1 className="font-display text-4xl font-bold leading-tight text-forest-800">{book.title}</h1>
            {user && (
              <button
                onClick={toggleFavorite}
                className={`btn shrink-0 border ${
                  favorited
                    ? "border-rose-300 bg-rose-50 text-rose-600"
                    : "border-parchment-300 text-forest-700 hover:bg-parchment-100"
                }`}
              >
                <Icon name={favorited ? "heart-filled" : "heart"} size={16} />
                {favorited ? "Saved" : "Save"}
              </button>
            )}
          </div>
          <p className="text-lg text-stone-600">by {book.authors.replace(/\//g, ", ")}</p>
          <p className="text-sm text-stone-500">
            Published by {book.publisher || "Unknown"} · {book.publicationDate}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <StarRating value={book.averageRating} size={22} />
              <span className={`text-2xl font-bold ${ratingColor(book.averageRating)}`}>
                {book.averageRating.toFixed(2)}
              </span>
            </div>
            <div className="text-sm text-stone-500">
              <span className="font-semibold text-forest-700">{formatCount(book.ratingsCount)}</span> ratings ·{" "}
              <span className="font-semibold text-forest-700">{formatCount(book.textReviewsCount)}</span> reviews
            </div>
          </div>

          {/* Prediction card */}
          <div className="card mt-4 space-y-3 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-forest-800">Rating estimate</h3>
                <p className="text-xs text-stone-500">
                  See our estimated rating for this book.
                </p>
              </div>
              <button className="btn-primary" onClick={runPrediction} disabled={predicting}>
                {predicting ? "Predicting…" : "Predict rating"}
              </button>
            </div>
            {predicted !== null && (
              <div className="flex animate-fade-up items-center gap-4 rounded-xl bg-parchment-100 p-4">
                <div className={`font-display text-4xl font-bold ${ratingColor(predicted)}`}>
                  {predicted.toFixed(2)}
                </div>
                <div className="text-sm text-stone-500">
                  Predicted rating
                  {delta !== null && (
                    <div className={delta >= 0 ? "font-semibold text-forest-600" : "font-semibold text-orange-500"}>
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(2)} vs actual
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {!user && (
            <p className="text-xs text-stone-400">Log in to save favorites and get personalized recommendations.</p>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section>
          <span className="eyebrow">Discover more</span>
          <h2 className="section-title mb-4 mt-3 text-2xl">Readers also enjoyed</h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
            {similar.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
