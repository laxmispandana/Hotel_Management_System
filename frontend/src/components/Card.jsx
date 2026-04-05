export default function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/60 bg-white/90 p-6 text-slate-900 shadow-soft transition duration-200 hover:border-slate-300 dark:border-slate-700/60 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500/80 ${className}`}
    >
      {children}
    </div>
  );
}
