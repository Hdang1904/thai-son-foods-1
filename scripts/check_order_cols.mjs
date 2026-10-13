import pg from 'pg';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable',
});

async function main() {
  const r = await pool.query(
    "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders';"
  );
  console.log(r.rows.map((row) => `${row.column_name}: ${row.data_type}`).join('\n'));
  await pool.end();
}

main().catch(console.error);
