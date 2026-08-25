// Relève TOUS les chiffres qui apparaissent dans le texte du site, groupés par
// valeur, pour qu'on puisse les relire un par un.
//
// « Sept Africains sur dix restent » a survécu des mois dans le titre d'un bloc
// dont le paragraphe disait 54,4 %. Une phrase fausse ne se signale pas : elle
// se cache derrière une formulation qui a l'air juste. Le seul moyen de les
// trouver est de les SORTIR DE LEUR PHRASE et de les regarder ensemble — deux
// chiffres qui devraient être égaux et ne le sont pas sautent alors aux yeux.
//
// Le relevé ne juge pas : il rassemble. C'est l'œil qui tranche.
//
//   node scripts/relever-les-chiffres.mjs            (les pourcentages)
//   node scripts/relever-les-chiffres.mjs --grands   (les grands nombres)
//   node scripts/relever-les-chiffres.mjs 54,4       (une valeur precise)
import { readFileSync } from 'node:fs';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js',
                  'src/data/library.js', 'src/data/mondeData.js'];

const dedire = (s) => s
  .replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

// Les chaînes de texte visibles, avec leur fichier et leur ligne.
const phrases = [];
for (const f of FICHIERS) {
  let brut;
  try { brut = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  brut.split('\n').forEach((ligne, i) => {
    // on ne lit pas les commentaires : ils citent parfois d'anciens libellés
    if (/^\s*(\/\/|\*|\{\/\*)/.test(ligne)) return;
    for (const m of ligne.matchAll(/["'`]((?:[^"'`\\]|\\.){24,})["'`]/g)) {
      const t = dedire(m[1]);
      if (!/[àâçéèêëîïôûùüÿœ0-9]/.test(t)) continue;
      if (/^(https?:|\/|[a-z-]+ [a-z-]+ [a-z-]+$)/.test(t)) continue;   // urls, classes
      phrases.push({ f, i: i + 1, t });
    }
  });
}

const arg = process.argv[2];
const grands = process.argv.includes('--grands');
const cible = arg && !arg.startsWith('--') ? arg : null;

// --- Extraction ------------------------------------------------------------
const trouves = new Map();     // valeur -> [{f, i, extrait}]
const MOTIF = grands
  ? /\b(\d{1,3}(?:[   ]\d{3})+|\d+(?:[,.]\d+)?\s*millions?)\b/g
  : /\b(\d+(?:[,.]\d+)?)\s*(?:%|pour cent|per cent)/g;

for (const p of phrases) {
  for (const m of p.t.matchAll(MOTIF)) {
    const v = m[1].replace(/[  ]/g, ' ').trim();
    if (cible && v.replace(/[.,]/g, ',') !== cible.replace(/[.,]/g, ',')) continue;
    const i = m.index;
    const extrait = p.t.slice(Math.max(0, i - 62), Math.min(p.t.length, i + 62))
      .replace(/\s+/g, ' ').trim();
    if (!trouves.has(v)) trouves.set(v, []);
    trouves.get(v).push({ f: p.f.replace('src/', ''), i: p.i, extrait });
  }
}

// --- Sortie : les valeurs les plus répétées d'abord ------------------------
const rangs = [...trouves.entries()].sort((a, b) => b[1].length - a[1].length);
console.log((grands ? 'GRANDS NOMBRES' : 'POURCENTAGES') + ' RELEVÉS DANS LE TEXTE — '
            + rangs.length + ' valeurs distinctes, '
            + rangs.reduce((n, [, v]) => n + v.length, 0) + ' occurrences\n');

for (const [v, ou] of rangs) {
  console.log((grands ? v : v + ' %') + '   —   ' + ou.length + ' fois');
  const combien = cible ? ou.length : Math.min(ou.length, 3);
  for (const o of ou.slice(0, combien)) {
    console.log('     ' + o.f + ':' + String(o.i).padEnd(6) + '…' + o.extrait + '…');
  }
  if (!cible && ou.length > 3) console.log('     (+ ' + (ou.length - 3) + ' autres)');
  console.log();
}
