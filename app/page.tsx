"use client";

import { useState } from "react";
import ModeToggle from "@/components/ModeToggle";
import NewsletterInput from "@/components/NewsletterInput";
import ResultsPanel from "@/components/ResultsPanel";
import { useICCheck } from "@/hooks/useICCheck";
import { usePMCCCheck } from "@/hooks/usePMCCCheck";
import type { AppMode } from "@/lib/types";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("ic");
  const [icText, setIcText] = useState("");
  const [preText, setPreText] = useState("");
  const [postText, setPostText] = useState("");

  const ic = useICCheck();
  const pmcc = usePMCCCheck();

  const isLoading =
    mode === "ic"
      ? ic.step !== "idle" && ic.step !== "done" && ic.step !== "error"
      : pmcc.step !== "idle" && pmcc.step !== "done" && pmcc.step !== "error";

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] text-white select-none">
      {/* Top nav bar */}
      <header className="shrink-0 flex items-center gap-4 px-5 bg-[#141414] border-b border-[#2a2a2a] h-20 relative z-10" style={{ borderTop: '3px solid #00b4ff', boxShadow: '0 6px 16px rgba(0,0,0,0.8)' }}>
        <svg className="w-7 h-7 text-[#00b4ff]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2a1 1 0 0 1 1 1v4.586l3.243-3.243a1 1 0 1 1 1.414 1.414L14.414 9H19a1 1 0 0 1 0 2h-4.586l3.243 3.243a1 1 0 0 1-1.414 1.414L13 12.414V17a1 1 0 0 1-2 0v-4.586l-3.243 3.243a1 1 0 0 1-1.414-1.414L9.586 11H5a1 1 0 0 1 0-2h4.586L6.343 5.757a1 1 0 0 1 1.414-1.414L11 7.586V3a1 1 0 0 1 1-1z"/>
        </svg>
        <div className="flex flex-col">
          <span className="font-bold text-white text-lg tracking-tight leading-tight">EW Trade Checker</span>
          <span className="flex items-center gap-1.5 text-xs text-[#00c853]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c853] inline-block" />
            Sandbox
          </span>
        </div>
      </header>

      {/* Main panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Vertical sidebar nav */}
        <div className="w-[70px] shrink-0 bg-[#141414] border-r border-[#2a2a2a] flex flex-col">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {/* Left — input */}
        <div className="w-[400px] shrink-0 flex flex-col border-r border-[#2a2a2a]">
          <div className="tos-header">
            <svg className="w-3.5 h-3.5 text-[#00b4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Newsletter Input
          </div>
          <div className="flex-1 overflow-hidden p-4 flex flex-col select-text">
            {mode === "ic" ? (
              <NewsletterInput
                mode="ic"
                text={icText}
                onTextChange={setIcText}
                onSubmit={() => ic.run(icText)}
                loading={isLoading}
              />
            ) : (
              <NewsletterInput
                mode="pmcc"
                preText={preText}
                postText={postText}
                onPreChange={setPreText}
                onPostChange={setPostText}
                onSubmit={() => pmcc.run(preText, postText)}
                loading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Right — results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="tos-header">
            <svg className="w-3.5 h-3.5 text-[#00b4ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Analysis Results
          </div>
          <div className="flex-1 overflow-y-auto select-text">
            {mode === "ic" ? (
              <ResultsPanel
                mode="ic"
                step={ic.step}
                result={ic.result}
                parsed={ic.parsed}
                stockPrice={ic.stockPrice}
                error={ic.error}
              />
            ) : (
              <ResultsPanel
                mode="pmcc"
                step={pmcc.step}
                result={pmcc.result}
                parsed={pmcc.parsed}
                stockPrice={pmcc.stockPrice}
                error={pmcc.error}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
