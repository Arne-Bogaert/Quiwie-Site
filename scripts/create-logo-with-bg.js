import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIDTH = 1880;
const HEIGHT = 630;
const BG_COLOR = '#f5f0e8'; // --bg-color-start from global.css
const LIGHT_SHADOW_COLOR = '#c7b189'; // Slightly stronger than --warm-sand so it reads on the export background
const WARM_BROWN = '#8b6f47';
const REFERENCE_LOGO_WIDTH = 280; // Matches .header-logo max-width in global.css
const SHADOW_INTENSITY = 0.45;
const MAX_FIRST_SHADOW_OFFSET = 4;
const MAX_SECOND_SHADOW_OFFSET = 10;
const HORIZONTAL_PADDING = 110;
const VERTICAL_PADDING = 56;
const VERTICAL_NUDGE = 38;

function hexToRgba(hex, alpha = 1) {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
    alpha,
  };
}

async function createShadowLayer(logoBuffer, color) {
  const metadata = await sharp(logoBuffer).metadata();
  const alphaMask = await sharp(logoBuffer)
    .ensureAlpha()
    .extractChannel('alpha')
    .png()
    .toBuffer();
  const { r, g, b } = hexToRgba(color);

  return sharp({
    create: {
      width: metadata.width,
      height: metadata.height,
      channels: 3,
      background: { r, g, b },
    },
  })
    .joinChannel(alphaMask)
    .png()
    .toBuffer();
}

async function createLogoWithBackground() {
  const logoPath = path.join(__dirname, '../public/img/quiwie-logo.png');
  const outputPath = path.join(__dirname, '../public/img/quiwie-logo-bg.png');
  const trimmedLogo = sharp(logoPath).trim();

  // Trim transparent padding so visual centering matches the visible artwork.
  const logoMetadata = await trimmedLogo.metadata();
  const logoWidth = logoMetadata.width;
  const logoHeight = logoMetadata.height;

  // Size for a banner: use most of the height while keeping room for the shadow stack.
  const maxLogoWidth =
    WIDTH - HORIZONTAL_PADDING * 2 - MAX_SECOND_SHADOW_OFFSET;
  const maxLogoHeight =
    HEIGHT - VERTICAL_PADDING * 2 - MAX_SECOND_SHADOW_OFFSET;
  const scale = Math.min(maxLogoWidth / logoWidth, maxLogoHeight / logoHeight);

  const resizedWidth = Math.round(logoWidth * scale);
  const resizedHeight = Math.round(logoHeight * scale);

  // Resize the trimmed logo so centering is based on the actual visible shape.
  const resizedLogo = await trimmedLogo
    .resize(resizedWidth, resizedHeight, { fit: 'inside' })
    .toBuffer();

  const shadowScale = resizedWidth / REFERENCE_LOGO_WIDTH;
  const firstShadowOffset = Math.max(
    1,
    Math.min(
      MAX_FIRST_SHADOW_OFFSET,
      Math.round(3 * shadowScale * SHADOW_INTENSITY),
    ),
  );
  const secondShadowOffset = Math.max(
    firstShadowOffset + 1,
    Math.min(
      MAX_SECOND_SHADOW_OFFSET,
      Math.round(6 * shadowScale * SHADOW_INTENSITY),
    ),
  );
  const lightShadow = await createShadowLayer(resizedLogo, LIGHT_SHADOW_COLOR);

  const firstPassWidth = resizedWidth + firstShadowOffset;
  const firstPassHeight = resizedHeight + firstShadowOffset;
  const firstPass = await sharp({
    create: {
      width: firstPassWidth,
      height: firstPassHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: lightShadow,
        left: firstShadowOffset,
        top: firstShadowOffset,
      },
      {
        input: resizedLogo,
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();

  const warmBrownShadow = await createShadowLayer(firstPass, WARM_BROWN);
  const finalLogoWidth = firstPassWidth + secondShadowOffset;
  const finalLogoHeight = firstPassHeight + secondShadowOffset;
  const finalLogoComposite = await sharp({
    create: {
      width: finalLogoWidth,
      height: finalLogoHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: warmBrownShadow,
        left: secondShadowOffset,
        top: secondShadowOffset,
      },
      {
        input: firstPass,
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer();

  // Center based on the actual logo artwork, not the shadow extents, so the banner feels balanced.
  const centeredLeft = Math.round((WIDTH - resizedWidth) / 2);
  const centeredTop = Math.round((HEIGHT - resizedHeight) / 2) + VERTICAL_NUDGE;

  // Create the final image with background and centered logo
  await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([
      {
        input: finalLogoComposite,
        left: centeredLeft,
        top: centeredTop,
      },
    ])
    .png()
    .toFile(outputPath);

  console.log(`Logo with background created: ${outputPath}`);
  console.log(`Dimensions: ${WIDTH}x${HEIGHT}`);
  console.log(`Logo size: ${resizedWidth}x${resizedHeight}`);
  console.log(`Background color: ${BG_COLOR}`);
  console.log(
    `Shadow offsets: ${firstShadowOffset}px and ${secondShadowOffset}px`,
  );
}

createLogoWithBackground().catch(console.error);
