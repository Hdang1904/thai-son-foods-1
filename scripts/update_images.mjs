import { Pool } from 'pg';

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: 'Tsf@123',
  database: 'WebTSF',
});

async function update() {
  await pool.query(
    'UPDATE products SET thumbnail = $1 WHERE slug = $2',
    ['/images/products/sua-bap-nep.jpg', 'sua-bap-nep-thai-son']
  );
  await pool.query(
    'UPDATE products SET thumbnail = $1 WHERE slug = $2',
    ['/images/products/mu-trom.jpg', 'nha-dam-mu-trom-thai-son']
  );
  const res = await pool.query(
    'SELECT name, thumbnail FROM products WHERE slug IN ($1, $2)',
    ['sua-bap-nep-thai-son', 'nha-dam-mu-trom-thai-son']
  );
  console.log('Updated in WebTSF:');
  console.table(res.rows);
  await pool.end();
}

update().catch(console.error);
