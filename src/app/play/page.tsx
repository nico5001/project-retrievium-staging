'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import {
  Zap,
  Gem,
  Search,
  Play,
  RotateCcw,
  Activity,
  Package,
  Trophy,
  Users,
  CheckCircle,
  AlertCircle,
  Settings,
  Star,
  Atom,
  Microscope,
  FlaskConical,
  Beaker,
  Battery,
  Wind,
  Target,
  Shield,
  Scale,
  DollarSign,
  PlayCircle,
  Brain,
  Radio,
  FlaskRound,
  Clock
} from 'lucide-react';

/* ===========================
   Simplified Color Palette
   =========================== */
const colors = {
  primary: {
    50: 'rgb(240 249 255)',
    100: 'rgb(224 242 254)',
    500: 'rgb(59 130 246)',
    600: 'rgb(37 99 235)',
    700: 'rgb(29 78 216)',
    900: 'rgb(30 58 138)',
  },
  neutral: {
    50: 'rgb(248 250 252)',
    100: 'rgb(241 245 249)',
    300: 'rgb(148 163 184)',
    400: 'rgb(100 116 139)',
    500: 'rgb(71 85 105)',
    600: 'rgb(51 65 85)',
    700: 'rgb(35 45 55)',
    800: 'rgb(30 35 45)',
    900: 'rgb(15 23 42)',
  },
  success: {
    400: 'rgb(74 222 128)',
    500: 'rgb(34 197 94)',
    600: 'rgb(22 163 74)',
  },
  warning: {
    400: 'rgb(251 191 36)',
    500: 'rgb(245 158 11)',
  },
  error: {
    400: 'rgb(248 113 113)',
    500: 'rgb(239 68 68)',
  }
};

/* ===========================
   Types
   =========================== */

type Risk = 'SAFE' | 'STANDARD' | 'OVERCLOCK';

type Me = {
  wallet: string;
  rzn: number;
  ymd: string;
  energy: number;
  scans_done: number;
  stabilize_count: number;
  scan_ready: boolean;
};

type InvRow = { item: string; qty: number };

type LbRow = { wallet: string; rzn: number; scans?: number; stabilizes?: number; crafts?: number };

type DiscordLink = {
  discord_username: string;
  discord_discriminator: string;
  discord_avatar: string | null;
  discord_global_name: string | null;
};

type ScanRun = { runId: string; seed: string } | null;

type DropItem = { key: string; qty: number };
type StabilizeResult = { ok: boolean; rzn: number; items: DropItem[]; seed?: string };

type Recipe = {
  key: string;
  name: string;
  category: 'CORE' | 'AMPLIFIER' | 'CATALYST' | 'SIGIL' | 'LENS';
  tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC';
  requires: Record<string, number>;
  baseOutput: { item: string; qty: number };
  bonusOutput?: { item: string; qty: number; chance: number }[];
  desc: string;
  energyCost: number;
  craftTime?: number;
};

type CraftingBonus = {
  baseYieldMultiplier: number;
  bonusChanceMultiplier: number;
  energyReduction: number;
  criticalCraftChance: number;
};

type PurchaseResult = { message: string; newBalance: number };

type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  purchased: boolean;
  soldCount: number;
  maxQuantity?: number;
};

/* ===========================
   Small helpers
   =========================== */

async function fetchJSON<T>(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input, { credentials: 'include', ...init });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((j as any)?.error || r.statusText);
  return j as T;
}

function short(addr?: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';
}

/* ===========================
   Provider helpers (robust)
   =========================== */

async function requestAccounts(provider: any): Promise<string[]> {
  if (!provider) return [];
  if (typeof provider.request === 'function') {
    return (await provider.request({ method: 'eth_requestAccounts' })) as string[];
  }
  if (typeof provider.enable === 'function') {
    return (await provider.enable()) as string[];
  }
  if (typeof provider.send === 'function') {
    const res = await provider.send('eth_requestAccounts', []);
    return Array.isArray(res) ? res : res?.result ?? [];
  }
  return [];
}

async function personalSign(provider: any, wallet: string, message: string): Promise<string> {
  if (provider?.request) {
    return (await provider.request({
      method: 'personal_sign',
      params: [message, wallet],
    })) as string;
  }
  if (typeof provider.send === 'function') {
    const res = await provider.send('personal_sign', [message, wallet]);
    return res?.result ?? res;
  }
  throw new Error('Wallet does not support personal_sign');
}

/* ===========================
   Enhanced UI/UX Constants
   =========================== */

// Animation variants for smooth transitions
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Enhanced tier colors with gradients
const TIER_STYLES = {
  COMMON: {
    gradient: 'from-slate-600 to-slate-500',
    border: 'border-slate-500/40',
    text: 'text-slate-200',
    glow: 'shadow-slate-500/20'
  },
  UNCOMMON: {
    gradient: 'from-green-600 to-emerald-500',
    border: 'border-green-500/40',
    text: 'text-green-200',
    glow: 'shadow-green-500/20'
  },
  RARE: {
    gradient: 'from-blue-600 to-cyan-500',
    border: 'border-blue-500/40',
    text: 'text-blue-200',
    glow: 'shadow-blue-500/20'
  },
  EPIC: {
    gradient: 'from-purple-600 to-pink-500',
    border: 'border-purple-500/40',
    text: 'text-purple-200',
    glow: 'shadow-purple-500/20'
  }
};

const CORE_CRAFTING_BONUSES: Record<string, CraftingBonus> = {
  'none': {
    baseYieldMultiplier: 1.0,
    bonusChanceMultiplier: 1.0,
    energyReduction: 0,
    criticalCraftChance: 0,
  },
  'core_common': {
    baseYieldMultiplier: 1.1,
    bonusChanceMultiplier: 1.2,
    energyReduction: 1,
    criticalCraftChance: 0.05,
  },
  'core_uncommon': {
    baseYieldMultiplier: 1.25,
    bonusChanceMultiplier: 1.5,
    energyReduction: 2,
    criticalCraftChance: 0.10,
  },
  'core_rare': {
    baseYieldMultiplier: 1.5,
    bonusChanceMultiplier: 2.0,
    energyReduction: 3,
    criticalCraftChance: 0.20,
  },
};

const ENHANCED_RECIPES: Recipe[] = [
  // CORE EQUIPMENT
  {
    key: 'CRAFT_CORE_COMMON',
    name: 'Basic Neural Core',
    category: 'CORE',
    tier: 'COMMON',
    requires: { RUNE_A: 3, RUNE_B: 2, CAT_X: 1 },
    baseOutput: { item: 'core_common', qty: 1 },
    bonusOutput: [
      { item: 'FLUX_RESIDUE', qty: 1, chance: 0.3 }
    ],
    desc: 'Forge a basic neural processing core. Provides +10% crafting yield when equipped.',
    energyCost: 15,
    craftTime: 30,
  },
  {
    key: 'CRAFT_CORE_UNCOMMON',
    name: 'Enhanced Neural Core',
    category: 'CORE',
    tier: 'UNCOMMON',
    requires: { RUNE_C: 4, RUNE_D: 3, CAT_Y: 2, FLUX_RESIDUE: 2 },
    baseOutput: { item: 'core_uncommon', qty: 1 },
    bonusOutput: [
      { item: 'QUANTUM_DUST', qty: 1, chance: 0.25 },
      { item: 'FLUX_RESIDUE', qty: 2, chance: 0.4 }
    ],
    desc: 'Synthesize an enhanced neural core with quantum resonance chambers. +25% crafting yield.',
    energyCost: 25,
    craftTime: 60,
  },
  {
    key: 'CRAFT_CORE_RARE',
    name: 'Quantum Neural Core',
    category: 'CORE',
    tier: 'RARE',
    requires: { RUNE_E: 5, RUNE_F: 4, CAT_Z: 3, QUANTUM_DUST: 3, core_uncommon: 1 },
    baseOutput: { item: 'core_rare', qty: 1 },
    bonusOutput: [
      { item: 'TEMPORAL_ESSENCE', qty: 1, chance: 0.2 },
      { item: 'QUANTUM_DUST', qty: 2, chance: 0.3 }
    ],
    desc: 'Craft the ultimate neural processing core with temporal stabilizers. +50% yield, 20% crit chance.',
    energyCost: 40,
    craftTime: 120,
  },
  // AMPLIFIERS (Boost specific recipe categories)
  {
    key: 'CRAFT_AMP_SIGIL',
    name: 'Sigil Amplifier',
    category: 'AMPLIFIER',
    tier: 'UNCOMMON',
    requires: { RUNE_B: 3, RUNE_C: 2, FLUX_RESIDUE: 2 },
    baseOutput: { item: 'amp_sigil', qty: 1 },
    bonusOutput: [
      { item: 'HARMONIC_CRYSTAL', qty: 1, chance: 0.3 }
    ],
    desc: 'Specialized amplifier that doubles sigil crafting output when equipped.',
    energyCost: 20,
  },
  {
    key: 'CRAFT_AMP_LENS',
    name: 'Lens Amplifier',
    category: 'AMPLIFIER',
    tier: 'UNCOMMON',
    requires: { RUNE_D: 3, RUNE_E: 2, QUANTUM_DUST: 1 },
    baseOutput: { item: 'amp_lens', qty: 1 },
    bonusOutput: [
      { item: 'PRISMATIC_SHARD', qty: 1, chance: 0.25 }
    ],
    desc: 'Precision amplifier that enhances lens crafting precision and yield.',
    energyCost: 22,
  },
  // CATALYSTS (Reduce energy costs)
  {
    key: 'CRAFT_CAT_EFFICIENCY',
    name: 'Efficiency Catalyst',
    category: 'CATALYST',
    tier: 'RARE',
    requires: { TEMPORAL_ESSENCE: 2, QUANTUM_DUST: 4, HARMONIC_CRYSTAL: 2 },
    baseOutput: { item: 'cat_efficiency', qty: 1 },
    desc: 'Reduces all crafting energy costs by 25% when equipped.',
    energyCost: 35,
  },
  // SIGILS (Enhanced versions with better stats)
  {
    key: 'CRAFT_SIGIL_RESONANCE',
    name: 'Resonance Sigil',
    category: 'SIGIL',
    tier: 'UNCOMMON',
    requires: { RUNE_A: 2, RUNE_B: 1, CAT_X: 1, HARMONIC_CRYSTAL: 1 },
    baseOutput: { item: 'sigil_resonance', qty: 1 },
    bonusOutput: [
      { item: 'ECHO_FRAGMENT', qty: 1, chance: 0.4 }
    ],
    desc: 'An enhanced ear sigil that resonates with neural frequencies.',
    energyCost: 18,
  },
  {
    key: 'CRAFT_SIGIL_QUANTUM',
    name: 'Quantum Sigil',
    category: 'SIGIL',
    tier: 'RARE',
    requires: { RUNE_C: 3, RUNE_D: 2, CAT_Y: 2, QUANTUM_DUST: 2 },
    baseOutput: { item: 'sigil_quantum', qty: 1 },
    bonusOutput: [
      { item: 'VOID_ESSENCE', qty: 1, chance: 0.2 },
      { item: 'ECHO_FRAGMENT', qty: 2, chance: 0.3 }
    ],
    desc: 'A sigil infused with quantum entanglement properties.',
    energyCost: 30,
  },
  // LENSES (Enhanced optic equipment)
  {
    key: 'CRAFT_LENS_PRISMATIC',
    name: 'Prismatic Lens',
    category: 'LENS',
    tier: 'UNCOMMON',
    requires: { RUNE_D: 2, RUNE_E: 1, CAT_Z: 1, PRISMATIC_SHARD: 1 },
    baseOutput: { item: 'lens_prismatic', qty: 1 },
    bonusOutput: [
      { item: 'SPECTRUM_CORE', qty: 1, chance: 0.35 }
    ],
    desc: 'Multi-spectrum optical lens for enhanced perception.',
    energyCost: 20,
  },
  {
    key: 'CRAFT_LENS_TEMPORAL',
    name: 'Temporal Lens',
    category: 'LENS',
    tier: 'EPIC',
    requires: { RUNE_F: 4, CAT_Z: 3, TEMPORAL_ESSENCE: 3, SPECTRUM_CORE: 2 },
    baseOutput: { item: 'lens_temporal', qty: 1 },
    bonusOutput: [
      { item: 'CHRONO_FRAGMENT', qty: 1, chance: 0.15 },
      { item: 'VOID_ESSENCE', qty: 1, chance: 0.25 }
    ],
    desc: 'Legendary lens capable of perceiving temporal anomalies.',
    energyCost: 50,
    craftTime: 180,
  },
];

/* ===========================
   Memory puzzle (enhanced sci-fi)
   =========================== */

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStringToSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Enhanced UI Components
function AnimatedCounter({ value, suffix = '', prefix = '', className = '' }: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = React.useState(value);

  React.useEffect(() => {
    const startValue = displayValue;
    const endValue = value;
    const duration = 600;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const currentValue = Math.floor(startValue + (endValue - startValue) * progress);
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={className}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

function ProgressRing({ progress, size = 60, strokeWidth = 4, className = '' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-cyan-200">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}

function ScanMemory({
  seed,
  onSolved,
  disabled,
}: {
  seed: string;
  onSolved: (score: number) => void;
  disabled?: boolean;
}) {
  const rng = React.useMemo(() => mulberry32(hashStringToSeed(seed || 'seedless')), [seed]);

  const faces = React.useMemo(() => {
    const base = ['🧬', '🔬', '🧪', '⚗️', '🔋', '💎', '⚡', '🌀']; // Icons rendered in JSX below
    return base.slice(0, 8);
  }, []);

  const getIconComponent = (emoji: string) => {
    const iconProps = { className: "w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-cyan-300" };
    switch (emoji) {
      case '🧬': return <Atom {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-emerald-400" />;
      case '🔬': return <Microscope {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-400" />;
      case '🧪': return <FlaskConical {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-purple-400" />;
      case '⚗️': return <Beaker {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-orange-400" />;
      case '🔋': return <Battery {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-yellow-400" />;
      case '💎': return <Gem {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-pink-400" />;
      case '⚡': return <Zap {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-amber-400" />;
      case '🌀': return <Wind {...iconProps} className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-teal-400" />;
      default: return <Settings {...iconProps} />;
    }
  };

  const deck = React.useMemo(() => {
    const arr = [...faces, ...faces];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [faces, rng]);

  const [revealed, setRevealed] = React.useState<number[]>([]);
  const [matched, setMatched] = React.useState<boolean[]>(() => Array(16).fill(false));
  const [flips, setFlips] = React.useState(0);

  // reset when seed/deck changes
  React.useEffect(() => {
    setRevealed([]);
    setMatched(Array(deck.length).fill(false));
    setFlips(0);
  }, [deck.length, seed]);

  function clickCard(i: number) {
    if (disabled) return;
    if (matched[i]) return;
    if (revealed.includes(i)) return;
    if (revealed.length === 2) return;

    const next = [...revealed, i];
    setRevealed(next);

    if (next.length === 2) {
      setFlips((f) => f + 1);
      const [a, b] = next;
      if (deck[a] === deck[b]) {
        setTimeout(() => {
          setMatched((m) => {
            const mm = m.slice();
            mm[a] = true;
            mm[b] = true;
            return mm;
          });
          setRevealed([]);
        }, 250);
      } else {
        setTimeout(() => setRevealed([]), 700);
      }
    }
  }

  // ✅ Call onSolved AFTER render when puzzle is complete
  React.useEffect(() => {
    if (matched.length && matched.every(Boolean)) {
      const optimalPairs = faces.length; // minimal number of flips ≈ number of pairs
      const efficiency = optimalPairs / Math.max(flips, optimalPairs);
      const score = Math.min(1, Math.max(0.5, efficiency));
      // schedule to guarantee it runs after commit
      queueMicrotask(() => onSolved(score));
    }
  }, [matched, faces.length, flips, onSolved]);

  const cols = 4;

  return (
    <div className="relative rounded-xl border border-primary-500/30 bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary-950/30 p-4 sm:p-6 shadow-2xl backdrop-blur-sm ">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary-500/5 to-transparent"></div>
      <div className="relative z-10">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-primary-400"></div>
            <div className="text-base sm:text-lg font-semibold text-cyan-100 tracking-wider">
              NEURAL SCAN MATRIX
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-cyan-300/80">
            <span className="bg-cyan-950/50 px-2 py-1 rounded border border-cyan-700/30 font-mono">
              FLIPS: {flips}
            </span>
            <ProgressRing
              progress={Math.min(100, (matched.filter(Boolean).length / matched.length) * 100)}
              size={32}
              strokeWidth={3}
            />
          </div>
        </div>

        <div className="grid gap-2 sm:gap-3 grid-cols-4">
          {deck.map((face, i) => {
            const up = revealed.includes(i) || matched[i];
            const isMatched = matched[i];
            return (
              <button
                key={i}
                onClick={() => clickCard(i)}
                disabled={disabled}
                className={`relative h-16 sm:h-20 md:h-24 rounded-lg border-2 text-xl sm:text-2xl md:text-3xl flex items-center justify-center overflow-hidden ${
                  isMatched
                    ? 'border-success-400/60 bg-gradient-to-br from-success-900/40 to-success-800/20 shadow-success-400/20 shadow-lg'
                    : up
                    ? 'border-primary-400/60 bg-gradient-to-br from-primary-900/40 to-primary-800/20 shadow-primary-400/20 shadow-lg'
                    : 'border-neutral-600/40 bg-gradient-to-br from-neutral-800 to-neutral-900 hover:border-primary-500/50  '
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="absolute inset-0 opacity-10">
                  <div className="h-full w-full bg-gradient-to-br from-transparent via-primary-500/20 to-transparent"></div>
                </div>
                <span className={`relative z-10 ${up ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                  {getIconComponent(face)}
                </span>
                <span className={`absolute inset-0 flex items-center justify-center text-slate-200 ${up ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`}>
                  ◊
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-cyan-300/70 font-mono">MATCH NEURAL PATTERNS TO COMPLETE SCAN</p>
          <div className="flex items-center gap-1 text-xs text-cyan-400/80">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></div>
            <span className="font-mono">SCANNING...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Daily Missions Panel
   =========================== */

type Mission = {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  reward: { rzn: number; items?: { item: string; qty: number }[] };
  completed: boolean;
  claimed: boolean;
};

// Enhanced Mission Card Component
function MissionCard({ mission, onClaim, busy }: {
  mission: Mission;
  onClaim: (id: string) => void;
  busy: boolean;
}) {
  const progressPct = Math.min(100, (mission.progress / mission.target) * 100);
  const isCompleted = mission.completed;
  const isClaimed = mission.claimed;

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all duration-200 hover:border-slate-400/50 ${
        isCompleted
          ? 'border-success-500/50 bg-gradient-to-br from-success-950/30 to-success-900/20'
          : 'border-slate-600/30 bg-gradient-to-br from-slate-800/30 to-slate-900/20 hover:border-slate-500/40'
      }`}
    >
      {/* Mission Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-base font-semibold text-slate-200">{mission.title}</div>
            {isCompleted && (
              <div className="">
                <span className="text-emerald-400 text-sm">✓</span>
              </div>
            )}
          </div>
          <div className="text-sm text-slate-200">{mission.description}</div>
        </div>
        <div className="text-right text-xs font-mono ml-4">
          <div className={`font-bold ${
            isCompleted ? 'text-emerald-300' : 'text-slate-200'
          }`}>
            {mission.progress}/{mission.target}
          </div>
        </div>
      </div>

      {/* Enhanced Progress Ring */}
      <div className="flex items-center gap-4 mb-3">
        <ProgressRing
          progress={progressPct}
          size={40}
          strokeWidth={3}
          className="flex-shrink-0"
        />
        <div className="flex-1">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-2 transition-all duration-500 ${
                isCompleted ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 'bg-gradient-to-r from-cyan-400 to-blue-400'
              }`}
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-300 font-mono font-medium">Reward:</span>
          <span className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-900/30 border border-yellow-700/30 text-yellow-300">
            <Gem className="w-4 h-4" />
            <AnimatedCounter value={mission.reward.rzn} suffix=" RZN" />
          </span>
          {mission.reward.items?.map((item, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-blue-900/30 border border-blue-700/30 text-blue-300">
              <Package className="w-4 h-4" />
              <AnimatedCounter value={item.qty} suffix={` ${item.item}`} />
            </span>
          ))}
        </div>

        <button
          onClick={() => onClaim(mission.id)}
          disabled={busy || !isCompleted || isClaimed}
          className={`relative overflow-hidden rounded-lg border px-4 py-2 text-xs font-semibold font-mono tracking-wider transition-all duration-200 ${
            isCompleted && !isClaimed && !busy
              ? 'border-emerald-400/60 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 hover:shadow-emerald-400/30 hover:shadow-lg hover:scale-105'
              : isClaimed
              ? 'border-emerald-700/40 bg-emerald-950/50 text-emerald-300/80 cursor-not-allowed'
              : busy
              ? 'border-amber-500/50 bg-gradient-to-r from-amber-600 to-amber-500 text-white cursor-not-allowed'
              : 'border-slate-600/40 bg-slate-800/60 text-slate-400 cursor-not-allowed'
          }`}
        >
          {(isCompleted && !isClaimed && !busy) && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
          )}
          <span className="relative z-10">
            {busy ? 'CLAIMING...' : isClaimed ? '✓ CLAIMED' : isCompleted ? 'CLAIM REWARD' : 'LOCKED'}
          </span>
        </button>
      </div>
    </div>
  );
}

function DailyMissionsPanel({
  me,
  onMissionClaim,
  busy = false,
  push,
}: {
  me: Me | null;
  onMissionClaim?: () => void;
  busy?: boolean;
  push: (arg: string | { message: string; type?: "success" | "error" | "warning" | "info"; description?: string }) => void;
}) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsBusy, setMissionsBusy] = useState(false);

  const fetchMissions = async () => {
    try {
      const res = await fetch('/api/missions', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (e) {
      console.warn('Failed to fetch missions:', e);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [me]); // Refresh when me updates

  const claimMission = async (missionId: string) => {
    setMissionsBusy(true);
    try {
      const res = await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ missionId }),
      });

      if (res.ok) {
        const data = await res.json();
        push({
          message: `Mission completed! +${data.reward.rzn} RZN ${data.reward.items?.map((i: any) => `+${i.qty} ${i.item}`).join(' ') || ''}`,
          type: 'success'
        });
        await fetchMissions(); // Refresh missions
        onMissionClaim?.(); // Refresh other data
      } else {
        const error = await res.json();
        push({ message: error.error || 'Failed to claim mission', type: 'error' });
      }
    } catch (e) {
      push({ message: 'Failed to claim mission', type: 'error' });
    } finally {
      setMissionsBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-4 sm:p-6 shadow-2xl backdrop-blur-sm ">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-yellow-400 "></div>
          <h3 className="text-lg font-semibold text-cyan-100 tracking-wider">
            DAILY NEURAL MISSIONS
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-yellow-300">
          <span>⏰</span>
          <span>Resets Daily</span>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {missions.map((mission) => (
          <MissionCard
            key={mission.id}
            mission={mission}
            onClaim={claimMission}
            busy={missionsBusy || busy}
          />
        ))}
      </div>

      {missions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-slate-200 text-sm mb-2"><Target className="w-4 h-4" /></div>
          <div className="text-slate-200 text-sm">
            No missions available at the moment
          </div>
        </div>
      )}

      <div className="mt-6 text-xs text-slate-200 text-center border-t border-slate-700/30 pt-4">
        <span className="inline-flex items-center gap-2">
          <span>🌏</span>
          <span>Missions reset daily at midnight UTC+8</span>
        </span>
      </div>
    </div>
  );
}

/* ===========================
   Enhanced Crafting Panel
   =========================== */

function EnhancedCraftingPanel({
  recipes = ENHANCED_RECIPES,
  inventory = [],
  equippedCore = 'none',
  energy = 0,
  onCraft,
  busy = false,
}: {
  recipes?: Recipe[];
  inventory?: { item: string; qty: number }[];
  equippedCore?: string;
  energy?: number;
  onCraft?: (recipeKey: string) => void;
  busy?: boolean;
}) {
  const [selectedCategory, setSelectedCategory] = React.useState<Recipe['category'] | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = React.useState<Recipe['tier'] | 'ALL'>('ALL');

  const bonuses = CORE_CRAFTING_BONUSES[equippedCore] || CORE_CRAFTING_BONUSES.none;

  const getInventoryQty = (item: string) => 
    inventory.find(i => i.item === item)?.qty || 0;

  const canCraft = (recipe: Recipe) => {
    const adjustedEnergyCost = Math.max(1, recipe.energyCost - bonuses.energyReduction);
    if (energy < adjustedEnergyCost) return false;
    
    return Object.entries(recipe.requires).every(([item, qty]) => 
      getInventoryQty(item) >= qty
    );
  };

  const calculateOutput = (recipe: Recipe) => {
    const baseQty = Math.floor(recipe.baseOutput.qty * bonuses.baseYieldMultiplier);
    const criticalChance = bonuses.criticalCraftChance;
    const bonusItems = recipe.bonusOutput?.map(bonus => ({
      ...bonus,
      chance: Math.min(1, bonus.chance * bonuses.bonusChanceMultiplier)
    })) || [];

    return { baseQty, criticalChance, bonusItems };
  };

  const filteredRecipes = recipes.filter(recipe => {
    if (selectedCategory !== 'ALL' && recipe.category !== selectedCategory) return false;
    if (selectedTier !== 'ALL' && recipe.tier !== selectedTier) return false;
    return true;
  });

  const getTierColor = (tier: Recipe['tier']) => {
    switch (tier) {
      case 'COMMON': return 'text-slate-300 border-slate-500/30';
      case 'UNCOMMON': return 'text-green-300 border-green-500/30';
      case 'RARE': return 'text-blue-300 border-blue-500/30';
      case 'EPIC': return 'text-purple-300 border-purple-500/30';
      default: return 'text-slate-300 border-slate-500/30';
    }
  };

  const getCategoryIcon = (category: Recipe['category']) => {
    const iconProps = { className: "w-4 h-4" };
    switch (category) {
      case 'CORE': return <Brain {...iconProps} />;
      case 'AMPLIFIER': return <Radio {...iconProps} />;
      case 'CATALYST': return <FlaskRound {...iconProps} />;
      case 'SIGIL': return <Star {...iconProps} />;
      case 'LENS': return <Search {...iconProps} />;
      default: return <Settings {...iconProps} />;
    }
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-3 w-3 rounded-full bg-purple-400 "></div>
        <h3 className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
          NEURAL CRAFTING LAB
        </h3>
      </div>

      {/* Equipment Bonuses Display */}
      {equippedCore !== 'none' && (
        <div className="mb-6 rounded-lg border border-emerald-700/30 bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-emerald-300 font-mono text-sm">ACTIVE BONUSES</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="text-emerald-200">
              Yield: +{Math.round((bonuses.baseYieldMultiplier - 1) * 100)}%
            </div>
            <div className="text-emerald-200">
              Bonus Chance: +{Math.round((bonuses.bonusChanceMultiplier - 1) * 100)}%
            </div>
            <div className="text-emerald-200">
              Energy: -{bonuses.energyReduction}
            </div>
            <div className="text-emerald-200">
              Crit: {Math.round(bonuses.criticalCraftChance * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-200 font-mono">CATEGORY:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="rounded border border-slate-600/30 bg-slate-800/50 px-3 py-1 text-xs font-mono text-slate-200"
          >
            <option value="ALL">ALL</option>
            <option value="CORE">CORE</option>
            <option value="AMPLIFIER">AMPLIFIER</option>
            <option value="CATALYST">CATALYST</option>
            <option value="SIGIL">SIGIL</option>
            <option value="LENS">LENS</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-200 font-mono">TIER:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
            className="rounded border border-slate-600/30 bg-slate-800/50 px-3 py-1 text-xs font-mono text-slate-200"
          >
            <option value="ALL">ALL</option>
            <option value="COMMON">COMMON</option>
            <option value="UNCOMMON">UNCOMMON</option>
            <option value="RARE">RARE</option>
            <option value="EPIC">EPIC</option>
          </select>
        </div>
      </div>

      {/* Recipes Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredRecipes.map((recipe) => {
          const craftable = canCraft(recipe);
          const output = calculateOutput(recipe);
          const adjustedEnergyCost = Math.max(1, recipe.energyCost - bonuses.energyReduction);

          return (
            <div
              key={recipe.key}
              className={`rounded-lg border p-4 ${
                craftable 
                  ? 'border-slate-600/30 bg-slate-800/30 hover:bg-slate-700/30' 
                  : 'border-slate-700/20 bg-slate-900/20 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(recipe.category)}</span>
                  <div>
                    <div className="font-mono font-semibold text-slate-200">{recipe.name}</div>
                    <div className={`inline-block rounded px-2 py-0.5 text-xs font-mono border ${getTierColor(recipe.tier)}`}>
                      {recipe.tier}
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="text-orange-300 flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    {adjustedEnergyCost}
                  </div>
                  {recipe.craftTime && (
                    <div className="text-slate-200 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {recipe.craftTime}s
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-3">{recipe.desc}</p>

              {/* Requirements */}
              <div className="mb-3">
                <div className="text-xs text-slate-200 font-mono mb-2">MATERIALS REQUIRED:</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(recipe.requires).map(([item, qty]) => {
                    const have = getInventoryQty(item);
                    const sufficient = have >= qty;
                    return (
                      <span
                        key={item}
                        className={`rounded px-2 py-1 text-xs font-mono border ${
                          sufficient 
                            ? 'border-green-600/30 bg-green-900/20 text-green-200' 
                            : 'border-red-600/30 bg-red-900/20 text-red-200'
                        }`}
                      >
                        {item} {have}/{qty}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Output Preview */}
              <div className="mb-4">
                <div className="text-xs text-slate-200 font-mono mb-2">CRAFTING OUTPUT:</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-200">{recipe.baseOutput.item}</span>
                    <span className="font-mono text-green-300">
                      ×{output.baseQty}
                      {output.criticalChance > 0 && (
                        <span className="text-yellow-300 ml-1">
                          (+{Math.round(output.criticalChance * 100)}% double)
                        </span>
                      )}
                    </span>
                  </div>
                  {output.bonusItems.map((bonus, i) => (
                    <div key={i} className="flex items-center justify-between text-xs text-slate-200">
                      <span>{bonus.item}</span>
                      <span>×{bonus.qty} ({Math.round(bonus.chance * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onCraft?.(recipe.key)}
                disabled={busy || !craftable}
                className={`w-full rounded border px-4 py-2 font-mono text-sm font-semibold ${
                  craftable && !busy
                    ? 'border-purple-500/50 bg-purple-900/50 text-purple-100 hover:bg-purple-800/50 hover:shadow-purple-500/20 '
                    : 'border-slate-600/30 bg-slate-800/50 text-slate-200 cursor-not-allowed'
                }`}
              >
                {busy ? 'CRAFTING...' : craftable ? 'CRAFT' : 'INSUFFICIENT MATERIALS'}
              </button>
            </div>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-8">
          <div className="text-slate-200 font-mono text-sm">
            // NO CRAFTING BLUEPRINTS MATCH CURRENT FILTERS
          </div>
        </div>
      )}
    </div>
  );
}


/* ===========================
   Wallet Gate (Tanto Connect; no guest)
   =========================== */

import {
  requestRoninWalletConnector,
  ConnectorEvent,
} from '@sky-mavis/tanto-connect';

type ToastFn = (o: { message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => void;

function WalletGate({
  me,
  onAuthed,
  pushToast,
}: {
  me: Me | null;
  onAuthed: () => void;
  pushToast: ToastFn;
}) {
  async function connect() {
    try {
      const connector = await requestRoninWalletConnector();

      connector.on(ConnectorEvent.DISCONNECT, () => {
        pushToast({ message: 'Disconnected.', type: 'info' });
      });
      connector.on(ConnectorEvent.ACCOUNTS_CHANGED, () => {
        // optionally refresh UI on account switch
      });
      await connector.autoConnect?.();

      const accounts = await connector.requestAccounts();
      const wallet = (accounts?.[0] || '').toLowerCase();
      if (!wallet) throw new Error('No wallet account returned');

      const { message } = await fetchJSON<{ message: string }>('/api/auth/nonce', { method: 'POST' });

      const provider = await connector.getProvider(); // EIP-1193
      const signature: string = await provider.request({
        method: 'personal_sign',
        params: [message, wallet],
      });

      await fetchJSON('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, signature, message }),
      });

      pushToast({ message: 'Wallet connected.', type: 'success' });
      onAuthed();
    } catch (e: any) {
      const msg = String(e?.message || e);
      const cancelled = /user rejected|user denied|rejected the request|request rejected|cancel/i.test(msg);
      pushToast({
        message: cancelled ? 'Connection request was cancelled.' : `Connect failed: ${msg}`,
        type: cancelled ? 'warning' : 'error',
      });
      console.warn('wallet connect failed', e);
    }
  }

  async function disconnect() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
      try {
        const anyWin = window as any;
        const provider = anyWin.ronin || anyWin.ethereum;
        if (provider?.request) {
          await provider.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }],
          }).catch(() => {});
        }
      } catch {}
    } finally {
      location.reload();
    }
  }

  return (
    <div className="flex items-center gap-3">
      {me?.wallet ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-slate-900 to-cyan-950/30 px-4 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400 "></div>
            <div className="font-mono text-cyan-100 tracking-wider">{short(me.wallet)}</div>
          </div>
          <button
            onClick={disconnect}
            className="text-sm text-cyan-300/80 font-mono hover:text-cyan-200 underline decoration-dotted hover:decoration-solid transition-colors"
          >
            DISCONNECT
          </button>
        </div>
      ) : (
        <button
          onClick={connect}
          className="relative overflow-hidden rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 font-mono font-semibold text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 "
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative z-10">CONNECT NEURAL LINK</span>
        </button>
      )}
    </div>
  );
}

/* ===========================
   Discord Connection Component
   =========================== */

function DiscordConnection({
  me,
  discordLink,
  discordLoading,
  onConnect
}: {
  me: Me | null;
  discordLink: DiscordLink | null;
  discordLoading: boolean;
  onConnect: () => void;
}) {
  if (!me?.wallet) return null;

  return (
    <div className="flex items-center gap-3">
      {discordLink ? (
        <div className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-gradient-to-r from-slate-900 to-purple-950/30 px-3 sm:px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-purple-400 "></div>
          <div className="font-mono text-purple-100 tracking-wider text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">
            {discordLink.discord_global_name || `${discordLink.discord_username}#${discordLink.discord_discriminator}`}
          </div>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={discordLoading}
          className="relative overflow-hidden rounded-lg border border-purple-500/50 bg-gradient-to-r from-purple-600 to-indigo-600 px-4 sm:px-6 py-2 font-mono font-semibold text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
          <span className="relative z-10">
            {discordLoading ? 'CONNECTING...' : (
              <>
                <span className="hidden sm:inline">CONNECT DISCORD</span>
                <span className="sm:hidden">DISCORD</span>
              </>
            )}
          </span>
        </button>
      )}
    </div>
  );
}


/* ===========================
   Main Page
   =========================== */

export default function PlayPage(): JSX.Element {
  const [me, setMe] = React.useState<Me | null>(null);
  const [inv, setInv] = React.useState<InvRow[]>([]);
  const [lb, setLb] = React.useState<LbRow[]>([]);
  const [risk, setRisk] = React.useState<Risk>('STANDARD');
  const [equippedCore, setEquippedCore] = React.useState<string>('none');

  // Discord state
  const [discordLink, setDiscordLink] = React.useState<DiscordLink | null>(null);
  const [discordLoading, setDiscordLoading] = React.useState(false);

  const [scan, setScan] = React.useState<ScanRun>(null);
  const [busy, setBusy] = React.useState(false);
  const [stabRes, setStabRes] = React.useState<StabilizeResult | null>(null);

  // ---- SHOP state
  const [shopItems, setShopItems] = React.useState<ShopItem[]>([]);
  const [shopLoading, setShopLoading] = React.useState(false);
  const [purchaseResult, setPurchaseResult] = React.useState<PurchaseResult | null>(null);

  // Toast (hook lives here — component scope only)
  const { toast } = useToast();

  const push = React.useCallback(
  (
    arg:
      | string
      | { message: string; type?: "success" | "error" | "warning" | "info"; description?: string }
  ) => {
    if (typeof arg === "string") {
      toast({ title: arg });
      return;
    }
    const variant = arg.type === "error" ? "destructive" : "default";
    toast({ title: arg.message, description: arg.description, variant });
  },
  [toast]
);

  // Loaders
  const refreshMe = React.useCallback(async () => {
    try {
      const data = await fetchJSON<Me>('/api/me', { cache: 'no-store' });
      setMe(data);
    } catch {
      setMe(null);
    }
  }, []);
  
  const refreshInv = React.useCallback(async () => {
    try {
      const data = await fetchJSON<{ items: InvRow[] }>('/api/inventory', { cache: 'no-store' });
      setInv(data.items || []);
    } catch {
      setInv([]);
    }
  }, []);
  
  const refreshLb = React.useCallback(async () => {
    try {
      const data = await fetchJSON<{ rows: LbRow[] }>('/api/leaderboard', { cache: 'no-store' });
    setLb(data.rows || []);
    } catch {
      setLb([]);
    }
  }, []);

  const refreshDiscord = React.useCallback(async () => {
    if (!me?.wallet) {
      setDiscordLink(null);
      return;
    }
    try {
      const data = await fetchJSON<{ linked: boolean; discord_link: DiscordLink | null }>('/api/discord/status', { cache: 'no-store' });
      setDiscordLink(data.discord_link);
    } catch {
      setDiscordLink(null);
    }
  }, [me?.wallet]);

  const connectDiscord = React.useCallback(() => {
    if (!me?.wallet) {
      push({ message: 'Connect your wallet first', type: 'warning' });
      return;
    }

    setDiscordLoading(true);

    // Create Discord OAuth URL with wallet as state
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!)}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || 'http://localhost:3000/api/auth/discord/callback')}&response_type=code&scope=identify%20email%20guilds.join&state=${encodeURIComponent(me.wallet)}`;

    // Open Discord OAuth in new window
    window.open(discordAuthUrl, '_blank');

    // Reset loading state after a short delay
    setTimeout(() => setDiscordLoading(false), 2000);
  }, [me?.wallet, push]);

  const refreshShop = React.useCallback(async () => {
    try {
      setShopLoading(true);
      const data = await fetchJSON<{ items: ShopItem[] }>('/api/shop', { cache: 'no-store' });
      setShopItems(data.items || []);
    } catch {
      setShopItems([]);
    } finally {
      setShopLoading(false);
    }
  }, []);

  const refreshEquipment = React.useCallback(async () => {
    try {
      const data = await fetchJSON<{ core: string }>('/api/equip', { cache: 'no-store' });
      setEquippedCore(data.core || 'none');
    } catch {
      setEquippedCore('none');
    }
  }, []);

  React.useEffect(() => {
    refreshMe();
    refreshInv();
    refreshLb();
    refreshShop();
    refreshEquipment();
  }, [refreshMe, refreshInv, refreshLb, refreshShop, refreshEquipment]);

  // Load Discord status when wallet changes
  React.useEffect(() => {
    refreshDiscord();
  }, [refreshDiscord]);

  // Handle Discord OAuth callback messages
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const discordSuccess = params.get('discord_success');
    const discordError = params.get('discord_error');

    if (discordSuccess === 'linked') {
      push({ message: 'Discord account linked successfully!', type: 'success' });
      refreshDiscord(); // Refresh Discord status
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (discordError) {
      let errorMessage = 'Discord connection failed';
      switch (discordError) {
        case 'access_denied':
          errorMessage = 'Discord access denied';
          break;
        case 'missing_params':
          errorMessage = 'Discord connection parameters missing';
          break;
        case 'oauth_failed':
          errorMessage = 'Discord OAuth failed';
          break;
      }
      push({ message: errorMessage, type: 'error' });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [push, refreshDiscord]);

  // Actions
  async function doRefuel() {
    try {
      setBusy(true);
      await fetchJSON('/api/refuel', { method: 'POST' });
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: 'Refueled +10 ENERGY (-5 RZN).', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Refuel failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function startScan() {
    try {
      setBusy(true);
      const res = await fetch('/api/scan/start', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) {
        if (j?.error === 'pending-scan') {
          push({ message: 'Resuming pending scan…', type: 'info' });
          return resumeScan();
        }
        throw new Error(j?.error || 'scan-start-failed');
      }
      setScan({ runId: j.runId, seed: j.seed });
      await refreshMe();
      push({ message: 'Scan initialized. Good luck!', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Start failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function resumeScan() {
    try {
      setBusy(true);
      const j = await fetchJSON<{ runId: string; seed: string }>('/api/scan/resume');
      setScan({ runId: j.runId, seed: j.seed });
      push({ message: 'Scan resumed.', type: 'info' });
    } catch (e: any) {
      push({ message: e?.message || 'No pending scan', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function completeScan(score: number) {
    if (!scan) return;
    try {
      setBusy(true);
      await fetchJSON('/api/scan/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId: scan.runId, score }),
      });
      setScan(null);
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: 'Scan completed and recorded.', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Complete failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function stabilize() {
    try {
      setBusy(true);
      const j = await fetchJSON<StabilizeResult>('/api/stabilize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk }),
      });
      setStabRes(j);
      await Promise.all([refreshMe(), refreshInv(), refreshLb()]);
      push({ message: `Stabilization complete: +${j.rzn} RZN`, type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Stabilize failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function craft(key: string) {
    try {
      setBusy(true);
      await fetchJSON('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      await Promise.all([refreshMe(), refreshInv(), refreshLb(), refreshEquipment()]);
      push({ message: 'Crafting complete.', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Craft failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  // ---- SHOP: buy action (tries /api/shop/buy, falls back to /api/shop/purchase)
  async function buy(itemId: string) {
    try {
      setBusy(true);
      let result: PurchaseResult;
      try {
        result = await fetchJSON<PurchaseResult>('/api/shop/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId }),
        });
      } catch {
        // fallback route name
        result = await fetchJSON<PurchaseResult>('/api/shop/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId }),
        });
      }
      setPurchaseResult(result);
      await Promise.all([refreshMe(), refreshShop()]);
      push({ message: 'Whitelist secured!', type: 'success' });
    } catch (e: any) {
      push({ message: e?.message || 'Purchase failed', type: 'error' });
    } finally {
      setBusy(false);
    }
  }

  const energy = me?.energy ?? 0;
  const rzn = me?.rzn ?? 0;

  return (
    <div className="min-h-screen relative bg-slate-950">
      {/* Neural Network Background */}
      <div
        className="absolute inset-0 opacity-40 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/neural-bg.jpg')",
          backgroundBlendMode: 'soft-light'
        }}
      />
      {/* Light Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/60 via-slate-900/40 to-cyan-950/50" />
      {/* Animated background */}
      <div className="fixed inset-0 opacity-30">
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-20">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-cyan-400 "></div>
              <h1 className="font-mono text-2xl sm:text-3xl font-bold text-cyan-100 tracking-wider">RETRIEVIUM</h1>
              <span className="rounded border border-cyan-500/30 bg-cyan-950/50 px-2 py-1 text-xs text-cyan-300 font-mono">
                PRE-SEASON
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <WalletGate
              me={me}
              onAuthed={async () => {
                await Promise.all([refreshMe(), refreshInv(), refreshLb(), refreshShop(), refreshEquipment()]);
                push({ message: 'Neural link established.', type: 'info' });
              }}
              pushToast={push}
            />
            <DiscordConnection
              me={me}
              discordLink={discordLink}
              discordLoading={discordLoading}
              onConnect={connectDiscord}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Control Panel */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-4 sm:p-6 shadow-2xl backdrop-blur-sm ">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-400 "></div>
                  <span className="text-lg font-semibold text-cyan-100 tracking-wider">
                    LABORATORY CONTROL PANEL
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <span>🔬</span>
                  <span>Neural Interface Active</span>
                </div>
              </div>

              {/* Enhanced Resource Display */}
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative rounded-lg border border-cyan-700/30 bg-gradient-to-br from-slate-800/50 to-cyan-950/30 p-4   ">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold"><Zap className="w-4 h-4" /> ENERGY CORE</div>
                    </div>
                    <ProgressRing
                      progress={Math.min(100, (energy / 100) * 100)}
                      size={32}
                      strokeWidth={3}
                    />
                  </div>
                  <div className="flex items-end gap-3 mb-2">
                    <AnimatedCounter
                      value={energy}
                      className="text-2xl sm:text-3xl font-bold text-cyan-100"
                    />
                    <span className="text-cyan-300/70 text-sm font-medium mb-1">/100</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (energy / 100) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="relative rounded-lg border border-emerald-700/30 bg-gradient-to-br from-slate-800/50 to-emerald-950/30 p-4 hover:border-emerald-600/40 hover:shadow-emerald-500/10 ">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-300 text-sm font-semibold flex items-center gap-1">
                        <Gem className="w-4 h-4" />
                        RZN UNITS
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-300/70">
                      <DollarSign className="w-4 h-4" />
                      <span>Currency</span>
                    </div>
                  </div>
                  <AnimatedCounter
                    value={rzn}
                    className="text-2xl sm:text-3xl font-bold text-emerald-100 block mb-2"
                  />
                  <div className="text-xs text-emerald-300/70 font-medium">
                    Neural Resonance Network tokens
                  </div>
                </div>
              </div>

              {/* Enhanced Scan Operations */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-2 text-sm text-cyan-300 font-semibold tracking-wider">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs font-bold">1</span>
                    NEURAL SCANNING PROTOCOLS
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button
                    onClick={startScan}
                    disabled={busy || energy < 8}
                    className={`relative overflow-hidden rounded-lg border px-4 py-3 font-semibold transition-all duration-200 hover:border-slate-400/50 ${
                      energy >= 8
                        ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 hover:shadow-cyan-500/25 '
                        : 'border-slate-600/30 bg-slate-800/50 text-slate-200 cursor-not-allowed'
                    }`}
                  >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                      <span className="text-lg">🔍</span>
                      <div>
                        <div className="text-sm font-semibold">INITIATE SCAN</div>
                        <div className="text-xs opacity-90">-8 Energy</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={resumeScan}
                    disabled={busy}
                    className="relative overflow-hidden rounded-lg border border-slate-500/50 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 text-slate-200 hover:from-slate-700 hover:to-slate-600 transform "
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <PlayCircle className="w-5 h-5" />
                      <div>
                        <div className="text-sm font-semibold">RESUME SCAN</div>
                        <div className="text-xs opacity-90">Continue</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={doRefuel}
                    disabled={busy || rzn < 5}
                    className={`relative overflow-hidden rounded-lg border px-4 py-3 transform  ${
                      rzn >= 5
                        ? 'border-success-500/50 bg-gradient-to-r from-success-600 to-success-500 text-white hover:from-success-500 hover:to-success-400 hover:shadow-success-500/25 '
                        : 'border-slate-600/30 bg-slate-800/50 text-slate-100 cursor-not-allowed'
                    }`}
                  >
                    <div className="relative z-10 flex items-center justify-center gap-2">
                      <span className="text-lg">⛽</span>
                      <div>
                        <div className="text-sm font-semibold">REFUEL CORE</div>
                        <div className="text-xs opacity-90">+10 Energy / -5 RZN</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Puzzle */}
              {scan && (
                <div className="mb-6">
                  <ScanMemory seed={scan.seed} onSolved={completeScan} disabled={busy} />
                </div>
              )}

              {/* Enhanced Risk Selection */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex items-center gap-2 text-sm text-cyan-300 font-semibold tracking-wider">
                    <span className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold">2</span>
                    RISK ASSESSMENT MATRIX
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([{id: 'SAFE', icon: <Shield className="w-4 h-4" />, name: 'SAFE', desc: 'Low risk, stable'},
                     {id: 'STANDARD', icon: <Scale className="w-4 h-4" />, name: 'STANDARD', desc: 'Balanced approach'},
                     {id: 'OVERCLOCK', icon: <Zap className="w-4 h-4" />, name: 'OVERCLOCK', desc: 'High risk, high reward'}] as const).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRisk(r.id as Risk)}
                      className={`relative rounded-lg border p-4 text-left transform  ${
                        risk === r.id
                          ? 'border-orange-500/50 bg-gradient-to-br from-orange-600/30 to-red-600/30 text-white shadow-orange-500/25 shadow-lg'
                          : 'border-slate-600/30 bg-gradient-to-br from-slate-800/50 to-slate-900/30 text-slate-300 hover:border-orange-500/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{r.icon}</span>
                        <div>
                          <div className="text-sm font-semibold">{r.name}</div>
                          <div className="text-xs opacity-80">{r.desc}</div>
                        </div>
                      </div>
                      {risk === r.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-3 h-3 rounded-full bg-orange-400 "></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Stabilize Button */}
              <div className="relative">
                <button
                  onClick={stabilize}
                  disabled={busy || energy < 12}
                  className={`relative overflow-hidden w-full rounded-xl border px-6 py-6 font-bold text-lg transform  ${
                    energy >= 12
                      ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-500 hover:to-green-500 hover:shadow-emerald-500/25 hover:shadow-xl'
                      : 'border-slate-600/30 bg-slate-800/50 text-slate-200 cursor-not-allowed'
                  }`}
                >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                    <span className="text-2xl">🌀</span>
                    <div>
                      <div className="text-lg font-bold">STABILIZE ANOMALY</div>
                      <div className="text-sm opacity-90">Deploy neural stabilization protocols (-12 Energy)</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 rounded-lg border border-slate-700/30 bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-cyan-400">💡</span>
                  <span className="text-sm font-semibold text-slate-300">Protocol Information</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Neural scans unlock quantum patterns required for anomaly stabilization.
                  Successfully stabilizing anomalies generates RZN rewards and rare crafting materials.
                </p>
              </div>
            </div>

            {/* Inventory */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-blue-400 "></div>
                <h3 className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
                  LABORATORY INVENTORY
                </h3>
              </div>
              {inv.length === 0 ? (
                <div className="text-sm text-slate-200 font-mono bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                  // NO MATERIALS DETECTED
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {inv.map((r) => (
                    <div
                      key={r.item}
                      className="flex items-center justify-between rounded-lg border border-slate-600/30 bg-slate-800/50 px-4 py-3"
                    >
                      <span className="font-mono text-slate-200">{r.item}</span>
                      <span className="rounded bg-cyan-900/50 px-2 py-1 text-xs font-mono text-cyan-100 border border-cyan-700/30">
                        {r.qty}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4">
              <Link
                href="/play/crafting"
                className="group inline-flex items-center gap-2 rounded-md border border-cyan-400/30 bg-cyan-400/5 px-3 py-2 text-xs font-semibold tracking-wide text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400/40 transition-colors"
              >
                <svg
                  className="h-4 w-4 opacity-80 group-hover:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>Open Neural Crafting Laboratory</span>
              </Link>
            </div>

            {/* Daily Missions */}
            <DailyMissionsPanel
              me={me}
              onMissionClaim={() => refreshMe()}
              busy={busy}
              push={push}
            />
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* ===== Laboratory Shop ===== */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-emerald-400 "></div>
                <h3 className="font-mono text-lg font-semibold text-cyan-100 tracking-wider">
                  LABORATORY SHOP
                </h3>
              </div>

              {shopLoading ? (
                <div className="text-sm text-slate-200 font-mono">// LOADING CATALOG…</div>
              ) : shopItems.length === 0 ? (
                <div className="text-sm text-slate-200 font-mono">// NO ITEMS AVAILABLE</div>
              ) : (
                <div className="space-y-4">
                  {shopItems.map((it) => {
                    const soldOut =
                      it.available === false ||
                      (typeof it.maxQuantity === 'number' && it.soldCount >= it.maxQuantity);
                    const cantAfford = (me?.rzn ?? 0) < it.price;
                    const disabled = busy || soldOut || cantAfford;

                    return (
                      <div
                        key={it.id}
                        className="rounded-lg border border-slate-600/30 bg-slate-800/50 p-4"
                      >
                        <div className="font-mono font-semibold text-cyan-100">{it.name}</div>
                        <p className="text-sm text-slate-300 mt-1">{it.description}</p>
                        <div className="mt-2 text-xs text-slate-200 font-mono">
                          // PRICE: <span className="text-emerald-300 font-bold">{it.price}</span>{' '}
                          RZN
                          {typeof it.maxQuantity === 'number' && (
                            <span className="ml-2">
                              // SOLD: {it.soldCount}/{it.maxQuantity}
                            </span>
                          )}
                          {(it as any).purchasedCount > 0 && (
                            <span className="ml-2 text-cyan-300">
                              // OWNED: {(it as any).purchasedCount}
                            </span>
                          )}
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => buy(it.id)}
                            disabled={disabled}
                            className={`w-full rounded-lg border px-4 py-2 font-semibold transition-all ${
                              soldOut || cantAfford || disabled
                                ? 'border-slate-600/30 bg-slate-800/50 text-slate-300 cursor-not-allowed'
                                : 'border-primary-500/50 bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-500 hover:to-primary-400 hover:shadow-lg'
                            }`}
                          >
                            {soldOut
                              ? 'SOLD OUT'
                              : cantAfford
                              ? 'INSUFFICIENT RZN'
                              : 'BUY'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* System Status */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-3 w-3 rounded-full bg-yellow-400 "></div>
                <div className="font-mono font-semibold text-cyan-100 tracking-wider">SYSTEM STATUS</div>
              </div>
              <div className="text-sm text-slate-300 font-mono">
                // Daily reset at midnight (UTC+08:00)
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                <span className="text-emerald-300 font-mono">OPERATIONAL</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-blue-400 "></div>
                <div className="font-mono font-semibold text-cyan-100 tracking-wider">PROTOCOL GUIDE</div>
              </div>
              <div className="space-y-3 text-sm text-slate-300 font-mono">
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">01</span>
                  <span>Connect neural link interface</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">02</span>
                  <span>Initiate scan sequence (8 energy units)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">03</span>
                  <span>Complete neural pattern matching</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">04</span>
                  <span>Select risk protocol level</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">05</span>
                  <span>Execute stabilization (12 energy units)</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">06</span>
                  <span>Collect RZN rewards and materials</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">07</span>
                  <span>Craft cores and equipment for bonuses</span>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-orange-400 "></div>
                <div className="font-mono font-semibold text-cyan-100 tracking-wider">TOP 10 NEURAL RANKINGS</div>
              </div>
              {lb.length === 0 ? (
                <div className="text-sm text-slate-200 font-mono bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                  // NO DATA AVAILABLE
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {lb.slice(0, 10).map((row, idx) => {
                    const mine =
                      me?.wallet && row.wallet.toLowerCase() === me.wallet.toLowerCase();
                    const rankColors = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];
                    const rankColor = rankColors[idx] || 'text-slate-200';

                    return (
                      <div
                        key={row.wallet + idx}
                        className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                          mine
                            ? 'border-cyan-400/60 bg-cyan-950/30 shadow-cyan-400/20 shadow-lg'
                            : 'border-slate-600/30 bg-slate-800/30 hover:bg-slate-700/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 text-center font-mono font-bold ${rankColor}`}>
                            {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : `#${idx + 1}`}
                          </span>
                          <span className="font-mono text-slate-200">
                            {short(row.wallet)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono">
                          <span className="text-emerald-300">
                            RZN: <span className="font-bold text-emerald-200">{row.rzn}</span>
                          </span>
                          {typeof row.scans === 'number' && (
                            <span className="text-cyan-300">S:{row.scans}</span>
                          )}
                          {typeof row.stabilizes === 'number' && (
                            <span className="text-orange-300">St:{row.stabilizes}</span>
                          )}
                          {typeof row.crafts === 'number' && (
                            <span className="text-purple-300">C:{row.crafts}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Result Modal */}
        {stabRes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-4 w-4 rounded-full bg-emerald-400 "></div>
                <h3 className="text-xl font-mono font-bold text-cyan-100 tracking-wider">
                  STABILIZATION COMPLETE
                </h3>
              </div>

              <div className="mb-6 rounded-lg border border-emerald-700/30 bg-emerald-950/30 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-emerald-300 font-mono text-sm">RZN REWARD</span>
                </div>
                <div className="text-3xl font-bold text-emerald-100 font-mono">+{stabRes.rzn}</div>
              </div>

              <div className="mb-6">
                <div className="font-mono font-semibold text-cyan-200 mb-3">MATERIAL REWARDS</div>
                {stabRes.items.length === 0 ? (
                  <div className="text-sm text-slate-200 font-mono bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                    // NO MATERIALS OBTAINED
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stabRes.items.map((it, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border border-slate-600/30 bg-slate-800/50 px-3 py-2"
                      >
                        <span className="font-mono text-slate-200">{it.key}</span>
                        <span className="rounded bg-cyan-900/50 px-2 py-1 text-xs font-mono text-cyan-100 border border-cyan-700/30">
                          ×{it.qty}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setStabRes(null)}
                  className="rounded-lg border border-slate-500/50 bg-slate-800 px-4 py-2 font-mono text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  CLOSE
                </button>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="relative overflow-hidden rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 font-mono text-white hover:from-cyan-500 hover:to-blue-500"
                  href={`https://twitter.com/intent/tweet?text=I%20stabilized%20an%20anomaly%20and%20earned%20${stabRes.rzn}%20RZN%20in%20Retrievium%20Pre-Season!%20%23Retrievium%20%23GameFi`}
                >
                        <span className="relative z-10">SHARE RESULTS</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Success Modal */}
        {purchaseResult !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-4 w-4 rounded-full bg-emerald-400 "></div>
                <h3 className="text-xl font-mono font-bold text-cyan-100 tracking-wider">
                  PURCHASE SUCCESSFUL
                </h3>
              </div>

              <div className="mb-6 rounded-lg border border-emerald-700/30 bg-emerald-950/30 p-4">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <div className="font-mono font-semibold text-emerald-200 mb-2">
                    WHITELIST SECURED!
                  </div>
                  <div className="text-sm text-emerald-300 font-mono">{purchaseResult.message}</div>
                </div>
              </div>

              <div className="mb-6 rounded-lg border border-slate-700/30 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-mono text-sm">Remaining RZN Balance:</span>
                  <span className="text-emerald-200 font-mono font-bold">
                    {purchaseResult.newBalance.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPurchaseResult(null)}
                  className="rounded-lg border border-slate-500/50 bg-slate-800 px-4 py-2 font-mono text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  CLOSE
                </button>
                <a
                  target="_blank"
                  rel="noreferrer"
                  className="relative overflow-hidden rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 font-mono text-white hover:from-cyan-500 hover:to-blue-500"
                  href={`https://twitter.com/intent/tweet?text=I%20just%20secured%20my%20whitelist%20spot%20for%20Retrievium%20using%20RZN%20earned%20in%20the%20Neural%20Laboratory!%20%23Retrievium%20%23GameFi`}
                >
                        <span className="relative z-10">SHARE ACHIEVEMENT</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}