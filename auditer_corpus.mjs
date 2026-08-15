// Le meme controle, applique aux autres corpus du site : glossaire,
// bibliotheque, conventions de methode, base pays.
import { glossaryData } from './src/data/glossary.js';
import { libraryData } from './src/data/library.js';
import { methodConventions } from './src/data/methodConventions.js';
import { countryData } from './src/data/countries.js';

const VIDES = new Set(['le','la','les','des','de','du','un','une','et','ou','a','au','aux','en','dans',
  'pour','par','sur','que','qui','ne','pas','plus','est','sont','ce','cette','ces','son','sa','ses','the','of','to','in','and']);
const mots = (t) => String(t||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(m=>m.length>2&&!VIDES.has(m));
const jac = (a,b)=>{const A=new Set(a),B=new Set(b);if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return i/(A.size+B.size-i);};

const anomalie = (s) => {
  const t = String(s||''); const p = [];
  if (/\s{2,}/.test(t)) p.push('espaces doubles');
  if ((t.split('«').length-1) !== (t.split('»').length-1)) p.push('guillemets desapparies');
  if (/\bundefined\b|\bNaN\b|\[object/.test(t)) p.push('valeur technique');
  if (t.length > 40 && !/[.!?»)\]:]$/.test(t.trim())) p.push('ne se termine pas');
  return p;
};

// --- Glossaire --------------------------------------------------------------
const termes = glossaryData.flatMap(c => (c.terms||c.items||[]).map(t => ({ ...t, cat: c.category?.fr || c.title?.fr || '' })));
console.log('=== GLOSSAIRE : ' + termes.length + ' termes, ' + glossaryData.length + ' categories');
const sansSource = termes.filter(t => !t.source || !String(t.source).trim());
console.log('  sans source        : ' + sansSource.length + (sansSource.length ? '  → ' + sansSource.slice(0,6).map(t=>t.term).join(', ') : ''));
const sansEn = termes.filter(t => !t.en || !String(t.en).trim());
console.log('  sans version EN    : ' + sansEn.length + (sansEn.length ? '  → ' + sansEn.slice(0,6).map(t=>t.term).join(', ') : ''));
const dbl = [];
for (let i=0;i<termes.length;i++) for (let j=i+1;j<termes.length;j++) {
  const s = jac(mots(termes[i].fr), mots(termes[j].fr));
  const memeTerme = String(termes[i].term||'').toLowerCase() === String(termes[j].term||'').toLowerCase();
  if (memeTerme || s >= 0.42) dbl.push([termes[i].term, termes[j].term, memeTerme ? 'meme intitule' : s.toFixed(2)]);
}
console.log('  definitions proches : ' + dbl.length);
dbl.slice(0,8).forEach(d => console.log('     ' + d[0] + '  ~  ' + d[1] + '   (' + d[2] + ')'));
let anoG = 0; termes.forEach(t => { const p = anomalie(t.fr); if (p.length) { anoG++; if (anoG<=6) console.log('     ' + t.term + ' : ' + p.join(', ')); } });
console.log('  anomalies de texte : ' + anoG);

// --- Bibliotheque -----------------------------------------------------------
const docs = libraryData.flatMap(s => s.items || []);
console.log('\n=== BIBLIOTHEQUE : ' + docs.length + ' documents, ' + libraryData.length + ' sections');
console.log('  sans lien          : ' + docs.filter(d=>!d.url).length);
console.log('  sans annee         : ' + docs.filter(d=>!d.year).length);
const titres = {}; docs.forEach(d => { const k = String(d.title||'').toLowerCase().trim(); titres[k]=(titres[k]||0)+1; });
const titresDbl = Object.entries(titres).filter(([,n])=>n>1);
console.log('  titres en double   : ' + titresDbl.length + (titresDbl.length ? '  → ' + titresDbl.map(([t])=>t.slice(0,44)).join(' | ') : ''));
const urls = {}; docs.forEach(d => { if(d.url){ urls[d.url]=(urls[d.url]||0)+1; } });
const urlDbl = Object.entries(urls).filter(([,n])=>n>1);
console.log('  liens en double    : ' + urlDbl.length + (urlDbl.length ? '  → ' + urlDbl.slice(0,4).map(([u,n])=>n+'× '+u.slice(0,52)).join(' | ') : ''));

// --- Conventions de methode -------------------------------------------------
console.log('\n=== CONVENTIONS : ' + methodConventions.length);
methodConventions.forEach((c,i) => { const p = anomalie(c.text?.fr || c.desc?.fr || c.fr); if (p.length) console.log('  ' + i + ' : ' + p.join(', ')); });

// --- Base pays --------------------------------------------------------------
const pays = Object.values(countryData).flat();
console.log('\n=== PAYS : ' + pays.length);
const champsCles = ['iso2','name','stock','evolution','avoi','retention'];
const incomplets = pays.filter(p => champsCles.some(c => p[c] === undefined || p[c] === null || p[c] === ''));
console.log('  fiches incompletes : ' + incomplets.length + (incomplets.length ? '  → ' + incomplets.slice(0,8).map(p=>p.name?.fr||p.id).join(', ') : ''));
const iso = {}; pays.forEach(p => { iso[p.iso2]=(iso[p.iso2]||0)+1; });
console.log('  codes ISO doubles  : ' + Object.entries(iso).filter(([,n])=>n>1).map(([k,n])=>k+'×'+n).join(', ') || '  aucun');
