import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { X, Clock } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { computePoints } from "../lib/scoring";
import { paletteFor } from "../lib/categoryColors";
import { applyPriorityMultiplier, getSubcategoryPriorityPercent } from "../lib/priorityProfiles";

const PRESETS = [10, 20, 30, 60];

export default function LogModal() {
  const { logModal, closeLogModal, settings, actions, logActivity, deleteEntry } = useApp();
  const [custom, setCustom] = useState("");

  useEffect(() => { if (!logModal.open) setCustom(""); }, [logModal.open]);
  if (!logModal.open) return null;

  let action = null;
  if (logModal.actionId) action = (actions || []).find((a) => a.id === logModal.actionId) || null;
  if (!action && logModal.categoryName) action = (actions || []).find((a) => a.category === logModal.categoryName) || null;
  const catName = action ? action.category : logModal.categoryName;
  const cat = (settings.categories || []).find((c) => c.name === catName);
  if (!cat) { closeLogModal(); return null; }

  const Icon = Icons[(action && action.icon) || cat.icon] || Icons.Zap;
  const colorId = cat.color || (cat.type === "negative" ? "red" : "emerald");
  const p = paletteFor(colorId);
  const titleText = action ? action.name : `Log ${cat.name}`;
  const rate30 = action && typeof action.points === "number" ? action.points : computePoints(30, cat.type);
  const subcategory = action?.subcategory || null;
  const priorityPct = getSubcategoryPriorityPercent(settings, cat.name, subcategory);
  const basePointsFor = (mins) => Math.round(((Number(mins) || 0) / 30) * rate30 * 10) / 10;
  const pointsFor = (mins) => applyPriorityMultiplier(basePointsFor(mins), cat.name, subcategory, settings);

  const submit = (minutes) => {
    const mins = Number(minutes);
    if (!mins || mins <= 0) {
      toast("Enter a positive number of minutes", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    const entry = logActivity({
      actionId: action?.id || null,
      actionName: action?.name || `${mins}m ${cat.name}`,
      category: cat.name,
      subcategory,
      type: cat.type,
      minutes: mins,
      icon: (action && action.icon) || cat.icon,
      points: pointsFor(mins),
    });
    toast(`${mins}m ${cat.name} logged`, {
      description: `${entry.points > 0 ? "+" : ""}${entry.points} pts`,
      action: { label: "Undo", onClick: () => deleteEntry(entry.id) },
      className: `!bg-neutral-900 !${p.border.replace("/30", "/40")} !text-white`,
    });
    closeLogModal();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" data-testid="log-modal" onClick={(e) => e.target === e.currentTarget && closeLogModal()}>
      <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <span className={`h-11 w-11 rounded-lg flex items-center justify-center ${p.iconBg}`}><Icon size={20} strokeWidth={2.5} /></span>
          <div className="flex-1 min-w-0">
            <p className="font-display font-extrabold uppercase tracking-tight text-base text-white truncate">{titleText}</p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-0.5">
              {action ? `${rate30 > 0 ? "+" : ""}${rate30} base pts / 30m` : cat.type === "positive" ? "+20 base pts / hr" : "−30 base pts / hr"}
              {subcategory ? ` · ${subcategory}` : ""}{` · ${priorityPct}% overclock`}
            </p>
          </div>
          <button type="button" onClick={closeLogModal} data-testid="log-modal-close" className="p-2 text-neutral-400 hover:text-white" aria-label="Close"><X size={16} /></button>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2 flex items-center gap-1"><Clock size={11} /> Quick Duration</p>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((m) => {
              const pts = pointsFor(m);
              return <button key={m} type="button" onClick={() => submit(m)} data-testid={`log-modal-preset-${m}`} className={`flex flex-col items-center justify-center py-3 rounded-lg border ${p.border} ${p.borderHover} ${p.presetText} hover:bg-white/5`}>
                <span className="font-display font-extrabold text-xl leading-none tracking-tighter">{m}</span>
                <span className="text-[9px] uppercase tracking-widest opacity-60 mt-1">{pts > 0 ? `+${pts}` : pts}</span>
              </button>;
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-semibold mb-2">Custom Minutes</p>
          <div className="flex items-center gap-2">
            <input type="number" min="1" value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(custom); }} placeholder="minutes" data-testid="log-modal-custom" className="flex-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
            <button type="button" onClick={() => submit(custom)} data-testid="log-modal-custom-save" className={`text-xs uppercase tracking-widest font-semibold px-4 py-2 rounded-lg ${p.solidBtn}`}>Save</button>
          </div>
        </div>
        <div className="flex items-center justify-end"><button type="button" onClick={closeLogModal} className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5">Cancel</button></div>
      </div>
    </div>
  );
}
