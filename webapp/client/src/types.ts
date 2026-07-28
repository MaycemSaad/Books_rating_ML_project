export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Book {
  id: string;
  bookID: number | null;
  title: string;
  authors: string;
  firstAuthor: string;
  averageRating: number;
  isbn: string | null;
  isbn13: string | null;
  languageCode: string;
  numPages: number;
  ratingsCount: number;
  textReviewsCount: number;
  publicationDate: string;
  publicationYear: number | null;
  publisher: string;
  score?: number;
}

export interface SearchResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: Book[];
}

export interface Facets {
  languages: { code: string; count: number }[];
  yearRange: [number | null, number | null];
  pagesRange: [number | null, number | null];
}

export interface RecommendationResponse {
  personalized: boolean;
  reason: string;
  basedOn?: { authors: string[]; keywords: string[]; languages: string[] };
  items: Book[];
}

export interface PredictionResult {
  predictedRating: number;
  modelName?: string;
}
