import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ExerciseEntry } from "../../../app/types";
import { ExerciseCard } from "./ExerciseCard";

export function SortableExercise({
  entry,
  onUpdate,
  onRemove,
  lastTime,
}: {
  entry: ExerciseEntry;
  onUpdate: (patch: Partial<ExerciseEntry>) => void;
  onRemove: () => void;
  lastTime: null | { date: string; summary: string };
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: entry.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  const dragHandle = (
    <button
      className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-white/70 hover:text-white hover:bg-white/10 active:scale-[0.99] transition"
      {...attributes}
      {...listeners}
      aria-label="Drag to reorder"
      title="Drag to reorder"
    >
      <div className="grid gap-1">
        <span className="block h-1 w-3.5 rounded bg-white/40" />
        <span className="block h-1 w-3.5 rounded bg-white/40" />
        <span className="block h-1 w-3.5 rounded bg-white/40" />
      </div>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <ExerciseCard
        entry={entry}
        dragHandle={dragHandle}
        onUpdate={onUpdate}
        onRemove={onRemove}
        lastTime={lastTime}
      />
    </div>
  );
}
