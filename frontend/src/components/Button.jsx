export default function Button({
  children,
  type = "button",
  variant = "primary",
  onClick,
  className = "",
}) {
  const base =
    "rounded-xl px-4 py-3 text-sm font-semibold transition duration-200";
  const styles = {
    primary:
      "bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500 text-white shadow-soft hover:opacity-90",
    ghost:
      "border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10",
    subtle:
      "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
