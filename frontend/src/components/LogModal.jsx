import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { X, Clock, Hash } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { computePoints } from "../lib/scoring";
import { paletteFor } from "../lib/categoryColors";
import {
  applyPriorityMultiplier,
  getSubcategoryPriorityPercent,
} from "../lib/priorityProfiles";
import { ActionLogFields, serializeLogFields } from "./ActionLogFields";

const PRESETS = [10, 20, 30, 60];
const round1 = (n) => Math.round((Number(n) || 0) * 10) / 10;
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

function periodStarts() {
  const now = new Date();
  const day = now.getDay();
  const week = new Date(now);
  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  week.setDate(now.getDate() + (day === 0 ? -6 : 1 - day));

  return {
    today: iso(now),
    week: iso(week),
    month: iso(month),
  };
}

export default function LogModal() {
  const {
    logModal,
    closeLogModal,
    settings,
    actions,
    entries,
    logActivity,
    deleteEntry,
  } = useApp();

  const [custom, setCustom] = useState("");
  const [details, setDetails] = useState({});

  useEffect(() => {
    if (!logModal.open) {
      setCustom("");
      setDetails({});
    }
  }, [logModal.open]);

  if (!logModal.open) return null;

  let action = logModal.actionId
    ? (actions || []).find((a) => a.id === logModal.actionId) || null
    : null;

  if (!action && logModal.categoryName) {
    action =
      (actions || []).find((a) => a.category === logModal.categoryName) || null;
  }

  const catName = action ? action.category : logModal.categoryName;
  const cat = (settings.categories || []).find((c) => c.name === catName);

  if (!cat) {
    closeLogModal();
    return null;
  }

  const Icon = Icons[action?.icon || cat.icon] || Icons.Zap;
  const p = paletteFor(
    cat.color || (cat.type === "negative" ? "red" : "emerald")
  );
  const subcategory = action?.subcategory || null;
  const priorityPct = getSubcategoryPriorityPercent(
    settings,
    cat.name,
    subcategory
  );
  const isPerUnit = action?.scoringType === "per-unit";
  const unit = action?.unit || "unit";
  const rate = Number(action?.pointsPerUnit) || 0;
  const rate30 =
    action && typeof action.points === "number"
      ? action.points
      : computePoints(30, cat.type);

  const base = (mins) =>
    Math.round((((Number(mins) || 0) / 30) * rate30) * 10) / 10;
  const pointsFor = (mins) =>
    applyPriorityMultiplier(base(mins), cat.name, subcategory, settings);
  const unitPoints = (qty) =>
    round1(
      applyPriorityMultiplier(
        (Number(qty) || 0) * rate,
        cat.name,
        subcategory,
        settings
      )
    );

  let activityStats = null;
  if (action?.id) {
    const starts = periodStarts();
    const own = (entries || []).filter((entry) => entry.actionId === action.id);
    const value = (list) =>
      round1(
        list.reduce(
          (sum, entry) =>
            sum +
            (isPerUnit
              ? Number(entry.quantity) || 0
              : Number(entry.minutes) || 0),
          0
        )
      );

    activityStats = {
      today: value(own.filter((entry) => entry.date >= starts.today)),
      week: value(own.filter((entry) => entry.date >= starts.week)),
      month: value(own.filter((entry) => entry.date >= starts.month)),
    };
  }

  const submit = (value) => {
    const n = Number(value);
    if (!n || n <= 0) {
      return toast(
        `Enter a positive number of ${isPerUnit ? unit : "minutes"}`
      );
    }

    const points = isPerUnit ? unitPoints(n) : pointsFor(n);
    const entry = logActivity({
      actionId: action?.id || null,
      actionName:
        action?.name || `${n}${isPerUnit ? ` ${unit}` : "m"} ${cat.name}`,
      category: cat.name,
      subcategory,
      type: cat.type,
      minutes: isPerUnit ? 0 : n,
      quantity: isPerUnit ? n : undefined,
      unit: isPerUnit ? unit : undefined,
      outputMetric: action?.outputMetric || null,
      customFields: serializeLogFields(action?.logFields, details),
      icon: action?.icon || cat.icon,
      points,
      source: "log-actions",
    });

    toast(`${action?.name || cat.name} logged`, {
      description: `${isPerUnit ? `${n} ${unit} · ` : ""}${
        entry.points > 0 ? "+" : ""
      }${entry.points} CBE`,
      action: {
        label: "Undo",
        onClick: () => deleteEntry(entry.id),
      },
    });

    closeLogModal();
  };

  const statValue = (value) => `${value} ${isPerUnit ? unit : "min"}`;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeLogModal()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex gap-3">
          <span
            className={`h-11 w-11 rounded-lg flex items-center justify-center ${p.iconBg}`}
          >
            <Icon size={20} />
          </span>
          <div className="flex-1">
            <p className="font-display font-extrabold uppercase">
              {action?.name || `Log ${cat.name}`}
            </p>
            <p className="text-[10px] uppercase text-neutral-500">
              {isPerUnit ? `${rate} CBE / ${unit}` : `${rate30} CBE / 30m`} ·{" "}
              {priorityPct}%
            </p>
          </div>
          <button onClick={closeLogModal}>
            <X size={16} />
          </button>
        </div>

        {activityStats && (
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Today"
              value={statValue(activityStats.today)}
              color={p.text}
            />
            <Stat
              label="Week"
              value={statValue(activityStats.week)}
              color={p.text}
            />
            <Stat
              label="Month"
              value={statValue(activityStats.month)}
              color={p.text}
            />
          </div>
        )}

        {!isPerUnit && !action?.logFields?.length && (
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                onClick={() => submit(m)}
                className={`py-3 rounded-lg border ${p.border}`}
              >
                <b>{m}</b>
                <small className="block">+{pointsFor(m)}</small>
              </button>
            ))}
          </div>
        )}

        <label className="block text-[10px] uppercase text-neutral-500">
          {isPerUnit ? (
            <>
              <Hash size={11} className="inline" /> Quantity · {unit}
            </>
          ) : (
            <>
              <Clock size={11} className="inline" /> Minutes
            </>
          )}
          <input
            type="number"
            min="0"
            step={isPerUnit ? "any" : "1"}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={isPerUnit ? unit : "minutes"}
            className="mt-1 w-full bg-neutral-950 border rounded-lg px-3 py-3 text-lg"
          />
        </label>

        <ActionLogFields
          fields={action?.logFields || []}
          value={details}
          onChange={setDetails}
        />

        <button
          onClick={() => submit(custom)}
          disabled={!(Number(custom) > 0)}
          className={`w-full py-3 rounded-lg text-xs uppercase font-bold disabled:opacity-30 ${p.solidBtn}`}
        >
          Save session
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-lg bg-neutral-950 border border-white/5 px-2 py-2 text-center">
      <p className="text-[8px] uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className={`text-sm font-display font-extrabold ${color}`}>{value}</p>
    </div>
  );
}
