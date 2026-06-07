import type {
  ParsedNewsletterPost,
  TradierData,
  Sentiment,
  PMCCResult,
  PMCCVerdict,
  PMCCFilter,
} from "./types";

export function scorePMCC(
  post: ParsedNewsletterPost,
  preSentiment: Sentiment | null,
  postSentiment: Sentiment,
  tradier: TradierData
): PMCCResult {
  const { stockPrice, dma200 } = tradier;

  const f1 = post.grade !== null && (post.grade === "A+" || post.grade === "A" || post.grade === "A-");
  const f4 = dma200 !== undefined ? stockPrice > dma200 : false;
  const f5 =
    post.guidance_tone === "raised" || post.guidance_tone === "maintained";

  const f2 = postSentiment.label === "positive" && postSentiment.score > 0.6;

  const f3Filter: PMCCFilter =
    preSentiment !== null
      ? {
          label: "Pre-Earnings Sentiment Positive",
          pass: preSentiment.label === "positive",
          value: preSentiment.label,
          threshold: "positive",
        }
      : { label: "Pre-Earnings Sentiment Positive", pass: false, na: true, value: "—", threshold: "No pre-earnings data" };

  const filters: PMCCFilter[] = [
    {
      label: "Post-Earnings Grade A or A+",
      pass: f1,
      value: post.grade ?? "—",
      threshold: "A+, A, or A-",
    },
    {
      label: "Post-Earnings Sentiment Positive (>60%)",
      pass: f2,
      value: `${postSentiment.label} ${(postSentiment.score * 100).toFixed(0)}%`,
      threshold: "positive > 60%",
    },
    f3Filter,
    {
      label: "Stock Price Above 200 DMA",
      pass: f4,
      value:
        dma200 !== undefined
          ? `$${stockPrice.toFixed(2)} vs $${dma200.toFixed(2)}`
          : "N/A",
      threshold: "price > 200 DMA",
    },
    {
      label: "Guidance Raised or Maintained",
      pass: f5,
      value: post.guidance_tone ?? "null",
      threshold: "raised or maintained",
    },
  ];

  const activeFilters = filters.filter((f) => !f.na).length;
  const score = filters.filter((f) => !f.na && f.pass).length;

  // Thresholds scale with active filter count:
  // 5 filters: STRONG ≥4, WEAK ≥3   (ceil(5×0.75)=4, ceil(5×0.5)=3)
  // 4 filters: STRONG ≥3, WEAK ≥2   (ceil(4×0.75)=3, ceil(4×0.5)=2)
  const strongThreshold = Math.ceil(activeFilters * 0.75);
  const weakThreshold   = Math.ceil(activeFilters * 0.5);

  const verdict: PMCCVerdict =
    score >= strongThreshold ? "STRONG" : score >= weakThreshold ? "WEAK" : "AVOID";

  const leapsStrike     = Math.floor(stockPrice * 0.85);
  const shortCallStrike = Math.ceil(stockPrice * 1.06);

  const leapsAsk      = tradier.leapsAsk;
  const shortCallMid  = tradier.shortCallMid;
  const leapsDTE      = tradier.leapsDTE;
  const netDebit      = leapsAsk !== undefined && shortCallMid !== undefined
    ? leapsAsk - shortCallMid : undefined;
  const breakeven     = netDebit !== undefined ? leapsStrike + netDebit : undefined;
  const monthlyIncome = shortCallMid !== undefined ? shortCallMid * 100 : undefined;

  return {
    verdict,
    score,
    activeFilters,
    filters,
    strikes: { leapsStrike, shortCallStrike, leapsAsk, shortCallMid, netDebit, breakeven, monthlyIncome, leapsDTE },
  };
}
