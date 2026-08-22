// Relève les tics d'écriture dans la prose française du site.
//
// Deux passes de style ont déjà eu lieu (la négation contrastive, les phrases
// jumelles, le remplissage). Celle-ci ne refait pas le même relevé à l'œil : elle
// extrait toutes les chaînes françaises visibles et compte les motifs, pour que
// la réécriture porte sur ce qui reste et non sur ce qu'on croit qui reste.
//
// Ce que la sonde cherche, et pourquoi :
//
//   NÉGATION CONTRASTIVE  « ce n'est pas X, c'est Y » — la figure la plus datée
//                          de la prose générée. Elle pose un contraire pour
//                          n'en rien faire.
//   FAUSSE PROFONDEUR     « c'est précisément là que », « c'est tout l'enjeu »,
//                          « ce n'est pas anodin » — de l'emphase sans contenu.
//   JUMELLES              deux adjectifs ou deux groupes coordonnés qui disent
//                          la même chose (« clair et lisible »).
//   TROP LONG             au-delà de quarante mots, une phrase de prose se
//                          relit deux fois.
//   OUVERTURES RÉPÉTÉES   dix phrases qui commencent par « Cette » dans une
//                          même section s'entendent.
//
//   node scripts/relire-la-prose.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync('src/App.jsx', 'utf8');

// Les chaînes françaises : `fr: "…"` ou `fr: '…'`, plus les L('…', '…').
const phrases = [];
const pousser = (t) => {
  if (!t || t.length < 40) return;
  if (/^https?:|^[A-Z0-9_ -]+$/.test(t)) return;
  phrases.push(t.replace(/\\'/g, "'").replace(/\\"/g, '"'));
};
for (const m of src.matchAll(/\bfr:\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
for (const m of src.matchAll(/\bfr:\s*'((?:[^'\\]|\\.)*)'/g)) pousser(m[1]);
for (const m of src.matchAll(/\bL\(\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
for (const m of src.matchAll(/\bL\(\s*'((?:[^'\\]|\\.)*)'/g)) pousser(m[1]);

const uniques = [...new Set(phrases)];

const motifs = [
  ['negation contrastive',
   /\bn(?:e |')(?:est|sont|s'agit|se|tient|vient|relève|résulte)[^.;!?]{0,60}\bpas\b[^.;!?]{0,80}?[,:]?\s*(?:mais|c'est|elle est|il est)\b/gi],
  ['fausse profondeur',
   /\b(?:c'est (?:précisément|justement|bien) (?:là|ce|cela)|c'est tout l'enjeu|ce n'est pas anodin|loin d'être anodin|il est important de (?:noter|souligner)|force est de constater|à bien des égards|en réalité,)/gi],
  ['jumelles',
   /\b(\p{L}{5,})\s+et\s+(\p{L}{5,})\b(?=[\s,.;])/gu],
  ['tournure passive lourde',
   /\b(?:est|sont|était|étaient) (?:largement|essentiellement|principalement|notamment|souvent) \p{L}+és?e?s?\b/giu],
];

const compte = {};
const exemples = {};
for (const [nom, re] of motifs) {
  compte[nom] = 0; exemples[nom] = [];
  for (const p of uniques) {
    for (const m of p.matchAll(re)) {
      // « jumelles » : on ne retient que les couples vraiment redondants,
      // c'est-à-dire de même nature et de longueur voisine. « migration et
      // développement » est un couple de fond, pas un tic.
      if (nom === 'jumelles') {
        const [, a, b] = m;
        if (Math.abs(a.length - b.length) > 3) continue;
        if (!/(ment|ible|able|aire|eux|ive|ale)$/i.test(a)) continue;
        if (!/(ment|ible|able|aire|eux|ive|ale)$/i.test(b)) continue;
      }
      compte[nom]++;
      if (exemples[nom].length < 6) exemples[nom].push(m[0].slice(0, 88));
    }
  }
}

// Phrases trop longues
const longues = [];
for (const p of uniques) {
  for (const ph of p.split(/(?<=[.!?])\s+/)) {
    const n = ph.trim().split(/\s+/).length;
    if (n > 40) longues.push({ n, ph: ph.trim().slice(0, 110) });
  }
}
longues.sort((a, b) => b.n - a.n);

// Ouvertures répétées
const ouvertures = {};
for (const p of uniques) {
  for (const ph of p.split(/(?<=[.!?])\s+/)) {
    const mot = ph.trim().split(/\s+/)[0];
    if (!mot || mot.length < 3) continue;
    ouvertures[mot] = (ouvertures[mot] || 0) + 1;
  }
}

console.log('chaines francaises relevees :', uniques.length, '\n');
for (const [nom] of motifs) {
  console.log(nom.padEnd(24), String(compte[nom]).padStart(4));
  for (const e of exemples[nom]) console.log('   · ' + e);
}
console.log('\nphrases de plus de 40 mots :', longues.length);
for (const l of longues.slice(0, 10)) console.log('   ' + String(l.n).padStart(3) + ' mots — ' + l.ph);

console.log('\nouvertures de phrase les plus frequentes :');
Object.entries(ouvertures).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .forEach(([m, n]) => console.log('   ' + String(n).padStart(4) + '  ' + m));

// --- Cohérence des termes et typographie ------------------------------------
//
// Le premier relevé ne voit que des tournures. Sur un site scientifique, le
// défaut le plus coûteux est ailleurs : le même objet nommé de deux façons d'une
// section à l'autre, et l'apostrophe droite au milieu d'une prose composée.

const couples = [
  ['libre circulation', /\blibre circulation\b/gi, /\blibert[ée] de circulation\b/gi],
  ['CER / communautés',  /\bCER\b/g,               /\bcommunaut[ée]s? [ée]conomiques? r[ée]gionales?\b/gi],
  ['Pacte mondial',      /\bPacte mondial\b/gi,    /\bGCM\b/g],
  ['Union africaine',    /\bUnion africaine\b/gi,  /\bUA\b/g],
  ['recensement',        /\brecensement/gi,        /\bd[ée]nombrement/gi],
  ['transferts',         /\btransferts? (?:de fonds|des diasporas)\b/gi, /\br[ée]mittances?\b/gi],
];
console.log('\ntermes concurrents :');
for (const [nom, a, b] of couples) {
  const na = uniques.join(' ').match(a)?.length || 0;
  const nb = uniques.join(' ').match(b)?.length || 0;
  console.log('   ' + nom.padEnd(22) + String(na).padStart(4) + ' / ' + String(nb).padStart(4) +
    (na && nb ? '   ← les deux coexistent' : ''));
}

const typo = [
  ["apostrophe droite", /'/g],
  ['guillemets droits', /"/g],
  ['espace simple avant ; : ! ?', / [;:!?]/g],
  ['espace normale dans « »', /« | »/g],
  ['trois points au lieu du signe', /\.\.\./g],
];
console.log('\ntypographie francaise :');
for (const [nom, re] of typo) {
  let n = 0;
  for (const p of uniques) n += (p.match(re) || []).length;
  console.log('   ' + nom.padEnd(30) + String(n).padStart(5));
}

// --- LES AFFIRMATIONS QUI DEPASSENT LA DONNEE -------------------------------
//
// Le releve precedent cherche des tics de style. Celui-ci cherche autre chose,
// et qui coute plus cher sur un site scientifique : les formules qui affirment
// plus que la source ne permet.
//
// Deux d'entre elles etaient encore dans les bandeaux le 22 aout 2026, et le
// site se dementait lui-meme : « les routes que PERSONNE ne cartographie »,
// alors que la plateforme cite le Global Overview of Migration Routes de l'OIM
// en source de sa propre scene des flux ; « que PERSONNE ne compte comme
// migration », alors que l'IDMC et le HCR les comptent — ce sont les
// statistiques migratoires qui les excluent, par definition.
//
// CE QUE LA SONDE RELEVE.
//   ABSOLUS         personne, aucun, jamais, tous, toujours, nul. Un absolu est
//                   refutable par un seul contre-exemple : il faut donc qu'il
//                   soit vrai, pas seulement frappant.
//   SUPERLATIFS     le plus, le seul, le premier, unique, sans equivalent. Ils
//                   supposent un classement complet, qui doit exister.
//   INTENSIFICATEURS massivement, considerable, spectaculaire, crucial,
//                   fondamental, majeur. Ils remplacent une grandeur par une
//                   appreciation.
//
// La sonde ne dit pas qu'une occurrence est fautive : « le seul traite
// contraignant au monde » decrit la Convention de Kampala et se verifie. Elle
// dit ou aller regarder.
const SURCLAIM = [
  ['absolu',
   /\b(personne ne|aucun[e]?\s|jamais|nul(?:le)? part|tous les|toutes les|toujours)\b/gi],
  ['superlatif',
   /\b(le|la|les) (plus|seul[e]?s?|premier[es]?|unique)\b|\bsans (?:equivalent|équivalent|precedent|précédent)\b/gi],
  ['intensificateur',
   /\b(massivement|massive[s]?|considerable[s]?|considérable[s]?|spectaculaire[s]?|crucial(?:e|es|aux)?|fondamental(?:e|es|aux)?|majeur[e]?s?|colossal|enorme|énorme)\b/gi],
];

console.log('\n--- affirmations a verifier ---');
for (const [nom, re] of SURCLAIM) {
  const trouves = [];
  for (const ph of uniques) {
    for (const m of ph.matchAll(re)) {
      const i = Math.max(0, m.index - 40);
      trouves.push(ph.slice(i, m.index + m[0].length + 46).replace(/\s+/g, ' '));
    }
  }
  console.log('\n' + nom + ' : ' + trouves.length);
  for (const t of trouves.slice(0, 12)) console.log('   · …' + t + '…');
}
