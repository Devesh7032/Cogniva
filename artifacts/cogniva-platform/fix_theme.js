const fs = require('fs');
const path = 'src/components/StrategyCenter.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950', 'bg-white'],
  ['bg-slate-950/80', 'bg-slate-50'],
  ['bg-slate-950', 'bg-slate-50'],
  ['bg-slate-900/50', 'bg-slate-50'],
  ['bg-slate-900', 'bg-white'],
  ['bg-slate-800/80', 'bg-slate-50'],
  ['bg-slate-800/50', 'bg-slate-50'],
  ['bg-slate-800', 'bg-slate-100'],
  ['bg-slate-700', 'bg-slate-200'],
  ['backdrop-blur-md', ''],
  
  ['border-slate-800', 'border-slate-200'],
  ['border-slate-700', 'border-slate-200'],
  ['border-slate-600', 'border-slate-300'],
  
  ['text-slate-50', 'text-slate-900'],
  ['text-slate-100', 'text-slate-900'],
  ['text-slate-200', 'text-slate-800'],
  ['text-slate-300', 'text-slate-700'],
  ['text-slate-400', 'text-slate-500'],
  
  ['text-teal-400', 'text-teal-700'],
  ['text-teal-300', 'text-teal-600'],
  ['text-emerald-400', 'text-emerald-700'],
  ['text-emerald-300', 'text-emerald-600'],
  ['text-cyan-400', 'text-cyan-700'],
  ['text-cyan-300', 'text-cyan-600'],
  ['text-amber-400', 'text-amber-700'],
  ['text-amber-300', 'text-amber-600'],
  ['text-rose-400', 'text-rose-700'],
  ['text-rose-300', 'text-rose-600'],
  ['text-indigo-400', 'text-indigo-700'],
  ['text-indigo-300', 'text-indigo-600'],
  
  ['bg-teal-500/10', 'bg-teal-50'],
  ['border-teal-500/20', 'border-teal-200'],
  ['bg-emerald-500/10', 'bg-emerald-50'],
  ['border-emerald-500/30', 'border-emerald-200'],
  ['bg-rose-500/10', 'bg-rose-50'],
  ['border-rose-500/30', 'border-rose-200'],
  ['bg-amber-500/10', 'bg-amber-50'],
  ['border-amber-500/30', 'border-amber-200'],
  ['bg-cyan-500/10', 'bg-cyan-50'],
  ['border-cyan-500/30', 'border-cyan-200'],
  
  ['hover:bg-slate-700', 'hover:bg-slate-200'],
  ['active:bg-slate-950', 'active:bg-slate-300'],
  ['hover:bg-slate-800', 'hover:bg-slate-100']
];

let newContent = content;
for (const [find, replace] of replacements) {
  newContent = newContent.split(find).join(replace);
}

fs.writeFileSync(path, newContent);
console.log('Theme replaced successfully.');
