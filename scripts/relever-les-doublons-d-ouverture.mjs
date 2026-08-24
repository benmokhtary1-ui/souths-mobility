// Mesure ce qu'un lecteur traverse avant d'atteindre la première donnée.
//
// Le site ouvre chaque section par un titre, puis un descriptif, puis un bloc
// « En clair ». Les trois disent souvent la même chose : sur Données, quatre-
// vingts mots et sept cent soixante-treize pixels pour énoncer ce que le titre
// pose en dix. C'est le reproche exact — « ça se répète, légèrement différent,
// et ça éloigne du but ».
//
// Le relevé compare le DESCRIPTIF et la ligne EN CLAIR de chaque section :
// combien de mots chacun pèse, et quelle part de leur vocabulaire est commune.
// Un recouvrement élevé sur des textes de longueur voisine, c'est une
// paraphrase — donc un des deux à supprimer.
//
//   node scripts/relever-les-doublons-d-ouverture.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');

// Le premier bloc `headers:` est le français, le second l'anglais.
const debut = src.indexOf('      headers: {');
const bloc = src.slice(debut, debut + 9000);

const chaine = (corps, champ) => {
  const m = corps.match(new RegExp(champ + ':\\s*"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1] : '';
};

// Les mots pleins, sans accents ni articles : deux textes qui partagent leur
// vocabulaire plein disent la même chose, quel que soit leur tour de phrase.
const motsPleins = (t) => new Set(
  (t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .match(/[a-z]{5,}/g) || [])
    .filter((m) => !['cette', 'section', 'plateforme', 'chaque'].includes(m)),
);

const sections = [...bloc.matchAll(/\n {8}(\w+): \{\n/g)].map((m) => m[1]);
const lignes = [];

for (const nom of sections) {
  const m = bloc.match(new RegExp('\\n {8}' + nom + ': \\{\\n([\\s\\S]*?)\\n {8}\\},'));
  if (!m) continue;
  const desc = chaine(m[1], 'desc');
  const plain = chaine(m[1], 'plain');
  if (!desc || !plain) continue;
  const A = motsPleins(desc);
  const B = motsPleins(plain);
  const commun = [...A].filter((x) => B.has(x));
  const part = A.size && B.size ? Math.round((100 * commun.length) / Math.min(A.size, B.size)) : 0;
  lignes.push({
    nom,
    descMots: desc.split(/\s+/).length,
    plainMots: plain.split(/\s+/).length,
    part,
    communs: commun.slice(0, 6).join(' '),
  });
}

lignes.sort((a, b) => b.part - a.part);
console.log('section'.padEnd(14) + 'desc'.padStart(6) + 'plain'.padStart(7) +
            'vocabulaire commun'.padStart(21) + '   mots partagés');
console.log('-'.repeat(78));
for (const l of lignes) {
  console.log(l.nom.padEnd(14) +
    String(l.descMots).padStart(6) + String(l.plainMots).padStart(7) +
    String(l.part + ' %').padStart(21) + '   ' + l.communs);
}
const moyenne = Math.round(lignes.reduce((n, l) => n + l.part, 0) / lignes.length);
console.log('\nrecouvrement moyen :', moyenne + ' %');
console.log('mots d’ouverture, toutes sections :',
            lignes.reduce((n, l) => n + l.descMots + l.plainMots, 0));
