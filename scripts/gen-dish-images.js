// Lê assets/dishes/*.jpg|png|webp e gera src/constants/dishImages.ts com um require() por foto.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'dishes');
const out = path.join(__dirname, '..', 'src', 'constants', 'dishImages.ts');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];

const lines = files.map((f) => `  '${f.replace(/\.[^.]+$/, '')}': require('../../assets/dishes/${f}'),`);
const body = `// Gerado por scripts/gen-dish-images.js (npm run dishes). Não editar à mão.
export const DISH_IMAGES: Record<string, number> = {
${lines.join('\n')}
};
`;
fs.writeFileSync(out, body);
console.log(`${files.length} foto(s) registadas em src/constants/dishImages.ts`);
