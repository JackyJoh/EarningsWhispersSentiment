# EW Trade Checker

A tool for evaluating options setups around earnings using [Earnings Whispers](https://www.earningswhispers.com/) newsletters. Paste a newsletter, get a structured go/no-go verdict with strike suggestions and P&L projections.

Two strategies supported: **Iron Condor** (pre-earnings) and **PMCC** (post-earnings).

---

## Iron Condor

An Iron Condor sells premium on both sides of the market, betting the stock won't move dramatically. You collect a credit upfront and keep it if the stock stays within your range at expiration.

This works best when implied volatility is elevated (options are expensive to sell) but the actual move is likely to be contained. Earnings events create that setup - but only when the conditions are right.

### What the filters check

**Whisper vs. Consensus Gap < 3%**
The "whisper number" is the street's unofficial EPS expectation - often higher than the published consensus. A large gap between the two means there's genuine disagreement about what counts as a beat. That uncertainty increases the chance of a surprise move in either direction, which is bad for an IC.

**Implied Move > Historical Average**
The options market is pricing in a larger-than-usual move. When current implied volatility exceeds the stock's average earnings move, you're collecting more premium than history suggests you need - that's the edge. If implied move is below historical average, the market is complacent and you're not being paid enough to take the risk.

**Straddle Prices In Claimed Move**
Cross-checks whether the live ATM straddle is actually pricing the move the newsletter claims. If IV has deflated since the newsletter was published, the straddle may be pricing a smaller move than stated - meaning the setup has already deteriorated.

**Risk/Reward - Max Loss ≤ 4× Profit**
Ensures the spread width is proportional to the credit collected. A wide wing with thin premium means a catastrophic loss on a real move relative to what you stood to gain. This filter enforces a minimum acceptable risk/reward ratio.

---

## PMCC (Poor Man's Covered Call)

A PMCC buys a deep in-the-money LEAPS call (acting as a stock substitute) and sells shorter-dated OTM calls against it each month to collect premium. The goal is bullish participation at a lower cost than buying shares, with recurring income to reduce the cost basis over time.

This works best when the stock has just reported strong earnings and has clear upward momentum. The post-earnings print is the entry signal.

### What the filters check

**Post-Earnings Grade A, A-, or A+**
Earnings Whispers assigns a letter grade to each report based on the quality of the beat relative to expectations. A strong grade means the company delivered - not just technically beat, but beat in a way the market cares about. Lower grades suggest a weak or messy print that may not hold the stock up.

**Post-Earnings Sentiment Positive (>60%)**
Runs the post-earnings newsletter text through FinBERT, a financial language model. Checks whether the language reads as genuinely positive - not just the numbers, but the tone around guidance, management commentary, and market reaction. Filters out setups where the numbers look fine but the narrative is uncertain.

**Pre-Earnings Sentiment Positive** *(optional - skipped if no pre-earnings text provided)*
Same FinBERT analysis on the pre-earnings newsletter. A bullish setup going into earnings adds confidence that the move was expected and earned, not a one-day spike into resistance. If pre-earnings text isn't available, this filter is marked N/A and scoring adjusts accordingly.

**Stock Price Above 200 DMA**
A stock trading below its 200-day moving average is in a structural downtrend. A PMCC requires the stock to trend up over the LEAPS duration - selling calls into a downtrend is fighting the tape. This is a hard momentum filter.

**Guidance Raised or Maintained**
Forward guidance matters more than the current quarter's beat. A company that beat but lowered guidance is telling the market growth is slowing - that's a ceiling on the stock price, which undermines the LEAPS upside thesis. Raised or maintained guidance is required.

---

## Data sources

- **Newsletter parsing** - Claude (Anthropic) extracts structured fields from pasted newsletter text
- **Sentiment analysis** - FinBERT (`ProsusAI/finbert`) via HuggingFace Inference API
- **Market data** - Tradier API (live quotes, option chains, price history)
