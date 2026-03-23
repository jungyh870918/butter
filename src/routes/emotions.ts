import { Router, Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
const router = Router();

const DEMO_USER_ID = "demo-user-id";

function formatLog(log: {
  id: string;
  dateLabel: string;
  intensity: number;
  emotion: string;
}) {
  return {
    date: log.dateLabel,
    intensity: log.intensity,
    emotion: log.emotion,
  };
}

// GET /api/emotions
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await prisma.emotionLog.findMany({
      where: { userId: DEMO_USER_ID },
      orderBy: { createdAt: "asc" },
    });

    res.json(logs.map(formatLog));
  } catch (err) {
    next(err);
  }
});

// GET /api/emotions/summary
router.get(
  "/summary",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.emotionLog.findMany({
        where: { userId: DEMO_USER_ID },
      });

      if (logs.length === 0) {
        res.json({
          topEmotions: [],
          averageIntensity: 0,
          maxIntensity: 0,
          entryCount: 0,
        });
        return;
      }

      // Count emotion frequency
      const emotionCounts: Record<string, number> = {};
      for (const log of logs) {
        emotionCounts[log.emotion] = (emotionCounts[log.emotion] ?? 0) + 1;
      }

      const topEmotions = Object.entries(emotionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([emotion]) => emotion);

      const totalIntensity = logs.reduce((sum: number, log: { intensity: number }) => sum + log.intensity, 0);
      const averageIntensity =
        Math.round((totalIntensity / logs.length) * 10) / 10;
      const maxIntensity = Math.max(...logs.map((l: { intensity: number }) => l.intensity));

      res.json({
        topEmotions,
        averageIntensity,
        maxIntensity,
        entryCount: logs.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/emotions
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, intensity, emotion } = req.body;

    if (!date || typeof date !== "string" || date.trim() === "") {
      res.status(400).json({ message: "date is required" });
      return;
    }

    const parsedIntensity = Number(intensity);
    if (
      intensity === undefined ||
      intensity === null ||
      isNaN(parsedIntensity) ||
      parsedIntensity < 1 ||
      parsedIntensity > 10
    ) {
      res.status(400).json({ message: "intensity is required and must be between 1 and 10" });
      return;
    }

    if (!emotion || typeof emotion !== "string" || emotion.trim() === "") {
      res.status(400).json({ message: "emotion is required" });
      return;
    }

    const log = await prisma.emotionLog.create({
      data: {
        userId: DEMO_USER_ID,
        dateLabel: date.trim(),
        intensity: Math.round(parsedIntensity),
        emotion: emotion.trim(),
      },
    });

    res.status(201).json(formatLog(log));
  } catch (err) {
    next(err);
  }
});

export default router;
