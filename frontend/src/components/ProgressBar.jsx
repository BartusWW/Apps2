export default function ProgressBar({ value, max, tone = "positive", label, valueLabel }) {
  const safeMax = max <= 0 ? 1 : max;
  const pct = Math.min(100, Math.max(0, (Math.abs(value) / safeMax) * 100));

  const fillColor =
    tone === "positive"
      ? "bg-emerald-500"
      : tone === "negative"
        ? "bg-red-600"
        : "bg-sky-500";

  return (
    <div className="w-full">
      {(label || valueLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-neutral-300 truncate">{label}</span>
          <span className={`text-xs font-semibold ${
            tone === "positive" ? "text-emerald-400" : tone === "negative" ? "text-red-500" : "text-sky-400"
          }`}>
            {valueLabel}
          </span>
        </div>
      )}
      <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${fillColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
