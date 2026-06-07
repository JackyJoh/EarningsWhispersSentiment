import type { ICStrikes, PMCCStrikes } from "@/lib/types";

function ColHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-[#555] font-semibold border-b border-[#2a2a2a] bg-[#111]">
      {children}
    </th>
  );
}

function Cell({ value, color }: { value: string; color?: string }) {
  return (
    <td className="px-4 py-3 font-tnum text-sm font-semibold" style={{ color: color ?? "#ffffff" }}>
      {value}
    </td>
  );
}

type ICProps   = { type: "ic";   strikes: ICStrikes;   ticker: string };
type PMCCProps = { type: "pmcc"; strikes: PMCCStrikes; ticker: string; stockPrice: number; section?: "strikes" | "pnl" };
type Props = ICProps | PMCCProps;

export default function StrikeRecommendation(props: Props) {
  if (props.type === "ic") {
    const { strikes, ticker } = props;
    return (
      <div>
        <div className="tos-header text-sm">
          <span className="text-[#00b4ff]">◈</span>
          {ticker} — Iron Condor Strikes
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <ColHeader>Side</ColHeader>
              <ColHeader>Long</ColHeader>
              <ColHeader>Short</ColHeader>
              <ColHeader>Wing</ColHeader>
              <ColHeader>Premium</ColHeader>
              <ColHeader>Breakeven</ColHeader>
              <ColHeader>Max Profit</ColHeader>
              <ColHeader>Max Loss</ColHeader>
            </tr>
          </thead>
          <tbody>
            <tr className="tos-row">
              <td className="px-4 py-3 text-sm text-[#ff3d3d] font-bold">CALL</td>
              <Cell value={`$${strikes.longCall}`}  color="#777" />
              <Cell value={`$${strikes.shortCall}`} />
              <Cell value={`$${strikes.wing}`}      color="#888" />
              <Cell value={`$${strikes.premium.toFixed(2)}`}        color="#00b4ff" />
              <Cell value={`$${strikes.breakevenUpper.toFixed(2)}`} color="#ff9f00" />
              <Cell value={`$${strikes.maxProfit.toFixed(0)}`}      color="#00c853" />
              <Cell value={`$${strikes.maxLoss.toFixed(0)}`}        color="#ff3d3d" />
            </tr>
            <tr className="tos-row">
              <td className="px-4 py-3 text-sm text-[#00c853] font-bold">PUT</td>
              <Cell value={`$${strikes.longPut}`}  color="#777" />
              <Cell value={`$${strikes.shortPut}`} />
              <Cell value={`$${strikes.wing}`}     color="#888" />
              <Cell value={`$${strikes.premium.toFixed(2)}`}        color="#00b4ff" />
              <Cell value={`$${strikes.breakevenLower.toFixed(2)}`} color="#ff9f00" />
              <td /><td />
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  const { strikes, ticker, stockPrice, section } = props;
  const { leapsAsk, shortCallMid, netDebit, breakeven, monthlyIncome } = strikes;
  const hasPricing  = leapsAsk !== undefined && shortCallMid !== undefined;
  const showStrikes = !section || section === "strikes";
  const showPnL     = !section || section === "pnl";
  const cycles      = strikes.leapsDTE !== undefined ? Math.floor(strikes.leapsDTE / 35) : null;

  return (
    <div>
      {showStrikes && (
        <>
          <div className="tos-header text-sm">
            <span className="text-[#00b4ff]">◈</span>
            {ticker} — PMCC Strike Suggestion
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <ColHeader>Leg</ColHeader>
                <ColHeader>Type</ColHeader>
                <ColHeader>Strike</ColHeader>
                <ColHeader>vs Price</ColHeader>
                {hasPricing && <ColHeader>Price</ColHeader>}
                <ColHeader>Note</ColHeader>
              </tr>
            </thead>
            <tbody>
              <tr className="tos-row">
                <td className="px-4 py-3 text-sm text-[#00b4ff] font-bold">LONG</td>
                <td className="px-4 py-3 text-sm text-[#aaa]">LEAPS Call</td>
                <Cell value={`$${strikes.leapsStrike}`} />
                <Cell value={`${((strikes.leapsStrike / stockPrice - 1) * 100).toFixed(1)}%`} color="#888" />
                {hasPricing && <Cell value={`$${leapsAsk!.toFixed(2)} ask`} color="#ff3d3d" />}
                <td className="px-4 py-3 text-sm text-[#555]">~85% of price · deep ITM</td>
              </tr>
              <tr className="tos-row">
                <td className="px-4 py-3 text-sm text-[#ff9f00] font-bold">SHORT</td>
                <td className="px-4 py-3 text-sm text-[#aaa]">Call (~30d)</td>
                <Cell value={`$${strikes.shortCallStrike}`} />
                <Cell value={`+${((strikes.shortCallStrike / stockPrice - 1) * 100).toFixed(1)}%`} color="#888" />
                {hasPricing && <Cell value={`$${shortCallMid!.toFixed(2)} mid`} color="#00c853" />}
                <td className="px-4 py-3 text-sm text-[#555]">~106% of price · OTM</td>
              </tr>
              <tr className="tos-row">
                <td className="px-4 py-3 text-sm text-[#444] font-bold">REF</td>
                <td className="px-4 py-3 text-sm text-[#aaa]">Stock</td>
                <Cell value={`$${stockPrice.toFixed(2)}`} color="#00b4ff" />
                <td />
                {hasPricing && <td />}
                <td className="px-4 py-3 text-sm text-[#555]">current price</td>
              </tr>
            </tbody>
          </table>
        </>
      )}

      {showPnL && !hasPricing && (
        <div className="px-4 py-6 text-[#444] text-sm">Pricing data unavailable — Tradier returned no option quotes.</div>
      )}

      {showPnL && hasPricing && (
        <>
          <div className="tos-sublabel">Cost &amp; P&amp;L</div>
          <div className="tos-row flex items-center px-4 py-3 gap-8">
            <div className="flex flex-col">
              <span className="text-[#555] text-xs uppercase tracking-wider mb-0.5">Net Debit</span>
              <span className="font-tnum font-bold text-sm text-[#ff3d3d]">
                ${(netDebit! * 100).toFixed(0)}
              </span>
              <span className="text-[10px] text-[#444]">initial cost per contract</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[#555] text-xs uppercase tracking-wider mb-0.5">Break-even</span>
              <span className="font-tnum font-bold text-sm text-[#ff9f00]">
                ${breakeven!.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#444]">raw · at LEAPS expiry</span>
              {cycles !== null && (
                <span className="text-[10px] text-[#00c853] mt-0.5">
                  ${(breakeven! - (monthlyIncome! * 0.75 * cycles) / 100).toFixed(2)} after base premium
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[#555] text-xs uppercase tracking-wider mb-0.5">Full Premium</span>
              <span className="font-tnum font-bold text-sm text-[#00c853]">
                ${monthlyIncome!.toFixed(0)}/cycle
              </span>
              <span className="text-[10px] text-[#444]">30d short call at mid</span>
            </div>
            {cycles !== null && (
              <div className="flex flex-col">
                <span className="text-[#555] text-xs uppercase tracking-wider mb-0.5">Cycles Available</span>
                <span className="font-tnum font-bold text-sm text-[#aaa]">
                  ~{cycles} cycles
                </span>
                <span className="text-[10px] text-[#444]">{strikes.leapsDTE}d LEAPS ÷ 35d avg</span>
              </div>
            )}
          </div>

          <div className="tos-sublabel">Likely Scenarios (premium collected per cycle)</div>
          <div className="tos-row flex items-center px-4 py-3 gap-6">
            {([
              { label: "Bear",  fill: 0.5,  color: "#ff3d3d" },
              { label: "Base",  fill: 0.75, color: "#ff9f00" },
              { label: "Bull",  fill: 1.0,  color: "#00c853" },
            ] as const).map(({ label, fill, color }) => {
              const income  = monthlyIncome! * fill;
              const payback = Math.ceil((netDebit! * 100) / income);
              const pct     = ((income / (netDebit! * 100)) * 100).toFixed(1);
              const adjBE   = cycles !== null && breakeven !== undefined
                ? breakeven - (income * cycles) / 100
                : null;
              return (
                <div key={label} className="flex flex-col min-w-[110px]">
                  <span className="text-xs uppercase tracking-wider mb-0.5" style={{ color }}>{label}</span>
                  <span className="font-tnum font-bold text-sm" style={{ color }}>
                    ${income.toFixed(0)}/cycle
                  </span>
                  <span className="text-[10px] text-[#555]">{pct}% of debit/cycle</span>
                  <span className="text-[10px] text-[#444]">payback in {payback} cycles</span>
                  {adjBE !== null && (
                    <span className="text-[10px] text-[#666] mt-0.5">BE → ${adjBE.toFixed(2)}</span>
                  )}
                </div>
              );
            })}
            <div className="flex flex-col min-w-[110px] border-l border-[#222] pl-6">
              <span className="text-[#555] text-xs uppercase tracking-wider mb-0.5">Fill Range</span>
              <span className="font-tnum text-sm text-[#aaa]">50–100%</span>
              <span className="text-[10px] text-[#444]">of mid price</span>
              <span className="text-[10px] text-[#333]">realistic fills vary</span>
            </div>
          </div>

          {cycles !== null && (() => {
            const totalBase     = cycles * monthlyIncome! * 0.75;
            const cushionDollar = totalBase / 100;
            const cushionPct    = (cushionDollar / leapsAsk!) * 100;
            return (
              <div className="tos-row px-4 py-3 flex items-start gap-3 border-t border-[#1a1a1a]">
                <span className="text-[#ff9f00] text-sm mt-0.5">◆</span>
                <div>
                  <span className="text-[#aaa] text-xs uppercase tracking-wider">Base-case cushion</span>
                  <p className="text-sm text-[#ddd] mt-1">
                    {cycles} cycles × ${(monthlyIncome! * 0.75).toFixed(0)}/cycle ={" "}
                    <span className="text-[#ff9f00] font-bold">${totalBase.toFixed(0)} total collected</span>
                    {" "}— LEAPS can drop{" "}
                    <span className="text-[#ff9f00] font-bold">${cushionDollar.toFixed(2)}</span>
                    {" "}in option value ({cushionPct.toFixed(1)}% of ask) before you net-lose.
                  </p>
                </div>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
