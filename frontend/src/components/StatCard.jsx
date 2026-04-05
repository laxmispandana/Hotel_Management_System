import Card from "./Card.jsx";

export default function StatCard({ title, value, icon, gradient }) {
  return (
    <Card
      className={`relative overflow-hidden border-slate-200/60 bg-gradient-to-br ${gradient} dark:border-slate-700/60`}
    >
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl dark:bg-white/10" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-600/80 dark:text-slate-300/70">
            {title}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/30 text-slate-900 dark:bg-white/10 dark:text-white">
          {icon}
        </div>
      </div>
    </Card>
  );
}
