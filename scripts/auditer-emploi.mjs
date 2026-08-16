// Audit d'emploi : ce que le depot contient et que le site n'utilise pas.
//
// Trois questions qu'on ne se pose jamais spontanement, parce qu'un champ
// inutilise ne casse rien et ne se voit nulle part :
//
//   1. quels champs de la base pays ne sont jamais affiches ? Une donnee
//      collectee, verifiee, sourcee, puis laissee dormir, c'est du travail
//      perdu et une promesse tacite non tenue ;
//   2. quels composants sont declares sans etre rendus ? Du code mort qui
//      alourdit la lecture et laisse croire a une fonction qui n'existe pas ;
//   3. quels modules exportent des symboles que personne n'importe ?
//
//   node scripts/auditer-emploi.mjs

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const app = readFileSync(join(RACINE, 'src/App.jsx'), 'utf8');

// --- 1. Les champs de la base pays ------------------------------------------
const { countryData } = await import('file://' + join(RACINE, 'src/data/countries.js').replace(/\\/g, '/'));
const pays = Object.values(countryData).flat();

const champs = new Map();
for (const p of pays) {
  for (const [k, v] of Object.entries(p)) {
    if (!champs.has(k)) champs.set(k, { renseignes: 0, exemple: v });
    if (v !== null && v !== undefined && v !== '') champs.get(k).renseignes++;
  }
}

// Un champ est « employe » s'il apparait quelque part dans le rendu, sous une
// des formes qu'on rencontre : c.champ, .champ, 'champ', "champ".
const employe = (k) => {
  const motifs = [
    new RegExp(`\\.${k}\\b`),
    new RegExp(`['"\`]${k}['"\`]`),
    new RegExp(`\\b${k}:`),
  ];
  return motifs.some(re => re.test(app));
};

const dormants = [];
for (const [k, info] of champs) {
  if (!employe(k)) dormants.push([k, info.renseignes, JSON.stringify(info.exemple).slice(0, 46)]);
}

console.log('\n=== 1. Champs de la base pays jamais affiches ===');
console.log('    ' + champs.size + ' champs au total, ' + pays.length + ' pays\n');
if (!dormants.length) console.log('    aucun — tout ce qui est collecte est montre');
dormants.sort((a, b) => b[1] - a[1]).forEach(([k, n, ex]) =>
  console.log('    ' + k.padEnd(26) + String(n).padStart(3) + ' pays renseignes    ex. ' + ex));

// --- 2. Les composants declares mais jamais rendus ---------------------------
const declares = [...app.matchAll(/^const ([A-Z][A-Za-z0-9]*) = \(/gm)].map(m => m[1]);
const jamaisRendus = declares.filter(nom => {
  const rendu = new RegExp(`<${nom}[\\s/>]`);
  return !rendu.test(app);
});

console.log('\n=== 2. Composants declares et jamais rendus ===');
console.log('    ' + declares.length + ' composants declares\n');
if (!jamaisRendus.length) console.log('    aucun — tout ce qui est ecrit sert');
jamaisRendus.forEach(n => console.log('    ' + n));

// --- 3. Les exports que personne n'importe -----------------------------------
const fichiers = [];
const parcourir = (rel) => {
  for (const e of readdirSync(join(RACINE, rel), { withFileTypes: true })) {
    if (e.isDirectory()) { if (e.name !== 'assets') parcourir(rel + '/' + e.name); continue; }
    if (/\.(js|jsx)$/.test(e.name) && e.name !== 'App.jsx') fichiers.push(rel + '/' + e.name);
  }
};
parcourir('src');

const toutLeCode = fichiers.map(f => readFileSync(join(RACINE, f), 'utf8')).join('\n') + '\n' + app;

console.log('\n=== 3. Exports que personne n\'importe ===\n');
let orphelins = 0;
for (const f of fichiers) {
  const src = readFileSync(join(RACINE, f), 'utf8');
  const noms = [...src.matchAll(/^export (?:const|function|class) ([A-Za-z_$][\w$]*)/gm)].map(m => m[1]);
  for (const n of noms) {
    // On compte les occurrences hors de sa propre declaration.
    const ailleurs = toutLeCode.split(new RegExp(`\\b${n}\\b`)).length - 1;
    if (ailleurs <= 1) { console.log('    ' + f.padEnd(30) + n); orphelins++; }
  }
}
if (!orphelins) console.log('    aucun');

console.log('\n' + '-'.repeat(64));
console.log('champs dormants : ' + dormants.length +
            '   composants morts : ' + jamaisRendus.length +
            '   exports orphelins : ' + orphelins + '\n');
