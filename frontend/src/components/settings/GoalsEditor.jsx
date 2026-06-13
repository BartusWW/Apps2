import { useState } from "react";
import * as Icons from "lucide-react";
import {
  Compass,
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "../../context/AppContext";
import { paletteFor } from "../../lib/categoryColors";
import GoalForm from "../GoalForm";
import CompleteGoalModal from "../CompleteGoalModal";

const STATUS_FILTERS = [
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
];

export default function GoalsEditor() {
  const { goals, addGoal, updateGoal, completeGoal, archiveGoal, restoreGoal, deleteGoal } = useApp();
  const [filter, setFilter] = useState("active");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [completing, setCompleting] = useState(null);

  const filtered = (goals || []).filter((g) => g.status === filter);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (g) => {
    setEditing(g);
    setFormOpen(true);
  };
  const handleSave = (payload) => {
    if (editing) {
      updateGoal(editing.id, payload);
      toast("Goal updated", {
        className: "!bg-neutral-900 !border-white/10 !text-white",
      });
    } else {
      addGoal(payload);
      toast("Goal created", {
        className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
      });
    }
    setFormOpen(false);
    setEditing(null);
  };
  const handleDelete = (g) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${g.name}"? This cannot be undone.`)) return;
    deleteGoal(g.id);
    toast(`${g.name} deleted`, {
      className: "!bg-neutral-900 !border-red-500/30 !text-white",
    });
  };

  return (
    <section data-testid="goals-editor" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-violet-400 font-semibold flex items-center gap-1.5">
          <Compass size={11} /> Goals
        </h2>
        <button
          type="button"
          onClick={openCreate}
          data-testid="goals-editor-new"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
        >
          <Plus size={12} /> New
        </button>
      </div>

      <div className="flex items-center gap-1.5 bg-neutral-900 border border-white/10 rounded-full p-1 w-fit">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              data-testid={`goals-filter-${f.id}`}
              className={`text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full transition-colors ${
                active ? "bg-violet-500 text-white" : "text-neutral-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <ul className="space-y-1.5">
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-500">No {filter} goals.</p>
        )}
        {filtered.map((g) => {
          const Icon = Icons[g.icon] || Icons.Target;
          const p = paletteFor(g.color);
          return (
            <li
              key={g.id}
              className="bg-neutral-900 border border-white/10 rounded-lg px-3.5 py-3 flex items-center gap-2.5"
              data-testid={`goal-editor-row-${g.id}`}
            >
              <span className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}>
                <Icon size={14} strokeWidth={2.5} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{g.name}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
                  Target {g.targetAllocation || 0}% · Priority {g.priorityWeight || 5}/10
                  {g.linkedActivities?.length ? ` · ${g.linkedActivities.length} activities` : ""}
                </p>
              </div>
              {filter === "active" && (
                <>
                  <button
                    type="button"
                    onClick={() => setCompleting(g)}
                    data-testid={`goal-editor-complete-${g.id}`}
                    className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                    aria-label="Mark Completed"
                    title="Mark Completed"
                  >
                    <CheckCircle2 size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      archiveGoal(g.id);
                      toast(`${g.name} archived`, {
                        className: "!bg-neutral-900 !border-white/10 !text-white",
                      });
                    }}
                    data-testid={`goal-editor-archive-${g.id}`}
                    className="p-2 rounded-md text-neutral-400 hover:text-amber-400 hover:bg-white/5"
                    aria-label="Archive"
                    title="Archive"
                  >
                    <Archive size={13} />
                  </button>
                </>
              )}
              {filter === "archived" && (
                <button
                  type="button"
                  onClick={() => {
                    restoreGoal(g.id);
                    toast(`${g.name} restored`, {
                      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
                    });
                  }}
                  data-testid={`goal-editor-restore-${g.id}`}
                  className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                  aria-label="Restore"
                  title="Restore"
                >
                  <ArchiveRestore size={13} />
                </button>
              )}
              <button
                type="button"
                onClick={() => openEdit(g)}
                data-testid={`goal-editor-edit-${g.id}`}
                className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
                aria-label="Edit"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(g)}
                data-testid={`goal-editor-delete-${g.id}`}
                className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
                aria-label="Delete"
              >
                <Trash2 size={13} />
              </button>
            </li>
          );
        })}
      </ul>

      <GoalForm
        open={formOpen}
        initial={editing}
        onSave={handleSave}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        key={formOpen ? `goal-form-${editing?.id || "new"}-open` : "goal-form-closed"}
      />
      <CompleteGoalModal
        open={!!completing}
        goal={completing}
        onConfirm={({ completedAt, finalNotes }) => {
          completeGoal(completing.id, { completedAt, finalNotes });
          toast(`${completing.name} completed`, {
            className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
          });
          setCompleting(null);
        }}
        onClose={() => setCompleting(null)}
        key={`complete-editor-${completing?.id || "none"}`}
      />
    </section>
  );
}
