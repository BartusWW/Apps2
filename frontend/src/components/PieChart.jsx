const CATEGORY_COLORS = {
  "BW Strength Systems": "#10b981", // emerald-500
  "PT Study": "#38bdf8", // sky-400
  Content: "#a78bfa", // violet-400
  Reading: "#f59e0b", // amber-500
  "AI / Systems": "#06b6d4", // cyan-500
  Distraction: "#ef4444", // red-500
};

const FALLBACK_PALETTE = [
  "#10b981",
  "#38bdf8",
  "#a78bfa",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
];

export function getCategoryColor(category, index = 0) {
  return CATEGORY_COLORS[category] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

/**
 * SVG donut chart.
 * Props:
 *   - items: [{ label, value, color? }]
 *   - size: pixel size of svg (default 180)
 *   - thickness: stroke width (default 22)
 *   - centerTop: string for top center
 *   - centerBottom: string under top
 */
export default function PieChart({ items, size = 180, thickness = 22, centerTop, centerBottom }) {
  const total = items.reduce((s, x) => s + (x.value || 0), 0);
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  const segments = total > 0
    ? items.map((item, i) => {
        const value = item.value || 0;
        const pct = value / total;
        const dash = pct * circumference;
        const seg = (
          <circle
            key={item.label + i}
            r={radius}
            cx={cx}
            cy={cy}
            fill="transparent"
            stroke={item.color || getCategoryColor(item.label, i)}
            strokeWidth={thickness}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-cumulative}
            transform={`rotate(-90 ${cx} ${cy})`}
            strokeLinecap="butt"
          />
        );
        cumulative += dash;
        return seg;
      })
    : null;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          r={radius}
          cx={cx}
          cy={cy}
          fill="transparent"
          stroke="#262626"
          strokeWidth={thickness}
        />
        {segments}
      </svg>
      {(centerTop || centerBottom) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerTop && (
            <span className="font-display font-extrabold text-2xl tracking-tighter text-white leading-none">
              {centerTop}
            </span>
          )}
          {centerBottom && (
            <span className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1">
              {centerBottom}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
