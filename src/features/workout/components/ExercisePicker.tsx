import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Movement, MovementCategory } from "../data/movements";
import { Card } from "../../../shared/ui/Card";
import { addCustomMovement, listCustomMovements } from "../../../app/dbHelpers";

function cn(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

const CATS: MovementCategory[] = ["Pull", "Push", "Legs", "Core"];

// Bottom-sheet tuning
const SNAP_TOP_PX = 24; // expanded: how close to top
const COLLAPSED_VISIBLE_VH = 0.72; // collapsed: portion of screen visible
const DISMISS_EXTRA_PX = 140; // pull down past collapsed by this => dismiss
const VELOCITY_DISMISS = 1.0; // fast swipe down => dismiss
const VELOCITY_EXPAND = -0.9; // fast swipe up => expand

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

    // Mount/visibility (for animate-in/out)
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    // Sheet translateY in px (0 = top position, larger = lower)
    const [y, setY] = useState(0);
    const yRef = useRef(0);

    // Snap points (computed from viewport height)
    const snapTopRef = useRef(0); // expanded translateY
    const snapCollapsedRef = useRef(0); // collapsed translateY

    // Drag tracking
    const draggingRef = useRef(false);
    const startPointerYRef = useRef(0);
    const startSheetYRef = useRef(0);
    const lastPointerYRef = useRef(0);
    const lastTimeRef = useRef(0);
    const velocityRef = useRef(0);

    // whether we should animate snapping
    const [snapping, setSnapping] = useState(true);

    // custom movements
    const [custom, setCustom] = useState<Movement[]>([]);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newCat, setNewCat] = useState<MovementCategory>("Pull");

    function normalizeCategory(c: unknown): MovementCategory | null {
        const s = String(c ?? "").trim().toLowerCase();
        if (s === "pull") return "Pull";
        if (s === "push") return "Push";
        if (s === "legs") return "Legs";
        if (s === "core") return "Core";
        return null;
    }

    const allMovements = useMemo(() => {
        const merged = [...movements, ...custom];
        return merged.slice().sort((a, b) => a.name.localeCompare(b.name));
    }, [custom, movements]);


    const results = useMemo(() => {
        const qq = q.trim().toLowerCase();

        return allMovements
            .filter((m) => {
                if (cat === "All") return true;
                return normalizeCategory(m.category) === cat;
            })
            .filter((m) => (qq ? m.name.toLowerCase().includes(qq) : true))
            .slice(0, 40);
    }, [allMovements, q, cat]);



    function computeSnaps() {
        const vh = window.innerHeight || 800;
        const top = SNAP_TOP_PX; // translateY when expanded
        const collapsedTranslate = Math.max(
            top,
            vh - Math.floor(vh * COLLAPSED_VISIBLE_VH)
        );
        snapTopRef.current = top;
        snapCollapsedRef.current = collapsedTranslate;

        yRef.current = clamp(
            yRef.current,
            top,
            collapsedTranslate + DISMISS_EXTRA_PX + 400
        );
        setY(yRef.current);
    }

    useEffect(() => {
        function onResize() {
            computeSnaps();
        }
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Open / close lifecycle
    useEffect(() => {
        if (open) {
            setMounted(true);
            setQ("");
            setCat("All");
            setCreating(false);
            setNewName("");
            setNewCat("Pull");

            // load custom movements
            listCustomMovements().then((rows: any[]) => {
                setCustom(
                    rows
                        .map((r) => {
                            const norm = normalizeCategory(r.category) ?? "Pull";
                            return {
                                id: r.id,
                                name: String(r.name ?? "").trim(),
                                category: norm,
                                image: r.image || "/movements/custom.jpg",
                            } as Movement;
                        })
                        .filter((m) => m.name.length > 0)
                );
            });


            requestAnimationFrame(() => {
                computeSnaps();
                const startOffscreen = (window.innerHeight || 800) + 200;
                yRef.current = startOffscreen;
                setY(startOffscreen);

                requestAnimationFrame(() => {
                    setSnapping(true);
                    setVisible(true);
                    const collapsed =
                        snapCollapsedRef.current || Math.max(SNAP_TOP_PX, 240);
                    yRef.current = collapsed;
                    setY(collapsed);

                    setTimeout(() => inputRef.current?.focus(), 220);
                });
            });
        } else if (mounted) {
            setVisible(false);
            setSnapping(true);
            const off = (window.innerHeight || 800) + 200;
            yRef.current = off;
            setY(off);
            const t = setTimeout(() => setMounted(false), 220);
            return () => clearTimeout(t);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    function close() {
        setVisible(false);
        setSnapping(true);
        const off = (window.innerHeight || 800) + 200;
        yRef.current = off;
        setY(off);
        setTimeout(() => {
            setMounted(false);
            onClose();
        }, 220);
    }

    function snapTo(target: number) {
        setSnapping(true);
        yRef.current = target;
        setY(target);
    }

    function onPointerDown(e: React.PointerEvent) {
        draggingRef.current = true;
        setSnapping(false);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        startPointerYRef.current = e.clientY;
        startSheetYRef.current = yRef.current;

        lastPointerYRef.current = e.clientY;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
    }

    function onPointerMove(e: React.PointerEvent) {
        if (!draggingRef.current) return;

        const pointerY = e.clientY;
        const dy = pointerY - startPointerYRef.current;
        const next = startSheetYRef.current + dy;

        const now = performance.now();
        const dt = Math.max(1, now - lastTimeRef.current);
        const v = (pointerY - lastPointerYRef.current) / dt; // px/ms
        velocityRef.current = v;

        lastPointerYRef.current = pointerY;
        lastTimeRef.current = now;

        const top = snapTopRef.current || SNAP_TOP_PX;
        const collapsed = snapCollapsedRef.current || Math.max(SNAP_TOP_PX, 240);

        const clamped = clamp(next, top, collapsed + DISMISS_EXTRA_PX + 500);
        yRef.current = clamped;
        setY(clamped);
    }

    function onPointerUp() {
        if (!draggingRef.current) return;
        draggingRef.current = false;

        const v = velocityRef.current;
        const top = snapTopRef.current || SNAP_TOP_PX;
        const collapsed = snapCollapsedRef.current || Math.max(SNAP_TOP_PX, 240);

        const cur = yRef.current;

        if (cur > collapsed + DISMISS_EXTRA_PX || v > VELOCITY_DISMISS) {
            close();
            return;
        }

        if (v < VELOCITY_EXPAND) {
            snapTo(top);
            return;
        }

        const distToTop = Math.abs(cur - top);
        const distToCollapsed = Math.abs(cur - collapsed);
        snapTo(distToTop < distToCollapsed ? top : collapsed);
    }

    // Backdrop click: collapse first if expanded; otherwise close
    function onBackdrop() {
        const top = snapTopRef.current || SNAP_TOP_PX;
        const collapsed = snapCollapsedRef.current || Math.max(SNAP_TOP_PX, 240);
        if (yRef.current <= top + 40) snapTo(collapsed);
        else close();
    }

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* backdrop */}
            <button
                className={cn(
                    "absolute inset-0 bg-black/60 transition-opacity duration-200",
                    visible ? "opacity-100" : "opacity-0"
                )}
                onClick={onBackdrop}
                aria-label="Close"
            />

            {/* sheet */}
            <div className="absolute inset-x-0 bottom-0">
                <div className="mx-auto max-w-3xl px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
                    <div
                        className={cn(
                            "will-change-transform",
                            snapping ? "transition-transform duration-200 ease-out" : ""
                        )}
                        style={{ transform: `translateY(${y}px)` }}
                    >
                        <Card className="h-[calc(100vh-24px)] overflow-hidden">
                            {/* drag handle / header area ONLY */}
                            <div className="px-4 pt-3 pb-3">
                                {/* DRAG HANDLE ONLY */}
                                <div
                                    className="mx-auto mb-3 h-6 w-20 flex items-center justify-center"
                                    onPointerDown={onPointerDown}
                                    onPointerMove={onPointerMove}
                                    onPointerUp={onPointerUp}
                                    onPointerCancel={onPointerUp}
                                    style={{ touchAction: "none" }} // critical: only for the handle
                                    aria-label="Drag handle"
                                >
                                    <div className="h-1.5 w-12 rounded-full bg-white/15" />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-base font-semibold">Add exercise</div>
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

                                <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
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


                            {/* scrollable content */}
                            <div className="h-[calc(100vh-24px-168px)] overflow-y-auto px-2 pb-2">
                                {/* create custom */}
                                <div className="px-2 pt-2 pb-3">
                                    {!creating ? (
                                        <button
                                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10 active:scale-[0.99] transition"
                                            onClick={() => {
                                                setCreating(true);
                                                setNewName(q.trim());
                                            }}
                                        >
                                            + Create custom exercise
                                        </button>
                                    ) : (
                                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                            <div className="text-sm font-semibold">New exercise</div>

                                            <div className="mt-2 grid gap-2">
                                                <input
                                                    value={newName}
                                                    onChange={(e) => setNewName(e.target.value)}
                                                    placeholder="Name (e.g., Archer Push-up)"
                                                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-base text-white outline-none focus:border-white/25 placeholder:text-white/35"
                                                />

                                                <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                                                    {CATS.map((c) => (
                                                        <Chip
                                                            key={c}
                                                            active={newCat === c}
                                                            onClick={() => setNewCat(c)}
                                                        >
                                                            {c}
                                                        </Chip>
                                                    ))}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10 active:scale-[0.99] transition"
                                                        onClick={() => setCreating(false)}
                                                    >
                                                        Cancel
                                                    </button>

                                                    <button
                                                        className="rounded-2xl px-4 py-3 text-sm font-semibold bg-[#F3F4F6] text-black hover:bg-white active:scale-[0.99] transition disabled:opacity-60"
                                                        disabled={!newName.trim()}
                                                        onClick={async () => {
                                                            const created = await addCustomMovement({
                                                                name: newName,
                                                                category: newCat,
                                                                image: "/movements/custom.jpg",
                                                            });

                                                            const movement: Movement = {
                                                                id: created.id,
                                                                name: created.name,
                                                                category: created.category,
                                                                image:
                                                                    created.image || "/movements/custom.jpg",
                                                            };

                                                            setCustom((prev) => [movement, ...prev]);
                                                            onPick(movement);
                                                            close();
                                                        }}
                                                    >
                                                        Create
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                                    close();
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
                "shrink-0 rounded-full border px-3 py-2 text-sm transition active:scale-[0.99]",
                active
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
            )}
        >
            {children}
        </button>
    );
}

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
}
