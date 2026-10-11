import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : { connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF?sslmode=disable' }
);

async function run() {
  console.log('--- Đang thực thi Migration Phase 8 V2 (review_rate_limits) ---');
  const sqlPath = path.join(process.cwd(), 'scripts', 'migrations', 'phase8_reviews_v2_schema.sql');
  const ddl = fs.readFileSync(sqlPath, 'utf8');

  // Chạy lần 1
  console.log('Thực thi lần 1...');
  await pool.query(ddl);
  console.log('✓ Lần 1 thành công!');

  // Chạy lần 2 để kiểm tra Idempotency
  console.log('Thực thi lần 2 (Kiểm tra Idempotent)...');
  await pool.query(ddl);
  console.log('✓ Lần 2 thành công! Migration đạt chuẩn idempotent 100%.');

  const check = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_name = 'review_rate_limits';`
  );
  if (check.rows.length > 0) {
    console.log('✓ Bảng review_rate_limits đã sẵn sàng hoạt động.');
  } else {
    throw new Error('Bảng review_rate_limits chưa được tạo!');
  }

  await pool.end();
}

run().catch((err) => {
  console.error('Lỗi thực thi migration:', err);
  process.exit(1);
});
