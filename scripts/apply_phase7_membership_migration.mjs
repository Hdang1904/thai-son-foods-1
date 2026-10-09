import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : { connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable' }
);

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- ÁP DỤNG MIGRATION PHASE 7: MEMBERSHIP & SUBSCRIBE & SAVE ---');
    const sqlPath = path.resolve(process.cwd(), 'scripts/migrations/phase7_membership_schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await client.query('BEGIN;');
    await client.query(sqlContent);
    await client.query('COMMIT;');
    console.log('✓ Migration Phase 7 đã được áp dụng thành công vào PostgreSQL!');

    // Kiểm tra lại các bảng
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'membership_tiers',
          'user_memberships',
          'subscriptions',
          'subscription_items',
          'subscription_schedules',
          'loyalty_point_ledger'
        );
    `);
    console.log('Danh sách các bảng thành viên đã tạo:', res.rows.map(r => r.table_name));

    // Kiểm tra dữ liệu khởi tạo
    const tiers = await client.query('SELECT code, name, price, discount_rate FROM membership_tiers ORDER BY price ASC;');
    console.log('Các gói thành viên đã khởi tạo:', tiers.rows);
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Lỗi khi áp dụng migration Phase 7:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
