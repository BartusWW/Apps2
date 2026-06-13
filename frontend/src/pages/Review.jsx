import { useState } from "react";
import WeeklyReviewView from "../components/views/WeeklyReviewView";
import MonthlyReviewView from "../components/views/MonthlyReviewView";
import GoalsReviewView from "../components/views/GoalsReviewView";
import { CalendarRange, CalendarDays, Compass } from "lucide-react";

const VIEWS = [
  {
    id: "weekly",
    label: "Weekly",
    icon: CalendarDays,
    Component: WeeklyReviewView,
    activeClass: "bg-emerald-500 text-black",
    dotClass: "bg-emerald-500",
  },
  {
    id: "monthly",
    label: "Monthly",
    icon: CalendarRange,
    Component: MonthlyReviewView,
    activeClass: "bg-sky-500 text-black",
    dotClass: "bg-sky-500",
  },
  {
    id: "goals",
    label: "Goals",
    icon: Compass,
    Component: GoalsReviewView,
    activeClass: "bg-violet-500 text-white",
    dotClass: "bg-violet-500",
  },
];

export default function Review() {
  const [mode, setMode] = useState("weekly");
  const ActiveView = VIEWS.find((v) => v.id === mode).Component;

  return (
    <div className="space-y-5" data-testid="review-page">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-full p-1">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const active = mode === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setMode(v.id)}
                data-testid={`review-tab-${v.id}`}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-semibold transition-colors duration-150 ${
                  active ? v.activeClass : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {v.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5" data-testid="review-dots">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-label={`Go to ${v.label}`}
              onClick={() => setMode(v.id)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                mode === v.id ? `w-6 ${v.dotClass}` : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
              }`}
            />
          ))}
        </div>
      </div>

      <ActiveView />
    </div>
  );
}
