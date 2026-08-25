// Vérifie les NOMBRES ÉCRITS DANS LE TEXTE contre les données qu'ils comptent.
//
// « Huit questions posées au continent » : c'était vrai, puis deux couches ont
// été ajoutées et personne n'est revenu sur la phrase. Un chiffre écrit en dur
// dans une phrase ne dérive pas d'un coup — il devient faux le jour où la
// donnée bouge, et rien ne le signale.
//
// Ce relevé compte les collections dans le code, puis cherche dans le texte les
// nombres censés les décrire. Il ne corrige rien : il dit où le texte et la
// donnée ne disent plus la même chose.
//
//   node scripts/verifier-les-comptes.mjs
import { readFileSync } from 'node:fs';

const src = readFileSync('src/App.jsx', 'utf8').replace(/\r\n/g, '\n');
const lire = (f) => { try { return readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { return ''; } };

// --- Ce que les données contiennent réellement -----------------------------
const compter = (debut, motif) => {
  const i = src.indexOf(debut);
  if (i < 0) return null;
  const fin = src.indexOf('\n];', i);
  return (src.slice(i, fin < 0 ? undefined : fin).match(motif) || []).length;
};

const EN_LETTRES = {
  2: 'deux', 3: 'trois', 4: 'quatre', 5: 'cinq', 6: 'six', 7: 'sept', 8: 'huit',
  9: 'neuf', 10: 'dix', 11: 'onze', 12: 'douze',
};

const COLLECTIONS = [
  { nom: 'couches de l’Atlas',      n: compter('const COUCHES_ATLAS = [', /\n  \{ cle: /g),
    mots: ['questions posées au continent', 'questions au continent'] },
  { nom: 'instruments d’ancrage',   n: compter('const ANCHOR_INSTRUMENTS = [', /\n  \{ key: /g),
    mots: ['grands textes', 'instruments continentaux'] },
  { nom: 'crans de robustesse',     n: 4, mots: ['quatre crans'] },
  { nom: 'affirmations',            n: (lire('src/narrativesData.js').match(/\n    id: "\d+",/g) || []).length,
    mots: ['affirmations'] },
  { nom: 'références (biblio)',     n: (lire('src/data/library.js').match(/\{ title: /g) || []).length,
    mots: ['références sourcées'] },
  // Les compteurs de la planche d'ouverture (`ASSISE`) sont déjà calculés
  // sur les données : ils ne peuvent pas dériver. Ce relevé ne cherche que
  // les nombres ÉCRITS DANS UNE PHRASE.
];

console.log('COLLECTIONS RELEVÉES DANS LE CODE\n');
for (const c of COLLECTIONS) {
  console.log('   ' + String(c.n ?? '?').padStart(4) + '  ' + c.nom);
}

// --- Les nombres écrits dans le texte, à côté de ces mots ------------------
console.log('\nNOMBRES ÉCRITS DANS LE TEXTE\n');
let ecarts = 0;
for (const c of COLLECTIONS) {
  if (c.n == null) continue;
  for (const mot of c.mots) {
    const motif = new RegExp('([\\wÀ-ÿ]+)\\s+' + mot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    for (const m of src.matchAll(motif)) {
      const avant = m[1];
      // un gabarit `${…}` est calculé : il ne peut pas dériver
      const debut = src.lastIndexOf('\n', m.index);
      const ligne = src.slice(debut + 1, src.indexOf('\n', m.index));
      // Un commentaire de code peut citer un ancien libellé à bon droit.
      if (/^\s*(\/\/|\*|\{\/\*)/.test(ligne)) continue;
      if (/\$\{/.test(ligne.slice(Math.max(0, m.index - debut - 40), m.index - debut + 4))) continue;

      const valeur = /^\d+$/.test(avant)
        ? Number(avant)
        : Object.entries(EN_LETTRES).find(([, l]) => l === avant.toLowerCase())?.[0];
      if (valeur === undefined) continue;

      const ok = Number(valeur) === c.n;
      if (!ok) ecarts++;
      console.log('   ' + (ok ? 'ok  ' : 'ÉCART ') + '« ' + avant + ' ' + mot + ' »'
                  + (ok ? '' : '  — la donnée en compte ' + c.n)
                  + '   l. ' + (src.slice(0, m.index).split('\n').length));
    }
  }
}
console.log('\n' + (ecarts === 0
  ? 'aucun écart entre le texte et la donnée.'
  : ecarts + ' écart(s) : le texte annonce un nombre que la donnée ne confirme pas.'));
