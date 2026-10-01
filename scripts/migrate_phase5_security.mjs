import pg from 'pg';

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF?sslmode=disable';
const pool = new pg.Pool({ connectionString: DB_URL });

async function run() {
  console.log('--- KHỞI CHẠY MIGRATION PHASE 5: BẢO MẬT TÀI KHOẢN ---');
  const client = await pool.connect();

  try {
    // 1. Cập nhật must_change_password = true cho tất cả 25 tài khoản cửa hàng STORE_STAFF
    const res = await client.query(`
      UPDATE admin_users
      SET must_change_password = true
      WHERE role = 'STORE_STAFF' AND is_active = true;
    `);
    console.log(`Đã cập nhật must_change_password = true cho ${res.rowCount} tài khoản nhân viên cửa hàng (STORE_STAFF).`);

    // 2. Kiểm tra danh sách tài khoản
    const usersRes = await client.query(`
      SELECT username, role, store_code, must_change_password, is_active
      FROM admin_users
      ORDER BY role, username;
    `);
    console.log('\nDanh sách tài khoản sau cập nhật:');
    console.table(usersRes.rows);

    console.log('--- HOÀN TẤT MIGRATION PHASE 5 THÀNH CÔNG ---');
  } catch (error) {
    console.error('Lỗi khi chạy migration Phase 5:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
