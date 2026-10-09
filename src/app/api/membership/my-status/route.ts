import { NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import {
  getUserMembership,
  getUserLoyaltySummary,
  getUserSubscriptions,
  getMembershipTierByCode,
} from '@/lib/membership/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem thông tin hội viên.' },
        { status: 401 }
      );
    }

    const membership = await getUserMembership(session.id);
    const loyalty = await getUserLoyaltySummary(session.id);
    const subscriptions = await getUserSubscriptions(session.id);

    const activeSubscriptionsCount = subscriptions.filter(s => s.status === 'ACTIVE').length;

    // Nếu chưa đăng ký gói Prime nào, mặc định là Standard Free
    let tierData = membership?.tier;
    if (!tierData) {
      const freeTier = await getMembershipTierByCode('FREE');
      if (freeTier) tierData = freeTier;
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: session.id,
          fullName: session.fullName,
          phone: session.phone,
          email: session.email,
        },
        membership: membership
          ? {
              status: membership.status,
              startedAt: membership.startedAt,
              expiresAt: membership.expiresAt,
              autoRenew: membership.autoRenew,
              cancelledAt: membership.cancelledAt,
              pausedUntil: membership.pausedUntil,
              tier: membership.tier,
            }
          : {
              status: 'STANDARD_FREE',
              tier: tierData,
            },
        loyalty: {
          balance: loyalty.currentBalance,
          totalEarned: loyalty.totalEarned,
          recentHistory: loyalty.history.slice(0, 5),
        },
        activeSubscriptionsCount,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/membership/my-status:', error);
    return NextResponse.json({ success: false, error: 'Lỗi tải trạng thái hội viên.' }, { status: 500 });
  }
}
