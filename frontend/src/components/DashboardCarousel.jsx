import { useState } from "react";
import { BarChart3, Clock, CalendarDays, ListTodo } from "lucide-react";
import ScoreView from "./views/ScoreView";
import TimeView from "./views/TimeView";
import DailyPlanCard from "./DailyPlanCard";
import CalendarView from "./CalendarView";

const slides = [
  { id: "score", label: "Score", icon: BarChart3, Component: ScoreView },
  { id: "time", label: "Time", icon: Clock, Component: TimeView },
  { id: "plan", label: "Plan", icon: ListTodo, Component: DailyPlanCard },
  { id: "calendar", label: "Calendar", icon: CalendarDays, Component: CalendarView },
];

export default function DashboardCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const ActiveComponent = slides[selectedIndex].Component;

  return <section data-testid="dashboard-carousel" className="space-y-3">
    <nav className="grid grid-cols-4 gap-1 bg-neutral-900 border theme-tertiary-border rounded-2xl p-1" aria-label="Home sections">
      {slides.map((s, i) => {
        const Icon = s.icon;
        const active = selectedIndex === i;
        return <button key={s.id} type="button" onClick={() => setSelectedIndex(i)} data-testid={`carousel-tab-${s.id}`} className={`min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 text-[9px] uppercase tracking-wider font-semibold transition-colors ${active ? "theme-primary-bg text-white" : "text-neutral-400 hover:text-white hover:bg-white/5"}`}><Icon size={13}/><span className="w-full truncate text-center">{s.label}</span></button>;
      })}
    </nav>
    <div data-testid={`carousel-slide-${slides[selectedIndex].id}`}>
      <ActiveComponent />
    </div>
  </section>;
}
