import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseAdmin';
import { todayYMD_UTC8 } from '@/app/api/_utils';
import { logMutation, reportError } from '@/lib/telemetry';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Add basic auth check if needed
    const { adminKey, energyAmount = 100 } = await req.json();

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = todayYMD_UTC8();

    // Update energy for all users who have progress today
    const { data: updatedRows, error: updateError } = await supabase
      .from('progress')
      .update({
        energy: energyAmount, // Set to full amount (or use LEAST(energy + energyAmount, 100) to add)
        updated_at: new Date().toISOString()
      })
      .eq('ymd', today)
      .select('wallet');

    if (updateError) {
      reportError(updateError, { route: 'admin_energy_boost' });
      return NextResponse.json({
        error: 'Failed to update energy',
        details: updateError.message
      }, { status: 500 });
    }

    const affectedUsers = updatedRows?.length || 0;

    logMutation('admin_energy_boost', {
      energyAmount,
      affectedUsers,
      date: today
    });

    return NextResponse.json({
      success: true,
      message: `Added ${energyAmount} energy to ${affectedUsers} users`,
      affectedUsers,
      date: today
    });

  } catch (error) {
    reportError(error, { route: 'admin_energy_boost' });
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}