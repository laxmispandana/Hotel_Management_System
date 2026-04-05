export default function Toasts({ items, onRemove }) {
  return (
    <div className="fixed right-6 top-6 z-50 flex flex-col gap-3">
      {items.map((toast) => (
        <div
          key={toast.id}
          className={`flex min-w-[240px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-soft backdrop-blur-xl ${
            toast.type === "error"
              ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-xs uppercase tracking-wider"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
