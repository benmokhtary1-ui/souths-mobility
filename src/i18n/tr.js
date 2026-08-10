// Resolution d'une chaine multilingue.
//
// Tout le contenu du site est stocke sous la forme { fr: '…', en: '…' }. Cette
// forme n'a rien de bilingue en soi : c'est un dictionnaire. En passant par
// `tr`, la meme donnee accepte { fr, en, ar, pt, es, sw } sans qu'aucun des
// deux mille points d'appel n'ait a changer — il suffit d'ajouter la cle.
//
// C'etait le vrai verrou. Un `lang === 'fr' ? a : b` ecrit en dur n'a que deux
// branches : il faudrait le reecrire pour chaque langue ajoutee.

import { LANGUES, REPLI, LANGUE_DEFAUT, tagDe } from './langues.js';

export const tr = (valeur, lang = LANGUE_DEFAUT) => {
  if (valeur === null || valeur === undefined) return '';
  if (typeof valeur === 'string' || typeof valeur === 'number') return valeur;
  if (Array.isArray(valeur)) return valeur;
  if (typeof valeur !== 'object') return String(valeur);

  if (valeur[lang] !== undefined && valeur[lang] !== null && valeur[lang] !== '') return valeur[lang];
  for (const r of REPLI) {
    if (valeur[r] !== undefined && valeur[r] !== null && valeur[r] !== '') return valeur[r];
  }
  // Dernier recours : la premiere langue connue presente dans l'objet. On ne
  // renvoie jamais l'objet lui-meme, qui s'afficherait « [object Object] ».
  for (const k of Object.keys(LANGUES)) if (valeur[k]) return valeur[k];
  return '';
};

// Fabrique le raccourci employe dans les composants. Les appels existants sont
// positionnels — L(fr, en) — et le restent ; les langues suivantes viennent en
// arguments nommes : L(fr, en, { ar: '…', sw: '…' }).
export const faireL = (lang) => (fr, en, autres) => {
  if (autres && typeof autres === 'object') return tr({ fr, en, ...autres }, lang);
  return tr({ fr, en }, lang);
};

// Les pluriels ne se traitent pas par un « s » conditionnel. L'arabe compte six
// formes (zero, un, deux, quelques, beaucoup, autre), le francais deux, le
// kiswahili deux. `Intl.PluralRules` designe la forme ; le catalogue la fournit.
//
//   pluriel(n, lang, { one: '{n} pays', other: '{n} pays' })
const CACHE_PR = new Map();
const reglesPluriel = (lang) => {
  const tag = tagDe(lang);
  if (!CACHE_PR.has(tag)) {
    try { CACHE_PR.set(tag, new Intl.PluralRules(tag)); }
    catch { CACHE_PR.set(tag, new Intl.PluralRules('en')); }
  }
  return CACHE_PR.get(tag);
};

export const pluriel = (n, lang, formes) => {
  if (!formes) return String(n);
  const categorie = reglesPluriel(lang).select(n);
  const gabarit = formes[categorie] ?? formes.other ?? formes.one ?? '';
  return String(gabarit).replace(/\{n\}/g, new Intl.NumberFormat(tagDe(lang)).format(n));
};

// Le catalogue principal — l'objet `t` — etait lu par un simple `t[lang]`.
// Une langue absente rendait alors `undefined`, et la premiere lecture
// (`text.headers…`) faisait tomber toute l'application : ecran blanc, pas un
// texte en anglais. Le repli doit valoir a chaque niveau, pas seulement pour
// les chaines terminales.
//
// D'ou ce mandataire : il empile les catalogues de la langue demandee puis des
// langues de repli, et resout chaque cle en descendant la pile. Les tableaux
// et les chaines sont rendus tels quels ; seuls les objets sont re-enveloppes.
export const catalogue = (t, lang = LANGUE_DEFAUT) => {
  const codes = [lang, ...REPLI].filter((c, i, a) => a.indexOf(c) === i);
  const pile = codes.map(c => t?.[c]).filter(Boolean);
  if (!pile.length) return {};

  const envelopper = (niveaux) => new Proxy(Object.create(null), {
    get(_, cle) {
      if (cle === Symbol.toPrimitive || cle === 'toJSON') return undefined;
      for (const n of niveaux) {
        const v = n?.[cle];
        if (v === undefined || v === null || v === '') continue;
        if (typeof v === 'object' && !Array.isArray(v)) {
          return envelopper(niveaux.map(x => x?.[cle]).filter(Boolean));
        }
        return v;
      }
      return undefined;
    },
    has(_, cle) { return niveaux.some(n => n && cle in n); },
    ownKeys() { return [...new Set(niveaux.flatMap(n => Object.keys(n || {})))]; },
    getOwnPropertyDescriptor() { return { enumerable: true, configurable: true }; },
  });

  return envelopper(pile);
};

// Sens de lecture et etiquette de langue, poses sur <html>. Le CSS et les
// proprietes logiques font le reste : rien d'autre n'a besoin de savoir qu'on
// lit de droite a gauche.
export const appliquerLangue = (lang) => {
  if (typeof document === 'undefined') return;
  const racine = document.documentElement;
  racine.lang = lang;
  racine.dir = LANGUES[lang]?.dir || 'ltr';
};
