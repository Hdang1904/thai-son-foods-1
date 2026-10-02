import fs from 'fs';
import path from 'path';

function findFiles(dir, exts = ['.ts', '.tsx', '.js', '.mjs']) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(fullPath))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

const files = findFiles('d:/WebTSF/thai-son-foods/src');
console.log(`Total files scanned: ${files.length}`);

const findings = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check for queries targeting products table with stock_quantity
    // or p.stock_quantity or products.stock_quantity or SELECT ... stock_quantity ... FROM products
    if (/products/i.test(line) && /stock_quantity/i.test(line)) {
      findings.push({ file, line: idx + 1, text: line.trim() });
    } else if (/(SELECT|UPDATE).*stock_quantity/i.test(line) && /FROM\s+products/i.test(content.slice(Math.max(0, content.indexOf(line) - 500), content.indexOf(line) + 500))) {
      findings.push({ file, line: idx + 1, text: line.trim() });
    } else if (/\.stock_quantity/i.test(line) || /stockQuantity/i.test(line)) {
      // Also check frontend models/API
      findings.push({ file, line: idx + 1, text: line.trim() });
    }
  });
}

console.log(`Found ${findings.length} occurrences related to stock_quantity/stockQuantity:`);
findings.forEach(f => {
  // Normalize file path for display
  const rel = path.relative('d:/WebTSF/thai-son-foods', f.file).replace(/\\/g, '/');
  console.log(`${rel}:${f.line} -> ${f.text}`);
});
