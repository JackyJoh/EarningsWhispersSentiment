import type { ParsedNewsletter, TradierData, ICResult, ICStrikes } from "./types";

export function scoreIC(
  parsed: ParsedNewsletter,
  tradier: TradierData
): ICResult {
  const { whisper_number, consensus_number, implied_move_pct, average_move_pct } = parsed;
  const { stockPrice, straddlePrice } = tradier;

  // IC mode always has these values from pre-earnings newsletters; null only in post-only PMCC context
  const im  = implied_move_pct  ?? 0;
  const avg = average_move_pct  ?? 0;

  const whisperGap = Math.abs(
    ((whisper_number - consensus_number) / consensus_number) * 100
  );
  const f1 = whisperGap < 3.0;

  const f2 = im - avg > 0;

  const sp = straddlePrice ?? 0;
  // Checks if the live ATM straddle is pricing at least the implied move stated in the newsletter.
  // If straddle/price < im, IV has deflated since the newsletter — unfavorable for selling premium.
  const straddleAsPct = (sp / stockPrice) * 100;
  const f3 = straddleAsPct >= im;

  // Pre-compute wing and premium so F4 can use them
  const wing    = Math.round(stockPrice * 0.05);
  const premium = straddlePrice !== undefined
    ? (tradier.icNetCredit ?? straddlePrice / 2)
    : 0;

  const lossToProfit = premium > 0 ? (wing - premium) / premium : Infinity;
  const f4 = straddlePrice !== undefined && premium > 0 && lossToProfit <= 4;

  const approved = f1 && f2 && f3 && f4;

  const filters = [
    {
      label: "Whisper vs Consensus Gap < 3%",
      pass: f1,
      value: `${whisperGap.toFixed(2)}%`,
      threshold: "< 3.00%",
    },
    {
      label: "Implied Move > Historical Avg",
      pass: f2,
      value: `${im.toFixed(1)}% vs ${avg.toFixed(1)}%`,
      threshold: "IM > Avg",
    },
    {
      label: "Straddle Prices In Claimed Move",
      pass: f3,
      value: `${straddleAsPct.toFixed(1)}% vs ${im.toFixed(1)}% IM`,
      threshold: "≥ implied move",
    },
    {
      label: "Risk/Reward — Max Loss ≤ 4× Profit",
      pass: f4,
      value: straddlePrice !== undefined && premium > 0
        ? `${lossToProfit.toFixed(1)}× loss/profit`
        : "N/A",
      threshold: "≤ 4× loss/profit",
    },
  ];

  let strikes: ICStrikes | null = null;
  if (straddlePrice !== undefined) {
    const shortCall = Math.ceil(stockPrice * (1 + im / 100));
    const shortPut  = Math.floor(stockPrice * (1 - im / 100));
    const longCall  = shortCall + wing;
    const longPut   = shortPut  - wing;

    const breakevenUpper = shortCall + premium;
    const breakevenLower = shortPut  - premium;
    const maxProfit = premium * 100;
    const maxLoss   = (wing - premium) * 100;

    strikes = {
      shortCall,
      shortPut,
      longCall,
      longPut,
      premium,
      breakevenUpper,
      breakevenLower,
      maxProfit,
      maxLoss,
      wing,
    };
  }

  return { approved, filters, strikes };
}
