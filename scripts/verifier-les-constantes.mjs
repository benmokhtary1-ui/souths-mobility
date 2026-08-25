// LA PROSE CONTRE LES CONSTANTES SOURCÉES
// ===========================================================================
// Certaines grandeurs du site existent DEUX FOIS : une fois comme constante
// datée et sourcée dans `src/data/mondeData.js`, une fois en toutes lettres
// dans la prose. Rien n'oblige les deux à s'accorder, et elles ont divergé —
// la part des migrants dans la population mondiale valait 3,7 % dans la
// constante, « ~3,5 % » dans une fiche et « 3 à 4 % » dans une autre, la
// deuxième affirmant en outre une stabilité que les données démentent.
//
// Le défaut ne se voit pas à la lecture : chaque énoncé est plausible isolé.
// Il ne se voit qu'en confrontant la phrase au chiffre qui devrait la fonder.
//
// COMMENT LE SCRIPT PROCÈDE. Pour chaque grandeur surveillée, on donne une
// SIGNATURE — ce à quoi ressemble une phrase qui parle de cette grandeur — et
// la liste des valeurs que cette phrase a le droit de porter. Toute phrase qui
// correspond à la signature et porte une autre valeur est signalée.
//
// CE QU'IL NE FAIT PAS. Il ne devine pas les grandeurs : la table est écrite à
// la main, et c'est voulu. Un détecteur générique produirait du bruit ; une
// table courte, tenue à jour quand on ajoute une constante, produit des
// signalements qu'on peut croire.
//
//   node scripts/verifier-les-constantes.mjs
import { readFileSync } from 'node:fs';
import { MONDE_2024, INTRA_AFRICAIN_UA, RESTE_DANS_SA_REGION } from '../src/data/mondeData.js';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/data/library.js',
                  'src/data/genericDesc.js', 'src/data/glossary.js',
                  'src/data/methodConventions.js'];

// Une valeur peut s'écrire à la française ou à l'anglaise, avec ou sans
// décimale nulle. On compare des nombres, pas des chaînes.
const nb = (s) => Number(String(s).replace(',', '.'));

const ssa = RESTE_DANS_SA_REGION.find(r => r.region === 'ssa').part;
const monde = RESTE_DANS_SA_REGION.find(r => r.region === 'monde').part;

// --- Les grandeurs surveillées --------------------------------------------
// `signature` : la phrase parle-t-elle de cette grandeur ?
// `permises`  : les valeurs qu'elle a le droit de porter (millésimes compris).
const GRANDEURS = [
  {
    nom: 'part des migrants dans la population mondiale',
    signature: /(part|proportion|share).{0,60}(population mondiale|world population)|(population mondiale|world.s population).{0,40}(vit|lives|réside|resides).{0,40}(autre|other)/i,
    permises: [MONDE_2024.partPopulation, MONDE_2024.partPopulation1990,
               100 - MONDE_2024.partPopulation],
    note: `${MONDE_2024.partPopulation} % en 2024, ${MONDE_2024.partPopulation1990} % en 1990, `
        + `${(100 - MONDE_2024.partPopulation).toFixed(1)} % de complément`,
  },
  {
    nom: 'part intra-africaine des partants',
    signature: /(intra-?africain|au sein du continent|within the continent|d.un pays africain à un autre|from one African country to another)/i,
    permises: [INTRA_AFRICAIN_UA.part, 100 - INTRA_AFRICAIN_UA.part,
               51.9, 53.0],                       // la série 2015 · 2020 · 2024
    note: `${INTRA_AFRICAIN_UA.part} % en ${INTRA_AFRICAIN_UA.annee}, `
        + `${(100 - INTRA_AFRICAIN_UA.part).toFixed(1)} % hors du continent, série 51,9 · 53,0 · ${INTRA_AFRICAIN_UA.part}`,
  },
  {
    nom: 'part qui reste dans sa région (Afrique subsaharienne / monde)',
    signature: /reste.{0,40}(dans sa région|région d.origine)|stays? within (its|their) region|remains? in (its|their) region/i,
    permises: RESTE_DANS_SA_REGION.map(r => r.part).concat([ssa, monde]),
    note: RESTE_DANS_SA_REGION.map(r => `${r.region} ${r.part}`).join(' · '),
  },
];

// --- Le relevé -------------------------------------------------------------
const dedire = (s) => s
  .replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

const phrases = [];
for (const f of FICHIERS) {
  let brut;
  try { brut = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  brut.split('\n').forEach((ligne, i) => {
    if (/^\s*(\/\/|\*|\{\/\*)/.test(ligne)) return;
    if (/color-mix|gradient|translate|calc\(/.test(ligne)) return;
    for (const m of ligne.matchAll(/["'`]((?:[^"'`\\]|\\.){24,})["'`]/g)) {
      const t = dedire(m[1]);
      if (!/\d/.test(t)) continue;
      // On decoupe en phrases : une signature vaut pour SA phrase, pas pour
      // tout un paragraphe qui parlerait d'autre chose deux lignes plus bas.
      for (const ph of t.split(/(?<=[.!?…])\s+/)) {
        if (ph.length > 12) phrases.push({ f: f.replace('src/', ''), i: i + 1, ph });
      }
    }
  });
}

// UNE PHRASE QUI COMPARE DES PÉRIMÈTRES N'EST PAS UNE PHRASE QUI SE TROMPE.
// La règle du site est qu'un pourcentage arrive avec le périmètre de sa
// source ; le site EXPLIQUE donc, à plusieurs endroits, pourquoi la part
// intra-africaine vaut 70 % hors Afrique méditerranéenne et 54,4 % sur les 54
// États. Ces phrases portent une valeur « étrangère » à dessein, et les
// signaler reviendrait à réclamer la suppression du travail de périmètre.
// On les reconnaît à ce qu'elles nomment l'autre périmètre, ou l'écart.
const COMPARE_UN_PERIMETRE = /hors (Afrique|the )|Afrique méditerranéenne|Mediterranean Africa|(ne )?(décrit|couvre|recouvre|correspond)[^.]{0,30}périmètre|perimeter|recalculée?|recomputed|sous-continental|Afrique subsaharienne|Sub-?Saharan|autre découpage|different (scope|perimeter)|à ne pas confondre|not to be confused/i;

let signalements = 0;
let ecartes = 0;
console.log('LA PROSE CONTRE LES CONSTANTES SOURCÉES');
console.log('='.repeat(74));

for (const g of GRANDEURS) {
  const permises = g.permises.map(nb);
  const fautives = [];
  let vues = 0;
  for (const { f, i, ph } of phrases) {
    if (!g.signature.test(ph)) continue;
    vues += 1;
    for (const m of ph.matchAll(/(\d+(?:[.,]\d+)?)\s*(?:%|pour cent|per cent)/g)) {
      const v = nb(m[1]);
      if (permises.some(x => Math.abs(x - v) < 0.05)) continue;
      if (COMPARE_UN_PERIMETRE.test(ph)) { ecartes += 1; continue; }
      fautives.push({ f, i, v, ph: ph.replace(/\s+/g, ' ').slice(0, 145) });
    }
  }
  console.log(`\n${g.nom}`);
  console.log(`   attendu   ${g.note}`);
  console.log(`   relu      ${vues} phrase${vues > 1 ? 's' : ''}`);
  if (!fautives.length) console.log('   ✓ aucune valeur étrangère');
  for (const x of fautives) {
    signalements += 1;
    console.log(`   ! ${String(x.v).padStart(5)} %  ${x.f}:${x.i}  ${x.ph}`);
  }
}

console.log(`\n${'='.repeat(74)}`);
if (ecartes) console.log(`${ecartes} valeur${ecartes > 1 ? 's' : ''} écartée${ecartes > 1 ? 's' : ''}`
  + ' : la phrase compare explicitement deux périmètres.');
console.log(signalements
  ? `${signalements} valeur${signalements > 1 ? 's' : ''} en désaccord avec la constante qui devrait la fonder.`
  : 'aucun désaccord entre la prose et les constantes sourcées.');
