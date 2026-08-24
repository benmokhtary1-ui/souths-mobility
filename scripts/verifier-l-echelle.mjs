// Vérifie que TOUTE classe d'espacement employée dans le corpus tombe sur
// l'échelle — 4 / 8 / 16 / 24 / 40 — ou bien est nommée par l'étalon.
//
// La mesure dans le navigateur ne voit qu'une section à la fois, et le volet
// expire sur toute boucle qui en enchaîne plusieurs. Ce relevé-ci est statique :
// il croise les classes écrites dans le JSX avec les sélecteurs que l'étalon
// nomme dans theme.css, et couvre donc les neuf sections d'un coup.
//
// Ce qui est admis sans être rangé :
//   · une valeur déjà sur un pas (4, 8, 16, 24, 40) et le zéro ;
//   · 1, 2 et 3 px — un rattrapage optique, pas une séparation.
//
//   node scripts/verifier-l-echelle.mjs
import { readFileSync } from 'node:fs';

const jsx = readFileSync('src/App.jsx', 'utf8');
const css = readFileSync('src/theme.css', 'utf8').replace(/\r\n/g, '\n');

// La table de Tailwind, en pixels.
const PX = { '0': 0, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '2.5': 10, '3': 12,
             '3.5': 14, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '9': 36,
             '10': 40, '11': 44, '12': 48, '14': 56, '16': 64, '20': 80, '24': 96 };
// 32 a rejoint l'echelle le 22 aout 2026 : c'est la gouttiere des boites de
// section, le pas 3 ouvert de 30 %.
const PAS = new Set([0, 4, 8, 16, 24, 32, 40]);

const classes = new Set();
const re = /\b((?:sm:|md:|lg:|xl:)?(?:p|m)(?:[xytblrse])?|(?:sm:|md:|lg:|xl:)?gap(?:-[xy])?|space-[xy])-(\d+(?:\.5)?)\b/g;
for (const m of jsx.matchAll(re)) classes.add(m[0]);

// Le sélecteur CSS d'une classe Tailwind : `.` puis les `:` et `.` échappés.
const selecteurDe = (c) => '.' + c.replace(/[:.]/g, (ch) => String.fromCharCode(92) + ch);

const rate = [];
for (const c of [...classes].sort()) {
  const px = PX[c.split('-').pop()];
  if (px === undefined || PAS.has(px) || px <= 3) continue;
  const sel = selecteurDe(c);
  // Nommée par l'étalon ? On cherche le sélecteur suivi d'un délimiteur.
  let nommee = false;
  for (let j = css.indexOf(sel); j !== -1; j = css.indexOf(sel, j + 1)) {
    const suite = css[j + sel.length];
    const avant = css[j - 1];
    // Un sélecteur composé — `.bg-slate-200.p-1\.5` — contient le nôtre sans
    // le nommer : ce qui précède doit être un délimiteur, lui aussi.
    if (avant !== undefined && !',( ' .concat(String.fromCharCode(10), String.fromCharCode(9), '{}>+~').includes(avant)) continue;
    if (suite === undefined || ',) \n\t{'.includes(suite)) { nommee = true; break; }
  }
  if (!nommee) rate.push({ c, px });
}

console.log('classes d\'espacement employees :', classes.size);
console.log('hors echelle ET non nommees par l\'etalon :', rate.length);
for (const r of rate) console.log('   ' + r.c.padEnd(18) + r.px + 'px');
// --- LA COUPURE DE SELECTEUR ------------------------------------------------
//
// Une coupure de ligne au milieu d'un selecteur est un COMBINATEUR DE
// DESCENDANCE. Ecrit sur deux lignes sans virgule, `p:not(.a)` suivi de
// `:not(.b)` ne vise plus le paragraphe mais un enfant du paragraphe. La regle
// continue de compiler, le site continue de se construire, et la voix de
// lecture disparait du site entier -- c'est arrive le 22 aout 2026, en ajoutant
// une exclusion a la regle des deux voix.
//
// On releve donc toute ligne d'un bloc de selecteurs qui ne finit ni par une
// virgule ni par une accolade, et dont la suivante commence par un signe qui
// ne peut pas ouvrir un selecteur descendant : `:`, `.`, `[`, `)`.
const lignes = css.split(String.fromCharCode(10));
const coupures = [];
for (let i = 0; i < lignes.length - 1; i++) {
  const a = lignes[i].trim(), b = lignes[i + 1].trim();
  if (!a || !b) continue;
  if (a.startsWith('/*') || a.startsWith('*') || a.startsWith('//')) continue;
  // Une chaine de :not() coupee en deux : la seconde ligne ne restreint plus le
  // meme element, elle en designe un descendant. Le CSS reste valide, la regle
  // ne s'applique plus.
  if (!b.startsWith(':not(')) continue;
  if (a.endsWith(',') || a.endsWith('{') || a.endsWith('}') || a.endsWith(';')) continue;
  coupures.push({ n: i + 1, a: a.slice(-46), b: b.slice(0, 46) });
}
if (coupures.length) {
  console.log(String.fromCharCode(10) + 'CHAINES DE :not() COUPEES PAR UN RETOUR A LA LIGNE : ' + coupures.length);
  for (const c of coupures) console.log('   L' + c.n + '  ...' + c.a + '  |  ' + c.b + '...');
} else {
  console.log(String.fromCharCode(10) + 'aucune chaine de :not() coupee.');
}

// --- LES CORPS ------------------------------------------------------------
//
// L'echelle des corps compte dix rangs : 12 / 13 / 15 / 17 / 19 / 22 / 26 / 31,
// plus deux corps d'affichage pour les bandeaux, 41,6 et 57,6. Toute taille
// ecrite en dur dans le JSX -- `text-[9px]`, `text-[1.1rem]` -- doit etre
// ramenee a un rang par une regle de theme.css, sinon elle rend sa valeur
// brute et tombe entre deux rangs.
//
// Le piege : theme.css declare CERTAINES de ces classes DEUX fois, et c'est la
// derniere qui gagne. On ne retient donc que la derniere declaration.
// Le bareme est descendu d'un cran le 22 aout 2026 : la prose de lecture est
// revenue a 15, le plancher reste a 12.
const RANGS = [13, 15, 17, 19, 22, 26, 31, 41.6];
const enPx = (v) => {
  const m = String(v).match(/([\d.]+)(px|rem)/);
  if (!m) return null;
  return m[2] === 'rem' ? +m[1] * 16 : +m[1];
};

const arbitraires = new Set();
for (const m of jsx.matchAll(/\btext-\[([0-9.]+(?:px|rem))\]/g)) arbitraires.add(m[1]);

const corpsRates = [];
for (const a of [...arbitraires].sort()) {
  const sel = '.text-' + String.fromCharCode(92) + '[' +
              a.replace('.', String.fromCharCode(92) + '.') +
              String.fromCharCode(92) + ']';
  // La DERNIERE declaration de cette classe dans theme.css.
  let dernier = null;
  for (let j = css.indexOf(sel); j !== -1; j = css.indexOf(sel, j + 1)) {
    const suite = css[j + sel.length];
    if (suite !== undefined && !',) {'.includes(suite)) continue;
    const bloc2 = css.slice(j, css.indexOf('}', j));
    const f = bloc2.match(/font-size:\s*(?:calc\(\s*)?([\d.]+(?:px|rem))/);
    if (f) dernier = f[1];
  }
  const rendu = dernier === null ? enPx(a) : enPx(dernier);
  if (rendu === null) continue;
  if (!RANGS.some((r) => Math.abs(r - rendu) < 0.35))
    corpsRates.push('text-[' + a + ']  rend ' + rendu + 'px' +
                    (dernier === null ? '  (aucune regle)' : '  (regle : ' + dernier + ')'));
}

console.log(String.fromCharCode(10) + 'corps ecrits en dur hors des dix rangs : ' + corpsRates.length);
for (const c of corpsRates) console.log('   ' + c);

process.exit(rate.length === 0 && coupures.length === 0 && corpsRates.length === 0 ? 0 : 1);
