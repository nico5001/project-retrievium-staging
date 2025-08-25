"use client";
import { motion, useScroll } from "framer-motion";

export default function TopProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      style={{ scaleX: scrollYProgress }}
      className="
        fixed left-0
        top-[64px] sm:top-[80px]  /* sit just under your fixed nav (h-16/h-20) */
        z-[45] h-[3px] w-full origin-left
        bg-[rgb(var(--pr-yellow))]
      "
    />
  );
}
