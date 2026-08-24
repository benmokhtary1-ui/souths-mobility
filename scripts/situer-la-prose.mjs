// Situe la PROSE du site : les paragraphes rendus par <Prose>, avec leur
// section et leur ligne.
//
// Le relevé des tics pèse toutes les chaînes visibles, glossaire compris. Pour
// réécrire, il faut la liste de ce qui se lit vraiment comme un texte suivi —
// et savoir où le prendre.
//
//   node scripts/situer-la-prose.mjs           (le compte par section)
//   node scripts/situer-la-prose.mjs TabClimat (le texte de la section)
import { readFileSync } from 'node:fs';

const lignes = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n').split('\n');
const filtre = process.argv[2];

const composants = [];
lignes.forEach((l, i) => {
  const m = l.match(/^const ([A-Z]\w+)\s*=/) || l.match(/^function ([A-Z]\w+)\s*\(/);
  if (m) composants.push({ i, nom: m[1] });
});
const composantDe = (i) => {
  let n = '(hors composant)';
  for (const c of composants) { if (c.i <= i) n = c.nom; else break; }
  return n;
};

const dedire = (s) => s
  .replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

const par = {};
for (let i = 0; i < lignes.length; i++) {
  if (!/<Prose\b/.test(lignes[i])) continue;
  const bloc = lignes.slice(i, i + 4).join('\n');
  for (const m of bloc.matchAll(/"((?:[^"\\]|\\.)*)"/g)) {
    const t = dedire(m[1]).trim();
    if (t.length < 160) continue;
    if (!/[àâçéèêëîïôûùüÿœ’]/.test(t)) continue;      // la version anglaise ne compte pas ici
    const c = composantDe(i);
    (par[c] = par[c] || []).push({ ligne: i + 1, t });
    break;
  }
}

if (filtre) {
  const liste = par[Object.keys(par).find((k) => k.toLowerCase().includes(filtre.toLowerCase()))] || [];
  for (const x of liste) console.log('[l. ' + x.ligne + ']  ' + x.t + '\n');
  console.log('— ' + liste.length + ' paragraphes');
} else {
  const rangs = Object.entries(par).sort((a, b) => b[1].length - a[1].length);
  for (const [k, v] of rangs) console.log(String(v.length).padStart(3) + '  ' + k);
  console.log('TOTAL ' + rangs.reduce((n, [, v]) => n + v.length, 0));
}
