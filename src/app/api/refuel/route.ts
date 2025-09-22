import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet, ensureProgress, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

// Export the calculation function for use in other parts of the app
export { calculateRefuelCost };

const BASE_COST_RZN = 5;
const COST_INCREMENT = 5;
const MAX_COST_RZN = 25;
const GAIN_ENERGY = 10;

// Calculate escalating refuel cost based on daily usage
function calculateRefuelCost(dailyRefuelCount: number): number {
  const cost = BASE_COST_RZN + (dailyRefuelCount * COST_INCREMENT);
  return Math.min(cost, MAX_COST_RZN);
}

// Helper function for ordinal numbers (1st, 2nd, 3rd, etc.)
function getDaySuffix(num: number): string {
  if (num >= 11 && num <= 13) return 'th';
  switch (num % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const ymd = todayYMD_UTC8();
    const prog = await ensureProgress(wallet);

    // Get current daily refuel count
    const dailyRefuelCount = prog.refuels ?? 0;
    const costRzn = calculateRefuelCost(dailyRefuelCount);

    const { data: ss, error: sErr } = await supabase
      .from('season_stats')
      .select('rzn')
      .eq('wallet', wallet)
      .maybeSingle();
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

    const bal = Number(ss?.rzn ?? 0);
    if (bal < costRzn) {
      return NextResponse.json({
        error: 'no-rzn',
        required: costRzn,
        current: bal,
        message: `Insufficient RZN. Need ${costRzn} RZN (${dailyRefuelCount + 1}${getDaySuffix(dailyRefuelCount + 1)} refuel today costs ${costRzn} RZN)`
      }, { status: 400 });
    }

    const res = await Promise.all([
      supabase.from('season_stats').update({ rzn: bal - costRzn, updated_at: new Date().toISOString() }).eq('wallet', wallet),
      supabase
        .from('progress')
        .update({
          energy: (prog.energy ?? 0) + GAIN_ENERGY,
          refuels: dailyRefuelCount + 1,
          updated_at: new Date().toISOString()
        } as any)
        .eq('wallet', wallet)
        .eq('ymd', ymd),
    ]);
    for (const r of res as any[]) if (r.error) return NextResponse.json({ error: r.error.message }, { status: 500 });

    const newEnergy = (prog.energy ?? 0) + GAIN_ENERGY;
    const newRzn = bal - costRzn;
    const nextRefuelCost = calculateRefuelCost(dailyRefuelCount + 1);

    logMutation('refuel', {
      wallet,
      costRzn,
      gainEnergy: GAIN_ENERGY,
      newEnergy,
      newRzn,
      dailyRefuelCount: dailyRefuelCount + 1,
      nextRefuelCost
    });

    return NextResponse.json({
      ok: true,
      rzn: newRzn,
      energy: newEnergy,
      refuelCount: dailyRefuelCount + 1,
      nextRefuelCost,
      costPaid: costRzn
    });
  } catch (e) {
    reportError(e, { route: 'refuel' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

// GET endpoint to check current refuel cost
export async function GET(req: NextRequest) {
  try {
    const wallet = await requireWallet();
    const prog = await ensureProgress(wallet);
    const dailyRefuelCount = prog.refuels ?? 0;
    const currentCost = calculateRefuelCost(dailyRefuelCount);
    const nextCost = calculateRefuelCost(dailyRefuelCount + 1);

    return NextResponse.json({
      currentCost,
      nextCost,
      dailyRefuelCount,
      maxCost: MAX_COST_RZN,
      baseCost: BASE_COST_RZN
    });
  } catch (e) {
    reportError(e, { route: 'refuel_get' });
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
