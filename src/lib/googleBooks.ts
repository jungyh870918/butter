// ── Google Books API helper ────────────────────────────────────────────────

const BASE = "https://www.googleapis.com/books/v1";

// Butter Book shape (mirrors frontend types/index.ts)
export interface ButterBook {
  id: string;
  title: string;
  author: string;
  cover: string;
  description: string;
  tags: string[];
  rating: number;
  publishedDate?: string;
  pageCount?: number;
  historicalContext?: string;
  quote?: string;
  authorNote?: string;
}

// ── HTML 태그 제거 ──────────────────────────────────────────────────────────
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
}

// ── Normalize a single Google Books volume item ────────────────────────────

function normalizeVolume(item: any): ButterBook {
  const info = item.volumeInfo ?? {};

  const authors: string[] = info.authors ?? [];
  const author = authors.length > 0 ? authors.join(", ") : "Unknown Author";

  const rawCover: string =
    info.imageLinks?.extraLarge ??
    info.imageLinks?.large ??
    info.imageLinks?.medium ??
    info.imageLinks?.thumbnail ??
    info.imageLinks?.smallThumbnail ??
    "";
  const cover = rawCover.replace(/^http:\/\//, "https://");

  // HTML 태그 제거 후 저장
  const description: string = info.description ? stripHtml(info.description) : "";
  const tags: string[] = info.categories ?? [];
  const rating: number =
    typeof info.averageRating === "number" ? info.averageRating : 0;

  return {
    id: item.id as string,
    title: info.title ?? "Untitled",
    author,
    cover,
    description,
    tags,
    rating,
    publishedDate: info.publishedDate ?? undefined,
    pageCount: typeof info.pageCount === "number" ? info.pageCount : undefined,
  };
}

// ── Build query string with optional API key ───────────────────────────────

function buildParams(params: Record<string, string>): string {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (apiKey) params["key"] = apiKey;
  return new URLSearchParams(params).toString();
}

// ── fetch with retry (503 등 일시적 오류 대응) ────────────────────────────

async function fetchWithRetry(url: string, retries = 3, delayMs = 1000): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url);
    if (res.ok || res.status === 404) return res;
    // 재시도 가능한 상태코드: 429, 5xx
    if (attempt < retries && (res.status === 429 || res.status >= 500)) {
      console.warn(`[GoogleBooks] ${res.status} — retrying (${attempt + 1}/${retries})...`);
      await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      continue;
    }
    return res; // 마지막 시도 결과 반환
  }
  // unreachable
  return fetch(url);
}

// ── Search volumes ─────────────────────────────────────────────────────────

export async function searchGoogleBooks(q: string): Promise<ButterBook[]> {
  const qs = buildParams({ q, maxResults: "20", printType: "books" });
  const url = `${BASE}/volumes?${qs}`;

  const res = await fetchWithRetry(url);
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items: any[] = data.items ?? [];
  return items.map(normalizeVolume);
}

// ── Fetch single volume by id ──────────────────────────────────────────────

export async function getGoogleBookById(id: string): Promise<ButterBook> {
  const qs = buildParams({});
  const url = `${BASE}/volumes/${encodeURIComponent(id)}${qs ? "?" + qs : ""}`;

  const res = await fetchWithRetry(url);
  if (res.status === 404) {
    throw new Error("Book not found");
  }
  if (!res.ok) {
    throw new Error(`Google Books API error: ${res.status} ${res.statusText}`);
  }

  const item = await res.json();
  return normalizeVolume(item);
}
