// L'ESPACE FINE DEVANT LE POUR-CENT
// ===========================================================================
// `auditer-typographie.mjs` sait reconnaître une chaîne française et vérifie
// l'espace insécable devant « : ; ! ? » » et après « « ». Il ne connaît pas le
// signe pour-cent, qui prend pourtant la même fine en français — et l'anglais
// exige l'inverse, le signe collé.
//
// Le défaut s'est vu dans le rapport PDF d'un pays : « Environ 72% de la
// diaspora marocaine », dans la même page qui écrivait « 0,3 % » deux lignes
// plus haut depuis que le gabarit d'export a été corrigé. Relevé sur le corpus :
// 99 pour-cent collés contre 127 avec la fine.
//
// La détection est celle de l'audit, au caractère près : une chaîne est
// française si elle porte un accent, ou plus de mots-outils français
// qu'anglais. On ne touche donc jamais à `en: '...'`, où « 72% » est correct.
//
//   node scripts/poser-la-fine-du-pourcent.mjs           (relevé seul)
//   node scripts/poser-la-fine-du-pourcent.mjs --ecrire  (pose les fines)
import { readFileSync, writeFileSync } from 'node:fs';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/data/countries.js',
                  'src/data/glossary.js', 'src/data/library.js', 'src/data/mondeData.js'];
const ECRIRE = process.argv.includes('--ecrire');
const FINE = ' ';

// --- le détecteur de l'audit, repris tel quel ------------------------------
const OUTILS_FR = /\b(le|la|les|des|du|une|un|et|dans|pour|sur|par|aux|avec|est|sont|leur|cette|qui|que|plus|ne|pas)\b/gi;
const OUTILS_EN = /\b(the|of|and|in|for|on|by|with|is|are|their|this|that|which|from|at|to|as|its)\b/gi;
const estFrancais = (t) => /[àâçéèêëîïôûùüœ]/i.test(t)
  || (t.match(OUTILS_FR) || []).length > (t.match(OUTILS_EN) || []).length;

let total = 0, touches = 0;
const exemples = [];

for (const rel of FICHIERS) {
  let src;
  try { src = readFileSync(rel, 'utf8'); } catch { continue; }
  const CR = src.includes('\r\n') ? '\r\n' : '\n';
  const lignes = src.split(CR);
  let change = false;

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    if (/^\s*(\/\/|\*)/.test(ligne)) continue;          // commentaire
    if (!/\d%/.test(ligne)) continue;

    // Chaque chaîne de la ligne, dans ses deux délimiteurs.
    const chaines = [
      ...ligne.matchAll(/"((?:[^"\\\n]|\\.){10,})"/g),
      ...ligne.matchAll(/'((?:[^'\\\n]|\\.){10,})'/g),
    ];
    let neuve = ligne;
    for (const m of chaines) {
      const t = m[1];
      if (/[<>{}]/.test(t) || /^https?:/.test(t)) continue;  // balisage, gabarit, URL
      if (!estFrancais(t)) continue;                          // anglais : le % reste collé
      const trouves = t.match(/\d%/g);
      if (!trouves) continue;
      total += trouves.length;
      if (exemples.length < 8) {
        const p = t.search(/\d%/);
        exemples.push(`${rel}:${i + 1}  …${t.slice(Math.max(0, p - 42), p + 8)}…`);
      }
      if (ECRIRE) {
        const corrige = t.replace(/(\d)%/g, `$1${FINE}%`);
        neuve = neuve.replace(t, corrige);
        touches += trouves.length;
        change = true;
      }
    }
    lignes[i] = neuve;
  }
  if (ECRIRE && change) writeFileSync(rel, lignes.join(CR));
}

console.log(`pour-cent collés dans une chaîne française : ${total}`);
exemples.forEach(e => console.log('   ' + e));
if (ECRIRE) console.log(`\n${touches} fine(s) posée(s).`);
else console.log('\nrelevé seul — relancer avec --ecrire pour poser les fines.');
