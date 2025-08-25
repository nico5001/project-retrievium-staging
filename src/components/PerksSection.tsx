
"use client";
import React from "react";

type Perk = {
  title: string;
  description: string;
  
  icon?: React.ReactNode;
};

const SparkIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v4m0 10v4m7.071-15.071-2.829 2.829M7.757 16.243l-2.829 2.829M21 12h-4M7 12H3m15.071 7.071-2.829-2.829M7.757 7.757 4.928 4.928"
    />
  </svg>
);

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7l7-4z" />
  </svg>
);

const VoteIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l2 2 6-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7m16 0H4m16 0V9a2 2 0 00-2-2h-3M4 12V9a2 2 0 012-2h3m0 0a3 3 0 110-6 3 3 0 010 6zm6 0a3 3 0 110-6 3 3 0 010 6z" />
  </svg>
);

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v4a2 2 0 100 4v4H4v-4a2 2 0 100-4V7z" />
  </svg>
);

const TagIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h6l7 7-6 6-7-7V7zM7 7V3m0 4H3" />
  </svg>
);

type Props = {
  id?: string;
  title?: string;
  subtitle?: string;
  perks?: Perk[];
};

const DEFAULT_PERKS: Perk[] = [
  {
    title: "Holder-Only Drops",
    description: "Access exclusive mints, editions, and seasonal airdrops.",
    icon: <GiftIcon />,
  },
  {
    title: "Community Voting",
    description: "Help steer story arcs, events, and faction decisions.",
    icon: <VoteIcon />,
  },
  {
    title: "Lore Updates",
    description: "Follow canon drops and behind-the-scenes posts as Aurions and Umbrix evolve.",
    icon: <SparkIcon />,
  },
  {
    title: "Community Events",
    description: "Join AMAs, art contests, and giveaways as we grow the world together.",
    icon: <TicketIcon />,
  },
  {
    title: "Rewards & Treasury",
    description: "Earn perks tied to on-chain milestones and community goals.",
    icon: <ShieldIcon />,
  },
  {
    title: "Merch & Collabs",
    description: "Early access to limited drops, collabs, and partner perks.",
    icon: <TagIcon />,
  },
];

export default function PerksSection({
  id = "perks",
  title = "Utility & Perks",
  subtitle = "Why holding matters—what you unlock as part of the world.",
  perks = DEFAULT_PERKS,
}: Props) {
  return (
    <section id={id} className="relative w-screen py-20 md:py-28">
      {/* soft backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_800px_at_50%_-10%,rgba(135,80,255,0.12),transparent_60%)]"
      />
      <div className="mx-auto max-w-7xl px-6">
        <header className="mb-10 md:mb-14 text-center">
          <h2 className="font-ethno text-3xl md:text-4xl text-white tracking-wide uppercase">
            {title}
          </h2>
          <div className="mx-auto mt-3 h-1 w-24 rounded-full bg-violet-400/70" />
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">{subtitle}</p>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {perks.map((perk, i) => (
            <li key={i} className="group relative">
              {/* gradient ring on hover */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-violet-500/25 via-fuchsia-500/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur-md p-5 md:p-6 h-full shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <div className="mb-4 text-violet-300">{perk.icon ?? <SparkIcon />}</div>
                <h3 className="text-white text-lg md:text-xl font-semibold">{perk.title}</h3>
                <p className="mt-2 text-white/70 leading-relaxed">{perk.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
