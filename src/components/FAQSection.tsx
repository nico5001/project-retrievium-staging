'use client';
import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

// ===== Helpers
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// ===== Icons
const IconX = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M18.244 2H21l-6.5 7.43L22.5 22h-6.656l-4.66-6.19L5.5 22H2l7.02-8L1.5 2h6.75l4.17 5.64L18.244 2zm-1.157 18h2.093L8.94 4H6.846l10.241 16z"/>
  </svg>
);

const IconDiscord = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 245 240" aria-hidden="true" {...props}>
    <path fill="currentColor" d="M104.4 104.9c-5.7 0-10.2 5-10.2 11.1 0 6.1 4.6 11.1 10.2 11.1 5.7 0 10.2-5 10.2-11.1 0-6.1-4.6-11.1-10.2-11.1zm36.2 0c-5.7 0-10.2 5-10.2 11.1 0 6.1 4.6 11.1 10.2 11.1 5.7 0 10.2-5 10.2-11.1 0-6.1-4.6-11.1-10.2-11.1z"/>
    <path fill="currentColor" d="M189.5 20h-134C36.2 20 20 36.2 20 56.5v127C20 203.8 36.2 220 56.5 220h112.3l-5.3-18.4 12.8 11.9 12.1 11.2 21.6 19.3V56.5C210 36.2 203.8 20 189.5 20zm-39.7 138.2s-3.7-4.4-6.7-8.3c13.3-3.8 18.4-12.1 18.4-12.1-4.2 2.7-8.1 4.6-11.6 5.9-5 2.1-9.8 3.5-14.5 4.3-9.6 1.8-18.4 1.3-25.9-0.1-5.7-1.1-10.6-2.6-14.6-4.3-2.3-0.9-4.8-2-7.3-3.4-0.3-0.2-0.6-0.3-0.9-0.5-0.2-0.1-0.3-0.2-0.3-0.2s4.9 8.1 17.9 11.9c-3 3.9-6.8 8.5-6.8 8.5-22.5-0.7-31.1-15.5-31.1-15.5 0-32.9 14.7-59.6 14.7-59.6 14.7-11 28.6-10.7 28.6-10.7l1 1.2c-18.4 5.3-26.8 13.2-26.8 13.2s2.2-1.2 5.9-2.8c10.7-4.7 19.2-6 22.7-6.4 0.6-0.1 1.1-0.2 1.7-0.2 6.1-0.8 13-1 20.2-0.2 9.5 1.1 19.7 3.9 30.1 9.6 0 0-8-7.6-25.2-12.9l1.4-1.6s13.9-0.3 28.6 10.7c0 0 14.7 26.7 14.7 59.6 0 0-8.6 14.8-31.1 15.5z"/>
  </svg>
);

// ===== Background
const bgUrl = "/images/FAQs.jpg"; // replace with your image

// ===== Data
const faqs = [
  { q: "What is Project Retrievium?", a: <>An IP-driven Web3 universe on Ronin Network. We’re building lore, art, and community-first utility around the Aurions and Umbrix factions, with long-term plans tied to sustainable rewards for holders.</> },
  { q: "Which chain are we on?", a: <>Ronin. When Ronin transitions to an Ethereum L2, we’ll continue building natively within the ecosystem.</> },
  { q: "How do I mint?", a: <>Connect a Ronin-compatible wallet, head to the Mint tab, and follow on-screen steps. Supply, price, and dates will be announced in our X and Discord.</> },
  { q: "What’s the ‘hold to earn’ idea?", a: <>We’re exploring a treasury-first model where project revenues may support rewards over time. Exact mechanics will be shared only when fully modeled and audited for sustainability.</> },
  { q: "Where do I get updates?", a: <>Follow us on X and join Discord for the fastest announcements, AMAs, and community events.</> },
];

// ===== Accordion (high-contrast glass, motion)
function Accordion({ items }: { items: { q: string; a: React.ReactNode }[] }) {
  const [open, setOpen] = React.useState<number | null>(0);
  return (
    <div className="w-full space-y-4">
      {items.map((item, idx) => {
        const isOpen = open === idx;
        const id = slugify(item.q);
        return (
          <div
            key={idx}
            id={id}
            className={`relative rounded-2xl border transition shadow-xl backdrop-blur-sm ${
              isOpen
                ? "bg-black/70 border-white/15"
                : "bg-black/60 border-white/12 hover:bg-black/65"
            }`}
          >
            {/* subtle inner sheen */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(255,255,255,.06),transparent_35%,transparent_70%,rgba(255,255,255,.03))]" />

            <button
              className="relative w-full text-left px-5 py-4 md:px-6 md:py-5 flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400/40 rounded-2xl"
              onClick={() => setOpen(isOpen ? null : idx)}
              aria-expanded={isOpen}
              aria-controls={`answer-${id}`}
            >
              <h3 className="text-base md:text-lg font-semibold tracking-wide text-white drop-shadow-[0_1px_8px_rgba(0,0,0,.65)]">
                {item.q}
              </h3>
              <span
                className={`shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs transition ${
                  isOpen
                    ? "border-yellow-400/60 text-yellow-300 shadow-[0_0_16px_rgba(234,179,8,0.35)] rotate-180"
                    : "border-white/25 text-zinc-100"
                }`}
              >
                +
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={`answer-${id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="px-5 pb-5 md:px-6 md:pb-6 text-sm md:text-base leading-relaxed text-zinc-50 drop-shadow-[0_1px_8px_rgba(0,0,0,.65)]">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section className="relative isolate min-h-screen w-full overflow-hidden bg-black flex flex-col">
      
      <div className="absolute inset-0 -z-10">
        <Image
          src={bgUrl}
          alt="Project Retrievium Labs"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* CONTENT */}
      <div className="flex-1">
        <div className="mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-24">
          
          <div className="mb-10 md:mb-14 text-center relative">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,.65)_0%,rgba(0,0,0,.25)_40%,rgba(0,0,0,0)_70%)]" />
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.8)]">FAQs</h2>
            <p className="mt-3 text-zinc-100/95 max-w-2xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,.7)]">
              Answers to the most common questions about minting, utility, and our world.
            </p>
          </div>

          {/* Center column scrim */}
          <div className="relative mx-auto max-w-3xl">
            <div className="pointer-events-none absolute -inset-x-6 -inset-y-6 rounded-[28px] bg-black/35 backdrop-blur-sm border border-white/10" />
            <Accordion items={faqs} />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-auto w-full">
        <div className="bg-black/60 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-6 md:px-8 py-4 md:py-5 flex flex-wrap items-center justify-center gap-6">
            <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-zinc-100">Join our community:</p>
            <div className="flex items-center gap-4 md:gap-6">
              <a
                href="https://x.com/projretrievium"
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
                aria-label="Follow us on X"
              >
                <IconX className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </a>
              <a
                href="https://discord.gg/projectretrievium"
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10 transition"
                aria-label="Join us on Discord"
              >
                <IconDiscord className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </a>
            </div>
          </div>
          <div className="border-t border-white/10">
            <p className="text-center text-[10px] md:text-xs text-zinc-300/90 py-2">© {new Date().getFullYear()} Project Retrievium. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </section>
  );
}
