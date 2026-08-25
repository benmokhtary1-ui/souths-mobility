// LES RÈGLES DE FOND, VÉRIFIÉES PLUTÔT QUE RAPPELÉES
// ===========================================================================
// Ce chantier porte une poignée de règles qui ne se négocient pas. Elles ont
// été tenues jusqu'ici par la mémoire, et la mémoire a lâché au moins une fois :
// un dossier citait « Observation participante à l'OAM (2023-2025) » comme
// source publique, ce qui est précisément l'interdit central.
//
// Une règle qu'on se répète coûte à chaque relecture et casse en silence. Une
// règle qu'une commande vérifie ne coûte qu'une fois. Ce script est la seconde
// forme.
//
// IL SORT EN ERREUR quand une règle est enfreinte, pour pouvoir servir de
// verrou avant publication :
//
//     node scripts/verifier-les-regles.mjs
//
// CE QU'IL NE FAIT PAS. Il ne juge ni la justesse d'un chiffre ni la qualité
// d'une phrase — d'autres scripts s'en chargent, et l'essentiel reste affaire
// d'œil. Il tient les six interdits, qui sont mécaniques par nature.
import { readFileSync, readdirSync } from 'node:fs';

// --- Le corpus -------------------------------------------------------------
const fichiers = [];
(function parcourir(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) parcourir(p);
    else if (/\.(js|jsx)$/.test(e.name)) fichiers.push(p);
  }
})('src');

const dedire = (s) => s
  .replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

// Le texte VISIBLE, à l'exclusion des commentaires du code : ceux-ci discutent
// légitimement les règles, y compris en citant ce qu'elles interdisent.
const visible = [];
for (const f of fichiers) {
  let brut;
  try { brut = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  brut.split('\n').forEach((ligne, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) return;
    for (const m of ligne.matchAll(/["'`]((?:[^"'`\\]|\\.){12,})["'`]/g)) {
      visible.push({ f: f.replace('src/', ''), i: i + 1, t: dedire(m[1]) });
    }
  });
}

const manquements = [];
const signaler = (regle, x, quoi) =>
  manquements.push({ regle, ou: `${x.f}:${x.i}`, quoi });

// --- 1. Aucun matériau de terrain non publié -------------------------------
// L'observation participante menée à l'OAM relève de la thèse, pas de cette
// plateforme. Un lecteur ne peut pas aller la vérifier ; elle n'a donc pas
// valeur de source ici, quelle que soit sa solidité par ailleurs.
const TERRAIN = [
  /observation participante/i, /participant observation/i,
  /notes? de terrain/i, /field ?notes/i,
  /diffusion publique (?:est )?limitée/i, /limited public circulation/i,
  /documents? de travail internes?/i, /internal working documents?/i,
];
for (const x of visible)
  for (const r of TERRAIN)
    if (r.test(x.t)) signaler('terrain non publié', x, x.t.slice(0, 110));

// --- 2. Le None Paper est oublié -------------------------------------------
for (const x of visible)
  if (/none.?paper/i.test(x.t)) signaler('None Paper', x, x.t.slice(0, 110));

// --- 3. La thèse signe un concept, jamais un chiffre -----------------------
const CHIFFRE = /\b\d+(?:[.,]\d+)?\s*(?:%|pour cent|per cent|millions?|États|states)/i;
const phraseAutour = (t, i, fin) => {
  let a = 0, b = t.length;
  for (const m of t.matchAll(/[.!?…]\s/g)) if (m.index < i) a = m.index + m[0].length; else break;
  for (const m of t.matchAll(/[.!?…]\s/g)) if (m.index >= fin) { b = m.index + 1; break; }
  return t.slice(a, b);
};
for (const x of visible)
  for (const m of x.t.matchAll(/\(\s*(?:cf\.\s*)?Ben Mokhtar,?\s*2026\s*\)/g)) {
    const ph = phraseAutour(x.t, m.index, m.index + m[0].length);
    if (CHIFFRE.test(ph)) signaler('la thèse signe un chiffre', x, ph.replace(/\s+/g, ' ').slice(0, 130));
  }

// --- 4. Le Sahara n'est pas un État ----------------------------------------
// Le Maroc se rend entier. Le Sahara occidental n'apparaît donc ni comme entrée
// de la base, ni comme membre d'une liste d'États.
const { countryData } = await import('../src/data/countries.js');
const pays = Object.values(countryData).flat();
if (pays.length !== 54)
  manquements.push({ regle: 'les 54 États', ou: 'data/countries.js', quoi: `${pays.length} entrées` });
for (const c of pays) {
  const nom = typeof c.name === 'string' ? c.name : (c.name?.fr || '');
  if (/sahara/i.test(nom) || ['eh', 'esh'].includes((c.iso2 || '').toLowerCase()))
    manquements.push({ regle: 'le Sahara n’est pas un État', ou: 'data/countries.js', quoi: `${nom} (${c.iso2})` });
}
if (!pays.some(c => (c.iso2 || '').toLowerCase() === 'ma'))
  manquements.push({ regle: 'le Maroc est présent', ou: 'data/countries.js', quoi: 'entrée « ma » absente' });

// --- 5. Le compte de 54 ne se justifie pas ---------------------------------
// C'est un état de fait, pas une position à défendre. Le commenter, c'est le
// présenter comme discutable.
const JUSTIFIE = /(?:54\s*(?:États|Etats|states|pays|countries))[^.]{0,80}\b(?:car|parce que|puisque|dans la mesure où|because|since we|we count|nous (?:comptons|retenons))\b/i;
for (const x of visible)
  if (JUSTIFIE.test(x.t)) signaler('le compte de 54 est justifié', x, x.t.slice(0, 130));

// --- 6. Un chiffre arrive avec sa source -----------------------------------
// Vérifié en propre par `auditer-le-fond.mjs`, qui sait lire les blocs
// <Sources>. On se contente ici de rappeler où il vit.

// --- Le verdict ------------------------------------------------------------
console.log('LES RÈGLES DE FOND');
console.log('='.repeat(74));
console.log(`${visible.length} chaînes visibles relues · ${pays.length} États dans la base\n`);

const REGLES = [
  'terrain non publié', 'None Paper', 'la thèse signe un chiffre',
  'le Sahara n’est pas un État', 'le Maroc est présent', 'les 54 États',
  'le compte de 54 est justifié',
];
for (const r of REGLES) {
  const m = manquements.filter(x => x.regle === r);
  console.log(`  ${m.length ? '✗' : '·'}  ${r}${m.length ? `   (${m.length})` : ''}`);
  for (const x of m) console.log(`        ${x.ou}  ${x.quoi}`);
}

console.log(`\n${'='.repeat(74)}`);
if (!manquements.length) {
  console.log('les sept règles tiennent.');
} else {
  console.log(`${manquements.length} manquement${manquements.length > 1 ? 's' : ''}.`);
  process.exitCode = 1;
}
