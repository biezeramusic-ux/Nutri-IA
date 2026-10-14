// Verifica se src/i18n/<codigo>.ts traduz todas as chaves de src/i18n/en.ts e mantém as {variáveis}.
// Uso: node scripts/check-i18n.js es fr af ...
const fs = require('fs');
const path = require('path');

const parse = (file) => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'i18n', file), 'utf8');
  const map = {};
  const re = /^\s*("(?:[^"\\]|\\.)*"):\s*("(?:[^"\\]|\\.)*"),?\s*$/gm;
  let m;
  while ((m = re.exec(src))) map[JSON.parse(m[1])] = JSON.parse(m[2]);
  return map;
};

const base = parse('en.ts');
const vars = (s) => (s.match(/\{\w+\}/g) || []).sort().join(',');
let bad = 0;
for (const code of process.argv.slice(2)) {
  const t = parse(`${code}.ts`);
  const missing = Object.keys(base).filter((k) => !(k in t));
  const wrongVars = Object.keys(t).filter((k) => k in base && vars(k) !== vars(t[k]));
  const extra = Object.keys(t).filter((k) => !(k in base));
  console.log(`${code}: ${Object.keys(t).length}/${Object.keys(base).length} chaves | em falta: ${missing.length} | variáveis erradas: ${wrongVars.length} | a mais: ${extra.length}`);
  missing.slice(0, 5).forEach((k) => console.log('   falta:', k));
  wrongVars.slice(0, 5).forEach((k) => console.log('   vars:', k, '=>', t[k]));
  if (missing.length || wrongVars.length) bad = 1;
}
process.exit(bad);
