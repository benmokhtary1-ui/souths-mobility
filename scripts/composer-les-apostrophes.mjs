// Pose l'apostrophe typographique dans la prose, et le signe de suspension.
//
// Le site compose sa prose avec soin — fine insécable devant « ; : ! ? », guillemets
// français, chiffres en chasse fixe — et gardait 959 apostrophes droites. La droite
// est un signe de machine à écrire ; en typographie française l'élision prend la
// courbe (’). Sur un atlas éditorial, l'écart se voit à chaque « l'Afrique ».
//
// LA RÈGLE DE SÛRETÉ. On ne convertit que l'apostrophe ENTRE DEUX LETTRES. Un
// délimiteur de chaîne ne peut jamais l'être : il est précédé d'une espace, d'une
// parenthèse ou d'une virgule. Le motif est donc sûr sans avoir à suivre l'état
// de l'analyseur, contrairement au cas des espaces fines.
//
// Deux formes à traiter : l'apostrophe nue (dans "…"), et l'apostrophe échappée
// (dans '…', écrite \'). La seconde perd son antislash au passage — la courbe
// n'a rien à échapper.
//
// LES SUSPENSIONS. « ... » devient « … », sauf quand trois points sont suivis
// d'une lettre : c'est alors l'opérateur de diffusion (...genericDesc), pas une
// suspension.
//
//   node scripts/composer-les-apostrophes.mjs src/App.jsx
//   node scripts/composer-les-apostrophes.mjs src/App.jsx --ecrire
import { readFileSync, writeFileSync } from 'node:fs';


const fichier = process.argv[2];
const ecrire = process.argv.includes('--ecrire');
if (!fichier) {
  console.error('usage: node scripts/composer-les-apostrophes.mjs <fichier> [--ecrire]');
  process.exit(2);
}

let src = readFileSync(fichier, 'utf8');

// Une expression régulière littérale peut contenir l'élision : /l'[aeiou]/ y
// deviendrait /l’[aeiou]/, ce qui change ce qu'elle reconnaît. On les relève
// avant de toucher au fichier, et l'on s'arrête si l'une est concernée.
// Un « / » n'ouvre une expression régulière qu'en position d'expression : après
// une parenthèse, une virgule, un signe d'égalité, un opérateur. Après une valeur,
// c'est une division — et dans une phrase, c'est une barre oblique. Sans cette
// condition, le relevé prenait quatorze fragments de prose pour des expressions
// régulières, parce que deux barres obliques dans un paragraphe suffisent.
const risque = [];
for (const m of src.matchAll(/([(,=:!&|?{;[]|=>|\breturn)\s*\/(?![\/*])(?:\\.|\[(?:\\.|[^\]])*\]|[^\/\\\n])+\/[gimsuy]*/g)) {
  if (/\p{L}'\p{L}/u.test(m[0])) risque.push(m[0].slice(0, 70));
}

const avantApo = (src.match(/\p{L}'\p{L}/gu) || []).length;
const avantEch = (src.match(/\p{L}\\'\p{L}/gu) || []).length;
const avantSus = (src.match(/(?<!\.)\.{3}(?![.\p{L}(\[{$_])/gu) || []).length;

src = src.replace(/(\p{L})\\'(\p{L})/gu, '$1’$2');
src = src.replace(/(\p{L})'(\p{L})/gu, '$1’$2');
// L'opérateur de diffusion ne se laisse pas reconnaître à la seule lettre qui
// suit : `...(r.inProgress ? …)` et `...[a, b]` existent aussi. On écarte donc
// tout ce qui peut ouvrir une expression, pas seulement un identifiant.
// Et pas davantage les points de conduite : le tableau de provenance en tête de
// countries.js aligne ses sources sur des files de douze points. Trois points
// exactement, donc, ni plus ni moins.
src = src.replace(/(?<!\.)\.{3}(?![.\p{L}(\[{$_])/gu, '…');

console.log('apostrophes nues       :', avantApo);
console.log('apostrophes echappees  :', avantEch);
console.log('suspensions en 3 points:', avantSus);
console.log('regex a risque         :', risque.length ? risque.join(' | ') : 'aucune');
console.log('restant apres passage  :', (src.match(/\p{L}'\p{L}/gu) || []).length);

if (ecrire) {
  if (risque.length) { console.error('une expression reguliere contient une elision : rien ecrit'); process.exit(1); }
  writeFileSync(fichier, src, 'utf8');
  console.log('ecrit.');
}
