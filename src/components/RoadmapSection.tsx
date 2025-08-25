"use client";

import { useState, useEffect } from "react";

export default function RoadmapSection() {
  const [open, setOpen] = useState(false);

 
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <section
      id="roadmap"
      className="
        relative w-screen overflow-hidden bg-black
        py-20 md:py-28  /* generous space to avoid overlap with neighbors */
      "
    >
      
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 sm:h-20 bg-gradient-to-b from-black/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 sm:h-20 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="relative z-10 mx-auto max-w-[min(1400px,95vw)]">
        {/* Title */}
        <h2 className="text-center text-white font-extrabold tracking-[0.12em] uppercase text-2xl sm:text-3xl md:text-4xl">
          Roadmap
        </h2>
        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-[#9A6BFF]" />

        {/* Image card */}
        <div className="mt-10 md:mt-14">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="
              group relative block w-full overflow-hidden rounded-2xl
              bg-neutral-900/40 ring-1 ring-white/10
              shadow-[0_20px_60px_rgba(0,0,0,.5)]
              focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60
            "
          >
            <img
              src="/images/roadmap.png" 
              alt="Project Retrievium roadmap"
              className="block w-full h-auto object-contain"
            />

            {/* Tap/Click */}
            <span className="
              absolute bottom-3 right-3 text-xs sm:text-sm text-white/80
              bg-black/40 backdrop-blur rounded px-2 py-1
              md:hidden
            ">
              Tap to zoom
            </span>
          </button>
        </div>
      </div>

      {/* Zoom modal */}
      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm"
          onClick={() => setOpen(false)}           
          role="dialog"
          aria-modal="true"
        >
          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <img
              src="/images/roadmap.png"
              alt="Project Retrievium roadmap enlarged"
              className="max-w-[min(1600px,96vw)] max-h-[92vh] w-auto h-auto rounded-xl shadow-2xl ring-1 ring-white/10"
            />

           
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="
                absolute md:bottom-8 md:right-8 bottom-6 inset-x-auto
                bg-white/90 text-black text-sm font-semibold
                px-4 py-2 rounded-full shadow
                hover:bg-white transition
              "
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
