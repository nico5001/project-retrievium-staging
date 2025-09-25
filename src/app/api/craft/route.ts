import { NextResponse } from 'next/server';
import { requireWallet, todayYMD_UTC8 } from '../_utils'; // adjust path if needed
import { supabase } from '@/lib/supabaseAdmin';
import { awardReferralBonus } from '../_utils/referral-bonus';

export const runtime = 'nodejs';

// Discord webhook function for craft announcements
async function sendCraftAnnouncement(wallet: string, recipe: Recipe, qty: number, criticalSuccess: boolean) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  // Get Discord username if linked
  const { data: discordLink } = await supabase
    .from('discord_links')
    .select('discord_username')
    .eq('wallet', wallet)
    .maybeSingle();

  const username = discordLink?.discord_username || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;

  const tierEmojis = {
    'COMMON': '⚪',
    'UNCOMMON': '🟢',
    'RARE': '🔵',
    'EPIC': '🟣'
  };

  const categoryEmojis = {
    'CORE': '💎',
    'AMPLIFIER': '⚡',
    'CATALYST': '🧪',
    'SIGIL': '🔮',
    'LENS': '🔍'
  };

  const embed = {
    title: `${tierEmojis[recipe.tier]} ${recipe.tier} ${recipe.category} CRAFTED!`,
    description: `**${username}** just crafted ${criticalSuccess ? '✨ **CRITICAL SUCCESS!** ✨' : ''}\n\n${categoryEmojis[recipe.category]} **${recipe.grants.item.replace(/_/g, ' ').toUpperCase()}** ${qty > 1 ? `x${qty}` : ''}`,
    color: recipe.tier === 'EPIC' ? 0x9B59B6 : recipe.tier === 'RARE' ? 0x3498DB : 0x2ECC71,
    fields: [
      { name: '💰 RZN Earned', value: recipe.rzn.toLocaleString(), inline: true },
      { name: '⚡ Energy Used', value: recipe.energyCost.toString(), inline: true }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Retrievium Neural Laboratory' }
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed]
    })
  });
}

type Recipe = {
  requires: Record<string, number>;
  grants: { item: string; qty: number };
  bonusOutput?: { item: string; qty: number; chance: number }[];
  rzn: number; // bonus RZN based on rarity
  energyCost: number;
  tier: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC';
  category: 'CORE' | 'AMPLIFIER' | 'CATALYST' | 'SIGIL' | 'LENS';
};

// Enhanced recipes with significant RZN bonuses based on rarity
const RECIPES: Record<string, Recipe> = {
  // CORE EQUIPMENT - Major RZN bonuses (uses shards as primary materials)
  CRAFT_CORE_COMMON: {
    requires: { shard_common: 5, shard_uncommon: 2 },
    grants: { item: 'core_common', qty: 1 },
    bonusOutput: [{ item: 'FLUX_RESIDUE', qty: 1, chance: 0.3 }],
    rzn: 50,
    energyCost: 15,
    tier: 'COMMON',
    category: 'CORE',
  },
  CRAFT_CORE_UNCOMMON: {
    requires: { shard_common: 8, shard_uncommon: 5, shard_rare: 1 },
    grants: { item: 'core_uncommon', qty: 1 },
    bonusOutput: [
      { item: 'QUANTUM_DUST', qty: 1, chance: 0.25 },
      { item: 'FLUX_RESIDUE', qty: 2, chance: 0.4 }
    ],
    rzn: 150,
    energyCost: 25,
    tier: 'UNCOMMON',
    category: 'CORE',
  },
  CRAFT_CORE_RARE: {
    requires: { shard_uncommon: 10, shard_rare: 5, core_uncommon: 1 },
    grants: { item: 'core_rare', qty: 1 },
    bonusOutput: [
      { item: 'TEMPORAL_ESSENCE', qty: 1, chance: 0.2 },
      { item: 'QUANTUM_DUST', qty: 2, chance: 0.3 }
    ],
    rzn: 400,
    energyCost: 40,
    tier: 'RARE',
    category: 'CORE',
  },

  // AMPLIFIERS - Good RZN bonuses (only use shards)
  CRAFT_AMP_SIGIL: {
    requires: { shard_common: 8, shard_uncommon: 4 },
    grants: { item: 'amp_sigil', qty: 1 },
    rzn: 75,
    energyCost: 20,
    tier: 'UNCOMMON',
    category: 'AMPLIFIER',
  },
  CRAFT_AMP_LENS: {
    requires: { shard_uncommon: 6, shard_rare: 3 },
    grants: { item: 'amp_lens', qty: 1 },
    rzn: 100,
    energyCost: 22,
    tier: 'UNCOMMON',
    category: 'AMPLIFIER',
  },

  // CATALYSTS - High RZN for rarity
  CRAFT_CAT_EFFICIENCY: {
    requires: { shard_rare: 10, amp_sigil: 1 },
    grants: { item: 'cat_efficiency', qty: 1 },
    rzn: 300,
    energyCost: 35,
    tier: 'RARE',
    category: 'CATALYST',
  },

  // ENHANCED SIGILS - Moderate RZN bonuses
  CRAFT_SIGIL_RESONANCE: {
    requires: { shard_common: 6, shard_uncommon: 3 },
    grants: { item: 'sigil_resonance', qty: 1 },
    rzn: 80,
    energyCost: 18,
    tier: 'UNCOMMON',
    category: 'SIGIL',
  },
  CRAFT_SIGIL_QUANTUM: {
    requires: { shard_uncommon: 8, shard_rare: 4, sigil_resonance: 1 },
    grants: { item: 'sigil_quantum', qty: 1 },
    rzn: 250,
    energyCost: 30,
    tier: 'RARE',
    category: 'SIGIL',
  },

  // ENHANCED LENSES - Moderate to high RZN bonuses
  CRAFT_LENS_PRISMATIC: {
    requires: { shard_uncommon: 7, shard_rare: 3 },
    grants: { item: 'lens_prismatic', qty: 1 },
    rzn: 120,
    energyCost: 20,
    tier: 'UNCOMMON',
    category: 'LENS',
  },
  CRAFT_LENS_TEMPORAL: {
    requires: { shard_rare: 15, lens_prismatic: 2 },
    grants: { item: 'lens_temporal', qty: 1 },
    rzn: 800,
    energyCost: 50,
    tier: 'EPIC',
    category: 'LENS',
  },

  // Basic starter recipes (use fewer shards)
  CRAFT_BASIC_SIGIL: {
    requires: { shard_common: 3, shard_uncommon: 1 },
    grants: { item: 'basic_sigil', qty: 1 },
    rzn: 35,
    energyCost: 12,
    tier: 'COMMON',
    category: 'SIGIL',
  },
  CRAFT_BASIC_LENS: {
    requires: { shard_common: 4, shard_uncommon: 2 },
    grants: { item: 'basic_lens', qty: 1 },
    rzn: 45,
    energyCost: 15,
    tier: 'COMMON',
    category: 'LENS',
  },
};

export async function POST(req: Request) {
  const wallet = await requireWallet();
  const body = await req.json().catch(() => ({}));
  const key = String(body?.key || '');
  const recipe = RECIPES[key as keyof typeof RECIPES];
  if (!recipe) return NextResponse.json({ error: 'bad-recipe' }, { status: 400 });

  const ymd = todayYMD_UTC8();

  // 1) Check energy requirements
  const { data: progRow, error: progErr } = await supabase
    .from('progress')
    .select('rzn, energy')
    .eq('wallet', wallet)
    .eq('ymd', ymd)
    .maybeSingle();

  if (progErr) return NextResponse.json({ error: progErr.message }, { status: 500 });
  const currRzn = Number(progRow?.rzn ?? 0);
  const currEnergy = Number(progRow?.energy ?? 0);

  // Get equipped core for bonuses
  const { data: equipRow } = await supabase
    .from('equipment')
    .select('core')
    .eq('wallet', wallet)
    .maybeSingle();

  const equippedCore = equipRow?.core || 'none';

  // Calculate energy cost with equipment bonuses
  const coreBonus = getCoreBonus(equippedCore);
  const adjustedEnergyCost = Math.max(1, recipe.energyCost - coreBonus.energyReduction);

  if (currEnergy < adjustedEnergyCost) {
    return NextResponse.json({ error: 'Insufficient energy' }, { status: 400 });
  }

  // 2) Read inventory rows for the required inputs
  const reqKeys = Object.keys(recipe.requires);
  const { data: invRows, error: invErr } = await supabase
    .from('inventory')
    .select('item, qty')
    .eq('wallet', wallet)
    .in('item', reqKeys);

  if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });

  const invMap = new Map<string, number>((invRows || []).map((r: any) => [r.item, r.qty]));
  for (const [it, need] of Object.entries(recipe.requires)) {
    if ((invMap.get(it) ?? 0) < need) {
      return NextResponse.json({ error: 'Missing Materials' }, { status: 400 });
    }
  }

  const { data: statsRow, error: statsErr } = await supabase
    .from('season_stats')
    .select('crafts, rzn')
    .eq('wallet', wallet)
    .maybeSingle();

  if (statsErr) return NextResponse.json({ error: statsErr.message }, { status: 500 });
  const nextCrafts = Number(statsRow?.crafts ?? 0) + 1;

  // Calculate outputs with equipment bonuses
  const baseQty = Math.max(1, Math.floor(recipe.grants.qty * coreBonus.baseYieldMultiplier));
  const criticalSuccess = Math.random() < coreBonus.criticalCraftChance;
  const finalQty = criticalSuccess ? baseQty * 2 : baseQty;

  // Calculate bonus materials
  const bonusItems: { item: string; qty: number }[] = [];
  if (recipe.bonusOutput) {
    for (const bonus of recipe.bonusOutput) {
      const adjustedChance = Math.min(1, bonus.chance * coreBonus.bonusChanceMultiplier);
      if (Math.random() < adjustedChance) {
        bonusItems.push({ item: bonus.item, qty: bonus.qty });
      }
    }
  }

  const updates: Promise<void>[] = [];

  // Deduct inputs using direct inventory updates (like shop does)
  for (const [it, need] of Object.entries(recipe.requires)) {
    updates.push(
      (async () => {
        // Get current quantity first
        const { data: invRow } = await supabase
          .from('inventory')
          .select('qty')
          .eq('wallet', wallet)
          .eq('item', it)
          .single();

        const currentQty = invRow?.qty ?? 0;
        const newQty = currentQty - need;

        const { error } = await supabase
          .from('inventory')
          .update({ qty: newQty })
          .eq('wallet', wallet)
          .eq('item', it);
        if (error) throw new Error(error.message);
      })()
    );
  }

  // Grant primary output
  if (finalQty > 0) { // Only grant if positive quantity
    updates.push(
      (async () => {
        const { error } = await supabase.rpc('inc_inventory', {
          p_wallet: wallet,
          p_item: recipe.grants.item,
          p_qty: Math.abs(finalQty), // Ensure positive for grants
        });
        if (error) throw new Error(error.message);
      })()
    );
  }

  // Grant bonus outputs
  for (const bonus of bonusItems) {
    if (bonus.qty > 0) { // Only grant if positive quantity
      updates.push(
        (async () => {
          const { error } = await supabase.rpc('inc_inventory', {
            p_wallet: wallet,
            p_item: bonus.item,
            p_qty: Math.abs(bonus.qty), // Ensure positive for grants
          });
          if (error) throw new Error(error.message);
        })()
      );
    }
  }

  // Update daily progress: deduct energy and increment daily crafts counter
  updates.push(
    (async () => {
      // Get current daily crafts count
      const { data: currentProgress } = await supabase
        .from('progress')
        .select('crafts_done')
        .eq('wallet', wallet)
        .eq('ymd', ymd)
        .maybeSingle();

      const currentCrafts = Number(currentProgress?.crafts_done ?? 0);

      const { error } = await supabase
        .from('progress')
        .update({
          energy: currEnergy - adjustedEnergyCost,
          crafts_done: currentCrafts + 1, // Increment daily crafts counter
          updated_at: new Date().toISOString()
        })
        .eq('wallet', wallet)
        .eq('ymd', ymd);
      if (error) throw new Error(error.message);
    })()
  );

  // Add RZN to season stats (where the balance is actually read from)
  updates.push(
    (async () => {
      const currentSeasonRzn = Number(statsRow?.rzn ?? 0);
      const { error } = await supabase
        .from('season_stats')
        .upsert(
          {
            wallet,
            rzn: currentSeasonRzn + recipe.rzn,
            crafts: nextCrafts,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'wallet' }
        );
      if (error) throw new Error(error.message);
    })()
  );

  // Increment crafts (season total)
  updates.push(
    (async () => {
      const { error } = await supabase
        .from('season_stats')
        .upsert({ wallet, crafts: nextCrafts, updated_at: new Date().toISOString() }, { onConflict: 'wallet' });
      if (error) throw new Error(error.message);
    })()
  );

  try {
    await Promise.all(updates);

    // Send Discord webhook for epic/rare crafts
    if ((recipe.tier === 'EPIC' || recipe.tier === 'RARE') && process.env.DISCORD_WEBHOOK_URL) {
      try {
        await sendCraftAnnouncement(wallet, recipe, finalQty, criticalSuccess);
      } catch (webhookError) {
        console.error('Webhook failed but craft succeeded:', webhookError);
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'craft-failed' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    rzn: recipe.rzn,
    output: { item: recipe.grants.item, qty: finalQty },
    bonusItems,
    criticalSuccess,
    energyUsed: adjustedEnergyCost
  });
}

// Helper function for core bonuses
function getCoreBonus(core: string) {
  const bonuses = {
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

  return bonuses[core as keyof typeof bonuses] || bonuses.none;
}
