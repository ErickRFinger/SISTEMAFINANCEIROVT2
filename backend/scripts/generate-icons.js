import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.join(__dirname, '../../frontend/public/finance-icon.svg');
const publicDir = path.join(__dirname, '../../frontend/public');

async function generateIcons() {
    try {
        console.log('Generating icons from:', svgPath);

        await sharp(svgPath)
            .resize(192, 192)
            .png()
            .toFile(path.join(publicDir, 'pwa-192x192.png'));
        console.log('✅ pwa-192x192.png generated');

        await sharp(svgPath)
            .resize(512, 512)
            .png()
            .toFile(path.join(publicDir, 'pwa-512x512.png'));
        console.log('✅ pwa-512x512.png generated');

        // Also generate favicon.ico (32x32 png basically, or actually ico)
        // Sharp output as png, then we can rename or use as is for now. 
        // Vite uses svg favicon mostly but good to have fallback
        await sharp(svgPath)
            .resize(64, 64)
            .png()
            .toFile(path.join(publicDir, 'favicon.png'));
        console.log('✅ favicon.png generated');

    } catch (error) {
        console.error('Error generating icons:', error);
    }
}

generateIcons();
