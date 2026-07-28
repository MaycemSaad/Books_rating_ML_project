import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, optionalAuth, type AuthedRequest } from "../auth/middleware.js";

export const recommendationsRouter = Router();

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "book", "novel", "series", "a", "an", "of", "to", "in",
  "on", "vol", "volume", "edition", "part",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/**
 * Content-based recommendations built from the signals we record per user:
 * previous searches (query keywords + language filters) and viewed books
 * (authors, publishers, languages). Each catalog book is scored by how well
 * it overlaps the profile, blended with a light popularity/quality prior.
 */
recommendationsRouter.get("/", optionalAuth, async (req: AuthedRequest, res) => {
  const limit = Math.min(Number(req.query.limit ?? 12), 30);

  if (!req.user) {
    // Anonymous visitors get well-loved, highly-rated books.
    const trending = await topRated(limit);
    return res.json({ personalized: false, reason: "Popular highly-rated books", items: trending });
  }

  const userId = req.user.sub;
  const [searches, views] = await Promise.all([
    prisma.searchEvent.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.bookView.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { book: true },
    }),
  ]);

  if (searches.length === 0 && views.length === 0) {
    const trending = await topRated(limit);
    return res.json({
      personalized: false,
      reason: "Start searching or open a few books to unlock personalized picks",
      items: trending,
    });
  }

  // Build weighted preference maps from the recorded activity.
  const keyword = new Map<string, number>();
  const authorWeight = new Map<string, number>();
  const publisherWeight = new Map<string, number>();
  const languageWeight = new Map<string, number>();

  const bump = (map: Map<string, number>, key: string, w: number) => {
    if (!key) return;
    map.set(key, (map.get(key) ?? 0) + w);
  };

  searches.forEach((s, idx) => {
    const recency = 1 - idx / (searches.length + 1);
    tokenize(s.query).forEach((tok) => bump(keyword, tok, 1.5 * recency));
    try {
      const f = JSON.parse(s.filters) as { language?: string };
      if (f.language) bump(languageWeight, f.language, 1 * recency);
    } catch {
      /* ignore malformed filters */
    }
  });

  const viewedIds = new Set<string>();
  views.forEach((v, idx) => {
    const recency = 1 - idx / (views.length + 1);
    viewedIds.add(v.bookId);
    bump(authorWeight, v.book.firstAuthor, 3 * recency);
    bump(publisherWeight, v.book.publisher, 1.2 * recency);
    bump(languageWeight, v.book.languageCode, 0.8 * recency);
    tokenize(v.book.title).forEach((tok) => bump(keyword, tok, 1 * recency));
  });

  // Pull a candidate pool biased toward the user's preferred authors/languages
  // plus generally popular books, then score in memory.
  const preferredAuthors = topKeys(authorWeight, 12);
  const preferredLanguages = topKeys(languageWeight, 4);

  const candidates = await prisma.book.findMany({
    where: {
      OR: [
        { firstAuthor: { in: preferredAuthors.length ? preferredAuthors : ["__none__"] } },
        { languageCode: { in: preferredLanguages.length ? preferredLanguages : ["eng"] } },
        { ratingsCount: { gte: 50000 } },
      ],
    },
    take: 1500,
  });

  const scored = candidates
    .filter((b) => !viewedIds.has(b.id))
    .map((b) => {
      let score = 0;
      score += (authorWeight.get(b.firstAuthor) ?? 0) * 4;
      score += (publisherWeight.get(b.publisher) ?? 0) * 1.5;
      score += (languageWeight.get(b.languageCode) ?? 0) * 1;
      for (const tok of tokenize(b.title)) score += (keyword.get(tok) ?? 0) * 0.8;
      // Quality/popularity prior keeps recommendations trustworthy.
      score += Math.log10(b.ratingsCount + 10) * 0.25;
      score += (b.averageRating - 3.5) * 0.4;
      return { book: b, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) {
    const trending = await topRated(limit);
    return res.json({ personalized: false, reason: "Popular highly-rated books", items: trending });
  }

  return res.json({
    personalized: true,
    reason: "Based on your recent searches and the books you opened",
    basedOn: {
      authors: preferredAuthors.slice(0, 5),
      keywords: topKeys(keyword, 6),
      languages: preferredLanguages,
    },
    items: scored.map((s) => ({ ...s.book, score: Math.round(s.score * 100) / 100 })),
  });
});

recommendationsRouter.get("/history", requireAuth, async (req: AuthedRequest, res) => {
  const [searches, views] = await Promise.all([
    prisma.searchEvent.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.bookView.findMany({
      where: { userId: req.user!.sub },
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { book: true },
    }),
  ]);
  // Keep only the most recent view per book so each title appears once.
  const seenBooks = new Set<string>();
  const uniqueViews = views.filter((v) => {
    if (seenBooks.has(v.bookId)) return false;
    seenBooks.add(v.bookId);
    return true;
  });
  return res.json({
    searches: searches.map((s) => ({ id: s.id, query: s.query, filters: JSON.parse(s.filters), at: s.createdAt })),
    views: uniqueViews.map((v) => ({ id: v.id, book: v.book, at: v.createdAt })),
  });
});

function topKeys(map: Map<string, number>, n: number): string[] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
}

async function topRated(limit: number) {
  return prisma.book.findMany({
    where: { ratingsCount: { gte: 100000 } },
    orderBy: [{ averageRating: "desc" }, { ratingsCount: "desc" }],
    take: limit,
  });
}
