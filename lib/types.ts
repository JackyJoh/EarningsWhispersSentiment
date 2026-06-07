export interface ParsedNewsletter {
  ticker: string;
  company: string;
  whisper_number: number;
  consensus_number: number;
  implied_move_pct: number | null;
  average_move_pct: number | null;
  pct_expecting_beat: number | null;
  sentiment: "bullish" | "bearish" | "neutral";
  notable_options: string | null;
  guidance_low: number | null;
  guidance_high: number | null;
}

export interface ParsedNewsletterPost extends ParsedNewsletter {
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  beat_miss: "beat" | "miss" | "met";
  guidance_tone: "raised" | "lowered" | "maintained" | null;
}

export interface TradierData {
  stockPrice: number;
  straddlePrice?: number;
  dma200?: number;
  icNetCredit?: number;
}

export interface Sentiment {
  label: "positive" | "negative" | "neutral";
  score: number;
}

export interface ICFilter {
  label: string;
  pass: boolean;
  value: string;
  threshold: string;
}

export interface ICStrikes {
  shortCall: number;
  shortPut: number;
  longCall: number;
  longPut: number;
  premium: number;
  breakevenUpper: number;
  breakevenLower: number;
  maxProfit: number;
  maxLoss: number;
  wing: number;
}

export interface ICResult {
  approved: boolean;
  filters: ICFilter[];
  strikes: ICStrikes | null;
}

export type PMCCVerdict = "STRONG" | "WEAK" | "AVOID";

export interface PMCCFilter {
  label: string;
  pass: boolean;
  na?: boolean;
  value: string;
  threshold: string;
}

export interface PMCCStrikes {
  leapsStrike: number;
  shortCallStrike: number;
}

export interface PMCCResult {
  verdict: PMCCVerdict;
  score: number;
  activeFilters: number;
  filters: PMCCFilter[];
  strikes: PMCCStrikes;
}

export type AppMode = "ic" | "pmcc";

export type ICStep =
  | "idle"
  | "parsing"
  | "fetching"
  | "scoring"
  | "done"
  | "error";

export type PMCCStep =
  | "idle"
  | "parsing"
  | "sentiment"
  | "fetching"
  | "scoring"
  | "done"
  | "error";
