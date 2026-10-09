import { NextResponse } from 'next/server';
import { getMembershipTiers } from '@/lib/membership/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const tiers = await getMembershipTiers();
    return NextResponse.json({
      success: true,
      data: tiers,
    });
  } catch (error: any) {
    console.error('Error in GET /api/membership/tiers:', error);
    return NextResponse.json({ success: false, error: 'Lỗi tải danh mục gói hội viên.' }, { status: 500 });
  }
}
