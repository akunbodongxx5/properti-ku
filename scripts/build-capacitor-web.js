const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'www');

const files = [
  'index.html',
  'styles.css',
  'app.js',
  'i18n.js',
  'analytics.js',
  'manifest.json',
  'sw.js',
  'privacy.html',
  'icon.svg',
  'icon-192.png',
  'icon-512.png'
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) continue;
  fs.copyFileSync(src, path.join(outDir, file));
}

console.log(`Built Capacitor web assets in ${path.relative(root, outDir)}/`);
