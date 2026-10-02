import pg from 'pg';
import { getAvailability, expandComboItems } from '../src/lib/inventory.ts';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable'
});

async function main() {
  const c = await pool.connect();
  const testItem = [{
    productId: 'prod-sb-01',
    name: 'Sữa Bắp Nếp nguyên chất (10 chai)',
    quantity: 1,
    unit: '10 chai'
  }];

  const exp = await expandComboItems(testItem, c);
  console.log('Expanded:', JSON.stringify(exp, null, 2));

  const avail = await getAvailability('staff_empty_store', testItem, c);
  console.log('Availability on staff_empty_store:', JSON.stringify(avail, null, 2));

  // Check store_inventory for staff_empty_store
  const inv = await c.query("SELECT * FROM store_inventory WHERE store_code = 'staff_empty_store';");
  console.log('Rows in store_inventory for staff_empty_store:', inv.rows.length);
  console.table(inv.rows);

  c.release();
  await pool.end();
}

main().catch(console.error);
