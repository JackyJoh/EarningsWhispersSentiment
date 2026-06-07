"use client";

import { useState, useEffect } from "react";
import type { AppMode } from "@/lib/types";
import type { Tab } from "@/components/ResultsPanel";
import ModeToggle from "@/components/ModeToggle";
import NewsletterInput from "@/components/NewsletterInput";
import ResultsPanel from "@/components/ResultsPanel";
import { useICCheck } from "@/hooks/useICCheck";
import { usePMCCCheck } from "@/hooks/usePMCCCheck";

type MobileView = "input" | "analysis" | "positions";

export default function Home() {
  const [mode, setMode]           = useState<AppMode>("ic");
  const [icText, setIcText]       = useState("");
  const [preText, setPreText]     = useState("");
  const [postText, setPostText]   = useState("");
  const [resultsTab, setResultsTab] = useState<Tab>("analysis");
  const [mobileView, setMobileView] = useState<MobileView>("input");

  const ic   = useICCheck();
  const pmcc = usePMCCCheck();

  const currentStep = mode === "ic" ? ic.step : pmcc.step;

  const isLoading =
    currentStep !== "idle" && currentStep !== "done" && currentStep !== "error";

  // Auto-navigate to analysis on mobile when result arrives
  useEffect(() => {
    if (currentStep === "done") {
      setMobileView("analysis");
      setResultsTab("analysis");
    }
  }, [currentStep]);

  const handleMobileNav = (view: MobileView) => {
    setMobileView(view);
    if (view === "analysis" || view === "positions") {
      setResultsTab(view);
    }
  };

  const resultsProps =
    mode === "ic"
      ? { mode: "ic" as const, step: ic.step, result: ic.result, parsed: ic.parsed, stockPrice: ic.stockPrice, error: ic.error }
      : { mode: "pmcc" as const, step: pmcc.step, result: pmcc.result, parsed: pmcc.parsed, stockPrice: pmcc.stockPrice, error: pmcc.error };

  const inputEl =
    mode === "ic" ? (
      <NewsletterInput mode="ic" text={icText} onTextChange={setIcText} onSubmit={() => ic.run(icText)} loading={isLoading} />
    ) : (
      <NewsletterInput mode="pmcc" preText={preText} postText={postText} onPreChange={setPreText} onPostChange={setPostText} onSubmit={() => pmcc.run(preText, postText)} loading={isLoading} />
    );

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">

      {/* ── Header ── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 md:px-5 bg-[#141414] border-b border-[#2a2a2a] h-16 md:h-20 relative z-10"
        style={{ borderTop: "3px solid #00b4ff", boxShadow: "0 6px 16px rgba(0,0,0,0.8)" }}
      >
        <svg className="w-6 h-6 md:w-7 md:h-7 text-[#00b4ff] shrink-0" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a1 1 0 0 1 1 1v4.586l3.243-3.243a1 1 0 1 1 1.414 1.414L14.414 9H19a1 1 0 0 1 0 2h-4.586l3.243 3.243a1 1 0 0 1-1.414 1.414L13 12.414V17a1 1 0 0 1-2 0v-4.586l-3.243 3.243a1 1 0 0 1-1.414-1.414L9.586 11H5a1 1 0 0 1 0-2h4.586L6.343 5.757a1 1 0 0 1 1.414-1.414L11 7.586V3a1 1 0 0 1 1-1z"/>
        </svg>
        <div className="flex flex-col">
          <span className="font-bold text-white text-base md:text-lg tracking-tight leading-tight">EW Trade Checker</span>
          <span className="flex items-center gap-1.5 text-xs text-[#00c853]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] inline-block" />
            Sandbox
          </span>
        </div>

        {/* Mobile: IC / PMCC pill toggle */}
        <div className="md:hidden ml-auto flex items-center bg-[#1a1a1a] rounded-full p-1 border border-[#2a2a2a]">
          {(["ic", "pmcc"] as AppMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-colors ${
                mode === m ? "bg-[#00b4ff] text-white" : "text-[#555]"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      {/* ── Mobile layout ── */}
      <div className="md:hidden flex-1 overflow-y-auto select-text p-4">
        {mobileView === "input" ? (
          inputEl
        ) : (
          <ResultsPanel
            {...resultsProps}
            tab={resultsTab}
            onTabChange={(t) => { setResultsTab(t); setMobileView(t); }}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden shrink-0 flex border-t border-[#2a2a2a] bg-[#141414]">
        {([
          {
            id: "input" as MobileView,
            label: "Input",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
            ),
          },
          {
            id: "analysis" as MobileView,
            label: "Analysis",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
              </svg>
            ),
          },
          {
            id: "positions" as MobileView,
            label: "Positions",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            ),
          },
        ]).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => handleMobileNav(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
              mobileView === id ? "text-[#00b4ff]" : "text-[#555]"
            }`}
          >
            {icon}
            <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
          </button>
        ))}
      </nav>

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[70px] shrink-0 bg-[#141414] border-r border-[#2a2a2a] flex flex-col">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Input panel */}
        <div className="w-[400px] shrink-0 flex flex-col border-r border-[#2a2a2a]">
          <div className="tos-header">
            <svg className="w-3.5 h-3.5 text-[#00b4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            Newsletter Input
          </div>
          <div className="flex-1 overflow-hidden p-4 flex flex-col select-text">
            {inputEl}
          </div>
        </div>

        {/* Results panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="tos-header">
            <svg className="w-3.5 h-3.5 text-[#00b4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Analysis Results
          </div>
          <div className="flex-1 overflow-y-auto select-text">
            <ResultsPanel
              {...resultsProps}
              tab={resultsTab}
              onTabChange={setResultsTab}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
