const textareaClass =
  "w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white text-sm font-mono p-3 resize-none focus:outline-none focus:border-[#0099e6] transition-colors duration-150 placeholder-[#444]";

const labelClass = "block text-[#888] text-xs font-semibold uppercase tracking-widest mb-2";

const submitClass =
  "w-full bg-[#00b4ff] hover:bg-[#0099e6] text-white text-sm font-bold py-3 px-4 rounded-full transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed";

type ICProps = {
  mode: "ic";
  text: string;
  onTextChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

type PMCCProps = {
  mode: "pmcc";
  preText: string;
  postText: string;
  onPreChange: (v: string) => void;
  onPostChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

type Props = ICProps | PMCCProps;

export default function NewsletterInput(props: Props) {
  if (props.mode === "ic") {
    const { text, onTextChange, onSubmit, loading } = props;
    return (
      <div className="flex flex-col gap-4 h-full min-h-0">
        <label className={labelClass}>EW Newsletter</label>
        <textarea
          className={`${textareaClass} flex-1 min-h-0`}
          placeholder="Paste the Earnings Whispers newsletter text here…"
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
        />
        <button
          className={submitClass}
          onClick={onSubmit}
          disabled={loading || !text.trim()}
        >
          {loading ? "Analyzing…" : "Analyze Iron Condor"}
        </button>
      </div>
    );
  }

  const { preText, postText, onPreChange, onPostChange, onSubmit, loading } = props;
  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <label className={labelClass}>
          Pre-Earnings Newsletter{" "}
          <span className="text-[#555] normal-case tracking-normal font-normal">(optional)</span>
        </label>
        <p className="text-[11px] text-[#444] mb-2 -mt-1">Leave blank to skip pre-earnings analysis</p>
        <textarea
          className={textareaClass}
          rows={8}
          placeholder="Paste the pre-earnings newsletter here…"
          value={preText}
          onChange={(e) => onPreChange(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass}>Post-Earnings Newsletter</label>
        <textarea
          className={textareaClass}
          rows={10}
          placeholder="Paste the post-earnings newsletter here…"
          value={postText}
          onChange={(e) => onPostChange(e.target.value)}
        />
      </div>
      <button
        className={submitClass}
        onClick={onSubmit}
        disabled={loading || !postText.trim()}
      >
        {loading ? "Analyzing…" : "Analyze PMCC Setup"}
      </button>
    </div>
  );
}
