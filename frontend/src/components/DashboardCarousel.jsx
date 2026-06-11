import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { BarChart3, Clock } from "lucide-react";
import ScoreView from "./views/ScoreView";
import TimeView from "./views/TimeView";

const slides = [
  { id: "score", label: "Score", icon: BarChart3, Component: ScoreView },
  { id: "time", label: "Time", icon: Clock, Component: TimeView },
];

export default function DashboardCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    duration: 22,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback(
    (index) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi],
  );

  return (
    <section data-testid="dashboard-carousel" className="space-y-3">
      {/* Mode tabs / indicator row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-full p-1">
          {slides.map((s, i) => {
            const Icon = s.icon;
            const active = selectedIndex === i;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(i)}
                data-testid={`carousel-tab-${s.id}`}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-semibold transition-colors duration-150 ${
                  active
                    ? s.id === "time"
                      ? "bg-sky-500 text-black"
                      : "bg-emerald-500 text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <Icon size={12} strokeWidth={2.5} />
                {s.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1.5" data-testid="carousel-dots">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to ${s.label} view`}
              data-testid={`carousel-dot-${s.id}`}
              onClick={() => scrollTo(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                selectedIndex === i
                  ? s.id === "time"
                    ? "w-6 bg-sky-500"
                    : "w-6 bg-emerald-500"
                  : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Embla viewport */}
      <div className="overflow-hidden -mx-5" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {slides.map(({ id, Component }) => (
            <div
              key={id}
              className="min-w-0 shrink-0 grow-0 basis-full px-5"
              data-testid={`carousel-slide-${id}`}
            >
              <Component />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
