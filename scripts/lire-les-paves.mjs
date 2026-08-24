// Imprime en entier les paragraphes qui dépassent un seuil de mots.
//
// Le peseur dit combien il en reste ; celui-ci donne le texte, pour choisir où
// couper. Un pavé se coupe là où l'idée change — jamais au milieu d'un
// raisonnement, jamais pour faire du chiffre.
//
//   node scripts/lire-les-paves.mjs        (au-dessus de 82 mots)
//   node scripts/lire-les-paves.mjs 95
import { readFileSync } from 'node:fs';

const src = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');
const seuil = Number(process.argv[2]) || 82;

const phrases = [];
const pousser = (brut) => {
  if (!brut) return;
  for (const t of brut.replace(/\\n/g, '\n').split(/\n\s*\n/)) {
    const p = t.trim().replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (p.length < 90) continue;
    if (/^https?:|^[A-Z0-9_ -]+$/.test(p)) continue;
    phrases.push(p);
  }
};
for (const m of src.matchAll(/\bfr:\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
for (const m of src.matchAll(/\bL\(\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);

const paves = [...new Set(phrases)]
  .map((p) => ({ n: p.split(/\s+/).length, p }))
  .filter((x) => x.n > seuil)
  .sort((a, b) => b.n - a.n);

paves.forEach((x, i) => console.log('[' + i + '] ' + x.n + ' mots — ' + x.p + '\n'));
console.log('paragraphes de plus de ' + seuil + ' mots : ' + paves.length);
