/**
 * Favicon Generation Script
 * 
 * This script generates favicon.ico and apple-touch-icon.png from the SVG favicon.
 * 
 * Prerequisites:
 *   npm install sharp --save-dev
 *   npm install png-to-ico --save-dev
 * 
 * Usage:
 *   node scripts/generate-favicons.js
 * 
 * Alternatively, you can use online tools:
 *   1. Go to https://realfavicongenerator.net/
 *   2. Upload public/favicon.svg
 *   3. Download the generated favicon package
 *   4. Replace the files in public/
 */

const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  try {
    // Check if sharp is installed
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.log('📦 Sharp is not installed. Installing...');
      console.log('Run: npm install sharp --save-dev');
      console.log('\nAlternatively, use https://realfavicongenerator.net/ to generate favicons from public/favicon.svg');
      return;
    }

    const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    // Generate apple-touch-icon.png (180x180)
    console.log('🍎 Generating apple-touch-icon.png (180x180)...');
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png created');

    // Generate favicon-32x32.png
    console.log('📐 Generating favicon-32x32.png...');
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-32x32.png'));
    console.log('✅ favicon-32x32.png created');

    // Generate favicon-16x16.png
    console.log('📐 Generating favicon-16x16.png...');
    await sharp(svgBuffer)
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, '..', 'public', 'favicon-16x16.png'));
    console.log('✅ favicon-16x16.png created');

    // Try to generate .ico file
    try {
      const pngToIco = require('png-to-ico');
      console.log('🔷 Generating favicon.ico...');
      
      const png32 = fs.readFileSync(path.join(__dirname, '..', 'public', 'favicon-32x32.png'));
      const ico = await pngToIco([png32]);
      fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), ico);
      console.log('✅ favicon.ico created');
    } catch (e) {
      console.log('⚠️  png-to-ico not installed. Run: npm install png-to-ico --save-dev');
      console.log('   The SVG favicon will be used as primary (supported by most modern browsers)');
    }

    console.log('\n🎉 Favicon generation complete!');
  } catch (error) {
    console.error('❌ Error generating favicons:', error.message);
    console.log('\nAlternatively, use https://realfavicongenerator.net/ to generate favicons from public/favicon.svg');
  }
}

generateFavicons();

