import crypto from 'node:crypto';
import { pool, query } from '@/lib/db';
import {
  MembershipTier,
  MembershipTierCode,
  UserMembership,
  Subscription,
  SubscriptionItem,
  SubscriptionFrequency,
} from '@/types/membership';
import {
  calculateNextDeliveryDate,
  isSkipAllowed,
  validateDeliveryRadius,
} from '@/lib/membership/service';

/**
 * Data Access Layer (DAL) / Repository cho Phân hệ Hội viên & Subscribe & Save
 * Sử dụng Prepared Statements 100% để phòng chống SQL Injection.
 */

export const DEFAULT_TIERS: MembershipTier[] = [
  {
    id: 'tier_free',
    code: 'FREE',
    name: 'Khách hàng Thân thiết (Miễn phí)',
    price: 0,
    billingCycle: 'none',
    discountRate: 0.0,
    freeShipping: false,
    pointRate: 1.0,
    description: 'Tích điểm 1% cho mọi đơn hàng, đổi quà tri ân hấp dẫn',
    isActive: true,
  },
  {
    id: 'tier_prime_monthly',
    code: 'PRIME_MONTHLY',
    name: 'Thái Sơn Prime (Gói Tháng)',
    price: 49000,
    billingCycle: 'month',
    discountRate: 0.15,
    freeShipping: true,
    pointRate: 2.0,
    description: 'Miễn phí giao hàng toàn bộ đơn định kỳ, giảm 15% trọn đời Subscribe & Save, tích điểm 2%',
    isActive: true,
  },
  {
    id: 'tier_prime_yearly',
    code: 'PRIME_YEARLY',
    name: 'Thái Sơn Prime (Gói Năm Tiết Kiệm Nhất)',
    price: 499000,
    billingCycle: 'year',
    discountRate: 0.15,
    freeShipping: true,
    pointRate: 2.0,
    description: 'Tiết kiệm 15% so với gói tháng, tặng kèm quà sinh nhật đặc biệt hàng năm',
    isActive: true,
  },
];

export async function ensureMembershipSchema(): Promise<void> {
  const ddl = `
    CREATE TABLE IF NOT EXISTS membership_tiers (
      id VARCHAR(64) PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(150) NOT NULL,
      price NUMERIC(12, 2) NOT NULL DEFAULT 0,
      billing_cycle VARCHAR(20) NOT NULL DEFAULT 'month',
      discount_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
      free_shipping BOOLEAN NOT NULL DEFAULT false,
      point_rate NUMERIC(4, 2) NOT NULL DEFAULT 1.00,
      description TEXT,
      benefits JSONB DEFAULT '[]'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      display_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_memberships (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      tier_id VARCHAR(64) NOT NULL REFERENCES membership_tiers(id),
      status VARCHAR(30) NOT NULL DEFAULT 'TRIAL_ACTIVE',
      started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL,
      auto_renew BOOLEAN NOT NULL DEFAULT true,
      cancelled_at TIMESTAMPTZ,
      cancel_reason TEXT,
      paused_until TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id VARCHAR(64) PRIMARY KEY,
      subscription_code VARCHAR(50) UNIQUE,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
      delivery_frequency VARCHAR(20) NOT NULL DEFAULT '1_WEEK',
      preferred_day_of_week INT NOT NULL DEFAULT 2,
      preferred_time_slot VARCHAR(50) NOT NULL DEFAULT '08:00-12:00',
      next_delivery_date DATE NOT NULL,
      last_delivered_date TIMESTAMPTZ,
      cancel_reason TEXT,
      recipient_name VARCHAR(150) NOT NULL,
      recipient_phone VARCHAR(30) NOT NULL,
      shipping_address TEXT NOT NULL,
      province VARCHAR(100),
      district VARCHAR(100),
      ward VARCHAR(100),
      store_code VARCHAR(30),
      payment_method VARCHAR(30) NOT NULL DEFAULT 'vietqr',
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS subscription_code VARCHAR(50);
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS preferred_time_slot VARCHAR(50) DEFAULT '08:00-12:00';
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_delivered_date TIMESTAMPTZ;
    ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

    CREATE TABLE IF NOT EXISTS subscription_items (
      id VARCHAR(64) PRIMARY KEY,
      subscription_id VARCHAR(64) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      product_id VARCHAR(100) NOT NULL,
      variant_id VARCHAR(100),
      name VARCHAR(255) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      price_snapshot NUMERIC(12, 2) NOT NULL,
      discount_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.15,
      final_price NUMERIC(12, 2) NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscription_schedules (
      id VARCHAR(64) PRIMARY KEY,
      subscription_id VARCHAR(64) NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
      scheduled_date DATE NOT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
      order_id VARCHAR(64),
      generated_order_id VARCHAR(64),
      skip_reason TEXT,
      reminder_sent_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    ALTER TABLE subscription_schedules ADD COLUMN IF NOT EXISTS generated_order_id VARCHAR(64);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_sub_schedule_date ON subscription_schedules(subscription_id, scheduled_date);

    CREATE TABLE IF NOT EXISTS loyalty_point_ledger (
      id VARCHAR(64) PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      points_change INT NOT NULL,
      balance_after INT NOT NULL,
      reason VARCHAR(100) NOT NULL,
      reference_type VARCHAR(50),
      reference_id VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    INSERT INTO membership_tiers (id, code, name, price, billing_cycle, discount_rate, free_shipping, point_rate, description, is_active, display_order)
    VALUES 
      ('tier_free', 'FREE', 'Khách hàng Thân thiết (Miễn phí)', 0, 'none', 0.00, false, 1.00, 'Tích điểm 1% cho mọi đơn hàng, đổi quà tri ân hấp dẫn', true, 1),
      ('tier_prime_monthly', 'PRIME_MONTHLY', 'Thái Sơn Prime (Gói Tháng)', 49000, 'month', 0.15, true, 2.00, 'Miễn phí giao hàng toàn bộ đơn định kỳ, giảm 15% trọn đời Subscribe & Save, tích điểm 2%', true, 2),
      ('tier_prime_yearly', 'PRIME_YEARLY', 'Thái Sơn Prime (Gói Năm Tiết Kiệm Nhất)', 499000, 'year', 0.15, true, 2.00, 'Tiết kiệm 15% so với gói tháng, tặng kèm quà sinh nhật đặc biệt hàng năm', true, 3)
    ON CONFLICT (code) DO NOTHING;
  `;
  await query(ddl);
}

// ── 1. HẠNG THÀNH VIÊN (MEMBERSHIP TIERS) ──────────────────────────

export async function getMembershipTiers(): Promise<MembershipTier[]> {
  const sql = `
    SELECT id, code, name, price, billing_cycle AS "billingCycle", 
           discount_rate AS "discountRate", free_shipping AS "freeShipping", 
           point_rate AS "pointRate", description, is_active AS "isActive"
    FROM membership_tiers
    WHERE is_active = true
    ORDER BY price ASC;
  `;
  try {
    const res = await query(sql);
    if (res.rows.length === 0) {
      await ensureMembershipSchema();
      const retryRes = await query(sql);
      return retryRes.rows.length > 0 ? retryRes.rows : DEFAULT_TIERS;
    }
    return res.rows;
  } catch (err: any) {
    console.warn('Membership tiers query notice, running auto-migration:', err?.message);
    try {
      await ensureMembershipSchema();
      const retryRes = await query(sql);
      if (retryRes.rows.length > 0) return retryRes.rows;
    } catch (migErr) {
      console.error('Failed to auto-migrate membership schema:', migErr);
    }
    return DEFAULT_TIERS;
  }
}

export async function getMembershipTierByCode(code: string): Promise<MembershipTier | null> {
  const sql = `
    SELECT id, code, name, price, billing_cycle AS "billingCycle", 
           discount_rate AS "discountRate", free_shipping AS "freeShipping", 
           point_rate AS "pointRate", description, is_active AS "isActive"
    FROM membership_tiers
    WHERE code = $1 AND is_active = true
    LIMIT 1;
  `;
  try {
    const res = await query(sql, [code]);
    if (res.rows[0]) return res.rows[0];
  } catch (err) {
    console.warn('Error querying tier by code:', err);
  }
  return DEFAULT_TIERS.find((t) => t.code === code) || null;
}

// ── 2. HỒ SƠ HỘI VIÊN NGƯỜI DÙNG (USER MEMBERSHIPS) ───────────────

export async function getUserMembership(userId: string): Promise<(UserMembership & { tier: MembershipTier }) | null> {
  const sql = `
    SELECT 
      um.id, um.user_id AS "userId", um.tier_id AS "tierId", um.status, 
      um.started_at AS "startedAt", um.expires_at AS "expiresAt", 
      um.auto_renew AS "autoRenew", um.cancelled_at AS "cancelledAt", 
      um.cancel_reason AS "cancelReason", um.paused_until AS "pausedUntil",
      mt.id AS "t_id", mt.code AS "t_code", mt.name AS "t_name", 
      mt.price AS "t_price", mt.billing_cycle AS "t_billingCycle", 
      mt.discount_rate AS "t_discountRate", mt.free_shipping AS "t_freeShipping", 
      mt.point_rate AS "t_pointRate", mt.description AS "t_description", 
      mt.is_active AS "t_isActive"
    FROM user_memberships um
    JOIN membership_tiers mt ON um.tier_id = mt.id
    WHERE um.user_id = $1
    ORDER BY um.created_at DESC
    LIMIT 1;
  `;
  const res = await query(sql, [userId]);
  if (res.rows.length === 0) return null;

  const row = res.rows[0];
  return {
    id: row.id,
    userId: row.userId,
    tierId: row.tierId,
    status: row.status,
    startedAt: row.startedAt,
    expiresAt: row.expiresAt,
    autoRenew: row.autoRenew,
    cancelledAt: row.cancelledAt,
    cancelReason: row.cancelReason,
    pausedUntil: row.pausedUntil,
    tier: {
      id: row.t_id,
      code: row.t_code,
      name: row.t_name,
      price: row.t_price,
      billingCycle: row.t_billingCycle,
      discountRate: row.t_discountRate,
      freeShipping: row.t_freeShipping,
      pointRate: row.t_pointRate,
      description: row.t_description,
      isActive: row.t_isActive,
    },
  };
}

export async function subscribeUserMembership(
  userId: string,
  tierCode: MembershipTierCode,
  isTrial = false
): Promise<UserMembership> {
  const tier = await getMembershipTierByCode(tierCode);
  if (!tier) throw new Error(`Không tìm thấy gói thành viên: ${tierCode}`);

  const now = new Date();
  const expiresAt = new Date(now);

  if (isTrial) {
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 ngày dùng thử
  } else if (tier.billingCycle === 'year') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else if (tier.billingCycle === 'month') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 10); // Standard Free không hết hạn
  }

  const status = isTrial ? 'TRIAL_ACTIVE' : tierCode === 'FREE' ? 'STANDARD_FREE' : 'PAID_ACTIVE';
  const id = `um_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    // Xóa/hoàn tất các bản ghi cũ
    await client.query('DELETE FROM user_memberships WHERE user_id = $1;', [userId]);

    const sql = `
      INSERT INTO user_memberships (
        id, user_id, tier_id, status, started_at, expires_at, auto_renew
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, user_id AS "userId", tier_id AS "tierId", status, 
                started_at AS "startedAt", expires_at AS "expiresAt", auto_renew AS "autoRenew";
    `;
    const res = await client.query(sql, [id, userId, tier.id, status, now, expiresAt, !isTrial]);
    await client.query('COMMIT;');
    return res.rows[0];
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelUserMembership(userId: string, reason?: string): Promise<boolean> {
  const sql = `
    UPDATE user_memberships
    SET status = 'CANCELLED_GRACE', 
        auto_renew = false, 
        cancelled_at = CURRENT_TIMESTAMP, 
        cancel_reason = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND status IN ('PAID_ACTIVE', 'TRIAL_ACTIVE', 'RENEWAL_DUE');
  `;
  const res = await query(sql, [userId, reason || 'Người dùng hủy qua trang cá nhân']);
  return (res.rowCount ?? 0) > 0;
}

export async function pauseUserMembership(userId: string, months = 1): Promise<boolean> {
  const pauseUntil = new Date();
  pauseUntil.setMonth(pauseUntil.getMonth() + months);

  const sql = `
    UPDATE user_memberships
    SET status = 'PAUSED', 
        paused_until = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND status IN ('PAID_ACTIVE', 'TRIAL_ACTIVE');
  `;
  const res = await query(sql, [userId, pauseUntil]);
  return (res.rowCount ?? 0) > 0;
}

// ── 3. SỔ CÁI ĐIỂM THƯỞNG (LOYALTY POINT LEDGER) ───────────────────

export async function getUserLoyaltySummary(userId: string): Promise<{
  currentBalance: number;
  totalEarned: number;
  history: Array<{ id: string; points: number; balanceAfter: number; sourceType: string; description: string; createdAt: Date }>;
}> {
  const balanceSql = `
    SELECT balance_after 
    FROM loyalty_point_ledger 
    WHERE user_id = $1 
    ORDER BY created_at DESC 
    LIMIT 1;
  `;
  const balanceRes = await query(balanceSql, [userId]);
  const currentBalance = balanceRes.rows[0]?.balance_after || 0;

  const earnedSql = `
    SELECT COALESCE(SUM(points), 0) AS total_earned
    FROM loyalty_point_ledger
    WHERE user_id = $1 AND points > 0;
  `;
  const earnedRes = await query(earnedSql, [userId]);
  const totalEarned = Number(earnedRes.rows[0]?.total_earned || 0);

  const historySql = `
    SELECT id, points, balance_after AS "balanceAfter", source_type AS "sourceType", 
           description, created_at AS "createdAt"
    FROM loyalty_point_ledger
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20;
  `;
  const historyRes = await query(historySql, [userId]);

  return {
    currentBalance,
    totalEarned,
    history: historyRes.rows,
  };
}

export async function addLoyaltyPoints(
  userId: string,
  points: number,
  sourceType: string,
  description: string,
  referenceId?: string
): Promise<number> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    const currentRes = await client.query(
      `SELECT balance_after FROM loyalty_point_ledger WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE;`,
      [userId]
    );
    const prevBalance = currentRes.rows[0]?.balance_after || 0;
    const newBalance = Math.max(0, prevBalance + points);
    const id = `lpt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    await client.query(
      `INSERT INTO loyalty_point_ledger (id, user_id, points, balance_after, source_type, reference_id, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [id, userId, points, newBalance, sourceType, referenceId || null, description]
    );

    await client.query('COMMIT;');
    return newBalance;
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  } finally {
    client.release();
  }
}

// ── 4. HỢP ĐỒNG ĐĂNG KÝ GIAO ĐỊNH KỲ (SUBSCRIBE & SAVE) ─────────────

export interface CreateSubscriptionInput {
  userId: string;
  deliveryFrequency: SubscriptionFrequency;
  preferredDayOfWeek: number;
  preferredTimeSlot?: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  province: string;
  district: string;
  ward: string;
  storeCode?: string | null;
  paymentMethod?: string;
  items: Array<{
    productId: string;
    variantId?: string | null;
    name: string;
    unit: string;
    priceSnapshot: number;
    discountRate: number;
    finalPrice: number;
    quantity: number;
  }>;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    const subId = `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    // Sinh mã hợp đồng định dạng chuẩn #SUB-xxxx (4 chữ số duy nhất)
    let subCode = `SUB-${crypto.randomInt(1000, 9999)}`;
    for (let attempt = 0; attempt < 20; attempt++) {
      const codeCheck = await client.query('SELECT 1 FROM subscriptions WHERE subscription_code = $1 LIMIT 1;', [subCode]);
      if (codeCheck.rows.length === 0) break;
      subCode = `SUB-${crypto.randomInt(1000, 9999)}`;
    }
    const nextDeliveryDate = calculateNextDeliveryDate(
      new Date(),
      input.deliveryFrequency,
      input.preferredDayOfWeek
    );

    const subSql = `
      INSERT INTO subscriptions (
        id, subscription_code, user_id, status, delivery_frequency, 
        preferred_day_of_week, preferred_time_slot, recipient_name, 
        recipient_phone, shipping_address, province, district, ward, 
        store_code, payment_method, next_delivery_date
      ) VALUES ($1, $2, $3, 'ACTIVE', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;

    const subRes = await client.query(subSql, [
      subId,
      subCode,
      input.userId,
      input.deliveryFrequency,
      input.preferredDayOfWeek,
      input.preferredTimeSlot || '08:00-12:00',
      input.recipientName,
      input.recipientPhone,
      input.shippingAddress,
      input.province,
      input.district,
      input.ward,
      input.storeCode || null,
      input.paymentMethod || 'vietqr',
      nextDeliveryDate,
    ]);

    const createdItems: SubscriptionItem[] = [];
    for (const it of input.items) {
      const itemId = `sbi_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const itemSql = `
        INSERT INTO subscription_items (
          id, subscription_id, product_id, variant_id, name, unit, 
          price_snapshot, discount_rate, final_price, quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, subscription_id AS "subscriptionId", product_id AS "productId", 
                  variant_id AS "variantId", name, unit, price_snapshot AS "priceSnapshot", 
                  discount_rate AS "discountRate", final_price AS "finalPrice", quantity;
      `;
      const itemRes = await client.query(itemSql, [
        itemId,
        subId,
        it.productId,
        it.variantId || null,
        it.name,
        it.unit,
        it.priceSnapshot,
        it.discountRate,
        it.finalPrice,
        it.quantity,
      ]);
      createdItems.push(itemRes.rows[0]);
    }

    // Khởi tạo kỳ giao đầu tiên trong bảng schedules
    const scheduleId = `sc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO subscription_schedules (id, subscription_id, scheduled_date, status)
       VALUES ($1, $2, $3, 'SCHEDULED');`,
      [scheduleId, subId, nextDeliveryDate]
    );

    await client.query('COMMIT;');

    const row = subRes.rows[0];
    return {
      id: row.id,
      subscriptionCode: row.subscription_code,
      userId: row.user_id,
      status: row.status,
      deliveryFrequency: row.delivery_frequency,
      preferredDayOfWeek: row.preferred_day_of_week,
      preferredTimeSlot: row.preferred_time_slot,
      recipientName: row.recipient_name,
      recipientPhone: row.recipient_phone,
      shippingAddress: row.shipping_address,
      province: row.province,
      district: row.district,
      ward: row.ward,
      storeCode: row.store_code,
      paymentMethod: row.payment_method,
      nextDeliveryDate: row.next_delivery_date,
      lastDeliveredDate: row.last_delivered_date,
      items: createdItems,
    };
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  const sql = `
    SELECT id, subscription_code AS "subscriptionCode", user_id AS "userId", 
           status, delivery_frequency AS "deliveryFrequency", 
           preferred_day_of_week AS "preferredDayOfWeek", 
           preferred_time_slot AS "preferredTimeSlot", 
           recipient_name AS "recipientName", recipient_phone AS "recipientPhone", 
           shipping_address AS "shippingAddress", province, district, ward, 
           store_code AS "storeCode", payment_method AS "paymentMethod", 
           next_delivery_date AS "nextDeliveryDate", last_delivered_date AS "lastDeliveredDate"
    FROM subscriptions
    WHERE user_id = $1
    ORDER BY created_at DESC;
  `;
  const res = await query(sql, [userId]);
  if (res.rows.length === 0) return [];

  const subscriptions: Subscription[] = res.rows;
  for (const sub of subscriptions) {
    const itemsRes = await query(
      `SELECT id, subscription_id AS "subscriptionId", product_id AS "productId", 
              variant_id AS "variantId", name, unit, price_snapshot AS "priceSnapshot", 
              discount_rate AS "discountRate", final_price AS "finalPrice", quantity
       FROM subscription_items
       WHERE subscription_id = $1;`,
      [sub.id]
    );
    sub.items = itemsRes.rows;
  }

  return subscriptions;
}

export async function getSubscriptionById(id: string, userId?: string): Promise<Subscription | null> {
  const params: any[] = [id];
  let userClause = '';
  if (userId) {
    params.push(userId);
    userClause = ' AND user_id = $2';
  }

  const sql = `
    SELECT id, subscription_code AS "subscriptionCode", user_id AS "userId", 
           status, delivery_frequency AS "deliveryFrequency", 
           preferred_day_of_week AS "preferredDayOfWeek", 
           preferred_time_slot AS "preferredTimeSlot", 
           recipient_name AS "recipientName", recipient_phone AS "recipientPhone", 
           shipping_address AS "shippingAddress", province, district, ward, 
           store_code AS "storeCode", payment_method AS "paymentMethod", 
           next_delivery_date AS "nextDeliveryDate", last_delivered_date AS "lastDeliveredDate"
    FROM subscriptions
    WHERE id = $1 ${userClause}
    LIMIT 1;
  `;
  const res = await query(sql, params);
  if (res.rows.length === 0) return null;

  const sub: Subscription = res.rows[0];
  const itemsRes = await query(
    `SELECT id, subscription_id AS "subscriptionId", product_id AS "productId", 
            variant_id AS "variantId", name, unit, price_snapshot AS "priceSnapshot", 
            discount_rate AS "discountRate", final_price AS "finalPrice", quantity
     FROM subscription_items
     WHERE subscription_id = $1;`,
    [sub.id]
  );
  sub.items = itemsRes.rows;
  return sub;
}

export async function skipSubscriptionNextDelivery(
  subscriptionId: string,
  userId: string,
  reason = 'Khách bấm bỏ qua kỳ này'
): Promise<{ success: boolean; newNextDeliveryDate: Date }> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    const subRes = await client.query(
      `SELECT id, next_delivery_date, delivery_frequency, preferred_day_of_week 
       FROM subscriptions 
       WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE' 
       FOR UPDATE;`,
      [subscriptionId, userId]
    );
    if (subRes.rows.length === 0) {
      throw new Error('Hợp đồng không tồn tại hoặc không ở trạng thái hoạt động.');
    }

    const sub = subRes.rows[0];
    const currentNextDate = new Date(sub.next_delivery_date);

    // Kiểm tra giờ cắt đơn (Cutoff Time: 18:00 ngày T-1)
    const skipCheck = isSkipAllowed(currentNextDate, new Date());
    if (!skipCheck.allowed) {
      throw new Error(skipCheck.reason || 'Đã qua giờ cắt đơn (18:00 hôm trước). Không thể bỏ qua kỳ giao này.');
    }

    // Đánh dấu schedule hiện tại là SKIPPED
    await client.query(
      `UPDATE subscription_schedules 
       SET status = 'SKIPPED', skip_reason = $3, updated_at = CURRENT_TIMESTAMP
       WHERE subscription_id = $1 AND scheduled_date = $2;`,
      [subscriptionId, currentNextDate, reason]
    );

    // Giải phóng giữ chỗ tồn kho (nếu có)
    await client.query(
      `UPDATE stock_reservations
       SET status = 'released', released_at = CURRENT_TIMESTAMP
       WHERE order_id IN (
         SELECT generated_order_id FROM subscription_schedules 
         WHERE subscription_id = $1 AND scheduled_date = $2 AND generated_order_id IS NOT NULL
       ) AND status = 'active';`,
      [subscriptionId, currentNextDate]
    );

    // Tính ngày giao kế tiếp sau kỳ vừa bỏ qua
    const newNextDate = calculateNextDeliveryDate(
      currentNextDate,
      sub.delivery_frequency,
      sub.preferred_day_of_week
    );

    // Cập nhật ngày giao mới vào hợp đồng
    await client.query(
      `UPDATE subscriptions 
       SET next_delivery_date = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [subscriptionId, newNextDate]
    );

    // Tạo bản ghi schedule mới cho ngày mới
    const scheduleId = `sc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO subscription_schedules (id, subscription_id, scheduled_date, status)
       VALUES ($1, $2, $3, 'SCHEDULED')
       ON CONFLICT (subscription_id, scheduled_date) DO NOTHING;`,
      [scheduleId, subscriptionId, newNextDate]
    );

    await client.query('COMMIT;');
    return { success: true, newNextDeliveryDate: newNextDate };
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateSubscriptionFrequency(
  subscriptionId: string,
  userId: string,
  frequency: SubscriptionFrequency,
  preferredDayOfWeek?: number
): Promise<Date> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');

    const subRes = await client.query(
      `SELECT id, preferred_day_of_week FROM subscriptions WHERE id = $1 AND user_id = $2 FOR UPDATE;`,
      [subscriptionId, userId]
    );
    if (subRes.rows.length === 0) throw new Error('Hợp đồng không tồn tại');

    const day = preferredDayOfWeek ?? subRes.rows[0].preferred_day_of_week;
    const newNextDate = calculateNextDeliveryDate(new Date(), frequency, day);

    await client.query(
      `UPDATE subscriptions 
       SET delivery_frequency = $2, preferred_day_of_week = $3, next_delivery_date = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1;`,
      [subscriptionId, frequency, day, newNextDate]
    );

    const scheduleId = `sc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    await client.query(
      `INSERT INTO subscription_schedules (id, subscription_id, scheduled_date, status)
       VALUES ($1, $2, $3, 'SCHEDULED')
       ON CONFLICT (subscription_id, scheduled_date) DO NOTHING;`,
      [scheduleId, subscriptionId, newNextDate]
    );

    await client.query('COMMIT;');
    return newNextDate;
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  } finally {
    client.release();
  }
}

export async function cancelSubscription(
  subscriptionId: string,
  userId: string,
  reason = 'Người dùng hủy hợp đồng'
): Promise<boolean> {
  const sql = `
    UPDATE subscriptions 
    SET status = 'CANCELLED', cancel_reason = $3, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2;
  `;
  const res = await query(sql, [subscriptionId, userId, reason]);
  return (res.rowCount ?? 0) > 0;
}

export async function updateSubscriptionAddress(
  subscriptionId: string,
  userId: string,
  addressData: {
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    province?: string;
    district?: string;
    ward?: string;
    distanceKm?: number;
  }
): Promise<Subscription> {
  const distanceKm = addressData.distanceKm ?? 5.0;
  const radiusCheck = validateDeliveryRadius(distanceKm);
  if (!radiusCheck.isValid) {
    throw new Error(radiusCheck.error || 'Địa chỉ mới vượt quá bán kính phục vụ 25km.');
  }

  const sql = `
    UPDATE subscriptions
    SET recipient_name = $3,
        recipient_phone = $4,
        shipping_address = $5,
        province = COALESCE($6, province),
        district = COALESCE($7, district),
        ward = COALESCE($8, ward),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
    RETURNING id;
  `;
  const res = await query(sql, [
    subscriptionId,
    userId,
    addressData.recipientName.trim(),
    addressData.recipientPhone.trim(),
    addressData.shippingAddress.trim(),
    addressData.province || null,
    addressData.district || null,
    addressData.ward || null,
  ]);

  if ((res.rowCount ?? 0) === 0) {
    throw new Error('Hợp đồng không tồn tại hoặc đã bị hủy.');
  }

  const updatedSub = await getSubscriptionById(subscriptionId, userId);
  return updatedSub!;
}
