import fs from 'fs';
import path from 'path';

const srcDir = 'd:/WebTSF/thai-son-foods/public/images/products';
const bannerDir = 'd:/WebTSF/thai-son-foods/public/images/banners';

if (!fs.existsSync(bannerDir)) {
  fs.mkdirSync(bannerDir, { recursive: true });
}

const fileMap = {
  'chai sua bap sua tem SM.png': 'sua-bap-nep.png',
  'LH.png': 'la-han.png',
  'MD.png': 'mu-trom.png',
  'SS.png': 'sua-hat-sen-lotus.png',
  'chai sua hat sen nho.png': 'sua-hat-sen-mekong.png',
  'Chai SGL  mat logo tem moi.png': 'sua-gao-lut-ohsawa.png',
  'chai sua gao lut nho.png': 'sua-gao-lut-mekong.png',
  'matcha Tra sua ciao v2.png': 'matcha-tra-sua-ciao.png',
  'Tra sua ciao v2.png': 'tra-sua-ciao.png',
  'TSG0.png': 'tra-sua-go.png',
  'TXG0.png': 'tra-xanh-go.png',
  'chon.png': 'tao-do-hat-chia.png',
  'icon.png': 'logo-icon.png',
};

for (const [orig, dest] of Object.entries(fileMap)) {
  const origPath = path.join(srcDir, orig);
  const destPath = path.join(srcDir, dest);
  if (fs.existsSync(origPath)) {
    fs.copyFileSync(origPath, destPath);
    console.log(`Copied ${orig} -> ${dest}`);
  } else {
    console.warn(`Source file not found: ${orig}`);
  }
}

// Banners & Lifestyle
const bannerMap = {
  'web ban hang banner.png': 'banner-web.png',
  '03.jpg': 'lifestyle-01.jpg',
  '1789610519370_3794365139396876002_g1289962303551061420_b8f84641d31976d691ec834a0384d35e.jpg': 'lifestyle-02.jpg',
};

for (const [orig, dest] of Object.entries(bannerMap)) {
  const origPath = path.join(srcDir, orig);
  const destPath = path.join(bannerDir, dest);
  if (fs.existsSync(origPath)) {
    fs.copyFileSync(origPath, destPath);
    console.log(`Copied ${orig} -> banner/${dest}`);
  }
}

console.log('All image copies complete!');
