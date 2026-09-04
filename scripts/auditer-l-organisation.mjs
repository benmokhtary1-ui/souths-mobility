// L ORGANISATION DES SECTIONS, COMPAREE
// ===========================================================================
// Le site s est construit section par section, et chacune a pris la forme du
// jour ou elle a ete ecrite. Les plus recentes suivent une grammaire commune —
// une ouverture nommee, des mouvements numerotes, une assise sous les
// chiffres, une seule etiquette. Les plus anciennes portent encore la leur :
// un cartouche d icone, une teinte par theme, un bleu de surlignage, un corps
// sous le plancher de l echelle.
//
// Ce releve ne juge pas le contenu. Il compte, section par section, les
// marqueurs de la grammaire commune et ceux des grammaires abandonnees, et
// dit ou l ecart se trouve.
//
//   node scripts/auditer-l-organisation.mjs
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.jsx', 'utf8');

// Les composants de section, dans l ordre de la barre.
const SECTIONS = [
  ['Accueil',      'const TabHome'],
  ['Atlas',        'const TabAtlas'],
  ['Vérification', 'const TabEvidenceCheck'],
  ['Données',      'const TabDataStats'],
  ['Mobilités',    'const TabMobilites'],
  ['Gouvernance',  'const TabGovernance'],
  ['Bibliothèque', 'const TabLibrary'],
  ['Glossaire',    'const TabGlossary'],
  ['Méthode',      'const TabMethodology'],
  ['À propos',     'const TabAbout'],
  ['Indicateurs',  'const IndicatorsMatrix'],
];

// Ce qui appartient a la grammaire commune, et ce qui n en est pas.
const TENUS = [
  ['ouverture de page',      /<PageHeader/g],
  ['barre de section',       /<BarreSection/g],
  ['repères de lecture',     /<Reperes/g],
  ['mouvement numéroté',     /<MovementOpener/g],
  ['assise sous le chiffre', /className="fiche-mesure"|className="ratif-compte"/g],
  ['étiquette unique',       /className="surtitre/g],
  ['aparté de réserve',      /aparte aparte--reserve/g],
];

const ECARTS = [
  ['cartouche d’icône',        /p-3 bg-slate-100 rounded-sm border/g],
  ['teinte portée par le thème', /\$\{theme\.color\}|theme\.color/g],
  ['bleu de surlignage',       /border-blue-\d|text-blue-\d|bg-blue-\d/g],
  ['corps sous le plancher',   /text-\[(?:[0-9]|1[0-2])px\]/g],
  ['coin arrondi hors système', /rounded-lg/g],
  ['ombre portée',             /shadow-md|shadow-lg/g],
];

const bornes = SECTIONS.map(([nom, ancre]) => ({ nom, i: app.indexOf(ancre) }))
  .filter((s) => s.i >= 0).sort((a, b) => a.i - b.i);

const lignes = [];
for (let k = 0; k < bornes.length; k += 1) {
  const debut = bornes[k].i;
  // La section s arrete au composant suivant DANS LE FICHIER, quel qu il soit.
  const suivant = bornes.slice(k + 1).map((s) => s.i).filter((i) => i > debut);
  const fin = suivant.length ? Math.min(...suivant) : app.length;
  const bloc = app.slice(debut, fin);
  const compte = (paires) => paires.map(([nom, re]) => [nom, (bloc.match(re) || []).length]);
  lignes.push({ nom: bornes[k].nom, taille: bloc.length,
                tenus: compte(TENUS), ecarts: compte(ECARTS) });
}

console.log('L ORGANISATION DES SECTIONS, COMPAREE');
console.log('='.repeat(74));
for (const l of lignes) {
  const t = l.tenus.filter(([, n]) => n).map(([nom, n]) => nom + '×' + n);
  const e = l.ecarts.filter(([, n]) => n).map(([nom, n]) => nom + '×' + n);
  console.log('\n  ' + l.nom.toUpperCase() + '   (' + Math.round(l.taille / 1000) + ' k)');
  console.log('    tenus  : ' + (t.length ? t.join(', ') : '—'));
  console.log('    écarts : ' + (e.length ? e.join(', ') : '—'));
}

const total = lignes.reduce((s, l) => s + l.ecarts.reduce((a, [, n]) => a + n, 0), 0);
console.log('\n' + '='.repeat(74));
console.log(total + ' marqueur(s) de grammaire abandonnee, toutes sections confondues.');
