export default function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  name,
  min,
  max,
}) {
  return (
    <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
      {label}
      <input
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-100"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        name={name}
        min={min}
        max={max}
      />
    </label>
  );
}
