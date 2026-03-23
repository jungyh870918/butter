import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import {
  extractProfile,
  generateQuestions,
  UserProfileData,
  PROMPT_VERSION,
} from "../lib/gptInsights";

const router = Router();
const DEMO_USER_ID = "demo-user-id";

// ── Format helper ──────────────────────────────────────────────────────────

function formatProfile(p: {
  id: string;
  userId: string;
  readingVolumeLevel: string;
  recentEmotions: string[];
  dominantThemes: string[];
  writingStyleSignal: string;
  notableFragments: string[];
  recentBookCategories: string[];
  sourceEntryCount: number;
  profileVersion: number;
  promptVersion: string;
  generatedAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    userId: p.userId,
    readingVolumeLevel: p.readingVolumeLevel,
    recentEmotions: p.recentEmotions,
    dominantThemes: p.dominantThemes,
    writingStyleSignal: p.writingStyleSignal,
    notableFragments: p.notableFragments,
    recentBookCategories: p.recentBookCategories,
    sourceEntryCount: p.sourceEntryCount,
    profileVersion: p.profileVersion,
    promptVersion: p.promptVersion,
    generatedAt: p.generatedAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ── GET /api/insights/profile ──────────────────────────────────────────────
// 현재 저장된 프로파일 반환. 없으면 404.

router.get("/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    });

    if (!profile) {
      res.status(404).json({ message: "No profile yet. POST /api/insights/profile to generate one." });
      return;
    }

    res.json(formatProfile(profile));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/insights/profile ─────────────────────────────────────────────
// 저널 데이터를 읽어 GPT로 프로파일 추출 → DB에 upsert 저장.
// journal POST 이후 자동 트리거되거나, 프론트에서 수동 호출 가능.

router.post("/profile", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      res.status(503).json({ message: "OPENAI_API_KEY not configured" });
      return;
    }

    // 최근 저널 엔트리 최대 30개 — 비용 절감 + 최신 데이터 집중
    const entries = await prisma.journalEntry.findMany({
      where: { userId: DEMO_USER_ID },
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

    if (entries.length === 0) {
      res.status(400).json({ message: "No journal entries found. Write some entries first." });
      return;
    }

    // GPT 호출 — A. 프로파일 추출
    const profileData: UserProfileData = await extractProfile(entries);

    // 현재 버전 조회 (upsert 시 profileVersion +1 처리)
    const existing = await prisma.userProfile.findUnique({
      where: { userId: DEMO_USER_ID },
      select: { profileVersion: true },
    });
    const nextVersion = (existing?.profileVersion ?? 0) + 1;

    // DB upsert — User당 항상 1개 row 유지
    const saved = await prisma.userProfile.upsert({
      where: { userId: DEMO_USER_ID },
      create: {
        userId: DEMO_USER_ID,
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

    res.json(formatProfile(saved));
  } catch (err: any) {
    if (err.message?.includes("JSON")) {
      // GPT가 올바른 JSON을 안 돌려줬을 때
      console.error("[insights/profile] GPT JSON parse failed:", err.message);
      res.status(502).json({ message: "GPT returned invalid response. Try again." });
      return;
    }
    next(err);
  }
});

// ── POST /api/insights/questions ───────────────────────────────────────────
// 책 컨텍스트 + 저장된 유저 프로파일 → GPT로 질문 3개 생성.
// Body: { bookId?, bookTitle, bookAuthor, bookDescription?, bookTags? }

router.post("/questions", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      res.status(503).json({ message: "OPENAI_API_KEY not configured" });
      return;
    }

    const { bookTitle, bookAuthor, bookDescription, bookTags } = req.body;

    if (!bookTitle || typeof bookTitle !== "string" || bookTitle.trim() === "") {
      res.status(400).json({ message: "bookTitle is required" });
      return;
    }
    if (!bookAuthor || typeof bookAuthor !== "string" || bookAuthor.trim() === "") {
      res.status(400).json({ message: "bookAuthor is required" });
      return;
    }

    // 저장된 프로파일 조회 — 없으면 기본값(low profile)으로 폴백
    const stored = await prisma.userProfile.findUnique({
      where: { userId: DEMO_USER_ID },
    });

    const profile: UserProfileData = stored
      ? {
          readingVolumeLevel: stored.readingVolumeLevel as "low" | "mid" | "high",
          recentEmotions: stored.recentEmotions,
          dominantThemes: stored.dominantThemes,
          writingStyleSignal: stored.writingStyleSignal as "introspective" | "factual" | "emotional",
          notableFragments: stored.notableFragments,
          recentBookCategories: stored.recentBookCategories,
          sourceEntryCount: stored.sourceEntryCount,
        }
      : {
          // 프로파일이 없으면 최소한의 기본값 — 책 중심 질문이 생성됨
          readingVolumeLevel: "low",
          recentEmotions: [],
          dominantThemes: [],
          writingStyleSignal: "introspective",
          notableFragments: [],
          recentBookCategories: [],
          sourceEntryCount: 0,
        };

    // GPT 호출 — B. 질문 생성
    const result = await generateQuestions(
      {
        title: bookTitle.trim(),
        author: bookAuthor.trim(),
        description: bookDescription ?? undefined,
        tags: Array.isArray(bookTags) ? bookTags : [],
      },
      profile
    );

    res.json({
      questions: result.questions,
      // 클라이언트가 프로파일 기반 여부를 알 수 있도록 메타 포함
      meta: {
        profileUsed: !!stored,
        readingVolumeLevel: profile.readingVolumeLevel,
        sourceEntryCount: profile.sourceEntryCount,
      },
    });
  } catch (err: any) {
    if (err.message?.includes("JSON")) {
      console.error("[insights/questions] GPT JSON parse failed:", err.message);
      res.status(502).json({ message: "GPT returned invalid response. Try again." });
      return;
    }
    next(err);
  }
});

export default router;
