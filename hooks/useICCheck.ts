"use client";

import { useState, useCallback } from "react";
import { scoreIC } from "@/lib/icScorer";
import type { ICResult, ICStep, ParsedNewsletter, TradierData } from "@/lib/types";

export function useICCheck() {
  const [step, setStep] = useState<ICStep>("idle");
  const [result, setResult] = useState<ICResult | null>(null);
  const [parsed, setParsed] = useState<ParsedNewsletter | null>(null);
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (text: string) => {
    setStep("parsing");
    setResult(null);
    setParsed(null);
    setStockPrice(null);
    setError(null);

    try {
      const parseRes = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: "ic" }),
      });
      if (!parseRes.ok) {
        const e = await parseRes.json();
        throw new Error(e.error ?? "Parse failed");
      }
      const parsedData: ParsedNewsletter = await parseRes.json();
      setParsed(parsedData);

      setStep("fetching");

      const tradierRes = await fetch("/api/tradier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: parsedData.ticker, need: ["quote", "straddle"], impliedMovePct: parsedData.implied_move_pct }),
      });
      if (!tradierRes.ok) {
        const e = await tradierRes.json();
        throw new Error(e.error ?? "Market data failed");
      }
      const tradierData: TradierData = await tradierRes.json();
      setStockPrice(tradierData.stockPrice ?? null);

      setStep("scoring");

      const ic = scoreIC(parsedData, tradierData);
      setResult(ic);
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStep("idle");
    setResult(null);
    setParsed(null);
    setStockPrice(null);
    setError(null);
  }, []);

  return { step, result, parsed, stockPrice, error, run, reset };
}
