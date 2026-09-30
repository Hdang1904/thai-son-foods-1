import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:Tsf%40123@localhost:5432/WebTSF',
});

async function main() {
  const newName = 'Trà Sữa nấu từ trà nguyên bản, đậm vị trà béo vị sữa, thức uống tiện lợi dùng ngay, chai 330ml';
  
  // 1. Update in DB
  await pool.query('UPDATE products SET name = $1 WHERE id = $2;', [newName, 'prod-tsg-01']);
  const dbRes = await pool.query('SELECT id, sku, name FROM products WHERE id = $1;', ['prod-tsg-01']);
  console.log('1. DB updated:', dbRes.rows[0]);

  // 2. Update in src/data/products.ts
  const filePath = path.join(process.cwd(), 'src', 'data', 'products.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace name in TSG-01 block
  const oldText = "name: 'Trà Sữa nấu từ trà nguyên bản, đậm vị trà béo vị sữa, thức uống tiện lợi dùng ngay, chai 330ml, đạt chuẩn HACCP.',";
  const replacementText = `name: ${JSON.stringify(newName)},`;

  if (content.includes(oldText)) {
    content = content.replace(oldText, replacementText);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('2. File src/data/products.ts updated successfully!');
  } else {
    console.log('Old text not found directly, checking if already updated...');
    if (content.includes(newName)) {
      console.log('Already contains newName in products.ts');
    }
  }

  await pool.end();
}

main();
