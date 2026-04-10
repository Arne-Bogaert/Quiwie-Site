import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIDTH = 1880;
const HEIGHT = 630;
const BG_COLOR = '#f5f0e8'; // --bg-color-start from global.css

async function createLogoWithBackground() {
  const logoPath = path.join(__dirname, '../public/img/quiwie-logo.png');
  const outputPath = path.join(__dirname, '../public/img/quiwie-logo-bg.png');

  // Get logo metadata to calculate scaling
  const logoMetadata = await sharp(logoPath).metadata();
  const logoWidth = logoMetadata.width;
  const logoHeight = logoMetadata.height;

  // Calculate scale to fit logo nicely (80% of height or width)
  const maxLogoWidth = WIDTH * 0.7;
  const maxLogoHeight = HEIGHT * 0.7;
  const scale = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);
  
  const resizedWidth = Math.round(logoWidth * scale);
  const resizedHeight = Math.round(logoHeight * scale);

  // Resize the logo
  const resizedLogo = await sharp(logoPath)
    .resize(resizedWidth, resizedHeight, { fit: 'inside' })
    .toBuffer();

  // Create the final image with background and centered logo
  const result = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: BG_COLOR
    }
  })
    .composite([
      {
        input: resizedLogo,
        gravity: 'center'
      }
    ])
    .png()
    .toFile(outputPath);

  console.log(`Logo with background created: ${outputPath}`);
  console.log(`Dimensions: ${WIDTH}x${HEIGHT}`);
  console.log(`Background color: ${BG_COLOR}`);
}

createLogoWithBackground().catch(console.error);
