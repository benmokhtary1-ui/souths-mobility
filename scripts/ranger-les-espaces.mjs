// Range TOUTE l'espace de theme.css sur l'échelle — 4 / 8 / 16 / 24 / 40.
//
// L'étalon des marges existait déjà pour les classes utilitaires (`mt-*`, `p-*`,
// `space-y-*`, `gap-*`). Il ne disait rien des composants nommés, qui écrivaient
// leurs marges en rem : relevé sur le fichier, cent déclarations tombaient à
// côté, et le collage sous 8 px se faisait à SEPT valeurs différentes — 2, 3, 4,
// 4,8, 5,6, 6,4 et 7,2. Sept manières de coller deux mots l'un à l'autre, dont
// aucune ne se lit comme une décision.
//
// CE QUI EST RANGÉ. margin, padding, gap et leurs variantes d'axe, écrites en
// rem ou en px.
//
// CE QUI NE L'EST PAS.
//   · les valeurs négatives — ce sont des rattrapages optiques, pas de l'espace
//     (`.fil-point { margin: -3px 0 0 -3px }` recentre une pastille sur un trait) ;
//   · 1, 2 et 3 px — même raison : on ne sépare pas à cette distance, on ajuste ;
//   · ce qui vit dans `@media print` — la planche imprimée a son propre pas ;
//   · var(), calc(), clamp(), %, auto — déjà tenus par ailleurs.
//
// L'ARRONDI. Au pas le plus proche, et à égalité VERS LE BAS : 12 → 8, 20 → 16,
// 32 → 24. C'est le sens qu'il demande — l'espace de haut en bas est ce qui
// rallonge les pages pour rien.
//
//   node scripts/ranger-les-espaces.mjs            (relevé seul)
//   node scripts/ranger-les-espaces.mjs --ecrire
import { readFileSync, writeFileSync } from 'node:fs';

// 32 : la gouttiere des boites de section, le pas 3 ouvert de 30 %.
const PAS = [4, 8, 16, 24, 32, 40];
const FICHIER = 'src/theme.css';
const ecrire = process.argv.includes('--ecrire');

const brut = readFileSync(FICHIER, 'utf8');
const src = brut.replace(/\r\n/g, '\n');

const enPx = (v) => {
  const m = v.match(/^(-?[\d.]+)(rem|px)$/);
  if (!m) return null;
  return m[2] === 'rem' ? +m[1] * 16 : +m[1];
};
// À égalité, le pas du dessous.
const ranger = (px) => {
  let choix = PAS[0], ecart = Infinity;
  for (const p of PAS) { const d = Math.abs(p - px); if (d < ecart) { ecart = d; choix = p; } }
  return choix;
};
const ecrit = (px) => (px % 16 === 0 && px >= 16 ? `${px / 16}rem` : `${px}px`);

const PROPS = /^(margin|padding)(-(top|bottom|left|right|inline|block|inline-start|inline-end))?$|^(gap|row-gap|column-gap)$/;

// Les zones d'impression sont hors jeu.
const zonesPrint = [];
for (const m of src.matchAll(/@media\s+print[^{]*\{/g)) {
  let i = m.index + m[0].length, prof = 1;
  while (i < src.length && prof > 0) { if (src[i] === '{') prof++; else if (src[i] === '}') prof--; i++; }
  zonesPrint.push([m.index, i]);
}
const dansPrint = (i) => zonesPrint.some(([a, b]) => i >= a && i < b);

const table = [];
let sortie = '', dernier = 0;
const re = /(^|[;{\n]\s*)([a-z-]+)\s*:\s*([^;{}!]+)/g;
let m;
while ((m = re.exec(src))) {
  const [tout, tete, prop, valeur] = m;
  if (!PROPS.test(prop)) continue;
  if (dansPrint(m.index)) continue;
  if (/var\(|calc\(|clamp\(|min\(|max\(|auto|%|inherit|initial|unset/.test(valeur)) continue;
  const parts = valeur.trim().split(/\s+/);
  let change = false;
  const neuves = parts.map((p) => {
    const px = enPx(p);
    if (px === null) return p;
    if (px <= 3) return p;                 // rattrapage optique
    if (PAS.includes(px)) return p;
    change = true;
    return ecrit(ranger(px));
  });
  if (!change) continue;
  const ligne = src.slice(0, m.index).split('\n').length;
  table.push({ ligne, prop, avant: valeur.trim(), apres: neuves.join(' ') });
  sortie += src.slice(dernier, m.index) + tete + prop + ': ' + neuves.join(' ');
  dernier = m.index + tout.length;
}
sortie += src.slice(dernier);

console.log('declarations rangees :', table.length);
const par = {};
for (const t of table) { const k = t.avant + '  →  ' + t.apres; par[k] = (par[k] || 0) + 1; }
Object.entries(par).sort((a, b) => b[1] - a[1]).forEach(([k, v]) =>
  console.log('  ' + String(v).padStart(3) + '  ' + k));

if (ecrire) {
  writeFileSync(FICHIER, sortie.replace(/\n/g, '\r\n'), 'utf8');
  console.log('\necrit.');
} else {
  console.log('\n(releve seul — relancer avec --ecrire)');
}
