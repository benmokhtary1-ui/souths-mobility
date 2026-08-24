// Pèse le fond : ce que chaque section fait lire, et ce qui s'y répète.
//
// « Retire ce qui est inutile, superflu, non pertinent, et améliore ce qui
// restera. » Pour retirer sans se tromper, il faut d'abord savoir où est le
// poids — et surtout où le même propos revient sous deux plumes.
//
// Le relevé donne trois choses :
//
//   LE VOLUME        combien de mots la plateforme fait lire.
//   LES LONGUEURS    les paragraphes de plus de soixante mots : au-delà, un
//                    paragraphe de prose se relit avant d'être compris.
//   LES REDITES      les paires de paragraphes qui partagent l'essentiel de
//                    leur vocabulaire plein. Deux textes à 55 % de mots communs
//                    disent la même chose : l'un des deux est de trop.
//
//   node scripts/peser-le-fond.mjs
//   node scripts/peser-le-fond.mjs --redites   (le détail des paires)
//   node scripts/peser-le-fond.mjs --long      (les longs, en entier)
import { readFileSync } from 'node:fs';

const src = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');
const detail = process.argv.includes('--redites');

// Les chaînes françaises visibles : `fr: "…"` et le premier argument de L(…).
const phrases = [];
// Une chaîne qui porte une ligne vide se rend en plusieurs paragraphes : on la
// pèse alinéa par alinéa, comme elle se lit, et non comme elle est stockée.
const pousser = (brut) => {
  if (!brut) return;
  for (const t of brut.replace(/\\n/g, '\n').split(/\n\s*\n/)) {
    const p = t.trim().replace(/\\'/g, "'").replace(/\\"/g, '"');
    if (p.length < 90) continue;                   // en deçà, ce n'est pas de la prose
    if (/^https?:|^[A-Z0-9_ -]+$/.test(p)) continue;
    phrases.push(p);
  }
};
for (const m of src.matchAll(/\bfr:\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
for (const m of src.matchAll(/\bL\(\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
for (const m of src.matchAll(/\bL\(\s*'((?:[^'\\]|\\.)*)'/g)) pousser(m[1]);

const uniques = [...new Set(phrases)];

// --- Le volume -------------------------------------------------------------
const mots = uniques.reduce((n, p) => n + p.split(/\s+/).length, 0);
console.log('paragraphes de prose française :', uniques.length);
console.log('mots au total                  :', mots);

// --- Les longueurs ---------------------------------------------------------
const longs = uniques
  .map((p) => ({ n: p.split(/\s+/).length, p }))
  .filter((x) => x.n > 60)
  .sort((a, b) => b.n - a.n);
console.log('\nparagraphes de plus de 60 mots :', longs.length,
            '(' + Math.round((100 * longs.length) / uniques.length) + ' % du total)');
const combien = process.argv.includes('--long') ? 6 : 8;
for (const l of longs.slice(0, combien)) {
  if (process.argv.includes('--long')) {
    console.log('   ' + l.n + ' mots —');
    console.log('   ' + l.p);
  } else {
    console.log('   ' + String(l.n).padStart(3) + ' mots — ' + l.p.slice(0, 96) + '…');
  }
}

// --- Les redites -----------------------------------------------------------
// On compare le vocabulaire PLEIN : les mots de cinq lettres ou plus, hors
// mots de liaison propres au site. Deux paragraphes qui partagent la majorité
// de leur vocabulaire plein disent la même chose, quel que soit leur tour.
//
// MAIS on ne compare que ce qui peut être lu EN MÊME TEMPS. Le glossaire de
// survol s'ouvre sur un mot, à la demande, et jamais à côté du texte qui
// emploie ce mot : qu'une définition reprenne les termes du paragraphe est
// normal — c'est même ce qu'on lui demande. Les définitions sont donc écartées
// de la comparaison et comptées à part. Sans cela, le relevé signale des
// redites que personne ne lit deux fois, et noie celles qui existent vraiment.
const definitions = new Set();
{
  const d = src.indexOf('const PLAIN_TERMS = {');
  if (d >= 0) {
    const bloc = src.slice(d, src.indexOf('\n};', d));
    for (const m of bloc.matchAll(/\n\s*fr: "((?:[^"\\]|\\.)*)"/g)) {
      definitions.add(m[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim());
    }
  }
}
const lisibles = uniques.filter((p) => !definitions.has(p));
console.log('\ndéfinitions du glossaire écartées de la comparaison :',
            uniques.length - lisibles.length);

const VIDES = new Set(['cette', 'section', 'plateforme', 'chaque', 'entre', 'leurs',
                       'leur', 'dans', 'pour', 'plus', 'moins', 'comme', 'aussi',
                       'alors']);
const sac = (t) => new Set(
  (t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .match(/[a-z]{5,}/g) || []).filter((m) => !VIDES.has(m)),
);
const sacs = lisibles.map(sac);

const paires = [];
for (let i = 0; i < lisibles.length; i++) {
  for (let j = i + 1; j < lisibles.length; j++) {
    const A = sacs[i], B = sacs[j];
    if (A.size < 8 || B.size < 8) continue;
    let c = 0;
    for (const x of A) if (B.has(x)) c++;
    const part = (100 * c) / Math.min(A.size, B.size);
    if (part >= 55) paires.push({ part: Math.round(part), a: lisibles[i], b: lisibles[j] });
  }
}
paires.sort((x, y) => y.part - x.part);
console.log('\npaires de paragraphes à 55 % de vocabulaire commun ou plus :', paires.length);
for (const p of paires.slice(0, detail ? 40 : 6)) {
  console.log('\n   ' + p.part + ' % —');
  console.log('     A · ' + p.a.slice(0, 118) + (p.a.length > 118 ? '…' : ''));
  console.log('     B · ' + p.b.slice(0, 118) + (p.b.length > 118 ? '…' : ''));
}
if (!detail && paires.length > 6) console.log('\n   (…relancer avec --redites pour tout voir)');
