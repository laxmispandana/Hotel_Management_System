export default function Topbar({
  user,
  onToggleTheme,
  theme,
  onToggleSidebar,
  onSignOut,
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 px-6 py-4 text-slate-900 shadow-glass dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-xl border border-slate-200/70 bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          ☰
        </button>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Command Center
          </p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Welcome, {user?.name || "Guest"}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-slate-200/70 bg-slate-100 px-3 py-1 text-xs uppercase tracking-wider text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200">
          {user?.role}
        </span>
        <button
          onClick={onSignOut}
          className="rounded-xl border border-slate-200/70 bg-slate-100 px-3 py-2 text-xs text-slate-600 hover:bg-slate-200 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Sign out
        </button>
        <button
          onClick={onToggleTheme}
          className="rounded-xl border border-slate-200/70 bg-slate-100 px-3 py-2 text-xs text-slate-600 hover:bg-slate-200 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {theme === "dark" ? "Light" : "Dark"} Mode
        </button>
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-sky-300 shadow-soft" />
      </div>
    </header>
  );
}
