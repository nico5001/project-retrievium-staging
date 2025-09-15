import { hashStringToSeed, mulberry32 } from './rng';

export type Risk = 'SAFE' | 'STANDARD' | 'OVERCLOCK';
export type ItemQty = { key: string; qty: number };

const PATHS = {
  SAFE: {
    rzn_mult: 0.9,
    drops: { ISO_T1: { qty:[1,1], chance:0.65 }, CAT_X:{ qty:[1,1], chance:0.04 }, DATA_FRAGMENT:{ qty:[1,2], chance:0.2 } }
  },
  STANDARD: {
    rzn_mult: 1.0,
    drops: { ISO_T1:{ qty:[1,2], chance:0.75 }, ISO_T2:{ qty:[1,1], chance:0.25 }, CAT_X:{ qty:[1,1], chance:0.07 }, CAT_Y:{ qty:[1,1], chance:0.03 }, DATA_FRAGMENT:{ qty:[1,2], chance:0.3 } }
  },
  OVERCLOCK: {
    rzn_mult: 1.3,
    drops: { ISO_T1:{ qty:[0,3], chance:0.80 }, ISO_T3:{ qty:[1,1], chance:0.10 }, CAT_Y:{ qty:[1,1], chance:0.06 }, CAT_Z:{ qty:[1,1], chance:0.02 }, AUG_RARE_PULL:{ qty:[1,1], chance:0.015 }, DATA_FRAGMENT:{ qty:[2,3], chance:0.45 } }
  }
} as const;

const ALIAS: Record<string,string[]> = {
  ISO_T1: ['RUNE_A','RUNE_B','RUNE_C'],
  ISO_T2: ['RUNE_D'],
  ISO_T3: ['RUNE_E'],
  AUG_RARE_PULL: ['EMB_EAR_SIGIL_R'],
};

export function resolveDrops(risk: Risk, seed: string, baseRZN: number) {
  const rng = mulberry32(hashStringToSeed(seed));
  const path = PATHS[risk];
  const items: ItemQty[] = [];
  for (const [k, v] of Object.entries(path.drops)) {
    const roll = rng();
    if (roll <= (v as any).chance) {
      const [min,max] = (v as any).qty as [number,number];
      const qty = min + Math.floor(rng() * (max - min + 1));
      const real = ALIAS[k] ? ALIAS[k][Math.floor(rng()*ALIAS[k].length)] : k;
      items.push({ key: real, qty });
    }
  }
  const rzn = Math.round(baseRZN * path.rzn_mult);
  return { items, rzn };
}
