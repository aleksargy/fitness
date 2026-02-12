import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Movement, MovementCategory } from "../data/movements";
import { Card } from "../../../shared/ui/Card";

function cn(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const CATS: MovementCategory[] = ["Pull", "Push", "Legs", "Core"];

export function ExercisePicker({
  open,
  movements,
  onClose,
  onPick,
}: {
  open: boolean;
  movements: Movement[];
  onClose: () => void;
  onPick: (m: Movement) => void;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<MovementCategory | "All">("All");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCat("All");
    // focus input when opening
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const results = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return movements
      .filter((m) => (cat === "All" ? true : m.category === cat))
      .filter((m) => (qq ? m.name.toLowerCase().includes(qq) : true))
      .slice(0, 24);
  }, [movements, q, cat]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close"
      />

      {/* bottom sheet */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <Card className="overflow-hidden">
            <div className="px-4 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-white/15" />

              <div className="flex items-center justify-between">
                <div className="text-base font-semibold">Add exercise</div>
                <button
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80"
                  onClick={onClose}
                >
                  Close
                </button>
              </div>

              <div className="mt-3">
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search (e.g., pull, dip, squat)…"
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-base text-white outline-none focus:border-white/25 placeholder:text-white/35"
                />
              </div>

              {/* category chips */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                <Chip active={cat === "All"} onClick={() => setCat("All")}>
                  All
                </Chip>
                {CATS.map((c) => (
                  <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto px-2 pb-2">
              {results.length === 0 ? (
                <div className="px-3 py-10 text-center text-white/55">
                  No matches.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {results.map((m) => (
                    <button
                      key={m.id}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10 active:scale-[0.99] transition"
                      onClick={() => {
                        onPick(m);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={m.image}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border border-white/10 bg-black/30"
                          loading="lazy"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-base font-medium">
                            {m.name}
                          </div>
                          <div className="text-xs text-white/55">
                            {m.category}
                          </div>
                        </div>
                        <div className="text-white/40">＋</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-2 text-sm transition",
        active
          ? "bg-white/10 border-white/20 text-white"
          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
