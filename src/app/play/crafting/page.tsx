'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";

/* ===========================
   Enhanced UI/UX Components
   =========================== */

// Animated Counter Component
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

// Progress Ring Component
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

// Enhanced tier colors with gradients
const TIER_STYLES = {
  COMMON: {
    gradient: 'from-slate-600 to-slate-500',
    border: 'border-slate-500/40',
    text: 'text-slate-200',
    glow: 'shadow-slate-500/20',
    bg: 'bg-slate-900/20'
  },
  UNCOMMON: {
    gradient: 'from-green-600 to-emerald-500',
    border: 'border-green-500/40',
    text: 'text-green-200',
    glow: 'shadow-green-500/20',
    bg: 'bg-green-900/20'
  },
  RARE: {
    gradient: 'from-blue-600 to-cyan-500',
    border: 'border-blue-500/40',
    text: 'text-blue-200',
    glow: 'shadow-blue-500/20',
    bg: 'bg-blue-900/20'
  },
  EPIC: {
    gradient: 'from-purple-600 to-pink-500',
    border: 'border-purple-500/40',
    text: 'text-purple-200',
    glow: 'shadow-purple-500/20',
    bg: 'bg-purple-900/20'
  }
};

// Category Icons with better styling
const CATEGORY_CONFIG = {
  CORE: { icon: '🧠', name: 'Neural Core', description: 'Primary processing unit' },
  AMPLIFIER: { icon: '📡', name: 'Signal Amplifier', description: 'Boost crafting efficiency' },
  CATALYST: { icon: '⚗️', name: 'Process Catalyst', description: 'Reduce energy costs' },
  SIGIL: { icon: '🔮', name: 'Neural Sigil', description: 'Enhance perception' },
  LENS: { icon: '🔍', name: 'Perception Lens', description: 'Expand awareness' }
};

type Me = {
  wallet: string;
  rzn: number;
  energy: number;
};

type InventoryRow = { item: string; qty: number };
type EquipGet = {
  core: 'none' | 'core_common' | 'core_uncommon' | 'core_rare';
  amplifier: 'none' | 'amp_sigil' | 'amp_lens';
  catalyst: 'none' | 'cat_efficiency';
  sigil: 'none' | 'basic_sigil' | 'sigil_resonance' | 'sigil_quantum';
  lens: 'none' | 'basic_lens' | 'lens_prismatic' | 'lens_temporal';
};
type EquipPost = { ok: boolean; equipment: EquipGet };

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
  rzn: number;
};

type CraftingBonus = {
  baseYieldMultiplier: number;
  bonusChanceMultiplier: number;
  energyReduction: number;
  criticalCraftChance: number;
};

const EQUIPMENT_LABELS = {
  core: {
    none: 'None',
    core_common: 'Neural Core (Common)',
    core_uncommon: 'Neural Core (Uncommon)',
    core_rare: 'Neural Core (Rare)',
  },
  amplifier: {
    none: 'None',
    amp_sigil: 'Sigil Amplifier',
    amp_lens: 'Lens Amplifier',
  },
  catalyst: {
    none: 'None',
    cat_efficiency: 'Efficiency Catalyst',
  },
  sigil: {
    none: 'None',
    basic_sigil: 'Basic Neural Sigil',
    sigil_resonance: 'Resonance Sigil',
    sigil_quantum: 'Quantum Sigil',
  },
  lens: {
    none: 'None',
    basic_lens: 'Basic Neural Lens',
    lens_prismatic: 'Prismatic Lens',
    lens_temporal: 'Temporal Lens',
  },
};

const EQUIPMENT_BONUSES = {
  core: {
    none: { yield: 0, description: 'No bonuses' },
    core_common: { yield: 10, description: '+10% yield, 5% crit' },
    core_uncommon: { yield: 25, description: '+25% yield, 10% crit' },
    core_rare: { yield: 50, description: '+50% yield, 20% crit' },
  },
  amplifier: {
    none: { yield: 0, description: 'No bonuses' },
    amp_sigil: { yield: 0, description: 'Enhances sigil crafting' },
    amp_lens: { yield: 0, description: 'Enhances lens crafting' },
  },
  catalyst: {
    none: { yield: 0, description: 'No bonuses' },
    cat_efficiency: { yield: 0, description: 'Reduces energy costs' },
  },
  sigil: {
    none: { yield: 0, description: 'No bonuses' },
    basic_sigil: { yield: 0, description: 'Basic perception enhancement' },
    sigil_resonance: { yield: 0, description: 'Quantum resonance' },
    sigil_quantum: { yield: 0, description: 'Quantum entanglement' },
  },
  lens: {
    none: { yield: 0, description: 'No bonuses' },
    basic_lens: { yield: 0, description: 'Basic vision enhancement' },
    lens_prismatic: { yield: 0, description: 'Multi-spectrum vision' },
    lens_temporal: { yield: 0, description: 'Temporal perception' },
  },
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
    requires: { shard_common: 5, shard_uncommon: 2 },
    baseOutput: { item: 'core_common', qty: 1 },
    bonusOutput: [
      { item: 'FLUX_RESIDUE', qty: 1, chance: 0.3 }
    ],
    desc: 'Forge a basic neural processing core. Provides +10% crafting yield when equipped.',
    energyCost: 15,
    rzn: 50,
  },
  {
    key: 'CRAFT_CORE_UNCOMMON',
    name: 'Enhanced Neural Core',
    category: 'CORE',
    tier: 'UNCOMMON',
    requires: { shard_common: 8, shard_uncommon: 5, shard_rare: 1 },
    baseOutput: { item: 'core_uncommon', qty: 1 },
    bonusOutput: [
      { item: 'QUANTUM_DUST', qty: 1, chance: 0.25 },
      { item: 'FLUX_RESIDUE', qty: 2, chance: 0.4 }
    ],
    desc: 'Advanced neural core with quantum resonance chambers. +25% crafting yield.',
    energyCost: 25,
    rzn: 150,
  },
  {
    key: 'CRAFT_CORE_RARE',
    name: 'Quantum Neural Core',
    category: 'CORE',
    tier: 'RARE',
    requires: { shard_uncommon: 10, shard_rare: 5, core_uncommon: 1 },
    baseOutput: { item: 'core_rare', qty: 1 },
    bonusOutput: [
      { item: 'TEMPORAL_ESSENCE', qty: 1, chance: 0.2 },
      { item: 'QUANTUM_DUST', qty: 2, chance: 0.3 }
    ],
    desc: 'Ultimate neural processing core with temporal stabilizers. +50% yield, 20% crit chance.',
    energyCost: 40,
    rzn: 400,
  },
  // AMPLIFIERS (use only shards)
  {
    key: 'CRAFT_AMP_SIGIL',
    name: 'Sigil Amplifier',
    category: 'AMPLIFIER',
    tier: 'UNCOMMON',
    requires: { shard_common: 8, shard_uncommon: 4 },
    baseOutput: { item: 'amp_sigil', qty: 1 },
    desc: 'Specialized amplifier that enhances sigil crafting output.',
    energyCost: 20,
    rzn: 75,
  },
  {
    key: 'CRAFT_AMP_LENS',
    name: 'Lens Amplifier',
    category: 'AMPLIFIER',
    tier: 'UNCOMMON',
    requires: { shard_uncommon: 6, shard_rare: 3 },
    baseOutput: { item: 'amp_lens', qty: 1 },
    desc: 'Precision amplifier that enhances lens crafting precision and yield.',
    energyCost: 22,
    rzn: 100,
  },
  // CATALYSTS (require amplifiers)
  {
    key: 'CRAFT_CAT_EFFICIENCY',
    name: 'Efficiency Catalyst',
    category: 'CATALYST',
    tier: 'RARE',
    requires: { shard_rare: 10, amp_sigil: 1 },
    baseOutput: { item: 'cat_efficiency', qty: 1 },
    desc: 'Reduces all crafting energy costs when equipped.',
    energyCost: 35,
    rzn: 300,
  },
  // SIGILS (clean progression)
  {
    key: 'CRAFT_BASIC_SIGIL',
    name: 'Basic Neural Sigil',
    category: 'SIGIL',
    tier: 'COMMON',
    requires: { shard_common: 3, shard_uncommon: 1 },
    baseOutput: { item: 'basic_sigil', qty: 1 },
    desc: 'A basic neural sigil for enhancing perception.',
    energyCost: 12,
    rzn: 35,
  },
  {
    key: 'CRAFT_SIGIL_RESONANCE',
    name: 'Resonance Sigil',
    category: 'SIGIL',
    tier: 'UNCOMMON',
    requires: { shard_common: 6, shard_uncommon: 3 },
    baseOutput: { item: 'sigil_resonance', qty: 1 },
    desc: 'An enhanced neural sigil that resonates with quantum frequencies.',
    energyCost: 18,
    rzn: 80,
  },
  {
    key: 'CRAFT_SIGIL_QUANTUM',
    name: 'Quantum Sigil',
    category: 'SIGIL',
    tier: 'RARE',
    requires: { shard_uncommon: 8, shard_rare: 4, sigil_resonance: 1 },
    baseOutput: { item: 'sigil_quantum', qty: 1 },
    desc: 'A sigil infused with quantum entanglement properties.',
    energyCost: 30,
    rzn: 250,
  },
  // LENSES (clean progression)
  {
    key: 'CRAFT_BASIC_LENS',
    name: 'Basic Neural Lens',
    category: 'LENS',
    tier: 'COMMON',
    requires: { shard_common: 4, shard_uncommon: 2 },
    baseOutput: { item: 'basic_lens', qty: 1 },
    desc: 'A basic neural lens for enhanced vision.',
    energyCost: 15,
    rzn: 45,
  },
  {
    key: 'CRAFT_LENS_PRISMATIC',
    name: 'Prismatic Lens',
    category: 'LENS',
    tier: 'UNCOMMON',
    requires: { shard_uncommon: 7, shard_rare: 3 },
    baseOutput: { item: 'lens_prismatic', qty: 1 },
    desc: 'Multi-spectrum optical lens for enhanced perception.',
    energyCost: 20,
    rzn: 120,
  },
  {
    key: 'CRAFT_LENS_TEMPORAL',
    name: 'Temporal Lens',
    category: 'LENS',
    tier: 'EPIC',
    requires: { shard_rare: 15, lens_prismatic: 2 },
    baseOutput: { item: 'lens_temporal', qty: 1 },
    desc: 'Legendary lens capable of perceiving temporal anomalies.',
    energyCost: 50,
    rzn: 800,
  },
];

// Enhanced Panel Components
const Panel = ({ children, className = '', hover = true }: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) => (
  <div className={`rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm shadow-lg ${
    hover ? 'transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:scale-[1.01]' : ''
  } ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ children, icon, description }: {
  children: React.ReactNode;
  icon?: string;
  description?: string;
}) => (
  <div className="mb-4">
    <div className="flex items-center gap-3 mb-2">
      {icon && <span className="text-lg">{icon}</span>}
      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-sm font-semibold tracking-wider text-slate-200 uppercase">{children}</span>
    </div>
    {description && (
      <p className="text-xs text-slate-400 ml-8">{description}</p>
    )}
  </div>
);

// Enhanced Recipe Card Component
function RecipeCard({
  recipe,
  canCraft,
  output,
  adjustedEnergyCost,
  onCraft,
  busy,
  getInventoryQty
}: {
  recipe: Recipe;
  canCraft: boolean;
  output: any;
  adjustedEnergyCost: number;
  onCraft: (key: string) => void;
  busy: boolean;
  getInventoryQty: (item: string) => number;
}) {
  const tierStyle = TIER_STYLES[recipe.tier];
  const categoryConfig = CATEGORY_CONFIG[recipe.category];

  return (
    <div className={`group relative rounded-lg border p-4 transition-all duration-300 transform hover:scale-105 ${
      canCraft
        ? `border-slate-600/30 bg-gradient-to-br from-slate-800/30 to-slate-900/20 hover:border-slate-500/40 hover:${tierStyle.glow} hover:shadow-lg`
        : 'border-slate-700/20 bg-slate-900/20 opacity-60'
    }`}>
      {/* Recipe Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl group-hover:scale-110 transition-transform duration-300">
            {categoryConfig.icon}
          </div>
          <div className="flex-1">
            <div className="font-semibold text-slate-200 mb-1 group-hover:text-white transition-colors">
              {recipe.name}
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs border ${tierStyle.border} ${tierStyle.bg} ${tierStyle.text}`}>
              <span className="w-2 h-2 rounded-full bg-current opacity-60"></span>
              {recipe.tier}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-orange-300 text-sm font-semibold mb-1">
            <span>⚡</span>
            <AnimatedCounter value={adjustedEnergyCost} />
          </div>
          <div className="flex items-center gap-1 text-yellow-300 text-sm font-semibold">
            <span>💎</span>
            <AnimatedCounter value={recipe.rzn} suffix=" RZN" />
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 mb-4 leading-relaxed">{recipe.desc}</p>

      {/* Requirements */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-2">
          <span>📦</span>
          MATERIALS REQUIRED:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(recipe.requires).map(([item, qty]) => {
            const have = getInventoryQty(item);
            const sufficient = have >= qty;
            return (
              <div key={item} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs border transition-all duration-300 ${
                sufficient
                  ? 'border-green-600/30 bg-green-900/20 text-green-200'
                  : 'border-red-600/30 bg-red-900/20 text-red-200'
              }`}>
                <span className="font-medium">{item}</span>
                <span className="font-bold">{have}/{qty}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Output Preview */}
      <div className="mb-4">
        <div className="text-xs text-slate-400 font-semibold mb-3 flex items-center gap-2">
          <span>🎁</span>
          CRAFTING OUTPUT:
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/30">
            <span className="text-slate-200 font-medium">{recipe.baseOutput.item}</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-300">×{output.baseQty}</span>
              {output.criticalChance > 0 && (
                <span className="text-yellow-300 text-xs font-semibold px-2 py-1 rounded bg-yellow-900/30 border border-yellow-700/30">
                  +{Math.round(output.criticalChance * 100)}% double
                </span>
              )}
            </div>
          </div>
          {output.bonusItems.map((bonus: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-blue-900/20 border border-blue-700/30 text-xs">
              <span className="text-blue-200">{bonus.item}</span>
              <span className="text-blue-300 font-semibold">×{bonus.qty} ({Math.round(bonus.chance * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Craft Button */}
      <button
        onClick={() => onCraft(recipe.key)}
        disabled={busy || !canCraft}
        className={`group/btn relative overflow-hidden w-full rounded-lg border px-4 py-3 font-semibold transition-all duration-300 transform hover:scale-105 ${
          canCraft && !busy
            ? `border-purple-500/50 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 hover:shadow-purple-500/25 hover:shadow-lg`
            : 'border-slate-600/30 bg-slate-800/50 text-slate-400 cursor-not-allowed'
        }`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-1000"></div>
        <div className="relative z-10 flex items-center justify-center gap-2">
          <span className="text-lg">🔨</span>
          <div>
            <div className="font-bold">
              {busy ? 'CRAFTING...' : canCraft ? 'CRAFT ITEM' : 'INSUFFICIENT RESOURCES'}
            </div>
            {canCraft && !busy && (
              <div className="text-xs opacity-90">+{recipe.rzn} RZN Reward</div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}

function EnhancedCraftingPanel({
  recipes = ENHANCED_RECIPES,
  inventory = [],
  equippedCore = 'none',
  energy = 0,
  onCraft,
  busy = false,
  selectedCategory,
  setSelectedCategory,
  selectedTier,
  setSelectedTier,
}: {
  recipes?: Recipe[];
  inventory?: { item: string; qty: number }[];
  equippedCore?: string;
  energy?: number;
  onCraft?: (recipeKey: string) => void;
  busy?: boolean;
  selectedCategory: Recipe['category'] | 'ALL';
  setSelectedCategory: (category: Recipe['category'] | 'ALL') => void;
  selectedTier: Recipe['tier'] | 'ALL';
  setSelectedTier: (tier: Recipe['tier'] | 'ALL') => void;
}) {
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
    switch (category) {
      case 'CORE': return '🧠';
      case 'AMPLIFIER': return '📡';
      case 'CATALYST': return '⚗️';
      case 'SIGIL': return '🔮';
      case 'LENS': return '🔍';
      default: return '⚙️';
    }
  };

  return (
    <Panel className="p-4 md:p-6">
      <SectionTitle
        icon="🔬"
        description="Advanced neural crafting protocols with quantum enhancement systems"
      >
        NEURAL CRAFTING LABORATORY
      </SectionTitle>

      {/* Enhanced Equipment Bonuses Display */}
      {equippedCore !== 'none' && (
        <div className="mb-6 rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/30 to-emerald-900/20 p-4 shadow-emerald-500/10 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-emerald-300 text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">⚡</span>
                ACTIVE NEURAL BONUSES
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-600/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-emerald-200 font-semibold">ONLINE</span>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
              <div className="text-emerald-200 font-bold text-lg">+{Math.round((bonuses.baseYieldMultiplier - 1) * 100)}%</div>
              <div className="text-emerald-300/80 text-xs font-medium">Base Yield</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
              <div className="text-emerald-200 font-bold text-lg">+{Math.round((bonuses.bonusChanceMultiplier - 1) * 100)}%</div>
              <div className="text-emerald-300/80 text-xs font-medium">Bonus Chance</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
              <div className="text-emerald-200 font-bold text-lg">-{bonuses.energyReduction}</div>
              <div className="text-emerald-300/80 text-xs font-medium">Energy Cost</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
              <div className="text-emerald-200 font-bold text-lg">{Math.round(bonuses.criticalCraftChance * 100)}%</div>
              <div className="text-emerald-300/80 text-xs font-medium">Critical Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-slate-300 text-sm font-semibold flex items-center gap-2">
            <span>🔍</span>
            FILTER BLUEPRINTS
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full rounded-lg border border-slate-600/30 bg-gradient-to-r from-slate-800/80 to-slate-700/60 px-3 py-2 text-sm text-slate-200 transition-all duration-300 hover:border-slate-500/50 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">🌟 All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tier Filter */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold">RARITY TIER</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as any)}
              className="w-full rounded-lg border border-slate-600/30 bg-gradient-to-r from-slate-800/80 to-slate-700/60 px-3 py-2 text-sm text-slate-200 transition-all duration-300 hover:border-slate-500/50 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <option value="ALL">🌈 All Tiers</option>
              <option value="COMMON">⚪ Common</option>
              <option value="UNCOMMON">🟢 Uncommon</option>
              <option value="RARE">🔵 Rare</option>
              <option value="EPIC">🟣 Epic</option>
            </select>
          </div>

          {/* Quick Filter Buttons */}
          <div className="sm:col-span-2 lg:col-span-3 space-y-2">
            <label className="text-xs text-slate-400 font-semibold">QUICK FILTERS</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setSelectedCategory('CORE'); setSelectedTier('ALL'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900/30 border border-blue-700/30 text-blue-200 hover:bg-blue-800/40 transition-all duration-300"
              >
                🧠 Neural Cores
              </button>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSelectedTier('RARE'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/30 border border-purple-700/30 text-purple-200 hover:bg-purple-800/40 transition-all duration-300"
              >
                💎 Rare Items
              </button>
              <button
                onClick={() => { setSelectedCategory('ALL'); setSelectedTier('ALL'); }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700/50 border border-slate-600/30 text-slate-200 hover:bg-slate-600/50 transition-all duration-300"
              >
                🔄 Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Recipes Grid */}
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredRecipes.map((recipe) => {
          const craftable = canCraft(recipe);
          const output = calculateOutput(recipe);
          const adjustedEnergyCost = Math.max(1, recipe.energyCost - bonuses.energyReduction);

          return (
            <RecipeCard
              key={recipe.key}
              recipe={recipe}
              canCraft={craftable}
              output={output}
              adjustedEnergyCost={adjustedEnergyCost}
              onCraft={onCraft || (() => {})}
              busy={busy}
              getInventoryQty={getInventoryQty}
            />
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-slate-400 text-lg font-semibold mb-2">
            No Blueprints Found
          </div>
          <div className="text-slate-500 text-sm mb-4">
            No crafting blueprints match your current filter criteria
          </div>
          <button
            onClick={() => { setSelectedCategory('ALL'); setSelectedTier('ALL'); }}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all duration-300 transform hover:scale-105"
          >
            🔄 Clear All Filters
          </button>
        </div>
      )}
    </Panel>
  );
}

// Enhanced Equipment Slot Component
function EquipmentSlot({
  slot,
  title,
  icon,
  equipment,
  inventory,
  onEquip,
  busy,
  loading
}: {
  slot: keyof EquipGet;
  title: string;
  icon: string;
  equipment: EquipGet;
  inventory: { item: string; qty: number }[];
  onEquip: (slot: keyof EquipGet, itemId: string) => void;
  busy: boolean;
  loading: boolean;
}) {
  const getItemsForSlot = (slot: keyof EquipGet) => {
    const slotItems: Record<keyof EquipGet, string[]> = {
      core: ['core_common', 'core_uncommon', 'core_rare'],
      amplifier: ['amp_sigil', 'amp_lens'],
      catalyst: ['cat_efficiency'],
      sigil: ['basic_sigil', 'sigil_resonance', 'sigil_quantum'],
      lens: ['basic_lens', 'lens_prismatic', 'lens_temporal'],
    };
    return inventory.filter(item => slotItems[slot].includes(item.item));
  };

  const currentItem = equipment[slot];
  const availableItems = getItemsForSlot(slot);
  const currentLabel = EQUIPMENT_LABELS[slot][currentItem as keyof typeof EQUIPMENT_LABELS[typeof slot]];
  const currentBonus = EQUIPMENT_BONUSES[slot][currentItem as keyof typeof EQUIPMENT_BONUSES[typeof slot]];
  const hasEquipped = currentItem !== 'none';

  return (
    <Panel className={`p-4 transition-all duration-300 ${
      hasEquipped
        ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 to-emerald-900/10'
        : 'border-slate-600/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl group-hover:scale-110 transition-transform duration-300">{icon}</div>
          <div>
            <div className="text-sm font-semibold text-slate-200">{title}</div>
            <div className={`text-xs font-medium ${
              hasEquipped ? 'text-emerald-300' : 'text-slate-400'
            }`}>
              {currentLabel}
            </div>
          </div>
        </div>
        {hasEquipped && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-900/30 border border-emerald-600/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-emerald-200 font-semibold">ACTIVE</span>
          </div>
        )}
      </div>

      <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30">
        <div className="text-xs text-slate-400 font-semibold mb-1">CURRENT EFFECT:</div>
        <div className="text-sm text-slate-300">{currentBonus.description}</div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-slate-400 font-semibold mb-2 block">EQUIP ITEM:</label>
        <select
          className="w-full rounded-lg border border-slate-600/30 bg-gradient-to-r from-slate-800/80 to-slate-700/60 px-3 py-2 text-sm text-slate-200 transition-all duration-300 hover:border-slate-500/50 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          value={currentItem}
          onChange={(e) => onEquip(slot, e.target.value)}
          disabled={busy || loading}
        >
          <option value="none">🚫 None Equipped</option>
          {Object.keys(EQUIPMENT_LABELS[slot]).filter(key => key !== 'none').map(itemKey => {
            const hasItem = availableItems.find(i => i.item === itemKey);
            const label = EQUIPMENT_LABELS[slot][itemKey as keyof typeof EQUIPMENT_LABELS[typeof slot]];
            return (
              <option key={itemKey} value={itemKey} disabled={!hasItem}>
                {hasItem ? '✅' : '❌'} {label} {hasItem ? `(${hasItem.qty})` : '(0)'}
              </option>
            );
          })}
        </select>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-slate-400 font-semibold">AVAILABLE ITEMS:</div>
        {availableItems.length > 0 ? (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableItems.map(item => {
              const isEquipped = currentItem === item.item;
              const itemLabel = EQUIPMENT_LABELS[slot][item.item as keyof typeof EQUIPMENT_LABELS[typeof slot]];

              return (
                <div
                  key={item.item}
                  className={`group flex items-center justify-between rounded-lg border p-3 transition-all duration-300 cursor-pointer hover:scale-105 ${
                    isEquipped
                      ? 'border-emerald-400/50 bg-gradient-to-r from-emerald-950/30 to-emerald-900/20'
                      : 'border-slate-600/30 bg-slate-800/30 hover:border-slate-500/50'
                  }`}
                  onClick={() => !isEquipped && onEquip(slot, item.item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-lg">
                      {isEquipped ? '✅' : '📦'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">{itemLabel}</div>
                      {isEquipped && (
                        <div className="text-xs text-emerald-300 font-semibold">CURRENTLY EQUIPPED</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold">×{item.qty}</span>
                    {!isEquipped && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEquip(slot, item.item);
                        }}
                        className="px-2 py-1 rounded text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all duration-300"
                      >
                        EQUIP
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">📭</div>
            <div className="text-xs text-slate-400 italic">
              No {title.toLowerCase()} items available
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Craft items to unlock equipment slots
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}

function EquipmentManagementPanel({
  equipment,
  inventory,
  onEquip,
  busy = false,
  loading = false,
}: {
  equipment: EquipGet;
  inventory: { item: string; qty: number }[];
  onEquip: (slot: keyof EquipGet, itemId: string) => void;
  busy?: boolean;
  loading?: boolean;
}) {
  const getItemsForSlot = (slot: keyof EquipGet) => {
    const slotItems: Record<keyof EquipGet, string[]> = {
      core: ['core_common', 'core_uncommon', 'core_rare'],
      amplifier: ['amp_sigil', 'amp_lens'],
      catalyst: ['cat_efficiency'],
      sigil: ['basic_sigil', 'sigil_resonance', 'sigil_quantum'],
      lens: ['basic_lens', 'lens_prismatic', 'lens_temporal'],
    };

    return inventory.filter(item => slotItems[slot].includes(item.item));
  };

  const renderEquipmentSlot = (slot: keyof EquipGet, title: string, icon: string) => {
    const currentItem = equipment[slot];
    const availableItems = getItemsForSlot(slot);
    const currentLabel = EQUIPMENT_LABELS[slot][currentItem as keyof typeof EQUIPMENT_LABELS[typeof slot]];
    const currentBonus = EQUIPMENT_BONUSES[slot][currentItem as keyof typeof EQUIPMENT_BONUSES[typeof slot]];

    return (
      <Panel key={slot} className="p-4 border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{icon}</span>
          <div>
            <div className="text-xs tracking-wide text-slate-400">{title}</div>
            <div className="text-sm font-semibold text-slate-100">{currentLabel}</div>
          </div>
        </div>

        <div className="mb-3 text-xs text-slate-400">
          {currentBonus.description}
        </div>

        <div className="mb-4">
          <select
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none ring-0 focus:border-cyan-400/40"
            value={currentItem}
            onChange={(e) => onEquip(slot, e.target.value)}
            disabled={busy || loading}
          >
            <option value="none">None</option>
            {Object.keys(EQUIPMENT_LABELS[slot]).filter(key => key !== 'none').map(itemKey => {
              const hasItem = availableItems.find(i => i.item === itemKey);
              return (
                <option key={itemKey} value={itemKey} disabled={!hasItem}>
                  {EQUIPMENT_LABELS[slot][itemKey as keyof typeof EQUIPMENT_LABELS[typeof slot]]}
                  {hasItem ? ` (${hasItem.qty})` : ' (0)'}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          {availableItems.map(item => {
            const isEquipped = currentItem === item.item;
            const itemLabel = EQUIPMENT_LABELS[slot][item.item as keyof typeof EQUIPMENT_LABELS[typeof slot]];

            return (
              <div
                key={item.item}
                className={`rounded border p-2 text-xs ${
                  isEquipped ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-slate-600/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono">{itemLabel}</span>
                  <span className="text-slate-400">×{item.qty}</span>
                </div>
                {isEquipped && (
                  <div className="mt-1 text-emerald-300">• EQUIPPED</div>
                )}
              </div>
            );
          })}

          {availableItems.length === 0 && (
            <div className="text-xs text-slate-400 italic">
              No {title.toLowerCase()} items crafted yet
            </div>
          )}
        </div>
      </Panel>
    );
  };

  const equippedCount = Object.values(equipment).filter(item => item !== 'none').length;
  const totalSlots = Object.keys(equipment).length;

  return (
    <Panel className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle
          icon="⚙️"
          description="Advanced neural interface equipment management system"
        >
          NEURAL EQUIPMENT SYSTEM
        </SectionTitle>
        <div className="flex items-center gap-3">
          <ProgressRing
            progress={(equippedCount / totalSlots) * 100}
            size={40}
            strokeWidth={3}
          />
          <div className="text-sm">
            <div className="font-semibold text-slate-200">{equippedCount}/{totalSlots}</div>
            <div className="text-xs text-slate-400">Equipped</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <EquipmentSlot
          slot="core"
          title="Neural Core"
          icon="🧠"
          equipment={equipment}
          inventory={inventory}
          onEquip={onEquip}
          busy={busy}
          loading={loading}
        />
        <EquipmentSlot
          slot="amplifier"
          title="Signal Amplifier"
          icon="📡"
          equipment={equipment}
          inventory={inventory}
          onEquip={onEquip}
          busy={busy}
          loading={loading}
        />
        <EquipmentSlot
          slot="catalyst"
          title="Process Catalyst"
          icon="⚗️"
          equipment={equipment}
          inventory={inventory}
          onEquip={onEquip}
          busy={busy}
          loading={loading}
        />
        <EquipmentSlot
          slot="sigil"
          title="Neural Sigil"
          icon="🔮"
          equipment={equipment}
          inventory={inventory}
          onEquip={onEquip}
          busy={busy}
          loading={loading}
        />
        <EquipmentSlot
          slot="lens"
          title="Perception Lens"
          icon="🔍"
          equipment={equipment}
          inventory={inventory}
          onEquip={onEquip}
          busy={busy}
          loading={loading}
        />
      </div>

      <div className="mt-6 p-4 rounded-lg border border-cyan-700/30 bg-gradient-to-r from-cyan-950/20 to-blue-950/20">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-cyan-400">💡</span>
          <span className="text-sm font-semibold text-slate-300">Equipment System Guide</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-start gap-2">
            <span className="text-green-400">✓</span>
            <span>Craft items to unlock equipment slots</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-400">⚡</span>
            <span>Equipment provides crafting bonuses</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400">🔄</span>
            <span>Switch equipment anytime for different effects</span>
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default function CraftingPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [inv, setInv] = useState<InventoryRow[]>([]);
  const [equip, setEquip] = useState<EquipGet>({
    core: 'none',
    amplifier: 'none',
    catalyst: 'none',
    sigil: 'none',
    lens: 'none',
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Recipe['category'] | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<Recipe['tier'] | 'ALL'>('ALL');

  const { toast } = useToast();

  async function fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.json();
  }
  async function postJSON<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) throw new Error(data?.['error'] || `POST ${url} -> ${res.status}`);
    return data as T;
  }

  async function refreshAll() {
    setLoading(true);
    try {
      const [m, e, i] = await Promise.allSettled([
        fetchJSON<Me>('/api/me'),
        fetchJSON<EquipGet>('/api/equip'),
        fetchJSON<{ items: InventoryRow[] }>('/api/inventory'),
      ]);
      if (m.status === 'fulfilled') setMe(m.value);
      if (e.status === 'fulfilled') setEquip(e.value);
      if (i.status === 'fulfilled') setInv(i.value.items);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refreshAll(); }, []);

  const cores = useMemo(
    () => inv.filter(r => ['core_common','core_uncommon','core_rare'].includes(r.item)).sort((a,b) => a.item.localeCompare(b.item)),
    [inv]
  );
  const equippedBonusPct = EQUIPMENT_BONUSES.core[equip.core].yield;

  async function doEquip(slot: keyof EquipGet, itemId: string) {
    setBusy(true);
    const prev = equip;
    try {
      const newEquip = { ...equip, [slot]: itemId };
      setEquip(newEquip);
      const res = await postJSON<EquipPost>('/api/equip', { slot, itemId });
      setEquip(res.equipment);
      toast({
        title: 'Equipment Updated',
        description: `${EQUIPMENT_LABELS[slot][itemId as keyof typeof EQUIPMENT_LABELS[typeof slot]]} equipped successfully.`
      });
    } catch (e: any) {
      setEquip(prev);
      toast({ title: 'Equip Failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  async function doCraft(recipeKey: string) {
    setBusy(true);
    try {
      const res = await postJSON<{
        ok: boolean;
        rzn: number;
        output: { item: string; qty: number };
        bonusItems?: { item: string; qty: number }[];
        criticalSuccess?: boolean;
        energyUsed: number;
      }>('/api/craft', { key: recipeKey });

      await refreshAll();

      let message = `Crafted ${res.output.item} x${res.output.qty} (+${res.rzn} RZN)`;
      if (res.criticalSuccess) message += ' - CRITICAL SUCCESS!';
      if (res.bonusItems?.length) {
        message += ` Bonus: ${res.bonusItems.map(b => `${b.item} x${b.qty}`).join(', ')}`;
      }

      toast({
        title: 'Crafting Successful',
        description: message,
        variant: 'default'
      });
    } catch (e: any) {
      toast({
        title: 'Crafting Failed',
        description: e.message,
        variant: 'destructive'
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Match Play background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950" />
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent animate-pulse" />
      </div>

      <div className="mx-auto max-w-6xl px-4 md:px-6 pt-20 md:pt-28 pb-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link href="/play" className="group inline-flex items-center gap-3 px-4 py-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-blue-950/20 text-slate-300 hover:text-cyan-200 hover:border-cyan-400/50 transition-all duration-300 hover:scale-105">
            <span className="text-lg group-hover:translate-x-[-4px] transition-transform duration-300">←</span>
            <div>
              <div className="text-sm font-semibold">Back to Neural Laboratory</div>
              <div className="text-xs opacity-80">Main interface</div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-emerald-900/20">
              <span className="text-emerald-400 text-lg">💎</span>
              <div>
                <div className="text-xs text-emerald-300 font-semibold">RZN</div>
                <AnimatedCounter value={me?.rzn ?? 0} className="text-sm font-bold text-emerald-100" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 to-cyan-900/20">
              <span className="text-cyan-400 text-lg">⚡</span>
              <div>
                <div className="text-xs text-cyan-300 font-semibold">ENERGY</div>
                <AnimatedCounter value={me?.energy ?? 0} className="text-sm font-bold text-cyan-100" />
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/30 bg-gradient-to-r from-purple-950/30 to-purple-900/20">
              <span className="text-purple-400 text-lg">🚀</span>
              <div>
                <div className="text-xs text-purple-300 font-semibold">BOOST</div>
                <div className="text-sm font-bold text-purple-100">+{equippedBonusPct}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Crafting System */}
        <EnhancedCraftingPanel
          recipes={ENHANCED_RECIPES}
          inventory={inv}
          equippedCore={equip.core}
          energy={me?.energy ?? 0}
          onCraft={doCraft}
          busy={busy}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedTier={selectedTier}
          setSelectedTier={setSelectedTier}
        />

        {/* Equipment Management - All Slots */}
        <EquipmentManagementPanel
          equipment={equip}
          inventory={inv}
          onEquip={doEquip}
          busy={busy}
          loading={loading}
        />

        {loading && (
          <div className="fixed inset-0 pointer-events-none">
            <div className="absolute right-4 bottom-4 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-100 shadow">
              Loading…
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
