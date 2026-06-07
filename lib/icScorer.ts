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

  const approved = f1 && f2 && f3;

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
  ];

  let strikes: ICStrikes | null = null;
  if (straddlePrice !== undefined) {
    const price = stockPrice;
    // Use actual OTM leg prices if available; ATM straddle/2 is a fallback only
    const premium = tradier.icNetCredit ?? straddlePrice / 2;

    const shortCall = Math.ceil(price * (1 + im / 100));
    const shortPut  = Math.floor(price * (1 - im / 100));
    const wing      = Math.round(price * 0.05);
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
