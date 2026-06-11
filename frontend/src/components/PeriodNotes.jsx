import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

/**
 * Editable notes block with multiple fields.
 * Props:
 *  - title, subtitle
 *  - fields: [{ key, label, placeholder }]
 *  - value: { key: text }
 *  - onChange: (patch) => void
 *  - testIdPrefix
 *
 * Strategy: controlled textareas. We write through to onChange on every change
 * (parent debounces to localStorage). A "Saved" indicator flashes briefly when
 * the parent's value updates from our change.
 */
export default function PeriodNotes({ title, subtitle, fields, value, onChange, testIdPrefix }) {
  const v = value || {};
  const [savedKey, setSavedKey] = useState(null);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const handleChange = (key, next) => {
    onChange({ [key]: next });
    setSavedKey(key);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedKey(null), 900);
  };

  return (
    <section
      className="bg-neutral-900 border border-white/10 rounded-xl p-5 space-y-4"
      data-testid={`${testIdPrefix}-notes`}
    >
      <div>
        <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold">
                {f.label}
              </label>
              {savedKey === f.key && (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400">
                  <Check size={10} /> Saved
                </span>
              )}
            </div>
            <textarea
              value={v[f.key] ?? ""}
              onChange={(e) => handleChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={2}
              data-testid={`${testIdPrefix}-field-${f.key}`}
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 resize-none"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
