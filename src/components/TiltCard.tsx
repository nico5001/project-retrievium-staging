"use client";
import { useRef } from "react";

export default function TiltCard({ children, className="" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
    const ry = ((e.clientX - r.left) / r.width - 0.5) *  6;
    ref.current!.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
  };
  const reset = () => { if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0) rotateY(0)"; };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className={`rounded-2xl border border-white/12 bg-black/60 backdrop-blur-sm
                  transition-transform will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}
