// LE FOND DE CARTE, VÉRIFIÉ SUR SES TRACÉS
// ===========================================================================
// Trois choses ne se négocient pas, et une quatrième s'est ajoutée le
// 5 septembre 2026 :
//
//   — CINQUANTE-QUATRE États, ceux de l'Union africaine ;
//   — le MAROC d'un seul tenant, le Sahara intégré, jamais un État à part ;
//   — les repères tombent dans le pays qui les porte ;
//   — la projection est Eckert IV, et la page de méthode le dit.
//
// La troisième épreuve est la seule qui puisse détecter un décalage entre le
// fond et ce qu'on pose dessus : une carte reprojetée dont les points seraient
// restés en place n'a pas l'air fausse, elle a l'air d'une carte.
//
//   node scripts/verifier-le-fond-de-carte.mjs
import { readFileSync } from 'node:fs';

const fond = readFileSync('src/africaMapPaths.js', 'utf8');
const app = readFileSync('src/App.jsx', 'utf8');

const paths = {};
for (const m of fond.matchAll(/"(\d+)":"([^"]+)"/g)) paths[m[1]] = m[2];
const points = {};
for (const m of fond.matchAll(/^ {2}(\w+): \[(-?[\d.]+), (-?[\d.]+)\],$/gm)) points[m[1]] = [+m[2], +m[3]];

const anneaux = (d) => d.split('Z').filter((x) => x.trim()).map((a) => {
  const n = a.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const r = [];
  for (let i = 0; i + 1 < n.length; i += 2) r.push([n[i], n[i + 1]]);
  return r;
});
const dansAnneau = ([px, py], r) => {
  let dedans = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
};
const dansPays = (p, id) => anneaux(paths[id]).some((r) => dansAnneau(p, r));
// Une ville côtière peut tomber d'un cheveu en mer, la côte étant simplifiée.
const auBord = (p, id) => anneaux(paths[id]).some((r) => r.some(([x, y]) => Math.hypot(x - p[0], y - p[1]) < 2.5));

// Moyale est à cheval sur la frontière : les deux côtés sont justes.
const ATTENDU = {
  rabat: ['504'], tunis: ['788'], tripoli: ['434'], caire: ['818'], nouakchott: ['478'],
  dakar: ['686'], bamako: ['466'], ouaga: ['854'], niamey: ['562'], abidjan: ['384'],
  accra: ['288'], lagos: ['566'], ndjamena: ['148'], khartoum: ['729'], juba: ['728'],
  addis: ['231'], djibouti: ['262'], mogadiscio: ['706'], nairobi: ['404'], kampala: ['800'],
  kinshasa: ['180'], luanda: ['24'], lusaka: ['894'], dar: ['834'], harare: ['716'],
  maputo: ['508'], lecap: ['710'], tana: ['450'],
  nouadhibou: ['478'], dakhla: ['504'], conakry: ['324'], obock: ['262'], bosasso: ['706'],
  moyale: ['231', '404'], beitbridge: ['716', '710'],
};

const EPREUVES = [
  ['cinquante-quatre États, et eux seuls',
   () => Object.keys(paths).length === 54],

  ['le Sahara n’est pas un État de la carte',
   () => !Object.keys(paths).includes('732')],

  ['le Maroc est d’un seul tenant, sans arc intérieur',
   () => {
     // Un seul contour : l'union topologique a supprimé la frontière que les
     // deux entités du jeu source partageaient, au lieu de la masquer.
     const n = (paths['504'].match(/M/g) || []).length;
     // Et il descend bien jusqu'au sud du Sahara — vers 21° de latitude, soit
     // le bas de la planche marocaine.
     const ys = paths['504'].match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, i) => i % 2);
     return n === 1 && Math.max(...ys) > 240;
   }],

  ['la projection est Eckert IV',
   () => fond.includes('Projection Eckert IV') && !fond.includes('Projection Mercator')],

  ['la page de méthode annonce la projection qu’elle emploie',
   () => app.includes('projetés en Eckert IV, méridien central 16° E')
      && app.includes('projected in Eckert IV, central meridian 16° E')
      && !app.includes('en projection Mercator,')
      && !app.includes('in Mercator projection,')],

  ['les repères tombent dans le pays qui les porte',
   () => Object.entries(ATTENDU).every(([nom, ids]) => {
     const p = points[nom];
     return p && ids.some((id) => dansPays(p, id) || auBord(p, id));
   })],

  ['aucun pixel de carte n’est plus écrit à la main dans l’application',
   () => app.includes('const LIEUX = AFRICA_POINTS;')
      && app.includes('const PETITS_ETATS = AFRICA_PETITS_ETATS;')
      && app.includes('const CADRES_REGIONS = AFRICA_CADRES_REGIONS;')
      && app.includes("crop: AFRICA_CADRES_PLANCHES['Pl. I']")],
];

console.log('LE FOND DE CARTE, VÉRIFIÉ SUR SES TRACÉS');
console.log('='.repeat(74));
let tenues = 0;
const perdues = [];
for (const [libelle, test] of EPREUVES) {
  let ok = false;
  try { ok = !!test(); } catch { ok = false; }
  if (ok) tenues += 1; else perdues.push(libelle);
  console.log(`  ${ok ? '·' : '✗'}  ${libelle}`);
}
console.log('='.repeat(74));
console.log(`${tenues} sur ${EPREUVES.length} tenues.`);
if (perdues.length) {
  console.log(`\nNON TENUES :\n  ${perdues.join('\n  ')}`);
  process.exitCode = 1;
}
