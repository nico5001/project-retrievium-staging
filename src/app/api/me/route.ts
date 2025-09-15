export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { ensureProgress, requireWallet, todayYMD_UTC8 } from '@/app/api/_utils';
import { getRznBalance } from '@/app/api/_utils/balance';

export async function GET() {
  try {
    
    const wallet = await requireWallet();

    
    const prog = await ensureProgress(wallet); 
    const ymd = todayYMD_UTC8();

    
    const rzn = await getRznBalance(wallet);

    
    const energy = Math.max(0, Math.min(100, Number(prog?.energy ?? 100)));

    return NextResponse.json({
      wallet,
      rzn,
      ymd,                                   
      energy,                                
      scans_done: Number(prog?.scans_done ?? 0),
      stabilize_count: Number(prog?.stabilize_count ?? 0),
      scan_ready: Boolean(prog?.scan_ready ?? false),
    });
  } catch {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
}
