// LES MISES EN PAGE PRESQUE PAREILLES
// ===========================================================================
// Un site se defait rarement d un coup. Il se defait d un cran : une planche
// prend `py-6` quand ses sept soeurs prennent `py-5`, une carte prend
// `gap-3` quand les autres prennent `gap-2`. Aucun de ces ecarts ne se
// remarque seul ; ensemble ils font que rien ne s aligne, et personne ne sait
// dire pourquoi.
//
// Ce releve compare les listes de classes deux a deux. Deux listes qui ne
// different que par UNE classe, et dont l une est nettement plus frequente
// que l autre, sont signalees : la rare est probablement une distraction, la
// frequente est la regle.
//
// Il ne corrige rien. Une divergence peut etre voulue — un pied de page n a
// pas a respirer comme un corps — et c est a la lecture d en decider. Le
// releve dit seulement ou regarder.
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.jsx', 'utf8');

// On ne retient que les listes ecrites en clair. Les listes composees a la
// volee (`${...}`) melangent des morceaux qu on ne peut pas comparer.
const listes = new Map();
const lignes = new Map();   // signature -> les lignes ou elle parait
{
  const jusque = [];        // index de caractere -> numero de ligne
  let n = 1;
  for (let i = 0; i < app.length; i += 1) { jusque[i] = n; if (app[i] === '\n') n += 1; }
  for (const m of app.matchAll(/className="([^"${}]+)"/g)) {
    const cle = m[1].trim().split(/\s+/).sort().join(' ');
    listes.set(cle, (listes.get(cle) || 0) + 1);
    if (!lignes.has(cle)) lignes.set(cle, []);
    lignes.get(cle).push(jusque[m.index]);
  }
}

// Une classe est « du meme cran » qu une autre si elles partagent le prefixe
// et ne different que par la valeur : py-5 / py-6, gap-2 / gap-3.
const cran = (a, b) => {
  const i = a.lastIndexOf('-'), j = b.lastIndexOf('-');
  return i > 0 && j > 0 && a.slice(0, i) === b.slice(0, j) && a !== b;
};

const entrees = [...listes.entries()]
  .filter(([cle]) => cle.split(' ').length >= 3)
  .sort((x, y) => y[1] - x[1]);

const signale = [];
for (let i = 0; i < entrees.length; i += 1) {
  for (let j = i + 1; j < entrees.length; j += 1) {
    const [a, na] = entrees[i];
    const [b, nb] = entrees[j];
    // La regle doit dominer nettement : sinon ce sont deux formes assumees.
    if (na < 3 || nb > na / 3) continue;
    const ta = a.split(' '), tb = b.split(' ');
    if (ta.length !== tb.length) continue;
    const ecarts = [];
    for (let k = 0; k < ta.length; k += 1) if (ta[k] !== tb[k]) ecarts.push([ta[k], tb[k]]);
    if (ecarts.length !== 1) continue;
    const [ga, gb] = ecarts[0];
    if (!cran(ga, gb)) continue;
    signale.push({ regle: a, na, rare: b, nb, de: gb, vers: ga });
  }
}

console.log('LES MISES EN PAGE QUI NE DIVERGENT QUE D UN CRAN');
console.log('='.repeat(74));
if (!signale.length) {
  console.log('\nAucune. Chaque mise en page repetee tient la meme valeur partout.');
} else {
  for (const s of signale) {
    console.log(`\n  ${s.de}  →  ${s.vers}      (${s.nb} contre ${s.na})`);
    console.log(`    rare  : ${s.rare}`);
    console.log(`    ligne(s) : ${(lignes.get(s.rare) || []).join(', ')}`);
    console.log(`    regle : ${s.regle}`);
  }
  console.log(`\n${'='.repeat(74)}`);
  console.log(`${signale.length} divergence(s) a lire.`);
}
