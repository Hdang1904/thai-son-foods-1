import { Pool } from 'pg';

async function check() {
  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'Tsf@123',
    database: 'WebTSF',
  });

  const res = await pool.query("SELECT * FROM store_inventory WHERE product_id = 'prod-sb-01';");
  console.log('prod-sb-01 in store_inventory:', res.rows);

  const prodRes = await pool.query("SELECT id, slug, sku, name FROM products WHERE id = 'prod-sb-01' OR slug LIKE '%sua-bap%';");
  console.log('sua bap in products table:', prodRes.rows);

  await pool.end();
}

check().catch(console.error);
