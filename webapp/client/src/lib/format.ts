import type { Book } from "../types";

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function ratingColor(rating: number): string {
  if (rating >= 4.3) return "text-forest-600";
  if (rating >= 4.0) return "text-forest-500";
  if (rating >= 3.6) return "text-gold-500";
  return "text-orange-500";
}

/** Real cover image from Open Library, keyed by ISBN. Returns null when unavailable. */
export function coverUrl(book: Pick<Book, "isbn" | "isbn13">, size: "M" | "L" = "M"): string | null {
  const isbn = book.isbn13 || book.isbn;
  if (!isbn) return null;
  return `https://covers.openlibrary.org/b/isbn/${isbn}-${size}.jpg?default=false`;
}

/** Deterministic warm gradient from a string, used as a cover fallback. */
export function coverGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  // Bias hues toward the green/gold brand range for a cohesive shelf.
  const h1 = 90 + (hash % 80); // greens
  const h2 = 35 + (hash % 20); // golds
  return `linear-gradient(140deg, hsl(${h1} 32% 30%), hsl(${h2} 45% 40%))`;
}

export function initials(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
