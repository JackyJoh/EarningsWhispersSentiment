"use client";

import { useState } from "react";
import type { ICResult, PMCCResult, ICStep, PMCCStep, ParsedNewsletter, ParsedNewsletterPost } from "@/lib/types";
import ChecklistItem from "./ChecklistItem";
import Verdict from "./Verdict";
import StrikeRecommendation from "./StrikeRecommendation";

type ICProps = {
  mode: "ic";
  step: ICStep;
  result: ICResult | null;
  parsed: ParsedNewsletter | null;
  stockPrice: number | null;
  error: string | null;
};

type PMCCProps = {
  mode: "pmcc";
  step: PMCCStep;
  result: PMCCResult | null;
  parsed: ParsedNewsletterPost | null;
  stockPrice: number | null;
  error: string | null;
};

type Props = ICProps | PMCCProps;
type Tab = "analysis" | "positions";

const icSteps:   ICStep[]   = ["parsing", "fetching", "scoring"];
const pmccSteps: PMCCStep[] = ["parsing", "sentiment", "fetching", "scoring"];

const stepLabels: Record<string, string> = {
  parsing:   "Parsing newsletter via Claude…",
  fetching:  "Fetching market data from Tradier…",
  sentiment: "Running FinBERT sentiment…",
  scoring:   "Scoring filters…",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "analysis",  label: "Analysis"  },
  { id: "positions", label: "Positions" },
];

function DataRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="tos-row flex items-center px-4 py-3">
      <span className="text-[#777] text-sm w-44 shrink-0">{label}</span>
      <span className="font-tnum text-sm font-bold" style={{ color: valueColor ?? "#fff" }}>
        {value}
      </span>
    </div>
  );
}

export default function ResultsPanel(props: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const { step, result, parsed, stockPrice, error } = props;

  if (step === "idle") {
    return (
      <div className="flex items-center justify-center h-64 text-[#444] text-sm">
        Paste a newsletter and click Analyze to see results
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-start gap-3 px-4 py-3 bg-[#1a0000] border border-[#ff3d3d]/30 text-sm text-[#ff3d3d]">
          <span className="shrink-0 font-bold">✕</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const steps = props.mode === "ic" ? icSteps : pmccSteps;
  const isLoading = step !== "done";

  return (
    <div>
      {/* Loading progress */}
      {isLoading && (
        <>
          <div className="tos-sublabel">Progress</div>
          {steps.map((s) => {
            const idx  = steps.indexOf(step as typeof steps[number]);
            const sIdx = steps.indexOf(s as typeof steps[number]);
            const isDone   = idx > sIdx;
            const isActive = step === s;
            return (
              <div key={s} className="tos-row flex items-center gap-4 px-4 py-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  isDone   ? "bg-[#00c853]" :
                  isActive ? "bg-[#00b4ff] animate-pulse" :
                             "bg-[#333]"
                }`} />
                <span className={`text-sm ${isActive ? "text-white" : isDone ? "text-[#555]" : "text-[#3a3a3a]"}`}>
                  {stepLabels[s]}
                </span>
              </div>
            );
          })}
        </>
      )}

      {/* Tabs — only when done */}
      {result && (
        <>
          {/* Tab bar */}
          <div className="flex border-b border-[#2a2a2a] mt-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 text-xs uppercase tracking-widest transition-colors ${
                  tab === t.id
                    ? "text-[#00b4ff] border-b-2 border-[#00b4ff] -mb-px"
                    : "text-[#555] hover:text-[#888]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── ANALYSIS ── verdict + parsed data + filter checklist */}
          {tab === "analysis" && (
            <>
              {props.mode === "ic" && (
                <Verdict type="ic" approved={(result as ICResult).approved} />
              )}
              {props.mode === "pmcc" && (
                <Verdict
                  type="pmcc"
                  verdict={(result as PMCCResult).verdict}
                  score={(result as PMCCResult).score}
                  total={(result as PMCCResult).activeFilters}
                />
              )}

              {parsed && (
                <>
                  <div className="tos-sublabel">
                    Parsed — <span className="text-[#00b4ff]">{parsed.ticker}</span>
                  </div>
                  <DataRow label="Company"       value={parsed.company} />
                  <DataRow label="Whisper EPS"   value={`$${parsed.whisper_number.toFixed(2)}`}   valueColor="#00b4ff" />
                  <DataRow label="Consensus EPS" value={`$${parsed.consensus_number.toFixed(2)}`} />
                  {parsed.implied_move_pct != null && (
                    <DataRow label="Implied Move" value={`${parsed.implied_move_pct.toFixed(1)}%`} />
                  )}
                  {parsed.average_move_pct != null && (
                    <DataRow label="Avg Move" value={`${parsed.average_move_pct.toFixed(1)}%`} />
                  )}
                  {parsed.pct_expecting_beat != null && (
                    <DataRow label="% Exp. Beat" value={`${parsed.pct_expecting_beat.toFixed(0)}%`} />
                  )}
                  <DataRow label="Sentiment" value={parsed.sentiment}
                    valueColor={parsed.sentiment === "bullish" ? "#00c853" : parsed.sentiment === "bearish" ? "#ff3d3d" : "#888"}
                  />
                  {props.mode === "pmcc" && (() => {
                    const post = parsed as ParsedNewsletterPost;
                    return (
                      <>
                        <DataRow label="Grade"
                          value={post.grade}
                          valueColor={post.grade === "A+" || post.grade === "A" ? "#00c853" : post.grade === "B" ? "#ff9f00" : "#ff3d3d"}
                        />
                        <DataRow label="Beat / Miss"
                          value={post.beat_miss}
                          valueColor={post.beat_miss === "beat" ? "#00c853" : post.beat_miss === "miss" ? "#ff3d3d" : "#888"}
                        />
                        {post.guidance_tone && (
                          <DataRow label="Guidance"
                            value={post.guidance_tone}
                            valueColor={post.guidance_tone === "raised" ? "#00c853" : post.guidance_tone === "lowered" ? "#ff3d3d" : "#888"}
                          />
                        )}
                      </>
                    );
                  })()}
                  {stockPrice && (
                    <DataRow label="Stock Price" value={`$${stockPrice.toFixed(2)}`} valueColor="#00b4ff" />
                  )}
                </>
              )}

              <div className="tos-sublabel">Filter Checklist</div>
              <div className="flex items-center gap-4 px-4 py-2 border-b border-[#2a2a2a]">
                <div className="w-2.5 shrink-0" />
                <span className="flex-1 text-[10px] uppercase tracking-widest text-[#444]">Filter</span>
                <span className="w-32 text-right text-[10px] uppercase tracking-widest text-[#444]">Value</span>
                <span className="w-28 text-right text-[10px] uppercase tracking-widest text-[#444]">Threshold</span>
              </div>
              {result.filters.map((f, i) => (
                <ChecklistItem key={i} item={f} />
              ))}
            </>
          )}

          {/* ── POSITIONS ── strike table + P&L */}
          {tab === "positions" && parsed && (
            <div className="mt-2">
              {props.mode === "ic" && (() => {
                const s = (result as ICResult).strikes;
                return (
                  <>
                    {s && <StrikeRecommendation type="ic" strikes={s} ticker={parsed.ticker} />}
                    {s && (
                      <>
                        <div className="tos-sublabel">P&L Summary</div>
                        <DataRow label="Credit Collected"  value={`$${s.maxProfit.toFixed(0)}/contract`} valueColor="#00b4ff" />
                        <DataRow label="Max Profit"        value={`$${s.maxProfit.toFixed(0)}`}          valueColor="#00c853" />
                        <DataRow label="Max Loss"          value={`$${s.maxLoss.toFixed(0)}`}            valueColor="#ff3d3d" />
                        <DataRow label="Upper Breakeven"   value={`$${s.breakevenUpper.toFixed(2)}`}     valueColor="#ff9f00" />
                        <DataRow label="Lower Breakeven"   value={`$${s.breakevenLower.toFixed(2)}`}     valueColor="#ff9f00" />
                        <DataRow label="Profit Zone Width" value={`$${(s.breakevenUpper - s.breakevenLower).toFixed(2)}`} valueColor="#aaa" />
                        <DataRow label="Wing Width"        value={`$${s.wing}`}                          valueColor="#888" />
                    {(() => {
                      const contracts = Math.ceil(100 / s.maxProfit);
                      if (contracts <= 1) return null;
                      return (
                        <DataRow
                          label="Suggested Contracts"
                          value={`${contracts}× → $${(contracts * s.maxProfit).toFixed(0)} credit / $${(contracts * s.maxLoss).toFixed(0)} max loss`}
                          valueColor="#ff9f00"
                        />
                      );
                    })()}
                      </>
                    )}
                  </>
                );
              })()}
              {props.mode === "pmcc" && stockPrice && (
                <StrikeRecommendation
                  type="pmcc"
                  strikes={(result as PMCCResult).strikes}
                  ticker={parsed.ticker}
                  stockPrice={stockPrice}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
