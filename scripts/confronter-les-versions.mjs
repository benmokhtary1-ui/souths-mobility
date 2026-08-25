// LE MÊME CHIFFRE, DANS LES DEUX LANGUES
// ===========================================================================
// Chaque énoncé du site existe en deux versions, écrites côte à côte. Elles
// devraient porter exactement les mêmes nombres — une version française qui dit
// 54,4 % et une version anglaise qui dit 70 % ne sont pas deux traductions,
// c'est une correction faite d'un seul côté.
//
// C'est précisément ce qui s'est produit : « sept Africains sur dix » a survécu
// des mois après que le chiffre eut été recalculé, parce que personne ne
// relisait les deux colonnes ENSEMBLE. Le défaut est invisible à la lecture —
// on lit le site dans une langue à la fois — et trivial à détecter en machine.
//
// LA COMPARAISON PORTE SUR LES NOMBRES, PAS SUR LE TEXTE. On extrait de chaque
// version l'ensemble des valeurs numériques, on normalise la virgule décimale
// et les séparateurs de milliers, et on compare les deux ensembles. Toute
// différence est signalée : soit un chiffre a bougé d'un seul côté, soit l'une
// des deux versions dit une chose que l'autre ne dit pas.
//
// LES ÉCARTS LÉGITIMES sont rares mais réels — « sept sur dix » écrit en
// toutes lettres d'un côté et « 70 % » de l'autre, ou une numérotation d'ordre
// (« 4e édition » / « 4th edition ») qui survit. Le script ne peut pas les
// distinguer ; il les montre, et c'est l'œil qui tranche.
//
//   node scripts/confronter-les-versions.mjs
//   node scripts/confronter-les-versions.mjs --tout    (sans filtrer les ordinaux)
import { readFileSync } from 'node:fs';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/data/library.js',
                  'src/data/mondeData.js', 'src/data/methodConventions.js',
                  'src/data/genericDesc.js', 'src/data/glossary.js'];

const dedire = (s) => s
  .replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\`/g, '`')
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

// Une chaine JS delimitee, lue depuis `depuis` jusqu'a son delimiteur de
// fermeture non echappe. On rend aussi l'indice qui suit, pour enchainer.
const lireChaine = (t, depuis) => {
  let i = depuis;
  while (i < t.length && !`"'\``.includes(t[i])) {
    if (!' \t\r\n:,'.includes(t[i])) return null;      // autre chose qu'une chaine
    i++;
  }
  if (i >= t.length) return null;
  const q = t[i];
  let j = i + 1;
  while (j < t.length && (t[j] !== q || t[j - 1] === '\\')) j++;
  return { texte: t.slice(i + 1, j), fin: j + 1 };
};

// Les nombres d'un enonce, normalises. LA NORMALISATION DEPEND DE LA LANGUE :
// en francais la virgule est decimale et l'espace separe les milliers, en
// anglais c'est l'inverse. Traiter « 0,629 » comme un millier anglais donnait
// 0629 et fabriquait un ecart la ou il n'y en avait pas — le defaut etait dans
// le script, pas dans le site.
const nombresDe = (s, langue) => {
  let dedans = s
    .replace(/\{[^{}]*\}/g, ' ')                       // les interpolations : identiques par construction
    .replace(/(\d)[   ](\d{3})\b/g, '$1$2');
  if (langue === 'en') dedans = dedans.replace(/(\d),(\d{3})\b/g, '$1$2');
  const out = [];
  for (const m of dedans.matchAll(/\d+(?:[.,]\d+)?/g)) {
    out.push(m[0].replace(',', '.').replace(/\.0+$/, ''));
  }
  return out.sort();
};

const memes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

// Les ordinaux differ par nature entre les langues (4e / 4th) mais portent le
// meme chiffre ; ils ne creent donc pas d'ecart. Ce qui en cree, ce sont les
// enonces ou une langue ecrit un nombre en toutes lettres.
const LETTRES = /\b(sept|dix|huit|neuf|six|cinq|quatre|trois|deux|un[e]?|onze|douze|vingt|trente|quarante|cinquante|soixante|cent|mille|moiti[ée]|tiers|quart|seven|ten|eight|nine|six|five|four|three|two|one|eleven|twelve|twenty|thirty|forty|fifty|sixty|hundred|thousand|half|third|quarter)\b/i;

const ecarts = [];
let paires = 0;

for (const f of FICHIERS) {
  let t;
  try { t = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  const lignes = t.split('\n');
  const ligneDe = (i) => t.slice(0, i).split('\n').length;

  // Les deux formes du site : L('fr', 'en')  et  tr({ fr: '…', en: '…' }, lang)
  for (const m of t.matchAll(/\bL\(/g)) {
    const a = lireChaine(t, m.index + 2);
    if (!a) continue;
    const b = lireChaine(t, a.fin + (t[a.fin] === ',' ? 1 : 0));
    if (!b) continue;
    paires++;
    const [fr, en] = [dedire(a.texte), dedire(b.texte)];
    const [nf, ne] = [nombresDe(fr, 'fr'), nombresDe(en, 'en')];
    if (!memes(nf, ne)) ecarts.push({ f, l: ligneDe(m.index), fr, en, nf, ne });
  }

  for (const m of t.matchAll(/\bfr:\s*/g)) {
    const a = lireChaine(t, m.index + m[0].length);
    if (!a) continue;
    const reste = t.slice(a.fin, a.fin + 12);
    const k = reste.indexOf('en:');
    if (k < 0) continue;
    const b = lireChaine(t, a.fin + k + 3);
    if (!b) continue;
    paires++;
    const [fr, en] = [dedire(a.texte), dedire(b.texte)];
    const [nf, ne] = [nombresDe(fr, 'fr'), nombresDe(en, 'en')];
    if (!memes(nf, ne)) ecarts.push({ f, l: ligneDe(m.index), fr, en, nf, ne });
  }
}

const tout = process.argv.includes('--tout');
const retenus = tout ? ecarts
  : ecarts.filter(e => !(LETTRES.test(e.fr) || LETTRES.test(e.en)));

console.log('CONFRONTATION DES DEUX VERSIONS');
console.log('='.repeat(74));
console.log(`${paires} énoncés bilingues relus.`);

for (const e of retenus) {
  const seulFr = e.nf.filter(x => !e.ne.includes(x));
  const seulEn = e.ne.filter(x => !e.nf.includes(x));
  console.log(`\n${e.f.replace('src/', '')}:${e.l}`);
  console.log(`   fr seulement : ${seulFr.join(' · ') || '—'}`);
  console.log(`   en seulement : ${seulEn.join(' · ') || '—'}`);
  console.log(`   FR  ${e.fr.replace(/\s+/g, ' ').slice(0, 150)}`);
  console.log(`   EN  ${e.en.replace(/\s+/g, ' ').slice(0, 150)}`);
}

console.log(`\n${'='.repeat(74)}`);
if (!retenus.length) console.log('aucun écart entre les deux versions.');
else console.log(`${retenus.length} écart${retenus.length > 1 ? 's' : ''} à trancher`
  + (tout ? '' : `  (+ ${ecarts.length - retenus.length} où un nombre est écrit en toutes lettres : --tout)`));
