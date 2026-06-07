import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.TRADIER_BASE_URL ?? "https://sandbox.tradier.com";
const TOKEN = process.env.TRADIER_API_KEY ?? "";

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/json",
};

async function getQuote(ticker: string): Promise<number> {
  const url = `${BASE}/v1/markets/quotes?symbols=${encodeURIComponent(ticker)}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Tradier quote failed: ${res.status}`);
  const data = await res.json();
  const quote = data?.quotes?.quote;
  const last = Array.isArray(quote) ? quote[0]?.last : quote?.last;
  if (!last) throw new Error(`No price found for ${ticker}`);
  return Number(last);
}

interface StraddleResult {
  straddlePrice: number;
  icNetCredit?: number;
}

function findNearestOption(
  options: Array<{ option_type: string; strike: number; bid: number; ask: number }>,
  type: string,
  targetStrike: number
) {
  return options
    .filter((o) => o.option_type === type)
    .reduce((best, o) =>
      Math.abs(o.strike - targetStrike) < Math.abs(best.strike - targetStrike) ? o : best
    );
}

async function getStraddle(
  ticker: string,
  stockPrice: number,
  impliedMovePct?: number
): Promise<StraddleResult> {
  const expUrl = `${BASE}/v1/markets/options/expirations?symbol=${encodeURIComponent(ticker)}&includeAllRoots=true`;
  const expRes = await fetch(expUrl, { headers });
  if (!expRes.ok) throw new Error(`Tradier expirations failed: ${expRes.status}`);
  const expData = await expRes.json();

  const expirations: string[] =
    expData?.expirations?.date ?? [];
  if (!expirations.length) throw new Error(`No option expirations found for ${ticker}`);

  const today = new Date();
  const nearest = expirations
    .filter((d) => new Date(d) > today)
    .sort()[0];

  if (!nearest) throw new Error(`No future expiration found for ${ticker}`);

  const chainUrl = `${BASE}/v1/markets/options/chains?symbol=${encodeURIComponent(ticker)}&expiration=${nearest}&greeks=false`;
  const chainRes = await fetch(chainUrl, { headers });
  if (!chainRes.ok) throw new Error(`Tradier chain failed: ${chainRes.status}`);
  const chainData = await chainRes.json();

  const options: Array<{
    option_type: string;
    strike: number;
    bid: number;
    ask: number;
  }> = chainData?.options?.option ?? [];

  if (!options.length) throw new Error(`No options in chain for ${ticker} on ${nearest}`);

  const strikesSorted = [...new Set(options.map((o) => o.strike))].sort(
    (a, b) => Math.abs(a - stockPrice) - Math.abs(b - stockPrice)
  );
  const atmStrike = strikesSorted[0];

  const call = options.find((o) => o.option_type === "call" && o.strike === atmStrike);
  const put = options.find((o) => o.option_type === "put" && o.strike === atmStrike);

  if (!call || !put) throw new Error(`ATM strike ${atmStrike} missing call or put`);

  const straddlePrice = (call.bid + call.ask) / 2 + (put.bid + put.ask) / 2;

  // Compute actual IC net credit by looking up OTM leg prices in the same chain
  let icNetCredit: number | undefined;
  if (impliedMovePct !== undefined) {
    const im = impliedMovePct;
    const wing = Math.round(stockPrice * 0.05);
    const shortCallTarget = Math.ceil(stockPrice * (1 + im / 100));
    const shortPutTarget  = Math.floor(stockPrice * (1 - im / 100));
    const longCallTarget  = shortCallTarget + wing;
    const longPutTarget   = shortPutTarget  - wing;

    const shortCallOpt = findNearestOption(options, "call", shortCallTarget);
    const longCallOpt  = findNearestOption(options, "call", longCallTarget);
    const shortPutOpt  = findNearestOption(options, "put",  shortPutTarget);
    const longPutOpt   = findNearestOption(options, "put",  longPutTarget);

    const mid = (o: typeof options[0]) => (o.bid + o.ask) / 2;
    icNetCredit = Math.max(0, (mid(shortCallOpt) - mid(longCallOpt)) + (mid(shortPutOpt) - mid(longPutOpt)));
  }

  return { straddlePrice, icNetCredit };
}

async function getDMA200(ticker: string): Promise<number> {
  const url = `${BASE}/v1/markets/history?symbol=${encodeURIComponent(ticker)}&interval=daily`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Tradier history failed: ${res.status}`);
  const data = await res.json();

  const days: Array<{ close: number }> = data?.history?.day ?? [];
  if (!days.length) throw new Error(`No historical data for ${ticker}`);

  const last200 = days.slice(-200);
  const avg = last200.reduce((sum, d) => sum + Number(d.close), 0) / last200.length;
  return avg;
}

export async function POST(req: NextRequest) {
  try {
    const { ticker, need, impliedMovePct } = await req.json() as {
      ticker: string;
      need: Array<"quote" | "straddle" | "dma200">;
      impliedMovePct?: number;
    };

    if (!ticker || !need?.length) {
      return NextResponse.json({ error: "Missing ticker or need" }, { status: 400 });
    }

    const result: { stockPrice?: number; straddlePrice?: number; dma200?: number; icNetCredit?: number } = {};

    if (need.includes("quote") || need.includes("straddle")) {
      result.stockPrice = await getQuote(ticker);
    }

    if (need.includes("straddle") && result.stockPrice !== undefined) {
      const straddleResult = await getStraddle(ticker, result.stockPrice, impliedMovePct);
      result.straddlePrice = straddleResult.straddlePrice;
      if (straddleResult.icNetCredit !== undefined) {
        result.icNetCredit = straddleResult.icNetCredit;
      }
    }

    if (need.includes("dma200")) {
      result.dma200 = await getDMA200(ticker);
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("/api/tradier error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
