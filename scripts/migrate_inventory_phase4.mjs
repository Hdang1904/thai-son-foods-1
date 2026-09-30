import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '..', '.env') });

const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF?sslmode=disable',
});

async function migratePhase4() {
  const client = await pool.connect();
  try {
    console.log('🚀 Bắt đầu chạy Migration Giai đoạn 4: Bảng lịch sử thay đổi tồn kho (inventory_logs)...\n');
    await client.query('BEGIN;');

    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_logs (
        id VARCHAR(100) PRIMARY KEY,
        store_code VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        old_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        old_reserved INTEGER NOT NULL DEFAULT 0,
        new_reserved INTEGER NOT NULL DEFAULT 0,
        change_type VARCHAR(50) NOT NULL,
        order_id VARCHAR(50),
        actor VARCHAR(100) NOT NULL,
        note TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_inv_logs_store ON inventory_logs(store_code);
      CREATE INDEX IF NOT EXISTS idx_inv_logs_product ON inventory_logs(product_id);
      CREATE INDEX IF NOT EXISTS idx_inv_logs_created_at ON inventory_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_inv_logs_order ON inventory_logs(order_id);
    `);

    await client.query('COMMIT;');
    console.log('✅ Tạo bảng inventory_logs và các index thành công!');
  } catch (error) {
    await client.query('ROLLBACK;');
    console.error('❌ Lỗi migration Phase 4:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migratePhase4();
