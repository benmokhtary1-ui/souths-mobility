// Typographie francaise.
//
// Le francais demande une espace insecable avant les ponctuations doubles —
// deux-points, point-virgule, point d'exclamation, point d'interrogation — et
// a l'interieur des guillemets. Avec une espace ordinaire, le navigateur peut
// rejeter le signe seul en debut de ligne : une ligne qui commence par « : »
// ou par « ? », ou un guillemet fermant orphelin. Cela n'arrive pas a toutes
// les largeurs, ce qui rend le defaut difficile a voir et facile a laisser.
//
// On ne signale que les chaines francaises : l'anglais colle sa ponctuation.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/censusData.js',
                  'src/data/glossary.js', 'src/data/library.js', 'src/data/methodConventions.js'];

const OUTILS_FR = /\b(le|la|les|des|du|une|un|et|dans|pour|sur|par|aux|avec|est|sont|leur|cette|qui|que|plus|ne|pas)\b/gi;
const OUTILS_EN = /\b(the|of|and|in|for|on|by|with|is|are|their|this|that|which|from|at|to|as|its)\b/gi;
const estFrancais = (t) => /[àâçéèêëîïôûùüœ]/i.test(t)
  || (t.match(OUTILS_FR) || []).length > (t.match(OUTILS_EN) || []).length;

const INSEC = ' ';        // espace insecable
const FINE  = ' ';        // espace fine insecable

let ordinaire = 0, insecable = 0, chaines = 0;
const exemples = [];

for (const rel of FICHIERS) {
  let src;
  try { src = readFileSync(join(RACINE, rel), 'utf8'); } catch { continue; }
  // Les commentaires du code sont en francais eux aussi, et n'ont aucune
  // raison de porter des insecables : ils ne sont jamais mis en page. Il faut
  // suivre l'etat du bloc et pas seulement le debut de ligne — les
  // commentaires longs de ce fichier se poursuivent sur des lignes qui
  // commencent par du texte nu.
  let dansBloc = false;
  src.split(/\r?\n/).forEach((ligne, i) => {
    const ouvre = ligne.lastIndexOf('/*'), ferme = ligne.lastIndexOf('*/');
    const etait = dansBloc;
    if (ouvre > -1 && ouvre > ferme) dansBloc = true;
    else if (ferme > -1 && ferme > ouvre) dansBloc = false;
    if (etait || dansBloc || /^\s*(\/\/|\*)/.test(ligne)) return;
    // Les deux styles de guillemets. Le premier passage n'examinait que les
    // doubles et annoncait donc zero restant alors que le DOM en montrait
    // encore : le code emploie les deux, souvent dans le meme appel.
    const chainesDeLaLigne = [
      ...ligne.matchAll(/"((?:[^"\\]|\\.){10,})"/g),
      ...ligne.matchAll(/'((?:[^'\\\n]|\\.){10,})'/g),
    ];
    for (const m of chainesDeLaLigne) {
      const t = m[1].replace(/\\"/g, '"').replace(/\\'/g, "'");
      if (/[<>{}]/.test(t) || /^https?:/.test(t)) continue;
      if (!estFrancais(t)) continue;
      chaines++;
      insecable += (t.match(new RegExp('[' + INSEC + FINE + '][:;!?»]', 'g')) || []).length;
      insecable += (t.match(new RegExp('«[' + INSEC + FINE + ']', 'g')) || []).length;
      for (const p of t.matchAll(/ ([:;!?»])/g)) {
        ordinaire++;
        if (exemples.length < 10) {
          exemples.push(rel + ':' + (i + 1) + '  …' + t.slice(Math.max(0, p.index - 40), p.index + 10) + '…');
        }
      }
      for (const p of t.matchAll(/« /g)) {
        ordinaire++;
        if (exemples.length < 10) exemples.push(rel + ':' + (i + 1) + '  …' + t.slice(Math.max(0, p.index - 20), p.index + 30) + '…');
      }
    }
  });
}

console.log('=== Typographie francaise ===');
console.log('  chaines francaises examinees        : ' + chaines);
console.log('  espaces insecables deja posees      : ' + insecable);
console.log('  espaces ordinaires a corriger       : ' + ordinaire);
if (exemples.length) { console.log('\n  exemples :'); exemples.forEach(e => console.log('   ' + e)); }
process.exitCode = ordinaire ? 1 : 0;
