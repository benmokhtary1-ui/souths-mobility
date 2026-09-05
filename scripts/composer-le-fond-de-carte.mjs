// LE FOND DE CARTE DU CONTINENT
// ===========================================================================
// `src/africaMapPaths.js` portait la mention « généré automatiquement » sans
// que le générateur soit dans le dépôt : les tracés existaient, la manière de
// les refaire, non. Ce script est ce générateur.
//
// Ce qu'il garantit, et qui ne se négocie pas :
//
//   — CINQUANTE-QUATRE États, ceux de l'Union africaine, ni plus ni moins ;
//   — le MAROC d'un seul tenant, le Sahara intégré : les deux entités du jeu
//     source sont fusionnées par union topologique, ce qui supprime l'arc
//     intérieur au lieu de le masquer. Aucune ligne ne subsiste à l'intérieur
//     du pays, et le Sahara n'apparaît jamais comme un État.
//
// La projection est un paramètre, et c'est le seul. Le fond était en Mercator,
// qui gonfle les latitudes hautes : sur une carte de l'Afrique, cela donne au
// Maghreb plus de place que sa superficie ne lui en vaut. Il est en Eckert IV
// depuis le 5 septembre 2026 — équivalente, les aires y sont conservées.
//
// Le prix de ce choix est mesuré plus bas, là où les projections sont définies :
// Eckert IV est faite pour des planisphères, et sur l'équateur elle étire le
// nord-sud d'un quart. Albers, équivalente elle aussi mais calée sur l'Afrique,
// tient les aires ET la forme ; elle est à une option de distance.
//
//   node scripts/composer-le-fond-de-carte.mjs            (Eckert IV, en place)
//   node scripts/composer-le-fond-de-carte.mjs --albers   (équivalente ET fidèle)
//   node scripts/composer-le-fond-de-carte.mjs --mercator (l'ancienne, pour comparer)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { geoPath } from 'd3-geo';
import { geoMercator, geoAlbers } from 'd3-geo';
import { geoEckert4 } from 'd3-geo-projection';
import { feature, merge } from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/countries-50m.json');
const geometries = topo.objects.countries.geometries;

// Les cinquante-quatre États de l'Union africaine, par code ISO 3166-1
// numérique. Le Sahara occidental (732) n'y figure pas : il est fusionné dans
// le Maroc, plus bas.
const UA = [
  '012', '024', '072', '108', '120', '132', '140', '148', '174', '178', '180',
  '204', '226', '231', '232', '262', '266', '270', '288', '324', '384', '404',
  '426', '430', '434', '450', '454', '466', '478', '480', '504', '508', '516',
  '562', '566', '624', '646', '678', '686', '690', '694', '706', '710', '716',
  '728', '729', '748', '768', '788', '800', '818', '834', '854', '894',
];

const MAROC = '504';
const SAHARA = '732';

const parId = new Map(geometries.map((g) => [String(g.id), g]));
const manquants = UA.filter((id) => !parId.has(id));
if (manquants.length) throw new Error('codes absents du jeu source : ' + manquants.join(', '));
if (!parId.has(SAHARA)) throw new Error('le Sahara occidental est absent du jeu source');
if (UA.length !== 54) throw new Error(`${UA.length} États au lieu de 54`);

// LE MAROC, D'UN SEUL TENANT.
// `merge` travaille sur les arcs de la topologie : la frontière que les deux
// entités partagent n'appartient plus qu'à une seule d'entre elles et
// disparaît. Un simple assemblage des deux polygones l'aurait laissée visible.
const marocEntier = merge(topo, [parId.get(MAROC), parId.get(SAHARA)]);

const traits = UA.map((id) => ({
  id,
  nom: parId.get(id).properties.name,
  geometry: id === MAROC ? marocEntier : feature(topo, parId.get(id)).geometry,
}));

const collection = { type: 'FeatureCollection', features: traits.map((t) => ({ type: 'Feature', geometry: t.geometry })) };

// LE CADRE. La largeur utile est celle qu'avait le fond précédent — 1006
// unités — pour que rien, dans le reste du site, n'ait à changer d'échelle.
// La hauteur suit la projection. La marge de huit unités ouvre le cadre
// au-delà des tracés : les marqueurs d'îles sont des disques centrés, et un
// disque posé sur le bord y perdrait son rayon.
const LARGEUR = 1006;
const MARGE = 8;

// LE MÉRIDIEN CENTRAL. Eckert IV est pseudocylindrique : un seul méridien est
// droit, et les autres se courbent d'autant plus qu'ils s'en éloignent. Laissé
// à Greenwich, il aurait couché toute la façade orientale, qui va jusqu'à
// 58° E. On le pose à 16° E, la médiane de l'étendue cartographiée
// (-25,34° à 57,79°), ce qui répartit la courbure entre les deux façades.
const MERIDIEN = 16;

// TROIS PROJECTIONS, ET CE QUI LES SEPARE.
//
// Eckert IV est equivalente : elle conserve les aires, ce que Mercator ne fait
// pas. Elle est faite pour des planisphères, et sur l'equateur elle etire le
// nord-sud : mesuree sur la masse continentale africaine, elle rend 1345 de
// haut pour 1000 de large, quand le terrain donne 1070 pour 1000. C'est un
// quart de trop.
//
// Albers, equivalente elle aussi mais conique et calee sur deux paralleles
// choisis pour l'Afrique (-18 et 24), donne 1077 pour 1000 : les aires ET la
// forme. C'est le choix classique d'une carte continentale, et il est ici a
// une option de distance.
const PROJECTIONS = {
  eckert4: () => geoEckert4().rotate([-MERIDIEN, 0]),
  mercator: () => geoMercator(),
  albers: () => geoAlbers().rotate([-MERIDIEN, 0]).center([0, 1]).parallels([-18, 24]),
};
const choix = process.argv.includes('--mercator') ? 'mercator'
            : process.argv.includes('--albers') ? 'albers'
            : 'eckert4';
const NOMS_PROJECTION = { eckert4: 'Eckert IV', mercator: 'Mercator', albers: 'Albers' };
const mercator = choix === 'mercator';
const projection = PROJECTIONS[choix]();

// On cale d'abord sur la largeur, puis on lit la hauteur obtenue.
projection.fitWidth(LARGEUR, collection);
const chemin = geoPath(projection);
const [[x0, y0], [x1, y1]] = chemin.bounds(collection);
// Le calage laisse l'origine où elle tombe ; on la ramène à zéro.
const t = projection.translate();
projection.translate([t[0] - x0, t[1] - y0]);

const cheminCale = geoPath(projection).digits(2);
const [[bx0, by0], [bx1, by1]] = geoPath(projection).bounds(collection);
const HAUTEUR = Math.ceil(by1 - by0);

// LA SIMPLIFICATION.
// Le jeu à 50 m porte plus de détail que la page n'en montre : le continent
// n'est jamais dessiné plus large que mille unités, et deux sommets distants
// d'un tiers d'unité s'y confondent. Douglas-Peucker retire les sommets qui
// s'écartent de moins de TOLERANCE de la corde qui les encadre — la forme est
// conservée là où elle porte de l'information, et allégée là où elle n'en
// porte pas. Le fond précédent était simplifié de la même façon.
//
// Chaque anneau est traité à part, et jamais réduit sous quatre sommets : une
// île de trois points est déjà son propre minimum.
const TOLERANCE = 0.35;

const peucker = (pts, tol) => {
  if (pts.length < 3) return pts;
  const garde = new Uint8Array(pts.length);
  garde[0] = garde[pts.length - 1] = 1;
  const pile = [[0, pts.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    if (b - a < 2) continue;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const norme = Math.hypot(dx, dy);
    let pire = -1, iPire = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const d = norme < 1e-12
        ? Math.hypot(px - ax, py - ay)
        : Math.abs(dy * px - dx * py + bx * ay - by * ax) / norme;
      if (d > pire) { pire = d; iPire = i; }
    }
    if (pire > tol) { garde[iPire] = 1; pile.push([a, iPire], [iPire, b]); }
  }
  return pts.filter((_, i) => garde[i]);
};

// Un anneau fermé : on ouvre sur son sommet le plus éloigné du centre, pour
// que les deux extrémités que Douglas-Peucker préserve soient un point saillant
// plutôt qu'un point quelconque du contour.
const simplifierAnneau = (anneau, tol) => {
  if (anneau.length <= 4) return anneau;
  const cx = anneau.reduce((s, p) => s + p[0], 0) / anneau.length;
  const cy = anneau.reduce((s, p) => s + p[1], 0) / anneau.length;
  let loin = 0, dLoin = -1;
  anneau.forEach((p, i) => {
    const d = Math.hypot(p[0] - cx, p[1] - cy);
    if (d > dLoin) { dLoin = d; loin = i; }
  });
  const tourne = anneau.slice(loin).concat(anneau.slice(0, loin));
  const ouvert = tourne.concat([tourne[0]]);
  const reduit = peucker(ouvert, tol);
  return reduit.length >= 5 ? reduit.slice(0, -1) : anneau;
};

const simplifierTrace = (d, tol) => d
  .split('Z')
  .filter((s) => s.trim())
  .map((sous) => {
    const n = sous.match(/-?\d+(?:\.\d+)?/g).map(Number);
    const anneau = [];
    for (let i = 0; i + 1 < n.length; i += 2) anneau.push([n[i], n[i + 1]]);
    const r = simplifierAnneau(anneau, tol);
    return 'M' + r.map(([x, y]) => `${x},${y}`).join('L') + 'Z';
  })
  .join('');

const paths = {};
let sommets = 0;
for (const trait of traits) {
  const brut = cheminCale({ type: 'Feature', geometry: trait.geometry });
  if (!brut) throw new Error(`tracé vide pour ${trait.nom} (${trait.id})`);
  const d = simplifierTrace(brut, TOLERANCE);
  sommets += (d.match(/,/g) || []).length;
  // Les clés du site sont écrites sans leur zéro de tête.
  paths[String(Number(trait.id))] = d;
}

const viewBox = `${-MARGE} ${-MARGE} ${LARGEUR + 2 * MARGE} ${HAUTEUR + 2 * MARGE}`;

// ---------------------------------------------------------------------------
// LES REPÈRES ET LES CADRAGES, PROJETÉS AVEC LE FOND
//
// Le site portait ces valeurs en pixels de la carte, écrites à la main. Elles
// ne pouvaient donc pas suivre un changement de projection — et, mesurées,
// elles s'écartaient déjà de leur lieu réel de quarante-quatre unités en
// moyenne, jusqu'à cent neuf pour Le Cap. Elles se calculent désormais, comme
// le fond, à partir de coordonnées géographiques.

// Villes et points de passage, en longitude/latitude.
const REPERES = {
  // Les capitales que les planches et les corridors relient.
  rabat: [-6.8416, 34.0209], tunis: [10.1815, 36.8065], tripoli: [13.1913, 32.8872],
  caire: [31.2357, 30.0444], nouakchott: [-15.9785, 18.0735], dakar: [-17.4677, 14.7167],
  bamako: [-8.0029, 12.6392], ouaga: [-1.5197, 12.3714], niamey: [2.1254, 13.5116],
  abidjan: [-4.0083, 5.3600], accra: [-0.1870, 5.6037], lagos: [3.3792, 6.5244],
  ndjamena: [15.0557, 12.1348], khartoum: [32.5599, 15.5007], juba: [31.5825, 4.8594],
  addis: [38.7578, 9.0192], djibouti: [43.1456, 11.5721], mogadiscio: [45.3182, 2.0469],
  nairobi: [36.8219, -1.2921], kampala: [32.5825, 0.3476], kinshasa: [15.2663, -4.4419],
  luanda: [13.2344, -8.8383], lusaka: [28.3228, -15.3875], dar: [39.2083, -6.7924],
  harare: [31.0534, -17.8252], maputo: [32.5732, -25.9692], lecap: [18.4241, -33.9249],
  tana: [47.5079, -18.8792],
  // Les escales des routes relevées par l'OIM.
  nouadhibou: [-17.0347, 20.9310], dakhla: [-15.9580, 23.6848], conakry: [-13.5784, 9.6412],
  obock: [43.2833, 11.9667], bosasso: [49.1816, 11.2842], moyale: [39.0500, 3.5167],
  beitbridge: [30.0000, -22.2167],
};

// Fenêtres géographiques des cadrages, en [lon0, lat0, lon1, lat1]. Elles sont
// la conversion des cadrages en pixels qui existaient avant : le découpage est
// celui que leur auteur avait choisi, exprimé là où il ne dépend plus de la
// projection.
const FENETRES_REGIONS = {
  af_med:     [-19.31, 39.03, 38.62, 12.84],
  af_west:    [-27.00, 26.57, 17.38, 2.87],
  af_central: [4.57, 25.08, 32.59, -19.24],
  af_east:    [19.61, 24.11, 59.28, -26.98],
  af_south:   [9.70, -6.13, 42.17, -47.80],
};

const FENETRES_PLANCHES = {
  'Pl. I':    [-26.00, 37.86, 58.45, -47.02],
  'Pl. II':   [-26.00, 37.86, 58.45, -47.02],
  'Pl. III':  [-22.86, 37.34, 45.73, -17.28],
  'Pl. IV':   [-4.68, 16.12, 54.82, -39.58],
  'Pl. V':    [5.23, 28.33, 57.30, -22.71],
  'Pl. VI':   [-22.86, 29.78, 31.68, -17.28],
  'Pl. VII':  [-22.04, 29.06, 52.34, -20.40],
  'Pl. VIII': [-25.34, 37.34, 57.30, -34.98],
  'Pl. IX':   [-0.55, 2.29, 57.30, -46.57],
  'Pl. X':    [-8.81, 20.82, 49.03, -31.52],
  'Pl. XI':   [-22.04, 37.34, 45.73, -6.78],
  'Pl. XII':  [-23.69, 36.01, 27.55, -24.98],
};

// Une fenêtre géographique n'est pas un rectangle une fois projetée : sous
// Eckert IV les méridiens se courbent. On échantillonne donc son pourtour et
// l'on prend la boîte qui l'englobe — le cadrage montre ce qu'il montrait.
const cadrer = ([lo0, la0, lo1, la1]) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const N = 24;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    for (const [lo, la] of [
      [lo0 + (lo1 - lo0) * u, la0], [lo0 + (lo1 - lo0) * u, la1],
      [lo0, la0 + (la1 - la0) * u], [lo1, la0 + (la1 - la0) * u],
    ]) {
      const p = projection([lo, la]);
      if (!p) continue;
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
      y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
  }
  return [x0, y0, x1 - x0, y1 - y0].map((v) => Math.round(v));
};

// LES ÉTATS TROP PETITS POUR ÊTRE VUS.
// Le seuil est une aire dessinée, pas une liste : est petit ce qui couvre
// moins de MINUSCULE unités carrées sur la planche. Ces États reçoivent une
// amorce — un cercle à leur position — sans quoi la carte les effacerait de
// la comparaison. Le point est le centre de leur emprise.
// Six cents unités carrées sur une planche de 1006 × 1378 : le seuil sépare
// les douze États insulaires ou minuscules — Seychelles (3 unités), São Tomé
// (15), Comores (27) — du plus petit des États qui se voient encore, le Togo
// (988). Il ne s'agit pas d'une liste tenue à la main : le seuil est mesuré
// sur les tracés, et il suit la projection.
const MINUSCULE = 600;

const airePays = (d) => {
  let total = 0;
  for (const anneau of d.split('Z')) {
    const n = anneau.match(/-?\d+(?:\.\d+)?/g);
    if (!n || n.length < 6) continue;
    const m = n.length - (n.length % 2);
    let a = 0;
    for (let i = 0; i + 3 < m; i += 2) a += Number(n[i]) * Number(n[i + 3]) - Number(n[i + 2]) * Number(n[i + 1]);
    // Le terme de fermeture : le dernier sommet rejoint le premier.
    a += Number(n[m - 2]) * Number(n[1]) - Number(n[0]) * Number(n[m - 1]);
    total += Math.abs(a / 2);
  }
  return total;
};
const emprise = (d) => {
  const n = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (let i = 0; i + 1 < n.length; i += 2) {
    x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]);
    y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]);
  }
  return [x0, y0, x1, y1];
};

const petits = Object.entries(paths)
  .map(([id, d]) => [id, airePays(d), emprise(d)])
  .filter(([, a]) => a < MINUSCULE)
  .sort((a, b) => a[1] - b[1])
  .map(([id, , e]) => [id, Math.round((e[0] + e[2]) / 2), Math.round((e[1] + e[3]) / 2)]);

const nomDe = new Map(traits.map((t) => [String(Number(t.id)), t.nom]));
const seychelles = emprise(paths['690']);

const points = {};
for (const [nom, lonlat] of Object.entries(REPERES)) {
  const p = projection(lonlat);
  if (!p) throw new Error(`repère hors projection : ${nom}`);
  points[nom] = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
}
const cadresRegions = Object.fromEntries(Object.entries(FENETRES_REGIONS).map(([k, f]) => [k, cadrer(f)]));
const cadresPlanches = Object.fromEntries(Object.entries(FENETRES_PLANCHES).map(([k, f]) => [k, cadrer(f)]));

if (process.argv.includes('--compare')) {
  const ancien = readFileSync('src/africaMapPaths.js', 'utf8');
  const ancienBox = ancien.match(/AFRICA_VIEWBOX = "([^"]+)"/)[1];
  console.log(`ancien cadre : ${ancienBox}`);
  console.log(`nouveau cadre : ${viewBox}`);
  console.log(`bornes : x ${bx0.toFixed(1)}..${bx1.toFixed(1)}  y ${by0.toFixed(1)}..${by1.toFixed(1)}`);
  const cles = new Set([...ancien.matchAll(/"(\d+)":"M/g)].map((m) => m[1]));
  const neuves = new Set(Object.keys(paths));
  console.log(`clés : ${cles.size} anciennes, ${neuves.size} nouvelles`);
  console.log(`  en trop : ${[...neuves].filter((k) => !cles.has(k)).join(', ') || 'aucune'}`);
  console.log(`  manquantes : ${[...cles].filter((k) => !neuves.has(k)).join(', ') || 'aucune'}`);
  process.exit(0);
}

const entete = `// Tracés SVG des 54 pays africains (source : world-atlas 50m, Natural Earth — domaine public).
// Généré par scripts/composer-le-fond-de-carte.mjs — ne pas modifier à la main.
//
// Projection ${NOMS_PROJECTION[choix]}${mercator ? '' : ', équivalente : les aires sont conservées'}.
// Le Maroc est rendu d’un seul tenant : les deux entités du jeu source sont
// réunies par union topologique avant projection, ce qui supprime l’arc
// intérieur plutôt que de le masquer.
//
// Le cadre ouvre de ${MARGE} unités au-delà des tracés : les marqueurs des îles sont
// des disques centrés, et un disque posé sur le bord y perdrait son rayon.
`;

const lignesPoints = Object.entries(points)
  .map(([n, [x, y]]) => `  ${n}: [${x}, ${y}],`).join('\n');
const lignesRegions = Object.entries(cadresRegions)
  .map(([n, c]) => `  ${n}: [${c.join(', ')}],`).join('\n');
const lignesPlanches = Object.entries(cadresPlanches)
  .map(([n, c]) => `  '${n}': [${c.join(', ')}],`).join('\n');

const corps = `${entete}
export const AFRICA_VIEWBOX = ${JSON.stringify(viewBox)};

export const africaCountryPaths = ${JSON.stringify(paths)};

// Villes et points de passage, projetés depuis leurs coordonnées réelles.
export const AFRICA_POINTS = {
${lignesPoints}
};

// Les cinq cadrages régionaux, en unités de la carte.
export const AFRICA_CADRES_REGIONS = {
${lignesRegions}
};

// Les douze cadrages des planches de l'Atlas, en unités de la carte.
export const AFRICA_CADRES_PLANCHES = {
${lignesPlanches}
};

// Les États dont le tracé couvre moins de ${MINUSCULE} unités carrées : ils reçoivent
// une amorce, faute de quoi la carte les effacerait. Le point est le centre de
// leur emprise.
export const AFRICA_PETITS_ETATS = [
${petits.map(([id, x, y]) => `  ['${id}', ${x}, ${y}],`.padEnd(26) + ` // ${nomDe.get(id)}`).join('\n')}
];
`;

writeFileSync('src/africaMapPaths.js', corps.replace(/\n/g, '\r\n'));
console.log(`${Object.keys(paths).length} tracés écrits, ${sommets} sommets, ${Object.keys(points).length} repères, cadre ${viewBox} (${NOMS_PROJECTION[choix]}).`);
console.log(`${petits.length} États sous le seuil de visibilité ; les Seychelles occupent ${(seychelles[2] - seychelles[0]).toFixed(1)} × ${(seychelles[3] - seychelles[1]).toFixed(1)} unités.`);
