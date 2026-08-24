// Relève les FORMES : combien de façons différentes le site a de faire une
// même chose.
//
// « Il y a trop d'éléments qui font exactement la même chose. » Le défaut ne se
// voit pas en lisant le code d'un bloc — il se voit en comptant. Une note de
// source écrite tantôt par un composant, tantôt à la main dans un <Prose>
// italique de 10 px, tantôt dans un <p> gris de 11 px, donne trois objets là où
// le lecteur en attend un.
//
// Pour chaque rôle, le relevé montre les mécanismes employés et leur nombre.
// Un rôle à plusieurs mécanismes est un rôle à unifier ; le mécanisme
// majoritaire est en principe celui qu'il faut garder.
//
//   node scripts/relever-les-formes.mjs
//   node scripts/relever-les-formes.mjs --lignes   (avec les numéros de ligne)
import { readFileSync } from 'node:fs';

const lignes = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n').split('\n');
const detail = process.argv.includes('--lignes');

// Un rôle : ce qu'on cherche, et comment reconnaître chaque mécanisme.
const ROLES = [
  {
    nom: 'note de source',
    trouve: (l) => /\bSources?\s*:|\bsources=\{|<Sources\b/.test(l),
    formes: [
      ['composant <Sources>',      (l) => /<Sources\b/.test(l)],
      ['propriété sources={[…]}',  (l) => /\bsources=\{/.test(l)],
      ['prose italique à la main', (l) => /<Prose\b/.test(l) && /italic/.test(l)],
      ['prose à la main',          (l) => /<Prose\b/.test(l)],
      ['balise <p> à la main',     (l) => /<p\b/.test(l)],
      ['chaîne de traduction',     () => true],
    ],
  },
  {
    nom: 'légende de tableau',
    trouve: (l) => /<caption\b/.test(l),
    formes: [
      ['classe .table-titre', (l) => /className="table-titre"/.test(l)],
      ['autre classe',        () => true],
    ],
  },
  {
    nom: 'encadré de mise en garde',
    trouve: (l) => /className="[^"]*\b(aparte|encadre|callout)\b|border-s-|border-l-4|border-inline-start/.test(l),
    formes: [
      ['classe .aparte',       (l) => /\baparte\b/.test(l)],
      ['bordure Tailwind',     (l) => /border-s-|border-l-4/.test(l)],
      ['autre',                () => true],
    ],
  },
  {
    nom: 'étiquette en petites capitales',
    trouve: (l) => /className="[^"]*\bsurtitre\b|uppercase/.test(l),
    formes: [
      ['classe .surtitre',        (l) => /\bsurtitre\b/.test(l)],
      ['uppercase de Tailwind',   () => true],
    ],
  },
  {
    nom: 'carte de contenu',
    trouve: (l) => /className="[^"]*\bborder border-slate-200\b/.test(l),
    formes: [
      ['fond blanc + cadre gris',    (l) => /bg-white/.test(l)],
      ['cadre gris seul',            () => true],
    ],
  },
  {
    nom: 'arrondi des blocs',
    trouve: (l) => /\brounded(-[a-z0-9]+)?\b/.test(l),
    formes: [
      ['rounded-full / 999px', (l) => /rounded-full/.test(l)],
      ['rounded-xl',           (l) => /rounded-xl/.test(l)],
      ['rounded-lg',           (l) => /rounded-lg/.test(l)],
      ['rounded-md',           (l) => /rounded-md/.test(l)],
      ['rounded-sm',           (l) => /rounded-sm/.test(l)],
      ['rounded (défaut)',     () => true],
    ],
  },
];

for (const role of ROLES) {
  const compte = new Map();
  lignes.forEach((l, i) => {
    if (!role.trouve(l)) return;
    for (const [nom, test] of role.formes) {
      if (!test(l)) continue;
      if (!compte.has(nom)) compte.set(nom, []);
      compte.get(nom).push(i + 1);
      break;
    }
  });
  const rangs = [...compte.entries()].sort((a, b) => b[1].length - a[1].length);
  const total = rangs.reduce((n, [, v]) => n + v.length, 0);
  console.log('\n' + role.nom.toUpperCase() + '  —  ' + rangs.length
              + ' mécanisme(s), ' + total + ' emploi(s)');
  for (const [nom, ou] of rangs) {
    console.log('   ' + String(ou.length).padStart(4) + '  ' + nom
                + (detail ? '   l. ' + ou.slice(0, 12).join(', ') + (ou.length > 12 ? '…' : '') : ''));
  }
  if (rangs.length > 1) {
    const [premier, ...reste] = rangs;
    const minoritaires = reste.reduce((n, [, v]) => n + v.length, 0);
    console.log('   → à unifier sur « ' + premier[0] + ' » : ' + minoritaires + ' emploi(s) à reprendre');
  }
}
console.log();
