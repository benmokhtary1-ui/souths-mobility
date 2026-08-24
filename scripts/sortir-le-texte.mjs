// Sort le texte français du site, dans l'ordre du fichier, avec le numéro de
// ligne et le nom du composant qui le porte.
//
// « Le texte est mal écrit, abrupt, sans essence, peu rigoureux, peu académique,
// peu raisonné. » Pour le reprendre il faut d'abord le LIRE comme un lecteur le
// lit : d'affilée, dans l'ordre, section par section — pas par grep.
//
//   node scripts/sortir-le-texte.mjs > texte.md
//   node scripts/sortir-le-texte.mjs TabEvidence   (une section)
import { readFileSync } from 'node:fs';

const brut = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');
const lignes = brut.split('\n');
const filtre = process.argv[2];

// Le composant courant : la dernière déclaration de composant rencontrée.
const composants = [];
lignes.forEach((l, i) => {
  const m = l.match(/^const ([A-Z]\w+)\s*=\s*\(?\{?/) || l.match(/^function ([A-Z]\w+)\s*\(/);
  if (m) composants.push({ ligne: i, nom: m[1] });
});
const composantDe = (i) => {
  let nom = '(hors composant)';
  for (const c of composants) { if (c.ligne <= i) nom = c.nom; else break; }
  return nom;
};

const dedire = (s) => s
  .replace(/\\n/g, '\n')
  .replace(/\\"/g, '"')
  .replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

let courant = null;
let n = 0;
lignes.forEach((l, i) => {
  const trouves = [];
  for (const m of l.matchAll(/\bfr:\s*"((?:[^"\\]|\\.)*)"/g)) trouves.push(m[1]);
  for (const m of l.matchAll(/\bL\(\s*"((?:[^"\\]|\\.)*)"/g)) trouves.push(m[1]);
  for (const m of l.matchAll(/\bL\(\s*'((?:[^'\\]|\\.)*)'/g)) trouves.push(m[1]);
  // Une chaîne française seule sur sa ligne, premier argument de L( ou tr(
  if (!trouves.length && /^\s*"[^"]/.test(l) && /[àâçéèêëîïôûùüÿœ’]/.test(l)) {
    const m = l.match(/^\s*"((?:[^"\\]|\\.)*)"/);
    if (m) trouves.push(m[1]);
  }
  for (const t of trouves) {
    const texte = dedire(t).trim();
    if (texte.length < 70) continue;
    if (/^https?:/.test(texte)) continue;
    const c = composantDe(i);
    if (filtre && !c.toLowerCase().includes(filtre.toLowerCase())) continue;
    if (c !== courant) { console.log('\n\n## ' + c + '\n'); courant = c; }
    n++;
    console.log('[l. ' + (i + 1) + ']  ' + texte.replace(/\n\s*\n/g, '\n\n           ') + '\n');
  }
});
console.error('paragraphes sortis : ' + n);
