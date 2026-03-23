// ── OpenAI 보강 helper ──────────────────────────────────────────────────────

export interface BookEnrichment {
  quote: string;
  authorNote: string;
  historicalContext: string;
}

export async function enrichBook(
  title: string,
  author: string
): Promise<BookEnrichment> {
  const empty = { quote: "", authorNote: "", historicalContext: "" };
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === "") return empty;

  const prompt = `You are a literary assistant. For the book "${title}" by ${author}, provide exactly these three fields as a JSON object.

Rules:
- quote: one memorable sentence from or inspired by the book (max 30 words)
- authorNote: one sentence about the author (max 25 words)
- historicalContext: one sentence about when/why this book was written (max 25 words)

Respond with ONLY the raw JSON, no markdown fences, no extra text:
{"quote":"...","authorNote":"...","historicalContext":"..."}`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,   // 3개 필드가 잘리지 않도록 충분히 확보
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error(`[enrichBook] OpenAI ${res.status}`);
      return empty;
    }

    const data = await res.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    // 마크다운 코드블록 제거 후 파싱
    const clean = text.replace(/```json\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      quote: typeof parsed.quote === "string" ? parsed.quote : "",
      authorNote: typeof parsed.authorNote === "string" ? parsed.authorNote : "",
      historicalContext: typeof parsed.historicalContext === "string" ? parsed.historicalContext : "",
    };
  } catch (err) {
    console.error("[enrichBook] Failed:", err);
    return empty;
  }
}
