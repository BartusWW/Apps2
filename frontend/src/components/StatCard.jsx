export default function StatCard({
  label,
  value,
  unit,
  tone = "neutral",
  testId,
  span = "col-span-1",
  sub,
}) {
  const toneClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-500"
        : "text-white";

  return (
    <div
      className={`${span} bg-neutral-900 border border-white/10 rounded-xl p-4 flex flex-col justify-between min-h-[110px]`}
      data-testid={testId}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-semibold">
        {label}
      </p>
      <div className="flex items-end gap-1.5">
        <span className={`font-display font-extrabold text-4xl leading-none tracking-tighter ${toneClass}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs uppercase tracking-widest text-neutral-500 pb-1">
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-xs text-neutral-400 truncate">{sub}</p>
      )}
    </div>
  );
}
