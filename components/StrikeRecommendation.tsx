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
type PMCCProps = { type: "pmcc"; strikes: PMCCStrikes; ticker: string; stockPrice: number };
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

  const { strikes, ticker, stockPrice } = props;
  return (
    <div>
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
            <ColHeader>Note</ColHeader>
          </tr>
        </thead>
        <tbody>
          <tr className="tos-row">
            <td className="px-4 py-3 text-sm text-[#00b4ff] font-bold">LONG</td>
            <td className="px-4 py-3 text-sm text-[#aaa]">LEAPS Call</td>
            <Cell value={`$${strikes.leapsStrike}`} />
            <Cell value={`${((strikes.leapsStrike / stockPrice - 1) * 100).toFixed(1)}%`} color="#888" />
            <td className="px-4 py-3 text-sm text-[#555]">~85% of price · deep ITM</td>
          </tr>
          <tr className="tos-row">
            <td className="px-4 py-3 text-sm text-[#ff9f00] font-bold">SHORT</td>
            <td className="px-4 py-3 text-sm text-[#aaa]">Call</td>
            <Cell value={`$${strikes.shortCallStrike}`} />
            <Cell value={`+${((strikes.shortCallStrike / stockPrice - 1) * 100).toFixed(1)}%`} color="#888" />
            <td className="px-4 py-3 text-sm text-[#555]">~106% of price · OTM</td>
          </tr>
          <tr className="tos-row">
            <td className="px-4 py-3 text-sm text-[#444] font-bold">REF</td>
            <td className="px-4 py-3 text-sm text-[#aaa]">Stock</td>
            <Cell value={`$${stockPrice.toFixed(2)}`} color="#00b4ff" />
            <td /><td className="px-4 py-3 text-sm text-[#555]">current price</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
