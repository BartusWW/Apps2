import { useEffect, useRef, useState } from "react";
import { Brain, Mic, MicOff, X } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";

const CATS = [
  "General",
  "BW Systems",
  "PT Study",
  "Content",
  "Training",
  "Reading",
  "AI Systems",
  "Recovery",
  "Other",
];

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function BrainDumpFab() {
  const { addBrainDump } = useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cat, setCat] = useState("General");
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const SpeechRec = getSpeechRecognition();

  const submit = () => {
    if (!text.trim()) {
      toast("Brain dump is empty", { className: "!bg-neutral-900 !border-red-500/30 !text-white" });
      return;
    }
    addBrainDump({ text, category: cat });
    toast("Brain dump saved", {
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
    setText("");
    setCat("General");
    setOpen(false);
  };

  const toggleVoice = () => {
    if (!SpeechRec) return;
    if (listening) {
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
      setListening(false);
      return;
    }
    const rec = new SpeechRec();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.onresult = (event) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      if (final) setText((prev) => (prev ? `${prev.trim()} ${final}` : final).trim());
      // Optionally surface interim too — keep simple.
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  useEffect(() => {
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      try {
        recRef.current?.stop();
      } catch {
        // ignore
      }
    }
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="brain-dump-fab"
        aria-label="Brain dump"
        className="fixed bottom-20 right-5 z-40 h-12 w-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-900/40 hover:bg-emerald-400 hover:scale-105 transition-transform"
      >
        <Brain size={20} strokeWidth={2.5} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          data-testid="brain-dump-modal"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-md bg-neutral-900 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-emerald-400" />
                <h2 className="font-display font-extrabold uppercase tracking-tight text-base">
                  Brain Dump
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                data-testid="brain-dump-close"
                className="p-2 text-neutral-400 hover:text-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              data-testid="brain-dump-category"
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Capture the thought before it slips…"
              rows={5}
              autoFocus
              data-testid="brain-dump-text"
              className="w-full bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 resize-none"
            />

            <div className="flex items-center gap-2">
              {SpeechRec && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  data-testid="brain-dump-voice"
                  className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border ${
                    listening
                      ? "border-red-500 text-red-400 bg-red-500/10"
                      : "border-white/15 text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  {listening ? <MicOff size={12} /> : <Mic size={12} />}
                  {listening ? "Listening…" : "Voice"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                data-testid="brain-dump-save"
                className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
