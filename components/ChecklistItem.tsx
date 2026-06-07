import type { ICFilter, PMCCFilter } from "@/lib/types";

type Props = { item: ICFilter | PMCCFilter };

export default function ChecklistItem({ item }: Props) {
  const isNA = (item as PMCCFilter).na === true;

  return (
    <div className="tos-row flex items-center gap-4 px-4 py-3">
      <div
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          isNA      ? "bg-[#333]"    :
          item.pass ? "bg-[#00c853]" :
                      "bg-[#ff3d3d]"
        }`}
      />
      <span className={`flex-1 text-sm ${isNA ? "text-[#444]" : "text-[#ccc]"}`}>
        {item.label}
      </span>
      <span
        className={`font-tnum text-sm font-bold w-32 text-right ${
          isNA      ? "text-[#333]"    :
          item.pass ? "text-[#00c853]" :
                      "text-[#ff3d3d]"
        }`}
      >
        {item.value}
      </span>
      <span className="font-tnum text-sm text-[#555] w-28 text-right">
        {item.threshold}
      </span>
    </div>
  );
}
