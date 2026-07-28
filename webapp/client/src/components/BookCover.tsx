import { useState } from "react";
import type { Book } from "../types";
import { coverGradient, coverUrl, initials } from "../lib/format";

interface Props {
  book: Pick<Book, "title" | "isbn" | "isbn13">;
  size?: "M" | "L";
  className?: string;
  /** Font size (px) of the fallback initials. */
  initialsSize?: number;
}

/**
 * Renders a real Open Library cover when one exists for the book's ISBN,
 * gracefully falling back to a branded gradient with the title initials.
 */
export function BookCover({ book, size = "M", className = "", initialsSize = 40 }: Props) {
  const url = coverUrl(book, size);
  const [failed, setFailed] = useState(false);
  const showImage = url && !failed;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={showImage ? undefined : { background: coverGradient(book.title) }}
    >
      {showImage ? (
        <img
          src={url}
          alt={`Cover of ${book.title}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <span
            className="font-display font-bold text-white/90"
            style={{ fontSize: initialsSize }}
          >
            {initials(book.title)}
          </span>
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
        </>
      )}
    </div>
  );
}
