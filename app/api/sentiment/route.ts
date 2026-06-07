import { NextRequest, NextResponse } from "next/server";
import type { Sentiment } from "@/lib/types";

const HF_URL = "https://api-inference.huggingface.co/models/ProsusAI/finbert";
const HF_KEY = process.env.HUGGINGFACE_API_KEY ?? "";

const labelMap: Record<string, "positive" | "negative" | "neutral"> = {
  positive: "positive", POSITIVE: "positive",
  negative: "negative", NEGATIVE: "negative",
  neutral:  "neutral",  NEUTRAL:  "neutral",
};

async function querySentiment(text: string): Promise<Sentiment> {
  const res = await fetch(HF_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_KEY}`,
      "Content-Type": "application/json",
    },
    // wait_for_model: true — avoids 503 "model loading"; HF waits up to 60s instead of erroring
    body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
  });

  const body = await res.json();

  // HuggingFace occasionally returns { error: "..." } with a 200 status
  if (!res.ok || (body && typeof body === "object" && !Array.isArray(body) && "error" in body)) {
    const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(`FinBERT: ${msg}`);
  }

  // Response is [[{label, score}, ...]] or [{label, score}, ...]
  const results: Array<{ label: string; score: number }> = Array.isArray(body[0])
    ? body[0]
    : body;

  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("FinBERT returned an unexpected response format");
  }

  const best = results.reduce((a, b) => (a.score > b.score ? a : b));
  return {
    label: labelMap[best.label] ?? "neutral",
    score: best.score,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };
    if (!text) {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const sentiment = await querySentiment(text);
    return NextResponse.json(sentiment);
  } catch (err: unknown) {
    console.error("/api/sentiment error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
