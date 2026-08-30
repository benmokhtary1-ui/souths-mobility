// LA BIBLIOTHÈQUE EST-ELLE COMPLÈTE, ET SES FICHES SE VALENT-ELLES ?
// ===========================================================================
// Une bibliographie de recherche se juge sur trois choses : ce qu'elle contient,
// ce qui devrait y être et n'y est pas, et l'égalité de traitement entre ses
// entrées. Ce relevé les prend dans cet ordre.
//
// CE QU'ELLE CONTIENT. La répartition par type, par décennie et par catégorie.
// Un déséquilibre n'est pas une faute — un site sur la gouvernance cite plus de
// rapports que d'articles — mais il doit être vu.
//
// CE QUI MANQUE. On ne peut pas deviner un manque dans l'absolu ; on peut, en
// revanche, vérifier que TOUTE SOURCE CITÉE AILLEURS SUR LE SITE se retrouve
// ici. Une référence qui fonde un chiffre dans une section et n'apparaît pas
// dans la bibliothèque est un trou réel, et celui-là se détecte.
//
// L'ÉGALITÉ DE TRAITEMENT. Une fiche sans année, sans lien, sans description,
// ou avec une description de deux lignes quand les autres en ont six, se
// remarque à la lecture. On les liste.
import { readFileSync } from 'node:fs';
import { libraryData } from '../src/data/library.js';

// La bibliotheque est un tableau de SECTIONS, chacune portant ses .
// Aplatir sans passer par la est ce qui rendait quatre entrees au lieu de
// soixante-huit — et le releve entier etait faux sans le dire.
const fiches = libraryData.flatMap(s => s.items || []);
const sections = libraryData.map(s => [s.section?.fr || s.section, (s.items || []).length]);
const app = readFileSync('src/App.jsx', 'utf8');
const narr = readFileSync('src/narrativesData.js', 'utf8');

console.log('LA BIBLIOTHÈQUE');
console.log('='.repeat(74));
console.log(`${fiches.length} entrées\n`);

// --- 1. ce qu'elle contient ------------------------------------------------
const compter = (f) => {
  const o = {};
  for (const x of fiches) { const k = f(x) ?? '(non renseigné)'; o[k] = (o[k] || 0) + 1; }
  return Object.entries(o).sort((a, b) => b[1] - a[1]);
};
const dire = (titre, paires) => {
  console.log(titre);
  for (const [k, n] of paires) console.log(`  ${String(n).padStart(3)}  ${k}`);
  console.log();
};
dire('par type', compter(x => (typeof x.type === 'object' ? x.type.fr : x.type)));
dire('par décennie', compter(x => (x.year ? `${Math.floor(x.year / 10) * 10}s` : null)));
dire('par rubrique', sections.map(([k, n]) => [k, n]).sort((a, b) => b[1] - a[1]));

// --- 2. l'egalite de traitement -------------------------------------------
const manques = [];
for (const x of fiches) {
  const q = [];
  if (!x.year) q.push('année');
  // Un ouvrage papier n a pas d adresse : ne pas le compter comme incomplet.
  const estOuvrage = /Ouvrage|Thèse|Chapitre/.test(typeof x.type === 'object' ? x.type.fr : x.type || '');
  if (!x.url && !estOuvrage) q.push('lien');
  const d = typeof x.desc === 'object' ? x.desc?.fr : x.desc;
  if (!d) q.push('description');
  else if (d.length < 60) q.push(`description courte (${d.length} signes)`);
  if (q.length) manques.push(`  ${(x.title || '(sans titre)').slice(0, 62)}\n      ${q.join(' · ')}`);
}
console.log(`FICHES INCOMPLÈTES  (${manques.length} sur ${fiches.length})`);
console.log('-'.repeat(74));
console.log(manques.length ? manques.join('\n') : '  aucune : chaque fiche porte son année, son lien et sa description.');

// --- 3. les sources citees ailleurs et absentes ici ------------------------
// Les organismes que le site invoque pour fonder ses chiffres. Si l'un d'eux
// ne parait nulle part dans la bibliotheque, le lecteur qui veut remonter a la
// source n'a pas d'entree ou aller.
// Les organismes que le site invoque, avec leurs variantes de nom : une
// bibliographie en anglais reference « World Bank » la ou le site francais dit
// « Banque mondiale ». Comparer les deux sans apparier les noms produisait
// quatre absences imaginaires.
const ORGANISMES = [
  ['UN DESA', 'UN DESA'], ['HCR / UNHCR', 'UNHCR', 'HCR'],
  ['IDMC', 'IDMC'], ['OIT / ILO', 'ILO', 'OIT', 'NORMLEX'],
  ['Afrobarometer', 'Afrobarometer'],
  ['Banque mondiale / World Bank', 'World Bank', 'Banque mondiale', 'KNOMAD'],
  ['OIM / IOM', 'IOM', 'OIM'],
  ['Union africaine', 'African Union', 'Union africaine', 'AUC'],
  ['BAD / AfDB', 'AfDB', 'BAD'], ['UNESCO', 'UNESCO'],
  ['CEA / UNECA', 'UNECA', 'CEA'], ['Mo Ibrahim', 'Mo Ibrahim'],
  ['UNSD', 'UNSD', 'unstats'],
];
const corpusBiblio = JSON.stringify(fiches);
const corpusSite = app + narr;
const absents = ORGANISMES
  .filter(([nom, ...alias]) => alias.some(a => corpusSite.includes(a)) && !alias.some(a => corpusBiblio.includes(a)))
  .map(([nom]) => nom);
console.log(`\n\nORGANISMES CITÉS SUR LE SITE, ABSENTS DE LA BIBLIOTHÈQUE  (${absents.length})`);
console.log('-'.repeat(74));
console.log(absents.length ? '  ' + absents.join('\n  ') : '  aucun : chaque source invoquée a son entrée.');

// --- 4. la fraicheur -------------------------------------------------------
const annees = fiches.map(x => x.year).filter(Boolean).sort((a, b) => b - a);
const recentes = annees.filter(a => a >= 2023).length;
console.log(`\n\nFRAÎCHEUR`);
console.log('-'.repeat(74));
console.log(`  la plus récente : ${annees[0]} · la plus ancienne : ${annees[annees.length - 1]}`);
console.log(`  ${recentes} entrées de 2023 ou après, soit ${Math.round((recentes / annees.length) * 100)} %`);

console.log(`\n${'='.repeat(74)}`);
console.log(`${manques.length} fiche(s) à compléter · ${absents.length} organisme(s) sans entrée.`);
