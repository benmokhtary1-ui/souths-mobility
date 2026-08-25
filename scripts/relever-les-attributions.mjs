// À QUOI LA THÈSE EST-ELLE ADOSSÉE ?
// ===========================================================================
// La règle du site est étroite et facile à enfreindre sans s'en apercevoir :
// « (Ben Mokhtar, 2026) » signe un CONCEPT de la thèse — une manière de
// découper l'objet, une définition, une grille — et jamais une donnée. La
// thèse n'est pas une source de chiffres, et un matériau de terrain non publié
// n'a rien à faire sur cette plateforme.
//
// L'enfreindre est facile parce que l'appel se pose en fin de phrase, et
// qu'une phrase qui commence par un concept finit souvent par un chiffre. Le
// script sort chaque attribution DE SA PHRASE et la donne à relire, en
// signalant celles dont la phrase porte une valeur numérique — pas parce
// qu'un nombre y est interdit, mais parce que c'est là que le glissement se
// produit.
//
// « (Ben Mokhtar, 2024) » est autre chose : c'est un article publié, et un
// article publié peut légitimement porter des chiffres. Les deux millésimes
// sont donc comptés séparément.
//
//   node scripts/relever-les-attributions.mjs
//   node scripts/relever-les-attributions.mjs --toutes   (y compris sans chiffre)
import { readFileSync } from 'node:fs';
import { readdirSync } from 'node:fs';

const RACINES = ['src'];
const fichiers = [];
const parcourir = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) parcourir(p);
    else if (/\.(js|jsx)$/.test(e.name)) fichiers.push(p);
  }
};
RACINES.forEach(parcourir);

const dedire = (s) => s
  .replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

// La phrase qui porte l'attribution : on remonte au point precedent, on
// descend jusqu'a celui qui suit la parenthese fermante.
const phraseAutour = (t, i, fin) => {
  let a = 0;
  for (const m of t.matchAll(/[.!?…]\s/g)) { if (m.index < i) a = m.index + m[0].length; else break; }
  let b = t.length;
  for (const m of t.matchAll(/[.!?…]\s/g)) { if (m.index >= fin) { b = m.index + 1; break; } }
  return t.slice(a, b).replace(/\s+/g, ' ').trim();
};

const APPEL = /\(\s*(?:cf\.\s*)?Ben Mokhtar,?\s*(?:Y\.\s*)?\(?(20\d\d)\)?\s*\)/g;

const trouves = [];
for (const f of fichiers) {
  let brut;
  try { brut = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  brut.split('\n').forEach((ligne, i) => {
    if (/^\s*(\/\/|\*)/.test(ligne)) return;               // les commentaires du code
    for (const m of ligne.matchAll(/["'`]((?:[^"'`\\]|\\.){30,})["'`]/g)) {
      const t = dedire(m[1]);
      for (const a of t.matchAll(APPEL)) {
        trouves.push({
          f: f.replace('src/', ''), i: i + 1, an: a[1],
          ph: phraseAutour(t, a.index, a.index + a[0].length),
        });
      }
    }
  });
}

// Un chiffre dans la phrase : ni interdit ni suspect en soi, mais c'est la
// seule zone ou la regle peut se rompre sans qu'on le voie.
const CHIFFRE = /\b\d+(?:[.,]\d+)?\s*(?:%|pour cent|per cent|millions?|M\b|États|states|pays|countries)/i;

const toutes = process.argv.includes('--toutes');
const par2026 = trouves.filter(x => x.an === '2026');
const par2024 = trouves.filter(x => x.an !== '2026');
const aRelire = par2026.filter(x => CHIFFRE.test(x.ph));

console.log('LES ATTRIBUTIONS À LA THÈSE');
console.log('='.repeat(74));
console.log(`${trouves.length} appels · ${par2026.length} à la thèse (2026) · `
  + `${par2024.length} à un travail publié (${[...new Set(par2024.map(x => x.an))].join(', ') || '—'})`);

console.log(`\nÀ RELIRE — la phrase porte une valeur  (${aRelire.length})`);
console.log('-'.repeat(74));
for (const x of aRelire) console.log(`\n  ${x.f}:${x.i}\n  ${x.ph.slice(0, 300)}`);
if (!aRelire.length) console.log('  aucune : aucun appel à la thèse ne signe un chiffre.');

if (toutes) {
  const reste = par2026.filter(x => !CHIFFRE.test(x.ph));
  console.log(`\n\nLES AUTRES — un concept, sans valeur  (${reste.length})`);
  console.log('-'.repeat(74));
  for (const x of reste) console.log(`\n  ${x.f}:${x.i}\n  ${x.ph.slice(0, 240)}`);
}

console.log(`\n${'='.repeat(74)}`);
console.log(aRelire.length
  ? `${aRelire.length} phrase${aRelire.length > 1 ? 's' : ''} à trancher : la thèse y voisine un chiffre.`
  : 'la thèse ne signe que des concepts.');
