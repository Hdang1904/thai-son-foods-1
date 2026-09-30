import pg from 'pg';
import { expandComboItems, resolveProductCanonical } from '../src/lib/inventory.ts';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF?sslmode=disable'
});

async function main() {
  const client = await pool.connect();
  const ord = await client.query('SELECT * FROM orders WHERE order_code = $1', ['TSF-976704']);
  const items = await client.query('SELECT id, name, price, quantity, product_id, combo_snapshot FROM order_items WHERE order_id = $1', [ord.rows[0].id]);
  
  console.log('--- Testing expandComboItems ---');
  const normalizedItems = items.rows.map(it => ({
    productId: it.product_id,
    name: it.name,
    quantity: it.quantity,
    price: it.price
  }));

  for (const it of normalizedItems) {
    const res = await resolveProductCanonical(it.productId, it.name, client);
    console.log(`resolveProductCanonical for [${it.productId}]:`, res);
  }

  const { expandedBottles, comboSnapshots } = await expandComboItems(normalizedItems, client);
  console.log('Expanded Bottles:', expandedBottles);

  client.release();
  await pool.end();
}

main().catch(console.error);
