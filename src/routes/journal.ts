import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { extractProfile, PROMPT_VERSION } from "../lib/gptInsights";
const router = Router();

const DEMO_USER_ID = "demo-user-id";

// ── Format helper ──────────────────────────────────────────────────────────
// 신규 필드 포함. 기존 클라이언트는 모르는 필드를 무시하므로 하위 호환 유지.

function formatEntry(e: {
  id: string;
  date: Date;
  content: string;
  prompt: string | null;
  mood: string | null;
  emotions: string[];
  intensity: number;
  bookId: string | null;
  bookTitle: string | null;
  bookAuthor: string | null;
  bookCover: string | null;
  highlight: string | null;
}) {
  return {
    id: e.id,
    date: e.date.toISOString().split("T")[0],
    content: e.content,
    prompt: e.prompt ?? undefined,
    mood: e.mood ?? undefined,
    emotions: e.emotions,
    intensity: e.intensity,
    bookId: e.bookId ?? undefined,
    bookTitle: e.bookTitle ?? undefined,
    bookAuthor: e.bookAuthor ?? undefined,
    bookCover: e.bookCover ?? undefined,
    highlight: e.highlight ?? undefined,
  };
}

// ── GET /api/journal ───────────────────────────────────────────────────────
// Query params: bookId? → 특정 책에 연결된 entries만 필터링

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId } = req.query as { bookId?: string };

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: DEMO_USER_ID,
        ...(bookId ? { bookId } : {}),
      },
      orderBy: { date: "desc" },
    });

    res.json(entries.map(formatEntry));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/journal ──────────────────────────────────────────────────────
// 신규 필드: emotions[], bookId, bookTitle, bookAuthor, bookCover, highlight
// 모두 optional — 기존 클라이언트 페이로드 그대로 동작

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      content, prompt, mood, emotions, intensity,
      bookId, bookTitle, bookAuthor, bookCover, highlight,
    } = req.body;

    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({ message: "content is required" });
      return;
    }

    const parsedIntensity = Number(intensity);
    if (
      intensity === undefined || intensity === null ||
      isNaN(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 10
    ) {
      res.status(400).json({ message: "intensity is required and must be between 1 and 10" });
      return;
    }

    const normalizedEmotions: string[] = Array.isArray(emotions)
      ? emotions.filter((e: unknown) => typeof e === "string" && (e as string).trim() !== "").map((e: string) => e.trim())
      : [];

    const entry = await prisma.journalEntry.create({
      data: {
        userId: DEMO_USER_ID,
        content: content.trim(),
        prompt: prompt?.trim() ?? null,
        mood: mood?.trim() ?? null,
        emotions: normalizedEmotions,
        intensity: Math.round(parsedIntensity),
        date: new Date(),
        bookId: bookId?.trim() ?? null,
        bookTitle: bookTitle?.trim() ?? null,
        bookAuthor: bookAuthor?.trim() ?? null,
        bookCover: bookCover?.trim() ?? null,
        highlight: highlight?.trim() ?? null,
      },
    });

    res.status(201).json(formatEntry(entry));

    // ── 프로파일 비동기 갱신 ─────────────────────────────────────────────
    // 응답 후 백그라운드에서 실행 — 실패해도 저널 저장에 영향 없음
    refreshUserProfile(DEMO_USER_ID).catch((err) => {
      console.warn("[journal/POST] profile refresh skipped:", err.message);
    });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/journal/:id ─────────────────────────────────────────────────

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, userId: DEMO_USER_ID },
    });

    if (!existing) {
      res.status(404).json({ message: "Journal entry not found" });
      return;
    }

    const {
      content, prompt, mood, emotions, intensity,
      bookId, bookTitle, bookAuthor, bookCover, highlight,
    } = req.body;

    const updates: {
      content?: string;
      prompt?: string | null;
      mood?: string | null;
      emotions?: string[];
      intensity?: number;
      bookId?: string | null;
      bookTitle?: string | null;
      bookAuthor?: string | null;
      bookCover?: string | null;
      highlight?: string | null;
    } = {};

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim() === "") {
        res.status(400).json({ message: "content must be a non-empty string" });
        return;
      }
      updates.content = content.trim();
    }

    if (intensity !== undefined) {
      const parsedIntensity = Number(intensity);
      if (isNaN(parsedIntensity) || parsedIntensity < 1 || parsedIntensity > 10) {
        res.status(400).json({ message: "intensity must be between 1 and 10" });
        return;
      }
      updates.intensity = Math.round(parsedIntensity);
    }

    if (prompt !== undefined) updates.prompt = prompt?.trim() ?? null;
    if (mood !== undefined) updates.mood = mood?.trim() ?? null;

    if (emotions !== undefined) {
      updates.emotions = Array.isArray(emotions)
        ? emotions.filter((e: unknown) => typeof e === "string" && (e as string).trim() !== "").map((e: string) => e.trim())
        : [];
    }

    if (bookId !== undefined) updates.bookId = bookId?.trim() ?? null;
    if (bookTitle !== undefined) updates.bookTitle = bookTitle?.trim() ?? null;
    if (bookAuthor !== undefined) updates.bookAuthor = bookAuthor?.trim() ?? null;
    if (bookCover !== undefined) updates.bookCover = bookCover?.trim() ?? null;
    if (highlight !== undefined) updates.highlight = highlight?.trim() ?? null;

    const updated = await prisma.journalEntry.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json(formatEntry(updated));
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/journal/:id ────────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.journalEntry.findFirst({
      where: { id: req.params.id, userId: DEMO_USER_ID },
    });

    if (!existing) {
      res.status(404).json({ message: "Journal entry not found" });
      return;
    }

    await prisma.journalEntry.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

// ── Profile refresh helper ─────────────────────────────────────────────────
// journal POST 후 비동기로 호출됨. OPENAI_API_KEY 없으면 조용히 skip.

async function refreshUserProfile(userId: string): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") return; // API 키 없으면 skip

  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 30,
    select: {
      content: true,
      mood: true,
      emotions: true,
      bookTitle: true,
      bookAuthor: true,
      highlight: true,
      date: true,
    },
  });

  if (entries.length === 0) return;

  const profileData = await extractProfile(entries);

  const existing = await prisma.userProfile.findUnique({
    where: { userId },
    select: { profileVersion: true },
  });
  const nextVersion = (existing?.profileVersion ?? 0) + 1;

  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...profileData,
      profileVersion: 1,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date(),
    },
    update: {
      ...profileData,
      profileVersion: nextVersion,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date(),
    },
  });
}
