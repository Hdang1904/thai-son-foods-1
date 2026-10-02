import 'dotenv/config';
import { pool } from '../src/lib/db.js';

async function runAudit() {
  console.log('Connecting to DB...');
  const client = await pool.connect();
  try {
    // a) stock_quantity < 0 hoặc stock_quantity < reserved
    console.log('--- Checking item a ---');
    const resA = await client.query(`
      SELECT store_code, product_id, stock_quantity, reserved, safety_stock, updated_at
      FROM store_inventory
      WHERE stock_quantity < 0 OR stock_quantity < reserved;
    `);

    // b) So reserved với SUM(quantity) của stock_reservations status='active'
    console.log('--- Checking item b ---');
    const resB = await client.query(`
      WITH active_res AS (
        SELECT store_code, product_id, SUM(quantity)::int AS total_active_res
        FROM stock_reservations
        WHERE status = 'active'
        GROUP BY store_code, product_id
      )
      SELECT 
        si.store_code, 
        si.product_id, 
        si.stock_quantity,
        si.reserved AS inventory_reserved, 
        COALESCE(ar.total_active_res, 0) AS active_reservations,
        (si.reserved - COALESCE(ar.total_active_res, 0)) AS diff
      FROM store_inventory si
      LEFT JOIN active_res ar 
        ON si.store_code = ar.store_code AND si.product_id = ar.product_id
      WHERE si.reserved != COALESCE(ar.total_active_res, 0)
      ORDER BY ABS(si.reserved - COALESCE(ar.total_active_res, 0)) DESC;
    `);

    // c) So stock_quantity hiện tại với chuỗi inventory_logs
    console.log('--- Checking item c ---');
    const resC = await client.query(`
      WITH latest_logs AS (
        SELECT DISTINCT ON (store_code, product_id)
          store_code,
          product_id,
          new_stock,
          created_at
        FROM inventory_logs
        ORDER BY store_code, product_id, created_at DESC
      ),
      log_deltas AS (
        SELECT 
          store_code, 
          product_id, 
          SUM(new_stock - old_stock)::int AS total_delta,
          COUNT(*)::int AS log_count
        FROM inventory_logs
        GROUP BY store_code, product_id
      )
      SELECT 
        si.store_code,
        si.product_id,
        si.stock_quantity AS current_stock,
        ll.new_stock AS latest_log_new_stock,
        (si.stock_quantity - ll.new_stock) AS diff_vs_latest_log,
        COALESCE(ld.total_delta, 0) AS total_logged_delta,
        COALESCE(ld.log_count, 0) AS log_count
      FROM store_inventory si
      LEFT JOIN latest_logs ll 
        ON si.store_code = ll.store_code AND si.product_id = ll.product_id
      LEFT JOIN log_deltas ld 
        ON si.store_code = ld.store_code AND si.product_id = ld.product_id
      WHERE ll.new_stock IS NOT NULL AND si.stock_quantity != ll.new_stock
      ORDER BY si.store_code, si.product_id;
    `);

    const resC_noLogs = await client.query(`
      SELECT COUNT(*)::int AS count_no_logs
      FROM store_inventory si
      LEFT JOIN (SELECT DISTINCT store_code, product_id FROM inventory_logs) il
        ON si.store_code = il.store_code AND si.product_id = il.product_id
      WHERE il.product_id IS NULL;
    `);

    // h) Đơn COMPLETED có inventory_deducted = false
    console.log('--- Checking item h ---');
    const resH = await client.query(`
      SELECT 
        id, 
        code, 
        store_code, 
        customer_name, 
        customer_phone, 
        total_amount, 
        status, 
        inventory_deducted, 
        created_at
      FROM orders
      WHERE status = 'COMPLETED' AND (inventory_deducted = false OR inventory_deducted IS NULL)
      ORDER BY created_at ASC;
    `);

    console.log(JSON.stringify({
      itemA_count: resA.rows.length,
      itemA_rows: resA.rows,
      itemB_mismatches: resB.rows,
      itemC_mismatches: resC.rows,
      itemC_noLogsCount: resC_noLogs.rows[0]?.count_no_logs,
      itemH_count: resH.rows.length,
      itemH_orders: resH.rows
    }, null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

runAudit().catch(console.error);
