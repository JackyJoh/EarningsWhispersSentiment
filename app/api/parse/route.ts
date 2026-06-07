import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ICNewsletterSchema, PostNewsletterSchema } from "@/lib/schemas";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { text, mode } = await req.json() as { text: string; mode: "ic" | "post" };

    if (!text || !mode) {
      return NextResponse.json({ error: "Missing text or mode" }, { status: 400 });
    }

    const schema = mode === "post" ? PostNewsletterSchema : ICNewsletterSchema;

    const systemPrompt =
      mode === "post"
        ? `You are a financial data extractor for Earnings Whispers post-earnings reports.
Extract all fields that are present in the text.
For numeric fields use plain numbers with no % sign.
For whisper_number and consensus_number extract the per-share EPS values.
For grade, extract the Earnings Whisper letter grade (A+, A, B, C, D, or F).
For beat_miss: "beat" if reported EPS exceeded the whisper number, "miss" if below, "met" if equal.
For guidance_tone: "raised" if guidance was increased vs prior, "lowered" if reduced, "maintained" if unchanged, null if no guidance.
For implied_move_pct, average_move_pct, pct_expecting_beat, and notable_options: these are pre-earnings metrics that will NOT appear in a post-earnings report — return null for all of them.`
        : `You are a financial data extractor for Earnings Whispers pre-earnings newsletters.
Extract all requested fields exactly as they appear in the text.
For numeric fields use plain numbers with no % sign.
For implied_move_pct and average_move_pct extract the percentage as a plain number (e.g. 8.5 for 8.5%).
For whisper_number and consensus_number extract the EPS values.`;

    const response = await client.messages.parse({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
      output_config: { format: zodOutputFormat(schema) },
    });

    if (!response.parsed_output) {
      return NextResponse.json({ error: "Failed to parse newsletter fields" }, { status: 422 });
    }

    const output = response.parsed_output as Record<string, unknown>;

    // Normalize grade to a canonical value — Claude may return "B+", "A-", etc.
    if ("grade" in output && output.grade != null) {
      const raw = String(output.grade).toUpperCase().trim();
      const valid = ["A+", "A", "B", "C", "D", "F"] as const;
      if ((valid as readonly string[]).includes(raw)) {
        output.grade = raw;
      } else if (raw.startsWith("A")) {
        output.grade = raw.includes("+") ? "A+" : "A";
      } else if (raw.startsWith("B")) {
        output.grade = "B";
      } else if (raw.startsWith("C")) {
        output.grade = "C";
      } else if (raw.startsWith("D")) {
        output.grade = "D";
      } else if (raw === "F") {
        output.grade = "F";
      } else {
        output.grade = null;
      }
    }

    return NextResponse.json(output);
  } catch (err: unknown) {
    console.error("/api/parse error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
