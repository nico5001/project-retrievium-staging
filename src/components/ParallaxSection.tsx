"use client";
import { useEffect, useRef, useState, ReactNode } from "react";

interface Props {
  bgImage: string;
  speedY?: number;
  zoomSpeed?: number;
  disableOnMobile?: boolean;
  className?: string;
  children: ReactNode;
}

export default function ParallaxSection({
  bgImage,
  speedY = 0.15,
  zoomSpeed = 0.0005,
  disableOnMobile = true,
  className = "",
  children,
}: Props) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [y, setY] = useState(0);

  
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const canEnable = () =>
      !(disableOnMobile && window.innerWidth < 768) && !mql.matches;

    setEnabled(canEnable());
    const onResize = () => setEnabled(canEnable());
    const onChange = () => setEnabled(canEnable());
    window.addEventListener("resize", onResize);
    mql.addEventListener?.("change", onChange);
    return () => {
      window.removeEventListener("resize", onResize);
      mql.removeEventListener?.("change", onChange);
    };
  }, [disableOnMobile]);

  // Parallax scroll
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!sectionRef.current) return;
        const rect = sectionRef.current.getBoundingClientRect();
        setY(-rect.top);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const translateY = y * (enabled ? speedY : 0);
  const scale = Math.min(1.15, Math.max(1, 1 + y * (enabled ? zoomSpeed : 0)));

  return (
    <section
      ref={sectionRef}
      className={`relative w-screen min-h-[100svh] overflow-hidden ${className}`}
    >
      {/* Background image (parallax) */}
      <div
        aria-hidden
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
          backgroundImage: `url('${bgImage}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Top gradient */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28vh] sm:h-[32vh] md:h-[36vh] bg-gradient-to-b from-black/85 via-black/45 to-transparent" />

      {/* Bottom gradient */}
      <div
        className="
          pointer-events-none
          absolute inset-x-0 bottom-0
          h-[64vh] sm:h-[66vh] md:h-[68vh]
          bg-gradient-to-t
          from-black/90 via-black/75 to-transparent
        "
        style={{ mixBlendMode: "multiply" }}
      />

  

      {/* Foreground content */}
      <div className="relative z-20 min-h-[100svh]">{children}</div>
    </section>
  );
}
