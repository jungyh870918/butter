import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

function formatReflection(r: {
  id: string;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  date: Date;
  tags: string[];
  image: string | null;
  bookId: string | null;
  userId: string | null;
  journalEntryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    author: r.author,
    authorAvatar: r.authorAvatar,
    date: r.date.toISOString(),
    tags: r.tags,
    image: r.image ?? undefined,
    bookId: r.bookId ?? undefined,
    userId: r.userId ?? undefined,
    journalEntryId: r.journalEntryId ?? undefined,
  };
}

// ── GET /api/reflections ───────────────────────────────────────────────────
// Query params: bookId?, userId?, journalEntryId?, limit?

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId, userId, journalEntryId, limit } = req.query as {
      bookId?: string;
      userId?: string;
      journalEntryId?: string;
      limit?: string;
    };

    const reflections = await prisma.reflection.findMany({
      where: {
        ...(bookId ? { bookId } : {}),
        ...(userId ? { userId } : {}),
        ...(journalEntryId ? { journalEntryId } : {}),
      },
      orderBy: { date: "desc" },
      take: limit ? parseInt(limit, 10) : undefined,
    });

    res.json(reflections.map(formatReflection));
  } catch (err) {
    next(err);
  }
});

// ── GET /api/reflections/:id ───────────────────────────────────────────────

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reflection = await prisma.reflection.findUnique({
      where: { id: req.params.id },
    });

    if (!reflection) {
      res.status(404).json({ message: "Reflection not found" });
      return;
    }

    res.json(formatReflection(reflection));
  } catch (err) {
    next(err);
  }
});

// ── POST /api/reflections ──────────────────────────────────────────────────
// Body: title, content, author, authorAvatar?, tags?, image?, bookId?, userId?, journalEntryId?

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      content,
      author,
      authorAvatar,
      tags,
      image,
      bookId,
      userId,
      journalEntryId,
    } = req.body;

    // ── Validation ──
    if (!title || typeof title !== "string" || title.trim() === "") {
      res.status(400).json({ message: "title is required" });
      return;
    }
    if (!content || typeof content !== "string" || content.trim() === "") {
      res.status(400).json({ message: "content is required" });
      return;
    }
    if (!author || typeof author !== "string" || author.trim() === "") {
      res.status(400).json({ message: "author is required" });
      return;
    }

    // ── FK 존재 확인 ──
    if (bookId) {
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (!book) {
        res.status(400).json({ message: "bookId references a non-existent book" });
        return;
      }
    }

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(400).json({ message: "userId references a non-existent user" });
        return;
      }
    }

    if (journalEntryId) {
      const journal = await prisma.journalEntry.findUnique({
        where: { id: journalEntryId },
      });
      if (!journal) {
        res.status(400).json({ message: "journalEntryId references a non-existent journal entry" });
        return;
      }

      // 이미 연결된 reflection이 있는지 확인 (1:1)
      const existing = await prisma.reflection.findUnique({
        where: { journalEntryId },
      });
      if (existing) {
        res.status(409).json({
          message: "A reflection for this journal entry already exists",
          existingId: existing.id,
        });
        return;
      }
    }

    // ── Create ──
    const reflection = await prisma.reflection.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        authorAvatar:
          authorAvatar?.trim() ||
          `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(author)}`,
        tags: Array.isArray(tags) ? tags : [],
        image: image ?? null,
        bookId: bookId ?? null,
        userId: userId ?? null,
        journalEntryId: journalEntryId ?? null,
        date: new Date(),
      },
    });

    res.status(201).json(formatReflection(reflection));
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/reflections/:id ─────────────────────────────────────────────
// 내용 수정 (title, content, tags 변경 허용)

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.reflection.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ message: "Reflection not found" });
      return;
    }

    const { title, content, tags } = req.body;
    const updates: { title?: string; content?: string; tags?: string[] } = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        res.status(400).json({ message: "title must be a non-empty string" });
        return;
      }
      updates.title = title.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim() === "") {
        res.status(400).json({ message: "content must be a non-empty string" });
        return;
      }
      updates.content = content.trim();
    }

    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : [];
    }

    const updated = await prisma.reflection.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json(formatReflection(updated));
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/reflections/:id ────────────────────────────────────────────

router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.reflection.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) {
      res.status(404).json({ message: "Reflection not found" });
      return;
    }

    await prisma.reflection.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
