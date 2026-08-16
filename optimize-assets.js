const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const dirs = [
    path.join(__dirname, 'frontend/public'),
    path.join(__dirname, 'website/public')
  ];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;

    // 1. banner_hero
    const heroPath = path.join(dir, 'banner_hero.png');
    if (fs.existsSync(heroPath)) {
      const orig = fs.readFileSync(heroPath);
      const webp = await sharp(orig)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(path.join(dir, 'banner_hero.webp'), webp);

      const compressedPng = await sharp(orig)
        .resize({ width: 1920, withoutEnlargement: true })
        .png({ quality: 80, compressionLevel: 9 })
        .toBuffer();
      fs.writeFileSync(heroPath, compressedPng);
      console.log(`[${dir}] banner_hero: orig ${Math.round(orig.length/1024)}KB -> png ${Math.round(compressedPng.length/1024)}KB, webp ${Math.round(webp.length/1024)}KB`);
    }

    // 2. banner_appliance_repair
    const appliancePath = path.join(dir, 'banner_appliance_repair.png');
    if (fs.existsSync(appliancePath)) {
      const orig = fs.readFileSync(appliancePath);
      const webp = await sharp(orig)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      fs.writeFileSync(path.join(dir, 'banner_appliance_repair.webp'), webp);

      const compressedPng = await sharp(orig)
        .resize({ width: 1200, withoutEnlargement: true })
        .png({ quality: 80, compressionLevel: 9 })
        .toBuffer();
      fs.writeFileSync(appliancePath, compressedPng);
      console.log(`[${dir}] banner_appliance_repair: orig ${Math.round(orig.length/1024)}KB -> png ${Math.round(compressedPng.length/1024)}KB, webp ${Math.round(webp.length/1024)}KB`);
    }

    // 3. mockup-hand
    const mockupSvg = path.join(dir, 'mockup-hand.svg');
    if (fs.existsSync(mockupSvg)) {
      const svgStr = fs.readFileSync(mockupSvg, 'utf8');
      const idx = svgStr.indexOf('base64,');
      if (idx !== -1) {
        const endIdx = svgStr.indexOf('"', idx);
        const b64 = svgStr.substring(idx + 7, endIdx);
        const buf = Buffer.from(b64, 'base64');
        
        const webp = await sharp(buf)
          .resize({ width: 745, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
        fs.writeFileSync(path.join(dir, 'mockup-hand.webp'), webp);

        const png = await sharp(buf)
          .resize({ width: 745, withoutEnlargement: true })
          .png({ quality: 80, compressionLevel: 9 })
          .toBuffer();
        fs.writeFileSync(path.join(dir, 'mockup-hand.png'), png);
        console.log(`[${dir}] mockup-hand: orig SVG ${Math.round(svgStr.length/1024)}KB -> png ${Math.round(png.length/1024)}KB, webp ${Math.round(webp.length/1024)}KB`);
      }
    }
  }
}

run().catch(console.error);
