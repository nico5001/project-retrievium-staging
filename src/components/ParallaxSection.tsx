// src/components/ParallaxSection.tsx
"use client";
import { useState, useEffect, ReactNode } from "react";

interface ParallaxSectionProps {
  bgImage:    string;
  speedY?:     number;
  zoomSpeed?:  number;
  children:    ReactNode;
}

export default function ParallaxSection({
  bgImage,
  speedY    = 0.15,
  zoomSpeed = 0.0005,
  children,
}: ParallaxSectionProps) {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffsetY(window.pageYOffset);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const translateY = -offsetY * speedY;
  const scale      = 1 + offsetY * zoomSpeed;

  return (
    <section
      style={{
        position:   "relative",
        width:      "100vw",
        left:       "50%",
        marginLeft: "-50vw",    // pull out of parent container
        minHeight:  "100vh",    // at least viewport tall
        overflow:   "visible",  // allow children/content to scroll
      }}
    >
      {/* background wrapper crops zoomed image */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          width:      "100%",
          height:     "100%",
          overflow:   "hidden",    // crop zoom/translate
        }}
      >
        <div
          style={{
            width:            "100%",
            height:           "100%",
            backgroundImage: `url('${bgImage}')`,  
            backgroundSize:   "cover",
            backgroundPosition: "center",
            transform:         `translateY(${translateY}px) scale(${scale})`,  
            transformOrigin:  "center center",
          }}
        />
      </div>

      {/* Top-to-transparent gradient */}
      <div
        style={{
          position:   "absolute",
          top:        0,
          left:       0,
          right:      0,
          height:    "50vh",
          background: "linear-gradient(to bottom, rgba(0, 0, 0, 1), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* Bottom-to-transparent gradient, stronger fade */}
      <div
        style={{
          position:   "absolute",
          bottom:     0,
          left:       0,
          right:      0,
          height:    "50vh",
          background: "linear-gradient(to top, rgba(0, 0, 0, 1), transparent)",
          pointerEvents: "none",
        }}
      />

      {/* page content */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {children}
      </div>
    </section>
  );
}
