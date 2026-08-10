// Etat de preparation au multilingue. Ce qui compte n'est pas le nombre de
// chaines traduites — il est nul pour l'arabe — mais le nombre de points du
// code qui SAURAIENT accueillir une troisieme langue sans etre reecrits.
const fs = require('fs');
const path = require('path');

const RACINE = 'C:/Users/bmkhy/datahub/src';
const fichiers = [];
(function marcher(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) marcher(p);
    else if (/\.jsx?$/.test(e.name)) fichiers.push(p);
  }
})(RACINE);

const compter = (src, re) => (src.match(re) || []).length;

let pret = 0, bloque = 0, rtl = 0;
const detailBloques = [];
const detailRTL = {};

// Utilitaires Tailwind a direction physique : ils ne se retournent pas en
// lecture droite-a-gauche. Les equivalents logiques existent tous.
const PHYSIQUES = [
  [/\bml-(\d|px|auto|\[)/g, 'ms-'], [/\bmr-(\d|px|auto|\[)/g, 'me-'],
  [/\bpl-(\d|px|\[)/g, 'ps-'],      [/\bpr-(\d|px|\[)/g, 'pe-'],
  [/\bborder-l\b/g, 'border-s'],    [/\bborder-r\b/g, 'border-e'],
  [/\bborder-l-(\d|\[)/g, 'border-s-'], [/\bborder-r-(\d|\[)/g, 'border-e-'],
  [/\btext-left\b/g, 'text-start'], [/\btext-right\b/g, 'text-end'],
  [/\brounded-l\b/g, 'rounded-s'],  [/\brounded-r\b/g, 'rounded-e'],
  [/\bleft-(\d|px|\[|full)/g, 'start-'], [/\bright-(\d|px|\[|full)/g, 'end-'],
];

// `space-x-*` repose sur des marges physiques entre enfants. Il ne se retourne
// pas seul : il lui faut `rtl:space-x-reverse`. On ne signale que ceux qui en
// sont depourvus.
const spaceXSansRenversement = (src) =>
  [...src.matchAll(/\bspace-x-(?:\d+(?:\.\d+)?|px)\b(?![^"'`]*rtl:space-x-reverse)/g)].length;

for (const f of fichiers) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(RACINE, f);

  // Prets : toute donnee stockee en dictionnaire, et tout appel au raccourci.
  const dicos = compter(src, /\{\s*fr:\s*["'`]/g) + compter(src, /\bfr:\s*["'`]/g);
  const appelsL = compter(src, /\bL\(/g);
  pret += dicos + appelsL;

  // Bloquants : deux branches ecrites en dur, impossibles a etendre.
  const ternaires = [...src.matchAll(/lang\s*===\s*['"]fr['"]\s*\?/g)];
  const ternairesEn = [...src.matchAll(/lang\s*===\s*['"]en['"]\s*\?/g)];
  const n = ternaires.length + ternairesEn.length;
  bloque += n;
  if (n) detailBloques.push([rel, n]);

  for (const [re, remplacant] of PHYSIQUES) {
    const c = compter(src, re);
    if (c) { rtl += c; detailRTL[remplacant] = (detailRTL[remplacant] || 0) + c; }
  }
  const sx = spaceXSansRenversement(src);
  if (sx) { rtl += sx; detailRTL['space-x sans rtl:space-x-reverse'] = (detailRTL['space-x sans rtl:space-x-reverse'] || 0) + sx; }
}

const total = pret + bloque;
console.log('=== Preparation au multilingue ===');
console.log('  points extensibles (dictionnaires + raccourcis) : ' + pret);
console.log('  points a deux branches figees (ternaires)       : ' + bloque);
console.log('  taux de preparation                             : ' + Math.round(100 * pret / total) + ' %');
console.log('\n  ternaires restants, par fichier :');
detailBloques.sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log('    ' + String(n).padStart(4) + '  ' + f));

console.log('\n=== Sens de lecture (arabe) ===');
console.log('  utilitaires a direction physique : ' + rtl);
Object.entries(detailRTL).sort((a, b) => b[1] - a[1])
  .forEach(([k, n]) => console.log('    ' + String(n).padStart(4) + '  -> ' + k));
