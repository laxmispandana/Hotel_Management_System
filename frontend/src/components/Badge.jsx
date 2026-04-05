const colors = {
  success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  warning: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  danger: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  neutral: "bg-slate-500/15 text-slate-300 border-slate-500/40",
  info: "bg-sky-500/15 text-sky-300 border-sky-500/40",
};

export default function Badge({ label, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] ${
        colors[tone] || colors.neutral
      }`}
    >
      {label}
    </span>
  );
}
