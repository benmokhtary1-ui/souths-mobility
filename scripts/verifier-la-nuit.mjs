// Vérifie l'édition de nuit sur les appariements que le rendu ne laisse pas
// mesurer.
//
// Le volet de prévisualisation fige les animations d'entrée : les blocs révélés
// au défilement y restent à `opacity: 0`, et toute mesure prise à travers eux est
// fausse. Les termes du glossaire, entre autres, y sont tous. On calcule donc les
// appariements directement depuis la feuille de style — ce qui ne dépend d'aucun
// rendu et se rejoue à l'identique.
//
//   node scripts/verifier-la-nuit.mjs
import { readFileSync } from 'node:fs';

const lin = u => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const K = (a, b) => {
  const x = lum(hex2rgb(a)), y = lum(hex2rgb(b));
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const css = readFileSync('src/theme.css', 'utf8');

// Les jetons d'une section, dans l'édition demandée.
const jetons = (section, edition) => {
  const bloc = edition === 'nuit'
    ? css.split(`:root[data-theme="nuit"] :is(main, header, nav)[data-section="${section}"]`)[1]
    : css.split(`:is(main, header, nav)[data-section="${section}"]`)[1];
  if (!bloc) return null;
  const corps = bloc.slice(0, bloc.indexOf('}'));
  const lire = (n) => (corps.match(new RegExp('--' + n + ':\\s*(#[0-9A-Fa-f]{6})')) || [])[1];
  return { accent: lire('accent'), deep: lire('accent-deep'),
           soft: lire('accent-soft'), light: lire('accent-light') };
};

const socle = (edition) => {
  if (edition === 'jour') return { paper: '#FCFAF8', carte: '#FFFFFF', encre: '#0C0E12', reserve: '#FFFDF9' };
  const b = css.split(':root[data-theme="nuit"] {')[1];
  const corps = b.slice(0, b.indexOf('\n}'));
  const lire = (n) => (corps.match(new RegExp('--' + n + ':\\s*(#[0-9A-Fa-f]{6})')) || [])[1];
  return { paper: lire('paper'), carte: lire('paper-raised'), encre: lire('ink'), reserve: lire('reserve') };
};

const SECTIONS = ['home', 'evidence', 'explorer', 'mobilites', 'atlas',
                  'governance', 'data', 'resources', 'about'];

// Les appariements qui comptent, et leur cible.
//   Le plan encré est peint avec --accent-soft de nuit et avec l'encre de jour ;
//   c'est là que vivent le bandeau, la barre et les cartes d'emphase.
const EPREUVES = [
  ['terme sur la carte',        (t, s) => [t.accent, s.carte],   4.5],
  ['terme sur le papier',       (t, s) => [t.accent, s.paper],   4.5],
  ['accent creusé, petit corps',(t, s) => [t.deep, s.carte],     7.0],
  ['encre sur aplat teinté',    (t, s) => [s.encre, t.soft],     7.0],
  ['réserve sur plan encré',    (t, s, e) => [s.reserve, e === 'nuit' ? t.soft : s.encre], 7.0],
  ['terme sur plan encré',      (t, s, e) => [e === 'nuit' ? t.deep : t.light,
                                              e === 'nuit' ? t.soft : s.encre], 4.5],
];

let echecs = 0;
for (const edition of ['jour', 'nuit']) {
  const s = socle(edition);
  console.log('\nÉDITION ' + edition.toUpperCase() +
              '   papier ' + s.paper + '  carte ' + s.carte + '  encre ' + s.encre);
  console.log('section      ' + EPREUVES.map(e => e[0].slice(0, 11).padEnd(12)).join(''));
  console.log('-'.repeat(13 + 12 * EPREUVES.length));
  for (const sec of SECTIONS) {
    const t = jetons(sec, edition);
    if (!t || !t.accent) { console.log(sec.padEnd(13) + '(jetons introuvables)'); continue; }
    const ligne = EPREUVES.map(([, paire, cible]) => {
      const [a, b] = paire(t, s, edition);
      if (!a || !b) return '   ?        ';
      const c = K(a, b);
      if (c < cible) echecs++;
      return (c.toFixed(2) + (c < cible ? ' ✗' : '  ')).padEnd(12);
    }).join('');
    console.log(sec.padEnd(13) + ligne);
  }
}

console.log('\ncibles : terme 4,5:1 · accent creusé 7:1 · encre sur aplat 7:1 · réserve 7:1');
console.log(echecs === 0 ? '\ntout tient dans les deux éditions.' : '\n' + echecs + ' appariement(s) sous la cible.');
process.exit(echecs === 0 ? 0 : 1);
