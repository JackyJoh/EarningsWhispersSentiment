"use client";

import { useState, useCallback } from "react";
import { scorePMCC } from "@/lib/pmccScorer";
import type {
  PMCCResult,
  PMCCStep,
  ParsedNewsletterPost,
  Sentiment,
  TradierData,
} from "@/lib/types";

export function usePMCCCheck() {
  const [step, setStep]           = useState<PMCCStep>("idle");
  const [result, setResult]       = useState<PMCCResult | null>(null);
  const [parsed, setParsed]       = useState<ParsedNewsletterPost | null>(null);
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const run = useCallback(async (preText: string, postText: string) => {
    setStep("parsing");
    setResult(null);
    setParsed(null);
    setStockPrice(null);
    setError(null);

    const hasPreText = preText.trim().length > 0;

    try {
      // Always parse post; optionally parse pre in parallel
      const parsePromises: [Promise<Response>, Promise<Response> | null] = [
        fetch("/api/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: postText, mode: "post" }),
        }),
        hasPreText
          ? fetch("/api/parse", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: preText, mode: "ic" }),
            })
          : null,
      ];

      const [postRes, preRes] = await Promise.all(parsePromises);

      if (!postRes.ok) {
        const e = await postRes.json();
        throw new Error(e.error ?? "Post-earnings parse failed");
      }
      if (preRes && !preRes.ok) {
        const e = await preRes.json();
        throw new Error(e.error ?? "Pre-earnings parse failed");
      }

      const postData: ParsedNewsletterPost = await postRes.json();
      setParsed(postData);

      setStep("sentiment");

      // Always run post sentiment; optionally run pre sentiment in parallel
      const sentPromises: [Promise<Response>, Promise<Response> | null] = [
        fetch("/api/sentiment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: postText }),
        }),
        hasPreText
          ? fetch("/api/sentiment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: preText }),
            })
          : null,
      ];

      const [postSentRes, preSentRes] = await Promise.all(sentPromises);

      if (!postSentRes.ok) {
        const e = await postSentRes.json().catch(() => ({}));
        throw new Error(e.error ?? "Post-earnings sentiment failed");
      }
      if (preSentRes && !preSentRes.ok) {
        const e = await preSentRes.json().catch(() => ({}));
        throw new Error(e.error ?? "Pre-earnings sentiment failed");
      }

      const postSentiment: Sentiment = await postSentRes.json();
      const preSentiment: Sentiment | null = preSentRes ? await preSentRes.json() : null;

      setStep("fetching");

      const tradierRes = await fetch("/api/tradier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: postData.ticker, need: ["quote", "dma200", "pmcc_prices"] }),
      });
      if (!tradierRes.ok) {
        const e = await tradierRes.json();
        throw new Error(e.error ?? "Market data failed");
      }
      const tradierData: TradierData = await tradierRes.json();
      setStockPrice(tradierData.stockPrice ?? null);

      setStep("scoring");

      const pmcc = scorePMCC(postData, preSentiment, postSentiment, tradierData);
      setResult(pmcc);
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
