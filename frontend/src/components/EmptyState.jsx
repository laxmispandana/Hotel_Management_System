import Card from "./Card.jsx";

export default function EmptyState({ title, message, action }) {
  return (
    <Card className="flex flex-col items-center justify-center gap-3 text-center">
      <div className="text-3xl">✦</div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action}
    </Card>
  );
}
