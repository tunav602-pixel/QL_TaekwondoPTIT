import fs from 'fs';
import path from 'path';

const distDir = path.join(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const fallbackPath = path.join(distDir, '404.html');

try {
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, fallbackPath);
    console.log('✅ Successfully copied index.html to 404.html for GitHub Pages SPA fallback.');
  } else {
    console.warn('⚠️ Warning: dist/index.html not found, skipping 404.html copy.');
  }
} catch (err) {
  console.error('❌ Error during postbuild step:', err);
}
