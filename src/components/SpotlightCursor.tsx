"use client";
import { useEffect, useState } from "react";

export default function SpotlightCursor() {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setPos({ x, y });
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[40] opacity-40 mix-blend-screen"
      style={{
        background: `radial-gradient(36rem at ${pos.x}% ${pos.y}%, rgba(var(--pr-yellow),0.15), transparent 60%)`,
      }}
      aria-hidden
    />
  );
}
