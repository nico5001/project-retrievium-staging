"use client";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode } from "react";

export default function MagneticButton({ children, className="" }: { children: ReactNode; className?: string }) {
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 15 });
  const sy = useSpring(y, { stiffness: 200, damping: 15 });

  return (
    <motion.button
      onPointerMove={(e) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        x.set(((e.clientX - r.left) / r.width - 0.5) * 12);
        y.set(((e.clientY - r.top) / r.height - 0.5) * 12);
      }}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      style={{ x: sx, y: sy }}
      className={`rounded-full px-5 py-2 font-semibold
        bg-white text-black hover:bg-zinc-100 transition will-change-transform ${className}`}
    >
      {children}
    </motion.button>
  );
}
