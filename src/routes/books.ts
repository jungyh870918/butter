import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { searchGoogleBooks, getGoogleBookById } from "../lib/googleBooks";
import { enrichBook } from "../lib/enrichBook";

const router = Router();

const DEFAULT_QUERY = "subject:literary fiction classics";

// ── 검색 쿼리 보강 ─────────────────────────────────────────────────────────
// 유저 입력을 그대로 넘기면 짧거나 모호한 쿼리에서 엉뚱한 결과가 나옴.
// intitle: + inauthor: 를 OR로 조합해 제목/저자 양쪽에서 매칭하도록 보강.
// 예: "Tolstoy" → "intitle:Tolstoy OR inauthor:Tolstoy"
// 예: "War and Peace" (공백 포함, 2단어 이상) → 그대로 전달 (구문 검색이 더 정확)

function buildSearchQuery(raw: string): string {
  const trimmed = raw.trim();
  const words = trimmed.split(/\s+/);

  // 2단어 이상이면 제목 구문 검색 + 저자 검색 조합
  if (words.length >= 2) {
    return `intitle:${trimmed} OR inauthor:${trimmed}`;
  }

  // 1단어면 제목/저자 양쪽 검색
  return `intitle:${trimmed} OR inauthor:${trimmed}`;
}

// ── GET /api/books ─────────────────────────────────────────────────────────
// 목록에서는 OpenAI 보강 없이 Google Books 데이터만 반환.
// quote/authorNote/historicalContext는 세부 페이지(:id)에서만 생성.

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, tag } = req.query as { search?: string; tag?: string };

    let query: string;
    if (search) {
      query = buildSearchQuery(search);
    } else if (tag) {
      query = `subject:${tag}`;
    } else {
      query = DEFAULT_QUERY;
    }

    let books;
    try {
      books = await searchGoogleBooks(query);
    } catch (err: any) {
      console.error("[/api/books] Google Books failed:", err.message);
      res.json([]);
      return;
    }

    res.json(books);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/books/:id ─────────────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // 1) Prisma DB 우선 확인
    const localBook = await prisma.book.findUnique({ where: { id } });
    if (localBook) {
      res.json(localBook);
      return;
    }

    // 2) Google Books API 조회
    const book = await getGoogleBookById(id);

    // 3) OpenAI 보강 머지
    const extra = await enrichBook(book.title, book.author);
    res.json({ ...book, ...extra });
  } catch (err: any) {
    if (err.message === "Book not found") {
      res.status(404).json({ message: "Book not found" });
      return;
    }
    next(err);
  }
});

// ── GET /api/books/:id/reflections ─────────────────────────────────────────

router.get(
  "/:id/reflections",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reflections = await prisma.reflection.findMany({
        where: { bookId: req.params.id },
        orderBy: { date: "desc" },
      });

      res.json(
        reflections.map((r: any) => ({
          ...r,
          date: r.date.toISOString(),
        }))
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
