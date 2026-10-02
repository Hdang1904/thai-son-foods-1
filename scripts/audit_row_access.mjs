import fs from 'fs';
import path from 'path';

function findFiles(dir, exts = ['.ts', '.tsx']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, exts));
    } else if (exts.includes(path.extname(fullPath))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('d:/WebTSF/thai-son-foods/src');
const mismatches = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check if accessing camelCase on something that might be snake_case
    // e.g. .storeCode vs .store_code, .orderId vs .order_id, .productId vs .product_id
    // when reading from query result rows: res.rows[0].storeCode or row.storeCode
    if (/row(s\[\d+\])?\.(storeCode|orderId|productId|createdAt|updatedAt|stockQuantity|totalAmount|paymentMethod|shippingFee|customerName|customerPhone|customerAddress)/.test(line)) {
      mismatches.push({
        type: 'CAMEL_ACCESS_ON_ROW',
        file,
        line: idx + 1,
        text: line.trim()
      });
    }
    // Check if SQL query has snake_case column names without alias when selecting
    if (/SELECT\s+([a-zA-Z0-9_,\s]+)\s+FROM\s+(orders|order_items|stores|store_inventory|products)/i.test(line)) {
      const match = line.match(/SELECT\s+([a-zA-Z0-9_,\s]+)\s+FROM\s+([a-zA-Z0-9_]+)/i);
      if (match && !line.includes('AS "') && !line.includes('COUNT(') && !line.includes('SUM(')) {
        // Check if caller accesses camelCase
        mismatches.push({
          type: 'SNAKE_SELECT',
          file,
          line: idx + 1,
          text: line.trim()
        });
      }
    }
  });
}

console.log(`Found ${mismatches.length} potential case mismatches:`);
mismatches.forEach(m => {
  const rel = path.relative('d:/WebTSF/thai-son-foods', m.file).replace(/\\/g, '/');
  console.log(`[${m.type}] ${rel}:${m.line} -> ${m.text}`);
});
