type ICVerdictProps   = { type: "ic";   approved: boolean };
type PMCCVerdictProps = { type: "pmcc"; verdict: "STRONG" | "WEAK" | "AVOID"; score: number; total: number };
type Props = ICVerdictProps | PMCCVerdictProps;

export default function Verdict(props: Props) {
  if (props.type === "ic") {
    const { approved } = props;
    const color = approved ? "#00c853" : "#ff3d3d";
    const label = approved ? "APPROVED" : "DENIED";
    const sub   = approved ? "All 3 filters passed — trade eligible" : "One or more filters failed — skip this trade";
    return (
      <div className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a2a] bg-[#111]">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
        <span className="font-heading font-bold text-3xl tracking-tight" style={{ color }}>
          {label}
        </span>
        <span className="text-[#666] text-sm ml-1">{sub}</span>
        <span className="ml-auto text-[#444] text-xs font-semibold uppercase tracking-wider">Iron Condor</span>
      </div>
    );
  }

  const { verdict, score, total } = props;
  const color =
    verdict === "STRONG" ? "#00c853" : verdict === "WEAK" ? "#ff9f00" : "#ff3d3d";
  const strongThreshold = Math.ceil(total * 0.75);
  const weakThreshold   = Math.ceil(total * 0.5);
  const sub =
    verdict === "STRONG" ? `Score ≥${strongThreshold}/${total} — strong PMCC candidate` :
    verdict === "WEAK"   ? `Score ≥${weakThreshold}/${total} — consider with caution`   :
                           `Score <${weakThreshold}/${total} — avoid this setup`;

  return (
    <div className="flex items-center gap-4 px-4 py-4 border-b border-[#2a2a2a] bg-[#111]">
      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: color }} />
      <span className="font-heading font-bold text-3xl tracking-tight" style={{ color }}>
        {verdict}
      </span>
      <span className="text-[#666] text-sm ml-1">{sub}</span>
      <span className="ml-auto text-[#555] text-base font-tnum font-bold">{score}/{total}</span>
    </div>
  );
}
