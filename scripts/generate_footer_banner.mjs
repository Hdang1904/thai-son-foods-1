import sharp from 'sharp';

async function main() {
  const src = 'd:/WebTSF/thai-son-foods/public/images/banners/footer-banner.jpg';
  
  // 1. Create a 100% clean 2000x2000 wood background from top 85px (completely clean wood, perfectly aligned planks)
  const cleanWood = await sharp(src)
    .extract({ left: 0, top: 0, width: 2000, height: 85 })
    .resize(2000, 2000, { fit: 'fill' })
    .toBuffer();

  // 2. Scale artwork to 86% (1720x1720) so all clovers and leaves have ample margin
  const innerSize = 1720;
  const margin = Math.round((2000 - innerSize) / 2); // 140px

  // 3. Create a smooth rectangular feathered mask with rounded corners
  const maskSvg = `
    <svg width="${innerSize}" height="${innerSize}">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stop-color="#fff" stop-opacity="1" />
          <stop offset="98%" stop-color="#fff" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${innerSize}" height="${innerSize}" fill="url(#g)" />
    </svg>
  `;

  const scaled = await sharp(src)
    .resize(innerSize, innerSize)
    .toBuffer();

  const masked = await sharp(scaled)
    .composite([
      { input: Buffer.from(maskSvg), blend: 'dest-in' }
    ])
    .png()
    .toBuffer();

  await sharp(cleanWood)
    .composite([
      { input: masked, top: margin, left: margin }
    ])
    .jpeg({ quality: 96 })
    .toFile('d:/WebTSF/thai-son-foods/public/images/banners/footer-banner-perfect.jpg');

  console.log('Generated clean seamless banner!');
}

main().catch(console.error);
