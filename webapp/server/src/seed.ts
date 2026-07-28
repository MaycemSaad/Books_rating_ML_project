import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { prisma } from "./prisma.js";
import { config } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface RawRow {
  bookID: string;
  title: string;
  authors: string;
  average_rating: string;
  isbn: string;
  isbn13: string;
  language_code: string;
  num_pages: string;
  ratings_count: string;
  text_reviews_count: string;
  publication_date: string;
  publisher: string;
}

function toInt(value: string | undefined): number {
  const n = Number.parseInt((value ?? "").trim(), 10);
  return Number.isFinite(n) ? n : 0;
}

function toFloat(value: string | undefined): number {
  const n = Number.parseFloat((value ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

function parseYear(date: string | undefined): number | null {
  if (!date) return null;
  const parts = date.split("/");
  const year = Number.parseInt(parts[parts.length - 1], 10);
  return Number.isFinite(year) ? year : null;
}

async function main() {
  const csvPath = path.resolve(__dirname, "..", config.booksCsv);
  console.log(`Reading catalog from ${csvPath}`);
  const content = fs.readFileSync(csvPath, "utf8");

  const records = parse(content, {
    columns: (header: string[]) => header.map((h) => h.trim()),
    skip_empty_lines: true,
    relax_column_count: true,
    quote: false,
    skip_records_with_error: true,
    trim: true,
  }) as RawRow[];

  console.log(`Parsed ${records.length} rows. Clearing existing catalog...`);
  await prisma.book.deleteMany();

  const rows = records
    .filter((r) => r.title && r.authors)
    .map((r) => {
      const authors = r.authors.trim();
      const rawLang = r.language_code?.trim() ?? "";
      // A handful of source rows have shifted columns; keep only plausible codes.
      const languageCode = /^[a-z]{2,3}(-[A-Za-z]{2})?$/.test(rawLang) ? rawLang : "unknown";
      return {
        bookID: toInt(r.bookID) || null,
        title: r.title.trim(),
        authors,
        firstAuthor: authors.split("/")[0].trim(),
        averageRating: toFloat(r.average_rating),
        isbn: r.isbn?.trim() || null,
        isbn13: r.isbn13?.trim() || null,
        languageCode,
        numPages: toInt(r.num_pages),
        ratingsCount: toInt(r.ratings_count),
        textReviewsCount: toInt(r.text_reviews_count),
        publicationDate: r.publication_date?.trim() || "",
        publicationYear: parseYear(r.publication_date),
        publisher: r.publisher?.trim() || "",
      };
    });

  const batchSize = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    await prisma.book.createMany({ data: batch });
    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted}/${rows.length}`);
  }
  console.log(`\nDone. Seeded ${inserted} books.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
