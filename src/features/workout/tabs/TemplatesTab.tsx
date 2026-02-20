import { useEffect, useState } from "react";
import type { Template, WorkoutDraft } from "../../../app/types";
import { Card } from "../../../shared/ui/Card";
import { deleteTemplate, listTemplates, workoutFromTemplate } from "../../../app/dbHelpers";

export function TemplatesTab({
  onStartFromTemplate,
}: {
  onStartFromTemplate: (w: WorkoutDraft) => void;
  onBack: () => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);

  async function refresh() {
    setTemplates(await listTemplates());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        </div>
      </header>

      <div className="space-y-3">
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="text-xs text-white/55">
              Templates store exercises + order + notes, but sets/reps/weight are cleared when you start.
            </div>
          </div>
        </Card>

        {templates.length === 0 ? (
          <Card className="p-6">
            <p className="text-white/70">No templates yet. Save your current workout to create one.</p>
          </Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-lg font-semibold truncate">{t.name}</div>
                  <div className="text-xs text-white/55">
                    {t.exercises.length} exercises • saved {new Date(t.createdAt).toLocaleDateString()}
                  </div>

                  <div className="mt-3 text-sm text-white/70 line-clamp-2">
                    {t.exercises.map((e) => e.name).join(" • ")}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    className="rounded-2xl px-4 py-3 font-semibold bg-gradient-to-r from-emerald-300 to-sky-300 text-black shadow-lg shadow-emerald-300/20 active:scale-[0.97] transition"
                    onClick={() => onStartFromTemplate(workoutFromTemplate(t))}
                  >
                    Start
                  </button>
                  <button
                    className="rounded-2xl px-4 py-2 text-sm border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 active:scale-[0.98] transition"
                    onClick={async () => {
                      const ok = window.confirm(`Delete template "${t.name}"?`);
                      if (!ok) return;
                      await deleteTemplate(t.id);
                      await refresh();
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
