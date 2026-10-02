import pg from 'pg';
import fs from 'fs';

const pool = new pg.Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@127.0.0.1:5432/WebTSF_staging?sslmode=disable'
});

async function main() {
  const c = await pool.connect();
  const dbRes = await c.query('SELECT id, product_id, name, quantity, unit, volume, price FROM product_variants ORDER BY product_id, id;');
  
  console.log('=== DANH SÁCH BIẾN THỂ TRONG DB (43 bản ghi) ===');
  console.log(`Tổng số: ${dbRes.rows.length}`);
  
  // Group by product_id
  const byProd = {};
  for (const r of dbRes.rows) {
    if (!byProd[r.product_id]) byProd[r.product_id] = [];
    byProd[r.product_id].push(r);
  }

  for (const [prodId, list] of Object.entries(byProd)) {
    console.log(`Product: ${prodId} có ${list.length} variants:`);
    list.forEach(v => console.log(`   - id: ${v.id}, name: "${v.name}", qty: ${v.quantity}, unit: ${v.unit}, volume: ${v.volume}`));
  }

  // Parse src/data/products.ts manually or view
  const content = fs.readFileSync('src/data/products.ts', 'utf8');
  // Match products and their variants
  console.log('\n=== DANH SÁCH SẢN PHẨM TRONG src/data/products.ts ===');
  const prodMatches = content.matchAll(/id:\s*['"]([^'"]+)['"],[\s\S]*?name:\s*['"]([^'"]+)['"],[\s\S]*?variants:\s*\[([\s\S]*?)\]/g);
  let codeCount = 0;
  for (const m of prodMatches) {
    const pId = m[1];
    const pName = m[2];
    const varBlock = m[3];
    const vMatches = [...varBlock.matchAll(/id:\s*['"]([^'"]+)['"],\s*name:\s*(?:['"]([^'"]+)['"]|`([^`]+)`),\s*quantity:\s*(\d+),\s*price:\s*(\d+),\s*unit:\s*['"]([^'"]+)['"],\s*volume:\s*['"]([^'"]+)['"]/g)];
    console.log(`Product: ${pId} (${pName.slice(0, 30)}...) có ${vMatches.length} variants:`);
    vMatches.forEach(v => {
      codeCount++;
      const vName = v[2] || v[3];
      console.log(`   * id: ${v[1]}, name: "${vName.slice(0, 30)}", qty: ${v[4]}, unit: ${v[6]}, volume: ${v[7]}`);
    });
  }
  console.log(`\nTổng số variants trong products.ts: ${codeCount}`);

  c.release();
  await pool.end();
}

main().catch(console.error);
