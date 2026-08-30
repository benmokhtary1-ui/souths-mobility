// COMBIEN DE MOTS PAR PHRASE, ET OÙ SONT LES PIRES
// ===========================================================================
// L'audit externe mesure une « facilité de lecture » de 57 sur 100 et conclut :
// « le texte est probablement plus difficile à lire qu'il ne devrait l'être ;
// raccourcir les phrases, définir les termes scientifiques ». Le conseil est
// juste, mais un score global ne dit pas OÙ agir.
//
// Ce relevé le dit. Il compte les mots par phrase sur toute la prose visible,
// donne la distribution, et sort la liste des phrases les plus longues avec
// leur emplacement.
//
// LES SEUILS. En français, une phrase de vingt mots se lit sans effort, une de
// trente demande de la relire, une de quarante se perd. Ce sont des ordres de
// grandeur, pas une règle : une phrase longue mais bien articulée vaut mieux
// qu'un hachis de propositions courtes, et ce chantier a déjà produit de la
// prose abrupte à force de couper. Le relevé désigne, il ne condamne pas.
//
// CE QU'IL NE COMPTE PAS. Les libellés, les titres, les intitulés de colonne :
// ce ne sont pas des phrases. On ne retient que ce qui se termine par un point
// et compte au moins huit mots.
//
//   node scripts/mesurer-la-lisibilite.mjs
//   node scripts/mesurer-la-lisibilite.mjs 40    (les phrases de 40 mots et plus)
import { readFileSync, readdirSync } from 'node:fs';

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

// La prose francaise visible : des chaines assez longues pour etre des phrases.
const phrases = [];
for (const f of fichiers) {
  let brut;
  try { brut = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  brut.split('\n').forEach((ligne, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) return;
    for (const m of ligne.matchAll(/["'`]((?:[^"'`\\]|\\.){60,})["'`]/g)) {
      const t = dedire(m[1]);
      if (!/[àâçéèêëîïôûùüÿœ]/.test(t)) continue;         // la version anglaise
      // On decoupe en phrases. L abreviation « M. », « p. ex. » ne coupe pas.
      for (const p of t.split(/(?<![A-Z][a-z]|\bp|\bex|\bcf|\bn°)\.\s+(?=[A-ZÀÉÈÊÎÔÛ«])/)) {
        const mots = (p.match(/[\p{L}\p{N}’'-]+/gu) || []).length;
        if (mots >= 8) phrases.push({ f: f.replace('src/', ''), i: i + 1, mots, t: p.trim() });
      }
    }
  });
}

const seuil = Number(process.argv[2]) || 0;

// --- la distribution -------------------------------------------------------
const tranches = [[8, 15], [16, 20], [21, 25], [26, 30], [31, 40], [41, 60], [61, 999]];
const total = phrases.length;
const somme = phrases.reduce((s, p) => s + p.mots, 0);

console.log('LA LONGUEUR DES PHRASES');
console.log('='.repeat(74));
console.log(`${total} phrases françaises · ${Math.round(somme / total)} mots en moyenne\n`);
for (const [a, b] of tranches) {
  const n = phrases.filter(p => p.mots >= a && p.mots <= b).length;
  const part = Math.round((n / total) * 100);
  const barre = '█'.repeat(Math.round(part / 2));
  const nom = b === 999 ? `${a} et plus` : `${a} à ${b}`;
  console.log(`  ${nom.padStart(10)} mots  ${String(n).padStart(4)}  ${String(part).padStart(3)} %  ${barre}`);
}

// --- ce qui dépasse --------------------------------------------------------
const LONGUE = 35;
const longues = phrases.filter(p => p.mots >= (seuil || LONGUE)).sort((a, b) => b.mots - a.mots);
console.log(`\n\nLES PLUS LONGUES  (${seuil || LONGUE} mots et plus : ${longues.length})`);
console.log('-'.repeat(74));
for (const p of longues.slice(0, 25)) {
  console.log(`\n  ${p.mots} mots — ${p.f}:${p.i}`);
  console.log(`  ${p.t.replace(/\s+/g, ' ').slice(0, 210)}`);
}
if (longues.length > 25) console.log(`\n  (+ ${longues.length - 25} autres)`);

console.log(`\n${'='.repeat(74)}`);
const lourdes = phrases.filter(p => p.mots > 30).length;
console.log(`${lourdes} phrases de plus de trente mots, soit ${Math.round((lourdes / total) * 100)} % du corpus.`);
console.log('Une phrase longue mais articulée vaut mieux qu’un hachis de propositions.');
console.log('Ce relevé désigne où regarder ; il ne dit pas de couper.');
