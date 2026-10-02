import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable'
});

async function main() {
  const res = await pool.query('SELECT * FROM stores ORDER BY id');
  console.log(`TOTAL_COUNT: ${res.rows.length}`);
  res.rows.forEach((s, i) => {
    console.log(`[${i + 1}] ID: ${s.id} | CODE: ${s.code} | NAME: ${s.name} | ACTIVE: ${s.is_active} | ADDR: ${s.address} | PHONE: ${s.phone}`);
  });
  await pool.end();
}

main().catch(console.error);
