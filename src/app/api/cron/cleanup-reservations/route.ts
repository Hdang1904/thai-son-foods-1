import { NextResponse } from 'next/server';
import { cleanupExpiredReservations } from '@/lib/inventory';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authKey = searchParams.get('key') || request.headers.get('authorization');
    const expectedKey = process.env.CRON_SECRET || 'tsf_cron_secret_default';

    // Bảo vệ endpoint cron nếu môi trường có set CRON_SECRET
    if (process.env.CRON_SECRET && authKey !== expectedKey && authKey !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    const result = await cleanupExpiredReservations();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('[Cron Cleanup] Error releasing expired reservations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const POST = GET;
