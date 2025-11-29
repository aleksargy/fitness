// src/components/FragmentRow.tsx

import type { ExerciseSetLog } from "../types/training";

type FragmentRowProps = {
  logId: string;
  exerciseId: string;
  setData: ExerciseSetLog;
  onChange: (
    logId: string,
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: string
  ) => void;
};

export function FragmentRow({
  logId,
  exerciseId,
  setData,
  onChange,
}: FragmentRowProps) {
  return (
    <>
      <span className="text-slate-300">#{setData.setIndex}</span>
      <input
        type="number"
        min={0}
        value={setData.reps}
        onChange={(e) =>
          onChange(logId, exerciseId, setData.id, "reps", e.target.value)
        }
        className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px]"
      />
      <input
        type="number"
        min={0}
        step={0.5}
        value={setData.weight}
        onChange={(e) =>
          onChange(
            logId,
            exerciseId,
            setData.id,
            "weight",
            e.target.value
          )
        }
        className="rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-[11px]"
      />
    </>
  );
}
