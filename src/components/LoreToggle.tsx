"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  MotionProps,
  TargetAndTransition,
  Transition,
} from "framer-motion";

type Side = "left" | "right";


const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

const mobileMotionLeft: MotionProps = {
  initial: { opacity: 0, x: -24, scale: 0.985 } as TargetAndTransition,
  animate: { opacity: 1, x: 0, scale: 1 } as TargetAndTransition,
  exit: { opacity: 0, x: -24, scale: 0.985 } as TargetAndTransition,
  transition: { ease: easeOut, duration: 0.32 } satisfies Transition,
};

const mobileMotionRight: MotionProps = {
  initial: { opacity: 0, x: 24, scale: 0.985 } as TargetAndTransition,
  animate: { opacity: 1, x: 0, scale: 1 } as TargetAndTransition,
  exit: { opacity: 0, x: 24, scale: 0.985 } as TargetAndTransition,
  transition: { ease: easeOut, duration: 0.32 } satisfies Transition,
};

const desktopMotionLeft: MotionProps = {
  initial: { opacity: 0, x: -40 } as TargetAndTransition,
  animate: { opacity: 1, x: 0 } as TargetAndTransition,
  exit: { opacity: 0, x: -40 } as TargetAndTransition,
  transition: { ease: easeOut, duration: 0.35 } satisfies Transition,
};

const desktopMotionRight: MotionProps = {
  initial: { opacity: 0, x: 40 } as TargetAndTransition,
  animate: { opacity: 1, x: 0 } as TargetAndTransition,
  exit: { opacity: 0, x: 40 } as TargetAndTransition,
  transition: { ease: easeOut, duration: 0.35 } satisfies Transition,
};

const willChangeStyle: CSSProperties = {
  willChange: "transform, opacity",
  transform: "translateZ(0)",
};

/*glass card */
function GlassCard(props: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={[
        "rounded-2xl bg-black/60 backdrop-blur-[6px] ring-1 ring-white/10",
        "shadow-[0_10px_30px_rgba(0,0,0,.35)]",
        "p-5 sm:p-6",
        props.className || "",
      ].join(" ")}
      style={willChangeStyle}
    >
      {props.children}
    </div>
  );
}

export default function LoreToggle() {
  const [side, setSide] = useState<Side>("left");
  const [isMobile, setIsMobile] = useState(false);
  const [spin, setSpin] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleSide = () => {
    setSide((s) => (s === "left" ? "right" : "left"));
    setSpin((r) => r + 180);
  };

  return (
    <section className="relative isolate w-screen h-[100svh] min-h-[100svh] overflow-hidden">
      
      <div
        aria-hidden
        className="absolute inset-0 bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url(/images/lore-bg.png)" }}
      />
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,.25),rgba(0,0,0,.78))]" />

      
      <div
        aria-hidden
        className={[
          "hidden md:block absolute inset-y-0 w-1/2 pointer-events-none transition-opacity duration-400",
          side === "left" ? "right-0 opacity-100" : "right-0 opacity-0",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(to left, rgba(0,0,0,.52), rgba(0,0,0,0))",
        }}
      />
      <div
        aria-hidden
        className={[
          "hidden md:block absolute inset-y-0 w-1/2 pointer-events-none transition-opacity duration-400",
          side === "right" ? "left-0 opacity-100" : "left-0 opacity-0",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,.52), rgba(0,0,0,0))",
        }}
      />

      {/* ====== LAYOUT ====== */}
      <div className="relative z-10 mx-auto grid h-full grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-8 px-5 sm:px-6 py-16 md:py-0 max-w-7xl">
        {/* ---------- MOBILE---------- */}
        {isMobile ? (
          <>
            <div className="order-1 justify-self-center w-full max-w-[28rem]">
              <div className="order-3 md:hidden h-[12vh]" />

             
              <div className="relative min-h-[210px]">
                <AnimatePresence mode="wait" initial={false}>
                  {side === "left" ? (
                    <motion.div
                      key="left-mobile"
                      className="absolute inset-0 flex"
                      style={willChangeStyle}
                      {...mobileMotionLeft}
                    >
                      <GlassCard className="w-[92vw] max-w-[28rem]">
                        <h2 className="mb-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                          The Birth of Retrievium
                        </h2>
                        <p className="text-sm sm:text-base leading-relaxed text-neutral-200/90">
                          <strong>Retrievium</strong> was meant to change
                          warfare forever. It was Ji Hoon’s greatest
                          success—and his worst mistake. By the time he
                          realized the danger, it was already too late.
                        </p>
                      </GlassCard>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="right-mobile"
                      className="absolute inset-0 flex"
                      style={willChangeStyle}
                      {...mobileMotionRight}
                    >
                      <GlassCard className="w-[92vw] max-w-[28rem]">
                        <h2 className="mb-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                          The Creator’s Last Secret
                        </h2>
                        <p className="text-sm sm:text-base leading-relaxed text-neutral-200/90">
                          Dr. Ji Hoon wanted to build the ultimate weapon. But
                          his creation grew too powerful, and filled with
                          regret, he vanished—leaving only a mutant hound and
                          the Creator’s last secret.
                        </p>
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Center button (mobile) */}
            <div className="order-2 relative justify-self-center w-40 h-40 sm:w-48 sm:h-48 mt-4">
              <motion.img
                src="/images/button.png"
                alt="Do Not Push Button"
                onClick={toggleSide}
                whileTap={{ scale: 0.98 }}
                animate={{ rotate: spin }}
                transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.9 }}
                className="w-full h-full cursor-pointer select-none rounded-full transform-gpu will-change-transform"
                style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span
                  className={[
                    "relative inline-flex items-center justify-center text-center",
                    "px-3 py-1 rounded-md border",
                    "font-extrabold uppercase tracking-[0.14em] leading-none",
                    "text-[12px] sm:text-[13px]",
                    "backdrop-blur-[1.5px]",
                    side === "left"
                      ? "text-white border-white/80 shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                      : "text-red-400 border-red-500 shadow-[0_0_14px_rgba(220,38,38,0.45)]",
                  ].join(" ")}
                >
                  {side === "left" ? "Do Not Push" : "SYSTEM ERROR!!"}
                </span>
              </span>
            </div>
          </>
        ) : (
          /* ---------- DESKTOP ---------- */
          <>
           
            {side === "left" ? (
              <motion.div
                key="left-desktop"
                className="justify-self-start text-left max-w-prose"
                {...desktopMotionLeft}
              >
                <GlassCard>
                  <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-white">
                    The Birth of Retrievium
                  </h2>
                  <p className="text-neutral-200/90">
                    Retrievium was meant to change warfare forever. It was Ji
                    Hoon’s greatest success—and his worst mistake. By the time
                    he realized the danger, it was already too late.
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              <div />
            )}

            {/* Center button */}
            <div className="relative justify-self-center w-64 h-64">
              <motion.img
                src="/images/button.png"
                alt="Do Not Push Button"
                onClick={toggleSide}
                whileTap={{ scale: 0.98 }}
                animate={{ rotate: spin }}
                transition={{ type: "spring", stiffness: 120, damping: 18, mass: 0.9 }}
                className="w-full h-full cursor-pointer select-none rounded-full transform-gpu will-change-transform"
                style={{ backfaceVisibility: "hidden", transformStyle: "preserve-3d" }}
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span
                  className={[
                    "relative inline-flex items-center justify-center text-center",
                    "px-3 py-1 rounded-md border",
                    "font-extrabold uppercase tracking-[0.14em] leading-none",
                    "text-[14px] backdrop-blur-[1.5px]",
                    side === "left"
                      ? "text-white border-white/80"
                      : "text-red-400 border-red-500",
                  ].join(" ")}
                >
                  {side === "left" ? "Do Not Push" : "SYSTEM ERROR!!"}
                </span>
              </span>
            </div>

            
            {side === "right" ? (
              <motion.div
                key="right-desktop"
                className="justify-self-end text-right max-w-prose"
                {...desktopMotionRight}
              >
                <GlassCard>
                  <h2 className="mb-3 text-4xl font-extrabold tracking-tight text-white">
                    The Creator’s Last Secret
                  </h2>
                  <p className="text-neutral-200/90">
                    Dr. Ji Hoon wanted to build the ultimate weapon. But his
                    creation grew too powerful, and filled with regret, he
                    vanished—leaving only a mutant hound and the Creator’s last
                    secret.
                  </p>
                </GlassCard>
              </motion.div>
            ) : (
              <div />
            )}
          </>
        )}
      </div>
    </section>
  );
}
