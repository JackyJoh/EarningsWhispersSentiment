import { z } from "zod";

export const ICNewsletterSchema = z.object({
  ticker: z.string(),
  company: z.string(),
  whisper_number: z.number(),
  consensus_number: z.number(),
  implied_move_pct: z.number(),
  average_move_pct: z.number(),
  pct_expecting_beat: z.number(),
  sentiment: z.enum(["bullish", "bearish", "neutral"]),
  notable_options: z.string(),
  guidance_low: z.number().nullable(),
  guidance_high: z.number().nullable(),
});

export const PostNewsletterSchema = ICNewsletterSchema.extend({
  grade: z.string().nullable(),
  beat_miss: z.enum(["beat", "miss", "met"]),
  guidance_tone: z.enum(["raised", "lowered", "maintained"]).nullable(),
  // Pre-earnings fields — override as nullable since they're absent in post-only reports
  implied_move_pct:   z.number().nullable(),
  average_move_pct:   z.number().nullable(),
  pct_expecting_beat: z.number().nullable(),
  notable_options:    z.string().nullable(),
});

export type ICNewsletterInput = z.infer<typeof ICNewsletterSchema>;
export type PostNewsletterInput = z.infer<typeof PostNewsletterSchema>;
