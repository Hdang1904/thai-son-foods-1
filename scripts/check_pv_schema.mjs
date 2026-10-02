import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable'
});

async function main() {
  const cols = await pool.query(`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'product_variants' ORDER BY ordinal_position`);
  console.log('Columns:', cols.rows);

  const res = await pool.query('SELECT * FROM product_variants ORDER BY product_id, id');
  console.log(`Total variants in DB: ${res.rows.length}`);
  res.rows.slice(0, 10).forEach(r => console.log(r));
  await pool.end();
}

main().catch(console.error);
