import { supabase } from '@/lib/supabaseAdmin';


async function tryScalar(table: string, col: string, wallet: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.from(table).select(col).eq('wallet', wallet).maybeSingle();
    if (error || !data) return null;
    const v = Number((data as any)[col]);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}


async function tryLedgerSum(table: string, deltaCol: string, wallet: string): Promise<number | null> {
  try {
    const { data, error } = await supabase.from(table).select(deltaCol).eq('wallet', wallet);
    if (error || !Array.isArray(data)) return null;
    const total = (data as any[]).reduce((acc, r) => acc + (Number(r?.[deltaCol]) || 0), 0);
    return Number.isFinite(total) ? total : null;
  } catch {
    return null;
  }
}


export async function getRznBalance(wallet: string): Promise<number> {
  
  const fromSeason = await tryScalar('season_stats', 'rzn', wallet);
  if (fromSeason != null) return fromSeason;

  
  const scalarFallbacks: [string, string][] = [
    ['players', 'rzn'],
    ['leaderboard', 'rzn'],
    ['lb', 'rzn'],
    ['rzn_balances', 'balance'],
    ['balances', 'rzn'],
  ];
  for (const [table, col] of scalarFallbacks) {
    const v = await tryScalar(table, col, wallet);
    if (v != null) return v;
  }

  const ledgers: [string, string][] = [
    ['rzn_ledger', 'delta'],
    ['ledger_rzn', 'delta'],
    ['events_rzn', 'delta'],
  ];
  for (const [table, col] of ledgers) {
    const v = await tryLedgerSum(table, col, wallet);
    if (v != null) return v;
  }

  return 0;
}
