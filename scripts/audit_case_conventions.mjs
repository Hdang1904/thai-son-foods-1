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
console.log(`Scanning ${files.length} files in src/...`);

const findings = [];

// Patterns where SQL returns snake_case but code might expect camelCase:
// 1. SELECT.*product_id.*FROM (without AS "productId")
// 2. SELECT.*store_code.*FROM (without AS "storeCode")
// 3. SELECT.*order_id.*FROM (without AS "orderId")
// 4. Passing rows from order_items directly into functions expecting camelCase (like expandComboItems, getAvailability, etc.)

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    // Check if expandComboItems or getAvailability is called
    if (/expandComboItems\s*\(\s*([a-zA-Z0-9_.]+)/.test(line)) {
      findings.push({
        type: 'EXPAND_COMBO_CALL',
        file,
        line: lineNum,
        text: line.trim()
      });
    }
    if (/getAvailability\s*\([^,]+,\s*([a-zA-Z0-9_.]+)/.test(line)) {
      findings.push({
        type: 'GET_AVAILABILITY_CALL',
        file,
        line: lineNum,
        text: line.trim()
      });
    }
    // Check queries selecting order_items
    if (/FROM\s+order_items/i.test(line) || (/order_items/i.test(line) && /SELECT/i.test(line))) {
      findings.push({
        type: 'ORDER_ITEMS_QUERY',
        file,
        line: lineNum,
        text: line.trim()
      });
    }
    // Check potential mismatches
    if (/item\.(productId|product_id)/.test(line)) {
      findings.push({
        type: 'ITEM_PRODUCT_ID_ACCESS',
        file,
        line: lineNum,
        text: line.trim()
      });
    }
  });
}

console.log(`Found ${findings.length} points of interest.`);
findings.forEach(f => {
  const rel = path.relative('d:/WebTSF/thai-son-foods', f.file).replace(/\\/g, '/');
  console.log(`[${f.type}] ${rel}:${f.line} -> ${f.text}`);
});
