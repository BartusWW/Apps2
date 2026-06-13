import { useState } from "react";
import * as Icons from "lucide-react";
import {
  Palette,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "../../context/AppContext";
import { COLOR_OPTIONS, paletteFor } from "../../lib/categoryColors";
import IconPicker from "../IconPicker";

function ColorSwatchPicker({ value, onChange, testIdPrefix }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          data-testid={`${testIdPrefix}-color-${c.id}`}
          aria-label={c.label}
          title={c.label}
          className={`h-6 w-6 rounded-full border-2 transition-transform ${
            value === c.id ? "border-white scale-110" : "border-white/10 hover:scale-110"
          }`}
          style={{ background: c.hex }}
        />
      ))}
    </div>
  );
}

const blank = {
  name: "",
  type: "positive",
  icon: "Zap",
  color: "emerald",
  description: "",
};

function CategoryForm({ initial, onSave, onCancel, submitLabel, testIdPrefix }) {
  const [form, setForm] = useState({ ...blank, ...(initial || {}) });
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = Icons[form.icon] || Icons.Zap;
  const p = paletteFor(form.color);

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast("Name is required", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      description: (form.description || "").trim(),
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-neutral-900 border border-emerald-500/30 rounded-xl p-4 space-y-3"
      data-testid={`${testIdPrefix}-category-form`}
    >
      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Recovery"
          data-testid={`${testIdPrefix}-cat-name`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            data-testid={`${testIdPrefix}-cat-type`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="positive">Positive</option>
            <option value="negative">Negative</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-neutral-500">Icon</label>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            data-testid={`${testIdPrefix}-cat-icon-btn`}
            className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white flex items-center gap-2 hover:border-emerald-500/40"
          >
            <span
              className={`h-6 w-6 rounded-md flex items-center justify-center ${p.softBg} ${p.text}`}
            >
              <Icon size={13} strokeWidth={2.5} />
            </span>
            <span className="flex-1 text-left truncate">{form.icon}</span>
          </button>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">Color</label>
        <div className="mt-1">
          <ColorSwatchPicker
            value={form.color}
            onChange={(c) => setForm({ ...form, color: c })}
            testIdPrefix={testIdPrefix}
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-neutral-500">
          Description (optional)
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short purpose / context"
          data-testid={`${testIdPrefix}-cat-description`}
          className="w-full mt-1 bg-neutral-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs uppercase tracking-widest font-semibold px-3 py-2 rounded-lg border border-white/15 text-neutral-300 hover:bg-white/5"
          >
            <X size={12} className="inline mr-1" /> Cancel
          </button>
        )}
        <button
          type="submit"
          data-testid={`${testIdPrefix}-cat-save`}
          className="text-xs uppercase tracking-widest font-semibold px-3.5 py-2 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400"
        >
          <Check size={12} className="inline mr-1" />
          {submitLabel}
        </button>
      </div>

      <IconPicker
        open={pickerOpen}
        value={form.icon}
        onChange={(name) => setForm({ ...form, icon: name })}
        onClose={() => setPickerOpen(false)}
      />
    </form>
  );
}

// Single draggable row. Drag is bound to the GripVertical handle so taps on
// arrows / edit / delete still work normally.
function SortableCategoryRow({ category, isFirst, isLast, onEdit, onDelete, onMove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.name });
  const Icon = Icons[category.icon] || Icons.Zap;
  const p = paletteFor(
    category.color || (category.type === "negative" ? "red" : "emerald"),
  );
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`bg-neutral-900 border rounded-lg px-2 py-3 flex items-center gap-2 ${
        isDragging ? "border-emerald-500/50 shadow-lg" : "border-white/10"
      }`}
      data-testid={`category-row-${category.name}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        data-testid={`drag-handle-${category.name}`}
        aria-label={`Reorder ${category.name}`}
        className="p-1 -ml-0.5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 rounded touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>

      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onMove(category.name, -1)}
          disabled={isFirst}
          data-testid={`move-up-${category.name}`}
          className="p-0.5 rounded text-neutral-500 hover:text-emerald-400 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Move up"
        >
          <ArrowUp size={11} />
        </button>
        <button
          type="button"
          onClick={() => onMove(category.name, 1)}
          disabled={isLast}
          data-testid={`move-down-${category.name}`}
          className="p-0.5 rounded text-neutral-500 hover:text-emerald-400 hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent"
          aria-label="Move down"
        >
          <ArrowDown size={11} />
        </button>
      </div>

      <span
        className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 ${p.softBg} ${p.text}`}
      >
        <Icon size={14} strokeWidth={2.5} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{category.name}</p>
        <p className="text-[10px] uppercase tracking-widest text-neutral-500 truncate">
          {category.type} · {category.color || "default"}
          {category.description ? ` · ${category.description}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onEdit(category.name)}
        data-testid={`edit-category-${category.name}`}
        className="p-2 rounded-md text-neutral-400 hover:text-emerald-400 hover:bg-white/5"
        aria-label="Edit"
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(category.name)}
        data-testid={`delete-category-${category.name}`}
        className="p-2 rounded-md text-neutral-500 hover:text-red-500 hover:bg-white/5"
        aria-label="Delete"
      >
        <Trash2 size={13} />
      </button>
    </li>
  );
}

export default function CategoriesEditor() {
  const { settings, updateSettings, moveCategoryOrder, setCategoryOrder } = useApp();
  const categories = [...(settings.categories || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  // Sensors: PointerSensor (mouse/pen) + TouchSensor (mobile) + Keyboard a11y.
  // Activation distance/delay prevents accidental drags when tapping the row.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const updateCategory = (name, patch) => {
    const next = (settings.categories || []).map((c) =>
      c.name === name ? { ...c, ...patch } : c,
    );
    updateSettings({ categories: next });
  };
  const addCategory = (cat) => {
    const existing = settings.categories || [];
    if (existing.some((c) => c.name === cat.name)) {
      toast("Category name already exists", {
        className: "!bg-neutral-900 !border-red-500/30 !text-white",
      });
      return;
    }
    const withOrder = { ...cat, sortOrder: existing.length };
    updateSettings({ categories: [...existing, withOrder] });
    setAdding(false);
    toast("Category added", {
      className: "!bg-neutral-900 !border-emerald-500/30 !text-white",
    });
  };
  const deleteCategory = (name) => {
    updateSettings({
      categories: (settings.categories || []).filter((c) => c.name !== name),
    });
    toast(`${name} removed`, {
      className: "!bg-neutral-900 !border-red-500/30 !text-white",
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const names = categories.map((c) => c.name);
    const oldIdx = names.indexOf(active.id);
    const newIdx = names.indexOf(over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    setCategoryOrder(arrayMove(names, oldIdx, newIdx));
  };

  return (
    <section data-testid="categories-editor" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-[0.18em] text-sky-400 font-semibold flex items-center gap-1.5">
          <Palette size={11} /> Categories
        </h2>
        <button
          type="button"
          onClick={() => setAdding((s) => !s)}
          data-testid="add-category-toggle"
          className="flex items-center gap-1.5 text-xs uppercase font-semibold tracking-widest border border-emerald-500/40 text-emerald-400 rounded-lg px-3 py-1.5 hover:bg-emerald-500/10"
        >
          <Plus size={12} />
          {adding ? "Close" : "New"}
        </button>
      </div>

      {adding && (
        <CategoryForm
          submitLabel="Add Category"
          testIdPrefix="add"
          onCancel={() => setAdding(false)}
          onSave={addCategory}
        />
      )}

      <p className="text-[10px] uppercase tracking-widest text-neutral-500">
        Drag the handle or use arrows to reorder.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categories.map((c) => c.name)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1.5" data-testid="categories-list">
            {categories.map((c, idx) => {
              if (editing === c.name) {
                return (
                  <li key={c.name}>
                    <CategoryForm
                      initial={c}
                      submitLabel="Save"
                      testIdPrefix={`edit-${c.name}`}
                      onCancel={() => setEditing(null)}
                      onSave={(patch) => {
                        updateCategory(c.name, patch);
                        setEditing(null);
                        toast("Category updated", {
                          className: "!bg-neutral-900 !border-white/10 !text-white",
                        });
                      }}
                    />
                  </li>
                );
              }
              return (
                <SortableCategoryRow
                  key={c.name}
                  category={c}
                  isFirst={idx === 0}
                  isLast={idx === categories.length - 1}
                  onEdit={setEditing}
                  onDelete={deleteCategory}
                  onMove={moveCategoryOrder}
                />
              );
            })}
            {categories.length === 0 && !adding && (
              <p className="text-sm text-neutral-500">
                No categories. Tap “New” to create one.
              </p>
            )}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}
