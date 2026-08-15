// Audit des 70 fiches d'Evidence Check.
//
// Trois questions qu'un relecteur humain traite mal sur soixante-dix entrees :
// deux fiches disent-elles la meme chose ? un champ manque-t-il ? un texte
// est-il mal forme ? On les pose au calcul.
//
// La similarite se mesure sur les mots pleins, pas sur les chaines brutes :
// deux affirmations peuvent etre jumelles en disant « migration » ici et
// « migrations » la.
import { evidenceCheckData } from './src/narrativesData.js';

const VIDES = new Set(['le','la','les','des','de','du','un','une','et','ou','a','au','aux','en','dans',
  'pour','par','sur','que','qui','ne','pas','plus','est','sont','ce','cette','ces','son','sa','ses',
  'leur','leurs','il','elle','ils','elles','on','se','y','d','l','n','s','c','the','of','to','in','and']);

const mots = (t) => String(t || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
  .filter(m => m.length > 2 && !VIDES.has(m));

const jaccard = (a, b) => {
  const A = new Set(a), B = new Set(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
};

console.log('fiches : ' + evidenceCheckData.length + '\n');

// --- 1. Champs manquants ou vides ------------------------------------------
const OBLIGATOIRES = ['id', 'narrative', 'reality', 'verdict', 'category', 'confidence_level', 'sources'];
const lacunes = [];
for (const f of evidenceCheckData) {
  const manque = [];
  for (const c of OBLIGATOIRES) {
    const v = f[c];
    if (v === undefined || v === null) { manque.push(c); continue; }
    if (typeof v === 'object' && !Array.isArray(v)) {
      if (!v.fr || !String(v.fr).trim()) manque.push(c + '.fr');
      if (!v.en || !String(v.en).trim()) manque.push(c + '.en');
    } else if (Array.isArray(v)) {
      if (!v.length) manque.push(c + ' (vide)');
    } else if (!String(v).trim()) manque.push(c);
  }
  // Les champs facultatifs mais attendus.
  for (const c of ['indicators', 'limits', 'why_persists']) {
    if (f[c] === undefined) manque.push(c + ' (absent)');
  }
  if (manque.length) lacunes.push({ id: f.id, titre: String(f.narrative?.fr || '').slice(0, 46), manque });
}
console.log('=== Champs manquants : ' + lacunes.length + ' fiches');
lacunes.forEach(l => console.log('  ' + l.id + '  ' + l.titre + '\n      ' + l.manque.join(', ')));

// --- 2. Quasi-doublons ------------------------------------------------------
const prep = evidenceCheckData.map(f => ({
  id: f.id,
  cat: f.category?.fr || '',
  n: String(f.narrative?.fr || ''),
  r: String(f.reality?.fr || ''),
  mn: mots(f.narrative?.fr),
  mr: mots(f.reality?.fr),
}));
const paires = [];
for (let i = 0; i < prep.length; i++) {
  for (let j = i + 1; j < prep.length; j++) {
    const sn = jaccard(prep[i].mn, prep[j].mn);
    const sr = jaccard(prep[i].mr, prep[j].mr);
    const score = Math.max(sn, sr * 0.9);
    if (score >= 0.32) paires.push({ a: prep[i], b: prep[j], sn, sr, score });
  }
}
paires.sort((x, y) => y.score - x.score);
console.log('\n=== Paires trop proches (Jaccard >= 0,32) : ' + paires.length);
paires.slice(0, 14).forEach(p => {
  console.log('\n  [' + p.a.id + '] ~ [' + p.b.id + ']   affirmation ' + p.sn.toFixed(2) + '  reponse ' + p.sr.toFixed(2));
  console.log('    ' + p.a.id + ' : ' + p.a.n.slice(0, 96));
  console.log('    ' + p.b.id + ' : ' + p.b.n.slice(0, 96));
});

// --- 3. Anomalies de redaction ---------------------------------------------
const anomalies = [];
const verifier = (id, champ, t) => {
  const s = String(t || '');
  if (!s) return;
  if (/\s{2,}/.test(s)) anomalies.push([id, champ, 'espaces doubles']);
  if (/[«"]/.test(s) && (s.split('«').length - 1) !== (s.split('»').length - 1)) anomalies.push([id, champ, 'guillemets desapparies']);
  if (/\.\s*\./.test(s)) anomalies.push([id, champ, 'points doubles']);
  if (/\s[,;:!?]/.test(s) && !/\s[;:!?]/.test(s.replace(/\u00a0/g, ''))) anomalies.push([id, champ, 'espace avant virgule']);
  if (/[a-z]\)[A-Z]|\w"\w/.test(s)) anomalies.push([id, champ, 'ponctuation collee']);
  if (s.length > 40 && !/[.!?»)\]]$/.test(s.trim())) anomalies.push([id, champ, 'ne se termine pas']);
  if (/\bundefined\b|\bNaN\b|\[object/.test(s)) anomalies.push([id, champ, 'valeur technique visible']);
};
for (const f of evidenceCheckData) {
  for (const c of ['narrative', 'reality', 'limits', 'why_persists']) {
    const v = f[c];
    if (!v) continue;
    for (const lg of ['fr', 'en']) {
      const x = v[lg];
      if (Array.isArray(x)) x.forEach((y, k) => verifier(f.id, c + '.' + lg + '[' + k + ']', y));
      else verifier(f.id, c + '.' + lg, x);
    }
  }
}
console.log('\n=== Anomalies de redaction : ' + anomalies.length);
const parType = {};
anomalies.forEach(([, , t]) => { parType[t] = (parType[t] || 0) + 1; });
Object.entries(parType).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log('  ' + String(n).padStart(4) + '  ' + t));
console.log('\n  detail (30 premieres) :');
anomalies.slice(0, 30).forEach(([id, c, t]) => console.log('    ' + id + '  ' + c.padEnd(22) + t));
