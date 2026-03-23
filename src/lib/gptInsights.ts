// ── GPT Insights helper ────────────────────────────────────────────────────
// enrichBook.ts의 패턴을 그대로 따름.
// 두 가지 GPT 요청을 담당:
//   A. extractProfile  → 저널 데이터 → 유저 프로파일 JSON
//   B. generateQuestions → 책 + 프로파일 → 질문 3개

// ── 현재 프롬프트 버전 ──────────────────────────────────────────────────────
// 프롬프트 내용이 바뀌면 이 값을 올려서 DB에 추적되도록 함
export const PROMPT_VERSION = "1.0";

// ── 타입 정의 ──────────────────────────────────────────────────────────────

export interface UserProfileData {
  readingVolumeLevel: "low" | "mid" | "high";
  recentEmotions: string[];
  dominantThemes: string[];
  writingStyleSignal: "introspective" | "factual" | "emotional";
  notableFragments: string[];
  recentBookCategories: string[];
  sourceEntryCount: number;
}

export interface GeneratedQuestions {
  questions: string[];
}

// ── 공통 OpenAI 호출 ────────────────────────────────────────────────────────

async function callGPT(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 800,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? "";
  // 마크다운 코드블록 제거
  return raw.replace(/```json\n?/g, "").replace(/```/g, "").trim();
}

// ── A. Profile Extraction ──────────────────────────────────────────────────

const PROFILE_EXTRACTION_SYSTEM = `You are creating a compact reading-experience profile for a journaling service called Butter.

Your job is to summarize a user's accumulated reading journal entries into a structured profile that can later be used to generate better reflection questions.

Important rules:

1. This is NOT a psychological profile.
2. Do NOT infer personality traits, diagnoses, or identity labels.
3. Focus only on the user's READING EXPERIENCE patterns.
4. Extract only practical signals that help generate better book reflection questions later.
5. Keep the output compact, stable, and reusable.

You should identify:

- readingVolumeLevel: one of [low, mid, high]
- recentEmotions: 3 to 5 repeated emotional tones from recent entries
- dominantThemes: 3 to 5 repeated topics or themes across entries
- writingStyleSignal: one of [introspective, factual, emotional]
- notableFragments: 2 to 5 short phrases or fragments that capture how this user tends to reflect
- recentBookCategories: 2 to 5 categories or genres appearing in recent reading records
- sourceEntryCount: total number of entries used

Guidelines:

- recentEmotions should be short words or very short phrases
- dominantThemes should be reading-related themes, not personality judgments
- notableFragments should be short and reusable, not full paragraphs
- do not overfit to one entry
- if data is weak, keep output conservative

Return JSON only in this shape:

{
  "readingVolumeLevel": "low | mid | high",
  "recentEmotions": ["..."],
  "dominantThemes": ["..."],
  "writingStyleSignal": "introspective | factual | emotional",
  "notableFragments": ["..."],
  "recentBookCategories": ["..."],
  "sourceEntryCount": 0
}`;

// 저널 엔트리 배열을 GPT에 넘길 텍스트로 변환
function formatEntriesForPrompt(entries: {
  content: string;
  mood?: string | null;
  emotions?: string[];
  bookTitle?: string | null;
  bookAuthor?: string | null;
  highlight?: string | null;
  date: Date;
}[]): string {
  return entries.map((e, i) => {
    const lines: string[] = [
      `--- Entry ${i + 1} (${e.date.toISOString().split("T")[0]}) ---`,
    ];
    if (e.bookTitle) lines.push(`Book: ${e.bookTitle}${e.bookAuthor ? ` by ${e.bookAuthor}` : ""}`);
    if (e.mood) lines.push(`Mood: ${e.mood}`);
    if (e.emotions && e.emotions.length > 0) lines.push(`Emotions: ${e.emotions.join(", ")}`);
    if (e.highlight) lines.push(`Passage: "${e.highlight}"`);
    lines.push(`Reflection: ${e.content.slice(0, 600)}`); // 너무 길면 잘라서 비용 절감
    return lines.join("\n");
  }).join("\n\n");
}

export async function extractProfile(
  entries: {
    content: string;
    mood?: string | null;
    emotions?: string[];
    bookTitle?: string | null;
    bookAuthor?: string | null;
    highlight?: string | null;
    date: Date;
  }[]
): Promise<UserProfileData> {
  const userMessage = `Here are the user's journal entries:\n\n${formatEntriesForPrompt(entries)}`;
  const raw = await callGPT(PROFILE_EXTRACTION_SYSTEM, userMessage);
  const parsed = JSON.parse(raw);

  // 필드 타입 안전 처리
  return {
    readingVolumeLevel: ["low", "mid", "high"].includes(parsed.readingVolumeLevel)
      ? parsed.readingVolumeLevel
      : "low",
    recentEmotions: Array.isArray(parsed.recentEmotions) ? parsed.recentEmotions : [],
    dominantThemes: Array.isArray(parsed.dominantThemes) ? parsed.dominantThemes : [],
    writingStyleSignal: ["introspective", "factual", "emotional"].includes(parsed.writingStyleSignal)
      ? parsed.writingStyleSignal
      : "introspective",
    notableFragments: Array.isArray(parsed.notableFragments) ? parsed.notableFragments : [],
    recentBookCategories: Array.isArray(parsed.recentBookCategories) ? parsed.recentBookCategories : [],
    sourceEntryCount: typeof parsed.sourceEntryCount === "number" ? parsed.sourceEntryCount : entries.length,
  };
}

// ── B. Question Generation ─────────────────────────────────────────────────

const QUESTION_GENERATION_SYSTEM = `You are generating reflection questions for a reading journal service called Butter.

Butter helps users record their reading experience more richly.
It is NOT a psychology app, therapy app, or personality analysis tool.

Your questions should help the user reflect on the BOOK first, and only then gently connect that reading experience to the user's own life or memory.

Important rules:

1. Start from the book.
2. Use the user profile only as a light supporting reference.
3. Do NOT make psychological claims about the user.
4. Do NOT define who the user is.
5. Do NOT sound like therapy, diagnosis, or self-help coaching.
6. Keep the questions intelligent, calm, and non-intrusive.
7. The user should feel:
   - "this app is thoughtful"
   - not "this app is analyzing me"

Personalization rules:

- If readingVolumeLevel is LOW:
  focus mostly on the book itself
  use only very light personalization

- If readingVolumeLevel is MID:
  lightly connect the book to repeated recent reading patterns

- If readingVolumeLevel is HIGH:
  connect the book to longer-term reading patterns, but still avoid over-personalizing

Use the provided profile data as gentle reference signals:
- recentEmotions
- dominantThemes
- writingStyleSignal
- notableFragments
- recentBookCategories

Use them softly.
Do not force all of them into the questions.

Question quality rules:

- generate 3 questions
- concise but thoughtful
- natural language
- no jargon
- no heavy emotional burden
- no generic filler
- no repeated structure across all 3 questions

Prefer questions like:
- "Did this book connect with something you've been thinking about lately?"
- "Was there a moment in this book that stayed with you more quietly than you expected?"

Avoid questions like:
- "You tend to..."
- "You are the kind of person who..."
- "Why do you always..."
- "What trauma..."
- anything diagnostic or overly intimate

Return JSON only in this shape:

{
  "questions": [
    "...",
    "...",
    "..."
  ]
}`;

export async function generateQuestions(
  book: {
    title: string;
    author: string;
    description?: string;
    tags?: string[];
  },
  profile: UserProfileData
): Promise<GeneratedQuestions> {
  const userMessage = `Book context:
Title: ${book.title}
Author: ${book.author}
${book.description ? `Description: ${book.description.slice(0, 400)}` : ""}
${book.tags && book.tags.length > 0 ? `Categories: ${book.tags.join(", ")}` : ""}

User reading profile:
- readingVolumeLevel: ${profile.readingVolumeLevel}
- recentEmotions: ${profile.recentEmotions.join(", ") || "none recorded"}
- dominantThemes: ${profile.dominantThemes.join(", ") || "none recorded"}
- writingStyleSignal: ${profile.writingStyleSignal}
- notableFragments: ${profile.notableFragments.join(" / ") || "none recorded"}
- recentBookCategories: ${profile.recentBookCategories.join(", ") || "none recorded"}`;

  const raw = await callGPT(QUESTION_GENERATION_SYSTEM, userMessage);
  const parsed = JSON.parse(raw);

  return {
    questions: Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [],
  };
}
