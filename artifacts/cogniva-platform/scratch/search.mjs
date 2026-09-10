import fs from 'fs';

const content = fs.readFileSync('./src/lib/academic-api.ts', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if ((line.includes('!error') || line.includes('!err')) && line.includes('data')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
