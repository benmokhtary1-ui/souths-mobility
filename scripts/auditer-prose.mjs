// Audit de prose : les tics d'ecriture qui traversent le site.
//
// Trois defauts se voient mal a la relecture d'une page et sautent aux yeux a
// l'echelle du site entier :
//
//   1. la construction negative-contrastive — « ce n'est pas X, c'est Y »,
//      « non pas X mais Y », « il ne s'agit pas de X ». Une fois, c'est une
//      figure ; trente fois, c'est une signature ;
//   2. les tournures de remplissage que produit n'importe quel generateur
//      — « c'est la que se joue », « au coeur de », « veritable », « met en
//      lumiere » ;
//   3. la repetition de forme : quinze phrases qui commencent par les memes
//      trois mots, ou deux phrases jumelles a deux sections d'ecart.
//
// On lit les chaines de caracteres des fichiers de contenu, on ne parse pas le
// JSX : ce qui compte ici, c'est le texte, d'ou qu'il vienne.
//
//   node scripts/auditer-prose.mjs            resume
//   node scripts/auditer-prose.mjs --detail   chaque occurrence, avec sa ligne

import { readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const DETAIL = process.argv.includes('--detail');

const FICHIERS = [
  'src/App.jsx',
  'src/narrativesData.js',
  'src/data/glossary.js',
  'src/data/library.js',
  'src/data/methodConventions.js',
  'src/data/genericDesc.js',
];

// --- Extraction des chaines --------------------------------------------------
// Un petit automate plutot qu'une expression reguliere : les apostrophes
// francaises (« l'Union ») cassent tout motif naif sur les quotes simples.
function chaines(src) {
  const out = [];
  let i = 0, ligne = 1;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '\n') { ligne++; i++; continue; }
    // Commentaires : leur contenu n'est pas du texte affiche.
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') ligne++; i++; }
      i += 2; continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const debut = ligne;
      const q = c;
      i++;
      let val = '';
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { val += src[i + 1]; i += 2; continue; }
        if (src[i] === '\n') ligne++;
        val += src[i]; i++;
      }
      i++;
      out.push({ texte: val, ligne: debut });
      continue;
    }
    i++;
  }
  return out;
}

// Est-ce de la prose francaise destinee au lecteur ?
const FR = /[àâçéèêëîïôùûüœ]|\b(le|la|les|des|une|un|dans|pour|par|sur|que|qui|est|sont|cette|ces|aux|leur)\b/i;
const estProse = (t) =>
  t.length >= 40 &&
  / /.test(t) &&
  FR.test(t) &&
  !/^[A-Z_]+$/.test(t) &&
  !/^https?:|^\/|^#|^[\w-]+\.(js|css|png|svg|json)$/i.test(t) &&
  !/^[\w\s-]*$/.test(t) === false || (t.length >= 40 && / /.test(t) && FR.test(t) && !/^https?:/.test(t));

// --- Les motifs --------------------------------------------------------------
const MOTIFS = [
  // 1. La construction negative-contrastive.
  ['négation contrastive', [
    /\bce n[’']est pas\b/gi,
    /\bce ne sont pas\b/gi,
    /\bil ne s[’']agit pas\b/gi,
    /\bn[’']est pas (?:un|une|le|la|les|de|d[’'])[^.;!?]{0,70}?[,:] c[’']est\b/gi,
    /\bne sont pas [^.;!?]{0,70}?[,:] (?:ce sont|c[’']est)\b/gi,
    /\bn[’']est pas [^.;!?]{0,60}?\bmais\b/gi,
    /\bne sont pas [^.;!?]{0,60}?\bmais\b/gi,
    /\bnon pas [^.;!?]{0,50}?\bmais\b/gi,
    /\bnon (?:un|une|le|la|les) [^.;!?]{0,40}?\bmais\b/gi,
    /\bpas seulement [^.;!?]{0,60}?\bmais\b/gi,
    /\bnon seulement\b/gi,
    /\bloin d[’']être\b/gi,
    /\bce n[’']est pas un hasard\b/gi,
  ]],
  // 2. Le remplissage.
  ['tournure de remplissage', [
    /\bc[’']est là que\b/gi,
    /\bau c(?:œ|oe)ur d[eu]\b/gi,
    /\bvéritable(?:s)?\b/gi,
    /\bmet(?:tent)? en lumière\b/gi,
    /\bsouligne(?:nt)? l[’']importance\b/gi,
    /\btémoigne(?:nt)? d[eu]\b/gi,
    /\bs[’']inscri(?:t|vent) dans\b/gi,
    /\bjoue(?:nt)? un rôle\b/gi,
    /\bil (?:est|convient) important(?:e)? de noter\b/gi,
    /\bil convient de\b/gi,
    /\bforce est de\b/gi,
    /\ben réalité\b/gi,
    /\bautrement dit\b/gi,
    /\ben d[’']autres termes\b/gi,
    /\bà la fois [^.;!?]{0,40}? et\b/gi,
    /\bil ne suffit pas\b/gi,
    /\bpermet(?:tent)? de mieux\b/gi,
    /\bincontournable\b/gi,
    /\bcrucial(?:e|es|aux)?\b/gi,
    /\bfondamental(?:e|es|aux)?\b/gi,
    /\bclé de voûte\b/gi,
    /\bpierre angulaire\b/gi,
    /\bà l[’']heure où\b/gi,
    /\bplus que jamais\b/gi,
  ]],
];

// --- Lecture -----------------------------------------------------------------
const phrases = [];      // pour la repetition de forme
const trouvailles = new Map();

for (const rel of FICHIERS) {
  let src;
  try { src = readFileSync(join(RACINE, rel), 'utf8'); } catch { continue; }
  for (const { texte, ligne } of chaines(src)) {
    if (!estProse(texte)) continue;
    for (const [famille, regs] of MOTIFS) {
      for (const re of regs) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(texte))) {
          if (!trouvailles.has(famille)) trouvailles.set(famille, []);
          const autour = texte.slice(Math.max(0, m.index - 46), m.index + m[0].length + 46);
          trouvailles.get(famille).push({ rel, ligne, motif: m[0], autour, cle: re.source });
          if (m[0].length === 0) re.lastIndex++;
        }
      }
    }
    // Decoupage en phrases pour l'analyse de forme.
    //
    // Deux familles de repetitions sont legitimes et polluent le releve : une
    // reference bibliographique citee par dix fiches DOIT etre identique, et un
    // texte de loi cite pour deux pays voisins l'est parce que les deux pays
    // ont adopte la meme formule. On les ecarte de l'analyse de forme, pas de
    // celle des tics.
    // `//` dans une phrase trahit un commentaire capture par erreur : une
    // expression reguliere contenant une apostrophe ouvre une fausse chaine
    // pour l'automate. On les ecarte du releve de forme.
    const citation = /\(\d{4}\)|^[A-Z]{2,}(?:\/[A-Z]{2,})+|\b\d{4}\)|^«|^"|\/\//;
    for (const p of texte.split(/(?<=[.!?])\s+/)) {
      const t = p.trim();
      if (t.length >= 45 && !citation.test(t)) phrases.push({ t, rel, ligne });
    }
  }
}

// --- 3. Repetition de forme --------------------------------------------------
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s']/g, ' ').replace(/\s+/g, ' ').trim();

const ouvertures = new Map();
for (const p of phrases) {
  const mots = norm(p.t).split(' ').slice(0, 3).join(' ');
  if (mots.split(' ').length < 3) continue;
  if (!ouvertures.has(mots)) ouvertures.set(mots, []);
  ouvertures.get(mots).push(p);
}

const VIDES = new Set(['le','la','les','des','de','du','un','une','et','ou','a','au','aux','en','dans',
  'pour','par','sur','que','qui','ne','pas','plus','est','sont','ce','cette','ces','son','sa','ses',
  'leur','leurs','il','elle','ils','elles','on','se','y','d','l','n','s','c','qu','the','of','to','in']);
const sac = (s) => new Set(norm(s).split(' ').filter(m => m.length > 2 && !VIDES.has(m)));
const jaccard = (A, B) => {
  if (!A.size || !B.size) return 0;
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
};

const sacs = phrases.map(p => ({ ...p, s: sac(p.t) }));
const jumelles = [];
for (let i = 0; i < sacs.length; i++) {
  for (let j = i + 1; j < sacs.length; j++) {
    const sc = jaccard(sacs[i].s, sacs[j].s);
    if (sc >= 0.55) jumelles.push({ a: sacs[i], b: sacs[j], sc });
  }
}
jumelles.sort((x, y) => y.sc - x.sc);

// --- Rendu -------------------------------------------------------------------
const tiret = (n) => '-'.repeat(n);
console.log('\n=== Prose : ' + phrases.length + ' phrases relevees dans ' + FICHIERS.length + ' fichiers\n');

let total = 0;
for (const [famille, liste] of trouvailles) {
  total += liste.length;
  console.log(famille.toUpperCase() + '  ' + liste.length + ' occurrences');
  const parMotif = new Map();
  for (const t of liste) {
    const k = t.motif.toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
    parMotif.set(k, (parMotif.get(k) || 0) + 1);
  }
  [...parMotif].sort((a, b) => b[1] - a[1]).slice(0, 14)
    .forEach(([k, v]) => console.log('   ' + String(v).padStart(4) + '  ' + k));
  if (DETAIL) {
    console.log('   ' + tiret(60));
    liste.forEach(t => console.log('   ' + (relative(RACINE, join(RACINE, t.rel)) + ':' + t.ligne).padEnd(30) + ' … ' + t.autour.replace(/\s+/g, ' ') + ' …'));
  }
  console.log('');
}

console.log('OUVERTURES REPETEES  (memes trois premiers mots)');
[...ouvertures.entries()].filter(([, v]) => v.length >= 4).sort((a, b) => b[1].length - a[1].length)
  .slice(0, 16).forEach(([k, v]) => {
    console.log('   ' + String(v.length).padStart(4) + '  « ' + k + ' … »');
    if (DETAIL) v.slice(0, 6).forEach(p => console.log('         ' + p.rel + ':' + p.ligne + '  ' + p.t.slice(0, 92)));
  });

// --- Les titres se ressemblent-ils entre eux ? -----------------------------
//
// Le controle des ouvertures repetees porte sur les phrases, et laissait donc
// passer les titres. A propos alignait quatre titres de meme rang sur le meme
// moule — « Une plateforme nee de la recherche », « Une approche fondee sur
// les donnees », « Une perspective ancree dans les Suds », « Une plateforme en
// evolution permanente » —, dont deux mots pour mot identiques sur deux mots.
// A l'oeil, c'est le defaut le plus visible d'une page ; a la lecture ligne a
// ligne du code, le moins reperable.
const titres = [];
for (const f of FICHIERS) {
  let src;
  try { src = readFileSync(join(RACINE, f), 'utf8'); } catch { continue; }
  for (const m of src.matchAll(/(\w*title\w*|titre)\s*:\s*"((?:[^"\\]|\\.){6,})"/g)) {
    const t = m[2].replace(/\\"/g, '"').trim();
    if (/[<>{}]/.test(t)) continue;
    titres.push(t);
  }
}
const deuxMots = new Map();
for (const t of titres) {
  const k = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
             .split(/[^a-z0-9']+/).filter(Boolean).slice(0, 2).join(' ');
  if (k.split(' ').length < 2) continue;
  if (!deuxMots.has(k)) deuxMots.set(k, []);
  deuxMots.get(k).push(t);
}
const moules = [...deuxMots.entries()].filter(([, v]) => v.length >= 3)
  .sort((a, b) => b[1].length - a[1].length);
console.log('\nTITRES SUR LE MEME MOULE  (memes deux premiers mots, 3 fois ou plus) : ' + moules.length);
moules.slice(0, 8).forEach(([k, v]) => {
  console.log('   ' + v.length + '  « ' + k + ' … »');
  v.slice(0, 4).forEach(t => console.log('        ' + t.slice(0, 68)));
});

console.log('\nPHRASES JUMELLES  (Jaccard >= 0,55) : ' + jumelles.length);
jumelles.slice(0, DETAIL ? 40 : 10).forEach(p => {
  console.log('\n   ' + p.sc.toFixed(2) + '  ' + p.a.rel + ':' + p.a.ligne + '  /  ' + p.b.rel + ':' + p.b.ligne);
  console.log('     A  ' + p.a.t.slice(0, 108));
  console.log('     B  ' + p.b.t.slice(0, 108));
});

console.log('\n' + tiret(64));
console.log('total tics : ' + total + '   ouvertures repetees : ' +
  [...ouvertures.values()].filter(v => v.length >= 4).length +
  '   phrases jumelles : ' + jumelles.length + '\n');
