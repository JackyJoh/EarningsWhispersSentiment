import type { AppMode } from "@/lib/types";

type Props = {
  mode: AppMode;
  onChange: (mode: AppMode) => void;
};

const items: { id: AppMode; label: string; icon: React.ReactNode }[] = [
  {
    id: "ic",
    label: "Iron Condor",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/>
      </svg>
    ),
  },
  {
    id: "pmcc",
    label: "PMCC",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <nav className="flex flex-col">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex flex-col items-center justify-center gap-1.5 h-20 px-2 w-full border-b border-[#2a2a2a] transition-colors duration-150 ${
            mode === item.id
              ? "text-[#00b4ff] bg-[#1a1a1a]"
              : "text-[#666] hover:text-[#aaa] hover:bg-[#161616]"
          }`}
        >
          {item.icon}
          <span className="text-[11px] font-semibold uppercase tracking-wider leading-tight text-center">
            {item.label}
          </span>
        </button>
      ))}
    </nav>
  );
}
