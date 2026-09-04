// Calcule la part intra-africaine des mobilités, sur la matrice bilatérale.
//
// POURQUOI CE SCRIPT EXISTE. Le site avançait « environ sept départs sur dix »,
// puis « 64 % ». Les deux chiffres sont publiés, les deux sont justes — et
// aucun des deux ne décrit ce que la plateforme mesure. Le 64 % d'UN DESA porte
// sur l'AFRIQUE SUBSAHARIENNE seule, un ensemble de 51 pays dont l'Afrique du
// Nord est absente : la plateforme, elle, travaille sur les 54 États de l'Union
// africaine. Reprendre un pourcentage parce qu'il traîne dans une publication,
// sans vérifier sur quel périmètre il a été calculé, est exactement la faute
// que ce dépôt ne peut pas se permettre.
//
// On recalcule donc à la source, sur le tableau 1 du fichier bilatéral
// d'UN DESA — origine × destination, 2024, les deux sexes.
//
//   numérateur   : personnes nées dans un État de l'UA et résidant dans un
//                  AUTRE État de l'UA ;
//   dénominateur : personnes nées dans un État de l'UA et résidant hors de
//                  leur pays de naissance, toutes destinations confondues.
//
// Le dénominateur se lit sur la ligne « World » de chaque origine : c'est le
// total des personnes nées dans ce pays et vivant ailleurs. On évite ainsi
// d'avoir à distinguer, parmi 287 destinations, celles qui sont des pays de
// celles qui sont des agrégats — une erreur qui doublerait les comptes.
//
// LE SAHARA OCCIDENTAL. UN DESA lui attribue un code séparé (732). La
// plateforme rend le Maroc complet, Sahara intégré, et ne traite jamais le
// Sahara comme un État : le code 732 est donc versé au périmètre de l'UA, et
// le script dit combien il pèse pour que le choix reste visible.
//
//   node scripts/calculer-l-intra-africain.mjs <chemin du .xlsx>
//
// Le fichier source :
//   https://www.un.org/development/desa/pd/content/international-migrant-stock
//   « Destination and origin » — donnees-sources/undesa-2024-stock-par-origine-et-destination.xlsx
import { readFileSync } from 'node:fs';
import { countryData } from '../src/data/countries.js';

const fichier = process.argv[2];
if (!fichier) {
  console.error('usage: node scripts/calculer-l-intra-africain.mjs <fichier.xlsx>');
  process.exit(2);
}

// --- Lecture minimale d'un .xlsx -------------------------------------------
// Un classeur est un zip de XML. Plutôt que d'ajouter une dépendance pour lire
// trois colonnes, on décompresse à la main : les seules pièces nécessaires sont
// la table des chaînes partagées et la feuille du tableau 1.
const zip = readFileSync(fichier);

const finDuCentral = (() => {
  for (let i = zip.length - 22; i >= 0; i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) return i;
  }
  throw new Error('archive illisible : fin de répertoire introuvable');
})();

const entrees = new Map();
{
  let p = zip.readUInt32LE(finDuCentral + 16);
  const n = zip.readUInt16LE(finDuCentral + 10);
  for (let k = 0; k < n; k++) {
    const nl = zip.readUInt16LE(p + 28);
    const el = zip.readUInt16LE(p + 30);
    const cl = zip.readUInt16LE(p + 32);
    const nom = zip.toString('utf8', p + 46, p + 46 + nl);
    entrees.set(nom, {
      methode: zip.readUInt16LE(p + 10),
      taille: zip.readUInt32LE(p + 20),
      brute: zip.readUInt32LE(p + 24),
      offset: zip.readUInt32LE(p + 42),
    });
    p += 46 + nl + el + cl;
  }
}

const { inflateRawSync } = await import('node:zlib');
const lire = (nom) => {
  const e = entrees.get(nom);
  if (!e) throw new Error('pièce absente de l’archive : ' + nom);
  const nl = zip.readUInt16LE(e.offset + 26);
  const el = zip.readUInt16LE(e.offset + 28);
  const debut = e.offset + 30 + nl + el;
  const brut = zip.subarray(debut, debut + e.taille);
  return e.methode === 0 ? brut.toString('utf8') : inflateRawSync(brut).toString('utf8');
};

// --- Les chaînes partagées --------------------------------------------------
const chaines = [];
{
  const xml = lire('xl/sharedStrings.xml');
  for (const si of xml.split('<si>').slice(1)) {
    let t = '';
    for (const m of si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) t += m[1];
    chaines.push(t.replace(/&amp;/g, '&').replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"));
  }
}

// --- Quelle feuille porte le tableau 1 -------------------------------------
const nomDeFeuille = (() => {
  const wb = lire('xl/workbook.xml');
  const rels = lire('xl/_rels/workbook.xml.rels');
  const m = [...wb.matchAll(/<sheet[^>]*name="([^"]*)"[^>]*r:id="([^"]*)"/g)]
    .find(x => x[1].trim().toLowerCase() === 'table 1');
  if (!m) throw new Error('feuille « Table 1 » introuvable');
  const r = new RegExp('Id="' + m[2] + '"[^>]*Target="([^"]*)"').exec(rels);
  return 'xl/' + r[1].replace(/^\/?xl\//, '');
})();

// --- Les colonnes utiles ----------------------------------------------------
// E : code de la destination · G : code de l'origine · O : l'année 2024,
// les deux sexes (le premier des trois blocs de huit millésimes).
// H..O portent les huit millésimes des deux sexes : 1990, 1995, 2000, 2005,
// 2010, 2015, 2020, 2024. On les lit tous pour pouvoir vérifier les
// évolutions que le site annonce, et pas seulement le dernier état.
const COL = { dest: 'E', orig: 'G', valeur: 'O' };
const MILLESIMES = { 2015: 'M', 2020: 'N', 2024: 'O' };

const lignes = [];
{
  const xml = lire(nomDeFeuille);
  for (const m of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const num = +m[1];
    if (num < 12) continue;                       // en-têtes
    const cases = {};
    // Deux formes de cellule cohabitent, et les confondre coute cher : une
    // cellule vide s'ecrit `<c r="C13" s="122"/>`, sans fermeture. Un motif qui
    // attend `</c>` avale alors tout jusqu'a la fermeture de la cellule
    // SUIVANTE, et perd la vraie valeur au passage — c'est ce qui faisait
    // disparaitre la colonne E sur les lignes « World », donc le denominateur
    // entier. On reconnait donc les deux formes explicitement.
    for (const c of m[2].matchAll(/<c\b([^>]*?)\/>|<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = c[1] !== undefined ? c[1] : c[2];
      const corps = c[3];
      if (corps === undefined) continue;            // cellule vide
      const r = /r="([A-Z]+)\d+"/.exec(attrs);
      if (!r) continue;
      const col = r[1];
      if (col !== COL.dest && col !== COL.orig
          && !Object.values(MILLESIMES).includes(col)) continue;
      const type = /t="([^"]*)"/.exec(attrs);
      const v = /<v>([\s\S]*?)<\/v>/.exec(corps);
      if (!v) continue;
      cases[col] = (type && type[1] === 's') ? chaines[+v[1]] : v[1];
    }
    if (cases[COL.dest] === undefined || cases[COL.orig] === undefined) continue;
    lignes.push(cases);
  }
}

// --- Le périmètre -----------------------------------------------------------
const UA = new Set(Object.values(countryData).flat().map(c => String(c.id)));
const SAHARA = '732';
UA.add(SAHARA);   // rendu avec le Maroc, jamais comme un État

const nombre = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

// --- Le contrôle -----------------------------------------------------------
// Une méthode qui donne un résultat inattendu doit d'abord prouver qu'elle sait
// retrouver un résultat connu. UN DESA publie 64 % d'intrarégional pour
// l'Afrique subsaharienne : on le recalcule sur ses propres lignes d'agrégat
// (origine 1834, destination 1834 contre destination 900). Si le contrôle ne
// tombe pas sur 64, le reste du calcul ne vaut rien.
const AGREGAT = { ssa: '1834', monde: '900' };
let ssaTotal = 0, ssaInterne = 0;
for (const l of lignes) {
  if (String(l[COL.orig]).trim() !== AGREGAT.ssa) continue;
  const d = String(l[COL.dest]).trim();
  if (d === AGREGAT.monde) ssaTotal = nombre(l[COL.valeur]);
  else if (d === AGREGAT.ssa) ssaInterne = nombre(l[COL.valeur]);
}

let depuisUA = 0;       // dénominateur : tous les partants nés dans l'UA
let versUA = 0;         // numérateur : ceux qui résident dans un autre État de l'UA
let poidsSahara = 0;
const parOrigine = new Map();

for (const l of lignes) {
  const d = String(l[COL.dest]).trim();
  const o = String(l[COL.orig]).trim();
  const v = nombre(l[COL.valeur]);
  if (!UA.has(o)) continue;
  if (d === '900') {                     // ligne « World » : le total des partants
    depuisUA += v;
    parOrigine.set(o, v);
    if (o === SAHARA) poidsSahara += v;
    continue;
  }
  if (UA.has(d) && d !== o) versUA += v;
}

const pct = (a, b) => (b ? (a / b) * 100 : NaN);

// La même mesure aux trois derniers millésimes : c'est ce qui permet de
// vérifier les évolutions annoncées ailleurs sur le site.
const serie = {};
for (const [an, col] of Object.entries(MILLESIMES)) {
  let total = 0, interne = 0;
  for (const l of lignes) {
    const o = String(l[COL.orig]).trim();
    if (!UA.has(o)) continue;
    const d = String(l[COL.dest]).trim();
    const v = nombre(l[col]);
    if (d === '900') total += v;
    else if (UA.has(d) && d !== o) interne += v;
  }
  serie[an] = { total, interne, part: pct(interne, total) };
}

console.log('MATRICE BILATÉRALE UN DESA, 2024 — les deux sexes\n');
console.log('périmètre : les 54 États de l’Union africaine tels que la plateforme les compte,');
console.log('            Sahara occidental (code 732) versé au Maroc.\n');
console.log('nés dans un État de l’UA et vivant hors de leur pays  :',
            depuisUA.toLocaleString('fr-FR').padStart(14));
console.log('… dont dans un AUTRE État de l’UA                     :',
            versUA.toLocaleString('fr-FR').padStart(14));
console.log('… dont hors du continent                              :',
            (depuisUA - versUA).toLocaleString('fr-FR').padStart(14));
console.log('\nPART INTRA-AFRICAINE :', pct(versUA, depuisUA).toFixed(1).replace('.', ',') + ' %');
console.log('part hors du continent :', pct(depuisUA - versUA, depuisUA).toFixed(1).replace('.', ',') + ' %');
console.log('\npoids du code 732 dans le dénominateur :', poidsSahara.toLocaleString('fr-FR'),
            '(' + pct(poidsSahara, depuisUA).toFixed(2).replace('.', ',') + ' %)');
console.log('origines trouvées dans la matrice :', parOrigine.size, 'sur', UA.size, 'attendues');

console.log('\n--- la série, pour vérifier les évolutions annoncées ---');
for (const [an, x] of Object.entries(serie)) {
  console.log(an + ' :', String(Math.round(x.interne)).padStart(11),
              'intra sur', String(Math.round(x.total)).padStart(11), 'partants  —',
              x.part.toFixed(1).replace('.', ',') + ' %');
}
{
  const a = serie[2020], b = serie[2024], c = serie[2015];
  console.log('intra-africain 2020 → 2024 :', '+' + pct(b.interne - a.interne, a.interne).toFixed(1).replace('.', ',') + ' %');
  console.log('intra-africain 2015 → 2024 :', '+' + pct(b.interne - c.interne, c.interne).toFixed(1).replace('.', ',') + ' %');
}

console.log('\n--- contrôle de la méthode ---');
console.log('Afrique subsaharienne, agrégat d’UN DESA :',
            (ssaInterne / ssaTotal * 100).toFixed(1).replace('.', ',') + ' %',
            '(la publication annonce 64 %)');
console.log('écart au chiffre publié :',
            Math.abs(ssaInterne / ssaTotal * 100 - 64).toFixed(2).replace('.', ',') + ' point(s)');
const manquantes = [...UA].filter(c => !parOrigine.has(c));
if (manquantes.length) console.log('absentes :', manquantes.join(', '));
