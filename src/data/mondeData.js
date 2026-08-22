// Le monde, pour comparaison.
// ---------------------------------------------------------------------------
// La plateforme mesure l'Afrique. Elle ne peut pas dire ce que ces mesures
// valent sans les poser à côté des autres régions : « 64 % des partants restent
// dans la région » ne veut rien dire tant qu'on ignore que la moyenne mondiale
// est de 45 % et que l'Europe est à 74 %.
//
// Toutes les valeurs de ce module viennent d'UNE seule publication, relevée sur
// le fichier d'origine et non sur une reprise de presse :
//
//   Nations unies, Département des affaires économiques et sociales, Division
//   de la population — « International Migrant Stock 2024: Key facts and
//   figures », version préliminaire non éditée, 2025.
//   https://www.un.org/development/desa/pd/content/international-migrant-stock
//
// LA RÉSERVE QUI COMMANDE TOUT LE RESTE. Le découpage régional d'UN DESA est
// celui des objectifs de développement durable, et il n'est PAS celui de
// l'Union africaine. « Afrique subsaharienne » y compte 51 pays ; l'Afrique du
// Nord est rangée avec l'Asie de l'Ouest dans une région de 25 pays qui va du
// Maroc à l'Iran. Aucune ligne de ce module ne décrit donc les 54 États de
// l'Union africaine, et aucun chiffre d'ici ne doit être additionné à ceux de
// countries.js. Les deux séries se lisent côte à côte, jamais l'une dans
// l'autre — c'est la raison d'être du champ `perimetre`.

export const SOURCE_MONDE = {
  label: {
    fr: "Nations unies, DESA — International Migrant Stock 2024 : faits et chiffres clés (2025)",
    en: "United Nations, DESA — International Migrant Stock 2024: Key facts and figures (2025)",
  },
  url: 'https://www.un.org/development/desa/pd/content/international-migrant-stock',
  annee: 2024,
};

// Les régions telles qu'UN DESA les définit. On garde ses libellés : les
// renommer donnerait l'illusion qu'ils recouvrent le découpage de l'UA.
export const REGIONS_DESA = {
  ssa:      { fr: 'Afrique subsaharienne',            en: 'Sub-Saharan Africa',                 pays: 51, afrique: 'partie' },
  nawa:     { fr: 'Afrique du Nord et Asie de l’Ouest', en: 'Northern Africa and Western Asia', pays: 25, afrique: 'partie' },
  csa:      { fr: 'Asie centrale et du Sud',          en: 'Central and Southern Asia',          pays: 14 },
  esea:     { fr: 'Asie de l’Est et du Sud-Est',      en: 'Eastern and South-Eastern Asia',     pays: 19 },
  lac:      { fr: 'Amérique latine et Caraïbes',      en: 'Latin America and the Caribbean',    pays: 48 },
  oceanie:  { fr: 'Océanie',                          en: 'Oceania',                            pays: 23 },
  europe:   { fr: 'Europe',                           en: 'Europe',                             pays: 48 },
  amnord:   { fr: 'Amérique du Nord',                 en: 'Northern America',                   pays: 5 },
  eur_am:   { fr: 'Europe et Amérique du Nord',       en: 'Europe and Northern America',        pays: 53 },
  monde:    { fr: 'Monde',                            en: 'World',                              pays: 233 },
};

// --- 1. L'ordre de grandeur mondial ----------------------------------------
export const MONDE_2024 = {
  migrants: 304_000_000,
  migrants1990: 154_000_000,
  partPopulation: 3.7,        // %
  partPopulation1990: 2.9,
  femmes: 48,                 // % de femmes et filles parmi les migrants
  // Déplacés de force à travers une frontière, mi-2024. « Un migrant
  // international sur six », dit la publication ; la part la plus élevée
  // depuis le début de la série, en 1950.
  deplacesTransfrontaliers: 51_700_000,
  refugies: 38_000_000,       // dont 32 M sous mandat HCR et 6 M sous mandat UNRWA
  demandeursAsile: 8_000_000,
  intraRegional: 45,          // % des migrants qui vivent dans leur région d'origine
};

// --- 2. Combien de migrants chaque région accueille, et quelle part de sa
//        population ils représentent ----------------------------------------
// `part` manque là où la publication ne la donne pas ; on ne l'estime pas.
export const ACCUEIL_PAR_REGION = [
  { region: 'europe', migrants: 94_000_000, population: 745_000_000, part: 13 },
  { region: 'amnord', migrants: 61_000_000, population: 385_000_000, part: 16 },
  { region: 'nawa',   migrants: 54_000_000, population: null,        part: null },
  { region: 'oceanie', migrants: null,      population:  46_000_000, part: 21 },
  // « moins de 1 % » : la publication ne donne pas la décimale, on ne
  // l'invente pas — le champ dit le seuil, pas une valeur.
  { region: 'csa',    migrants: null, population: null, part: null, partSeuil: '<1' },
  { region: 'esea',   migrants: null, population: null, part: null, partSeuil: '<1' },
];

// --- 3. Qui part et qui reste dans sa région -------------------------------
// Part des personnes nées dans la région qui vivent dans une AUTRE pays de la
// même région. C'est la mesure qui dément le mieux le récit du départ vers le
// Nord : l'Afrique subsaharienne y est au-dessus de la moyenne mondiale.
export const RESTE_DANS_SA_REGION = [
  { region: 'europe',  part: 74 },
  { region: 'oceanie', part: 73 },
  { region: 'ssa',     part: 64 },
  { region: 'monde',   part: 45 },
  { region: 'lac',     part: 29 },   // 71 % résident hors région
  { region: 'amnord',  part: 27 },   // 73 % hors région
  { region: 'csa',     part: 25 },   // 75 % hors région
];

// --- 4. Les cinq plus grands corridors entre régions ------------------------
// Ce que la publication établit et qui vaut plus que n'importe quel commentaire :
// TOUS les autres corridors interrégionaux pèsent moins de 7 millions en 2024 —
// y compris celui qui va de l'Afrique subsaharienne vers l'Europe.
export const CORRIDORS_INTERREGIONAUX = [
  { de: 'lac',  vers: 'amnord', personnes: 27_000_000 },
  { de: 'csa',  vers: 'nawa',   personnes: 20_000_000 },
  { de: 'nawa', vers: 'europe', personnes: 13_000_000 },
  { de: 'esea', vers: 'amnord', personnes: 12_000_000 },
  { de: 'csa',  vers: 'europe', personnes: 10_000_000 },
];
export const SEUIL_AUTRES_CORRIDORS = 7_000_000;

// --- 5. La disponibilité des données, région par région ---------------------
// Part des pays d'une région disposant d'au moins UNE source empirique depuis
// 2010, sur trois points : le nombre total de migrants, leur répartition par
// sexe, et leur pays d'origine.
//
// C'est le tableau 1 de la publication, et c'est la réponse chiffrée au récit
// d'une Afrique « sans données » : sur le pays d'origine, l'Afrique
// subsaharienne est à la moyenne mondiale, et devant l'Afrique du Nord réunie
// à l'Asie de l'Ouest comme devant l'Asie centrale et du Sud.
export const COUVERTURE_STATISTIQUE = [
  { region: 'monde',  total: 87, sexe: 71, origine: 76 },
  { region: 'ssa',    total: 84, sexe: 65, origine: 76 },
  { region: 'nawa',   total: 80, sexe: 68, origine: 64 },
  { region: 'csa',    total: 71, sexe: 71, origine: 50 },
  { region: 'esea',   total: 95, sexe: 95, origine: 95 },
  { region: 'lac',    total: 88, sexe: 73, origine: 77 },
  { region: 'oceanie', total: 96, sexe: 70, origine: 91 },
  { region: 'eur_am', total: 92, sexe: 89, origine: 89 },
  { region: 'europe', total: 92, sexe: 90, origine: 90 },
  { region: 'amnord', total: 100, sexe: 80, origine: 80 },
];

// --- 6. Les douze premières destinations du monde ---------------------------
// Utile pour situer : aucun pays africain n'y figure, et la publication ne
// retient que les destinations à cinq millions de migrants ou plus en 2020.
export const PREMIERES_DESTINATIONS = [
  { pays: { fr: 'États-Unis', en: 'United States' }, migrants: 52_400_000 },
  { pays: { fr: 'Allemagne', en: 'Germany' }, migrants: 16_800_000 },
  { pays: { fr: 'Arabie saoudite', en: 'Saudi Arabia' }, migrants: 13_700_000 },
  { pays: { fr: 'Royaume-Uni', en: 'United Kingdom' }, migrants: 11_800_000 },
  { pays: { fr: 'France', en: 'France' }, migrants: 9_200_000 },
  { pays: { fr: 'Espagne', en: 'Spain' }, migrants: 8_900_000 },
  { pays: { fr: 'Canada', en: 'Canada' }, migrants: 8_800_000 },
  { pays: { fr: 'Émirats arabes unis', en: 'United Arab Emirates' }, migrants: 8_200_000 },
  { pays: { fr: 'Australie', en: 'Australia' }, migrants: 8_100_000 },
  { pays: { fr: 'Russie', en: 'Russian Federation' }, migrants: 7_600_000 },
  { pays: { fr: 'Türkiye', en: 'Türkiye' }, migrants: 7_100_000 },
  { pays: { fr: 'Italie', en: 'Italy' }, migrants: 6_600_000 },
];
