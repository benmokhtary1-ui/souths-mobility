// Audit de la casse des titres francais.
//
// Le francais met une capitale au premier mot et aux noms propres, rien de
// plus. L'anglais capitalise chaque mot d'un titre. Quand un bloc a ete ecrit
// a l'anglaise puis traduit, la capitalisation reste : « Cadre d'Indicateurs
// Recommandes », « Le Changement de Paradigme ». A l'oeil c'est invisible mot
// par mot ; a l'echelle du site, cela fait deux typographies dans la meme page.
//
// La detection se calibre sur le corpus lui-meme. Un mot qui apparait des
// dizaines de fois en bas de casse et trois fois avec une capitale au milieu
// d'une phrase est une capitale de titre, pas un nom propre. Aucune liste a
// tenir a jour : ce sont les usages majoritaires du site qui tranchent.
import fs from 'fs';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/data/glossary.js',
                  'src/data/library.js', 'src/data/countries.js', 'src/data/methodConventions.js'];

// Le catalogue anglais vit dans le meme fichier que le francais, et l'anglais
// capitalise ses titres a bon droit. On ne retient donc que les chaines dont
// les mots-outils sont francais : mots grammaticaux frequents des deux cotes,
// comptes l'un contre l'autre.
const OUTILS_FR = /\b(le|la|les|des|du|une|un|et|dans|pour|sur|par|aux|avec|est|sont|leur|leurs|cette|ce|qui|que|plus|entre|au|d'un|d'une|l'|d')\b/gi;
const OUTILS_EN = /\b(the|of|and|in|for|on|by|with|is|are|their|this|that|which|from|at|to|as|its)\b/gi;
const estFrancais = (t) => {
  if (/[àâçéèêëîïôûùüœ]/i.test(t)) return true;
  const fr = (t.match(OUTILS_FR) || []).length;
  const en = (t.match(OUTILS_EN) || []).length;
  return fr > en;
};

// Les chaines litterales du code, avec leur fichier et leur ligne.
const chaines = [];
for (const f of FICHIERS) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, 'utf8');
  src.split(/\r?\n/).forEach((ligne, i) => {
    for (const m of ligne.matchAll(/"((?:[^"\\]|\\.){4,})"/g)) {
      const t = m[1].replace(/\\"/g, '"');
      // On ne garde que du texte : pas de classes CSS, pas de chemins, pas de JSX.
      if (/[<>{}=]|^[a-z-]+(\s+[a-z0-9:[\]/.-]+)+$|^https?:|\.(js|css|svg|png|json)$/.test(t)) continue;
      if (!/[a-zà-ÿ]{3}/.test(t)) continue;
      if (!estFrancais(t)) continue;
      chaines.push({ f, l: i + 1, t });
    }
  });
}

// Usage de chaque mot dans le corpus : combien de fois en bas de casse ?
const bas = new Map(), haut = new Map();
const MOT = /[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ'’-]{2,}/g;
for (const { t } of chaines) {
  for (const m of t.matchAll(MOT)) {
    const w = m[0];
    const k = w.toLowerCase();
    if (w === k) bas.set(k, (bas.get(k) || 0) + 1);
    else if (w[0] === w[0].toUpperCase() && w.slice(1) === w.slice(1).toLowerCase())
      haut.set(k, (haut.get(k) || 0) + 1);
  }
}

// Un mot est « commun » si le site l'ecrit majoritairement en bas de casse.
const commun = (k) => (bas.get(k) || 0) >= 3 && (bas.get(k) || 0) > (haut.get(k) || 0);

const suspects = [];
for (const { f, l, t } of chaines) {
  const mots = [...t.matchAll(MOT)];
  const touches = [];
  for (const m of mots) {
    const w = m[0], k = w.toLowerCase(), i = m.index;
    if (w === k || w !== w[0].toUpperCase() + w.slice(1).toLowerCase()) continue;
    // Debut de chaine ou debut de phrase : capitale legitime.
    const avant = t.slice(0, i).replace(/\s+$/, '');
    if (!avant || /[.!?:;»"(—–-]$/.test(avant)) continue;
    if (!commun(k)) continue;
    touches.push(w);
  }
  if (touches.length >= 2) suspects.push({ f, l, t, touches });
}

console.log('=== Capitales de titre a l\'anglaise dans des chaines francaises ===');
console.log(chaines.length + ' chaines analysees, ' + suspects.length + ' suspectes\n');
suspects.slice(0, 200).forEach(s => {
  console.log('  ' + s.f + ':' + s.l);
  console.log('     ' + s.t.slice(0, 120));
  console.log('     mots : ' + s.touches.join(', '));
});
if (suspects.length > 200) console.log('\n  ... et ' + (suspects.length - 200) + ' autres');
