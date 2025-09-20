import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { requireWallet, todayYMD_UTC8, assertSameOrigin } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

export const runtime = 'nodejs';

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

export async function GET() {
  try {
    const wallet = await requireWallet();
    const ymd = todayYMD_UTC8();

    // Get today's progress
    const { data: progress } = await supabase
      .from('progress')
      .select('scans_done, stabilize_count, crafts_done')
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .maybeSingle();

    // Get today's season stats for crafting count
    const { data: seasonStats } = await supabase
      .from('season_stats')
      .select('crafts')
      .eq('wallet', wallet)
      .maybeSingle();

    // Get claimed missions for today
    const { data: claimedMissions } = await supabase
      .from('daily_missions')
      .select('mission_id')
      .eq('wallet', wallet)
      .eq('ymd', ymd);

    const claimedSet = new Set(claimedMissions?.map(m => m.mission_id) || []);

    const missions: Mission[] = [
      {
        id: 'daily_scan',
        title: 'Neural Scanner',
        description: 'Complete 3 neural scans',
        progress: progress?.scans_done ?? 0,
        target: 3,
        reward: { rzn: 25, items: [{ item: 'shard_common', qty: 2 }] },
        completed: (progress?.scans_done ?? 0) >= 3,
        claimed: claimedSet.has('daily_scan'),
      },
      {
        id: 'daily_stabilize',
        title: 'Anomaly Hunter',
        description: 'Stabilize 2 anomalies',
        progress: progress?.stabilize_count ?? 0,
        target: 2,
        reward: { rzn: 40, items: [{ item: 'shard_uncommon', qty: 1 }] },
        completed: (progress?.stabilize_count ?? 0) >= 2,
        claimed: claimedSet.has('daily_stabilize'),
      },
      {
        id: 'daily_craft',
        title: 'Neural Engineer',
        description: 'Craft any item',
        progress: progress?.crafts_done ?? 0,
        target: 1,
        reward: { rzn: 30, items: [{ item: 'shard_rare', qty: 1 }] },
        completed: (progress?.crafts_done ?? 0) >= 1,
        claimed: claimedSet.has('daily_craft'),
      },
    ];

    return NextResponse.json({ missions });
  } catch (e) {
    reportError(e, { route: 'missions_get' });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  assertSameOrigin(req);
  try {
    const wallet = await requireWallet();
    const { missionId } = await req.json();
    const ymd = todayYMD_UTC8();

    // Validate mission ID
    const validMissions = ['daily_scan', 'daily_stabilize', 'daily_craft'];
    if (!validMissions.includes(missionId)) {
      return NextResponse.json({ error: 'invalid_mission' }, { status: 400 });
    }

    // Check if already claimed
    const { data: existing } = await supabase
      .from('daily_missions')
      .select('*')
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .eq('mission_id', missionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'already_claimed' }, { status: 400 });
    }

    // Get current progress to validate completion
    const { data: progress } = await supabase
      .from('progress')
      .select('scans_done, stabilize_count, crafts_done')
      .eq('wallet', wallet)
      .eq('ymd', ymd)
      .maybeSingle();

    const { data: seasonStats } = await supabase
      .from('season_stats')
      .select('crafts, rzn')
      .eq('wallet', wallet)
      .maybeSingle();

    // Check if mission is completed
    let completed = false;
    let reward = { rzn: 0, items: [] as { item: string; qty: number }[] };

    switch (missionId) {
      case 'daily_scan':
        completed = (progress?.scans_done ?? 0) >= 3;
        reward = { rzn: 25, items: [{ item: 'shard_common', qty: 2 }] };
        break;
      case 'daily_stabilize':
        completed = (progress?.stabilize_count ?? 0) >= 2;
        reward = { rzn: 40, items: [{ item: 'shard_uncommon', qty: 1 }] };
        break;
      case 'daily_craft':
        completed = (progress?.crafts_done ?? 0) >= 1;
        reward = { rzn: 30, items: [{ item: 'shard_rare', qty: 1 }] };
        break;
    }

    if (!completed) {
      return NextResponse.json({ error: 'mission_not_completed' }, { status: 400 });
    }

    const updates: Promise<void>[] = [];

    // Record the claim
    updates.push(
      (async () => {
        const { error } = await supabase
          .from('daily_missions')
          .insert({
            wallet,
            ymd,
            mission_id: missionId,
            claimed_at: new Date().toISOString(),
          });
        if (error) throw new Error(error.message);
      })()
    );

    // Grant RZN to season stats
    if (reward.rzn > 0) {
      updates.push(
        (async () => {
          const newRzn = (seasonStats?.rzn ?? 0) + reward.rzn;
          const { error } = await supabase
            .from('season_stats')
            .upsert(
              { wallet, rzn: newRzn, updated_at: new Date().toISOString() },
              { onConflict: 'wallet' }
            );
          if (error) throw new Error(error.message);
        })()
      );
    }

    // Grant items to inventory
    for (const item of reward.items) {
      updates.push(
        (async () => {
          const { error } = await supabase.rpc('inc_inventory', {
            p_wallet: wallet,
            p_item: item.item,
            p_qty: item.qty,
          });
          if (error) throw new Error(error.message);
        })()
      );
    }

    await Promise.all(updates);

    logMutation('claim_daily_mission', { wallet, mission: missionId, reward });
    return NextResponse.json({ ok: true, reward });
  } catch (e) {
    reportError(e, { route: 'missions_claim' });
    return NextResponse.json({ error: 'claim_failed' }, { status: 500 });
  }
}