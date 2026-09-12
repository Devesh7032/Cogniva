import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const platformDir = path.resolve(rootDir, 'artifacts/cogniva-platform');

let srcDir = path.resolve(platformDir, 'dist');
if (!fs.existsSync(srcDir) || !fs.existsSync(path.join(srcDir, 'index.html'))) {
  srcDir = path.resolve(platformDir, 'dist/public');
}
if (!fs.existsSync(srcDir) || !fs.existsSync(path.join(srcDir, 'index.html'))) {
  srcDir = path.resolve(platformDir, 'public');
}

console.log('[COPY BUILD OUTPUT] Sourcing build artifacts from:', srcDir);

const targets = [
  path.resolve(platformDir, 'public'),
  path.resolve(platformDir, 'dist'),
  path.resolve(platformDir, 'dist/public'),
  path.resolve(rootDir, 'public'),
  path.resolve(rootDir, 'dist'),
  path.resolve(rootDir, 'dist/public')
];

for (const target of targets) {
  const normTarget = path.resolve(target);
  const normSrc = path.resolve(srcDir);
  if (normTarget === normSrc || normTarget.startsWith(normSrc + path.sep)) continue;
  try {
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(srcDir, target, { recursive: true, force: true });
    console.log('[COPY BUILD OUTPUT] Copied to target:', target);
  } catch (err) {
    console.warn('[COPY BUILD OUTPUT] Failed to copy to target:', target, err.message);
  }
}
