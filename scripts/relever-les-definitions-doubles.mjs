// Relève les notions définies DEUX FOIS : une fois dans le glossaire, une fois
// dans le `plain` d'une couche de carte.
//
// La règle du site devrait être simple — le glossaire DÉFINIT, la carte dit ce
// qu'elle MONTRE — et elle ne l'est pas : « rétention Sud-Sud » est définie
// mot pour mot aux deux endroits, le score d'ancrage trois fois, la Convention
// de l'OUA de 1969 trois fois aussi.
//
// Le relevé croise, pour chaque couche de la carte, son `plain` et son `hint`
// avec la définition que porte le glossaire du même terme.
//
//   node scripts/relever-les-definitions-doubles.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

const sac = (t) => new Set(
  (t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .match(/[a-z]{5,}/g) || []),
);
const part = (a, b) => {
  const A = sac(a), B = sac(b);
  if (A.size < 5 || B.size < 5) return 0;
  let c = 0;
  for (const x of A) if (B.has(x)) c++;
  return Math.round((100 * c) / Math.min(A.size, B.size));
};

// Les termes du glossaire de survol (PLAIN_TERMS) : { cle: { fr } }
const termes = {};
const bloc = src.slice(src.indexOf('const PLAIN_TERMS = {'), src.indexOf('\n};', src.indexOf('const PLAIN_TERMS = {')));
for (const m of bloc.matchAll(/\n  (\w+): \{([\s\S]*?)\n  \},/g)) {
  const fr = (m[2].match(/\n\s*fr: "((?:[^"\\]|\\.)*)"/) || [])[1];
  if (fr) termes[m[1]] = fr;
}

// Les couches de la carte : { key, plain, hint, term }
const couches = [];
const bloc2 = src.slice(src.indexOf('const mapIndicators = ['), src.indexOf('\n];', src.indexOf('const mapIndicators = [')));
for (const m of bloc2.matchAll(/\{\s*\n?\s*key: '(\w+)',([\s\S]*?)\n  \}/g)) {
  const corps = m[2];
  const lire = (champ) => {
    const r = corps.match(new RegExp(champ + ': \\{ fr: "((?:[^"\\\\]|\\\\.)*)"'));
    return r ? r[1] : '';
  };
  couches.push({
    key: m[1],
    plain: lire('plain'),
    hint: lire('hint'),
    term: (corps.match(/term: '(\w+)'/) || [])[1] || m[1],
  });
}

console.log('termes de survol relevés :', Object.keys(termes).length);
console.log('couches de carte relevées :', couches.length, '\n');

let n = 0;
for (const c of couches) {
  const def = termes[c.term] || termes[c.key];
  if (!def || !c.plain) continue;
  const p = part(def, c.plain);
  if (p < 45) continue;
  n++;
  console.log(c.key + '  —  ' + p + ' % de vocabulaire commun');
  console.log('   glossaire · ' + def.slice(0, 108) + (def.length > 108 ? '…' : ''));
  console.log('   la carte  · ' + c.plain.slice(0, 108) + (c.plain.length > 108 ? '…' : ''));
  console.log();
}
console.log(n === 0
  ? 'aucune notion définie deux fois.'
  : n + ' notion(s) définie(s) deux fois : le glossaire définit, la carte devrait dire ce qu’elle montre.');
