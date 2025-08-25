"use client";
import { motion } from "framer-motion";

export default function SectionReveal({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ y: 18, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
