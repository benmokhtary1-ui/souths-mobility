// Audit du fond. Trois questions qu'un relecteur humain traite mal sur un
// corpus de cette taille : les chiffres se contredisent-ils d'un endroit a
// l'autre ? une affirmation chiffree avance-t-elle sans source ? une donnee
// est-elle perimee ?
import fs from 'fs';
import { evidenceCheckData } from '../src/narrativesData.js';
import { countryData } from '../src/data/countries.js';
import { glossaryData } from '../src/data/glossary.js';
import { libraryData } from '../src/data/library.js';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const tousLesTextes = [];
const ram = (o) => { if (!o) return;
  if (typeof o === 'string') { tousLesTextes.push(o); return; }
  if (Array.isArray(o)) return o.forEach(ram);
  if (typeof o === 'object') Object.values(o).forEach(ram); };
[evidenceCheckData, glossaryData, libraryData].forEach(ram);
const corpus = tousLesTextes.join(' \n ') + ' \n ' + app;

// --- 1. Chiffres repetes : disent-ils la meme chose partout ? --------------
const CLES = [
  { nom: 'Protocole de Kigali, ratifications', re: /(\d{1,2})\s*(?:ratifications?|\/\s*54)[^.]{0,40}(?:libre circulation|Kigali)/gi,
    attendu: '4 sur 54' },
  { nom: 'Convention de Kampala, ratifications', re: /Kampala[^.]{0,80}?(\d{2})\s*(?:ratifications?|\/\s*54|Etats|États)/gi, attendu: '33' },
  { nom: 'ZLECAf, depots', re: /(?:ZLECAf|AfCFTA)[^.]{0,90}?(\d{2})\s*(?:signataires|ratifications?|ont depose|instrument)/gi, attendu: '49' },
  { nom: 'Convention OUA 1969', re: /(?:1969|OUA)[^.]{0,80}?(\d{2})\s*(?:ratifications?|\/\s*54)/gi, attendu: '46' },
  { nom: 'Migrants presents en Afrique', re: /(\d{2}(?:[\s,.]\d)?)\s*millions? de (?:migrants|personnes)[^.]{0,40}(?:en Afrique|sur le continent)/gi, attendu: '~29' },
  { nom: 'Part mondiale de l\'Afrique', re: /(\d[,.]\d)\s*%[^.]{0,50}(?:stock mondial|migrants dans le monde)/gi, attendu: '9,5' },
  { nom: 'Intervalle inter-recensitaire', re: /(\d{2}[,.]\d)\s*ans?[^.]{0,50}recensements?/gi, attendu: '11,1' },
  { nom: 'Deplaces internes subsahariens', re: /(\d{2}[,.]\d)\s*millions? de (?:personnes )?deplacees?/gi, attendu: '38,8' },
  { nom: 'Moyenne continentale AVOI', re: /moyenne continentale[^.]{0,30}?0[,.](\d{3})/gi, attendu: '0,501' },
];
console.log('=== 1. Chiffres repetes ===');
for (const c of CLES) {
  const vus = [...corpus.matchAll(c.re)].map(m => m[1]);
  const distincts = [...new Set(vus)];
  const drapeau = distincts.length > 1 ? '   << DIVERGENCE' : '';
  console.log('  ' + c.nom.padEnd(42) + ' ' + String(vus.length).padStart(3) + ' occurrences  valeurs : ' +
    (distincts.join(' / ') || '—') + '   attendu ' + c.attendu + drapeau);
}

// --- 2. Fiches chiffrees sans source ---------------------------------------
console.log('\n=== 2. Affirmations chiffrees sans source ===');
const sansSource = evidenceCheckData.filter(f => {
  const t = String(f.reality?.fr || '');
  const chiffre = /\d[\d\s,.]*\s*(?:%|millions?|milliards?)/.test(t);
  const src = (f.sources?.fr || []).filter(s => String(s).trim()).length;
  return chiffre && src === 0;
});
console.log('  ' + sansSource.length + ' sur ' + evidenceCheckData.length);
sansSource.slice(0, 8).forEach(f => console.log('     ' + f.id + '  ' + String(f.narrative.fr).slice(0, 60)));

// --- 3. Fraicheur ----------------------------------------------------------
console.log('\n=== 3. Fraicheur des donnees ===');
const annees = [...corpus.matchAll(/\b(19[5-9]\d|20[0-3]\d)\b/g)].map(m => +m[1]);
const recentes = annees.filter(a => a >= 2015);
const compte = {};
recentes.forEach(a => { compte[a] = (compte[a] || 0) + 1; });
Object.entries(compte).sort((a,b) => b[0]-a[0]).slice(0, 8)
  .forEach(([a, n]) => console.log('     ' + a + '  ' + String(n).padStart(4) + ' mentions'));
// Une reference n'a pas de date de peremption, et un fait historique encore
// moins. La premiere version de ce controle rangeait parmi les fiches
// « perimees » celle qui cite Keohane et Nye (1977) et celle qui date la
// Convention de Kampala de 2009 : dans les deux cas la date EST l'information.
//
// On ne cherche donc plus la vieillesse, mais l'absence d'ancrage recent sur
// les fiches qui avancent un CHIFFRE. Une affirmation quantifiee dont aucune
// source ne porte d'annee posterieure a 2020 merite un regard ; une fiche de
// concept ou d'instrument, non.
const chiffree = (f) => /\b\d+(?:[.,]\d+)?\s*(?:%|millions?|milliards?)\b/i.test(String(f.reality?.fr || ''));
const sansAncrageRecent = evidenceCheckData.filter(f => {
  if (!chiffree(f)) return false;
  const t = (f.sources?.fr || []).join(' ') + ' ' + String(f.reality?.fr || '');
  const a = [...t.matchAll(/\b(20[0-2]\d)\b/g)].map(m => +m[1]);
  return a.length && Math.max(...a) < 2020;
});
console.log('  fiches chiffrees sans source posterieure a 2020 : ' + sansAncrageRecent.length);
sansAncrageRecent.slice(0, 6).forEach(f => console.log('     ' + f.id + '  ' + String(f.narrative.fr).slice(0, 56)));

// --- 4. Equilibre des verdicts ---------------------------------------------
console.log('\n=== 4. Equilibre des verdicts ===');
const v = {};
evidenceCheckData.forEach(f => { v[f.confidence_level] = (v[f.confidence_level] || 0) + 1; });
Object.entries(v).sort((a,b)=>b[1]-a[1]).forEach(([k,n]) =>
  console.log('     ' + k + '  ' + String(n).padStart(3) + '  ' + Math.round(100*n/evidenceCheckData.length) + ' %'));

// --- 5. Couverture thematique ----------------------------------------------
console.log('\n=== 5. Couverture par theme ===');
const cat = {};
evidenceCheckData.forEach(f => { cat[f.category?.fr] = (cat[f.category?.fr] || 0) + 1; });
Object.entries(cat).sort((a,b)=>b[1]-a[1]).forEach(([k,n]) => console.log('     ' + String(n).padStart(3) + '  ' + k));
