export default function Sidebar({
  items,
  active,
  onSelect,
  collapsed,
  className = "",
  onItemSelect,
}) {
  return (
    <aside
      className={`flex h-full flex-col gap-6 border-r border-slate-200/70 bg-white/95 p-5 text-slate-800 shadow-soft dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100 ${
        collapsed ? "w-20" : "w-72"
      } transition-all duration-300 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-400 shadow-soft" />
        {!collapsed && (
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              StayFlow
            </p>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Hotel Suite
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Operations Workspace
            </p>
          </div>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-3 text-base">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => {
              onSelect(item);
              onItemSelect?.();
            }}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-all ${
              item === active
                ? "bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent text-slate-900 dark:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
            }`}
          >
            <span className="text-lg">▣</span>
            {!collapsed && <span>{item}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
