import React from "react";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`
        rounded-3xl
        border border-white/10
        bg-gradient-to-b from-white/[0.06] to-white/[0.03]
        backdrop-blur-xl
        shadow-[0_8px_40px_rgba(0,0,0,0.35)]
        ${className ?? ""}
      `}
    >
      {children}
    </div>
  );
}

