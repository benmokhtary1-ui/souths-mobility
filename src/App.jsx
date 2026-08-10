import React, { useState, useMemo, useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { 
  Globe, ShieldAlert, TrendingUp, MapPin, Database, 
  ArrowRight, Languages, Activity, Users, Scale, Leaf, 
  Search, HeartPulse, ChevronRight, ChevronDown, X, BarChart3, GitMerge, 
  Download, Printer, Map as MapIcon, Info, BookOpen, CheckCircle2, 
  PieChart, TableProperties, Landmark, Quote, Unlock, Target, ExternalLink, FileText,
  Copy, Check, Mail, AlertCircle, XCircle, AlertTriangle, HelpCircle, MinusCircle,
  Briefcase, Brain, Lightbulb, Compass, Star, Clock, Sparkles, Calendar, Mic, Type
} from 'lucide-react';
import { evidenceCheckData } from './narrativesData';
import { africaCountryPaths, AFRICA_VIEWBOX } from './africaMapPaths';
import { censusByCountry, censusRoundMeta, census2020Status } from './censusData';
import { unhcrByCountry, unhcrTotals, UNHCR_SOURCE } from './unhcrData';
import { findexByCountry, FINDEX_SOURCE } from './findexData';
import { iiagRank, IIAG_SOURCE } from './iiagData';

// ============================================================================
// 1. FONCTIONS ET COMPOSANTS UTILITAIRES
// ============================================================================

// Construit un CSV RFC-4180 à partir d'un tableau d'objets (échappe guillemets et séparateurs).
const toCSV = (rows) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const cell = (v) => {
    const s = v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => cell(r[c])).join(','))].join('\n') + '\n';
};

// Bouton d'export réutilisable : garantit que tout jeu de données affiché est téléchargeable.
const CsvButton = ({ onClick, label, className = '' }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-4 py-2 rounded-sm font-bold text-xs transition-all border border-slate-300 shadow-sm shrink-0 print:hidden ${className}`}
  >
    <Download className="w-3.5 h-3.5" /> <span>{label}</span>
  </button>
);

const downloadCSV = (filename, csvBody) => {
  const blob = new Blob([String.fromCharCode(0xFEFF) + csvBody], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

// Separateur decimal localise : la virgule en francais, le point en anglais.
// Les valeurs brutes sont des nombres JS, elles arrivent donc avec un point.
const fmtNum = (val, lang) => {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val);
  return lang === 'fr' ? str.replace('.', ',') : str;
};

// --- Nombres -----------------------------------------------------------------
// Un grand nombre ne se lit pas chiffre a chiffre : il se lit par tranches de
// trois. Le separateur de groupe est donc traite ici comme une respiration
// typographique et non comme un caractere parmi d'autres — il garde sa valeur
// textuelle (copier-coller, lecteurs d'ecran) mais recoit une marge propre.
// Cette marge est logique (margin-inline), donc elle suivra le sens de lecture
// le jour ou l'arabe rejoindra les langues de la plateforme.
const LOCALES = { fr: 'fr-FR', en: 'en-US' };
const localeOf = (lang) => LOCALES[lang] || LOCALES.en;

const toNumber = (val) => {
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (val === undefined || val === null || val === '') return null;
  const s = String(val).replace(/[\s  ]/g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

// Intl produit une espace fine insecable (U+202F) comme separateur de groupe en
// francais. Verifie dans le navigateur : Chrome n'applique PAS word-spacing a ce
// caractere, alors qu'il l'applique a l'espace insecable ordinaire (U+00A0). On
// normalise donc vers U+00A0, ce qui rend la tranche de trois elargissable en CSS
// pour tous les nombres du site, y compris ceux rendus sous forme de chaine.
const GROUP_SEP = /[  ]/g;

const formatNumber = (val, lang = 'fr') => {
  if (val === undefined || val === null) return '0';
  const strVal = String(val);
  if (strVal.includes('M') || strVal.includes('k')) return strVal;   // deja abrege
  const n = toNumber(strVal);
  if (n === null) return val;
  return new Intl.NumberFormat(localeOf(lang)).format(n).replace(GROUP_SEP, ' ');
};

// Version JSX : identique, mais chaque separateur de groupe devient un element
// qu'on peut espacer. C'est ce qui rend la coupure million / millier evidente.
const Num = ({ value, lang = 'fr', unit = null, className = '', ...rest }) => {
  const n = toNumber(value);
  if (n === null) return <span className={className} {...rest}>{value}</span>;
  const parts = new Intl.NumberFormat(localeOf(lang)).formatToParts(n);
  return (
    <span className={`num ${className}`.trim()} {...rest}>
      {parts.map((p, i) =>
        p.type === 'group'
          ? <span key={i} className="num-sep">{p.value.replace(GROUP_SEP, ' ')}</span>
          : <span key={i}>{p.value}</span>
      )}
      {unit ? <span className="num-unit">{unit}</span> : null}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Lisibilite : deux dispositifs, un seul principe
// ---------------------------------------------------------------------------
// Des lecteurs non specialistes ont bute sur la plateforme. Le diagnostic n'est
// pas que le contenu soit trop savant — c'est qu'il n'existait qu'un seul
// niveau de lecture, celui de l'auteur. On en ajoute un second, en dessous,
// sans rien retirer au premier :
//   1. <Terme> : le mot technique s'explique sur place, en une phrase.
//   2. <EnClair> : le bloc dit d'abord ce qu'il montre, avant de le demontrer.
// Regle d'ecriture pour ces deux couches : une phrase, pas de sigle non
// developpe, pas de subordonnee. Si on ne peut pas le dire simplement, c'est
// qu'on ne sait pas encore ce qu'on veut dire.

const PLAIN_TERMS = {
  avoi: {
    label: { fr: 'AVOI', en: 'AVOI' },
    fr: "Une note sur 100 qui mesure à quel point un pays africain laisse entrer les autres Africains sans visa. 100 = aucun visa demandé à personne sur le continent.",
    en: 'A score out of 100 measuring how freely an African country lets other Africans in without a visa. 100 = no visa asked of anyone on the continent.',
  },
  zlecaf: {
    label: { fr: 'ZLECAf', en: 'AfCFTA' },
    fr: "La zone de libre-échange continentale africaine : le grand accord commercial qui doit permettre aux marchandises de circuler entre pays africains sans droits de douane.",
    en: 'The African Continental Free Trade Area: the continent-wide trade agreement meant to let goods move between African countries without customs duties.',
  },
  ancrage: {
    label: { fr: "score d'ancrage", en: 'anchoring score' },
    fr: "Un compte simple, de 0 à 6 : combien des six grands textes de l'Union africaine un pays a-t-il officiellement ratifiés. C'est une mesure construite pour cette plateforme.",
    en: 'A simple count from 0 to 6: how many of the African Union’s six major instruments a country has formally ratified. It is a measure built for this platform.',
  },
  iiag: {
    label: { fr: 'IIAG', en: 'IIAG' },
    fr: "L'Indice Ibrahim de la gouvernance africaine : un classement annuel qui note la qualité de la gouvernance des 54 pays du continent. Rang 1 = le mieux classé.",
    en: 'The Ibrahim Index of African Governance: an annual ranking scoring the quality of governance in all 54 African countries. Rank 1 = best placed.',
  },
  kampala: {
    label: { fr: 'Convention de Kampala', en: 'Kampala Convention' },
    fr: "Le traité africain de 2009 qui protège les personnes chassées de chez elles mais restées dans leur propre pays. C'est le seul texte contraignant au monde sur ce sujet.",
    en: 'The 2009 African treaty protecting people driven from their homes but still inside their own country. It is the only binding treaty in the world on this.',
  },
  retention: {
    label: { fr: 'rétention Sud-Sud', en: 'South-South retention' },
    fr: "La part des personnes parties d'un pays qui sont restées en Afrique, plutôt que d'aller vers l'Europe ou l'Amérique du Nord.",
    en: 'The share of people who left a country and stayed within Africa, rather than heading to Europe or North America.',
  },
  capabilites: {
    label: { fr: 'capabilités de mouvement', en: 'movement capabilities' },
    fr: "L'idée qu'on ne part pas seulement parce qu'on le veut, mais parce qu'on le peut : il faut un passeport, un visa, de l'argent, un droit. Vouloir partir et pouvoir partir sont deux choses différentes.",
    en: 'The idea that people do not move only because they want to, but because they can: it takes a passport, a visa, money, a legal right. Wanting to leave and being able to leave are two different things.',
  },
  apatridie: {
    label: { fr: 'apatridie', en: 'statelessness' },
    fr: "Le fait de n'être reconnu comme citoyen par aucun pays au monde. Sans nationalité, on ne peut souvent ni travailler légalement, ni voyager, ni être soigné.",
    en: 'Being recognised as a citizen by no country at all. Without a nationality, people often cannot work legally, travel, or get healthcare.',
  },
  gcm: {
    label: { fr: 'Pacte mondial (GCM)', en: 'Global Compact (GCM)' },
    fr: "Le Pacte mondial des Nations unies sur les migrations, adopté en 2018. Il fixe des objectifs communs mais n'oblige juridiquement aucun État : un pays peut l'approuver sans rien changer chez lui.",
    en: 'The United Nations Global Compact for Migration, adopted in 2018. It sets shared objectives but legally binds no state: a country can endorse it and change nothing at home.',
  },
  stock: {
    label: { fr: 'stock de migrants', en: 'migrant stock' },
    fr: "Le nombre de personnes nées à l'étranger qui vivent dans un pays à une date donnée. C'est une photo, pas un flux : ça ne dit pas combien sont arrivées cette année.",
    en: 'The number of foreign-born people living in a country on a given date. It is a snapshot, not a flow: it does not say how many arrived this year.',
  },
  cer: {
    label: { fr: 'CER', en: 'REC' },
    fr: "Les communautés économiques régionales : les blocs qui regroupent les pays africains par région, comme la CEDEAO en Afrique de l'Ouest. Ce sont elles qui décident la libre circulation dans les faits.",
    en: 'Regional Economic Communities: the blocs grouping African countries by region, such as ECOWAS in West Africa. In practice, they are where free movement is decided.',
  },
  oam: {
    label: { fr: 'OAM', en: 'AMO' },
    fr: "L'Observatoire africain des migrations, créé par l'Union africaine et installé à Rabat. Sa mission est de produire les chiffres africains sur les migrations, plutôt que de dépendre de ceux venus d'ailleurs.",
    en: 'The African Migration Observatory, created by the African Union and based in Rabat. Its mandate is to produce African migration figures rather than depend on figures produced elsewhere.',
  },
  spearman: {
    label: { fr: 'corrélation de rang', en: 'rank correlation' },
    fr: "Une mesure qui dit si deux classements se ressemblent. 0 : aucun lien. 1 : les deux classements sont identiques. Un résultat proche de 0 signifie que les deux choses n'ont rien à voir.",
    en: 'A measure of whether two rankings resemble each other. 0: no link. 1: the two rankings are identical. A result near 0 means the two things are unrelated.',
  },
  cycle: {
    label: { fr: 'cycle de recensement', en: 'census round' },
    fr: "La fenêtre de dix ans pendant laquelle l'ONU recommande à chaque pays de compter sa population. Le cycle 2020 couvre les années 2015 à 2024.",
    en: 'The ten-year window in which the UN recommends every country count its population. The 2020 round covers the years 2015 to 2024.',
  },
  desa: {
    label: { fr: 'UN DESA', en: 'UN DESA' },
    fr: "Le service statistique des Nations unies qui publie les chiffres de référence sur les migrants dans le monde. C'est la source la plus citée, y compris pour l'Afrique.",
    en: 'The United Nations statistical office that publishes the reference figures on migrants worldwide. It is the most cited source, including for Africa.',
  },
};

// Le mot technique s'explique la ou il est lu. Le panneau est en position fixe :
// cale sur la position reelle du bouton, il ne peut etre ni rogne par un parent
// a overflow cache, ni provoquer de debordement horizontal.
const Terme = ({ k, lang = 'fr', children }) => {
  const [open, setOpen] = useState(false);
  const [box, setBox] = useState(null);
  const ref = useRef(null);
  const entry = PLAIN_TERMS[k];
  if (!entry) return <>{children}</>;

  const popRef = useRef(null);

  // Placement en deux temps. Le premier pose le panneau sous le terme ; le
  // second, une fois qu'il est monte, le mesure reellement et le recale pour
  // qu'il tienne dans l'ecran. Deviner sa hauteur a l'avance ne marche pas :
  // elle depend de la longueur de la definition et de la largeur disponible.
  const place = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(300, window.innerWidth - 24);
    const left = Math.max(12, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 12));
    const h = popRef.current?.getBoundingClientRect().height || 0;
    const margin = 12;
    let top = r.bottom + 8;
    if (h && top + h > window.innerHeight - margin) top = r.top - 8 - h;   // on bascule au-dessus
    // Puis on borne, sans condition : le terme peut se trouver hors de l'ecran
    // (ancre dans un conteneur qui a defile), et le panneau doit rester lisible.
    if (h) top = Math.max(margin, Math.min(top, window.innerHeight - h - margin));
    setBox({ left, w, top });
  };

  // useLayoutEffect : on recale avant peinture, sinon le panneau saute a l'ecran.
  useLayoutEffect(() => { if (open && popRef.current) place(); }, [open, box?.w]);

  useEffect(() => {
    if (!open) return;
    place();
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') { setOpen(false); ref.current?.focus(); } };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  const label = entry.label[lang] || entry.label.fr;
  return (
    <span className="terme-wrap">
      <button
        ref={ref}
        type="button"
        className="terme"
        aria-expanded={open}
        aria-label={`${label} — ${lang === 'fr' ? 'voir la définition simple' : 'show the plain definition'}`}
        onClick={() => setOpen((o) => !o)}
      >
        {children || label}
      </button>
      {open && box && (
        <span
          ref={popRef}
          role="tooltip"
          className="terme-pop"
          style={{ left: box.left, width: box.w, top: box.top }}
        >
          <span className="terme-pop-lbl">{lang === 'fr' ? 'En clair' : 'In plain terms'}</span>
          <span className="terme-pop-txt">{entry[lang] || entry.fr}</span>
        </span>
      )}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Preferences de lecture
// ---------------------------------------------------------------------------
// « Rendre le site accessible a tout type de cerveau » ne se traite pas en
// devinant : ce qui aide un lecteur en gene un autre — le fer a gauche soulage
// la dyslexie mais l'auteur tient a la justification, l'interligne ample aide
// certains et disperse d'autres. On rend donc la main au lecteur, et on retient
// son choix. Chaque reglage n'est qu'un attribut sur <html> : le CSS fait le
// reste, aucun composant du site n'a besoin de les connaitre.

const LECTURE_REGLAGES = [
  { cle: 'align', defaut: 'justifie',
    titre: { fr: 'Alignement du texte', en: 'Text alignment' },
    aide: { fr: "Le fer à gauche supprime les blancs irréguliers entre les mots.",
            en: 'Ragged-right removes the uneven gaps between words.' },
    options: [
      { val: 'justifie', lib: { fr: 'Justifié', en: 'Justified' } },
      { val: 'fil',      lib: { fr: 'Au fil du texte', en: 'Ragged right' } },
    ] },
  { cle: 'air', defaut: 'normal',
    titre: { fr: 'Espacement', en: 'Spacing' },
    aide: { fr: "Plus d'air entre les lignes et les lettres.",
            en: 'More air between lines and letters.' },
    options: [
      { val: 'normal', lib: { fr: 'Normal', en: 'Normal' } },
      { val: 'ample',  lib: { fr: 'Aéré', en: 'Airy' } },
    ] },
  { cle: 'corps', defaut: 'normal',
    titre: { fr: 'Taille du texte', en: 'Text size' },
    aide: { fr: "Agrandit tout le texte de la page.", en: 'Enlarges all text on the page.' },
    options: [
      { val: 'normal', lib: { fr: 'Normale', en: 'Normal' } },
      { val: 'grand',  lib: { fr: 'Grande', en: 'Large' } },
    ] },
  { cle: 'mesure', defaut: 'normale',
    titre: { fr: 'Largeur des lignes', en: 'Line width' },
    aide: { fr: "Des lignes plus courtes demandent moins d'allers-retours à l'œil.",
            en: 'Shorter lines mean fewer eye movements per line.' },
    options: [
      { val: 'normale', lib: { fr: 'Normale', en: 'Normal' } },
      { val: 'courte',  lib: { fr: 'Étroite', en: 'Narrow' } },
    ] },
];

const PrefsLecture = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const [ouvert, setOuvert] = useState(false);
  const [vals, setVals] = useState(() => {
    const base = Object.fromEntries(LECTURE_REGLAGES.map(r => [r.cle, r.defaut]));
    try {
      const brut = localStorage.getItem('lecture');
      return brut ? { ...base, ...JSON.parse(brut) } : base;
    } catch { return base; }
  });
  const ref = useRef(null);

  useEffect(() => {
    LECTURE_REGLAGES.forEach(r => {
      document.documentElement.setAttribute(`data-lecture-${r.cle}`, vals[r.cle]);
    });
    try { localStorage.setItem('lecture', JSON.stringify(vals)); } catch { /* mode prive */ }
  }, [vals]);

  useEffect(() => {
    if (!ouvert) return;
    const dehors = (e) => { if (!ref.current?.contains(e.target)) setOuvert(false); };
    const esc = (e) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', dehors); document.removeEventListener('keydown', esc); };
  }, [ouvert]);

  const modifies = LECTURE_REGLAGES.filter(r => vals[r.cle] !== r.defaut).length;

  return (
    <div className="prefs" ref={ref}>
      <button type="button" className="prefs-btn" aria-expanded={ouvert}
              onClick={() => setOuvert(o => !o)}>
        <Type className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{L('Lecture', 'Reading')}</span>
        {modifies > 0 && <span className="prefs-pastille" aria-hidden="true">{modifies}</span>}
      </button>

      {ouvert && (
        <div className="prefs-panneau" role="group"
             aria-label={L('Préférences de lecture', 'Reading preferences')}>
          <p className="prefs-intro">
            {L("Réglez la page comme vous la lisez le mieux. Le choix est retenu.",
               'Set the page the way you read best. Your choice is remembered.')}
          </p>
          {LECTURE_REGLAGES.map(r => (
            <fieldset key={r.cle} className="prefs-champ">
              <legend className="prefs-titre">{r.titre[lang]}</legend>
              <div className="prefs-choix">
                {r.options.map(o => (
                  <button key={o.val} type="button"
                          aria-pressed={vals[r.cle] === o.val}
                          onClick={() => setVals(v => ({ ...v, [r.cle]: o.val }))}>
                    {o.lib[lang]}
                  </button>
                ))}
              </div>
              <p className="prefs-aide">{r.aide[lang]}</p>
            </fieldset>
          ))}
          <button type="button" className="prefs-reset"
                  onClick={() => setVals(Object.fromEntries(LECTURE_REGLAGES.map(r => [r.cle, r.defaut])))}>
            {L('Tout remettre par défaut', 'Reset everything')}
          </button>
        </div>
      )}
    </div>
  );
};

// Le bloc annonce ce qu'il montre avant de le demontrer. Une phrase, lisible
// seule : qui s'arrete la doit avoir compris l'essentiel.
const EnClair = ({ lang = 'fr', fr, en, tone = 'accent' }) => (
  <p className={`en-clair en-clair--${tone}`}>
    <span className="en-clair-lbl">{lang === 'fr' ? 'En clair' : 'In plain terms'}</span>
    <span className="en-clair-txt">{lang === 'fr' ? fr : en}</span>
  </p>
);

// Respecte le réglage système « réduire les animations ».
const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Révèle un bloc à l'entrée dans le champ de vision (effet éditorial, pas de dépendance externe).
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    io.observe(el);
    // Filet de sécurité : si l'observateur ne se déclenche jamais (onglet non composité,
    // navigateur exotique), on affiche quand même le contenu plutôt que de le laisser invisible.
    const failsafe = setTimeout(() => setShown(true), 1200);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(14px)',
        transition: `opacity 620ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 620ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Compteur animé : le chiffre monte lorsqu'il devient visible.
const CountUp = ({ value, duration = 1100, className = '' }) => {
  const ref = useRef(null);
  const [display, setDisplay] = useState(prefersReducedMotion() ? value : 0);

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) {
      setDisplay(value);
      return;
    }
    let raf;
    let done = false;      // l'animation a demarre
    let arrive = false;    // l'animation est allee jusqu'au bout
    const run = () => {
      if (done) return;
      done = true;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
        else arrive = true;
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) run(); },
      { threshold: 0.3 }
    );
    io.observe(el);
    // Filet de securite : il doit garantir la VALEUR FINALE, pas seulement le
    // demarrage. L'ancienne version ne s'activait que si l'animation n'avait pas
    // commence ; or requestAnimationFrame ne tourne pas dans un onglet en
    // arriere-plan. L'animation demarrait, n'avancait jamais, et le chiffre de
    // une restait bloque a zero — c'est ce que montrait le premier ecran.
    const failsafe = setTimeout(() => {
      if (!arrive) { done = true; io.disconnect(); if (raf) cancelAnimationFrame(raf); setDisplay(value); }
    }, 1400);
    return () => { io.disconnect(); clearTimeout(failsafe); if (raf) cancelAnimationFrame(raf); };
  }, [value, duration]);

  return <span ref={ref} className={className}>{display}</span>;
};

// Barre de progression de lecture (repère éditorial discret sous la navigation).
const ScrollProgress = () => {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return (
    <div className="h-0.5 w-full print:hidden" style={{ backgroundColor: 'rgba(255,253,249,.10)' }} aria-hidden="true">
      <div
        className="h-full transition-[width] duration-150 ease-out"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-deep), var(--accent) 60%, #8FA0CE)' }}
      />
    </div>
  );
};

const flagSizes = {
  sm: "w-5 h-[0.9375rem]",
  md: "w-8 h-6",
  lg: "w-11 h-[2.0625rem] md:w-14 md:h-[2.625rem]",
};

const CountryFlag = ({ iso2, emoji, size = "md", className = "" }) => {
  if (iso2) {
    return <img src={`/flags/${iso2}.svg`} alt="" className={`inline-block align-middle object-cover ${flagSizes[size] || flagSizes.md} ${className}`} />;
  }
  const emojiTextSize = size === "sm" ? "text-base" : size === "lg" ? "text-4xl md:text-5xl" : "text-3xl";
  return <span className={`flag-emoji ${emojiTextSize} ${className}`}>{emoji}</span>;
};

const LinkedInIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const HistoricalChart = ({ data, colorClass }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => parseFloat(d.value))) * 1.5; 
  return (
    <div className="flex items-end justify-between h-24 w-full gap-2 mt-4 pt-4 border-b-2 border-slate-100 pb-2">
      {data.map((point, i) => {
        const heightPct = (parseFloat(point.value) / maxVal) * 100;
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
            <div 
              className={`w-full max-w-[32px] rounded-t-md transition-all duration-1000 ease-out cursor-pointer shadow-sm group-hover:shadow-md group-hover:opacity-80 ${colorClass} print:!bg-emerald-500`}
              style={{ height: `${Math.max(5, heightPct)}%` }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100 whitespace-nowrap">
                {parseFloat(point.value) > 100 
                  ? (parseFloat(point.value) >= 1000000 ? (parseFloat(point.value)/1000000).toFixed(1) + 'M' : (parseFloat(point.value)/1000).toFixed(0) + 'k') 
                  : point.value + '%'}
              </span>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-2">{point.year}</span>
          </div>
        );
      })}
    </div>
  );
};

const EconomicComparison = ({ remittances, remittancesYear, aid, lang }) => {
  const hasRemittances = remittances !== null && remittances !== undefined;
  const max = Math.max(hasRemittances ? remittances : 0, aid) * 1.1;
  const remPct = (!hasRemittances || max === 0) ? 0 : (remittances / max) * 100;
  const aidPct = max === 0 ? 0 : (aid / max) * 100;
  const remLabel = lang === 'fr'
    ? `Transferts des diasporas (BM, ${remittancesYear || 's.d.'})`
    : `Remittances (World Bank, ${remittancesYear || 'n.d.'})`;

  return (
    <div className="space-y-5 mt-4">
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-amber-600 print:!text-amber-600">{remLabel}</span>
          {hasRemittances ? (
            <span className="text-amber-700 print:!text-amber-700">{remittances}% PIB</span>
          ) : (
            <span className="text-slate-400 italic normal-case tracking-normal print:!text-slate-400">{lang === 'fr' ? "Donnée non disponible" : "Data not available"}</span>
          )}
        </div>
        {hasRemittances ? (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden print:!bg-slate-200">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 print:!bg-amber-500" style={{width: `${remPct}%`}}></div>
          </div>
        ) : (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-dashed border-slate-300 print:!bg-slate-200" title={lang === 'fr' ? "La Banque Mondiale ne publie plus de série récente pour ce pays" : "The World Bank no longer publishes a recent series for this country"}></div>
        )}
      </div>
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-slate-500 print:!text-slate-500">{lang === 'fr' ? "Aide Internationale - APD (OCDE, 2024)" : "International Aid - ODA (OECD, 2024)"}</span>
          <span className="text-slate-600 print:!text-slate-600">{aid}% PIB</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden print:!bg-slate-200">
          <div className="h-full bg-slate-400 rounded-full transition-all duration-1000 print:!bg-slate-400" style={{width: `${aidPct}%`}}></div>
        </div>
      </div>
    </div>
  );
};

const headerAccents = {
  blue: { badge: "bg-blue-900/50 border-blue-800 text-blue-200", highlight: "text-blue-300", border: "border-blue-900/50", bar: "from-blue-500 via-blue-400 to-transparent" },
  emerald: { badge: "bg-emerald-900/50 border-emerald-800 text-emerald-200", highlight: "text-emerald-300", border: "border-emerald-900/50", bar: "from-emerald-500 via-emerald-400 to-transparent" },
  indigo: { badge: "bg-indigo-900/50 border-indigo-800 text-indigo-200", highlight: "text-indigo-300", border: "border-indigo-900/50", bar: "from-indigo-500 via-indigo-400 to-transparent" },
  amber: { badge: "bg-amber-900/50 border-amber-800 text-amber-200", highlight: "text-amber-300", border: "border-amber-900/50", bar: "from-amber-500 via-amber-400 to-transparent" },
  teal: { badge: "bg-teal-900/50 border-teal-800 text-teal-200", highlight: "text-teal-300", border: "border-teal-900/50", bar: "from-teal-500 via-teal-400 to-transparent" },
};

// Onglet actif : un intercalaire de repertoire. Filet terracotta en tete, encre
// legerement relevee, libelle au papier. Un seul accent pour les huit rubriques :
// la couleur signale la position, elle ne code plus la rubrique.
const navTabStyle = (isActive) => isActive
  ? { backgroundColor: '#241E1A', color: '#FFFDF9', borderTopColor: 'var(--accent)',
      boxShadow: 'inset 0 -1px 0 rgba(255,253,249,.06)' }
  : { backgroundColor: 'transparent', color: '#A79E92', borderTopColor: 'transparent' };

// Marque : un disque d'encre traverse par un arc de trajectoire. Lisible a 20 px
// comme a 200 px, fonctionne sur papier comme en reserve sur fond sombre.
const BrandMark = ({ className = "w-8 h-8", tone = "paper", style }) => {
  const ring = tone === "paper" ? "var(--ink)" : "#FFFDF9";
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} role="img" aria-label="South(s) Mobility">
      <circle cx="20" cy="20" r="15.5" fill="none" stroke={ring} strokeWidth="2" opacity=".92" />
      {/* trajectoire : sort du disque, signe la mobilite plutot que la frontiere */}
      <path d="M4 27 C 13 27, 17 8, 27 8 C 33 8, 36 12, 36 12"
            fill="none" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="27" cy="8" r="3.4" fill="var(--accent)" />
    </svg>
  );
};

// Bandeau de section : structure d'origine (fond sombre, grande icone en filigrane,
// filet d'accent) reprise avec la nouvelle palette encre/terracotta et Fraunces.
// Planche d'atlas : le continent grave au trait, en filigrane du bandeau de
// section. Les traces sont ceux que la plateforme utilise deja pour ses cartes,
// dessines ici sans remplissage — la trame des 54 frontieres fait la texture.
const AfricaPlate = React.memo(({ opacity = 0.13 }) => (
  <svg
    viewBox={AFRICA_VIEWBOX}
    aria-hidden="true"
    focusable="false"
    className="atlas-plate absolute pointer-events-none select-none"
    style={{ opacity }}
  >
    <g fill="none" stroke="#FFFDF9" strokeWidth="0.9" strokeLinejoin="round">
      {Object.entries(africaCountryPaths).map(([id, d]) => <path key={id} d={d} />)}
    </g>
  </svg>
));

// Comparaison de proportions : la these du site en une image. Toutes les
// valeurs sont celles du paragraphe voisin, deja sourcees — rien n'est
// introduit ici. Teinte unique, etiquettes directes, pas de legende.
// Afrobarometer : le versant « aspiration » du cadre que la plateforme mobilise.
// Toutes les valeurs proviennent de l'enquete 2024 (24 pays) publiee par
// Afrobarometer ; aucune n'est derivee ni recalculee ici.
const AspirationGap = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const dest = [
    { l: L('Amérique du Nord', 'North America'), v: 31 },
    { l: L('Europe', 'Europe'), v: 29 },
    { l: L("Ailleurs dans la région ou sur le continent", 'Elsewhere in the region or on the continent'), v: 22 },
  ];
  const why = [
    { l: L('Trouver un travail', 'Finding work'), v: 49 },
    { l: L('Échapper à la pauvreté ou aux difficultés économiques', 'Escaping poverty or economic hardship'), v: 29 },
  ];
  const pays = [
    { l: L('Liberia', 'Liberia'), v: 78 },
    { l: L('Gambie', 'The Gambia'), v: 68 },
    { l: L('Cabo Verde', 'Cabo Verde'), v: 64 },
    { l: L('Ghana', 'Ghana'), v: 61 },
    { l: L('Tanzanie', 'Tanzania'), v: 9 },
  ];

  const Row = ({ l, v, color, i }) => (
    <div className="flex items-center gap-3 figure-row px-1 py-1">
      <span className="text-[11px] w-56 shrink-0 leading-snug text-slate-700">{l}</span>
      <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
        <div className={`h-full bar-fill bar-fill--d${Math.min(5, i + 1)}`} style={{ width: `${v}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-10 text-right shrink-0 tabular-nums text-slate-800">{v} %</span>
    </div>
  );

  return (
    <section className="bg-white my-7" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--accent-2)' }}>
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
        <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--accent-2)' }}>
          {L("Ce que la plateforme ne mesurait pas : l'aspiration", 'What the platform was not measuring: aspiration')}
        </span>
        <h3 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
          {L("47 % des Africains ont envisagé de partir. Sept sur dix de ceux qui partent restent en Afrique.",
             '47% of Africans have considered leaving. Seven in ten of those who leave stay in Africa.')}
        </h3>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-justify">
          {L(
            "Cette plateforme s'appuie sur le cadre des « capabilités de mouvement » : la mobilité s'y comprend comme la rencontre entre une aspiration et une capacité effectivement exerçable. Jusqu'ici elle ne mesurait que le second terme — des stocks, des ratifications, des recensements. Afrobarometer, seule enquête menée à l'échelle continentale auprès des citoyens eux-mêmes, permet enfin de chiffrer le premier.",
            'This platform works from the "capabilities of movement" framework: mobility is understood as the meeting of an aspiration with a capability that can actually be exercised. Until now it measured only the second term — stocks, ratifications, censuses. Afrobarometer, the only continental survey of citizens themselves, finally makes the first one countable.'
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
          {[
            { v: '47 %', l: L("ont envisagé de partir", 'have considered leaving'), s: L('24 pays, enquête 2024', '24 countries, 2024 survey'), tone: 'figure-inkblue' },
            { v: '27 %', l: L("y ont pensé « beaucoup »", 'have thought about it "a lot"'), s: L("l'intention, pas le rêve", 'intent, not daydream'), tone: 'figure-terra' },
            { v: '+9', l: L('points depuis 2016-2018', 'points since 2016-2018'), s: L('sur 22 pays comparables', 'across 22 comparable countries'), tone: 'figure-warn' },
          ].map((k, i) => (
            <div key={i} className="border border-slate-200 p-4 lift">
              <div className={`text-2xl font-serif font-bold tabular-nums leading-none ${k.tone}`}>{k.v}</div>
              <span className="block text-[11px] font-bold uppercase tracking-widest mt-2 leading-snug" style={{ color: 'var(--label)' }}>{k.l}</span>
              <span className="block text-[11px] mt-1" style={{ color: 'var(--label)' }}>{k.s}</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L('Où ceux qui envisagent de partir voudraient aller', 'Where those considering leaving would go')}
          </h4>
          {dest.map((d, i) => <Row key={d.l} {...d} color="var(--accent-2)" i={i} />)}
        </div>

        <div>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L('Pourquoi', 'Why')}
          </h4>
          {why.map((d, i) => <Row key={d.l} {...d} color="var(--accent)" i={i} />)}
        </div>

        <div>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L("L'écart entre pays est considérable", 'The gap between countries is considerable')}
          </h4>
          {pays.map((d, i) => <Row key={d.l} {...d} color="var(--ok)" i={i} />)}
        </div>

        <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L("Ce que l'écart démontre", 'What the gap demonstrates')}
          </h4>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
            {L(
              "Soixante pour cent de ceux qui envisagent de partir nomment l'Amérique du Nord ou l'Europe. Or, dans les faits, plus de sept migrants d'origine africaine sur dix restent sur le continent. Ce décalage n'est pas une contradiction dans les données : c'est la définition même de la capabilité. L'aspiration se forme largement en direction du Nord ; la capacité de la réaliser, elle, est distribuée tout autrement — et c'est le régime de mobilité, visas, coûts, routes, accords, qui opère ce tri. Mesurer l'aspiration sans mesurer la capacité produit le récit de l'invasion ; mesurer la capacité sans l'aspiration produit celui de l'immobilité. Il faut les deux (Ben Mokhtar, 2026).",
              'Sixty per cent of those considering leaving name North America or Europe. Yet in fact more than seven in ten migrants of African origin stay on the continent. This discrepancy is not a contradiction in the data: it is the very definition of capability. Aspiration forms largely towards the North; the capacity to realise it is distributed quite differently — and it is the mobility regime, visas, costs, routes, agreements, that does the sorting. Measuring aspiration without capability produces the invasion narrative; measuring capability without aspiration produces the immobility narrative. Both are needed (Ben Mokhtar, 2026).'
            )}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-5">
        <Sources lang={lang} items={[{
          label: L('Afrobarometer — enquête 2024, 24 pays africains',
                   'Afrobarometer — 2024 survey, 24 African countries'),
          url: 'https://www.afrobarometer.org/articles/international-migrants-day-almost-half-of-africans-have-considered-emigrating-afrobarometer-survey-shows/',
        }]}
          note={L("Comparaison à 2016-2018 sur 22 pays. Les parts de destination et de motif portent sur les seuls répondants ayant envisagé de partir.",
                  'Comparison to 2016-2018 across 22 countries. Destination and reason shares cover only respondents who had considered leaving.')} />
      </div>
    </section>
  );
};

const ProportionGap = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const groups = [
    {
      title: L("L'Afrique dans le monde", 'Africa in the world'),
      rows: [
        { label: L('Part de la population mondiale', 'Share of world population'), value: 18, note: '~18 %' },
        { label: L('Part du stock migratoire mondial accueilli', 'Share of the world migrant stock hosted'), value: 9.5, note: '9,5 %' },
      ],
    },
    {
      title: L('Les migrants dans la population', 'Migrants within the population'),
      rows: [
        { label: L('Migrants dans la population mondiale', 'Migrants in the world population'), value: 3.6, note: '3,6 %' },
        { label: L('Migrants dans la population africaine', 'Migrants in Africa\'s population'), value: 2, note: '~2 %' },
      ],
    },
  ];
  return (
    <figure className="my-7 border border-slate-200 bg-white">
      <figcaption className="px-5 py-3 border-b border-slate-200" style={{ backgroundColor: 'var(--paper-sunk)' }}>
        <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-deep)' }}>
          {L('Lecture proportionnelle', 'Reading it proportionally')}
        </h4>
        <span className="block text-[13px] font-semibold text-slate-800 leading-snug">
          {L(
            "Le continent pèse le double de son poids migratoire",
            'The continent weighs twice its migratory weight'
          )}
        </span>
      </figcaption>

      <div className="px-5 py-5 space-y-5">
        {groups.map((g, gi) => (
          <div key={gi} className={gi > 0 ? 'pt-5' : ''} style={gi > 0 ? { borderTop: '1px solid var(--rule)' } : undefined}>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">{g.title}</h4>
            <div className="space-y-2.5">
              {g.rows.map((r, ri) => (
                <div key={ri}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="text-xs text-slate-700 leading-snug">{r.label}</span>
                    <span className="text-[13px] font-serif font-bold tabular-nums shrink-0" style={{ color: 'var(--accent-deep)' }}>
                      {r.note}
                    </span>
                  </div>
                  {/* Echelle commune 0-20 % : les quatre barres restent comparables entre elles. */}
                  <div className="h-[6px] w-full" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                    <div className={`h-full bar-fill bar-fill--d${ri + 1}`} style={{ width: `${(r.value / 20) * 100}%`, backgroundColor: 'var(--accent)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-5 py-3 text-[11px] leading-relaxed text-slate-500" style={{ borderTop: '1px solid var(--rule)' }}>
        {L(
          "Échelle commune de 0 à 20 %. Sources : UN DESA (2024) pour les stocks migratoires mondiaux et africains ; UA/OIT/OIM/CEA pour la part des migrants dans la population du continent. Les valeurs sont celles citées dans le texte ci-dessus.",
          'Common 0–20% scale. Sources: UN DESA (2024) for world and African migrant stocks; AU/ILO/IOM/ECA for the migrant share of the continent\'s population. The values are those cited in the text above.'
        )}
      </div>
    </figure>
  );
};

// Ouverture de mouvement : la section Donnees est une demonstration en trois
// temps, pas une succession de blocs. Le numero et la these le disent.
// Findex : par quel canal l'argent arrive. Calcule en direct sur les pays
// pour lesquels la Banque mondiale publie les deux series.
// Marquage des operations de la compilation.
//   *   territoire non encore independant a la date du recensement
//   **  recensement conduit par un Etat tiers (Erythree 1984, par l'Ethiopie)
//   *** operation de la periode d'apartheid (Afrique du Sud), non datee dans la base
// Regle retenue : une operation conduite avant l'independance, ou par un Etat tiers,
// est INDIQUEE mais n'est pas COMPTABILISEE — ni comme recensement national, ni comme
// borne d'intervalle. Mesurer la regularite d'un Etat depuis un denombrement colonial
// reviendrait a lui imputer le rythme de la puissance qui l'administrait.
const censusMark = (v) => {
  const s = String(v || '').trim();
  if (!s) return { raw: '', mark: '', year: null, counted: false, empty: true };
  const mark = (s.match(/\*+/) || [''])[0];
  const y = s.match(/(?:19|20)\d{2}/);
  // *** ne porte pas sur l'independance : l'Etat existait, l'operation n'est pas datee ici.
  const preIndep = mark === '*' || mark === '**';
  return {
    raw: s, mark, year: y ? Number(y[0]) : null,
    counted: !!y && !preIndep,
    preIndep, empty: false,
  };
};

// La compilation porte des libelles anglais ("Gambia, The", "Sao Tome and Principe").
// On les rend au nom bilingue de la plateforme des qu'un code ISO le permet.
let _nameByIso = null;
const censusName = (iso2, fallback, lang) => {
  if (!_nameByIso) {
    _nameByIso = {};
    Object.values(countryData).flat().forEach(c => {
      if (c.iso2) _nameByIso[String(c.iso2).toLowerCase()] = c.name;
    });
  }
  const n = _nameByIso[String(iso2 || '').toLowerCase()];
  if (!n) return fallback;
  return typeof n === 'string' ? n : (n[lang] || n.fr || fallback);
};

const markLegend = (mark, lang) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  if (mark === '*') return L("Territoire non encore indépendant à cette date : opération indiquée, non comptabilisée.",
                             'Territory not yet independent at that date: shown, not counted.');
  if (mark === '**') return L("Recensement conduit par un État tiers : opération indiquée, non comptabilisée.",
                              'Census conducted by a third state: shown, not counted.');
  if (mark === '***') return L("Opération de la période d'apartheid, non datée dans la compilation.",
                               'Operation from the apartheid period, undated in the compilation.');
  return undefined;
};

// Les intervalles entre recensements, calcules depuis la compilation de l'auteur.
// Seules les operations comptabilisables (cf. censusMark) fournissent une borne.
const CensusRhythm = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const ROUNDS = ['r1970', 'r1980', 'r1990', 'r2000', 'r2010', 'r2020', 'r2030'];

  const data = useMemo(() => {
    const perCountry = [];
    Object.entries(censusByCountry).forEach(([iso2, rec]) => {
      const years = [];
      ROUNDS.forEach(r => {
        const c = censusMark(rec[r]);
        if (c.counted) years.push(c.year);
      });
      years.sort((a, b) => a - b);
      const gaps = [];
      for (let i = 1; i < years.length; i++) gaps.push(years[i] - years[i - 1]);
      perCountry.push({
        iso2, name: rec.name, years, gaps,
        count: years.length,
        maxGap: gaps.length ? Math.max(...gaps) : null,
        span: years.length > 1 ? { from: years[0], to: years[years.length - 1] } : null,
      });
    });

    const allGaps = perCountry.flatMap(c => c.gaps);
    const sorted = [...allGaps].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const mean = allGaps.length ? allGaps.reduce((a, b) => a + b, 0) / allGaps.length : 0;

    // Repartition du nombre d'operations datees par pays
    const byCount = {};
    perCountry.forEach(c => { byCount[c.count] = (byCount[c.count] || 0) + 1; });

    // Les trous les plus longs
    const longest = perCountry
      .filter(c => c.maxGap)
      .map(c => {
        let a = 0, b = 0;
        for (let i = 1; i < c.years.length; i++) {
          if (c.years[i] - c.years[i - 1] === c.maxGap) { a = c.years[i - 1]; b = c.years[i]; break; }
        }
        return { iso2: c.iso2, name: c.name, gap: c.maxGap, from: a, to: b };
      })
      .sort((x, y) => y.gap - x.gap)
      .slice(0, 8);

    // Les metronomes : six operations datees et aucun trou de plus de 12 ans
    const metronomes = perCountry.filter(c => c.count === 6 && c.maxGap <= 12);
    const jamais = perCountry.filter(c => c.count <= 1);
    const conformes = allGaps.filter(g => g <= 10).length;

    // Combien d'operations sont indiquees mais volontairement non comptabilisees.
    let exclus = 0;
    Object.values(censusByCountry).forEach(rec => ROUNDS.forEach(r => {
      const c = censusMark(rec[r]);
      if (c.preIndep && c.year) exclus += 1;
    }));

    return {
      perCountry, allGaps, median, mean, byCount, longest, metronomes, jamais,
      conformes, exclus, total: allGaps.length,
    };
  }, []);

  const fmt = (v) => (lang === 'fr' ? String(v).replace('.', ',') : String(v));
  const maxBucket = Math.max(...Object.values(data.byCount));

  return (
    <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--accent-2)' }}>
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
        <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--accent-2)' }}>
          {L('Calculé depuis la compilation de l\'auteur', "Computed from the author's compilation")}
        </span>
        <h3 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
          {L("Ce que la moyenne de 11,1 ans cache : deux régimes de recensement, pas un",
             'What the 11.1-year average hides: two census regimes, not one')}
        </h3>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-justify">
          {L(
            `La compilation porte, pour chaque pays, la date de chaque recensement depuis le cycle 1970. On peut donc calculer ${data.total} intervalles réels au lieu de se contenter d'une moyenne. Et la distribution ne ressemble pas à la moyenne : elle superpose deux régimes que le chiffre unique fusionne.`,
            `The compilation carries, for each country, the date of every census since the 1970 round. That makes ${data.total} actual intervals computable instead of relying on an average. And the distribution does not look like the average: it superimposes two regimes that a single figure merges.`
          )}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
          {[
            { v: `${data.total}`, l: L('intervalles calculables', 'computable intervals'), tone: 'figure-inkblue' },
            { v: `${data.median} ${L('ans', 'yrs')}`, l: L('intervalle médian', 'median interval'), tone: 'figure-ok' },
            { v: `${data.metronomes.length}`, l: L('pays au rythme de métronome', 'metronomic countries'), tone: 'figure-terra' },
            { v: `${data.longest[0].gap} ${L('ans', 'yrs')}`, l: L('le trou le plus long', 'the longest gap'), tone: 'figure-warn' },
          ].map((k, i) => (
            <div key={i} className="border border-slate-200 p-4 lift">
              <div className={`text-2xl font-serif font-bold tabular-nums leading-none ${k.tone}`}>{k.v}</div>
              <span className="block text-[11px] font-bold uppercase tracking-widest mt-2 leading-snug" style={{ color: 'var(--label)' }}>{k.l}</span>
            </div>
          ))}
        </div>

        <div>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            {L('Combien d\'opérations datées par pays, depuis 1970', 'How many dated operations per country, since 1970')}
          </h4>
          <div className="space-y-2">
            {Object.entries(data.byCount).sort((a, b) => Number(b[0]) - Number(a[0])).map(([k, v], i) => (
              <div key={k} className="flex items-center gap-3 figure-row px-1 py-1">
                <span className="text-[11px] font-semibold w-32 shrink-0 text-slate-700">
                  {k} {L(Number(k) > 1 ? 'recensements' : 'recensement', Number(k) > 1 ? 'censuses' : 'census')}
                </span>
                <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <div className={`h-full bar-fill bar-fill--d${Math.min(5, i + 1)}`}
                       style={{ width: `${(v / maxBucket) * 100}%`,
                                backgroundColor: Number(k) >= 5 ? 'var(--ok)' : Number(k) >= 3 ? 'var(--warn-ink)' : 'var(--bad)' }} />
                </div>
                <span className="text-xs font-bold w-20 text-right shrink-0 tabular-nums text-slate-800">
                  {v} {L('pays', v > 1 ? 'countries' : 'country')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            {L('Les plus longues interruptions', 'The longest interruptions')}
          </h4>
          <div className="space-y-2">
            {data.longest.map((r, i) => (
              <div key={r.name} className="flex items-center gap-3 figure-row px-1 py-1">
                <span className="text-[11px] font-medium w-36 shrink-0 truncate text-slate-700">{censusName(r.iso2, r.name, lang)}</span>
                <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <div className={`h-full bar-fill bar-fill--d${Math.min(5, i + 1)}`}
                       style={{ width: `${(r.gap / data.longest[0].gap) * 100}%`, backgroundColor: 'var(--bad)' }} />
                </div>
                <span className="text-xs font-bold w-14 text-right shrink-0 tabular-nums text-slate-800">{r.gap} {L('ans', 'yrs')}</span>
                <span className="text-[11px] w-24 text-right shrink-0 tabular-nums" style={{ color: 'var(--label)' }}>
                  {r.from} → {r.to}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L('Pourquoi la moyenne trompe ici', 'Why the average misleads here')}
          </h4>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
            {L(
              `L'intervalle médian est de ${data.median} ans, contre une moyenne de ${fmt(data.mean.toFixed(1))} : l'écart entre les deux mesure exactement la déformation produite par une poignée de très longues interruptions. ${data.metronomes.length} États ont conduit six recensements sans jamais dépasser douze ans d'écart — un rythme conforme à la recommandation onusienne, tenu sur un demi-siècle. À l'autre extrémité, ${data.jamais.length} n'ont aucune ou qu'une seule opération comptabilisable sur la période — dont la République démocratique du Congo, dont le seul recensement national date de 1984. Parler d'un « rythme africain » unique revient donc à moyenner un métronome et une horloge arrêtée : le résultat ne décrit ni l'un ni l'autre, et il masque là où l'appui statistique serait réellement utile (Ben Mokhtar, 2026).`,
              `The median interval is ${data.median} years against a mean of ${fmt(data.mean.toFixed(1))}: the gap between the two measures exactly the distortion produced by a handful of very long interruptions. ${data.metronomes.length} states have conducted six censuses without ever exceeding twelve years between them — a rhythm consistent with the UN recommendation, sustained over half a century. At the other end, ${data.jamais.length} have no countable operation at all, or only one, over the period — among them the Democratic Republic of the Congo, whose only national census dates from 1984. Speaking of a single "African rhythm" therefore means averaging a metronome and a stopped clock: the result describes neither, and it hides where statistical support would actually be useful (Ben Mokhtar, 2026).`
            )}
          </p>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }}>
            <span className="font-bold uppercase tracking-widest">{L('Au rythme de métronome :', 'Metronomic:')}</span>{' '}
            {data.metronomes.map(c => censusName(c.iso2, c.name, lang)).join(', ')}.
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 py-4" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
        <p className="text-[11px] leading-relaxed text-justify" style={{ color: 'var(--label)' }}>
          {L(
            `Calcul effectué sur la compilation de l'auteur (d'après UNSD / UN DESA), qui recense la date de chaque opération nationale des cycles 1970 à 2030. Deux règles écartent une opération du calcul. D'abord, une date annoncée n'est pas une donnée : les recensements programmés puis reportés, longtemps portés dans la base comme s'ils avaient eu lieu, ont été retirés lors de l'audit d'août 2026. Ensuite, une opération conduite sur un territoire non encore indépendant, ou par un État tiers, est signalée dans la frise du pays mais n'est pas comptabilisée. Mesurer la régularité d'un État depuis un dénombrement colonial reviendrait à lui imputer le rythme de la puissance qui l'administrait. Ces ${data.exclus} opérations pré-indépendance sont donc visibles et non comptées — la frise de l'Angola, de la Namibie ou du Mozambique les porte en clair. La ligne de couverture par cycle, plus haut, reste celle publiée par l'auteur et n'est pas recalculée ici. Les dénominateurs varient donc d'un pays à l'autre — c'est précisément ce que ce calcul rend visible.`,
            `Computed from the author's compilation (after UNSD / UN DESA), which records the date of every national operation from the 1970 to the 2030 round. Two rules remove an operation from the calculation. First, an announced date is not data: censuses scheduled and then postponed, long carried in the base as though they had happened, were removed in the August 2026 audit. Second, an operation conducted on a territory not yet independent, or by a third state, is flagged in that country's timeline but not counted. Measuring a state's regularity from a colonial enumeration would credit it with the rhythm of the power that administered it. Those ${data.exclus} pre-independence operations are therefore visible and uncounted — the timelines for Angola, Namibia and Mozambique carry them plainly. The coverage-by-round row above remains the author's published figure and is not recomputed here. Denominators therefore vary between countries — which is precisely what this calculation makes visible.`
          )}
        </p>
      </div>
    </section>
  );
};

// Ce que l'audit d'aout 2026 a fait apparaitre : les Etats donnes pour
// « defaillants » au cycle 2020 avaient pour la plupart un recensement en cours.
// Il a abouti — apres la cloture du cycle. Le retard n'est pas une absence.
const LateRound = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);

  const rows = useMemo(() => Object.entries(censusByCountry)
    .filter(([, r]) => r.status2020 === 'late')
    .map(([iso2, r]) => {
      const yr = (s) => { const m = String(s || '').match(/(?:19|20)\d{2}/); return m ? Number(m[0]) : null; };
      const nouveau = yr(r.r2030);
      const precedent = ['r2010', 'r2000', 'r1990', 'r1980', 'r1970'].map(k => yr(r[k])).find(Boolean) || null;
      return { iso2, name: r.name, nouveau, precedent, gap: nouveau && precedent ? nouveau - precedent : null };
    })
    .sort((a, b) => (b.gap || 0) - (a.gap || 0)), []);

  const nm = (r) => censusName(r.iso2, r.name, lang);
  const maxGap = Math.max(...rows.map(r => r.gap || 0));

  return (
    <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--accent)' }}>
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
        <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--accent-deep)' }}>
          {L('Vérifié en août 2026', 'Verified August 2026')}
        </span>
        <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
          {L("Le cycle 2020 n'a pas manqué en Afrique centrale : il a glissé",
             'The 2020 round did not fail in Central Africa: it slipped')}
        </h4>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-justify">
          {L(
            `Neuf États figuraient encore sur cette plateforme comme « recensement prévu » ou « en cours », pour des dates toutes dépassées. Leur vérification, une par une, auprès des instituts nationaux, donne un résultat que la lecture par cycle rendait invisible. Six de ces opérations ont bien eu lieu. Mais ${rows.length} d'entre elles se sont achevées après la clôture du cycle 2020, le 31 décembre 2024. Aucune n'apparaît donc dans le taux de couverture du cycle, alors que le recensement existe, que les ménages ont été dénombrés et que les résultats sont en cours de publication.`,
            `Nine states still appeared on this platform as "census planned" or "under way", all for dates now past. Checking each against its national institute yields a result the round-by-round reading made invisible. Six of those operations did take place. But ${rows.length} of them were completed after the 2020 round closed on 31 December 2024. None therefore counts toward the round's coverage rate, even though the census exists, households were enumerated and results are being published.`
          )}
        </p>

        <div>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            {L('Recensements achevés après la clôture du cycle 2020', 'Censuses completed after the 2020 round closed')}
          </h4>
          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={r.iso2} className="flex items-center gap-3 figure-row px-1 py-1">
                <span className="text-[11px] font-semibold w-32 shrink-0 truncate text-slate-800">{nm(r)}</span>
                <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <div className={`h-full bar-fill bar-fill--d${Math.min(5, i + 1)}`}
                       style={{ width: `${(r.gap / maxGap) * 100}%`, backgroundColor: 'var(--accent)' }} />
                </div>
                <span className="text-xs font-bold w-16 text-right shrink-0 tabular-nums text-slate-800">
                  {r.gap} {L('ans', 'yrs')}
                </span>
                <span className="text-[11px] w-28 text-right shrink-0 tabular-nums" style={{ color: 'var(--label)' }}>
                  {r.precedent} → {r.nouveau}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L('Ce que le décompte par cycle ne peut pas dire', 'What a round-by-round count cannot say')}
          </h4>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
            {L(
              "Ces quatre États sont voisins, et leur calendrier s'est resserré sur dix-huit mois : décembre 2025 pour la Centrafrique, avril-mai 2026 pour le Cameroun, mai 2026 pour le Gabon, juin-août 2026 pour le Tchad. Trois de ces opérations sont les premières entièrement numériques de leur pays, deux sont couplées à un recensement agricole. Lues à travers le seul cycle 2020, elles comptent pour zéro et alimentent le récit du déficit ; lues comme ce qu'elles sont, elles ouvrent la série 2030 et sortent l'Afrique centrale d'une interruption qui durait, selon les cas, de treize à vingt-deux ans. Le découpage décennal est un instrument de comparaison internationale, pas une mesure de l'effort statistique national — et il pénalise mécaniquement les États dont l'opération a été retardée par un conflit ou par un financement tardif (Ben Mokhtar, 2026).",
              "These four states are neighbours, and their calendars converged within eighteen months: December 2025 for the Central African Republic, April–May 2026 for Cameroon, May 2026 for Gabon, June–August 2026 for Chad. Three of these operations are their country's first fully digital census, two are coupled with an agricultural census. Read through the 2020 round alone they count for zero and feed the deficit narrative; read for what they are, they open the 2030 series and lift Central Africa out of an interruption lasting, depending on the country, thirteen to twenty-two years. The decennial cut is an instrument of international comparison, not a measure of national statistical effort — and it mechanically penalises states whose operation was delayed by conflict or by late financing (Ben Mokhtar, 2026)."
            )}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 py-4" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
        <p className="text-[11px] leading-relaxed text-justify" style={{ color: 'var(--label)' }}>
          {L(
            "Sources : ICASEES (Centrafrique, RGPH-4), BUCREP (Cameroun, RGPH-4), ministère de la Planification et de la Prospective (Gabon, RGPL), INSEED (Tchad, RGPH-3), GBoS (Gambie), INE São Tomé-et-Principe, INStaD (Bénin), Statistics Sierra Leone, SNBS et UNFPA (Somalie). Chaque date figure dans la fiche du pays concerné, dans l'Explorateur. Les deux opérations achevées dans la fenêtre du cycle — Gambie et São Tomé-et-Principe — ont été reversées au cycle 2020.",
            "Sources: ICASEES (CAR, 4th census), BUCREP (Cameroon, 4th census), Ministry of Planning and Foresight (Gabon, RGPL), INSEED (Chad, 3rd census), GBoS (The Gambia), INE São Tomé and Príncipe, INStaD (Benin), Statistics Sierra Leone, SNBS and UNFPA (Somalia). Each date appears in the relevant country profile, in the Explorer. The two operations completed within the round's window — The Gambia and São Tomé and Príncipe — were moved into the 2020 round."
          )}
        </p>
      </div>
    </section>
  );
};

const MobileMoneyRail = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (c.name?.[lang] || c.name?.fr || ''));

  const rows = useMemo(() => {
    const all = Object.values(countryData).flat();
    return all.map(c => {
      const f = findexByCountry[(c.iso2 || '').toLowerCase()];
      if (!f || !f.account || !f.mobile) return null;
      const share = f.account.v > 0 ? (f.mobile.v / f.account.v) * 100 : 0;
      return { n: nm(c), account: f.account.v, mobile: f.mobile.v, share, remit: f.remit?.v ?? null, y: f.mobile.y };
    }).filter(Boolean).sort((a, b) => b.mobile - a.mobile);
  }, [lang]);

  const overHalf = rows.filter(r => r.mobile >= 50).length;
  const top = rows.slice(0, 10);
  const fmt = (v) => (lang === 'fr' ? String(v).replace('.', ',') : String(v));

  return (
    <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--ok)' }}>
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
        <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--ok)' }}>
          {L("Le canal, pas le montant", 'The rail, not the amount')}
        </span>
        <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
          {L("L'Afrique n'a pas attendu la banque : elle a bâti son propre rail",
             'Africa did not wait for banking: it built its own rail')}
        </h4>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-justify">
          {L(
            "Cette plateforme donnait jusqu'ici le volume des transferts de la diaspora sans dire par où ils passent. La question n'est pas secondaire : dans une bonne partie du continent, l'inclusion financière passe par le téléphone bien avant de passer par la banque. Là où le compte existe, il est très majoritairement un compte de téléphone.",
            'Until now this platform gave the volume of diaspora remittances without saying how they travel. The question is not secondary: across much of the continent, financial inclusion runs through the phone long before it runs through a bank. Where an account exists, it is overwhelmingly a phone account.'
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
          {[
            { v: `${overHalf}`, l: L('pays où le mobile money dépasse la moitié des adultes', 'countries where mobile money exceeds half of adults'), tone: 'figure-ok' },
            { v: `${Math.round(top[0].share)} %`, l: L(`de l'inclusion financière passe par le mobile au ${top[0].n}`, `of financial inclusion runs on mobile in ${top[0].n}`), tone: 'figure-terra' },
            { v: `${rows.length}`, l: L('pays couverts par les deux séries', 'countries covered by both series'), tone: 'figure-inkblue' },
          ].map((k, i) => (
            <div key={i} className="border border-slate-200 p-4 lift">
              <div className={`text-2xl font-serif font-bold tabular-nums leading-none ${k.tone}`}>{k.v}</div>
              <span className="block text-[11px] font-bold uppercase tracking-widest mt-2 leading-snug" style={{ color: 'var(--label)' }}>{k.l}</span>
            </div>
          ))}
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {L('Compte, dont mobile money — part des adultes', 'Account, of which mobile money — share of adults')}
            </span>
            <span className="inline-flex items-center gap-3 text-[11px]" style={{ color: 'var(--label)' }}>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ backgroundColor: 'var(--rule-strong)' }} />{L('compte, tous types', 'account, all types')}</span>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ backgroundColor: 'var(--ok)' }} />{L('dont mobile money', 'of which mobile money')}</span>
            </span>
          </div>
          <div className="space-y-2.5">
            {top.map((r, i) => (
              <div key={r.n} className="figure-row px-1 py-1">
                <div className="flex items-baseline justify-between gap-3 mb-1">
                  <span className="text-[11px] font-medium text-slate-700">{r.n}</span>
                  <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--label)' }}>
                    {fmt(r.mobile)} % / {fmt(r.account)} %
                    <span className="ml-2 font-bold" style={{ color: 'var(--ok)' }}>{Math.round(r.share)} %</span>
                  </span>
                </div>
                {/* La barre pale porte le compte, la barre pleine la part mobile. */}
                <div className="relative h-4 w-full" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <div className="absolute inset-y-0 left-0" style={{ width: `${r.account}%`, backgroundColor: 'var(--rule-strong)' }} />
                  <div className={`absolute inset-y-0 left-0 bar-fill bar-fill--d${Math.min(5, i + 1)}`}
                       style={{ width: `${r.mobile}%`, backgroundColor: 'var(--ok)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--ok)' }}>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L('Ce que cela change pour la lecture des transferts', 'What this changes for reading remittances')}
          </h4>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
            {L(
              "Un montant ne dit rien du coût ni de l'accès. Si le canal est mobile, le transfert atteint des zones sans agence bancaire, à des frais et des délais différents, et il laisse une trace numérique exploitable statistiquement. C'est aussi ce qui rend crédible l'objectif de ramener sous 3 % les coûts de transaction (cible 10.c des ODD) : la baisse ne viendra pas des guichets, elle vient déjà des opérateurs. Nommer le canal, c'est cesser de traiter les transferts comme une manne indifférenciée pour les traiter comme une infrastructure — construite en Afrique, sans avoir attendu que le système bancaire s'étende (Ben Mokhtar, 2026).",
              'An amount says nothing about cost or access. If the rail is mobile, the transfer reaches areas with no bank branch, at different fees and delays, and it leaves a digital trace that can be exploited statistically. It is also what makes the target of cutting transaction costs below 3% (SDG target 10.c) credible: the fall will not come from counters, it is already coming from operators. Naming the rail means ceasing to treat remittances as an undifferentiated windfall and treating them as infrastructure — built in Africa, without waiting for the banking system to extend (Ben Mokhtar, 2026).'
            )}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-5">
        <Sources lang={lang} items={[{ label: FINDEX_SOURCE.label[lang], url: FINDEX_SOURCE.url }]}
          note={L("Millésime le plus récent disponible par pays (2021 à 2024 selon les séries). Findex est une enquête par sondage : tous les pays ne sont pas couverts à chaque vague.",
                  'Most recent available year per country (2021 to 2024 depending on the series). Findex is a sample survey: not every country is covered in every wave.')} />
      </div>
    </section>
  );
};

const MovementOpener = ({ n, kicker, thesis, accent = 'var(--accent-deep)' }) => (
  <div className="pt-4">
    <div className="flex items-baseline gap-4 mb-3">
      <span className="font-serif font-black text-[2.6rem] leading-none tabular-nums" style={{ color: accent }}>
        {n}
      </span>
      <span className="block h-px flex-1" style={{ backgroundColor: accent, opacity: .35 }} />
      <span className="text-[10px] font-bold uppercase shrink-0" style={{ letterSpacing: '.2em', color: 'var(--label)' }}>
        {kicker}
      </span>
    </div>
    <p className="font-serif font-bold text-lg md:text-xl text-slate-900 leading-snug max-w-3xl">
      {thesis}
    </p>
  </div>
);

// `plain` : la meme section, dite en une phrase, pour qui n'est pas du metier.
// Elle ne remplace pas `desc` — le registre institutionnel garde son role — elle
// se pose en dessous, sur le papier, ou elle se lit sans effort.
const PageHeader = ({ badge, title, highlight, desc, plate, plain, lang = 'fr', icon: Icon = Globe }) => (
  <>
  <header
    className="relative overflow-hidden rounded-xl mb-8 px-6 lg:px-12 py-14 md:py-16"
    style={{
      backgroundColor: 'var(--ink)',
      backgroundImage:
        'radial-gradient(circle at 10% 15%, rgba(43,58,103,.24), transparent 45%),' +
        'radial-gradient(circle at 88% 90%, rgba(31,78,95,.28), transparent 50%)',
    }}
  >
    <div
      className="absolute inset-x-0 bottom-0 h-px"
      style={{ background: 'linear-gradient(90deg, var(--accent), rgba(43,58,103,.38) 45%, transparent)' }}
    />
    <AfricaPlate />
    {/* Voile d'encre cote texte : la planche emerge vers la droite au lieu de
        traverser le titre. */}
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'linear-gradient(90deg, var(--ink) 18%, rgba(20,17,15,.72) 45%, transparent 78%)' }}
    />

    <div className="relative z-10 max-w-4xl">
      {/* Tete de planche : on sait ou l'on est avant meme de lire le titre. */}
      {plate && (
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[10px] font-semibold uppercase tabular-nums" style={{ letterSpacing: '.2em', color: '#8FA0CE' }}>
            {plate}
          </span>
          <span className="block h-px flex-1 max-w-[7rem]" style={{ backgroundColor: 'rgba(255,253,249,.22)' }} />
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,253,249,.45)' }} strokeWidth={1.5} />
        </div>
      )}

      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-sm mb-5 text-[10px] font-semibold uppercase"
        style={{
          letterSpacing: '.18em',
          color: '#C9D2E8',
          backgroundColor: 'rgba(43,58,103,.14)',
          border: '1px solid rgba(43,58,103,.40)',
        }}
      >
        {badge}
      </span>

      <h1
        className="font-serif font-black text-[2.4rem] md:text-[3.6rem] leading-[1.02] tracking-[-0.025em]"
        style={{ color: '#FFFDF9' }}
      >
        {title}{' '}
        <span className="italic font-normal" style={{ color: '#8FA0CE' }}>{highlight}</span>
      </h1>

      <p className="mt-6 text-base md:text-[1.05rem] leading-[1.6] max-w-3xl" style={{ color: '#D3D5DC' }}>
        {desc}
      </p>
    </div>
  </header>
  {/* `plain` arrive deja traduit depuis text.headers, ou sous forme {fr, en}. */}
  {plain && (
    <EnClair
      lang={lang}
      fr={typeof plain === 'string' ? plain : plain.fr}
      en={typeof plain === 'string' ? plain : plain.en}
    />
  )}
  </>
);

const PRINT_CITATION = {
  fr: "Ben Mokhtar, Y. (2026). Dynamiques multiniveaux du régime africain de gouvernance migratoire : Principes, normes, règles et procédures à l'épreuve de l'entre-deux national (Thèse doctorale). Université Internationale de Rabat (UIR).",
  en: "Ben Mokhtar, Y. (2026). Dynamiques multiniveaux du régime africain de gouvernance migratoire: Principes, normes, règles et procédures à l'épreuve de l'entre-deux national (Doctoral thesis). International University of Rabat (UIR)."
};

// ----------------------------------------------------------------------------
// Dossier PDF « profil pays » : document conçu pour l'impression, indépendant de
// la mise en page écran. Dense, sur une page si possible, avec identité et référence.
// ----------------------------------------------------------------------------
const PdfCountryDossier = ({ display, lang, text, continentalAvoiAvg }) => {
  if (!display) return null;
  const iso = display.iso2;
  const openness = iso ? visaOpenToAllAfrica[iso] : null;
  const recs = iso ? (countryRecAffiliations[iso] || []) : [];
  const date = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const nn = (v, suffix = '') => (v === null || v === undefined || v === '' ? '—' : `${v}${suffix}`);

  const kpis = [
    { lbl: L('Stock migrant (2024)', 'Migrant stock (2024)'), val: formatNumber(display.stock, lang) },
    { lbl: L('% pop. nationale', '% national pop.'), val: nn(display.evolution, '%') },
    { lbl: L('Part des femmes', 'Female share'), val: nn(display.female, '%') },
    { lbl: L('Rétention Sud-Sud', 'South-South retention'), val: nn(display.retention, '%') },
    { lbl: L('Transferts (% PIB)', 'Remittances (% GDP)'), val: nn(display.remittances, '%') },
    { lbl: L('Ouverture visa (AVOI)', 'Visa openness (AVOI)'), val: display.avoi === null || display.avoi === undefined ? '—' : `${display.avoi}/100` },
  ];

  return (
    <div className="hidden pdf-doc">
      {/* En-tête : identité de la plateforme + sujet */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1pt solid #0f172a', paddingBottom: '2mm', marginBottom: '3mm' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
          <BrandMark className="" tone="paper" style={{ width: '8mm', height: '8mm' }} />
          <div>
            <div style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, fontSize: '10pt', letterSpacing: '.04em' }}>SOUTH(S) MOBILITY</div>
            <div style={{ fontSize: '6.4pt', letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748b' }}>
              {L('Savoirs & Données sur les mobilités', 'Knowledge & Data on mobility')}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, fontSize: '13pt', lineHeight: 1.1 }}>{display.name}</div>
          <div style={{ fontSize: '6.4pt', letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b' }}>
            {display.isRegion ? L('Profil régional', 'Regional profile') : L('Profil pays', 'Country profile')} · {date}
          </div>
        </div>
      </div>

      {/* Bandeau d'indicateurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1.8mm', marginBottom: '3.5mm' }}>
        {kpis.map((k, i) => (
          <div key={i} className="kpi">
            <span className="lbl">{k.lbl}</span>
            <span className="val">{k.val}</span>
          </div>
        ))}
      </div>

      <div className="pdf-cols">
        <div className="pdf-block">
          <h2>{L('Démographie & structure', 'Demography & structure')}</h2>
          <table><tbody>
            <tr><td className="k">{L('Stock de migrants (2024)', 'Migrant stock (2024)')}</td><td className="v"><Num value={display.stock} lang={lang} /></td></tr>
            <tr><td className="k">{L('Part de la population', 'Share of population')}</td><td className="v">{nn(display.evolution, '%')}</td></tr>
            <tr><td className="k">{L('Part des femmes', 'Female share')}</td><td className="v">{nn(display.female, '%')}</td></tr>
            <tr><td className="k">{L('Activité des migrants (OIT)', 'Migrant labour activity (ILO)')}</td><td className="v">{nn(display.labour_participation, '%')}{display.labour_participation_year ? ` (${display.labour_participation_year})` : ''}</td></tr>
          </tbody></table>
        </div>

        <div className="pdf-block">
          <h2>{L('Déplacement & protection', 'Displacement & protection')}</h2>
          <table><tbody>
            <tr><td className="k">{L('Réfugiés accueillis', 'Refugees hosted')}</td><td className="v"><Num value={display.refugees_hosted} lang={lang} /></td></tr>
            <tr><td className="k">{L('Déplacés internes (conflit)', 'IDPs (conflict)')}</td><td className="v"><Num value={display.idp_conflict} lang={lang} /></td></tr>
            <tr><td className="k">{L('Déplacés internes (catastrophes)', 'IDPs (disasters)')}</td><td className="v"><Num value={display.idp_disaster} lang={lang} /></td></tr>
            <tr><td className="k">{L('Rétention Sud-Sud', 'South-South retention')}</td><td className="v">{nn(display.retention, '%')}</td></tr>
          </tbody></table>
        </div>

        <div className="pdf-block">
          <h2>{L('Économie de la mobilité', 'Mobility economy')}</h2>
          <table><tbody>
            <tr><td className="k">{L('Transferts de fonds (% PIB)', 'Remittances (% GDP)')}</td><td className="v">{nn(display.remittances, '%')}{display.remittances_year ? ` (${display.remittances_year})` : ''}</td></tr>
            <tr><td className="k">{L('Aide publique au dév. (% PIB)', 'ODA (% GDP)')}</td><td className="v">{nn(display.aid, '%')}</td></tr>
          </tbody></table>
        </div>

        <div className="pdf-block">
          <h2>{L('Ouverture des frontières', 'Border openness')}</h2>
          <table><tbody>
            <tr><td className="k">{L('Indice AVOI', 'AVOI index')}</td><td className="v">{display.avoi === null || display.avoi === undefined ? '—' : `${display.avoi}/100`}</td></tr>
            {continentalAvoiAvg !== null && continentalAvoiAvg !== undefined && (
              <tr><td className="k">{L('Moyenne continentale', 'Continental average')}</td><td className="v">{continentalAvoiAvg}/100</td></tr>
            )}
          </tbody></table>
          {openness && (
            <p style={{ margin: '1.2mm 0 0', fontSize: '7pt', color: '#334155' }}>
              <strong>{visaOpenTiers[openness.tier].label[lang]} — </strong>{openness.note[lang]}
            </p>
          )}
        </div>

        {recs.length > 0 && (
          <div className="pdf-block">
            <h2>{L('Appartenance aux CER', 'REC membership')}</h2>
            <div>{recs.map(r => <span key={r} className="chip">{recNames[r][lang]}</span>)}</div>
            {countryRecNotes[iso] && (
              <p style={{ margin: '.8mm 0 0', fontSize: '6.8pt', color: '#92400e' }}>{countryRecNotes[iso][lang]}</p>
            )}
          </div>
        )}

        {display.au_treaties && (
          <div className="pdf-block">
            <h2>{L('Instruments de l\'UA', 'AU instruments')}</h2>
            <table><tbody>
              {[
                { key: 'constitutive', fr: "Acte constitutif de l'UA", en: 'AU Constitutive Act' },
                { key: 'abuja', fr: "Traité d'Abuja (CEA)", en: 'Abuja Treaty (AEC)' },
                { key: 'refugees_1969', fr: 'Convention réfugiés (1969)', en: 'Refugee Convention (1969)' },
                { key: 'kampala', fr: 'Convention de Kampala (PDI)', en: 'Kampala Convention (IDPs)' },
                { key: 'free_movement', fr: 'Protocole libre circulation', en: 'Free Movement Protocol' },
                { key: 'zlecaf', fr: 'Accord ZLECAf', en: 'AfCFTA Agreement' },
              ].map(t => (
                <tr key={t.key}>
                  <td className="k">{lang === 'fr' ? t.fr : t.en}</td>
                  <td className="v">{display.au_treaties[t.key] ? L('Ratifié', 'Ratified') : L('Non ratifié', 'Not ratified')}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        )}

        {display.normlex && (
          <div className="pdf-block">
            <h2>{L('Conventions OIT (NORMLEX)', 'ILO conventions (NORMLEX)')}</h2>
            <table><tbody>
              <tr><td className="k">{L('Fondamentales', 'Fundamental')}</td><td className="v">{display.normlex.fundamental} / 11</td></tr>
              <tr><td className="k">{L('Gouvernance', 'Governance')}</td><td className="v">{display.normlex.governance} / 4</td></tr>
              <tr><td className="k">{L('Techniques', 'Technical')}</td><td className="v">{display.normlex.technical}</td></tr>
              <tr><td className="k">{L('Total ratifiées', 'Total ratified')}</td><td className="v">{display.normlex.total}</td></tr>
            </tbody></table>
          </div>
        )}

        {display.origDest && (
          <div className="pdf-block">
            <h2>{L('Origines & destinations', 'Origins & destinations')}</h2>
            <p style={{ margin: 0, textAlign: 'justify' }}>{display.origDest}</p>
          </div>
        )}

        {(display.trigger || display.response || display.impact) && (
          <div className="pdf-block">
            <h2>{L('Chaîne causale', 'Causal chain')}</h2>
            {display.trigger && <p style={{ margin: '0 0 1mm', textAlign: 'justify' }}><strong>{text.modal.trigger} · </strong>{display.trigger}</p>}
            {display.response && <p style={{ margin: '0 0 1mm', textAlign: 'justify' }}><strong>{text.modal.response} · </strong>{display.response}</p>}
            {display.impact && <p style={{ margin: 0, textAlign: 'justify' }}><strong>{text.modal.impact} · </strong>{display.impact}</p>}
          </div>
        )}
      </div>

      {/* Pied de page : provenance et citation */}
      <div style={{ borderTop: '1pt solid #0f172a', marginTop: '3mm', paddingTop: '1.8mm', fontSize: '6.4pt', color: '#475569' }}>
        <div style={{ marginBottom: '.8mm' }}><strong>{L('Sources', 'Sources')} · </strong>{text.modal.data_source}</div>
        <div style={{ marginBottom: '.8mm' }}><strong>{L('Citation', 'Citation')} · </strong><em>{PRINT_CITATION[lang]}</em></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>South(s) Mobility DataHub — {siteUrl}</span>
          <span>© 2026 Yassine Ben Mokhtar · {L('Généré le', 'Generated')} {date}</span>
        </div>
      </div>
    </div>
  );
};

const PrintCitationFooter = ({ lang, sectionLabel }) => {
  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'South(s) Mobility DataHub';
  const printDate = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="hidden print:block mt-8 pt-4 border-t-2 border-slate-900 break-inside-avoid">
      <div className="flex items-center gap-2 mb-1.5">
        <Globe className="w-3.5 h-3.5 text-slate-700" />
        <span className="font-serif font-bold text-slate-900 text-xs">South(s) Mobility DataHub</span>
        {sectionLabel && <span className="text-slate-400 text-[10px]">— {sectionLabel}</span>}
      </div>
      <p className="text-[10px] text-slate-600">{siteUrl}</p>
      <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
        {lang === 'fr' ? 'Citation suggérée : ' : 'Suggested citation: '}
        <span className="italic">{PRINT_CITATION[lang]}</span>
      </p>
      <p className="text-[9px] text-slate-400 mt-1.5">
        {lang === 'fr' ? 'Document généré le' : 'Document generated on'} {printDate} — © 2026 Yassine Ben Mokhtar
      </p>
    </div>
  );
};

// Toute institution dont une donnée ou une série est effectivement citée sur la plateforme
// doit figurer ici. `src: null` => repli automatique sur les initiales (pas d'emblème
// librement licencié disponible). Vérifié contre les champs `sources` de tout le site.
const institutionLogos = [
  { key: 'un', name: "United Nations", src: "/logos/un.svg" },
  { key: 'worldbank', name: "World Bank", src: "/logos/worldbank.svg" },
  { key: 'au', name: "African Union", src: "/logos/au.png" },
  { key: 'unhcr', name: "UNHCR", src: "/logos/unhcr.svg" },
  { key: 'ilo', name: "ILO", src: "/logos/ilo.svg" },
  { key: 'iom', name: "IOM", src: "/logos/iom.png" },
  { key: 'afdb', name: "AfDB", src: "/logos/afdb.svg" },
  { key: 'oecd', name: "OECD", src: "/logos/oecd.svg" },
  { key: 'idmc', name: "IDMC", src: "/logos/idmc.svg" },
  { key: 'uneca', name: "UNECA", src: "/logos/uneca.svg" },
  { key: 'undp', name: "UNDP", src: "/logos/undp.png" },
  { key: 'who', name: "WHO", src: "/logos/who.svg" },
  { key: 'knomad', name: "KNOMAD", src: null }, // programme hébergé par la Banque mondiale : pas d'emblème distinct accessible
  { key: 'mmc', name: "Mixed Migration Centre", src: "/logos/mmc.png" },
  { key: 'afrobarometer', name: "Afrobarometer", src: "/logos/afrobarometer.png" },
  { key: 'iss', name: "ISS", full: "ISS African Futures", src: "/logos/iss.svg" },
  { key: 'icmpd', name: "ICMPD", src: "/logos/icmpd.jpg" },
  { key: 'iata', name: "IATA", src: "/logos/iata.png" },
  { key: 'eurostat', name: "Eurostat", src: "/logos/eurostat.png" },
  { key: 'frontex', name: "Frontex", src: "/logos/frontex.svg" },
  { key: 'moibrahim', name: "Mo Ibrahim Foundation", full: "Mo Ibrahim Foundation — IIAG", src: "/logos/moibrahim.svg" },
  { key: 'ecjrc', name: "EC JRC", full: "Commission européenne — Centre commun de recherche (JRC/KCMD)", src: "/logos/ec-jrc.svg" },
];

const sdgIcons = { 4: "/logos/sdg04.svg", 8: "/logos/sdg08.svg", 10: "/logos/sdg10.svg", 16: "/logos/sdg16.svg", 17: "/logos/sdg17.svg" };

// Emblèmes officiels des huit CER — Wikimedia Commons pour la plupart, sites officiels
// des organisations pour COMESA (comesa.int) et CEEAC (ceeac-eccas.org).
// Usage identificatoire des marques institutionnelles citées comme sources.
const recLogos = {
  cedeao: "/logos/rec-cedeao.png",
  cae: "/logos/rec-cae.svg",
  sadc: "/logos/rec-sadc.svg",
  igad: "/logos/rec-igad.svg",
  uma: "/logos/rec-uma.svg",
  censad: "/logos/rec-censad.jpg",
  comesa: "/logos/rec-comesa.png",
  ceeac: "/logos/rec-ceeac.png",
};

const InstitutionLogo = ({ name, src, className = "max-h-8 max-w-full" }) => {
  const [status, setStatus] = useState(src ? 'loading' : 'failed');

  useEffect(() => {
    if (!src) { setStatus('failed'); return; }
    setStatus('loading');
    const timer = setTimeout(() => {
      setStatus((s) => (s === 'loading' ? 'failed' : s));
    }, 8000);
    return () => clearTimeout(timer);
  }, [src]);

  if (status === 'failed') {
    const initials = name.includes(' ') ? name.split(/\s+/).map(w => w[0]).slice(0, 3).join('') : name;
    return <span className="font-serif font-bold text-slate-400 text-xs tracking-wide">{initials}</span>;
  }
  return (
    <img
      src={src}
      alt={name}
      onLoad={() => setStatus('loaded')}
      onError={() => setStatus('failed')}
      className={`${className} object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300`}
    />
  );
};

// ============================================================================
// 2. DONNÉES STATIQUES
// ============================================================================

const t = {
    fr: {
      title: "South(s) Mobility",
      subtitle: "Savoirs & Données",
      desc: "Analyse citoyenne des migrations mondiales. Une lecture empirique et décolonisée privilégiant la proportionnalité, la gouvernance de l'Union Africaine (CUA) et les dynamiques de transition démographique.",
      sidebar: { title: "Niveaux d'Analyse", subregion: "Sous-région", search: "Rechercher un pays..." },
      all_regions: "Toute l'Afrique",
      perspectives: { continent: "Perspective Continentale", subregion: "Perspective Sous-Régionale" },
      badge: { regional: "Données Macro-Régionales & Gouvernance UA", country: "Profil National" },
      regions: {
        af_med: "Afrique Méditerranéenne", 
        af_west: "Afrique de l'Ouest", 
        af_south: "Afrique Australe", 
        af_east: "Afrique de l'Est", 
        af_central: "Afrique Centrale"
      },
      metrics: { stock: "Stock Total (2024)", female: "Parité (Femmes % 2024)", evolution: "Part Pop. Nationale (2024)" },
      comparative_view_title: "Analyse Comparative : Transition Démographique & Résilience Sud-Sud",
      comparative_view_desc: "Selon le 3e Rapport sur les statistiques migratoires de l'UA (2021) et UNDESA (2024), la dynamique démographique africaine alimente à 70% les marchés du travail régionaux internes. La part des migrants internationaux reste structurellement stable (~1,9% de la population continentale) depuis 1990.",
      modal: {
        close: "Fermer", tabs: { demo: "Démographie", geo: "Géographie & Flux", econ: "Économie & Droits" },
        south_view: "Perspective Analytique des Suds",
        evo_title: "La constante proportionnelle (1990-2024)", parity: "Féminisation des flux (UNDESA 2024)", retention_title: "Rétention Régionale Sud-Sud (UA 2021)",
        orig_dest_title: "Dynamiques de Transition & Proximité", econ_title: "Indépendance Économique & Transferts",
        causal_chain: "Chaîne de causes systémiques", trigger: "Déclencheur", response: "Réponse Migratoire", impact: "Impact Socio-économique",
        data_source: "Sources : UNDESA (2024) / Rapport UA-OIT-OIM-CEA (2021) / IDMC (2025) / UNHCR (2025) / OIT NORMLEX (2025)", export_csv: "Exporter (CSV)", export_pdf: "Rapport (PDF)",
        raw_data_title: "Fiche de Données Brutes", infographic_title: "Infographie : Répartition des Flux",
        idp_title: "Protection & Déplacements Forcés (IDMC/UNHCR 2025)", idp_desc: "L'essentiel de la mobilité contrainte africaine est absorbé à l'intérieur des frontières nationales ou dans les pays limitrophes.",
        idp_conflict: "Déplacés Internes Conflits (IDMC 2025)", idp_disaster: "Déplacés Internes Climat (IDMC 2025)",
        hcr_hosted: "Réfugiés internationaux accueillis (UNHCR 2025)",
        avoi_title: "Intégration Régionale - Indice AVOI (BAD 2024)", avoi_desc: "Score d'ouverture des frontières aux ressortissants africains.",
        au_instruments: "Traités & Conventions Clés de l'Union Africaine (État de ratification 2025)"
      },
      sections: { 
        debunk: "Déconstruction Factuelle des Narratifs", 
        global: "Perspective Globale des Stocks Migratoires (UNDESA, 2024)", 
        explorer: "Explorateur Analytique & Données Consolidées", 
        data: "Cadre d'Indicateurs Recommandés", 
        sdg_gcm: "Alignement ODD (SDGs 2030) & Pactes Mondiaux (GCM / GCR 2018)",
        about_title: "À Propos du Projet", 
        method_title: "Ingénierie & Source des Données" 
      },
      headers: {
        home: {
          badge: "Plateforme de Savoirs & de Données",
          title: "Les mobilités africaines,",
          highlight: "par les données africaines.",
          desc: "Une infrastructure ouverte de recherche et de données sur les mobilités humaines dans les Suds, avec une première focalisation sur l'Afrique — 54 pays, 5 régions, des dizaines de sources institutionnelles vérifiées.",
          plain: "Cette plateforme rassemble et vérifie les chiffres sur les migrations africaines, puis les met en accès libre. Vous pouvez explorer un pays, examiner une affirmation entendue quelque part, ou télécharger les données."
        },
        explorer: {
          badge: "Explorateur Macrorégional & National",
          title: "Cartographier et analyser",
          highlight: "les dynamiques de mobilité.",
          desc: "Consultez les profils détaillés par pays ou par sous-région, intégrant les indicateurs de stock démographique, de parité, de rétention sud-sud et les ratifications des traités.",
          plain: "Choisissez un pays : vous verrez combien de personnes y vivent en venant d'ailleurs, combien en sont parties, où elles sont allées, et quels traités ce pays a signés."
        },
        governance: {
          badge: "Gouvernance & Cadres Stratégiques",
          title: "Architecture panafricaine",
          highlight: "et cadres internationaux.",
          desc: "Explorez l'ancrage multiniveaux de la gouvernance des mobilités, de l'Union africaine et ses blocs régionalisés (CER) jusqu'aux pactes et objectifs mondiaux.",
          plain: "Qui fixe les règles de circulation en Afrique — l'Union africaine, les blocs régionaux, ou chaque État ? Cette section montre les règles écrites, puis lesquelles s'appliquent réellement."
        },
        library: {
          badge: "Centre Documentaire",
          title: "Bibliothèque",
          highlight: "et ressources analytiques.",
          desc: "Un accès centralisé aux rapports de référence, notes de politique (policy briefs), thèses et publications sur la géopolitique des mobilités dans les Suds.",
          plain: "Tous les rapports, articles et bases de données utilisés sur cette plateforme, avec le lien direct pour les consulter. Et un lexique qui explique chaque terme technique."
        },
        labour: {
          badge: "Travail & compétences",
          title: "La mobilité africaine est d'abord",
          highlight: "une mobilité de travail.",
          desc: "Treize millions de travailleurs migrants, concentrés dans des secteurs à forte intensité de main-d'œuvre et largement informels. Ce volet croise les quatre éditions du rapport continental sur les statistiques de migration de travail avec l'état réel des ratifications de conventions de l'OIT — là où se jouent les droits effectivement opposables.",
          plain: "La plupart des Africains qui partent le font pour travailler. Cette section montre dans quels métiers, dans quels pays, et avec quels droits."
        },
        forced: {
          badge: "Déplacement forcé & protection",
          title: "La mobilité qui ne franchit aucune frontière",
          highlight: "et que personne ne compte comme migration.",
          desc: "Déplacés internes, réfugiés, apatrides, déplacement lié aux catastrophes : les formes contraintes de mobilité sont, en Afrique, massivement internes. Elles relèvent d'instruments africains antérieurs et plus larges que les cadres mondiaux — et c'est là que l'écart entre la norme et l'ancrage se paie le plus cher.",
          plain: "En Afrique, la plupart des personnes qui fuient la guerre ou une catastrophe restent dans leur propre pays. Elles n'apparaissent donc dans aucune statistique migratoire. Cette section les compte."
        },
        glossary: {
          badge: "Lexique & Définitions",
          title: "Les mots du régime",
          highlight: "et leur définition africaine.",
          desc: "Chaque notion est définie d'abord par l'instrument africain qui fait référence — Convention de l'OUA sur les réfugiés (1969), Convention de Kampala sur les déplacés internes (2009) — puis, pour les seuls agrégats statistiques, par la définition opératoire d'UN DESA. Le choix du mot n'est jamais neutre : il détermine ce qui est compté.",
          plain: "Le sens exact des mots employés ici. Chaque définition part du texte africain qui fait référence, parce que la façon de nommer décide de ce qui sera compté."
        },
        about: {
          badge: "À propos de la plateforme",
          title: "Une initiative citoyenne",
          highlight: "adossée à une recherche doctorale.",
          desc: "L'origine, le périmètre et les limites assumées de South(s) Mobility DataHub : qui la produit, à partir de quelles données, et ce que la plateforme ne prétend pas être.",
          plain: "Qui produit cette plateforme, pourquoi, et avec quels moyens. Elle est adossée à une thèse de doctorat et reste indépendante de toute institution."
        },
        methodology: {
          badge: "Rigueur & Transparence",
          title: "Ingénierie méthodologique",
          highlight: "et cadre d'indicateurs.",
          desc: "Découvrez l'architecture scientifique de la plateforme, le processus d'harmonisation des données officielles et la matrice des indicateurs alternatifs pour objectiver les mobilités.",
          plain: "D'où viennent les chiffres, comment ils ont été vérifiés, et ce que la plateforme ne peut pas dire. Chaque donnée est traçable jusqu'à sa source."
        }
      },
      home_editorial: {
        badge: "Note de Cadrage Scientifique",
        title: "Pourquoi ce Knowledge Hub ?",
        p1: "Un écart mesurable sépare la perception publique des mobilités africaines de leur réalité statistique. Le stock mondial de migrants internationaux s'élève à environ 304 millions de personnes en 2024, soit 3,6 % de la population mondiale — une proportion restée remarquablement stable depuis 1990 (UN DESA, 2024). Sur ce total, l'Afrique n'accueille qu'environ 29 millions de migrants internationaux sur son sol, soit 9,5 % du stock mondial : loin derrière l'Europe et l'Asie, et bien en deçà du poids démographique du continent (près de 18 % de la population mondiale). Il s'agit ici du stock de migrants présents en Afrique, non de l'émigration africaine : plus de sept migrants d'origine africaine sur dix restent d'ailleurs sur le continent (UA/OIT/OIM/CEA, 2021).",
        p1b: "Cette proportion contraste avec la place que les mobilités africaines occupent dans le débat public occidental, où l'attention se concentre de manière disproportionnée sur les traversées vers l'Europe — un biais médiatique déjà documenté par la recherche (de Haas, 2017). Ce déséquilibre masque une réalité plus structurante : l'essentiel de la mobilité forcée sur le continent n'est pas internationale mais interne. L'Afrique subsaharienne compte à elle seule près de 38,8 millions de personnes déplacées internes, soit environ 46 % du total mondial (82,2 millions recensés dans 104 pays) — davantage que le nombre de migrants internationaux présents sur l'ensemble du continent (IDMC). Autrement dit, la forme de mobilité la plus massive en Afrique ne franchit aucune frontière. Elle ne produit ni image de traversée, ni statistique d'entrée dans les pays du Nord. Elle disparaît donc des récits dominants sur « la migration africaine ».",
        caveats: "Ces chiffres appellent une prudence méthodologique explicite. Les statistiques migratoires africaines souffrent d'un sous-enregistrement chronique — mobilités informelles, circulations transfrontalières non déclarées, capacités administratives inégales selon les pays. Cette plateforme travaille avec les meilleures données disponibles (UN DESA, OIM, IDMC, UA/OIT/OIM/CEA) tout en reconnaissant ces angles morts statistiques, documentés au cas par cas dans la section Méthodologie plutôt que dissimulés. Une distinction s'impose enfin sur les définitions. Pour les agrégats statistiques, la plateforme retient la définition opératoire d'UN DESA — condition de toute comparaison internationale. Pour les notions juridiques et normatives, en revanche, c'est l'instrument africain qui fait référence. Le réfugié se lit à travers la Convention de l'OUA de 1969, plus large que celle de Genève ; la personne déplacée interne, à travers la Convention de Kampala de 2009. Chaque terme est explicité dans le Glossaire.",
        p2: "Ce constat s'inscrit dans un cadre théorique plus large. La recherche sur les « capabilités de mouvement » invite à penser mobilité et immobilité comme les deux faces d'un même continuum d'aspirations et de capacités effectivement exerçables, plutôt que comme une dichotomie entre départ volontaire et départ contraint (de Haas, 2021). Les travaux sur la « diplomatie migratoire » montrent que les États africains négocient, retournent et instrumentalisent les agendas migratoires du Nord, loin d'en être de simples récepteurs la coopération migratoire à leur propre bénéfice (Adamson & Tsourapas, 2019). Une lecture décoloniale du droit international de la migration questionne enfin l'asymétrie structurelle des régimes de mobilité mondiaux (Achiume, 2019).",
        p3: "South(s) Mobility DataHub part de ce cadre pour proposer une réponse méthodologique plutôt que polémique : consolider, harmoniser et recontextualiser des données déjà produites par les institutions internationales et africaines, plutôt que d'en produire de nouvelles. La plateforme privilégie la proportion à la valeur absolue, et la comparaison à l'anecdote. Elle place l'architecture institutionnelle africaine — Union africaine, Communautés économiques régionales — avant les seuls cadres normatifs venus du Nord, sans nier pour autant les asymétries de pouvoir et de financement qui structurent ce régime (Bakewell, 2008 ; Bayart, 2000).",
        p3b: "Cette architecture produit un paradoxe que la plateforme documente chiffre à l'appui. L'Afrique n'est pas en retard sur la norme : elle l'a parfois devancée, en adoptant avec la Convention de Kampala (2009) le premier — et toujours le seul — traité régional contraignant au monde sur les personnes déplacées internes. Quatre États (Bénin, Gambie, Rwanda, Seychelles) accueillent déjà sans visa l'ensemble des ressortissants africains. Pourtant, le Protocole continental sur la libre circulation adopté à Kigali en 2018 ne compte que 4 ratifications sur 54, très loin des 15 requises pour son entrée en vigueur. C'est donc l'ancrage dans les administrations qui tarde, bien plus que la production normative nationales.",
        pullquote: "Entre les principes proclamés à Addis-Abeba et leur application aux postes-frontières s'ouvre un « entre-deux national » : l'espace où le régime africain de gouvernance migratoire se joue réellement (Ben Mokhtar, 2026).",
        p5: "Ce cadrage doit enfin à une enquête de terrain : une observation participante menée entre 2023 et 2025 au sein de l'Observatoire Africain des Migrations (Rabat), documentée dans la section Gouvernance (Ben Mokhtar, 2026). Elle donne accès à la fabrique bureaucratique ordinaire du régime — ateliers, arbitrages budgétaires, circuits de validation — là où les cadres normatifs, examinés seuls, ne montrent que leur façade.",
        p4: "Cette exigence scientifique n'exclut pas la vulgarisation : elle la conditionne. La section Evidence Check applique cette méthode affirmation par affirmation ; la section Gouvernance documente l'architecture institutionnelle qui tente — avec des moyens souvent limités — de gouverner ces mobilités à l'échelle continentale. Le lecteur pressé peut se contenter des chiffres ; le lecteur exigeant trouvera, à chaque affirmation, la source qui la fonde. Une réserve, enfin, sur ce que cette plateforme ne prétend pas être : elle ne produit aucune statistique officielle, ne se substitue à aucun institut national de statistique et ne formule aucune recommandation de politique publique. Elle consolide, situe et rend citable un matériau déjà public — en assumant que le choix de ce qui est mis en avant, et de l'échelle à laquelle on le rapporte, constitue déjà un geste analytique et non le simple reflet des données.",
        refs_title: "Pour aller plus loin",
        refs: [
          { text: "de Haas, H. (2021). A theory of migration: the aspirations–capabilities framework. Comparative Migration Studies.", url: "https://doi.org/10.1186/s40878-020-00210-4" },
          { text: "de Haas, H. (2023). How Migration Really Works. Penguin Books.", url: null },
          { text: "de Haas, H. (2017, 29 mars). Myths of migration: Much of what we think we know is wrong. Der Spiegel.", url: null },
          { text: "Adamson, F. & Tsourapas, G. (2019). Migration Diplomacy in World Politics. International Studies Perspectives.", url: "https://doi.org/10.1093/isp/eky015" },
          { text: "Achiume, E. T. (2019). Migration as Decolonization. Stanford Law Review.", url: "https://ssrn.com/abstract=3330353" },
          { text: "Bakewell, O. (2008). 'Keeping Them in Their Place'. Third World Quarterly.", url: "https://doi.org/10.1080/01436590802386492" },
          { text: "IDMC. Global Report on Internal Displacement (GRID).", url: "https://www.internal-displacement.org/global-report/grid2025/" },
          { text: "BAD & CUA. Africa Visa Openness Report (2024).", url: "https://www.visaopenness.org/" },
        ]
      },
      global_stats: {
        world: "Total Mondial (2024)", europe: "Europe (2024)", asia: "Asie (2024)", na: "Amérique du Nord (2024)", africa: "Afrique (2024)", latam: "Amérique Latine (2024)", share: "Part mondiale :",
        note: "Données UNDESA (2024) : L'Afrique ne représente que 9,5% du stock migratoire mondial (28,5 M), loin derrière l'Europe (94 M) et l'Asie (92 M)."
      },
      sdg_section: {
        title: "Ancrage International : ODD (2030), GCM (2018) & GCR (2018)",
        subtitle: "L'Agenda 2030 de l'ONU, le Pacte de Marrakech pour les Migrations (GCM) et le Pacte sur les Réfugiés (GCR).",
        tab_sdg: "Objectifs de Développement Durable (ODD)",
        tab_gcm: "Pacte Mondial pour les Migrations (GCM)",
        tab_gcr: "Pacte Mondial sur les Réfugiés (GCR)",
        sdg_desc: "L'Agenda 2030 de l'ONU intègre formellement les mobilités comme accélérateur de développement. La Cible 17.18 impose la désagrégation des données statistiques par statut migratoire.",
        gcm_desc: "Adopté à Marrakech en 2018, le Pacte Mondial pour des Migrations Sûres, Ordonnées et Régulières énonce 23 objectifs structurants axés sur la souveraineté, les droits et la coopération factuelle.",
        gcr_desc: "Affirmé en 2018, le Pacte Mondial sur les Réfugiés (GCR) établit un cadre de partage équitable des charges pour soutenir les pays du Sud qui accueillent 76% des réfugiés mondiaux.",
        link_text: "Accéder au portail officiel",
        sdg_points: [
          { goal: 10, title: "Cible 10.7 (Gouvernance des migrations)", desc: "Faciliter une migration ordonnée, sûre, régulière et responsable grâce à des politiques planifiées et bien gérées. Pierre angulaire de l'Agenda 2030 pour la migration, suivie par 4 indicateurs (coûts de recrutement, gouvernance, sécurité des parcours, réfugiés)." },
          { goal: 10, title: "Cible 10.c (Réduction des coûts de transfert)", desc: "Ramener à moins de 3% les coûts de transaction des envois de fonds des diasporas (Banque Mondiale)." },
          { goal: 17, title: "Cible 17.18 (Désagrégation des données)", desc: "Renforcer les capacités statistiques nationales pour ventiler les données selon le statut migratoire." },
          { goal: 8, title: "Cible 8.8 (Droits des travailleurs migrants)", desc: "Protéger les droits du travail et promouvoir un environnement sûr pour tous les travailleurs migrants, en particulier les femmes (OIT)." },
          { goal: 4, title: "Cible 4.b (Mobilité étudiante & bourses)", desc: "Développer les bourses offertes aux pays en développement pour l'enseignement supérieur — un vecteur direct de circulation intra-africaine et Sud-Sud des compétences." },
          { goal: 16, title: "Cible 16.9 (Identité légale pour tous)", desc: "Garantir à tous une identité juridique, notamment via l'enregistrement des naissances — condition préalable à l'accès aux documents de voyage et à la mobilité régulière." }
        ],
        gcm_objectives_list: [
          { num: "Obj. 1", title: "Données factuelles", desc: "Recueillir et utiliser des données factuelles et ventilées pour l'élaboration de politiques." },
          { num: "Obj. 2", title: "Causes structurelles", desc: "Minimiser les facteurs défavorables et structurels qui poussent les personnes à quitter leur pays." },
          { num: "Obj. 3", title: "Information et orientation", desc: "Fournir aux migrants des informations exactes et en temps voulu à toutes les étapes de la migration." },
          { num: "Obj. 4", title: "Preuve d'identité légale", desc: "Veiller à ce que tous les migrants disposent d'une preuve d'identité légale et de documents adéquats." },
          { num: "Obj. 5", title: "Voies de migration régulière", desc: "Améliorer et élargir les voies d'accès à la migration régulière et sûre." },
          { num: "Obj. 6", title: "Recrutement équitable", desc: "Favoriser un recrutement équitable et éthique et interdire les frais facturés aux travailleurs." },
          { num: "Obj. 7", title: "Vulnérabilités", desc: "Réduire les vulnérabilités dans le contexte de la migration à travers des réponses axées sur les droits." },
          { num: "Obj. 8", title: "Sauver des vies", desc: "Saluer et intensifier la recherche et le sauvetage conjoints des migrants en détresse." },
          { num: "Obj. 9", title: "Trafic illicite", desc: "Renforcer la coopération internationale pour lutter contre le trafic illicite de migrants." },
          { num: "Obj. 10", title: "Traite des êtres humains", desc: "Prévenir et combattre la traite dans le contexte de la migration internationale." },
          { num: "Obj. 11", title: "Gestion des frontières", desc: "Gérer les frontières de manière intégrée, sûre et coordonnée tout en respectant les droits." },
          { num: "Obj. 12", title: "Séjour régulier", desc: "Accroître la certitude et la prévisibilité des procédures de migration pour un séjour régulier." },
          { num: "Obj. 13", title: "Détention administrative", desc: "Recourir à la détention des migrants qu'en dernier ressort et chercher des solutions alternatives." },
          { num: "Obj. 14", title: "Protection consulaire", desc: "Renforcer la protection, l'assistance et la coopération consulaires." },
          { num: "Obj. 15", title: "Services de base", desc: "Garantir aux migrants l'accès aux services de base (santé, éducation, protection sociale)." },
          { num: "Obj. 16", title: "Intégration et cohésion", desc: "Favoriser l'inclusion à long terme et la cohésion sociale dans les sociétés d'accueil." },
          { num: "Obj. 17", title: "Élimination des discriminations", desc: "Éliminer toutes les formes de discrimination et promouvoir un discours public factuel." },
          { num: "Obj. 18", title: "Compétences", desc: "Investir dans le développement des compétences et faciliter la reconnaissance mutuelle des qualifications." },
          { num: "Obj. 19", title: "Diasporas", desc: "Créer conditions propices pour que les diasporas contribuent pleinement au développement durable." },
          { num: "Obj. 20", title: "Transferts de fonds", desc: "Promouvoir des transferts de fonds rapides, sûrs et moins coûteux et stimuler l'inclusion financière." },
          { num: "Obj. 21", title: "Retour et réadmission", desc: "Coopérer pour assurer un retour et une réadmission sûrs et dignes, ainsi qu'une réintégration durable." },
          { num: "Obj. 22", title: "Sécurité sociale", desc: "Établir des mécanismes de portabilité des droits sociaux et des prestations de retraite." },
          { num: "Obj. 23", title: "Coopération internationale", desc: "Renforcer la coopération internationale et les partenariats mondiaux pour une migration sûre." }
        ],
        gcr_objectifs: [
          { title: "1. Alléger la pression sur les pays d'accueil", desc: "Soutenir structurellement les pays du Sud (Ouganda, Tchad, Soudan) qui accueillent l'immense majorité des réfugiés." },
          { title: "2. Renforcer l'autonomie des réfugiés", desc: "Favoriser l'accès au marché du travail national et sortir des logiques de camps fermés." },
          { title: "3. Élargir les solutions dans les pays tiers", desc: "Accroître les voies régulières (réinstallation, parrainage, visas d'études et de travail)." },
          { title: "4. Soutenir les conditions de retour", desc: "Créer un cadre favorable aux retours volontaires, sûrs et dignes lorsque la situation le permet." }
        ]
      },
      indicator_desc: "Matrice méthodologique recommandée pour objectiver la gouvernance des mobilités et orienter la collecte d'Open Data sur le terrain.",
      download_indicators: "Télécharger la Matrice (CSV)",
      debunk_cards: [
        { myth: "L'explosion migratoire africaine incontournable.", real: "Stabilité de la proportion continentale (~1,9%).", stat_text: "1.9% (2024)", stat_val: 1.9, color: "bg-blue-700", desc: "UNDESA (2024) : La part des migrants internationaux africains dans la population du continent stagne autour de 1,9% depuis 1990. La hausse du volume absolu est un simple reflet de la croissance démographique globale." },
        { myth: "L'Afrique migre massivement vers l'Europe.", real: "Les migrations intra-africaines dominent à 70%.", stat_text: "70% (2021)", stat_val: 70, color: "bg-teal-700", desc: "Rapport UA/OIT (2021) : 70% des mobilités internationales africaines s'effectuent au sein du continent même (ex: Côte d'Ivoire, Afrique du Sud, Nigéria)." },
        { myth: "Le Nord accueille l'écrasante majorité des réfugiés.", real: "76% des réfugiés restent dans les pays du Sud.", stat_text: "76% (2025)", stat_val: 76, color: "bg-amber-700", desc: "UNHCR (2025) : Plus des trois quarts des personnes fuyant les conflits armés trouvent refuge dans un pays frontalier en développement (ex: Ouganda, Tchad, Éthiopie)." },
        { myth: "La migration africaine est quasi-exclusivement masculine.", real: "Féminisation structurelle des flux (45% à 47%).", stat_text: "47% (2024)", stat_val: 47, color: "bg-purple-700", desc: "UNDESA (2024) / UA (2021) : Les femmes représentent près de la moitié des migrants internationaux en Afrique, redéfinissant l'économie autonome du soin et du commerce transfrontalier." },
        { myth: "L'Afrique dépend financièrement de l'Aide Publique.", real: "86,4 milliards $ d'envois de fonds dépassent l'APD.", stat_text: "86.4 Mrd $ (2019)", stat_val: 85, color: "bg-amber-600", desc: "Banque Mondiale / UA (2021) : Les transferts de la diaspora (86,4 Mrd $ en 2019) dépassent largement l'Aide Publique au Développement (APD) et constituent le premier capital de résilience." },
        { myth: "Le changement climatique va vider l'Afrique vers le Nord.", real: ">90% des déplacements climatiques sont internes.", stat_text: ">90% (2025)", stat_val: 90, color: "bg-cyan-700", desc: "IDMC (2025) : Plus de 90% des personnes déplacées par des chocs climatiques (sécheresses, inondations) restent au sein de leurs frontières nationales ou sous-régionales." },
        { myth: "Les pays d'Afrique côtière ne sont que de simples zones de transit.", real: "Transformation structurelle en pays de destination.", stat_text: "Mutation (2024)", stat_val: 65, color: "bg-indigo-700", desc: "Les données d'installation démontrent que les pays autrefois qualifiés de 'transit' deviennent des pôles d'ancrage économique durable pour la main-d'œuvre régionale." },
        { myth: "Le développement économique stoppe mécaniquement les départs.", real: "Le paradoxe de la transition (Migration Hump).", stat_text: "Catalyseur (2024)", stat_val: 80, color: "bg-rose-700", desc: "Démontré empiriquement : l'augmentation initiale des revenus fournit aux ménages le capital financier nécessaire pour financer un projet migratoire régulier." },
        { myth: "Les travailleurs migrants sont un fardeau pour le pays hôte.", real: "Moteurs de l'emploi et de la valeur ajoutée locale.", stat_text: "+ Valeur (2021)", stat_val: 85, color: "bg-emerald-700", desc: "Rapport UA/OIT (2021) : dans les dix États ayant déclaré leurs données d'emploi, 27,5 % des migrants occupés travaillent dans l'agriculture, la sylviculture ou la pêche — ils y comblent des pénuries de main-d'œuvre tout en dynamisant les marchés locaux. La couverture déclarative reste le point faible : voir Données & Stats." }
      ],
      about: {
        intro_title: "À propos de South(s) Mobility",
        intro_subtitle: "Une infrastructure ouverte pour comprendre les mobilités dans les Suds",
        intro_p1: "South(s) Mobility DataHub est une plateforme indépendante de recherche, de données et de visualisation consacrée aux mobilités humaines dans les Suds, avec une première focalisation sur l'Afrique.",
        intro_p2: "À l'intersection des sciences sociales, de la science des données et des études sur les migrations, la plateforme rassemble, harmonise et valorise des données, indicateurs, cartes, publications, instruments juridiques et ressources documentaires provenant d'institutions internationales, régionales et nationales.",
        intro_p3: "Son ambition est de rendre les données sur les mobilités humaines plus accessibles, plus comparables et plus intelligibles, afin de favoriser une compréhension empirique, nuancée et documentée des dynamiques migratoires contemporaines.",
        
        research_title: "Une plateforme née de la recherche",
        research_p1: "South(s) Mobility est issu d'un projet de recherche doctorale consacré à la gouvernance des migrations africaines.",
        research_p2: "Au cours de cette recherche, un constat s'est imposé : une grande quantité de données de qualité est déjà produite par des institutions publiques et internationales, mais ces ressources demeurent largement dispersées, hétérogènes et parfois difficiles d'accès. Les croiser, les contextualiser ou simplement les retrouver représente souvent un travail considérable.",
        research_p3: "South(s) Mobility est né de cette observation. Le projet rassemble ces ressources dans un environnement unique, ouvert et évolutif. Chercheurs, étudiants, journalistes, décideurs publics, organisations internationales — et quiconque s'intéresse aux mobilités humaines — peuvent ainsi les consulter, les comparer et les réutiliser.",
        research_p4: "Il s'inscrit dans une démarche de science ouverte (Open Science), de diffusion des connaissances et de valorisation de la recherche.",

        data_title: "Une approche fondée sur les données",
        data_p1: "Le projet privilégie une approche empirique, transparente et méthodologiquement rigoureuse. Les données et ressources présentées proviennent principalement d'organisations reconnues, notamment :",
        data_list: [
          { name: "Commission de l'Union africaine (CUA)", url: "https://au.int/fr", logo: "au" },
          { name: "Nations Unies — UN DESA", url: "https://www.un.org/development/desa/pd/data/international-migrant-stock", logo: "un" },
          { name: "HCR — Statistiques sur les réfugiés", url: "https://www.unhcr.org/refugee-statistics/", logo: "unhcr" },
          { name: "Organisation internationale pour les migrations (OIM)", url: "https://www.iom.int/", logo: "iom" },
          { name: "Organisation internationale du travail — NORMLEX", url: "https://normlex.ilo.org/", logo: "ilo" },
          { name: "Banque mondiale", url: "https://data.worldbank.org/", logo: "worldbank" },
          { name: "KNOMAD — Transferts de fonds & développement", url: "https://www.knomad.org/", logo: "knomad" },
          { name: "Banque africaine de développement (BAD)", url: "https://www.afdb.org/fr", logo: "afdb" },
          { name: "Commission économique pour l'Afrique (CEA)", url: "https://www.uneca.org/", logo: "uneca" },
          { name: "Internal Displacement Monitoring Centre (IDMC)", url: "https://www.internal-displacement.org/", logo: "idmc" },
          { name: "Fondation Mo Ibrahim — IIAG", url: "https://mo.ibrahim.foundation/our-research/iiag", logo: "moibrahim" },
          { name: "Mixed Migration Centre — 4Mi", url: "https://mixedmigration.org/", logo: "mmc" },
          { name: "Afrobarometer", url: "https://www.afrobarometer.org/", logo: "afrobarometer" },
          { name: "OCDE", url: "https://data.oecd.org/", logo: "oecd" },
          { name: "Commission européenne — JRC / KCMD", url: "https://knowledge4policy.ec.europa.eu/migration-demography_en", logo: "ecjrc" },
          { name: "Communautés économiques régionales africaines", url: "https://au.int/fr/organs/recs", logo: null },
          { name: "Instituts nationaux de statistique", url: null, logo: null }
        ],
        data_p2: "Chaque jeu de données conserve sa source d'origine. Lorsque plusieurs institutions proposent des estimations différentes, ces divergences sont signalées et replacées dans leur contexte méthodologique. Les limites des données sont indiquées autant que possible afin de favoriser une lecture critique et éclairée.",
        data_p3: "South(s) Mobility ne produit pas de statistiques officielles. La plateforme agit comme une infrastructure de consolidation, de contextualisation et de diffusion des connaissances.",

        south_title: "Une perspective ancrée dans les Suds",
        south_p1: "South(s) Mobility adopte une perspective centrée sur les Suds, en accordant une attention particulière aux dynamiques souvent moins visibles dans les bases de données internationales. Cela inclut notamment :",
        south_list: [
          "Les migrations intra-africaines",
          "Les mobilités Sud-Sud",
          "Les communautés économiques régionales africaines",
          "Les instruments juridiques continentaux",
          "Les politiques africaines de mobilité",
          "Les corridors régionaux",
          "Les diasporas",
          "Les déplacements internes",
          "Les connaissances produites depuis les institutions et les chercheurs des Suds"
        ],
        south_p2: "À plus long terme, cette approche a vocation à être progressivement étendue à d'autres régions du monde, notamment l'Amérique latine, les Caraïbes et l'Asie.",

        evolution_title: "Une plateforme en évolution permanente",
        evolution_p1: "South(s) Mobility est un projet évolutif, enrichi au fil de la recherche. Plutôt que d'annoncer une feuille de route indistincte, la plateforme distingue ici ce qui est effectivement disponible de ce qui reste à construire.",
        evolution_done: [
          "Un observatoire des narratifs, confrontant les affirmations courantes aux données",
          "Des profils détaillés pour les 54 pays et les 5 sous-régions de l'UA",
          "Des fiches pour les 8 communautés économiques régionales, cartes à l'appui",
          "Un référentiel des instruments juridiques africains et de leurs ratifications",
          "Une matrice comparée des régimes d'entrée et de séjour des 54 pays",
          "Une bibliothèque documentaire et un glossaire bilingue référencés",
          "Des exports CSV pour chaque jeu de données affiché",
          "Des dossiers PDF citables, source et référence intégrées"
        ],
        evolution_next: [
          "Des séries chronologiques harmonisées au-delà des points de comparaison 1990 et 2024",
          "Des tableaux de bord thématiques (travail, climat, protection)",
          "La collecte pilote des indicateurs alternatifs proposés dans la Méthodologie",
          "Une extension progressive à d'autres régions des Suds"
        ],
        evolution_p2: "L'objectif est de construire progressivement une infrastructure de référence pour l'étude des mobilités humaines dans les Suds.",

        founder_title: "À propos du fondateur",
        founder_p1: "South(s) Mobility a été fondé par Yassine Ben Mokhtar, doctorant en relations internationales dont les recherches portent sur la gouvernance des migrations africaines, les dynamiques institutionnelles continentales et les politiques de mobilité.",
        founder_p2: "Le projet s'appuie sur plusieurs années de recherche académique, d'analyse documentaire et de terrain, ainsi que sur une expérience professionnelle auprès d'institutions travaillant sur les questions migratoires et de gouvernance en Afrique.",
        founder_p3: "South(s) Mobility constitue à la fois un prolongement de cette recherche et une initiative de valorisation scientifique destinée à rendre les connaissances, les données et les ressources plus accessibles au plus grand nombre.",
        founder_p4: "Les analyses, interprétations et éventuelles erreurs relèvent de la seule responsabilité de son auteur et n'engagent aucune institution avec laquelle il a collaboré.",

        collab_title: "Collaborer & Contact",
        collab_p1: "South(s) Mobility est ouvert aux collaborations académiques, institutionnelles et techniques. Les propositions de jeux de données, publications, visualisations, corrections, projets communs ou partenariats sont les bienvenues.",
        contact_p: "Pour toute question, proposition de collaboration ou contribution au projet :",
        disclaimer: "South(s) Mobility est un projet indépendant en développement actif. Les contenus, fonctionnalités et jeux de données sont régulièrement enrichis afin d'améliorer la couverture, la qualité et l'accessibilité des informations disponibles.",
        
        citation_title: "Pour citer ce projet :",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub : Une infrastructure ouverte pour comprendre les mobilités dans les Suds. Récupéré de https://southsmobility.vercel.app/"
      },
      method: { 
        summary: "La plateforme ne produit pas de données primaires : elle consolide des séries publiques et documente chaque opération appliquée. Six principes régissent ce traitement.",
        m1: "Traçabilité de la source. Chaque indicateur est rattaché à une institution productrice nommée (UN DESA, HCR, IDMC, OIT, Banque mondiale, BAD, CUA, OIM) et à une série publiquement consultable. Les {libraryCount} références mobilisées sont listées dans la Bibliothèque ; aucune valeur n'est retenue sans provenance identifiable.",
        m2: "Harmonisation du périmètre. Les séries sont ramenées à 54 pays et au découpage régional de l'Union africaine — et non à la nomenclature M49 des Nations unies. Le Sahara occidental est intégré au Maroc, y compris cartographiquement. Une table d'alias réconcilie les variantes de dénomination entre jeux de données (« RDC » / « R.D. Congo », « Cap-Vert » / « Cabo Verde ») sans renommer les sources.",
        m3: "Datation champ par champ. Les millésimes ne sont pas alignés artificiellement : transferts de fonds, activité des migrants et ratifications portent chacun leur année d'observation. Aucune interpolation n'est pratiquée pour produire une homogénéité de façade, et un chiffre non vérifiable est affiché daté et assorti d'une réserve plutôt que lissé.",
        m4: "Proportion plutôt que valeur absolue. Les effectifs sont systématiquement rapportés à la population de référence. Les échelles ne sont jamais mélangées dans une même représentation (l'indice AVOI est stocké de 0 à 100 au niveau des pays, de 0 à 1 au niveau des CER). Les cartes choroplèthes utilisent un découpage par quantiles, robuste aux distributions très asymétriques comme celle des déplacés internes.",
        m5: "Évaluation juridique seuillée. Les décomptes de ratification sont vérifiés sur les portails officiels avant publication. Le seuil d'entrée en vigueur — 15 États parties pour cette catégorie de protocoles — est stocké par instrument et pilote directement l'affichage du statut « en vigueur » ou « pas encore en vigueur ».",
        m6: "Restitution reproductible. Les huit jeux de données affichés sont exportables en CSV conforme au format RFC 4180, et chaque dossier PDF embarque sa source, l'adresse de la plateforme et la référence de citation. Les fonds cartographiques dérivent de Natural Earth (50 m), en projection Mercator, simplifiés par l'algorithme de Douglas-Peucker.",
        sources_title: "Accès aux Datasets Originaux, Rapports & Cadres Légaux :",
        s1: "Union Africaine & CUA / OIT / OIM / CEA - 3e Rapport sur les statistiques migratoires (2021)",
        s2: "UNDESA - Stock migratoire mondial (2024)",
        s3: "UNHCR - Global Trends Report (2025)",
        s4: "IDMC - GRID Report (2025)",
        s5: "OIM - World Migration Report (2024)",
        s6: "OIT NORMLEX - Normes Internationales du Travail (2025)",
        s7: "Union Africaine - Traités, Conventions et Protocoles (2025)",
        s8: "Banque Mondiale - Base de données des transferts de fonds (2024)"
      },
      myth: "Postulat", reality: "Donnée Factuelle",
      footer: { tag: "L'ingénierie des données au service d'un nouveau récit factuel sur les mobilités.", sources: "Sources : UA / OIT / OIM / CEA (2021) • UN DESA (2024) • UNHCR (2025) • IDMC (2025) • OIT NORMLEX (2025) • Banque Mondiale (2024)" },
      analysis_title: "Tableau de Bord Détaillé", analysis_btn: "Accéder au rapport"
    },
    en: {
      title: "South(s) Mobility", subtitle: "Knowledge & Data",
      desc: "Citizen analysis of global migrations. An empirical, decolonized reading prioritizing mathematical proportionality, African Union (AU) governance frameworks, and demographic transition dynamics.",
      sidebar: { title: "Analysis Levels", subregion: "Sub-region", search: "Search country..." },
      all_regions: "All Africa",
      perspectives: { continent: "Continental Perspective", subregion: "Sub-regional Perspective" },
      badge: { regional: "Macro-Regional Data & AU Governance", country: "National Profile" },
      regions: { 
        af_med: "Mediterranean Africa", 
        af_west: "West Africa", 
        af_south: "Southern Africa", 
        af_east: "East Africa", 
        af_central: "Central Africa" 
      },
      metrics: { stock: "Total Stock (2024)", female: "Parity (Women % 2024)", evolution: "Nat. Pop. Share (2024)" },
      comparative_view_title: "Comparative Analysis: Demographic Transition & South-South Resilience",
      comparative_view_desc: "According to the 3rd AU Labour Migration Report (2021) and UNDESA (2024), African demographic dynamics feed 70% into internal regional labor markets. The international migrant share remains structurally stable (~1.9% of total continental population) since 1990.",
      modal: { 
        close: "Close", tabs: { demo: "Demography", geo: "Geography & Flows", econ: "Economy & Treaties" }, 
        south_view: "Analytical Perspective", evo_title: "The Proportional Constant (1990-2024)", parity: "Feminization of flows (UNDESA 2024)", retention_title: "Regional South-South Retention (AU 2021)", orig_dest_title: "Transition & Proximity Dynamics", econ_title: "Economic Independence & Remittances", 
        causal_chain: "Systemic Causal Chain", trigger: "Trigger", response: "Migratory Response", impact: "Socio-economic Impact", 
        data_source: "Sources: UNDESA (2024) / AU-ILO-IOM-ECA Report (2021) / IDMC (2025) / UNHCR (2025) / ILO NORMLEX (2025)", export_csv: "Export (CSV)", export_pdf: "Report (PDF)", 
        raw_data_title: "Raw Data Sheet", infographic_title: "Infographic: Flow Distribution",
        idp_title: "Protection & Forced Displacement (IDMC/UNHCR 2025)", idp_desc: "The vast majority of African forced mobility is absorbed within national borders or neighboring countries.", 
        idp_conflict: "Internally Displaced Conflict (IDMC 2025)", idp_disaster: "Internally Displaced Climate (IDMC 2025)",
        hcr_hosted: "International Refugees Hosted (UNHCR 2025)",
        avoi_title: "Regional Integration - AVOI Index (AfDB 2024)", avoi_desc: "Visa openness index for citizens of other African countries.",
        au_instruments: "Key African Union Treaties & Conventions (Ratification Status 2025)"
      },
      sections: { 
        debunk: "Factual Deconstruction of Narratives", 
        global: "Global Perspective of Migrant Stocks (UNDESA, 2024)", 
        explorer: "Analytical Explorer & Consolidated Data", 
        data: "Recommended Indicators Framework", 
        sdg_gcm: "SDG Alignment (SDGs 2030) & Global Compacts (GCM / GCR 2018)",
        about_title: "About the Project", 
        method_title: "Engineering & Data Sourcing" 
      },
      headers: {
        home: {
          badge: "Knowledge & Data Platform",
          title: "African mobility,",
          highlight: "through African data.",
          desc: "An open research and data infrastructure on human mobility in the Global South, with an initial focus on Africa — 54 countries, 5 regions, dozens of verified institutional sources.",
          plain: "This platform gathers and checks the figures on African migration, then opens them to everyone. You can explore a country, examine a claim you heard somewhere, or download the data."
        },
        explorer: {
          badge: "Macro-Regional & National Explorer",
          title: "Mapping and analyzing",
          highlight: "mobility dynamics.",
          desc: "Explore detailed country or sub-regional profiles featuring demographic stocks, gender parity, South-South retention rates, and treaty ratifications.",
          plain: "Pick a country: you will see how many people live there having come from elsewhere, how many left, where they went, and which treaties the country has signed."
        },
        governance: {
          badge: "Governance & Strategic Frameworks",
          title: "Pan-African architecture",
          highlight: "and international frameworks.",
          desc: "Explore the multilevel anchoring of mobility governance, from the African Union and its regional building blocks (RECs) to global compacts and goals.",
          plain: "Who sets the rules of movement in Africa — the African Union, the regional blocs, or each state? This section shows the rules on paper, then which ones actually apply."
        },
        library: {
          badge: "Documentary Center",
          title: "Library",
          highlight: "and analytical resources.",
          desc: "Centralized access to reference reports, policy briefs, theses, and publications on mobility geopolitics in the Global South.",
          plain: "Every report, article and dataset used on this platform, with a direct link to each. Plus a lexicon explaining every technical term."
        },
        labour: {
          badge: "Labour & skills",
          title: "African mobility is first and foremost",
          highlight: "a mobility of labour.",
          desc: "Thirteen million migrant workers, concentrated in labour-intensive and largely informal sectors. This section crosses the four editions of the continental report on labour migration statistics with the actual state of ILO convention ratifications — where enforceable rights are decided.",
          plain: "Most Africans who leave do so in order to work. This section shows in which trades, in which countries, and with which rights."
        },
        forced: {
          badge: "Forced displacement & protection",
          title: "The mobility that crosses no border",
          highlight: "and that nobody counts as migration.",
          desc: "Internally displaced people, refugees, stateless persons, disaster displacement: in Africa the constrained forms of mobility are overwhelmingly internal. They fall under African instruments that predate and exceed the global frameworks — and it is here that the gap between norm and anchoring costs the most.",
          plain: "In Africa, most people fleeing war or disaster stay inside their own country. They therefore appear in no migration statistic. This section counts them."
        },
        glossary: {
          badge: "Lexicon & Definitions",
          title: "The words of the regime",
          highlight: "and their African definition.",
          desc: "Each term is defined first by the African instrument that governs it — the OAU Refugee Convention (1969), the Kampala Convention on internally displaced persons (2009) — then, for statistical aggregates only, by UN DESA's operational definition. The choice of word is never neutral: it determines what gets counted.",
          plain: "The exact meaning of the words used here. Each definition starts from the African instrument that governs it, because how something is named decides what gets counted."
        },
        about: {
          badge: "About the platform",
          title: "A civic initiative",
          highlight: "grounded in doctoral research.",
          desc: "The origin, scope and stated limits of South(s) Mobility DataHub: who produces it, from which data, and what the platform does not claim to be.",
          plain: "Who produces this platform, why, and with what resources. It is grounded in doctoral research and remains independent of any institution."
        },
        methodology: {
          badge: "Rigor & Transparency",
          title: "Methodological engineering",
          highlight: "and indicators framework.",
          desc: "Explore the scientific architecture of the platform, the official data harmonization process, and alternative indicators for objective mobility analysis.",
          plain: "Where the figures come from, how they were checked, and what the platform cannot tell you. Every data point is traceable back to its source."
        }
      },
      home_editorial: {
        badge: "Scientific Framing Note",
        title: "Why this Knowledge Hub?",
        p1: "A measurable gap separates public perception of African mobility from its statistical reality. The world's international migrant stock stands at roughly 304 million people in 2024, or 3.6% of the world's population — a share that has remained remarkably stable since 1990 (UN DESA, 2024). Of that total, Africa hosts only about 29 million international migrants on its soil, or 9.5% of the world stock: far behind Europe and Asia, and well below the continent's demographic weight (close to 18% of the world's population). This is the stock of migrants present in Africa, not African emigration: more than seven in ten migrants of African origin in fact remain on the continent (AU/ILO/IOM/ECA, 2021).",
        p1b: "This proportion contrasts sharply with the place African mobility occupies in Western public debate, where attention is disproportionately focused on crossings toward Europe — a media bias already documented by research (de Haas, 2017). This imbalance obscures a more structural reality: most forced mobility on the continent stays inside national borders. Sub-Saharan Africa alone accounts for close to 38.8 million internally displaced people — roughly 46% of the global total (82.2 million recorded across 104 countries), and more than the number of international migrants present across the entire continent (IDMC). In other words, Africa's largest form of mobility crosses no border at all: it produces neither crossing imagery nor entry statistics in Northern countries, and therefore vanishes from dominant narratives about \"African migration\".",
        caveats: "These figures call for explicit methodological caution. African migration statistics suffer from chronic under-registration — informal mobility, undeclared cross-border circulation, uneven administrative capacity across countries. This platform works with the best available data (UN DESA, IOM, IDMC, AU/ILO/IOM/ECA) while acknowledging these statistical blind spots, documented case by case in the Methodology section rather than concealed. One distinction finally matters on definitions. For statistical aggregates, the platform retains UN DESA's operational definition — a precondition for any international comparison. But for legal and normative concepts, the African instrument is the reference: refugee is read through the 1969 OAU Convention, broader than the Geneva one, and internally displaced person through the 2009 Kampala Convention. Each term is spelled out in the Glossary.",
        p2: "This observation sits within a broader theoretical framework. Research on \"capabilities of movement\" invites us to think of mobility and immobility as two faces of the same continuum of aspirations and actually exercisable capabilities, rather than a dichotomy between voluntary and forced departure (de Haas, 2021). Work on \"migration diplomacy\" shows that African states negotiate, redirect and instrumentalize migration cooperation with the North, far from merely receiving its agendas to their own benefit (Adamson & Tsourapas, 2019). A decolonial reading of international migration law, finally, questions the structural asymmetry of global mobility regimes (Achiume, 2019).",
        p3: "South(s) Mobility DataHub builds on this framework to offer a methodological response rather than a polemical one: consolidating, harmonizing, and recontextualizing data already produced by international and African institutions, rather than producing new data of its own. The platform systematically favors proportion over absolute value, comparison over anecdote, and African institutional architecture (the African Union, Regional Economic Communities) over normative frameworks imported solely from the North — without denying the power and funding asymmetries that concretely structure this regime (Bakewell, 2008; Bayart, 2000).",
        p3b: "This architecture produces a paradox the platform documents with figures. Africa is not lagging behind the norm: it has at times moved ahead of it, adopting with the Kampala Convention (2009) the world's first — and still only — binding regional treaty on internally displaced persons. Four states (Benin, The Gambia, Rwanda, Seychelles) already admit all African nationals without a visa. Yet the continental Free Movement Protocol adopted in Kigali in 2018 has secured only 4 ratifications out of 54, far short of the 15 required for it to enter into force. What lags, then, is the anchoring in national administrations, far more than the drafting of norms.",
        pullquote: "Between the principles proclaimed in Addis Ababa and their application at border posts lies a \"national in-between\": the space where the African migration governance regime is actually played out (Ben Mokhtar, 2026).",
        p5: "This framing owes, finally, to fieldwork: participant observation conducted between 2023 and 2025 within the African Migration Observatory (Rabat), documented in the Governance section (Ben Mokhtar, 2026). It gives access to the regime's ordinary bureaucratic fabric — workshops, budgetary trade-offs, validation circuits — where normative frameworks, examined alone, show only their façade.",
        p4: "This scientific rigor does not exclude accessibility: it is its precondition. The Evidence Check section applies this method claim by claim; the Governance section documents the institutional architecture that — with often limited means — attempts to govern these mobilities at the continental scale. The hurried reader can settle for the figures; the demanding reader will find, behind every claim, the source that grounds it. One caveat, finally, on what this platform does not claim to be: it produces no official statistics, substitutes for no national statistical institute and issues no policy recommendation. It consolidates, situates and makes citable a body of already-public material — while accepting that the choice of what is foregrounded, and of the scale against which it is measured, is already an analytical act rather than a neutral reflection of the data.",
        refs_title: "Further Reading",
        refs: [
          { text: "de Haas, H. (2021). A theory of migration: the aspirations–capabilities framework. Comparative Migration Studies.", url: "https://doi.org/10.1186/s40878-020-00210-4" },
          { text: "de Haas, H. (2023). How Migration Really Works. Penguin Books.", url: null },
          { text: "de Haas, H. (2017, March 29). Myths of migration: Much of what we think we know is wrong. Der Spiegel.", url: null },
          { text: "Adamson, F. & Tsourapas, G. (2019). Migration Diplomacy in World Politics. International Studies Perspectives.", url: "https://doi.org/10.1093/isp/eky015" },
          { text: "Achiume, E. T. (2019). Migration as Decolonization. Stanford Law Review.", url: "https://ssrn.com/abstract=3330353" },
          { text: "Bakewell, O. (2008). 'Keeping Them in Their Place'. Third World Quarterly.", url: "https://doi.org/10.1080/01436590802386492" },
          { text: "IDMC. Global Report on Internal Displacement (GRID).", url: "https://www.internal-displacement.org/global-report/grid2025/" },
          { text: "AfDB & AUC. Africa Visa Openness Report (2024).", url: "https://www.visaopenness.org/" },
        ]
      },
      global_stats: {
        world: "Global Total (2024)", europe: "Europe (2024)", asia: "Asia (2024)", na: "North America (2024)", africa: "Africa (2024)", latam: "Latin America (2024)", share: "Global share:",
        note: "UNDESA (2024) Data: Africa accounts for only 9.5% of the global migrant stock (28.5M), well behind Europe (94M) and Asia (92M)."
      },
      sdg_section: {
        title: "International Frameworks: SDGs (2030), GCM (2018) & GCR (2018)",
        subtitle: "The UN 2030 Agenda, the Marrakech Global Compact for Migration (GCM), and the Global Compact on Refugees (GCR).",
        tab_sdg: "Sustainable Development Goals (SDGs)",
        tab_gcm: "Global Compact for Migration (GCM)",
        tab_gcr: "Global Compact on Refugees (GCR)",
        sdg_desc: "The UN 2030 Agenda officially incorporates mobility as a driver of sustainable development. Target 17.18 mandates data disaggregation by migratory status.",
        gcm_desc: "Adopted in Marrakech in 2018, the Global Compact for Safe, Orderly and Regular Migration outlines 23 objectives centered on sovereignty, rights, and factual cooperation.",
        gcr_desc: "Affirmed in 2018, the Global Compact on Refugees (GCR) provides a framework for equitable responsibility-sharing to support Southern countries hosting 76% of world refugees.",
        link_text: "Access official portal",
        sdg_points: [
          { goal: 10, title: "Target 10.7 (Migration Governance)", desc: "Facilitate orderly, safe, regular and responsible migration through planned and well-managed policies. The centerpiece migration target of the 2030 Agenda, tracked through 4 indicators (recruitment costs, governance, safe journeys, refugees)." },
          { goal: 10, title: "Target 10.c (Remittance Costs)", desc: "Reduce transaction costs of diaspora remittances to less than 3% (World Bank)." },
          { goal: 17, title: "Target 17.18 (Data Disaggregation)", desc: "Enhance national statistical capacities to disaggregate data by migratory status." },
          { goal: 8, title: "Target 8.8 (Migrant Workers' Rights)", desc: "Protect labor rights and promote safe working environments for all migrant workers, particularly women (ILO)." },
          { goal: 4, title: "Target 4.b (Student Mobility & Scholarships)", desc: "Expand scholarships available to developing countries for higher education — a direct vector of intra-African and South-South skills circulation." },
          { goal: 16, title: "Target 16.9 (Legal Identity for All)", desc: "Provide legal identity for all, including birth registration — a prerequisite for accessing travel documents and regular mobility." }
        ],
        gcm_objectives_list: [
          { num: "Obj. 1", title: "Factual Data", desc: "Collect and utilize factual and disaggregated data for policy making." },
          { num: "Obj. 2", title: "Structural Drivers", desc: "Minimize adverse drivers and structural factors that compel people to leave their country." },
          { num: "Obj. 3", title: "Information & Guidance", desc: "Provide migrants with accurate and timely information at all stages of migration." },
          { num: "Obj. 4", title: "Legal Identity", desc: "Ensure that all migrants have proof of legal identity and adequate documentation." },
          { num: "Obj. 5", title: "Regular Pathways", desc: "Enhance availability and flexibility of pathways for regular migration." },
          { num: "Obj. 6", title: "Fair Recruitment", desc: "Facilitate fair and ethical recruitment and safeguard conditions that secure decent work." },
          { num: "Obj. 7", title: "Vulnerabilities", desc: "Address and reduce vulnerabilities in migration through rights-based approaches." },
          { num: "Obj. 8", title: "Save Lives", desc: "Save lives and establish coordinated international efforts on missing migrants." },
          { num: "Obj. 9", title: "Smuggling", desc: "Strengthen the transnational response to smuggling of migrants." },
          { num: "Obj. 10", title: "Human Trafficking", desc: "Prevent, combat and eradicate trafficking in persons in the context of international migration." },
          { num: "Obj. 11", title: "Border Management", desc: "Manage borders in an integrated, secure and coordinated manner while safeguarding rights." },
          { num: "Obj. 12", title: "Regular Stay", desc: "Strengthen certainty and predictability in migration procedures for adequate screening and referral." },
          { num: "Obj. 13", title: "Administrative Detention", desc: "Use migration detention only as a measure of last resort and work towards alternatives." },
          { num: "Obj. 14", title: "Consular Protection", desc: "Enhance consular protection, assistance and cooperation throughout the migration cycle." },
          { num: "Obj. 15", title: "Basic Services", desc: "Provide access to basic services for migrants regardless of their migratory status." },
          { num: "Obj. 16", title: "Empowerment & Inclusion", desc: "Empower all migrants and societies to realize full inclusion and social cohesion." },
          { num: "Obj. 17", title: "Eliminate Discrimination", desc: "Eliminate all forms of discrimination and promote evidence-based public discourse." },
          { num: "Obj. 18", title: "Skills", desc: "Invest in skills development and facilitate mutual recognition of work qualifications." },
          { num: "Obj. 19", title: "Diasporas", desc: "Create conditions for diasporas to fully contribute to sustainable development in all countries." },
          { num: "Obj. 20", title: "Remittances", desc: "Promote faster, safer and cheaper transfer of remittances and foster financial inclusion." },
          { num: "Obj. 21", title: "Return & Readmission", desc: "Cooperate in safe and dignified return and readmission, as well as sustainable reintegration." },
          { num: "Obj. 22", title: "Social Security", desc: "Establish mechanisms for the portability of social security entitlements and earned benefits." },
          { num: "Obj. 23", title: "International Cooperation", desc: "Strengthen international cooperation and global partnerships for safe, orderly and regular migration." }
        ],
        gcr_objectifs: [
          { title: "1. Ease pressures on host countries", desc: "Structurally support Southern nations (Uganda, Chad, Sudan) hosting the vast majority of refugees." },
          { title: "2. Enhance refugee self-reliance", desc: "Foster access to national labor markets and shift away from closed camp dependency." },
          { title: "3. Expand third-country solutions", desc: "Increase regular pathways (resettlement, private sponsorship, study and work visas)." },
          { title: "4. Support conditions for return", desc: "Create favorable conditions for voluntary, safe, and dignified returns when feasible." }
        ]
      },
      indicator_desc: "Recommended methodological matrix to objectify mobility governance and guide field Open Data collection.",
      download_indicators: "Download Matrix (CSV)",
      debunk_cards: [
        { myth: "Unstoppable African migration explosion.", real: "Continental proportion remains stable (~1.9%).", stat_text: "1.9% (2024)", stat_val: 1.9, color: "bg-blue-700", desc: "UNDESA (2024): The proportion of international African migrants relative to the continent's population has hovered around 1.9% since 1990. Absolute volume increases reflect total population growth." },
        { myth: "Africa is massively invading Europe.", real: "Intra-African migrations dominate at 70%.", stat_text: "70% (2021)", stat_val: 70, color: "bg-teal-700", desc: "AU/ILO Report (2021): 70% of international African mobilities take place within the continent itself (e.g. Côte d'Ivoire, South Africa, Nigeria)." },
        { myth: "The North hosts the vast majority of refugees.", real: "76% of world refugees remain in Southern countries.", stat_text: "76% (2025)", stat_val: 76, color: "bg-amber-700", desc: "UNHCR (2025): Over three-quarters of people fleeing armed conflicts find safety in neighboring developing nations (e.g. Uganda, Chad, Ethiopia)." },
        { myth: "African migration is almost exclusively male.", real: "Structural feminization of flows (45% to 47%).", stat_text: "47% (2024)", stat_val: 47, color: "bg-purple-700", desc: "UNDESA (2024) / AU (2021): Women account for nearly half of international migrants in Africa, reshaping autonomous care and cross-border trade economies." },
        { myth: "Africa financially depends on Official Aid.", real: "$86.4 billion in remittances far exceed ODA.", stat_text: "$86.4B (2019)", stat_val: 85, color: "bg-amber-600", desc: "World Bank / AU (2021): Diaspora remittances ($86.4B in 2019) far surpass Official Development Assistance (ODA), serving as primary resilience capital." },
        { myth: "Climate will empty Africa towards the North.", real: ">90% of climate displacements are internal.", stat_text: ">90% (2025)", stat_val: 90, color: "bg-cyan-700", desc: "IDMC (2025): Over 90% of people displaced by climate events (droughts, floods) remain within their national or sub-regional borders." },
        { myth: "Coastal African nations are mere transit zones.", real: "Structural transition into long-term destination countries.", stat_text: "Mutation (2024)", stat_val: 65, color: "bg-indigo-700", desc: "Data proves that former 'transit' countries are becoming permanent regional economic poles for migrant workers." },
        { myth: "Economic growth automatically stops emigration.", real: "The transition paradox (Migration Hump).", stat_text: "Catalyst (2024)", stat_val: 80, color: "bg-rose-700", desc: "Empirically proven: initial income growth provides households with the financial capital needed to undertake regular migration projects." },
        { myth: "Migrant workers are a burden on host economies.", real: "Drivers of local employment and value creation.", stat_text: "+ Value (2021)", stat_val: 85, color: "bg-emerald-700", desc: "AU/ILO Report (2021): across the ten states that reported employment data, 27.5% of employed migrants work in agriculture, forestry or fishing — filling labour shortages and stimulating local trade. Reporting coverage remains the weak link: see Data & Stats." }
      ],
      about: { 
        intro_title: "About South(s) Mobility",
        intro_subtitle: "An open infrastructure to understand mobility in the Global South",
        intro_p1: "South(s) Mobility DataHub is an independent research, data, and visualization platform dedicated to human mobility in the Global South, with an initial focus on Africa.",
        intro_p2: "At the intersection of social sciences, data science, and migration studies, the platform gathers, harmonizes, and leverages data, indicators, maps, publications, legal instruments, and documentary resources from international, regional, and national institutions.",
        intro_p3: "Its ambition is to make data on human mobility more accessible, comparable, and intelligible, in order to foster an empirical, nuanced, and documented understanding of contemporary migratory dynamics.",
        
        research_title: "A platform born from research",
        research_p1: "South(s) Mobility stems from a doctoral research project focused on the governance of African migrations.",
        research_p2: "During this research, a clear observation emerged: a vast amount of quality data is already produced by public and international institutions, but these resources remain widely scattered, heterogeneous, and sometimes difficult to access. Cross-referencing, contextualizing, or simply finding them often requires considerable effort.",
        research_p3: "South(s) Mobility was born from this observation. The project aims to gather these resources in a single, open, and scalable environment to facilitate their consultation, comparison, and reuse by researchers, students, journalists, public decision-makers, international organizations, and anyone interested in human mobility.",
        research_p4: "It is part of an Open Science approach, aimed at disseminating knowledge and promoting research.",

        data_title: "A data-driven approach",
        data_p1: "The project favors an empirical, transparent, and methodologically rigorous approach. The data and resources presented primarily come from recognized organizations, including:",
        data_list: [
          { name: "African Union Commission (AUC)", url: "https://au.int/en", logo: "au" },
          { name: "United Nations — UN DESA", url: "https://www.un.org/development/desa/pd/data/international-migrant-stock", logo: "un" },
          { name: "UNHCR — Refugee Statistics", url: "https://www.unhcr.org/refugee-statistics/", logo: "unhcr" },
          { name: "International Organization for Migration (IOM)", url: "https://www.iom.int/", logo: "iom" },
          { name: "International Labour Organization — NORMLEX", url: "https://normlex.ilo.org/", logo: "ilo" },
          { name: "World Bank", url: "https://data.worldbank.org/", logo: "worldbank" },
          { name: "KNOMAD — Remittances & Development", url: "https://www.knomad.org/", logo: "knomad" },
          { name: "African Development Bank (AfDB)", url: "https://www.afdb.org/en", logo: "afdb" },
          { name: "Economic Commission for Africa (UNECA)", url: "https://www.uneca.org/", logo: "uneca" },
          { name: "Internal Displacement Monitoring Centre (IDMC)", url: "https://www.internal-displacement.org/", logo: "idmc" },
          { name: "Mo Ibrahim Foundation — IIAG", url: "https://mo.ibrahim.foundation/our-research/iiag", logo: "moibrahim" },
          { name: "Mixed Migration Centre — 4Mi", url: "https://mixedmigration.org/", logo: "mmc" },
          { name: "Afrobarometer", url: "https://www.afrobarometer.org/", logo: "afrobarometer" },
          { name: "OECD", url: "https://data.oecd.org/", logo: "oecd" },
          { name: "European Commission — JRC / KCMD", url: "https://knowledge4policy.ec.europa.eu/migration-demography_en", logo: "ecjrc" },
          { name: "African Regional Economic Communities", url: "https://au.int/en/organs/recs", logo: null },
          { name: "National Statistical Institutes", url: null, logo: null }
        ],
        data_p2: "Each dataset retains its original source. When multiple institutions provide different estimates, these divergences are noted and placed within their methodological context. Data limitations are indicated as much as possible to encourage critical and informed reading.",
        data_p3: "South(s) Mobility does not produce official statistics. The platform acts as an infrastructure for consolidation, contextualization, and knowledge dissemination.",

        south_title: "A perspective rooted in the Souths",
        south_p1: "South(s) Mobility adopts a Global South-centric perspective, paying special attention to dynamics that are often less visible in international databases. This includes:",
        south_list: [
          "Intra-African migrations",
          "South-South mobilities",
          "African regional economic communities",
          "Continental legal instruments",
          "African mobility policies",
          "Regional corridors",
          "Diasporas",
          "Internal displacements",
          "knowledge produced by institutions and researchers from the Global South"
        ],
        south_p2: "In the longer term, this approach is intended to be progressively extended to other regions of the world, notably Latin America, the Caribbean, and Asia.",

        evolution_title: "A constantly evolving platform",
        evolution_p1: "South(s) Mobility is an evolving project, enriched as the research advances. Rather than announcing an undifferentiated roadmap, the platform distinguishes here between what is actually available and what remains to be built.",
        evolution_done: [
          "A narratives observatory testing common claims against the data",
          "Detailed profiles for all 54 countries and the AU's 5 sub-regions",
          "Factsheets for the 8 Regional Economic Communities, with maps",
          "A repository of African legal instruments and their ratification status",
          "A comparative matrix of entry and residence regimes across 54 countries",
          "A referenced documentary library and a bilingual glossary",
          "CSV exports for every displayed dataset",
          "Citable PDF dossiers with embedded source and reference"
        ],
        evolution_next: [
          "Harmonised time series beyond the 1990 and 2024 comparison points",
          "Thematic dashboards (labour, climate, protection)",
          "Pilot collection of the alternative indicators proposed in the Methodology",
          "Progressive extension to other regions of the Global South"
        ],
        evolution_p2: "The goal is to progressively build a benchmark infrastructure for the study of human mobility in the Global South.",

        founder_title: "About the founder",
        founder_p1: "South(s) Mobility was founded by Yassine Ben Mokhtar, a PhD candidate in international relations whose research focuses on African migration governance, continental institutional dynamics, and mobility policies.",
        founder_p2: "The project is built on several years of academic research, documentary and field analysis, as well as professional experience with institutions working on migration and governance issues in Africa.",
        founder_p3: "South(s) Mobility constitutes both an extension of this research and a scientific dissemination initiative designed to make knowledge, data, and resources more accessible to a wider audience.",
        founder_p4: "Analyses, interpretations, and any potential errors are the sole responsibility of the author and do not commit any institution with which he has collaborated.",

        collab_title: "Collaborate & Contact",
        collab_p1: "South(s) Mobility is open to academic, institutional, and technical collaborations. Proposals for datasets, publications, visualizations, corrections, joint projects, or partnerships are welcome.",
        contact_p: "For any questions, collaboration proposals, or contributions to the project:",
        disclaimer: "South(s) Mobility is an independent project in active development. Content, features, and datasets are regularly enriched to improve the coverage, quality, and accessibility of available information.",
        
        citation_title: "To cite this project:",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub: An open infrastructure to understand mobility in the Global South. Retrieved from https://southsmobility.vercel.app/"
      },
      method: { 
        summary: "The platform produces no primary data: it consolidates public series and documents every operation applied to them. Six principles govern that processing.",
        m1: "Source traceability. Each indicator is tied to a named producing institution (UN DESA, UNHCR, IDMC, ILO, World Bank, AfDB, AUC, IOM) and to a publicly consultable series. The {libraryCount} references drawn upon are listed in the Library; no value is retained without identifiable provenance.",
        m2: "Perimeter harmonisation. Series are brought onto a 54-country perimeter and the African Union's regional breakdown — not the UN M49 nomenclature. Western Sahara is integrated into Morocco, including on maps. An alias table reconciles naming variants across datasets (\"DRC\" / \"D.R. Congo\", \"Cape Verde\" / \"Cabo Verde\") without renaming the sources.",
        m3: "Field-level dating. Vintages are not artificially aligned: remittances, migrant activity, and ratifications each carry their own observation year. No interpolation is applied to manufacture surface-level homogeneity, and an unverifiable figure is shown dated and caveated rather than smoothed.",
        m4: "Proportion over absolute value. Counts are systematically related to their reference population. Scales are never mixed within a single representation (the AVOI index is stored 0-100 at country level, 0-1 at REC level). Choropleth maps use quantile binning, which is robust to heavily skewed distributions such as internal displacement.",
        m5: "Threshold-driven legal assessment. Ratification counts are checked against official portals before publication. The entry-into-force threshold — 15 states parties for this class of protocol — is stored per instrument and directly drives the \"in force\" or \"not yet in force\" status shown.",
        m6: "Reproducible output. The eight displayed datasets are exportable as RFC 4180-compliant CSV, and every PDF dossier embeds its source, the platform address, and the citation reference. Map bases derive from Natural Earth (50m), in Mercator projection, simplified with the Douglas-Peucker algorithm.",
        sources_title: "Access Original Datasets, Reports & Legal Frameworks:",
        s1: "African Union & AUC / ILO / IOM / ECA - 3rd Labour Migration Statistics Report (2021)",
        s2: "UNDESA - International Migrant Stock Data (2024)",
        s3: "UNHCR - Global Trends Report (2025)",
        s4: "IDMC - GRID Report (2025)",
        s5: "IOM - World Migration Report (2024)",
        s6: "ILO NORMLEX - International Labour Standards Database (2025)",
        s7: "African Union - Treaties, Conventions, and Protocols (2025)",
        s8: "World Bank - Migration and Remittances Data (2024)"
      },
      myth: "Premise", reality: "Factual Data",
      footer: { tag: "Data engineering serving a new factual narrative on mobilities.", sources: "Sources : AU / ILO / IOM / ECA (2021) • UN DESA (2024) • UNHCR (2025) • IDMC (2025) • ILO NORMLEX (2025) • World Bank (2024)" },
      analysis_title: "Detailed Dashboard", analysis_btn: "Access detailed report"
    }
};

const genericDesc = {
  evo_desc: { fr: "Proportion migratoirement stable rythmée par la démographie locale.", en: "Migratory proportion structurally stable, driven by local demography." },
  origDest: { fr: "Mobilités majoritairement de proximité et circulaires au sein de l'espace sous-régional (UA 2021).", en: "Predominantly proximity and circular mobilities within the sub-regional space (AU 2021)." },
  trigger: { fr: "Asymétries de développement et chocs climatiques.", en: "Development asymmetries and climate shocks." },
  response: { fr: "Déplacements transfrontaliers de travail et stratégies de survie.", en: "Cross-border labor displacements and survival strategies." },
  impact: { fr: "Résilience économique via les transferts de fonds (Remittances 86,4 Mrd $ - UA 2021).", en: "Economic resilience through remittances ($86.4B - AU 2021)." }
};

// ----------------------------------------------------------------------------
// LES AGRÉGATS DES SOUS-RÉGIONS
// `evolution`, `history` et `distribution` sont des séries publiées (UNDESA / UA-OIT) et sont conservées telles quelles.
// `stock`, `female`, `retention`, `remittances`, `aid` et `labour_participation` sont recalculés en direct
// depuis countryData par computeRegionAggregate() : les valeurs ci-dessous ne servent que de filet de sécurité.
// ----------------------------------------------------------------------------
const aggregates = {
  'africa_perspective': {
    name: { fr: "Afrique (Continentale)", en: "Africa (Continental)" }, flagIcon: Globe, flagColor: "text-blue-700", stock: '28,5 M', female: '47.1', evolution: '1.9', retention: 70, remittances: 6.5, aid: 3.2,
    history: [{ year: 1990, value: '2.5' }, { year: 2000, value: '2.0' }, { year: 2010, value: '1.8' }, { year: 2024, value: '1.9' }],
    distribution: [{ label: {fr: 'Intra-Africain', en: 'Intra-African'}, value: 70, color: 'bg-blue-700' }, { label: {fr: 'Extra-Africain', en: 'Extra-African'}, value: 30, color: 'bg-slate-700' }],
    ...genericDesc
  },
  'af_med_perspective': {
    name: { fr: "Afrique Méditerranéenne (Sous-région)", en: "Mediterranean Africa (Sub-region)" }, flagIcon: MapIcon, flagColor: "text-teal-700", stock: '3,4 M', female: '43.7', evolution: '1.8', retention: 65, remittances: 3.9, aid: 1.3,
    history: [{ year: 1990, value: '1.0' }, { year: 2024, value: '3.4' }], ...genericDesc
  },
  'af_west_perspective': {
    name: { fr: "Afrique de l'Ouest (Sous-région)", en: "West Africa (Sub-region)" }, flagIcon: MapIcon, flagColor: "text-amber-700", stock: '7,6 M', female: '47.6', evolution: '2.1', retention: 84, remittances: 5.1, aid: 4.8,
    history: [{ year: 1990, value: '3.5' }, { year: 2024, value: '7.6' }], ...genericDesc
  },
  'af_central_perspective': {
    name: { fr: "Afrique Centrale (Sous-région)", en: "Central Africa (Sub-region)" }, flagIcon: MapIcon, flagColor: "text-emerald-700", stock: '4,2 M', female: '48.9', evolution: '3.5', retention: 92, remittances: 1.5, aid: 5.9,
    history: [{ year: 1990, value: '1.5' }, { year: 2024, value: '4.2' }], ...genericDesc
  },
  'af_east_perspective': {
    name: { fr: "Afrique de l'Est (Sous-région)", en: "East Africa (Sub-region)" }, flagIcon: MapIcon, flagColor: "text-indigo-700", stock: '6,8 M', female: '49.1', evolution: '1.6', retention: 88, remittances: 2.8, aid: 5.1,
    history: [{ year: 1990, value: '4.5' }, { year: 2024, value: '6.8' }], ...genericDesc
  },
  'af_south_perspective': {
    name: { fr: "Afrique Australe (Sous-région)", en: "Southern Africa (Sub-region)" }, flagIcon: MapIcon, flagColor: "text-rose-700", stock: '4,5 M', female: '44.8', evolution: '3.2', retention: 95, remittances: 1.9, aid: 2.3,
    history: [{ year: 1990, value: '2.5' }, { year: 2024, value: '4.5' }], ...genericDesc
  }
};

// Affiliation aux Communautés Économiques Régionales (CER), pays par pays.
// Sources : sites officiels de chaque CER (ECOWAS, ECCAS, EAC, IGAD, COMESA, SADC, CEN-SAD, UMA), consultés août 2026.
// Ne reflète pas l'AES (Alliance des États du Sahel) : alliance politico-militaire hors des 8 CER reconnues par l'UA.
const recNames = {
  cedeao: { fr: 'CEDEAO', en: 'ECOWAS' },
  cae: { fr: 'CAE', en: 'EAC' },
  sadc: { fr: 'SADC', en: 'SADC' },
  comesa: { fr: 'COMESA', en: 'COMESA' },
  igad: { fr: 'IGAD', en: 'IGAD' },
  ceeac: { fr: 'CEEAC', en: 'ECCAS' },
  uma: { fr: 'UMA', en: 'AMU' },
  censad: { fr: 'CEN-SAD', en: 'CEN-SAD' },
};

const countryRecAffiliations = {
  dz: ['uma'], eg: ['censad', 'comesa'], ly: ['uma', 'censad', 'comesa'], ma: ['uma', 'censad'], tn: ['uma', 'censad', 'comesa'], mr: ['uma', 'censad'],
  bj: ['cedeao', 'censad'], bf: ['censad'], cv: ['cedeao'], ci: ['cedeao', 'censad'], gm: ['cedeao', 'censad'], gh: ['cedeao', 'censad'], gn: ['cedeao'], gw: ['cedeao', 'censad'], lr: ['cedeao'], ml: ['censad'], ne: ['censad'], ng: ['cedeao', 'censad'], sn: ['cedeao', 'censad'], sl: ['cedeao', 'censad'], tg: ['cedeao', 'censad'],
  ao: ['ceeac', 'sadc'], cm: ['ceeac'], cf: ['ceeac', 'censad'], td: ['ceeac', 'censad'], cg: ['ceeac'], cd: ['ceeac', 'cae', 'comesa', 'sadc'], gq: ['ceeac'], ga: ['ceeac'], st: ['ceeac'],
  bi: ['cae', 'comesa', 'ceeac'], rw: ['cae', 'comesa'], km: ['censad', 'comesa', 'sadc'], dj: ['censad', 'comesa', 'igad'], er: ['censad', 'comesa'], et: ['igad', 'comesa'], ke: ['cae', 'igad', 'comesa'], mg: ['comesa', 'sadc'], mu: ['comesa', 'sadc'], sc: ['comesa', 'sadc'], so: ['cae', 'igad', 'comesa', 'censad'], ss: ['cae', 'igad'], sd: ['igad', 'comesa', 'censad'], tz: ['cae', 'sadc'], ug: ['cae', 'igad', 'comesa'],
  mw: ['comesa', 'sadc'], mz: ['sadc'], zm: ['comesa', 'sadc'], zw: ['comesa', 'sadc'], bw: ['sadc'], sz: ['comesa', 'sadc'], ls: ['sadc'], na: ['sadc'], za: ['sadc'],
};

const countryRecNotes = {
  bf: { fr: "A quitté la CEDEAO en janvier 2025 (avec le Mali et le Niger, Alliance des États du Sahel).", en: "Left ECOWAS in January 2025 (with Mali and Niger, Alliance of Sahel States)." },
  ml: { fr: "A quitté la CEDEAO en janvier 2025 (avec le Burkina Faso et le Niger, Alliance des États du Sahel).", en: "Left ECOWAS in January 2025 (with Burkina Faso and Niger, Alliance of Sahel States)." },
  ne: { fr: "A quitté la CEDEAO en janvier 2025 (avec le Mali et le Burkina Faso, Alliance des États du Sahel).", en: "Left ECOWAS in January 2025 (with Mali and Burkina Faso, Alliance of Sahel States)." },
  rw: { fr: "Retrait de la CEEAC annoncé en juin 2025, effectif fin 2025.", en: "ECCAS withdrawal announced June 2025, effective end of 2025." },
  er: { fr: "Retrait de l'IGAD annoncé en décembre 2025, après un retour à l'organisation en 2023.", en: "Withdrew from IGAD in December 2025, after rejoining the organisation in 2023." },
};

const countryData = {
  "af_med": [
    { 
      "id": "12", "name": { "fr": "Algérie", "en": "Algeria" }, "flag": "🇩🇿", "iso2": "dz", "retention": 60, "aid": 0.1, "stock": "259458", "female": "47.2", 
      "history": [ { "year": 1990, "value": "273954" }, { "year": 2024, "value": "259458" } ], "remittances": 0.67, "labour_participation": "40.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 0, "idp_disaster": 10, "refugees_hosted": 0, "avoi": 9, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 48, "total": 60, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103006"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "818", "name": { "fr": "Égypte", "en": "Egypt" }, "flag": "🇪🇬", "iso2": "eg", "retention": 75, "aid": 1.5, "stock": "1139820", "female": "47.1", 
      "history": [ { "year": 1990, "value": "144713" }, { "year": 2024, "value": "1139820" } ], "remittances": 11.37, "labour_participation": "59.9", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 834200, "avoi": 11, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 54, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103254"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "L'Égypte est structurellement un pays d'émigration de travail vers le Golfe. L'Arabie saoudite héberge à elle seule environ 1,5 million d'Égyptiens. Les pays du Golfe fournissent plus de 40 % des 19,5 milliards de dollars de transferts reçus par le pays en 2023 (Banque mondiale).", "en": "Egypt is structurally a labour-emigration country toward the Gulf: Saudi Arabia alone hosts around 1.5 million Egyptians, and Gulf countries provide over 40% of the $19.5 billion in remittances the country received in 2023 (World Bank)." },
      "impact": { "fr": "L'Égypte reçoit 31% du total des transferts de fonds captés par l'ensemble du continent africain (Rapport UA 2021).", "en": "Egypt receives 31% of total diaspora remittances captured by the entire African continent (AU Report 2021)." }
    },
    { 
      "id": "434", "name": { "fr": "Libye", "en": "Libya" }, "flag": "🇱🇾", "iso2": "ly", "retention": 85, "aid": 2.1, "stock": "897751", "female": "28.2", 
      "history": [ { "year": 1990, "value": "457075" }, { "year": 2024, "value": "897751" } ], "remittances": null, "labour_participation": "61.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "12.8", 
      "idp_conflict": 85000, "idp_disaster": 21000, "refugees_hosted": 551700, "avoi": 4, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 19, "total": 29, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102919"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "504", "name": { "fr": "Maroc", "en": "Morocco" }, "flag": "🇲🇦", "iso2": "ma", "retention": 55, "aid": 1.2, "stock": "111069", "female": "48.5", 
      "history": [ { "year": 1990, "value": "54895" }, { "year": 2024, "value": "111069" } ], "remittances": 7.49, "labour_participation": "46.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 15, 
      "normlex": {"fundamental": 8, "governance": 4, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102993"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "Environ 72% de la diaspora marocaine réside dans trois pays européens : la France (env. 1,1 million de personnes), l'Espagne (env. 770 000) et l'Italie (env. 490 000) — un corridor historique remontant aux migrations de travail des années 1960-1970.", "en": "About 72% of the Moroccan diaspora lives in three European countries: France (approx. 1.1 million people), Spain (approx. 770,000), and Italy (approx. 490,000) — a historic corridor dating back to the labour migrations of the 1960s-1970s." }
    },
    {
      "id": "788", "name": { "fr": "Tunisie", "en": "Tunisia" }, "flag": "🇹🇳", "iso2": "tn", "retention": 50, "aid": 1.8, "stock": "63201", "female": "47.7", 
      "history": [ { "year": 1990, "value": "37984" }, { "year": 2024, "value": "63201" } ], "remittances": 6.34, "labour_participation": "52.4", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.5", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102980"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "478", "name": { "fr": "Mauritanie", "en": "Mauritania" }, "flag": "🇲🇷", "iso2": "mr", "retention": 70, "aid": 5.5, "stock": "195937", "female": "43.4", 
      "history": [ { "year": 1990, "value": "111650" }, { "year": 2024, "value": "195937" } ], "remittances": 0.87, "labour_participation": "68.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 17, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 34, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103031"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_west": [
    { 
      "id": "204", "name": { "fr": "Bénin", "en": "Benin" }, "flag": "🇧🇯", "iso2": "bj", "retention": 80, "aid": 4.1, "stock": "418202", "female": "52.9", 
      "history": [ { "year": 1990, "value": "76751" }, { "year": 2024, "value": "418202" } ], "remittances": 1.72, "labour_participation": "64.4", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "3.0", 
      "idp_conflict": 26000, "idp_disaster": 1100, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 22, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103009"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "854", "name": { "fr": "Burkina Faso", "en": "Burkina Faso" }, "flag": "🇧🇫", "iso2": "bf", "retention": 90, "aid": 6.2, "stock": "739820", "female": "52.4", 
      "history": [ { "year": 1990, "value": "349652" }, { "year": 2024, "value": "739820" } ], "remittances": 2.57, "labour_participation": "64.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "3.2", 
      "idp_conflict": 2063000, "idp_disaster": 210, "refugees_hosted": 0, "avoi": 36, 
      "normlex": {"fundamental": 9, "governance": 4, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103058"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "132", "name": { "fr": "Cabo Verde", "en": "Cabo Verde" }, "flag": "🇨🇻", "iso2": "cv", "retention": 40, "aid": 8.1, "stock": "16515", "female": "49.4", 
      "history": [ { "year": 1990, "value": "8931" }, { "year": 2024, "value": "16515" } ], "remittances": 11.67, "labour_participation": "72.2", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "3.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 86, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 5, "total": 16, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102978"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "384", "name": { "fr": "Côte d'Ivoire", "en": "Côte d'Ivoire" }, "flag": "🇨🇮", "iso2": "ci", "retention": 95, "aid": 1.5, "stock": "2880839", "female": "40.0", 
      "history": [ { "year": 1990, "value": "1822374" }, { "year": 2024, "value": "2880839" } ], "remittances": 2.03, "labour_participation": "74.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "9.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 42, 
      "normlex": {"fundamental": 11, "governance": 4, "technical": 33, "total": 48, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103023"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "270", "name": { "fr": "Gambie", "en": "Gambia" }, "flag": "🇬🇲", "iso2": "gm", "retention": 60, "aid": 10.5, "stock": "236137", "female": "47.2", 
      "history": [ { "year": 1990, "value": "118123" }, { "year": 2024, "value": "236137" } ], "remittances": 22.0, "labour_participation": "72.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "8.6", 
      "idp_conflict": 0, "idp_disaster": 250, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 11, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103004"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "288", "name": { "fr": "Ghana", "en": "Ghana" }, "flag": "🇬🇭", "iso2": "gh", "retention": 70, "aid": 2.5, "stock": "532286", "female": "46.6", 
      "history": [ { "year": 1990, "value": "164851" }, { "year": 2024, "value": "532286" } ], "remittances": 2.12, "labour_participation": "64.4", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.6", 
      "idp_conflict": 3900, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 87, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103271"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "324", "name": { "fr": "Guinée", "en": "Guinea" }, "flag": "🇬🇳", "iso2": "gn", "retention": 85, "aid": 4.8, "stock": "117416", "female": "41.2", 
      "history": [ { "year": 1990, "value": "403621" }, { "year": 2024, "value": "117416" } ], "remittances": 2.46, "labour_participation": "44.0", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 130, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 50, "total": 62, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103001"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "624", "name": { "fr": "Guinée-Bissau", "en": "Guinea-Bissau" }, "flag": "🇬🇼", "iso2": "gw", "retention": 75, "aid": 9.1, "stock": "15064", "female": "50.6", 
      "history": [ { "year": 1990, "value": "15368" }, { "year": 2024, "value": "15064" } ], "remittances": 9.88, "labour_participation": "61.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 700, "refugees_hosted": 0, "avoi": 26, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 25, "total": 34, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103328"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "430", "name": { "fr": "Libéria", "en": "Liberia" }, "flag": "🇱🇷", "iso2": "lr", "retention": 80, "aid": 15.5, "stock": "72423", "female": "42.4", 
      "history": [ { "year": 1990, "value": "94964" }, { "year": 2024, "value": "72423" } ], "remittances": 21.28, "labour_participation": "60.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 26, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 17, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102941"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "466", "name": { "fr": "Mali", "en": "Mali" }, "flag": "🇲🇱", "iso2": "ml", "retention": 85, "aid": 7.2, "stock": "545323", "female": "49.3", 
      "history": [ { "year": 1990, "value": "160736" }, { "year": 2024, "value": "545323" } ], "remittances": 3.99, "labour_participation": "76.0", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.3", 
      "idp_conflict": 409000, "idp_disaster": 5900, "refugees_hosted": 0, "avoi": 41, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 23, "total": 36, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102987"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "562", "name": { "fr": "Niger", "en": "Niger" }, "flag": "🇳🇪", "iso2": "ne", "retention": 90, "aid": 9.8, "stock": "449236", "female": "53.5", 
      "history": [ { "year": 1990, "value": "115464" }, { "year": 2024, "value": "449236" } ], "remittances": 3.3, "labour_participation": "50.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.7", 
      "idp_conflict": 392000, "idp_disaster": 25000, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 29, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103028"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "566", "name": { "fr": "Nigéria", "en": "Nigeria" }, "flag": "🇳🇬", "iso2": "ng", "retention": 65, "aid": 0.8, "stock": "1403281", "female": "45.5", 
      "history": [ { "year": 1990, "value": "456621" }, { "year": 2024, "value": "1403281" } ], "remittances": 7.84, "labour_participation": "84.7", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 3496000, "idp_disaster": 170000, "refugees_hosted": 0, "avoi": 32, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 32, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103259"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "Malgré une diaspora nombreuse au Royaume-Uni et aux États-Unis, les premières destinations réelles des Nigérians sont des pays voisins. Le Cameroun et le Niger accueillent à eux deux plus de 320 000 Nigérians — davantage que le Royaume-Uni (OIM, Rapport sur les migrations dans le monde 2024).", "en": "Despite a large diaspora in the UK and US, Nigerians' top real destinations are neighboring countries: Cameroon and Niger together host over 320,000 Nigerians, more than the UK (IOM, World Migration Report 2024)." },
      "impact": { "fr": "Le Nigéria perçoit 28% de l'ensemble des envois de fonds diasporiques du continent (Rapport UA 2021). De plus, c'est le seul pays échantillonné où les femmes sont majoritaires parmi les travailleurs migrants occupés (52,8%).", "en": "Nigeria receives 28% of all continental diaspora remittances (AU Report 2021). Furthermore, it is the only sampled country where women represent the majority of employed migrant workers (52.8%)." }
    },
    { 
      "id": "686", "name": { "fr": "Sénégal", "en": "Senegal" }, "flag": "🇸🇳", "iso2": "sn", "retention": 75, "aid": 4.2, "stock": "281867", "female": "47.0", 
      "history": [ { "year": 1990, "value": "270410" }, { "year": 2024, "value": "281867" } ], "remittances": 10.64, "labour_participation": "55.7", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "1.6", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 79, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103046"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "694", "name": { "fr": "Sierra Leone", "en": "Sierra Leone" }, "flag": "🇸🇱", "iso2": "sl", "retention": 80, "aid": 8.5, "stock": "49997", "female": "43.4", 
      "history": [ { "year": 1990, "value": "222148" }, { "year": 2024, "value": "49997" } ], "remittances": 4.6, "labour_participation": "68.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 0, "idp_disaster": 4500, "refugees_hosted": 0, "avoi": 81, 
      "normlex": {"fundamental": 11, "governance": 2, "technical": 33, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103212"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "768", "name": { "fr": "Togo", "en": "Togo" }, "flag": "🇹🇬", "iso2": "tg", "retention": 85, "aid": 4.5, "stock": "281994", "female": "49.3", 
      "history": [ { "year": 1990, "value": "84844" }, { "year": 2024, "value": "281994" } ], "remittances": 8.69, "labour_participation": "59.0", "remittances_year": 2020, "labour_participation_year": 2022, "evolution": "3.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 28, 
      "normlex": {"fundamental": 9, "governance": 4, "technical": 15, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103134"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_central": [
    { 
      "id": "24", "name": { "fr": "Angola", "en": "Angola" }, "flag": "🇦🇴", "iso2": "ao", "retention": 90, "aid": 0.5, "stock": "676507", "female": "49.5", 
      "history": [ { "year": 1990, "value": "33517" }, { "year": 2024, "value": "676507" } ], "remittances": 0.04, "labour_participation": "80.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 0, "idp_disaster": 27000, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 30, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102951"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "120", "name": { "fr": "Cameroun", "en": "Cameroon" }, "flag": "🇨🇲", "iso2": "cm", "retention": 85, "aid": 2.1, "stock": "642948", "female": "50.6", 
      "history": [ { "year": 1990, "value": "265967" }, { "year": 2024, "value": "642948" } ], "remittances": 1.29, "labour_participation": "84.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.2", 
      "idp_conflict": 954000, "idp_disaster": 50000, "refugees_hosted": 0, "avoi": 11, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 39, "total": 51, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102973"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "140", "name": { "fr": "Centrafrique", "en": "Central African Republic" }, "flag": "🇨🇫", "iso2": "cf", "retention": 95, "aid": 12.5, "stock": "94556", "female": "47.6", 
      "history": [ { "year": 1990, "value": "67234" }, { "year": 2024, "value": "94556" } ], "remittances": null, "labour_participation": "77.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 427000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 25, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 35, "total": 47, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103002"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "148", "name": { "fr": "Tchad", "en": "Chad" }, "flag": "🇹🇩", "iso2": "td", "retention": 95, "aid": 5.5, "stock": "1269673", "female": "55.6", 
      "history": [ { "year": 1990, "value": "74342" }, { "year": 2024, "value": "1269673" } ], "remittances": null, "labour_participation": "60.5", "remittances_year": null, "labour_participation_year": 2022, "evolution": "6.3", 
      "idp_conflict": 593000, "idp_disaster": 48000, "refugees_hosted": 1500000, "avoi": 28, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103022"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "178", "name": { "fr": "Congo", "en": "Congo" }, "flag": "🇨🇬", "iso2": "cg", "retention": 90, "aid": 2.5, "stock": "385589", "female": "45.5", 
      "history": [ { "year": 1990, "value": "129391" }, { "year": 2024, "value": "385589" } ], "remittances": 0.3, "labour_participation": "60.6", "remittances_year": 2021, "labour_participation_year": 2022, "evolution": "6.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 22, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 23, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103014"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "180", "name": { "fr": "R.D. Congo", "en": "DR Congo" }, "flag": "🇨🇩", "iso2": "cd", "retention": 95, "aid": 6.5, "stock": "1085090", "female": "51.8", 
      "history": [ { "year": 1990, "value": "754194" }, { "year": 2024, "value": "1085090" } ], "remittances": 3.65, "labour_participation": "62.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.0", 
      "idp_conflict": 4276000, "idp_disaster": 630000, "refugees_hosted": 0, "avoi": 14, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 27, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102981"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "Plus de 1,2 million de Congolais réfugiés sont hébergés en Afrique, près de la moitié en Ouganda seul (env. 560 000-575 000 personnes), avec le Burundi, la Tanzanie, le Rwanda et la Zambie comme autres pays d'accueil majeurs (HCR, 2025).", "en": "Over 1.2 million Congolese refugees are hosted across Africa, nearly half in Uganda alone (approx. 560,000-575,000 people), with Burundi, Tanzania, Rwanda, and Zambia as other major host countries (UNHCR, 2025)." }
    },
    {
      "id": "226", "name": { "fr": "Guinée Équatoriale", "en": "Equatorial Guinea" }, "flag": "🇬🇶", "iso2": "gq", "retention": 98, "aid": 0.5, "stock": "248930", "female": "22.9", 
      "history": [ { "year": 1990, "value": "2740" }, { "year": 2024, "value": "248930" } ], "remittances": null, "labour_participation": "78.0", "remittances_year": null, "labour_participation_year": 2022, "evolution": "13.2", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 11, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 6, "total": 14, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103102"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "266", "name": { "fr": "Gabon", "en": "Gabon" }, "flag": "🇬🇦", "iso2": "ga", "retention": 95, "aid": 0.8, "stock": "449746", "female": "35.7", 
      "history": [ { "year": 1990, "value": "128188" }, { "year": 2024, "value": "449746" } ], "remittances": 0.13, "labour_participation": "64.7", "remittances_year": 2015, "labour_participation_year": 2022, "evolution": "17.7", 
      "idp_conflict": 0, "idp_disaster": 1500, "refugees_hosted": 0, "avoi": 17, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 30, "total": 42, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103008"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "678", "name": { "fr": "Sao Tomé-et-Principe", "en": "Sao Tome and Principe" }, "flag": "🇸🇹", "iso2": "st", "retention": 80, "aid": 10.5, "stock": "1955", "female": "50.1", 
      "history": [ { "year": 1990, "value": "5582" }, { "year": 2024, "value": "1955" } ], "remittances": 9.71, "labour_participation": "51.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 15, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 13, "total": 25, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103126"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "108", "name": { "fr": "Burundi", "en": "Burundi" }, "flag": "🇧🇮", "iso2": "bi", "retention": 95, "aid": 15.5, "stock": "387101", "female": "50.7", 
      "history": [ { "year": 1990, "value": "333110" }, { "year": 2024, "value": "387101" } ], "remittances": 8.12, "labour_participation": "69.7", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "2.6", 
      "idp_conflict": 6800, "idp_disaster": 82000, "refugees_hosted": 0, "avoi": 82, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 21, "total": 31, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102988"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "646", "name": { "fr": "Rwanda", "en": "Rwanda" }, "flag": "🇷🇼", "iso2": "rw", "retention": 95, "aid": 12.5, "stock": "513316", "female": "49.4", 
      "history": [ { "year": 1990, "value": "160024" }, { "year": 2024, "value": "513316" } ], "remittances": 3.42, "labour_participation": "63.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "3.6", 
      "idp_conflict": 0, "idp_disaster": 81, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 22, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103153"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_east": [
    { 
      "id": "174", "name": { "fr": "Comores", "en": "Comoros" }, "flag": "🇰🇲", "iso2": "km", "retention": 40, "aid": 10.2, "stock": "12449", "female": "51.6", 
      "history": [ { "year": 1990, "value": "14079" }, { "year": 2024, "value": "12449" } ], "remittances": 20.84, "labour_participation": "36.7", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "1.4", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 80, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 26, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103322"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "262", "name": { "fr": "Djibouti", "en": "Djibouti" }, "flag": "🇩🇯", "iso2": "dj", "retention": 90, "aid": 8.5, "stock": "125996", "female": "47.5", 
      "history": [ { "year": 1990, "value": "122221" }, { "year": 2024, "value": "125996" } ], "remittances": 1.35, "labour_participation": "44.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "10.8", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 80, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 58, "total": 70, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102996"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "232", "name": { "fr": "Érythrée", "en": "Eritrea" }, "flag": "🇪🇷", "iso2": "er", "retention": 85, "aid": 5.5, "stock": "12512", "female": "43.9", 
      "history": [ { "year": 1990, "value": "11848" }, { "year": 2024, "value": "12512" } ], "remittances": null, "labour_participation": "80.6", "remittances_year": null, "labour_participation_year": 2022, "evolution": "0.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 81, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 0, "total": 8, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103290"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "231", "name": { "fr": "Éthiopie", "en": "Ethiopia" }, "flag": "🇪🇹", "iso2": "et", "retention": 90, "aid": 3.5, "stock": "1168455", "female": "49.7", 
      "history": [ { "year": 1990, "value": "875325" }, { "year": 2024, "value": "1168455" } ], "remittances": 4.77, "labour_participation": "65.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.9", 
      "idp_conflict": 2378000, "idp_disaster": 757000, "refugees_hosted": 521400, "avoi": 73, 
      "normlex": {"fundamental": 9, "governance": 1, "technical": 13, "total": 23, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102950"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "404", "name": { "fr": "Kenya", "en": "Kenya" }, "flag": "🇰🇪", "iso2": "ke", "retention": 85, "aid": 2.8, "stock": "992536", "female": "49.5", 
      "history": [ { "year": 1990, "value": "298089" }, { "year": 2024, "value": "992536" } ], "remittances": 4.15, "labour_participation": "64.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 10000, "idp_disaster": 3800, "refugees_hosted": 0, "avoi": 96, 
      "normlex": {"fundamental": 7, "governance": 3, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103315"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "450", "name": { "fr": "Madagascar", "en": "Madagascar" }, "flag": "🇲🇬", "iso2": "mg", "retention": 80, "aid": 4.5, "stock": "38625", "female": "43.0", 
      "history": [ { "year": 1990, "value": "23917" }, { "year": 2024, "value": "38625" } ], "remittances": 2.31, "labour_participation": "71.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.1", 
      "idp_conflict": 0, "idp_disaster": 70000, "refugees_hosted": 0, "avoi": 79, 
      "normlex": {"fundamental": 11, "governance": 4, "technical": 38, "total": 53, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102956"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "480", "name": { "fr": "Maurice", "en": "Mauritius" }, "flag": "🇲🇺", "iso2": "mu", "retention": 60, "aid": 0.5, "stock": "29142", "female": "44.6", 
      "history": [ { "year": 1990, "value": "3613" }, { "year": 2024, "value": "29142" } ], "remittances": 1.92, "labour_participation": "73.4", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 83, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 40, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103139"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "690", "name": { "fr": "Seychelles", "en": "Seychelles" }, "flag": "🇸🇨", "iso2": "sc", "retention": 60, "aid": 1.5, "stock": "13261", "female": "30.0", 
      "history": [ { "year": 1990, "value": "3721" }, { "year": 2024, "value": "13261" } ], "remittances": 0.54, "labour_participation": null, "remittances_year": 2024, "labour_participation_year": null, "evolution": "10.2", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 100,
      "normlex": {"fundamental": 9, "governance": 2, "technical": 27, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103310"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "706", "name": { "fr": "Somalie", "en": "Somalia" }, "flag": "🇸🇴", "iso2": "so", "retention": 95, "aid": 15.5, "stock": "77972", "female": "44.9", 
      "history": [ { "year": 1990, "value": "478294" }, { "year": 2024, "value": "77972" } ], "remittances": null, "labour_participation": "41.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "0.4", 
      "idp_conflict": 3347000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 19, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 17, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103112"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc,
      "origDest": { "fr": "Le Kenya et l'Éthiopie hébergent l'essentiel des réfugiés somaliens sur le continent — près de 450 000 rien qu'au Kenya, dont la majorité dans le seul complexe de camps de Dadaab, ouvert depuis plus de trois décennies (HCR, 2025).", "en": "Kenya and Ethiopia host the bulk of Somali refugees on the continent — nearly 450,000 in Kenya alone, most of them in the Dadaab camp complex, open for more than three decades (UNHCR, 2025)." }
    },
    {
      "id": "728", "name": { "fr": "Soudan du Sud", "en": "South Sudan" }, "flag": "🇸🇸", "iso2": "ss", "retention": 98, "aid": 20.5, "stock": "914001", "female": "49.7", 
      "history": [ { "year": 1990, "value": "652365" }, { "year": 2024, "value": "914001" } ], "remittances": 9.49, "labour_participation": "76.8", "remittances_year": 2015, "labour_participation_year": 2022, "evolution": "8.0", 
      "idp_conflict": 945000, "idp_disaster": 630000, "refugees_hosted": 571100, "avoi": 9, 
      "normlex": {"fundamental": 7, "governance": 0, "technical": 0, "total": 7, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103154"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "729", "name": { "fr": "Soudan", "en": "Sudan" }, "flag": "🇸🇩", "iso2": "sd", "retention": 90, "aid": 5.5, "stock": "2397113", "female": "50.3", 
      "history": [ { "year": 1990, "value": "1402896" }, { "year": 2024, "value": "2397113" } ], "remittances": 2.9, "labour_participation": "28.9", "remittances_year": 2022, "labour_participation_year": 2022, "evolution": "4.8", 
      "idp_conflict": 9117000, "idp_disaster": 0, "refugees_hosted": 635000, "avoi": 3, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102958"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "834", "name": { "fr": "Tanzanie", "en": "Tanzania" }, "flag": "🇹🇿", "iso2": "tz", "retention": 90, "aid": 3.5, "stock": "462371", "female": "50.0", 
      "history": [ { "year": 1990, "value": "574025" }, { "year": 2024, "value": "462371" } ], "remittances": 1.42, "labour_participation": "78.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 6300, "refugees_hosted": 0, "avoi": 71, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 28, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103136"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "800", "name": { "fr": "Ouganda", "en": "Uganda" }, "flag": "🇺🇬", "iso2": "ug", "retention": 95, "aid": 6.5, "stock": "2057759", "female": "55.0", 
      "history": [ { "year": 1990, "value": "560570" }, { "year": 2024, "value": "2057759" } ], "remittances": 2.65, "labour_participation": "68.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 2000, "idp_disaster": 20000, "refugees_hosted": 1900000, "avoi": 40, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 21, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103324"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_south": [
    { 
      "id": "454", "name": { "fr": "Malawi", "en": "Malawi" }, "flag": "🇲🇼", "iso2": "mw", "retention": 90, "aid": 9.5, "stock": "186719", "female": "51.1", 
      "history": [ { "year": 1990, "value": "1127724" }, { "year": 2024, "value": "186719" } ], "remittances": 1.65, "labour_participation": "70.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 24000, "refugees_hosted": 0, "avoi": 47, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 19, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103138"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "508", "name": { "fr": "Mozambique", "en": "Mozambique" }, "flag": "🇲🇿", "iso2": "mz", "retention": 95, "aid": 10.5, "stock": "353143", "female": "51.2", 
      "history": [ { "year": 1990, "value": "122332" }, { "year": 2024, "value": "353143" } ], "remittances": 1.17, "labour_participation": "82.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.1", 
      "idp_conflict": 465000, "idp_disaster": 144000, "refugees_hosted": 0, "avoi": 84, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 12, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103149"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "894", "name": { "fr": "Zambie", "en": "Zambia" }, "flag": "🇿🇲", "iso2": "zm", "retention": 90, "aid": 4.5, "stock": "249205", "female": "48.1", 
      "history": [ { "year": 1990, "value": "279463" }, { "year": 2024, "value": "249205" } ], "remittances": 1.32, "labour_participation": "66.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.2", 
      "idp_conflict": 0, "idp_disaster": 2300, "refugees_hosted": 0, "avoi": 48, 
      "normlex": {"fundamental": 10, "governance": 4, "technical": 35, "total": 49, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103233"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "716", "name": { "fr": "Zimbabwe", "en": "Zimbabwe" }, "flag": "🇿🇼", "iso2": "zw", "retention": 85, "aid": 5.5, "stock": "429108", "female": "43.2", 
      "history": [ { "year": 1990, "value": "634621" }, { "year": 2024, "value": "429108" } ], "remittances": 8.45, "labour_participation": "69.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.6", 
      "idp_conflict": 0, "idp_disaster": 2200, "refugees_hosted": 0, "avoi": 47, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103183"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "L'Afrique du Sud concentre à elle seule quatre diasporas zimbabwéennes sur cinq recensées officiellement (env. 773 000 personnes, Zimstat 2022) ; en juillet 2024, ce seul corridor représentait 92% de tous les mouvements frontaliers officiels du Zimbabwe (OIM).", "en": "South Africa alone accounts for four out of five officially recorded Zimbabwean diaspora members (approx. 773,000 people, Zimstat 2022); in July 2024, this single corridor accounted for 92% of all official cross-border movements out of Zimbabwe (IOM)." }
    },
    {
      "id": "72", "name": { "fr": "Botswana", "en": "Botswana" }, "flag": "🇧🇼", "iso2": "bw", "retention": 95, "aid": 0.8, "stock": "116402", "female": "43.0", 
      "history": [ { "year": 1990, "value": "27510" }, { "year": 2024, "value": "116402" } ], "remittances": 0.67, "labour_participation": "76.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.4", 
      "idp_conflict": 0, "idp_disaster": 7, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 6, "total": 17, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103184"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "748", "name": { "fr": "Eswatini", "en": "Eswatini" }, "flag": "🇸🇿", "iso2": "sz", "retention": 98, "aid": 5.5, "stock": "33268", "female": "48.5", 
      "history": [ { "year": 1990, "value": "74991" }, { "year": 2024, "value": "33268" } ], "remittances": 0.69, "labour_participation": "67.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.7", 
      "idp_conflict": 0, "idp_disaster": 8, "refugees_hosted": 0, "avoi": 32, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 23, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103185"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "426", "name": { "fr": "Lesotho", "en": "Lesotho" }, "flag": "🇱🇸", "iso2": "ls", "retention": 98, "aid": 8.5, "stock": "15039", "female": "45.8", 
      "history": [ { "year": 1990, "value": "8240" }, { "year": 2024, "value": "15039" } ], "remittances": 20.72, "labour_participation": "63.8", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 30, 
      "normlex": {"fundamental": 11, "governance": 2, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103186"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "516", "name": { "fr": "Namibie", "en": "Namibia" }, "flag": "🇳🇦", "iso2": "na", "retention": 95, "aid": 1.5, "stock": "116035", "female": "46.0", 
      "history": [ { "year": 1990, "value": "120641" }, { "year": 2024, "value": "116035" } ], "remittances": 0.71, "labour_participation": "70.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 0, "idp_disaster": 1300, "refugees_hosted": 0, "avoi": 65, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103187"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "710", "name": { "fr": "Afrique du Sud", "en": "South Africa" }, "flag": "🇿🇦", "iso2": "za", "retention": 95, "aid": 0.5, "stock": "2631100", "female": "41.9", 
      "history": [ { "year": 1990, "value": "1285707" }, { "year": 2024, "value": "2631100" } ], "remittances": 0.24, "labour_participation": "72.5", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 0, "idp_disaster": 28000, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103188"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ]
};

// ----------------------------------------------------------------------------
// Agrégation en direct depuis countryData (remplace les totaux saisis à la main)
// ----------------------------------------------------------------------------
const parseStockNumber = (v) => {
  const n = parseFloat(String(v).replace(/\s/g, ''));
  return isNaN(n) ? 0 : n;
};

const weightedAverage = (countries, getter) => {
  let weightSum = 0, valSum = 0;
  countries.forEach(c => {
    const val = getter(c);
    if (val === null || val === undefined) return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const w = parseStockNumber(c.stock);
    valSum += num * w;
    weightSum += w;
  });
  return weightSum > 0 ? valSum / weightSum : null;
};

// Pays africains ouvrant leur territoire à l'ensemble des ressortissants africains.
// Vérifié août 2026 ; distingue l'exemption de visa réelle du simple gratuité de visa.
// Sources : annonces officielles nationales et Africa Visa Openness Index (BAD/CUA).
const visaOpenToAllAfrica = {
  bj: { tier: 'full', since: 2017, note: { fr: "Exemption de visa pour tous les ressortissants africains depuis 2017.", en: "Visa-free entry for all African nationals since 2017." } },
  gm: { tier: 'full', since: 2019, note: { fr: "Exemption de visa pour tous les ressortissants africains depuis 2019.", en: "Visa-free entry for all African nationals since 2019." } },
  rw: { tier: 'full', since: 2023, note: { fr: "Exemption de visa pour tous les ressortissants africains, annoncée en novembre 2023.", en: "Visa-free entry for all African nationals, announced November 2023." } },
  sc: { tier: 'full', since: null, note: { fr: "Pionnier continental : aucune obligation de visa préalable, pour toutes les nationalités.", en: "Continental pioneer: no prior visa requirement, for all nationalities." } },
  ke: { tier: 'partial', since: 2025, note: { fr: "Exemption d'autorisation électronique (eTA) étendue à tous les États africains sauf la Somalie et la Libye (Conseil des ministres, janvier 2025 ; mise en œuvre 2025). Séjour de 2 mois ; 6 mois pour les ressortissants de la CAE.", en: "Electronic travel authorisation (eTA) exemption extended to all African states except Somalia and Libya (Cabinet, January 2025; implemented 2025). Two-month stay; six months for EAC nationals." } },
  gh: { tier: 'announced', since: 2026, note: { fr: "Visa gratuit — et non supprimé — pour tous les passeports africains à compter du 25 mai 2026 : la demande en ligne reste requise, seuls les frais sont levés.", en: "Free visa — not abolished — for all African passports from 25 May 2026: an online application is still required, only the fee is waived." } },
  cg: { tier: 'announced', since: 2027, note: { fr: "Exemption de visa pour tous les ressortissants africains annoncée à compter de 2027 (non encore en vigueur).", en: "Visa-free entry for all African nationals announced from 2027 (not yet in force)." } },
};

const visaOpenTiers = {
  full: {
    label: { fr: "Ouvert à toute l'Afrique", en: "Open to all of Africa" },
    style: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dot: "text-emerald-500 fill-emerald-400",
  },
  partial: {
    label: { fr: "Ouvert avec exceptions", en: "Open with exceptions" },
    style: "bg-lime-50 text-lime-800 border-lime-300",
    dot: "text-lime-500 fill-lime-400",
  },
  announced: {
    label: { fr: "Annoncé, pas encore effectif", en: "Announced, not yet in force" },
    style: "bg-amber-50 text-amber-800 border-amber-300",
    dot: "text-amber-500 fill-amber-400",
  },
};

// Carte d'appartenance : identifiant numérique (M49) -> { iso2, nom } pour les 54 pays.
// ----------------------------------------------------------------------------
// Carte choroplèthe de l'Explorateur : la carte devient la porte d'entrée, l'utilisateur
// choisit l'indicateur affiché. Rampe séquentielle mono-teinte (magnitude), gris = sans donnée.
// ----------------------------------------------------------------------------
const countryById = {};
Object.values(countryData).flat().forEach(c => { countryById[c.id] = c; });

// Rampe sequentielle mono-teinte : un seul indigo, du plus clair au plus dense.
// Les paliers sont cales sur la clarte (91, 82, 68, 48, 28 %) pour que l'ordre
// se lise sans legende. Le gris neutre dit l'absence de donnee, pas une valeur.
const CHORO_RAMP = ['#E5E8F1', '#C3CBE1', '#94A2C6', '#5A6C9C', '#2B3A67'];
const CHORO_NODATA = '#D9D8D2';

const mapIndicators = [
  {
    key: 'evolution', label: { fr: "Part de la population", en: "Share of population" },
    unit: '%', get: c => parseFloat(c.evolution),
    hint: { fr: "Migrants internationaux en % de la population nationale (UN DESA, 2024).", en: "International migrants as % of national population (UN DESA, 2024)." },
    plain: { fr: "Sur 100 habitants du pays, combien sont nés à l'étranger. Plus la teinte est dense, plus la part est élevée.", en: "Out of every 100 people living in the country, how many were born abroad. The denser the shade, the higher the share." }
  },
  {
    key: 'female', label: { fr: "Part des femmes", en: "Female share" },
    unit: '%', get: c => parseFloat(c.female),
    hint: { fr: "Part des femmes parmi les migrants internationaux présents (UN DESA, 2024).", en: "Share of women among resident international migrants (UN DESA, 2024)." },
    plain: { fr: "Sur 100 personnes venues de l'étranger et vivant dans le pays, combien sont des femmes. Autour de 50, les départs concernent autant les femmes que les hommes.", en: "Out of every 100 foreign-born people living in the country, how many are women. Around 50 means departures involve women as much as men." }
  },
  {
    key: 'retention', label: { fr: "Rétention Sud-Sud", en: "South-South retention" },
    unit: '%', get: c => Number(c.retention),
    hint: { fr: "Part des mobilités qui restent dans un pays du Sud plutôt que de rejoindre le Nord.", en: "Share of mobility remaining within the Global South rather than moving North." },
    plain: { fr: "Sur 100 personnes parties de ce pays, combien sont restées en Afrique plutôt que d'aller vers l'Europe ou l'Amérique du Nord.", en: "Out of every 100 people who left this country, how many stayed in Africa rather than going to Europe or North America." },
    term: 'retention'
  },
  {
    key: 'avoi', label: { fr: "Ouverture des visas (AVOI)", en: "Visa openness (AVOI)" },
    unit: '/100', get: c => Number(c.avoi),
    hint: { fr: "Indice d'ouverture des visas aux ressortissants africains (BAD/CUA, 2024).", en: "Visa openness index toward African nationals (AfDB/AUC, 2024)." },
    plain: { fr: "À quel point le pays laisse entrer les autres Africains sans visa, sur une note de 100. Plus la teinte est dense, plus la frontière est ouverte.", en: "How readily the country lets other Africans in without a visa, scored out of 100. The denser the shade, the more open the border." },
    term: 'avoi'
  },
  {
    key: 'remittances', label: { fr: "Transferts de fonds (% PIB)", en: "Remittances (% GDP)" },
    unit: '%', get: c => (c.remittances === null || c.remittances === undefined ? NaN : Number(c.remittances)),
    hint: { fr: "Transferts des diasporas rapportés au PIB (Banque mondiale).", en: "Diaspora remittances as a share of GDP (World Bank)." },
    plain: { fr: "L'argent envoyé au pays par ceux qui vivent à l'étranger, rapporté à la richesse produite sur place. Dans certains pays, cela dépasse l'aide internationale.", en: "Money sent home by people living abroad, measured against the wealth produced at home. In some countries it exceeds international aid." }
  },
  {
    key: 'idp_conflict', label: { fr: "Déplacés internes (conflit)", en: "IDPs (conflict)" },
    unit: '', get: c => Number(c.idp_conflict),
    hint: { fr: "Personnes déplacées à l'intérieur du pays par les conflits (IDMC).", en: "People displaced within the country by conflict (IDMC)." },
    plain: { fr: "Le nombre de personnes chassées de chez elles par un conflit, mais restées dans leur propre pays. Elles ne franchissent aucune frontière.", en: "The number of people driven from their homes by conflict but still inside their own country. They cross no border." }
  },
];

// La carte sert desormais ailleurs que dans l'Explorateur. Plutot que d'en
// ecrire trois, on lui ajoute un second mode : `indicator.categories` bascule
// d'une rampe sequentielle a un jeu de categories nommees. Un statut de
// recensement n'est pas une grandeur — le colorer par degrade mentirait sur
// la nature de la donnee.
const AfricaChoropleth = ({ indicator, lang, selectedId, onSelect, compact = false }) => {
  const categoriel = Array.isArray(indicator.categories);

  const { buckets, valueOf } = useMemo(() => {
    if (categoriel) return { buckets: [], valueOf: (id) => (countryById[id] ? indicator.get(countryById[id]) : null) };
    const vals = Object.values(countryById).map(indicator.get).filter(v => Number.isFinite(v)).sort((a, b) => a - b);
    const q = (p) => vals.length ? vals[Math.min(vals.length - 1, Math.floor(p * vals.length))] : 0;
    // quantiles : robuste aux distributions très asymétriques (déplacés internes notamment)
    const cuts = [q(0.2), q(0.4), q(0.6), q(0.8)];
    return {
      buckets: cuts,
      valueOf: (id) => { const c = countryById[id]; return c ? indicator.get(c) : NaN; },
    };
  }, [indicator, categoriel]);

  const colorFor = (v) => {
    if (categoriel) return indicator.categories.find(c => c.key === v)?.color || CHORO_NODATA;
    if (!Number.isFinite(v)) return CHORO_NODATA;
    let i = 0;
    while (i < buckets.length && v > buckets[i]) i++;
    return CHORO_RAMP[i];
  };

  const fmt = (v) => {
    if (categoriel) {
      const c = indicator.categories.find(x => x.key === v);
      return c ? c.label[lang] : (lang === 'fr' ? 'donnée indisponible' : 'no data');
    }
    if (!Number.isFinite(v)) return lang === 'fr' ? 'donnée indisponible' : 'no data';
    return indicator.unit === '' ? formatNumber(v, lang) : `${v}${indicator.unit}`;
  };

  // Le survol ne montrait rien et le clic ne faisait que selectionner en
  // silence : de l'exterieur, la carte paraissait morte. Elle repond desormais
  // immediatement, au doigt comme au clavier, et affiche a cote ce qu'elle sait
  // du pays pointe. On ne s'appuie plus sur l'infobulle native du navigateur,
  // qui se fait attendre une seconde et n'existe ni au toucher ni au clavier.
  const [survole, setSurvole] = useState(null);
  const lu = survole || selectedId;
  const paysLu = lu ? countryById[lu] : null;
  const L = (fr, en) => (lang === 'fr' ? fr : en);

  const releve = paysLu ? [
    { l: indicator.label[lang], v: fmt(valueOf(lu)), fort: true },
    { l: L('Migrants internationaux', 'International migrants'), v: formatNumber(paysLu.stock, lang) },
    { l: L('Ouverture des visas', 'Visa openness'), v: paysLu.avoi == null ? '—' : `${paysLu.avoi}/100` },
    { l: L('Rétention Sud-Sud', 'South-South retention'), v: paysLu.retention == null ? '—' : `${paysLu.retention} %` },
  ] : [];

  return (
    <div className="grid lg:grid-cols-[1fr_15rem] gap-4 items-start">
      <svg viewBox={AFRICA_VIEWBOX} className="w-full h-auto max-h-[34rem] block"
           aria-label={L(`Carte de l'Afrique — ${indicator.label.fr}. Chaque pays est sélectionnable.`,
                         `Map of Africa — ${indicator.label.en}. Each country is selectable.`)}
           onMouseLeave={() => setSurvole(null)}>
        {Object.entries(africaCountryPaths).map(([id, d]) => {
          const v = valueOf(id);
          const isSel = selectedId === id;
          const isLu = lu === id;
          const nom = countryById[id]?.name?.[lang] || id;
          return (
            <path
              key={id}
              d={d}
              fill={colorFor(v)}
              stroke={isSel ? '#14161C' : isLu ? 'var(--accent)' : '#F7F6F2'}
              strokeWidth={isSel ? 2.6 : isLu ? 2 : 0.7}
              className="cursor-pointer choro-pays"
              tabIndex={0}
              role="button"
              aria-label={`${nom} — ${fmt(v)}`}
              onMouseEnter={() => setSurvole(id)}
              onFocus={() => setSurvole(id)}
              onBlur={() => setSurvole(null)}
              onClick={() => onSelect && onSelect(id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect && onSelect(id); }
              }}
            />
          );
        })}
      </svg>

      {/* Relevé : ce que la carte sait du pays pointé, sans attendre ni cliquer. */}
      <aside className="border p-4" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper-raised)' }}
             aria-live="polite">
        {paysLu ? (
          <>
            <h4 className="font-serif font-bold text-lg leading-tight text-slate-900">
              {paysLu.name?.[lang] || ''}
            </h4>
            <dl className="mt-3 space-y-2.5">
              {releve.map((r, i) => (
                <div key={i}>
                  <dt className="text-[11px] leading-snug" style={{ color: 'var(--label)' }}>{r.l}</dt>
                  <dd className={`font-serif font-bold tabular-nums leading-none ${r.fort ? 'text-xl' : 'text-[15px]'}`}
                      style={{ color: r.fort ? 'var(--accent-deep)' : 'var(--ink)' }}>
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            {onSelect && (
              <p className="text-[11px] mt-3.5 pt-3 border-t leading-snug"
                 style={{ borderColor: 'var(--rule)', color: 'var(--label)' }}>
                {selectedId === lu
                  ? L('Pays sélectionné. Son profil complet est affiché ci-dessous.',
                      'Country selected. Its full profile appears below.')
                  : L('Cliquez le pays pour ouvrir son profil complet.',
                      'Click the country to open its full profile.')}
              </p>
            )}
          </>
        ) : (
          <p className="text-[13px] leading-relaxed" style={{ color: 'var(--label)' }}>
            {L('Survolez un pays — ou parcourez la carte au clavier — pour lire ses chiffres ici.',
               'Hover a country — or move through the map with the keyboard — to read its figures here.')}
          </p>
        )}
      </aside>

      {/* Légende. Une rampe se lit « faible → élevé » ; des catégories se
          nomment une par une — les confondre ferait passer un statut pour
          une grandeur. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 pt-2 border-t border-slate-100 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--label)' }}>
          {indicator.label[lang]}
        </span>
        {categoriel ? (
          indicator.categories.map(c => (
            <span key={c.key} className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-[1px] shrink-0" style={{ background: c.color }} />
              <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>{c.label[lang]}</span>
            </span>
          ))
        ) : (
          <>
            <span className="flex items-center gap-0.5">
              {CHORO_RAMP.map((c, i) => (
                <span key={i} className="w-6 h-2.5 rounded-[1px]" style={{ background: c }} />
              ))}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--label)' }}>
              {L('faible → élevé', 'low → high')}
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-2.5 rounded-[1px]" style={{ background: CHORO_NODATA }} />
          <span className="text-[11px]" style={{ color: 'var(--label)' }}>{L('sans donnée', 'no data')}</span>
        </span>
      </div>
    </div>
  );
};

// Trois cartes hors Explorateur. Chacune porte l'argument de sa section : ce
// n'est pas la meme carte repetee, c'est la meme grammaire appliquee a trois
// questions differentes.
const CARTE_DEPLACES = {
  label: { fr: 'Déplacés internes par conflit', en: 'Conflict-displaced people' },
  unit: '',
  get: (c) => Number(c.idp_conflict) || NaN,
};

const CARTE_ANCRAGE = {
  label: { fr: "Textes de l'Union africaine ratifiés (sur 6)", en: 'African Union instruments ratified (out of 6)' },
  unit: '/6',
  get: (c) => {
    const t = c.au_treaties;
    if (!t) return NaN;
    return ['constitutive', 'abuja', 'refugees_1969', 'zlecaf', 'kampala', 'free_movement']
      .reduce((n, k) => n + (t[k] ? 1 : 0), 0);
  },
};

const CARTE_RECENSEMENT = {
  label: { fr: 'Dernier cycle de recensement', en: 'Latest census round' },
  unit: '',
  categories: [
    { key: 'conducted', color: '#2F5D46', label: { fr: 'Recensé (2015-2024)', en: 'Censused (2015-2024)' } },
    { key: 'late',      color: '#5A6C9C', label: { fr: 'Recensé après le cycle', en: 'Censused after the round' } },
    { key: 'started',   color: '#C8892B', label: { fr: 'En cours', en: 'Under way' } },
    { key: 'planned',   color: '#8A5A16', label: { fr: 'Annoncé', en: 'Announced' } },
    { key: 'none',      color: '#7A2E2E', label: { fr: 'Aucun recensement prévu', en: 'No census planned' } },
  ],
  get: (c) => censusByCountry[(c.iso2 || '').toLowerCase()]?.status2020 || null,
};

// ---------------------------------------------------------------------------
// Recherche transversale
// ---------------------------------------------------------------------------
// La recherche etait cloisonnee : les pays d'un cote, les affirmations de
// l'autre, rien pour le glossaire ni pour les sources. Or on ne cherche pas
// « dans une section », on cherche une chose. Les quatre corpus n'ont pas la
// meme forme ; on les ramene donc a une fiche commune — type, titre, contexte,
// destination — construite une seule fois au chargement.
const sansAccents = (s) => String(s || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase();

const construireIndex = (lang) => {
  const fiches = [];
  const L = (o) => (typeof o === 'string' ? o : (o?.[lang] || o?.fr || ''));
  // Les mots-cles sont TOUJOURS bilingues, quelle que soit la langue affichee :
  // on tape volontiers « Tchad » en lisant l'anglais, ou l'inverse.
  const D = (o) => (typeof o === 'string' ? o : `${o?.fr || ''} ${o?.en || ''}`);

  // La region n'est pas un champ du pays : c'est la cle qui les regroupe.
  const REGIONS = {
    af_med:     { fr: 'Afrique méditerranéenne', en: 'Mediterranean Africa' },
    af_west:    { fr: "Afrique de l'Ouest",      en: 'West Africa' },
    af_south:   { fr: 'Afrique australe',        en: 'Southern Africa' },
    af_east:    { fr: "Afrique de l'Est",        en: 'East Africa' },
    af_central: { fr: 'Afrique centrale',        en: 'Central Africa' },
  };
  Object.entries(countryData).forEach(([region, pays]) => pays.forEach(c => fiches.push({
    type: 'pays',
    titre: L(c.name),
    contexte: [L(REGIONS[region]), c.stock ? `${formatNumber(c.stock, lang)} ${lang === 'fr' ? 'migrants' : 'migrants'}` : null]
      .filter(Boolean).join(' · '),
    aller: { tab: 'explorer', id: c.id },
    mots: `${D(c.name)} ${c.iso2 || ''} ${D(REGIONS[region])}`,
  })));

  (evidenceCheckData || []).forEach(e => fiches.push({
    type: 'affirmation',
    titre: L(e.narrative),
    contexte: `${L(e.category)} · ${L(e.verdict)}`,
    aller: { tab: 'evidence', id: e.id },
    mots: `${D(e.narrative)} ${D(e.reality)} ${D(e.category)} ${D(e.verdict)}`,
  }));

  (glossaryData || []).forEach(g => (g.terms || []).forEach(t => fiches.push({
    type: 'terme',
    titre: lang === 'fr' ? t.term : (t.en_term || t.term),
    contexte: L(g.category),
    aller: { tab: 'resources' },
    mots: `${t.term} ${t.en_term || ''} ${t.fr || ''} ${t.en || ''} ${D(g.category)}`,
  })));

  (libraryData || []).forEach(s => (s.items || []).forEach(it => fiches.push({
    type: 'source',
    titre: it.title,
    contexte: `${L(s.section)}${it.year ? ` · ${it.year}` : ''}`,
    aller: { tab: 'resources' },
    lien: it.url,
    mots: `${it.title} ${D(it.desc)} ${D(s.section)}`,
  })));

  return fiches.map(f => ({ ...f, cle: sansAccents(f.mots) }));
};

const TYPES = {
  pays:        { fr: 'Pays',         en: 'Country' },
  affirmation: { fr: 'Affirmation',  en: 'Claim' },
  terme:       { fr: 'Définition',   en: 'Definition' },
  source:      { fr: 'Source',       en: 'Source' },
};

const RechercheGlobale = ({ lang, aller }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const [q, setQ] = useState('');
  const [ouvert, setOuvert] = useState(false);
  const [filtre, setFiltre] = useState(null);
  const ref = useRef(null);
  const champRef = useRef(null);

  const index = useMemo(() => construireIndex(lang), [lang]);

  const resultats = useMemo(() => {
    const t = sansAccents(q).trim();
    if (t.length < 2) return [];
    const mots = t.split(/\s+/);
    return index
      .filter(f => mots.every(m => f.cle.includes(m)))
      // Un titre qui commence par la recherche passe devant : c'est presque
      // toujours ce qu'on cherchait.
      .map(f => ({ ...f, rang: sansAccents(f.titre).startsWith(mots[0]) ? 0 : 1 }))
      .sort((a, b) => a.rang - b.rang || a.titre.length - b.titre.length)
      .slice(0, 40);
  }, [q, index]);

  const parType = useMemo(() => {
    const n = {};
    resultats.forEach(r => { n[r.type] = (n[r.type] || 0) + 1; });
    return n;
  }, [resultats]);

  const vus = filtre ? resultats.filter(r => r.type === filtre) : resultats;

  useEffect(() => {
    const dehors = (e) => { if (!ref.current?.contains(e.target)) setOuvert(false); };
    const clavier = (e) => {
      if (e.key === 'Escape') setOuvert(false);
      // Barre oblique : le raccourci de recherche le plus repandu.
      if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) {
        e.preventDefault(); setOuvert(true); setTimeout(() => champRef.current?.focus(), 20);
      }
    };
    document.addEventListener('mousedown', dehors);
    document.addEventListener('keydown', clavier);
    return () => { document.removeEventListener('mousedown', dehors); document.removeEventListener('keydown', clavier); };
  }, []);

  return (
    <div className="recherche" ref={ref}>
      <button type="button" className="recherche-btn" aria-expanded={ouvert}
              onClick={() => { setOuvert(o => !o); setTimeout(() => champRef.current?.focus(), 20); }}>
        <Search className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{L('Rechercher', 'Search')}</span>
        <kbd className="recherche-kbd" aria-hidden="true">/</kbd>
      </button>

      {ouvert && (
        <div className="recherche-panneau">
          <input
            ref={champRef}
            type="search"
            value={q}
            onChange={(e) => { setQ(e.target.value); setFiltre(null); }}
            aria-label={L('Rechercher dans toute la plateforme', 'Search the whole platform')}
            placeholder={L('Un pays, une affirmation, un mot, une source…', 'A country, a claim, a word, a source…')}
            className="recherche-champ"
          />

          {q.trim().length >= 2 && (
            <>
              <div className="recherche-filtres">
                <button type="button" aria-pressed={!filtre} onClick={() => setFiltre(null)}>
                  {L('Tout', 'All')} <span className="num">{resultats.length}</span>
                </button>
                {Object.entries(TYPES).filter(([k]) => parType[k]).map(([k, lib]) => (
                  <button key={k} type="button" aria-pressed={filtre === k} onClick={() => setFiltre(k)}>
                    {lib[lang]} <span className="num">{parType[k]}</span>
                  </button>
                ))}
              </div>

              {vus.length === 0 ? (
                <p className="recherche-vide">
                  {L('Rien ne correspond. Essayez un mot plus court, ou le nom d’un pays.',
                     'Nothing matches. Try a shorter word, or a country name.')}
                </p>
              ) : (
                <ul className="recherche-liste">
                  {vus.map((r, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => { setOuvert(false); setQ(''); aller(r); }}>
                        <span className="recherche-type">{TYPES[r.type][lang]}</span>
                        <span className="recherche-titre">{r.titre}</span>
                        <span className="recherche-ctx">{r.contexte}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Une carte posee dans une section : titre, phrase de lecture, carte, sources.
// Le continent devient un argument, pas une illustration.
const CarteSection = ({ lang, indicateur, kicker, titre, plain, sources = [] }) => (
  <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--accent)' }}>
    <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
      <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--accent-deep)' }}>
        {kicker}
      </span>
      <h3 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">{titre}</h3>
    </div>
    <div className="px-6 md:px-8 py-6">
      <EnClair lang={lang} fr={plain.fr} en={plain.en} />
      <AfricaChoropleth indicator={indicateur} lang={lang} />
      <Sources items={sources} lang={lang} />
    </div>
  </section>
);

const countryIdIndex = {};
Object.values(countryData).flat().forEach(c => {
  countryIdIndex[c.id] = { iso2: c.iso2, name: c.name };
});

// Recherche par nom (la matrice juridique ne porte pas de code iso2).
const countryNameToIso = {};
Object.values(countryData).flat().forEach(c => {
  if (c.name?.fr) countryNameToIso[c.name.fr.toLowerCase()] = c.iso2;
  if (c.name?.en) countryNameToIso[c.name.en.toLowerCase()] = c.iso2;
});
// La matrice juridique emploie des variantes de dénomination ; on les réconcilie ici
// plutôt que de renommer les jeux de données (les deux libellés sont légitimes à l'affichage).
const countryNameAliases = {
  'congo (rep)': 'cg',
  'rdc': 'cd',
  'rca': 'cf',
  'cap-vert': 'cv',
  'liberia': 'lr',
  'nigeria': 'ng',
  'sao tomé': 'st',
};

const opennessByName = (name) => {
  const key = String(name || '').toLowerCase();
  const iso = countryNameToIso[key] || countryNameAliases[key];
  return iso ? visaOpenToAllAfrica[iso] : undefined;
};

// Carte de l'Afrique mettant en évidence les membres d'une CER, avec survol interactif.
const AfricaRecMap = ({ recId, lang, accent = '#1F4E5F' }) => {
  const [hovered, setHovered] = useState(null);

  const memberIds = useMemo(() => {
    const set = new Set();
    Object.entries(countryIdIndex).forEach(([id, meta]) => {
      if ((countryRecAffiliations[meta.iso2] || []).includes(recId)) set.add(id);
    });
    return set;
  }, [recId]);

  const hoveredMeta = hovered ? countryIdIndex[hovered] : null;
  const hoveredIsMember = hovered ? memberIds.has(hovered) : false;

  return (
    <div className="relative">
      <svg viewBox={AFRICA_VIEWBOX} className="w-full h-auto max-h-[26rem] mx-auto block" role="img"
           aria-label={lang === 'fr' ? "Carte des États membres" : "Map of member states"}>
        {Object.entries(africaCountryPaths).map(([id, d]) => {
          const isMember = memberIds.has(id);
          const isHovered = hovered === id;
          return (
            <path
              key={id}
              d={d}
              fill={isMember ? accent : '#D9D8D2'}
              stroke="#F7F6F2"
              strokeWidth={isHovered ? 2.2 : 0.8}
              className="transition-all duration-200 cursor-default"
              style={{ opacity: isHovered ? 1 : isMember ? 0.92 : 0.75, filter: isHovered ? 'brightness(1.12)' : 'none' }}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered((h) => (h === id ? null : h))}
            />
          );
        })}
      </svg>

      <div className="absolute top-2 left-2 pointer-events-none">
        {hoveredMeta ? (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md rounded-md px-3 py-2 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-900 block">{hoveredMeta.name[lang] || hoveredMeta.name.fr}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${hoveredIsMember ? 'text-emerald-700' : 'text-slate-400'}`}>
              {hoveredIsMember ? (lang === 'fr' ? 'État membre' : 'Member state') : (lang === 'fr' ? 'Non membre' : 'Not a member')}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {lang === 'fr' ? 'Survolez la carte' : 'Hover the map'}
          </span>
        )}
      </div>
    </div>
  );
};

const countryRegionMap = {};
Object.entries(countryData).forEach(([regionKey, countries]) => {
  countries.forEach(c => { countryRegionMap[c.id] = regionKey; });
});

const continentalAvoiAvg = (() => {
  const scores = Object.values(countryData).flat().map(c => c.avoi).filter(v => v !== null && v !== undefined);
  return scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
})();

const computeRegionAggregate = (countries) => {
  const totalStock = countries.reduce((sum, c) => sum + parseStockNumber(c.stock), 0);
  const female = weightedAverage(countries, c => c.female);
  const retention = weightedAverage(countries, c => c.retention);
  const remittances = weightedAverage(countries, c => c.remittances);
  const aid = weightedAverage(countries, c => c.aid);
  const labourParticipation = weightedAverage(countries, c => c.labour_participation);

  const remittanceYears = countries.map(c => c.remittances != null ? c.remittances_year : null).filter(Boolean);
  let remittancesYearLabel = null;
  if (remittanceYears.length > 0) {
    const minY = Math.min(...remittanceYears), maxY = Math.max(...remittanceYears);
    remittancesYearLabel = minY === maxY ? String(minY) : `${minY}-${maxY}`;
  }

  return {
    stock: totalStock,
    female: female !== null ? female.toFixed(1) : null,
    retention: retention !== null ? Math.round(retention) : null,
    remittances: remittances !== null ? Math.round(remittances * 100) / 100 : null,
    remittancesYearLabel,
    aid: aid !== null ? Math.round(aid * 100) / 100 : null,
    labourParticipation: labourParticipation !== null ? labourParticipation.toFixed(1) : null,
    countryCount: countries.length
  };
};

const indicatorThemes = [
  {
    theme_fr: "Intégration & Libre Circulation", theme_en: "Integration & Free Movement", icon: <GitMerge />, color: "text-blue-800",
    items: [
      { 
        id: "1.1", fr: "Taux d'effectivité des protocoles régionaux", en: "Effectiveness of regional free movement protocols", 
        desc_fr: "Mesure de l'application réelle des accords (ex: CEDEAO, ZLECAf) sur le terrain.", desc_en: "Measurement of the actual implementation of agreements (e.g. ECOWAS, AfCFTA).",
        method_fr: "Ratio entre les postes frontières appliquant effectivement l'exemption de visa/passeport et le nombre total de postes.", method_en: "Ratio between border posts actually applying visa/passport exemptions and the total number of posts.",
        contrast_fr: "Plutôt que de compter les 'appréhensions' ou 'refoulements' (qui criminalisent la mobilité), cet indicateur évalue la capacité de l'État à faciliter l'intégration régionale légitime.", contrast_en: "Rather than counting 'apprehensions' or 'pushbacks' (which criminalize mobility), this indicator assesses the state's capacity to facilitate legitimate regional integration."
      },
      { 
        id: "1.2", fr: "Volume du commerce informel transfrontalier", en: "Volume of cross-border informal trade", 
        desc_fr: "Impact des mobilités de proximité sur l'intégration économique réelle par le bas.", desc_en: "Impact of proximity mobilities on real economic integration from below.",
        method_fr: "Enquêtes micro-économiques aux frontières et modélisation des flux non-douaniers.", method_en: "Micro-economic surveys at borders and modeling of non-customs flows.",
        contrast_fr: "Le PIB classique ignore l'économie informelle. Cet indicateur montre que les mobilités circulaires sont le véritable moteur de la survie et de l'intégration des communautés frontalières.", contrast_en: "Classic GDP ignores the informal economy. This indicator shows that circular mobilities are the true engine of survival and integration for border communities."
      }
    ]
  },
  {
    theme_fr: "Économie Productive & Diasporas", theme_en: "Productive Economy & Diasporas", icon: <TrendingUp />, color: "text-amber-700",
    items: [
      { 
        id: "2.1", fr: "Transferts alloués à l'investissement productif", en: "Remittances allocated to productive investment", 
        desc_fr: "Part des envois de fonds investie dans la création d'activité vs la consommation.", desc_en: "Share of remittances invested in business creation vs. daily consumption.",
        method_fr: "Suivi bancaire des fonds d'investissement diasporiques et sondages auprès des récipiendaires.", method_en: "Banking tracking of diaspora investment funds and surveys of recipients.",
        contrast_fr: "Au lieu de pleurer sur le coût de la 'fuite des cerveaux', cela prouve que les diasporas sont les premiers investisseurs de l'économie réelle, remplaçant l'Aide Publique au Développement (paternaliste).", contrast_en: "Instead of mourning the cost of 'brain drain', this proves diasporas are the primary investors in the real economy, replacing paternalistic Official Development Assistance."
      },
      { 
        id: "2.2", fr: "Taux d'entrepreneuriat des migrants", en: "Migrant entrepreneurship rate", 
        desc_fr: "Création d'emplois et de micro-entreprises par les populations en mouvement.", desc_en: "Job and micro-enterprise creation by populations on the move.",
        method_fr: "Recensement des entreprises (formelles et informelles) fondées par des non-nationaux.", method_en: "Census of businesses (formal and informal) founded by non-nationals.",
        contrast_fr: "Détruit le mythe du 'migrant qui vole le travail local' en démontrant qu'il est structurellement créateur d'emplois et animateur de marchés.", contrast_en: "Destroys the myth of the 'migrant stealing local jobs' by demonstrating they are structurally job creators and market animators."
      }
    ]
  },
  {
    theme_fr: "Mobilité Climatique & Adaptation", theme_en: "Climate Mobility & Adaptation", icon: <Leaf />, color: "text-teal-700",
    items: [
      { 
        id: "3.1", fr: "Mobilité circulaire comme adaptation", en: "Circular mobility as adaptation", 
        desc_fr: "Déplacements saisonniers anticipés pour pallier les chocs écologiques locaux.", desc_en: "Anticipated seasonal movements to mitigate local ecological shocks.",
        method_fr: "Corrélation entre les flux de main-d'œuvre agricole et les calendriers de sécheresse/inondation.", method_en: "Correlation between agricultural labor flows and drought/flood calendars.",
        contrast_fr: "Sort de la vision misérabiliste du 'réfugié climatique' passif pour objectiver la migration comme une stratégie de résilience proactive et autonome.", contrast_en: "Breaks away from the miserable vision of the passive 'climate refugee' to objectify migration as a proactive and autonomous resilience strategy."
      },
      { 
        id: "3.2", fr: "Fonds diasporiques pour la résilience", en: "Diaspora funds for resilience", 
        desc_fr: "Investissements transnationaux dans l'irrigation, l'énergie ou l'agriculture.", desc_en: "Transnational investments in local irrigation, energy, or agriculture.",
        method_fr: "Analyse des transferts fléchés vers des projets d'infrastructure communautaire.", method_en: "Analysis of remittances directed towards community infrastructure projects.",
        contrast_fr: "Ne plus attendre l'aide conditionnée des 'Fonds Verts' du Nord, mais mesurer la capacité d'auto-réparation climatique des communautés du Sud.", contrast_en: "Stop waiting for conditioned 'Green Funds' from the North, and measure the climate self-repair capacity of Southern communities."
      }
    ]
  },
  {
    theme_fr: "Santé & Économie du Soin (Care)", theme_en: "Health & Care Economy", icon: <HeartPulse />, color: "text-rose-800",
    items: [
      { 
        id: "4.1", fr: "Contribution migrante aux systèmes de santé", en: "Migrant contribution to health systems", 
        desc_fr: "Part des travailleurs étrangers comblant les déficits de personnel médical local.", desc_en: "Share of foreign workers filling local medical staff shortages.",
        method_fr: "Ratio du personnel de santé né à l'étranger au sein des cliniques et hôpitaux de la région.", method_en: "Ratio of foreign-born healthcare staff within regional clinics and hospitals.",
        contrast_fr: "Remplace l'indicateur raciste du 'migrant vecteur de maladies' (sécurité épidémiologique) par la réalité du migrant comme pourvoyeur essentiel de soins.", contrast_en: "Replaces the racist indicator of the 'migrant as a disease vector' (epidemiological security) with the reality of the migrant as an essential care provider."
      },
      { 
        id: "4.2", fr: "Inclusion dans la Couverture Sanitaire", en: "Inclusion in Universal Health Coverage", 
        desc_fr: "Taux d'accès effectif des migrants aux soins de santé publics nationaux.", desc_en: "Effective access rate of migrants to national public healthcare.",
        method_fr: "Étude légale et baromètres d'accès aux hôpitaux publics pour les non-nationaux.", method_en: "Legal review and barometers of access to public hospitals for non-nationals.",
        contrast_fr: "Passe d'une logique humanitaire d'urgence (camps) à une logique structurelle d'intégration par les droits publics de santé.", contrast_en: "Shifts from emergency humanitarian logic (camps) to a structural logic of integration through public health rights."
      }
    ]
  },
  {
    theme_fr: "Savoirs & Circulation des Compétences", theme_en: "Knowledge & Skills Circulation", icon: <BookOpen />, color: "text-sky-700",
    items: [
      { 
        id: "5.1", fr: "Taux de rétention intra-africaine des diplômés", en: "Intra-African retention of graduates", 
        desc_fr: "Proportion d'étudiants circulant au sein du continent (Brain Circulation).", desc_en: "Proportion of students circulating within the continent (Brain Circulation).",
        method_fr: "Traçabilité des diplômés s'insérant professionnellement dans une autre sous-région africaine.", method_en: "Tracking graduates entering the workforce in another African sub-region.",
        contrast_fr: "Renverse le concept euro-centré de 'Brain Drain' pour valoriser la construction d'un marché continental des cerveaux.", contrast_en: "Overturns the Euro-centric concept of 'Brain Drain' to value the construction of a continental brain market."
      },
      { 
        id: "5.2", fr: "Reconnaissance mutuelle des acquis", en: "Mutual recognition of skills", 
        desc_fr: "Avancement des cadres légaux régionaux pour la portabilité des compétences.", desc_en: "Advancement of regional legal frameworks for skills portability.",
        method_fr: "Index mesurant l'opérationnalité des accords d'équivalence universitaire et professionnelle.", method_en: "Index measuring the operability of academic and professional equivalence agreements.",
        contrast_fr: "Démontre l'autonomie académique des Suds sans avoir besoin de faire valider les savoirs par les institutions du Nord.", contrast_en: "Demonstrates the academic autonomy of the South without needing to have knowledge validated by Northern institutions."
      }
    ]
  },
  {
    theme_fr: "Protection & Justice Sociale", theme_en: "Protection & Social Justice", icon: <Scale />, color: "text-slate-700",
    items: [
      { 
        id: "6.1", fr: "Décriminalisation de l'irrégularité", en: "Decriminalization of irregularity", 
        desc_fr: "Indicateur légal : absence de sanctions pénales pour les infractions migratoires.", desc_en: "Legal indicator: absence of criminal sanctions for migratory offenses.",
        method_fr: "Analyse des codes pénaux nationaux concernant l'entrée et le séjour irrégulier.", method_en: "Analysis of national penal codes regarding irregular entry and stay.",
        contrast_fr: "Déconstruit la fiction du 'migrant illégal' en séparant le simple défaut administratif de la criminalité de droit commun.", contrast_en: "Deconstructs the fiction of the 'illegal migrant' by separating simple administrative default from common criminality."
      },
      { 
        id: "6.2", fr: "Portabilité des droits sociaux", en: "Portability of social rights", 
        desc_fr: "Capacité des travailleurs à transférer leurs droits à la retraite ou au chômage.", desc_en: "Workers' ability to transfer their pension or unemployment rights.",
        method_fr: "Nombre et effectivité des conventions bilatérales de sécurité sociale.", method_en: "Number and effectiveness of bilateral social security conventions.",
        contrast_fr: "Arrête de considérer les migrants comme une simple force de travail jetable pour les reconnaître comme des sujets de droits sociaux.", contrast_en: "Stops considering migrants as merely disposable labor force to recognize them as subjects of social rights."
      }
    ]
  }
];

// ============================================================================
// 3. COMPOSANTS DES ONGLETS
// ============================================================================

const homeCards = [
  { id: 'evidence', icon: Globe, label: { fr: 'Evidence Check', en: 'Evidence Check' },
    desc: { fr: `${evidenceCheckData.length} affirmations courantes sur les migrations confrontées aux meilleures données disponibles.`,
            en: `${evidenceCheckData.length} common migration claims tested against the best available data.` } },
  { id: 'explorer', icon: MapPin, label: { fr: 'Explorateur', en: 'Data Explorer' },
    desc: { fr: "Profils détaillés pour 54 pays africains et leurs 5 sous-régions.",
            en: "Detailed profiles for 54 African countries and their 5 sub-regions." } },
  { id: 'forced', icon: ShieldAlert, label: { fr: 'Mobilités contraintes', en: 'Forced mobility' },
    desc: { fr: "Déplacés internes, réfugiés, apatrides : la mobilité qui ne franchit aucune frontière.",
            en: "Internally displaced, refugees, stateless: the mobility that crosses no border." } },
  { id: 'governance', icon: Landmark, label: { fr: 'Gouvernance', en: 'Governance' },
    desc: { fr: "L'architecture juridique panafricaine, et ce que les États ont réellement ratifié.",
            en: "The pan-African legal architecture, and what states have actually ratified." } },
  { id: 'data', icon: BarChart3, label: { fr: 'Données & Stats', en: 'Data & Stats' },
    desc: { fr: "Où se situe réellement le déficit statistique africain — et ce qui y répond.",
            en: "Where Africa's statistical deficit actually sits — and what answers it." } },
  // {count} est substitué au rendu (libraryData est déclaré plus bas dans le module).
  { id: 'resources', icon: BookOpen, label: { fr: 'Ressources', en: 'Resources' },
    desc: { fr: "{count} sources vérifiées et un glossaire de 79 notions, définies d'abord par l'instrument africain.",
            en: "{count} verified sources and a glossary of 79 terms, defined first by the African instrument." } },
];


const TabHome = ({ text, lang, setActiveTab }) => {
  const totalCountries = Object.values(countryData).flat().length;
  const totalRegions = Object.keys(countryData).length;
  const totalEvidence = evidenceCheckData.length;
  const totalLibrary = libraryData.reduce((sum, s) => sum + s.items.length, 0);
  // Le deplacement interne : la donnee la plus massive du continent, calculee
  // en direct depuis la base pays et arrondie au million.
  const totalDisplaced = Math.round(
    Object.values(countryData).flat().reduce((n, c) => n + (Number(c.idp_conflict) || 0), 0) / 1e6
  );

  // Le premier ecran d'un nouveau venu n'affichait que des nombres nus, sous des
  // libelles de neuf pixels en gris. Chaque tuile dit maintenant ce qu'elle
  // compte, et ce qui se passe si on clique — ce sont des portes, pas un decor.
  const statTiles = [
    { value: totalCountries, unit: null,
      label: { fr: "pays d'Afrique couverts", en: 'African countries covered' },
      door: { fr: "Ouvrir l'explorateur", en: 'Open the explorer' }, tab: 'explorer' },
    { value: totalRegions, unit: null,
      label: { fr: "régions découpées par l'Union africaine", en: 'regions as defined by the African Union' },
      door: { fr: 'Voir les régions', en: 'See the regions' }, tab: 'explorer' },
    { value: totalEvidence, unit: null,
      label: { fr: "affirmations passées au crible des sources", en: 'claims checked against the sources' },
      door: { fr: 'Vérifier une affirmation', en: 'Check a claim' }, tab: 'evidence' },
    { value: totalLibrary, unit: null,
      label: { fr: "rapports et bases de données consultables", en: 'reports and datasets you can consult' },
      door: { fr: 'Ouvrir la bibliothèque', en: 'Open the library' }, tab: 'resources' },
    { value: totalDisplaced, unit: { fr: 'millions', en: 'million' },
      label: { fr: "de personnes déplacées dans leur propre pays", en: 'people displaced inside their own country' },
      door: { fr: 'Comprendre pourquoi', en: 'Understand why' }, tab: 'forced' },
  ];

  const essayWordCount = [text.home_editorial.p1, text.home_editorial.p1b, text.home_editorial.caveats, text.home_editorial.p2, text.home_editorial.p3, text.home_editorial.pullquote, text.home_editorial.p5, text.home_editorial.p4]
    .join(' ').trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.round(essayWordCount / 200));

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-10">
      <PageHeader
        badge={text.headers.home.badge}
        plate={"Pl. I"}
        plain={text.headers.home.plain}
        lang={lang}
        title={text.headers.home.title}
        highlight={text.headers.home.highlight}
        desc={text.headers.home.desc}
        icon={Globe}
      />

      {/* Releve de chiffres : une seule feuille divisee par des filets, plutot que
          quatre vignettes posees cote a cote. */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-white border border-slate-200 divide-x divide-y lg:divide-y-0 divide-slate-200 stat-ledger stagger">
          {statTiles.map((stat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(stat.tab)}
              aria-label={`${stat.value} ${stat.unit ? stat.unit[lang] + ' ' : ''}${stat.label[lang]} — ${stat.door[lang]}`}
              className="relative overflow-hidden px-5 py-6 text-left group flex flex-col"
            >
              <span
                className="absolute left-0 top-0 h-full w-[2px] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <div className="text-4xl font-serif font-bold text-slate-900 tabular-nums leading-none">
                <CountUp value={stat.value} />
                  {/* L'espace est dans le texte, pas seulement dans la marge :
                      sans lui, un copier-coller donne « 29millions ». */}
                {stat.unit && (
                  <span className="text-lg font-semibold" style={{ color: 'var(--label)' }}>
                    {' '}{stat.unit[lang]}
                  </span>
                )}
              </div>
              {/* Ce que compte le chiffre : c'est cette ligne qui porte le sens. */}
              <span className="block mt-2 text-[13px] leading-snug text-slate-700 flex-1">
                {stat.label[lang]}
              </span>
              {/* Ce que fait le clic : rien ne disait que ces tuiles menaient quelque part. */}
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-[gap]"
                    style={{ color: 'var(--accent)' }}>
                {stat.door[lang]}
                <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={60}>
        <h2 className="text-lg font-serif font-bold text-slate-800 mb-4">{lang === 'fr' ? "Explorer le Knowledge Hub" : "Explore the Knowledge Hub"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {homeCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className="hub-card lift text-left p-6 bg-white border border-slate-200 group flex flex-col h-full relative"
              >
                {/* Numerotation d'entree : la rubrique se lit comme une section d'ouvrage. */}
                <div className="flex items-baseline justify-between mb-5">
                  <span className="font-serif font-bold text-2xl leading-none tabular-nums" style={{ color: 'var(--accent-deep)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: 'var(--rule-strong)' }} />
                </div>
                <span className="block h-px w-full mb-4" style={{ backgroundColor: 'var(--rule)' }} />
                <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 leading-snug">{card.label[lang]}</h3>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{card.desc[lang].replace('{count}', totalLibrary)}</p>
                <span className="hub-card-cta flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-5">
                  {lang === 'fr' ? "Découvrir" : "Discover"} <ArrowRight className="w-3 h-3 ml-1.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={40} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            {text.home_editorial.badge}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Clock className="w-3 h-3" /> {readingMinutes} {lang === 'fr' ? "min de lecture" : "min read"}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-5">{text.home_editorial.title}</h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <p className="lede">{text.home_editorial.p1}</p>
        </div>

        <div className="max-w-4xl">
          <ProportionGap lang={lang} />
          <AspirationGap lang={lang} />
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <p>{text.home_editorial.p1b}</p>
        </div>
        <div className="max-w-4xl bg-slate-50 border border-slate-200 rounded-lg p-5 my-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed text-justify">{text.home_editorial.caveats}</p>
        </div>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <p>{text.home_editorial.p2}</p>
          <p>{text.home_editorial.p3}</p>
          <p>{text.home_editorial.p3b}</p>
          <blockquote className="border-l-4 border-amber-400 pl-5 py-1 italic text-slate-800 not-italic font-serif text-base my-2">
            {text.home_editorial.pullquote}
          </blockquote>
          <p>{text.home_editorial.p5}</p>
          <p className="font-medium text-slate-800">{text.home_editorial.p4}</p>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-100">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">{text.home_editorial.refs_title}</h4>
          <ul className="space-y-1.5">
            {text.home_editorial.refs.map((ref, idx) => (
              <li key={idx} className="text-xs text-slate-500 leading-relaxed">
                {ref.url ? (
                  <a href={ref.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 hover:underline">{ref.text}</a>
                ) : ref.text}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={40} className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 md:p-10">
        <h4 className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
          {lang === 'fr' ? "Données croisées et vérifiées à partir des sources institutionnelles suivantes" : "Data cross-checked and verified against the following institutional sources"}
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {institutionLogos.map((inst) => (
            <div key={inst.key} className="h-9 flex items-center justify-center" title={inst.full || inst.name}>
              <InstitutionLogo name={inst.name} src={inst.src} />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-8 max-w-xl mx-auto leading-relaxed">
          {lang === 'fr'
            ? "Ces institutions sont citées comme sources de données publiques ouvertes. Leur présence ne constitue ni un partenariat, ni une validation ou un endossement de South(s) Mobility DataHub."
            : "These institutions are cited as sources of open public data. Their presence does not constitute a partnership, endorsement, or validation of South(s) Mobility DataHub."}
        </p>
      </Reveal>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Evidence Check — registre + panneau de lecture.
// La grille de 70 vignettes est remplacee par un index dense (une ligne par
// affirmation) et un dossier de lecture a cote. Le verdict n'est plus un badge
// d'angle : il devient l'axe de tri, encode par une jauge de robustesse a
// quatre crans, lisible sans la couleur.
// ---------------------------------------------------------------------------

const EVIDENCE_TIERS = {
  "🟢": { rank: 4, fill: 4, color: 'var(--tier-4)', Icon: CheckCircle2 },
  "🟡": { rank: 3, fill: 3, color: 'var(--tier-3)', Icon: HelpCircle },
  "🟠": { rank: 2, fill: 2, color: 'var(--tier-2)', Icon: AlertTriangle },
  "🔴": { rank: 1, fill: 1, color: 'var(--tier-1)', Icon: XCircle },
};
const tierOf = (level) => EVIDENCE_TIERS[level] || { rank: 0, fill: 0, color: 'var(--ink-mute)', Icon: MinusCircle };

// Jauge de robustesse : quatre crans. Le nombre de crans pleins porte
// l'information, la teinte ne fait que la renforcer.
const RobustnessMeter = ({ level, className = "" }) => {
  const { fill, color } = tierOf(level);
  return (
    <span className={`inline-flex items-center gap-[2px] ${className}`} aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <span key={i} className="block w-[7px] h-[3px]"
              style={{ backgroundColor: i < fill ? color : 'var(--rule-strong)' }} />
      ))}
    </span>
  );
};

const evidenceCategoryIcons = {
  "G\u00e9ographie & Flux": Globe,
  "D\u00e9mographie": Users,
  "R\u00e9fugi\u00e9s & S\u00e9curit\u00e9": ShieldAlert,
  "Politiques & Gouvernance": Scale,
  "\u00c9conomie & Diasporas": Briefcase,
  "Climat & Environnement": Leaf,
  "Concepts & Aspirations": Brain,
  "M\u00e9thodologie & Donn\u00e9es": Database,
};

// Pastille de filtre : filet fin sur papier, encre pleine lorsqu'elle est retenue.
const FilterChip = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center px-2.5 py-1.5 text-[11px] font-semibold border transition-colors"
    style={active
      ? { backgroundColor: 'var(--ink)', color: '#FFFDF9', borderColor: 'var(--ink)', borderRadius: 2 }
      : { backgroundColor: 'transparent', color: 'var(--ink-soft)', borderColor: 'var(--rule)', borderRadius: 2 }}
  >
    {children}
  </button>
);

// Dossier d'une affirmation : citation, verdict, donnees, puis l'appareil critique.
const EvidenceDossier = ({ fiche, lang, onBack, showBack }) => {
  const t = tierOf(fiche.confidence_level);
  const VerdictIcon = t.Icon;
  const CatIcon = evidenceCategoryIcons[fiche.category.fr] || Globe;
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const isSubstantiated = fiche.confidence_level === "🟢";

  return (
    <article className="bg-white border border-slate-200 break-inside-avoid">
      {showBack && onBack && (
        <button
          onClick={onBack}
          className="lg:hidden flex items-center gap-1.5 px-6 pt-5 text-[10px] font-bold uppercase tracking-widest text-slate-500"
        >
          <ChevronRight className="w-3 h-3 rotate-180" /> {L("Retour au registre", "Back to register")}
        </button>
      )}

      <header className="px-6 md:px-8 pt-6 pb-5">
        <div className="flex items-center gap-2 mb-4">
          <CatIcon className="w-3.5 h-3.5" style={{ color: 'var(--accent-deep)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{fiche.category[lang]}</span>
        </div>

        <blockquote
          className="font-serif font-bold text-xl md:text-2xl leading-snug text-slate-900 pl-4"
          style={{ borderLeft: '2px solid var(--rule-strong)' }}
        >
          {fiche.narrative[lang]}
        </blockquote>

        <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <RobustnessMeter level={fiche.confidence_level} />
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: t.color }}>
            <VerdictIcon className="w-3.5 h-3.5" /> {fiche.verdict[lang]}
          </span>
        </div>
      </header>

      <div className="px-6 md:px-8 py-6" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
        <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-deep)' }}>
          {L("Ce que montrent les donn\u00e9es", "What data shows")}
        </h4>
        <p className="text-[15px] leading-relaxed text-slate-800">{fiche.reality[lang]}</p>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6">
        {fiche.why_persists && fiche.why_persists[lang].length > 0 && (
          <section>
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {isSubstantiated
                ? L("Pourquoi cette r\u00e9alit\u00e9 reste peu visible", "Why this reality is under-recognized")
                : L("Pourquoi ce narratif persiste", "Why this narrative persists")}
            </h4>
            <ul className="space-y-1.5">
              {fiche.why_persists[lang].map((reason, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] text-slate-600 leading-relaxed">
                  <span className="shrink-0 mt-[7px] w-1 h-1" style={{ backgroundColor: 'var(--accent)' }} />
                  {reason}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <section>
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
              <BarChart3 className="w-3 h-3" /> {L("Indicateurs crois\u00e9s", "Crossed indicators")}
            </h4>
            <ul className="space-y-1">
              {fiche.indicators[lang].map((ind, i) => (
                <li key={i} className="text-xs text-slate-700 py-1.5" style={{ borderBottom: '1px solid var(--rule)' }}>{ind}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Landmark className="w-3 h-3" /> {L("Sources", "Sources")}
            </h4>
            <ul className="space-y-1">
              {fiche.sources[lang].map((src, i) => (
                <li key={i} className="text-xs font-medium py-1.5" style={{ color: 'var(--accent-2)', borderBottom: '1px solid var(--rule)' }}>{src}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" /> {L("Limites m\u00e9thodologiques", "Methodological limits")}
          </h4>
          <p className="text-xs text-slate-500 italic leading-relaxed">{fiche.limits[lang]}</p>
        </section>
      </div>
    </article>
  );
};

const TabEvidenceCheck = ({ text, lang, exportEvidenceCSV }) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeTier, setActiveTier] = useState('All');
  const [sortMode, setSortMode] = useState('robustness');   // 'robustness' | 'theme'
  const [selectedId, setSelectedId] = useState(null);
  // Etat initial paresseux : sans cela, le premier rendu croit etre en grand
  // ecran et preselectionne une fiche — le visiteur mobile atterrirait dans un
  // dossier au lieu du registre.
  const [isWide, setIsWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  // Les 70 dossiers de la version imprimee ne sont montes que le temps de
  // l'impression : les garder en permanence coutait ~5 900 noeuds pour un
  // onglet qui n'en affiche qu'un. flushSync garantit que le DOM est a jour
  // avant que le navigateur ne capture la page.
  const [isPrinting, setIsPrinting] = useState(false);
  useEffect(() => {
    const before = () => flushSync(() => setIsPrinting(true));
    const after = () => setIsPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  // Le registre et le dossier cohabitent au-dela de 1024 px ; en deca, le
  // dossier remplace l'index (navigation maitre-detail).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const apply = () => setIsWide(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    window.addEventListener('resize', apply);
    return () => { mq.removeEventListener('change', apply); window.removeEventListener('resize', apply); };
  }, []);

  const categories = useMemo(() => [...new Set(evidenceCheckData.map(i => i.category.fr))], []);
  const categoryLabel = (key) => {
    const found = evidenceCheckData.find(i => i.category.fr === key);
    return found ? found.category[lang] : key;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidenceCheckData
      .filter(f => activeCategory === 'All' || f.category.fr === activeCategory)
      .filter(f => activeTier === 'All' || f.confidence_level === activeTier)
      .filter(f => !q
        || f.narrative[lang].toLowerCase().includes(q)
        || f.reality[lang].toLowerCase().includes(q)
        || f.category[lang].toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortMode === 'theme') {
          const c = a.category[lang].localeCompare(b.category[lang]);
          if (c !== 0) return c;
        }
        return tierOf(a.confidence_level).rank - tierOf(b.confidence_level).rank;
      });
  }, [query, activeCategory, activeTier, lang, sortMode]);

  // Sur grand ecran le panneau n'est jamais vide : la premiere entree du
  // registre filtre est ouverte d'office.
  useEffect(() => {
    if (!isWide) return;
    if (!results.some(r => r.id === selectedId)) setSelectedId(results[0]?.id ?? null);
  }, [isWide, results, selectedId]);

  const selected = results.find(r => r.id === selectedId) || null;
  const tierFilters = ["🟢", "🟡", "🟠", "🔴"];
  const tierName = (level) => {
    const sample = evidenceCheckData.find(f => f.confidence_level === level);
    return sample ? sample.verdict[lang] : level;
  };
  const L = (fr, en) => (lang === 'fr' ? fr : en);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={L('Observatoire des Narratifs', 'Narratives Observatory')}
        plate={"Pl. II"}
        plain={{"fr":"Soixante-dix affirmations qu'on entend souvent sur les migrations africaines, reprises une par une et confrontées aux sources. Chacune reçoit une note de solidité.","en":"Seventy claims commonly made about African migration, taken one by one and checked against the sources. Each is given a robustness rating."}}
        lang={lang}
        title={L('\u00c9valuation des affirmations', 'Evidence Check')}
        highlight={L('\u00e0 la lumi\u00e8re des donn\u00e9es.', 'powered by open data.')}
        desc={L(
          "Cette section \u00e9value le niveau de robustesse scientifique des affirmations publiques courantes sur les migrations. Elle ne cherche pas \u00e0 juger, mais \u00e0 objectiver le d\u00e9bat en croisant les meilleures sources institutionnelles disponibles.",
          "This section assesses the scientific robustness of common public claims regarding migrations based on the best available institutional sources."
        )}
        icon={Search}
      />

      {/* Note de provenance : les affirmations sont de l'auteur, les donnees ne le sont pas. */}
      <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          {L(
            "Les affirmations examin\u00e9es ci-dessous sont formul\u00e9es par l'auteur pour illustrer des perceptions et discours courants sur les migrations africaines. Il ne s'agit pas de citations directes issues de m\u00e9dias ou d'institutions identifi\u00e9es : seules les sections \u00ab Ce que montrent les donn\u00e9es \u00bb sont sourc\u00e9es aupr\u00e8s d'institutions v\u00e9rifiables (voir Sources).",
            "The claims examined below are formulated by the author to illustrate common perceptions and discourse about African migration. They are not direct quotes from identified media outlets or institutions: only the \"What data shows\" sections are sourced from verifiable institutions (see Sources)."
          )}
        </p>
      </div>

      {/* Barre de recherche et de tri du registre */}
      <div className="bg-white border border-slate-200 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={L('Rechercher parmi les affirmations v\u00e9rifi\u00e9es', 'Search the fact-checked claims')}
              placeholder={L("Rechercher une affirmation, une donn\u00e9e, un th\u00e8me\u2026", "Search a claim, a figure, a theme\u2026")}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border border-slate-200 focus:outline-none"
              style={{ borderRadius: 2 }}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
              {results.length}/{evidenceCheckData.length}
            </span>
            <CsvButton onClick={exportEvidenceCSV} label="CSV" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 p-3">
          {/* Robustesse : l'axe principal du registre */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mr-1">
              {L("Robustesse", "Robustness")}
            </span>
            <FilterChip active={activeTier === 'All'} onClick={() => setActiveTier('All')}>
              {L("Toutes", "All")}
            </FilterChip>
            {tierFilters.map(lv => (
              <FilterChip key={lv} active={activeTier === lv} onClick={() => setActiveTier(lv)}>
                <RobustnessMeter level={lv} className="mr-1.5" /> {tierName(lv)}
              </FilterChip>
            ))}
          </div>

          {/* Deux entrees dans le meme corpus : par robustesse ou par theme */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mr-1">
              {L("Classer par", "Sort by")}
            </span>
            <FilterChip active={sortMode === 'robustness'} onClick={() => setSortMode('robustness')}>
              {L("Robustesse", "Robustness")}
            </FilterChip>
            <FilterChip active={sortMode === 'theme'} onClick={() => setSortMode('theme')}>
              {L("Th\u00e8me", "Theme")}
            </FilterChip>
          </div>

          {/* Theme : filtre secondaire */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
              {L("Filtrer", "Filter")}
            </span>
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="text-xs font-semibold bg-transparent border border-slate-200 px-2.5 py-1.5"
              style={{ borderRadius: 2 }}
            >
              <option value="All">{L("Tous les th\u00e8mes", "All themes")}</option>
              {categories.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center">
          <Search className="w-6 h-6 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">
            {L("Aucune affirmation ne correspond \u00e0 cette recherche.", "No claim matches this search.")}
          </p>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start print:hidden">

          {/* ------- Registre ------- */}
          <div className={`lg:col-span-5 ${selected ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white border border-slate-200">
              <div className="px-4 py-2.5 border-b border-slate-200 flex items-baseline justify-between gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {L("Registre des affirmations", "Register of claims")}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 text-right">
                  {sortMode === 'theme'
                    ? L("group\u00e9 par th\u00e8me", "grouped by theme")
                    : L("class\u00e9 du moins au plus \u00e9tay\u00e9", "least to most substantiated")}
                </span>
              </div>
              <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {results.map((f, idx) => {
                  const t = tierOf(f.confidence_level);
                  const isSel = selected && selected.id === f.id;
                  const CatIcon = evidenceCategoryIcons[f.category.fr] || Globe;
                  // Ouverture d'un groupe thematique : on annonce le theme et son effectif.
                  const startsGroup = sortMode === 'theme'
                    && (idx === 0 || results[idx - 1].category.fr !== f.category.fr);
                  const groupSize = startsGroup
                    ? results.filter(r => r.category.fr === f.category.fr).length
                    : 0;
                  return (
                    <li key={f.id}>
                      {startsGroup && (
                        <div className="sticky top-0 z-10 flex items-baseline justify-between gap-3 px-4 py-2"
                             style={{ backgroundColor: 'var(--paper-sunk)', borderBottom: '1px solid var(--rule)' }}>
                          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--accent-deep)' }}>
                            <CatIcon className="w-3 h-3" /> {f.category[lang]}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums text-slate-500">{groupSize}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedId(f.id)}
                        aria-current={isSel ? 'true' : undefined}
                        className="evidence-row w-full text-left flex gap-3 px-4 py-3.5"
                        style={isSel ? { backgroundColor: 'var(--paper-sunk)' } : undefined}
                      >
                        <span className="block w-[3px] shrink-0 self-stretch" style={{ backgroundColor: t.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 mb-1.5">
                            <RobustnessMeter level={f.confidence_level} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
                              {f.category[lang]}
                            </span>
                          </span>
                          <span className="block text-[13px] leading-snug text-slate-800 font-medium">
                            {f.narrative[lang]}
                          </span>
                        </span>
                        <CatIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--rule-strong)' }} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* ------- Dossier de lecture ------- */}
          <div className={`lg:col-span-7 lg:sticky lg:top-28 ${selected ? 'block' : 'hidden lg:block'} mt-6 lg:mt-0`}>
            {selected ? (
              <EvidenceDossier fiche={selected} lang={lang} onBack={() => setSelectedId(null)} showBack />
            ) : (
              <div className="bg-white border border-slate-200 p-12 text-center">
                <BookOpen className="w-6 h-6 mx-auto mb-3 text-slate-300" />
                <p className="text-sm text-slate-500">
                  {L("S\u00e9lectionnez une affirmation dans le registre.", "Select a claim from the register.")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version imprimee : le registre filtre se deplie en dossiers successifs,
          pour que l'export PDF reste exhaustif. */}
      <div className="hidden print:block space-y-6">
        {isPrinting && results.map(f => (
          <EvidenceDossier key={f.id} fiche={f} lang={lang} onBack={null} showBack={false} />
        ))}
      </div>
    </div>
  );
};

const stcSessions = [
  { num: { fr: "1re session", en: "1st session" }, date: { fr: "16-20 nov. 2015, Addis-Abeba", en: "16-20 Nov. 2015, Addis Ababa" }, format: { fr: "Experts et Ministres", en: "Experts and Ministers" }, focus: { fr: "Installation du CTS, humanitaire, Convention de Kampala", en: "Establishing the STC, humanitarian affairs, Kampala Convention" }, outcome: { fr: "Mise en ordre procédurale : adoption du Règlement intérieur ; consolidation de la position africaine pour le Sommet humanitaire mondial et opérationnalisation du suivi de la Convention de Kampala.", en: "Procedural set-up: adoption of Rules of Procedure; consolidation of the African position for the World Humanitarian Summit and operationalization of Kampala Convention follow-up." } },
  { num: { fr: "2e session", en: "2nd session" }, date: { fr: "16-21 oct. 2017, Kigali", en: "16-21 Oct. 2017, Kigali" }, format: { fr: "Experts et Ministres", en: "Experts and Ministers" }, focus: { fr: "Libre circulation, MPFA, passeport africain", en: "Free movement, MPFA, African passport" }, outcome: { fr: "Tournant normatif : validation technique du Protocole sur la libre circulation des personnes, adoption du Cadre de politique migratoire révisé (MPFA 2018-2030) et de son plan d'action décennal.", en: "Normative turning point: technical validation of the Free Movement of Persons Protocol, adoption of the revised Migration Policy Framework (MPFA 2018-2030) and its ten-year action plan." } },
  { num: { fr: "3e session", en: "3rd session" }, date: { fr: "5-8 nov. 2019, Addis-Abeba", en: "5-8 Nov. 2019, Addis Ababa" }, format: { fr: "Experts et Ministres", en: "Experts and Ministers" }, focus: { fr: "Réfugiés (thème de l'année), architecture institutionnelle", en: "Refugees (theme of the year), institutional architecture" }, outcome: { fr: "Densification par outillage : adoption des projets de statuts de quatre agences clés (OAM, AIR, COC, Agence Humanitaire Africaine) ; validation de la position sur l'apatridie.", en: "Densification through institution-building: adoption of draft statutes for four key agencies (AMO, AIR, COC, African Humanitarian Agency); validation of the position on statelessness." } },
  { num: { fr: "4e session", en: "4th session" }, date: { fr: "23-24 mai 2022, Malabo", en: "23-24 May 2022, Malabo" }, format: { fr: "Ministérielle (Sommet extraordinaire)", en: "Ministerial (Extraordinary Summit)" }, focus: { fr: "Urgence humanitaire, climat, nutrition", en: "Humanitarian emergency, climate, nutrition" }, outcome: { fr: "Traduction politique : préparation de la Déclaration de Malabo, conversion de l'agenda politique d'urgence en mandats techniques et mécanismes de suivi post-sommet.", en: "Political translation: preparation of the Malabo Declaration, converting the emergency political agenda into technical mandates and post-summit follow-up mechanisms." } },
  { num: { fr: "5e session", en: "5th session" }, date: { fr: "10-14 nov. 2025, Addis-Abeba", en: "10-14 Nov. 2025, Addis Ababa" }, format: { fr: "Experts et Ministres", en: "Experts and Ministers" }, focus: { fr: "Retour/réadmission/réintégration, GCM, traite et trafic", en: "Return/readmission/reintegration, GCM, trafficking and smuggling" }, outcome: { fr: "Virage opérationnel. Adoption des lignes directrices continentales sur le retour et la réintégration durable, des plans d'action sur la traite et le trafic, et du plan d'action africain de mise en œuvre du GCM. Examen des rapports de l'OAM, du COC et de l'ACSRM.", en: "Operational shift: adoption of continental guidelines on return and sustainable reintegration, action plans on trafficking and smuggling, and the African action plan for implementing the GCM; review of AMO, COC, and ACSRM reports." } },
];

const pafomSessions = [
  { num: "PAFoM 1", date: { fr: "Accra, 16-18 sept. 2015", en: "Accra, 16-18 Sept. 2015" }, focus: { fr: "Mobilité intrarégionale, libre circulation, migration de travail", en: "Intra-regional mobility, free movement, labour migration" }, outcome: { fr: "Point de départ du forum comme scène continentale de coordination ; nourrit la préparation africaine du Sommet de La Valette.", en: "Starting point for the forum as a continental coordination venue; fed into African preparation for the Valletta Summit." } },
  { num: "PAFoM 2", date: { fr: "Lusaka, 4-6 mai 2016", en: "Lusaka, 4-6 May 2016" }, focus: { fr: "Facilitation des mobilités, commerce, gestion intégrée des frontières", en: "Mobility facilitation, trade, integrated border management" }, outcome: { fr: "Prolonge la dynamique d'Accra en liant explicitement mobilité, commerce et intégration régionale.", en: "Extends the Accra momentum by explicitly linking mobility, trade, and regional integration." } },
  { num: "PAFoM 3", date: { fr: "Kampala, 15-17 mai 2017", en: "Kampala, 15-17 May 2017" }, focus: { fr: "Préparation de la position africaine sur le GCM", en: "Preparing the African position on the GCM" }, outcome: { fr: "Cadre initial de discussion et de consultation africaine sur le Pacte mondial pour les migrations.", en: "Initial framework for African discussion and consultation on the Global Compact for Migration." } },
  { num: "PAFoM 4", date: { fr: "Djibouti, 19-21 nov. 2018", en: "Djibouti, 19-21 Nov. 2018" }, focus: { fr: "Libre circulation et bénéfices du régime continental", en: "Free movement and benefits of the continental regime" }, outcome: { fr: "Recentre les échanges sur les bénéfices de la libre circulation après l'adoption du Protocole de Kigali.", en: "Refocuses discussion on the benefits of free movement following the Kigali Protocol's adoption." } },
  { num: "PAFoM 5", date: { fr: "Le Caire, sept. 2019", en: "Cairo, Sept. 2019" }, focus: { fr: "Données migratoires et recherche pour des politiques fondées sur la preuve", en: "Migration data and research for evidence-based policy" }, outcome: { fr: "Déplace l'agenda vers la production de données comme condition d'une gouvernance migratoire outillée.", en: "Shifts the agenda toward data production as a precondition for well-equipped migration governance." } },
  { num: "PAFoM 6", date: { fr: "Dakar, 11-12 sept. 2021", en: "Dakar, 11-12 Sept. 2021" }, focus: { fr: "Gouvernance de la migration de travail en contexte pandémique", en: "Labour migration governance in the pandemic context" }, outcome: { fr: "Recentre le forum sur la migration de travail, la reprise socio-économique et l'intégration continentale.", en: "Refocuses the forum on labour migration, socio-economic recovery, and continental integration." } },
  { num: "PAFoM 7", date: { fr: "Kigali, 18-21 oct. 2022", en: "Kigali, 18-21 Oct. 2022" }, focus: { fr: "Changement climatique, mobilité humaine et déplacements", en: "Climate change, human mobility, and displacement" }, outcome: { fr: "Ouvre plus nettement le forum aux liens entre climat, mobilité et résilience des communautés.", en: "Opens the forum more clearly to the links between climate, mobility, and community resilience." } },
  { num: "PAFoM 8", date: { fr: "Gaborone, 31 oct. - 2 nov. 2023", en: "Gaborone, 31 Oct. - 2 Nov. 2023" }, focus: { fr: "Libre circulation, migration de travail et nexus commerce-ZLECAf", en: "Free movement, labour migration, and the AfCFTA-trade nexus" }, outcome: { fr: "Relie directement la libre circulation et la migration de travail à la mise en œuvre de la ZLECAf.", en: "Directly links free movement and labour migration to AfCFTA implementation." } },
  { num: "PAFoM 9", date: { fr: "Le Cap, 16-18 déc. 2025", en: "Cape Town, 16-18 Dec. 2025" }, focus: { fr: "Digitalisation et intégration des systèmes de gestion des frontières", en: "Digitalization and integration of border management systems" }, outcome: { fr: "Confirme la pérennité du forum avec un accent nouveau sur les frontières numériques et l'interopérabilité.", en: "Confirms the forum's continuity with a new emphasis on digital borders and interoperability." } },
];

// Panneau de contrepoint : a cote de chaque cadre mondial, l'instrument
// africain equivalent, ses dates, et les sources qui l'attestent.
// Bouton de sous-navigation : meme idiome que les onglets principaux — encre
// pleine et filet terracotta lorsqu'il est retenu, filet seul sinon.
// Fiche d'organe specialise : sigle, intitule complet, siege et acte fondateur,
// mandat, puis la source qui l'atteste.
const AuAgencyCard = ({ acronym, fullName, seat, founded, children, source, lang }) => (
  <article className="bg-white border border-slate-200 p-5 flex flex-col h-full lift">
    <div className="flex items-baseline justify-between gap-3 mb-1">
      <h5 className="font-serif font-bold text-slate-900 text-base">{acronym}</h5>
      <span className="text-[10px] font-bold tabular-nums shrink-0" style={{ color: 'var(--accent-deep)' }}>{founded}</span>
    </div>
    <span className="block text-[11px] text-slate-600 leading-snug mb-1">{fullName}</span>
    <span className="block text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-3">{seat}</span>
    <p className="text-xs text-slate-700 leading-relaxed flex-grow">{children}</p>
    {source && (
      <a href={source.url} target="_blank" rel="noopener noreferrer"
         className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest mt-4 pt-3 hover:underline"
         style={{ color: 'var(--accent-2)', borderTop: '1px solid var(--rule)' }}>
        {source.label} <ExternalLink className="w-3 h-3" />
      </a>
    )}
  </article>
);

// Le filet d'accent est pose entierement en ligne : la classe Tailwind
// border-slate-200 est reteintee avec !important dans theme.css, elle
// ecraserait sinon la couleur de l'accent.
// ---------------------------------------------------------------------------
// L'ancrage continental, calcule en direct depuis la matrice pays x instruments
// que porte la plateforme. Rien n'est saisi a la main ici : tout se recompute
// si une ratification change dans les donnees.
// ---------------------------------------------------------------------------
const ANCHOR_INSTRUMENTS = [
  { key: 'constitutive',  short: { fr: 'Acte constitutif', en: 'Constitutive Act' },
    full: { fr: "Acte constitutif de l'Union africaine (2000)", en: 'Constitutive Act of the African Union (2000)' } },
  { key: 'abuja',         short: { fr: 'Abuja', en: 'Abuja' },
    full: { fr: "Traité d'Abuja instituant la Communauté économique africaine (1991)", en: 'Abuja Treaty establishing the African Economic Community (1991)' } },
  { key: 'refugees_1969', short: { fr: 'Réfugiés 1969', en: 'Refugees 1969' },
    full: { fr: "Convention de l'OUA sur les réfugiés (1969)", en: 'OAU Refugee Convention (1969)' } },
  { key: 'zlecaf',        short: { fr: 'ZLECAf', en: 'AfCFTA' },
    full: { fr: 'Zone de libre-échange continentale africaine (2018)', en: 'African Continental Free Trade Area (2018)' } },
  { key: 'kampala',       short: { fr: 'Kampala', en: 'Kampala' },
    full: { fr: 'Convention de Kampala sur les déplacés internes (2009)', en: 'Kampala Convention on internally displaced persons (2009)' } },
  { key: 'free_movement', short: { fr: 'Libre circulation', en: 'Free movement' },
    full: { fr: 'Protocole sur la libre circulation des personnes (2018)', en: 'Protocol on Free Movement of Persons (2018)' } },
];

// Croisement gouvernance x ouverture x ancrage. Les trois coefficients sont
// recalcules en direct : si une ratification ou un score AVOI change dans la
// base, le resultat suit.
const GovernanceCross = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (c.name?.[lang] || c.name?.fr || ''));
  const [showTable, setShowTable] = useState(false);

  const d = useMemo(() => {
    const pts = Object.values(countryData).flat().map(c => {
      const rank = iiagRank[(c.iso2 || '').toLowerCase()]?.iiag;
      if (!rank || c.avoi == null || !c.au_treaties) return null;
      const anchor = ANCHOR_INSTRUMENTS.reduce((n, i) => n + (c.au_treaties[i.key] ? 1 : 0), 0);
      return { n: nm(c), iso2: c.iso2, rank, gov: 55 - rank, avoi: Number(c.avoi), anchor };
    }).filter(Boolean);

    // Spearman avec traitement des ex aequo
    const rankOf = (v) => {
      const order = [...v.keys()].sort((a, b) => v[a] - v[b]);
      const rk = new Array(v.length);
      let i = 0;
      while (i < order.length) {
        let j = i;
        while (j + 1 < order.length && v[order[j + 1]] === v[order[i]]) j++;
        const avg = (i + j) / 2 + 1;
        for (let k = i; k <= j; k++) rk[order[k]] = avg;
        i = j + 1;
      }
      return rk;
    };
    const rho = (xs, ys) => {
      const rx = rankOf(xs), ry = rankOf(ys), n = xs.length;
      const mx = rx.reduce((a, b) => a + b, 0) / n, my = ry.reduce((a, b) => a + b, 0) / n;
      let num = 0, dx = 0, dy = 0;
      for (let i = 0; i < n; i++) { num += (rx[i] - mx) * (ry[i] - my); dx += (rx[i] - mx) ** 2; dy += (ry[i] - my) ** 2; }
      return dx && dy ? num / Math.sqrt(dx * dy) : 0;
    };
    const gov = pts.map(p => p.gov), avoi = pts.map(p => p.avoi), anc = pts.map(p => p.anchor);
    const med = (v) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)];

    return {
      pts,
      rhoGovAvoi: rho(gov, avoi),
      rhoGovAnchor: rho(gov, anc),
      rhoAvoiAnchor: rho(avoi, anc),
      medGov: med(gov), medAvoi: med(avoi),
      full: pts.filter(p => p.avoi >= 90 && p.anchor >= 6),
    };
  }, [lang]);

  const fmt = (v) => {
    const t = (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(2);
    return lang === 'fr' ? t.replace('.', ',') : t;
  };
  const W = 560, H = 360, PAD = 44;
  const x = (g) => PAD + ((g - 1) / 53) * (W - PAD - 14);
  const y = (a) => H - PAD - (a / 100) * (H - PAD - 16);
  const tone = (a) => (a >= 6 ? 'var(--ok)' : a >= 5 ? 'var(--warn-ink)' : a >= 4 ? 'var(--accent)' : 'var(--bad)');

  return (
    <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--accent-2)' }}>
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
        <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--accent-2)' }}>
          {L('Croisement calculé sur les 54 pays', 'Cross-analysis computed over all 54 countries')}
        </span>
        <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
          {L("Ratifier et ouvrir n'ont aucun rapport", 'Ratifying and opening bear no relation to each other')}
        </h4>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-justify">
          {L(
            "La plateforme porte trois mesures indépendantes pour chacun des 54 États : la qualité de gouvernance mesurée par l'Indice Ibrahim, l'ouverture effective des frontières mesurée par l'indice AVOI, et le nombre d'instruments continentaux ratifiés. On peut donc tester ce que l'on suppose souvent sans le vérifier : est-ce que mieux gouverner, c'est plus ouvrir ? Et est-ce que signer, c'est ouvrir ?",
            'The platform holds three independent measures for each of the 54 states: governance quality as measured by the Ibrahim Index, effective border openness as measured by the AVOI, and the number of continental instruments ratified. That makes it possible to test what is often assumed without checking: does governing better mean opening more? And does signing mean opening?'
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger">
          {[
            { v: fmt(d.rhoGovAvoi), l: L('Gouvernance × ouverture visa', 'Governance × visa openness'),
              s: L('lien modéré, réel', 'moderate, real relationship'), tone: 'figure-ok' },
            { v: fmt(d.rhoGovAnchor), l: L('Gouvernance × ancrage', 'Governance × anchoring'),
              s: L('aucun lien', 'no relationship'), tone: 'figure-warn' },
            { v: fmt(d.rhoAvoiAnchor), l: L('Ouverture visa × ancrage', 'Visa openness × anchoring'),
              s: L('aucun lien', 'no relationship'), tone: 'figure-terra' },
          ].map((k, i) => (
            <div key={i} className="border border-slate-200 p-4 lift">
              <div className={`text-2xl font-serif font-bold tabular-nums leading-none ${k.tone}`}>{k.v}</div>
              <span className="block text-[11px] font-bold uppercase tracking-widest mt-2 leading-snug" style={{ color: 'var(--label)' }}>{k.l}</span>
              <span className="block text-[11px] mt-1" style={{ color: 'var(--label)' }}>{k.s}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px]" style={{ color: 'var(--label)' }}>
          {L(
            "Corrélations de rang de Spearman, ex aequo traités par rang moyen. Un coefficient proche de zéro signifie que connaître l'une des deux mesures n'apprend rien sur l'autre.",
            'Spearman rank correlations, ties handled by average rank. A coefficient close to zero means that knowing one measure tells you nothing about the other.'
          )}
        </p>

        {/* Nuage de points : gouvernance en abscisse, ouverture en ordonnee,
            ancrage porte par la teinte. */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
              {L('Chaque point est un État', 'Each dot is a state')}
            </span>
            <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]" style={{ color: 'var(--label)' }}>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ backgroundColor: 'var(--ok)' }} />6/6</span>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ backgroundColor: 'var(--warn-ink)' }} />5/6</span>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ backgroundColor: 'var(--accent)' }} />4/6</span>
              <span className="inline-flex items-center gap-1.5"><span className="dot" style={{ backgroundColor: 'var(--bad)' }} />&lt; 4/6</span>
            </span>
          </div>
          <div className="overflow-x-auto border border-slate-200 p-2" style={{ backgroundColor: 'var(--paper-raised)' }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ minWidth: 460 }} role="img"
                 aria-label={L('Nuage de points croisant gouvernance et ouverture visa', 'Scatter plot crossing governance and visa openness')}>
              {/* medianes */}
              <line x1={x(d.medGov)} y1={16} x2={x(d.medGov)} y2={H - PAD} stroke="var(--rule-strong)" strokeDasharray="3 3" />
              <line x1={PAD} y1={y(d.medAvoi)} x2={W - 14} y2={y(d.medAvoi)} stroke="var(--rule-strong)" strokeDasharray="3 3" />
              {/* axes */}
              <line x1={PAD} y1={H - PAD} x2={W - 14} y2={H - PAD} stroke="var(--rule-strong)" />
              <line x1={PAD} y1={16} x2={PAD} y2={H - PAD} stroke="var(--rule-strong)" />
              {[0, 25, 50, 75, 100].map(v => (
                <g key={v}>
                  <text x={PAD - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--label)">{v}</text>
                  <line x1={PAD - 3} y1={y(v)} x2={PAD} y2={y(v)} stroke="var(--rule-strong)" />
                </g>
              ))}
              <text x={PAD} y={H - 12} fontSize="9" fill="var(--label)">
                {L('gouvernance : rang 54 (moins bon)', 'governance: rank 54 (worst)')}
              </text>
              <text x={W - 14} y={H - 12} textAnchor="end" fontSize="9" fill="var(--label)">
                {L('rang 1 (meilleur)', 'rank 1 (best)')}
              </text>
              <text x={10} y={26} fontSize="9" fill="var(--label)">{L('AVOI', 'AVOI')}</text>
              {d.pts.map(p => (
                <circle key={p.iso2 || p.n} cx={x(p.gov)} cy={y(p.avoi)} r="5"
                        fill={tone(p.anchor)} fillOpacity=".75" stroke="var(--paper-raised)" strokeWidth="1.2">
                  <title>{`${p.n} — ${L('gouvernance', 'governance')} ${p.rank}/54, AVOI ${p.avoi}, ${L('ancrage', 'anchoring')} ${p.anchor}/6`}</title>
                </circle>
              ))}
            </svg>
          </div>
          <button onClick={() => setShowTable(v => !v)}
                  className="mt-2 text-[11px] font-bold uppercase tracking-widest px-2.5 py-1.5 border"
                  style={{ color: 'var(--ink-soft)', borderColor: 'var(--rule)' }}>
            {showTable ? L('Masquer le tableau', 'Hide the table') : L('Voir les données en tableau', 'View the data as a table')}
          </button>
          {showTable && (
            <div className="overflow-x-auto border border-slate-200 mt-2">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: 'var(--paper-sunk)' }}>
                    <th className="text-left font-semibold px-3 py-2 text-slate-700">{L('Pays', 'Country')}</th>
                    <th className="px-2 py-2 font-semibold text-slate-700 text-right">{L('Gouvernance', 'Governance')}</th>
                    <th className="px-2 py-2 font-semibold text-slate-700 text-right">AVOI</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">{L('Ancrage', 'Anchoring')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...d.pts].sort((a, b) => a.rank - b.rank).map(p => (
                    <tr key={p.iso2 || p.n} className="figure-row">
                      <td className="px-3 py-1.5 text-slate-800 whitespace-nowrap">{p.n}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{p.rank}/54</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{p.avoi}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-bold" style={{ color: tone(p.anchor) }}>{p.anchor}/6</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
          <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L('Ce que les trois coefficients disent ensemble', 'What the three coefficients say together')}
          </h4>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
            {L(
              `Mieux gouverner va bien avec plus ouvrir : le lien existe, modéré mais net. En revanche, la qualité de gouvernance ne dit rien de l'ancrage juridique, et — résultat le plus net — l'ouverture effective des frontières ne dit rien des ratifications, ni l'inverse. Autrement dit : les États qui ouvrent ne sont pas ceux qui signent. Le Rwanda est le seul à faire les deux pleinement. Les Seychelles ouvrent totalement tout en n'ayant ratifié que quatre instruments sur six ; le Botswana et le Lesotho sont bien gouvernés et fermés ; le Burundi et le Mozambique ouvrent largement avec une gouvernance mal classée. L'ouverture n'est donc ni un effet de la capacité administrative, ni la conséquence d'un engagement juridique : c'est une décision souveraine, prise instrument par instrument et frontière par frontière. C'est exactement ce que décrit l'entre-deux national (Ben Mokhtar, 2026).`,
              `Governing better does go with opening more: the relationship exists, moderate but clear. Governance quality, however, says nothing about legal anchoring — and, the sharpest result, effective border openness says nothing about ratifications, nor the reverse. In other words: the states that open are not the states that sign. Rwanda alone does both fully. Seychelles opens completely while having ratified only four instruments out of six; Botswana and Lesotho are well governed and closed; Burundi and Mozambique open widely with poorly ranked governance. Openness is therefore neither a product of administrative capacity nor a consequence of legal commitment: it is a sovereign decision, taken instrument by instrument and border by border. That is precisely what the national in-between describes (Ben Mokhtar, 2026).`
            )}
          </p>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }}>
            {L(
              "Une corrélation de rang ne dit rien d'une causalité, et l'IIAG comme l'AVOI sont des indices composites dont la construction porte ses propres choix. Le résultat qui compte ici est négatif — l'absence de lien — et c'est le type de résultat le plus robuste à ces réserves.",
              'A rank correlation says nothing about causation, and both the IIAG and the AVOI are composite indices whose construction carries its own choices. The result that matters here is a negative one — the absence of a relationship — and that is the kind of result most robust to those caveats.'
            )}
          </p>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-5">
        <Sources lang={lang} items={[
          { label: IIAG_SOURCE.label[lang], url: IIAG_SOURCE.url },
          { label: L('BAD & CUA — Indice d\'ouverture des visas (AVOI)', 'AfDB & AUC — Africa Visa Openness Index (AVOI)'),
            url: 'https://www.visaopenness.org/' },
        ]} />
      </div>
    </section>
  );
};

const AnchoringMatrix = ({ lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const [sortBy, setSortBy] = useState('score');

  const rows = useMemo(() => {
    const all = Object.values(countryData).flat().filter(c => c.au_treaties);
    return all.map(c => ({
      // c.name est bilingue : on retient le libelle de la langue courante.
      name: typeof c.name === 'string' ? c.name : (c.name?.[lang] || c.name?.fr || ''),
      iso2: c.iso2,
      t: c.au_treaties,
      score: ANCHOR_INSTRUMENTS.reduce((n, i) => n + (c.au_treaties[i.key] ? 1 : 0), 0),
    }));
  }, [lang]);

  const totals = useMemo(
    () => ANCHOR_INSTRUMENTS.map(i => ({ ...i, n: rows.filter(r => r.t[i.key]).length })),
    [rows]
  );

  // L'asymetrie de protection : le refugie qui arrive contre le deplace qui reste.
  const asym = useMemo(() => ({
    refOnly: rows.filter(r => r.t.refugees_1969 && !r.t.kampala),
    kampOnly: rows.filter(r => r.t.kampala && !r.t.refugees_1969),
    both: rows.filter(r => r.t.kampala && r.t.refugees_1969).length,
  }), [rows]);

  const sorted = useMemo(() => {
    const c = [...rows];
    return sortBy === 'score'
      ? c.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      : c.sort((a, b) => a.name.localeCompare(b.name));
  }, [rows, sortBy]);

  const total = rows.length;

  // L'export se fait ici : le composant porte deja la matrice complete.
  const exportMatrix = () => {
    downloadCSV('souths_ancrage_continental.csv', toCSV(rows.map(r => {
      const line = { pays: r.name, iso2: r.iso2 || '' };
      ANCHOR_INSTRUMENTS.forEach(i => { line[i.key] = r.t[i.key] ? 1 : 0; });
      line.score_sur_6 = r.score;
      return line;
    })));
  };

  return (
    <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--accent)' }}>
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
        <span className="block text-[10px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--accent-deep)' }}>
          {L('Calculé depuis la base de la plateforme', 'Computed from the platform database')}
        </span>
        <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
          {L("L'ancrage : ce que les États ont réellement ratifié",
             'Anchoring: what states have actually ratified')}
        </h4>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
        <p className="text-justify">
          {L(
            "Adhérer à l'Union est une chose, s'engager sur la mobilité des personnes en est une autre. En rangeant les six instruments continentaux du plus consensuel au plus contraignant, on obtient une courbe de décrochage : l'appartenance est unanime, la libre circulation ne l'est presque pas.",
            'Joining the Union is one thing; committing on the mobility of persons is another. Ordering the six continental instruments from the most consensual to the most binding produces a curve of attrition: membership is unanimous, free movement almost non-existent.'
          )}
        </p>

        {/* Courbe de decrochage */}
        <div className="space-y-2.5">
          {totals.map((i, idx) => (
            <div key={i.key} className="flex items-center gap-3">
              <span className="text-[11px] font-semibold w-40 shrink-0 leading-snug text-slate-700">{i.short[lang]}</span>
              <div className="flex-1 h-5 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                <div
                  className={`h-full bar-fill bar-fill--d${Math.min(5, idx + 1)}`}
                  style={{
                    width: `${(i.n / total) * 100}%`,
                    backgroundColor: i.n >= 46 ? 'var(--ok)' : i.n >= 30 ? 'var(--warn)' : 'var(--bad)',
                  }}
                />
              </div>
              <span className="text-xs font-bold w-16 text-right shrink-0 tabular-nums text-slate-800">
                {i.n}/{total}
              </span>
            </div>
          ))}
        </div>

        {/* L'asymetrie de protection */}
        <div className="p-5" style={{ backgroundColor: 'var(--bad-soft)', borderLeft: '2px solid var(--bad)' }}>
          <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--bad)' }}>
            {L('Une asymétrie que personne ne compte', 'An asymmetry nobody counts')}
          </h4>
          <p className="text-[13px] leading-relaxed text-justify" style={{ color: 'var(--ink-soft)' }}>
            {L(
              `${asym.refOnly.length} États ont ratifié la Convention de l'OUA de 1969 — celle qui protège le réfugié venu d'ailleurs — sans ratifier la Convention de Kampala, celle qui protège leur propre population déplacée à l'intérieur des frontières. L'inverse ne se produit que dans ${asym.kampOnly.length} cas. La protection s'arrête donc plus souvent à la frontière qu'elle ne la franchit — alors que le déplacement interne est, en Afrique, la forme de mobilité forcée la plus massive (Ben Mokhtar, 2026).`,
              `${asym.refOnly.length} states have ratified the 1969 OAU Convention — which protects the refugee arriving from elsewhere — without ratifying the Kampala Convention, which protects their own population displaced inside their borders. The reverse occurs in only ${asym.kampOnly.length} cases. Protection therefore stops at the border more often than it crosses it — while internal displacement is, in Africa, the most massive form of forced mobility (Ben Mokhtar, 2026).`
            )}
          </p>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
            <span className="font-bold uppercase tracking-widest">{L('Concernés :', 'Concerned:')}</span>{' '}
            {asym.refOnly.map(r => r.name).join(', ')}.
          </p>
        </div>

        {/* Matrice pays x instruments */}
        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
              {L('Matrice des ratifications — 54 pays × 6 instruments', 'Ratification matrix — 54 countries × 6 instruments')}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setSortBy('score')}
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border"
                      style={sortBy === 'score'
                        ? { backgroundColor: 'var(--ink)', color: '#FFFDF9', borderColor: 'var(--ink)' }
                        : { color: 'var(--ink-soft)', borderColor: 'var(--rule)' }}>
                {L('Par ancrage', 'By anchoring')}
              </button>
              <button onClick={() => setSortBy('name')}
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 border"
                      style={sortBy === 'name'
                        ? { backgroundColor: 'var(--ink)', color: '#FFFDF9', borderColor: 'var(--ink)' }
                        : { color: 'var(--ink-soft)', borderColor: 'var(--rule)' }}>
                {L('A → Z', 'A → Z')}
              </button>
              <CsvButton onClick={exportMatrix} label={L('Matrice (CSV)', 'Matrix (CSV)')} />
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <th className="text-left font-semibold px-3 py-2 text-slate-700 whitespace-nowrap">{L('Pays', 'Country')}</th>
                  {ANCHOR_INSTRUMENTS.map(i => (
                    <th key={i.key} className="px-2 py-2 font-semibold text-slate-700 text-center whitespace-nowrap"
                        title={i.full[lang]}>
                      {i.short[lang]}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold text-slate-700 text-right whitespace-nowrap">{L('Score', 'Score')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map(r => (
                  <tr key={r.iso2 || r.name} className="figure-row">
                    <td className="px-3 py-1.5 text-slate-800 whitespace-nowrap">{r.name}</td>
                    {ANCHOR_INSTRUMENTS.map(i => (
                      <td key={i.key} className="px-2 py-1.5 text-center">
                        <span className="dot mx-auto"
                              style={{ backgroundColor: r.t[i.key] ? 'var(--ok)' : 'var(--rule-strong)' }}
                              title={`${i.full[lang]} — ${r.t[i.key] ? L('ratifié', 'ratified') : L('non ratifié', 'not ratified')}`} />
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right font-bold tabular-nums"
                        style={{ color: r.score >= 5 ? 'var(--ok)' : r.score >= 4 ? 'var(--warn-ink)' : 'var(--bad)' }}>
                      {r.score}/6
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 py-4" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
        <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
          {L('Provenance et réserve', 'Provenance and caveat')}
        </h4>
        <p className="text-[11px] leading-relaxed text-slate-600 text-justify">
          {L(
            "Matrice constituée par l'auteur d'après les listes de ratification de l'Union africaine. La colonne ZLECAf a été reprise en août 2026 sur la liste nominative de tralac et de l'UA : 49 signataires ont déposé leur instrument. Les six restants sont l'Érythrée, non signataire ; le Bénin, la Libye, le Soudan et le Soudan du Sud, dont la ratification n'est pas approuvée ; et la Somalie, qui a approuvé sans déposer. Le Liberia et Madagascar, marqués non-ratifiants à tort, ont été corrigés. La colonne Kampala a été reprise sur la liste de statut officielle de l'UA arrêtée au 8 juillet 2024, qui donne 33 ratifications et 33 dépôts : Sao Tomé-et-Principe, marqué non-ratifiant à tort, a été corrigé, et la matrice concorde désormais exactement avec l'UA. Subsiste un écart d'une unité sur la ZLECAf entre le décompte de la matrice (48) et le chiffre publié (49), lié à la façon dont sont comptés signataires et États membres. Les valeurs divergentes sont affichées plutôt qu'harmonisées de force.",
            "Matrix compiled by the author from African Union ratification lists. The AfCFTA column was revised in August 2026 against the named list from tralac and the AU: 49 signatories have deposited their instrument, the six outstanding being Eritrea (not a signatory), Benin, Libya, Sudan and South Sudan (ratification not approved) and Somalia (approved, not deposited). Liberia and Madagascar, wrongly marked as non-ratifiers, have been corrected. The Kampala column was revised against the AU's official status list as at 8 July 2024, which records 33 ratifications and 33 deposits: Sao Tome and Principe, wrongly marked as a non-ratifier, has been corrected, and the matrix now matches the AU exactly. A one-unit gap remains on the AfCFTA between the matrix count (48) and the published figure (49), tied to how signatories and member states are counted. Divergent values are shown rather than forcibly reconciled."
          )}
        </p>
      </div>
    </section>
  );
};

const AfricanCounterpoint = ({ kicker, title, lang, sources = [], accent = 'var(--accent-deep)', children }) => (
  <section
    className="bg-white"
    style={{
      borderStyle: 'solid',
      borderColor: 'var(--rule)',
      borderWidth: '1px',
      borderTopWidth: '2px',
      borderTopColor: accent,
    }}
  >
    <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
      <span className="block text-[10px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: accent }}>
        {kicker}
      </span>
      <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">{title}</h4>
    </div>
    <div className="px-6 md:px-8 py-6 space-y-5 text-sm text-slate-700 leading-relaxed">
      {children}
      <Sources items={sources} lang={lang} />
    </div>
  </section>
);

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------
// Huit blocs de sources ecrits a la main, chacun en bande teintee de 80 a 145 px,
// donnaient au site cet air d'encadres poses un peu partout. La provenance doit
// rester — un chiffre sans sa source ne vaut rien — mais elle se lit comme une
// legende, pas comme un avertissement. Un seul composant, compact : les sources
// tiennent sur une ligne, et se deplient quand elles sont nombreuses.
const Sources = ({ items = [], lang = 'fr', note = null }) => {
  const [ouvert, setOuvert] = useState(false);
  if (!items.length && !note) return null;
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const long = items.length > 2;
  const vus = long && !ouvert ? items.slice(0, 1) : items;

  return (
    <p className="provenance">
      <span className="provenance-lbl">{L(items.length > 1 ? 'Sources' : 'Source', items.length > 1 ? 'Sources' : 'Source')}</span>
      {vus.map((s, i) => (
        <span key={i} className="provenance-item">
          {s.url ? (
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}<ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          ) : <span>{s.label}</span>}
        </span>
      ))}
      {long && (
        <button type="button" className="provenance-plus" aria-expanded={ouvert}
                onClick={() => setOuvert(o => !o)}>
          {ouvert ? L('replier', 'collapse') : L(`+ ${items.length - 1} autres`, `+${items.length - 1} more`)}
        </button>
      )}
      {note && <span className="provenance-note">{note}</span>}
    </p>
  );
};

// Repere date/fait : une ligne de chronologie compacte dans un contrepoint.
const CounterpointFacts = ({ items }) => (
  <ul className="divide-y divide-slate-100 border-y border-slate-100">
    {items.map((it, i) => (
      <li key={i} className="flex gap-4 py-2.5">
        <span className="w-28 shrink-0 text-[11px] font-bold uppercase tracking-wide tabular-nums" style={{ color: 'var(--accent-deep)' }}>
          {it.when}
        </span>
        <span className="text-[13px] text-slate-700 leading-snug">{it.what}</span>
      </li>
    ))}
  </ul>
);

// ---------------------------------------------------------------------------
// Mobilites contraintes. Tout ce qui est chiffre ici est calcule en direct
// depuis la base pays de la plateforme : aucun total n'est saisi a la main.
// ---------------------------------------------------------------------------
const TabForced = ({ text, lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (c.name?.[lang] || c.name?.fr || ''));

  const data = useMemo(() => {
    const all = Object.values(countryData).flat();
    const conflict = all.filter(c => Number(c.idp_conflict) > 0)
      .map(c => ({ n: nm(c), v: Number(c.idp_conflict) })).sort((a, b) => b.v - a.v);
    const disaster = all.filter(c => Number(c.idp_disaster) > 0)
      .map(c => ({ n: nm(c), v: Number(c.idp_disaster) })).sort((a, b) => b.v - a.v);
    // Base HCR : couverture complete, la ou le champ interne n'etait renseigne
    // que pour une poignee de pays d'accueil.
    const un = (iso2, year, key) => Number(unhcrByCountry[(iso2 || '').toLowerCase()]?.[year]?.[key] || 0);
    const refugees = all.map(c => ({ n: nm(c), v: un(c.iso2, '2024', 'refugees') }))
      .filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    const stateless = all.map(c => ({ n: nm(c), v: un(c.iso2, '2024', 'stateless') }))
      .filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    const asylum = all.map(c => ({ n: nm(c), v: un(c.iso2, '2024', 'asylum') }))
      .filter(x => x.v > 0).sort((a, b) => b.v - a.v);
    const t = arr => arr.reduce((n, x) => n + x.v, 0);
    // L'asymetrie de protection, recalculee ici pour rester autonome.
    const withT = all.filter(c => c.au_treaties);
    const refOnly = withT.filter(c => c.au_treaties.refugees_1969 && !c.au_treaties.kampala).map(nm);
    return {
      conflict, disaster, refugees, stateless, asylum,
      totalConflict: t(conflict), totalDisaster: t(disaster), totalRefugees: t(refugees),
      totalStateless: t(stateless), totalAsylum: t(asylum),
      refOnly,
      kampalaRatified: withT.filter(c => c.au_treaties.kampala).length,
      total: withT.length,
    };
  }, [lang]);

  // Un seul chemin pour tous les nombres du site : separateur normalise inclus.
  const fmt = (v) => formatNumber(v, lang);

  const exportCSV = () => {
    const all = Object.values(countryData).flat();
    downloadCSV('souths_mobilites_contraintes.csv', toCSV(all.map(c => ({
      pays: nm(c), iso2: c.iso2 || '',
      deplaces_conflit: Number(c.idp_conflict) || 0,
      deplaces_catastrophes: Number(c.idp_disaster) || 0,
      refugies_accueillis: Number(c.refugees_hosted) || 0,
      hcr_refugies_2024: Number(unhcrByCountry[(c.iso2 || '').toLowerCase()]?.['2024']?.refugees || 0),
      hcr_demandeurs_asile_2024: Number(unhcrByCountry[(c.iso2 || '').toLowerCase()]?.['2024']?.asylum || 0),
      hcr_apatrides_2024: Number(unhcrByCountry[(c.iso2 || '').toLowerCase()]?.['2024']?.stateless || 0),
      hcr_deplaces_internes_2024: Number(unhcrByCountry[(c.iso2 || '').toLowerCase()]?.['2024']?.idps || 0),
      convention_oua_1969: c.au_treaties?.refugees_1969 ? 1 : 0,
      convention_kampala_2009: c.au_treaties?.kampala ? 1 : 0,
    }))));
  };

  // Barres de classement, echelle commune, teinte unique par jeu.
  const Ranking = ({ rows, color, unitTotal, note }) => {
    const max = rows[0]?.v || 1;
    return (
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={r.n} className="flex items-center gap-3 figure-row px-1 py-0.5">
            <span className="text-[11px] font-medium w-36 shrink-0 truncate text-slate-700">{r.n}</span>
            <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
              <div className={`h-full bar-fill bar-fill--d${Math.min(5, i + 1)}`}
                   style={{ width: `${(r.v / max) * 100}%`, backgroundColor: color }} />
            </div>
            <span className="text-xs font-bold w-24 text-right shrink-0 tabular-nums text-slate-800">{fmt(r.v)}</span>
            {unitTotal ? (
              <span className="text-[10px] w-12 text-right shrink-0 tabular-nums" style={{ color: 'var(--label)' }}>
                {Math.round((r.v / unitTotal) * 100)} %
              </span>
            ) : null}
          </div>
        ))}
        {note && <p className="text-[10px] italic mt-2" style={{ color: 'var(--label)' }}>{note}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.forced.badge}
        plate={"Pl. IV"}
        plain={text.headers.forced.plain}
        lang={lang}
        title={text.headers.forced.title}
        highlight={text.headers.forced.highlight}
        desc={text.headers.forced.desc}
        icon={ShieldAlert}
      />

      <div className="flex justify-end print:hidden">
        <CsvButton onClick={exportCSV} label={L('Mobilités contraintes (CSV)', 'Forced mobility (CSV)')} />
      </div>

      {/* Releve de tete */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 divide-x divide-y md:divide-y-0 divide-slate-200 stagger">
          {[
            { v: fmt(data.totalConflict), l: L('Déplacés par un conflit', 'Displaced by conflict'), s: L(`dans ${data.conflict.length} pays`, `across ${data.conflict.length} countries`), tone: 'figure-warn' },
            { v: fmt(data.totalDisaster), l: L('Déplacés par une catastrophe', 'Displaced by disaster'), s: L(`dans ${data.disaster.length} pays`, `across ${data.disaster.length} countries`), tone: 'figure-inkblue' },
            { v: `${data.kampalaRatified}/${data.total}`, l: L('Ont ratifié Kampala', 'Have ratified Kampala'), s: L('le seul traité contraignant au monde', 'the world\'s only binding treaty'), tone: 'figure-ok' },
            { v: `${data.refOnly.length}`, l: L('Protègent le réfugié, pas le déplacé', 'Protect the refugee, not the displaced'), s: L('ratifient 1969 sans Kampala', 'ratify 1969 without Kampala'), tone: 'figure-terra' },
          ].map((k, i) => (
            <div key={i} className="px-5 py-6">
              <div className={`text-2xl md:text-3xl font-serif font-bold tabular-nums leading-none ${k.tone}`}>{k.v}</div>
              <span className="block text-[10px] font-bold uppercase tracking-widest mt-2.5 leading-snug" style={{ color: 'var(--label)' }}>{k.l}</span>
              <span className="block text-[10px] mt-1" style={{ color: 'var(--label)' }}>{k.s}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Le continent d'abord : la masse du deplacement interne se voit d'un
          coup d'oeil, la ou une liste de chiffres demande un effort. */}
      <Reveal delay={15}>
        <CarteSection
          lang={lang}
          indicateur={CARTE_DEPLACES}
          kicker={L('Où sont les déplacés', 'Where the displaced are')}
          titre={L("Le déplacement se concentre, il ne se répartit pas",
                   'Displacement concentrates; it does not spread evenly')}
          plain={{
            fr: "Chaque pays est teinté selon le nombre de personnes chassées de chez elles par un conflit mais restées dans leur propre pays. Quelques États en portent la plus grande part.",
            en: 'Each country is shaded by the number of people driven from their homes by conflict but still inside their own country. A handful of states carry most of it.',
          }}
          sources={[{ label: L('IDMC — Global Internal Displacement Database', 'IDMC — Global Internal Displacement Database'),
                      url: 'https://www.internal-displacement.org/database/displacement-data/' }]}
        />
      </Reveal>

      {/* Le cadrage */}
      <Reveal delay={20} className="bg-white border border-slate-200 p-8 md:p-10">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-4">
          {L("Trois populations, trois régimes — et un seul est africain d'origine",
             'Three populations, three regimes — and only one is African in origin')}
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <p className="lede">
            {L(
              "Parler de « migration » pour désigner l'ensemble des mobilités africaines efface la distinction qui compte le plus juridiquement : celle entre la personne qui choisit de partir et celle qui est contrainte de le faire. Or, parmi les contraintes, le droit distingue encore selon qu'une frontière internationale a été franchie ou non — et cette frontière décide de tout : du statut, de l'institution compétente, du financement, et même de la visibilité statistique.",
              'Speaking of "migration" for all African mobility erases the distinction that matters most in law: between the person who chooses to leave and the person compelled to. And among the compelled, law still distinguishes according to whether an international border was crossed — and that border decides everything: status, competent institution, funding, and even statistical visibility.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 stagger">
          {[
            {
              t: L('Réfugié', 'Refugee'), inst: L("Convention de l'OUA (1969)", 'OAU Convention (1969)'),
              accent: 'var(--ok)', wash: 'wash-ok',
              d: L("A franchi une frontière internationale. La définition africaine, antérieure d'un demi-siècle au Pacte mondial, protège au-delà de la persécution individuelle : elle couvre quiconque fuit une agression extérieure, une occupation, une domination étrangère ou des événements troublant gravement l'ordre public.",
                   'Has crossed an international border. The African definition, half a century older than the Global Compact, protects beyond individual persecution: it covers anyone fleeing external aggression, occupation, foreign domination or events seriously disturbing public order.'),
            },
            {
              t: L('Personne déplacée interne', 'Internally displaced person'), inst: L('Convention de Kampala (2009)', 'Kampala Convention (2009)'),
              accent: 'var(--warn-ink)', wash: 'wash-warn',
              d: L("N'a franchi aucune frontière : elle relève entièrement de son propre État, celui-là même qui l'a souvent déplacée. Kampala est le premier — et toujours le seul — traité régional contraignant au monde sur cette population. C'est la forme de mobilité forcée la plus massive du continent, et la moins visible dans les statistiques migratoires.",
                   'Has crossed no border: they fall entirely under their own state — often the very state that displaced them. Kampala is the first, and still the only, binding regional treaty in the world on this population. It is the continent\'s most massive form of forced mobility, and the least visible in migration statistics.'),
            },
            {
              t: L('Apatride', 'Stateless person'), inst: L('Convention de 1954 ; Déclaration d\'Abidjan (2015)', '1954 Convention; Abidjan Declaration (2015)'),
              accent: 'var(--bad)', wash: 'wash-terra',
              d: L("N'est reconnu comme ressortissant par aucun État. L'apatridie est une condition, distincte du déplacement, qui prive de l'accès aux droits, aux documents de voyage et souvent à la mobilité régulière elle-même. Elle se transmet et se reproduit d'une génération à l'autre.",
                   'Recognised as a national by no state. Statelessness is a condition, distinct from displacement, that denies access to rights, travel documents and often regular mobility itself. It is transmitted and reproduced across generations.'),
            },
          ].map((p, i) => (
            <article key={i} className="border border-slate-200 bg-white lift">
              <div className={`px-4 py-2.5 ${p.wash}`}>
                <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink)' }}>
                  <span className="dot" style={{ backgroundColor: p.accent }} />
                  {p.t}
                </span>
              </div>
              <div className="px-4 py-4">
                <h4 className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: p.accent }}>{p.inst}</h4>
                <p className="text-xs text-slate-600 leading-relaxed text-justify">{p.d}</p>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      {/* Classements */}
      <Reveal delay={30} className="bg-white border border-slate-200 p-8 md:p-10">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-2">
          {L('Où se concentre le déplacement', 'Where displacement concentrates')}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed max-w-4xl mb-6">
          {L(
            "Calculé sur la base pays de la plateforme. Le déplacement interne lié aux conflits est extrêmement concentré : une poignée d'États porte l'essentiel du total continental.",
            'Computed from the platform country base. Conflict-related internal displacement is extremely concentrated: a handful of states carries most of the continental total.'
          )}
        </p>

        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--warn-ink)' }}>
          {L('Déplacés internes par un conflit', 'Internally displaced by conflict')}
        </h3>
        <Ranking rows={data.conflict.slice(0, 10)} color="var(--warn-ink)" unitTotal={data.totalConflict} />

        <h3 className="text-[10px] font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--accent-2)' }}>
          {L('Déplacés internes par une catastrophe', 'Internally displaced by disaster')}
        </h3>
        <Ranking rows={data.disaster.slice(0, 8)} color="var(--accent-2)" unitTotal={data.totalDisaster} />

        <h3 className="text-[10px] font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--ok)' }}>
          {L('Réfugiés accueillis (HCR, 2024)', 'Refugees hosted (UNHCR, 2024)')}
        </h3>
        <Ranking
          rows={data.refugees.slice(0, 10)}
          color="var(--ok)"
          unitTotal={data.totalRefugees}
          note={L(
            `Couverture complète du HCR : ${data.refugees.length} pays du périmètre accueillent des réfugiés sous mandat, pour un total de ${fmt(data.totalRefugees)} personnes.`,
            `Full UNHCR coverage: ${data.refugees.length} countries in the perimeter host refugees under mandate, totalling ${fmt(data.totalRefugees)} people.`
          )}
        />

        <h3 className="text-[10px] font-bold uppercase tracking-widest mt-8 mb-3" style={{ color: 'var(--bad)' }}>
          {L('Apatrides recensés (HCR, 2024)', 'Recorded stateless persons (UNHCR, 2024)')}
        </h3>
        <Ranking
          rows={data.stateless}
          color="var(--bad)"
          unitTotal={data.totalStateless}
          note={L(
            "L'apatridie recensée sur le continent est écrasée par un seul pays. Ce n'est pas une anomalie statistique : la Côte d'Ivoire concentre l'héritage des migrations de main-d'œuvre coloniales et post-coloniales dont les descendants n'ont jamais obtenu de nationalité. Ailleurs, l'apatridie est probablement sous-recensée plutôt qu'absente — elle ne se compte que là où un État accepte de la mesurer.",
            "Recorded statelessness on the continent is dominated by a single country. This is not a statistical anomaly: Côte d'Ivoire concentrates the legacy of colonial and post-colonial labour migrations whose descendants never obtained nationality. Elsewhere statelessness is likely under-recorded rather than absent — it is only counted where a state agrees to measure it."
          )}
        />

        {/* Ce qu'un etat instantane masquait : la pente sur dix ans. */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--rule)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            {L('Une décennie de bascule (HCR, 2014 → 2024)', 'A decade of shift (UNHCR, 2014 → 2024)')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {L('Périmètre : les pays africains couverts par la base du HCR.', 'Perimeter: the African countries covered by the UNHCR base.')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger">
            {[
              { k: 'idps', l: L('Déplacés internes suivis', 'IDPs monitored'), tone: 'figure-warn' },
              { k: 'refugees', l: L('Réfugiés accueillis', 'Refugees hosted'), tone: 'figure-ok' },
              { k: 'asylum', l: L("Demandeurs d'asile", 'Asylum seekers'), tone: 'figure-inkblue' },
              { k: 'stateless', l: L('Apatrides recensés', 'Recorded stateless'), tone: 'figure-terra' },
            ].map(x => {
              const a = unhcrTotals['2014'][x.k], b = unhcrTotals['2024'][x.k];
              const mult = a ? b / a : 0;
              return (
                <div key={x.k} className="border border-slate-200 p-4 lift">
                  <h4 className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--label)' }}>{x.l}</h4>
                  <div className={`text-xl font-serif font-bold tabular-nums leading-none ${x.tone}`}>{fmt(b)}</div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--label)' }}>{fmt(a)} <span className="opacity-70">(2014)</span></span>
                    <span className="text-[11px] font-bold tabular-nums ml-auto" style={{ color: mult >= 2 ? 'var(--bad)' : 'var(--ink-soft)' }}>
                      ×{mult.toFixed(1).replace('.', lang === 'fr' ? ',' : '.')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify mt-4">
            {L(
              "En dix ans, le nombre de personnes déplacées à l'intérieur de leur propre pays et suivies par le HCR a plus que triplé sur le continent, quand les réfugiés — ceux qui franchissent une frontière — ont un peu plus que doublé. La mobilité forcée africaine ne s'internationalise donc pas : elle s'intensifie à l'intérieur des frontières. C'est exactement la population que les statistiques migratoires ne comptent pas, et celle dont le traité qui la protège attend encore ses ratifications.",
              "In a decade, the number of people displaced inside their own country and monitored by UNHCR has more than tripled on the continent, while refugees — those who cross a border — have a little more than doubled. African forced mobility is therefore not internationalising: it is intensifying within borders. That is precisely the population migration statistics do not count, and the one whose protecting treaty is still awaiting ratifications."
            )}
          </p>
        </div>

        <p className="text-[10px] italic mt-6 pt-3" style={{ color: 'var(--label)', borderTop: '1px solid var(--rule)' }}>
          {L(
            "Sources : IDMC (Global Report on Internal Displacement) pour le déplacement interne par cause, intégré à la base pays ; HCR (Refugee Data Finder, API publique) pour les réfugiés, demandeurs d'asile, apatrides et déplacés internes suivis. Les totaux de déplacés internes des deux institutions diffèrent — périmètres de suivi et méthodes distincts. Les deux sont affichés plutôt qu'harmonisés.",
            'Sources: IDMC (Global Report on Internal Displacement) for internal displacement by cause, integrated into the country base; UNHCR (Refugee Data Finder, public API) for refugees, asylum seekers, stateless persons and monitored IDPs. The two institutions\' IDP totals differ — distinct monitoring perimeters and methods. Both are shown rather than reconciled.'
          )}
        </p>
      </Reveal>

      {/* L'asymetrie juridique */}
      <Reveal delay={40}>
        <div className="p-6 md:p-8" style={{ backgroundColor: 'var(--bad-soft)', borderLeft: '3px solid var(--bad)' }}>
          <h4 className="block text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--bad)' }}>
            {L('Le point aveugle du droit continental', 'The blind spot of continental law')}
          </h4>
          <h2 className="font-serif font-bold text-xl md:text-2xl mb-4 leading-snug" style={{ color: 'var(--ink)' }}>
            {L(`${data.refOnly.length} États protègent le réfugié qui arrive, pas le citoyen qu'ils déplacent`,
               `${data.refOnly.length} states protect the refugee who arrives, not the citizen they displace`)}
          </h2>
          <p className="text-sm leading-relaxed text-justify max-w-4xl" style={{ color: 'var(--ink-soft)' }}>
            {L(
              `Le rapprochement des deux instruments africains de protection donne un résultat que ni l'un ni l'autre ne fait apparaître séparément : ${data.refOnly.length} États ont ratifié la Convention de l'OUA de 1969 sans ratifier celle de Kampala. Ils s'engagent donc à protéger la personne venue d'ailleurs, mais pas celle que leur propre territoire déplace — alors même que la seconde population est, à l'échelle du continent, plusieurs fois plus nombreuse. La production normative a fait son oeuvre : le traité existe, il est africain, il est contraignant, et il attend ${data.total - data.kampalaRatified} ratifications (Ben Mokhtar, 2026).`,
              `Bringing the two African protection instruments together yields a result neither shows on its own: ${data.refOnly.length} states have ratified the 1969 OAU Convention without ratifying Kampala. They commit to protecting the person arriving from elsewhere, but not the one their own territory displaces — even though the latter population is, continent-wide, several times larger. Norm production has done its part: the treaty exists, it is African, it is binding, and it is waiting on ${data.total - data.kampalaRatified} ratifications (Ben Mokhtar, 2026).`
            )}
          </p>
          <p className="text-[11px] mt-4 leading-relaxed" style={{ color: 'var(--ink-mute)' }}>
            <span className="font-bold uppercase tracking-widest">{L('Concernés :', 'Concerned:')}</span> {data.refOnly.join(', ')}.
          </p>
        </div>
      </Reveal>

      {/* Solutions durables */}
      <Reveal delay={50} className="bg-white border border-slate-200 p-8 md:p-10">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-4">
          {L('Sortir du déplacement : trois issues, rarement atteintes', 'Leaving displacement: three exits, rarely reached')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {[
            { t: L('Rapatriement volontaire', 'Voluntary repatriation'), d: L("Le retour au pays d'origine, librement consenti et dans la sécurité. Suppose que la cause du départ ait cessé — condition rarement réunie dans les situations prolongées.", 'Return to the country of origin, freely consented and in safety. Presupposes that the cause of flight has ceased — a condition rarely met in protracted situations.') },
            { t: L('Intégration locale', 'Local integration'), d: L("L'installation durable dans le pays d'asile, avec accès à un statut, au travail et aux services. C'est de fait la solution la plus fréquente en Afrique, et la moins reconnue en droit.", 'Durable settlement in the country of asylum, with access to status, work and services. In practice the most common solution in Africa, and the least recognised in law.') },
            { t: L('Réinstallation', 'Resettlement'), d: L("Le transfert vers un pays tiers. Les places offertes chaque année restent très inférieures aux besoins : c'est moins une solution générale qu'un dispositif de protection ciblée.", 'Transfer to a third country. The places offered each year remain far below needs: less a general solution than a targeted protection mechanism.') },
          ].map((x, i) => (
            <div key={i} className="border border-slate-200 p-5 lift">
              <span className="block font-serif font-bold text-slate-900 mb-2">{x.t}</span>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-slate-700 leading-relaxed text-justify max-w-4xl mt-6">
          {L(
            "Tant qu'aucune des trois n'aboutit, la situation devient un déplacement prolongé : non plus une urgence, mais un régime d'attente institutionnalisé. La nuance n'est pas sémantique — elle décide du type de financement mobilisable, humanitaire et court d'un côté, développement et long de l'autre. Nommer une situation « prolongée » suppose toutefois de reconnaître une présence durable, ce que les États d'accueil hésitent souvent à faire. Voir le Glossaire.",
            'As long as none of the three is achieved, the situation becomes protracted displacement: no longer an emergency but an institutionalised regime of waiting. The nuance is not semantic — it decides what funding can be mobilised, humanitarian and short on one side, development and long on the other. Naming a situation "protracted" does, however, require acknowledging a lasting presence, which host states are often reluctant to do. See the Glossary.'
          )}
        </p>
      </Reveal>

      <PrintCitationFooter lang={lang} sectionLabel={L('Mobilités contraintes', 'Forced mobility')} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Migration de travail. Le releve et la comparaison des ratifications OIT sont
// calcules en direct depuis la base pays ; le panneau des quatre editions
// reprend les chiffres publies par l'UA, l'OIT et l'OIM.
// ---------------------------------------------------------------------------
const TabLabour = ({ text, lang }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (c.name?.[lang] || c.name?.fr || ''));

  const ilo = useMemo(() => {
    const all = Object.values(countryData).flat().filter(c => c.normlex);
    const rows = all.map(c => ({
      n: nm(c),
      total: Number(c.normlex.total) || 0,
      fund: Number(c.normlex.fundamental) || 0,
      gov: Number(c.normlex.governance) || 0,
      tech: Number(c.normlex.technical) || 0,
      link: c.normlex.link || null,
    })).sort((a, b) => b.total - a.total);
    const complet = rows.filter(r => r.fund >= 11);
    const buckets = {};
    rows.forEach(r => { buckets[r.fund] = (buckets[r.fund] || 0) + 1; });
    return {
      rows, complet,
      buckets: Object.entries(buckets).map(([k, v]) => ({ k: Number(k), v })).sort((a, b) => a.k - b.k),
      moyenne: (rows.reduce((n, r) => n + r.total, 0) / rows.length).toFixed(1),
      total: rows.length,
    };
  }, [lang]);

  const exportCSV = () => {
    downloadCSV('souths_conventions_oit.csv', toCSV(ilo.rows.map(r => ({
      pays: r.n, conventions_total: r.total, fondamentales_sur_11: r.fund,
      gouvernance: r.gov, techniques: r.tech,
    }))));
  };

  const fmt = (v) => (lang === 'fr' ? String(v).replace('.', ',') : String(v));
  const maxFund = Math.max(...ilo.buckets.map(b => b.v));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.labour.badge}
        plate={"Pl. V"}
        plain={text.headers.labour.plain}
        lang={lang}
        title={text.headers.labour.title}
        highlight={text.headers.labour.highlight}
        desc={text.headers.labour.desc}
        icon={Briefcase}
      />

      <div className="flex justify-end print:hidden">
        <CsvButton onClick={exportCSV} label={L('Conventions OIT (CSV)', 'ILO conventions (CSV)')} />
      </div>

      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 divide-x divide-y md:divide-y-0 divide-slate-200 stagger">
          {[
            { v: '13,1 M', l: L('Travailleurs migrants', 'Migrant workers'), s: L('en 2022, contre 9,3 M en 2010', 'in 2022, against 9.3M in 2010'), tone: 'figure-terra' },
            { v: '64 %', l: L('Des migrants en âge de travailler sont actifs', 'Of working-age migrants are in the labour force'), s: L('sur 20,4 M', 'of 20.4M'), tone: 'figure-inkblue' },
            { v: `${ilo.complet.length}/${ilo.total}`, l: L('Ont ratifié les 11 conventions fondamentales', 'Have ratified all 11 fundamental conventions'), s: L("le socle des droits au travail", 'the floor of labour rights'), tone: 'figure-warn' },
            { v: '19,1 %', l: L('De la population couverte par une protection sociale', 'Of the population covered by social protection'), s: L('contre 52,4 % dans le monde', 'against 52.4% worldwide'), tone: 'figure-ok' },
          ].map((k, i) => (
            <div key={i} className="px-5 py-6">
              <div className={`text-2xl md:text-3xl font-serif font-bold tabular-nums leading-none ${k.tone}`}>{k.v}</div>
              <span className="block text-[11px] font-bold uppercase tracking-widest mt-2.5 leading-snug" style={{ color: 'var(--label)' }}>{k.l}</span>
              <span className="block text-[11px] mt-1" style={{ color: 'var(--label)' }}>{k.s}</span>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Migration de travail : exploitation directe des deux dernieres editions. */}
      <Reveal delay={25}>
        <AfricanCounterpoint
          lang={lang}
          kicker={L("Le volet travail", "The labour dimension")}
          title={L(
            "La mobilité africaine est d'abord une mobilité de travail — et la série se corrige d'une édition à l'autre",
            "African mobility is first a labour mobility — and the series is revised from one edition to the next"
          )}
          sources={[
            { label: L(
                "Commission de l'UA, OIT, OIM & CEA — « Report on Labour Migration Statistics in Africa », 3e édition (données 2019), publiée le 18 novembre 2021",
                "AU Commission, ILO, IOM & ECA — \"Report on Labour Migration Statistics in Africa\", 3rd edition (2019 data), published 18 November 2021"
              ), url: "https://au.int/sites/default/files/documents/41182-doc-254_261-EN06.pdf" },
            { label: L(
                "Commission de l'UA, OIT & OIM (programme JLMP, appui technique de Statistics Sweden) — « Report on Labour Migration Statistics in Africa », 4e édition (données 2022), publiée le 13 juillet 2026",
                "AU Commission, ILO & IOM (JLMP programme, technical support from Statistics Sweden) — \"Report on Labour Migration Statistics in Africa\", 4th edition (2022 data), published 13 July 2026"
              ), url: "https://au.int/sites/default/files/4th_Edi_LMSRA_EN_WEB_20260626.pdf" },
          ]}
        >
          <p className="text-justify">
            {L(
              "Le rapport continental sur les statistiques de migration de travail en est à sa quatrième édition. Lues ensemble, les deux dernières disent la même chose sur le fond — la mobilité intra-africaine est massivement une mobilité de travail — et deux choses différentes sur les chiffres. C'est cette double lecture qui est instructive.",
              "The continental report on labour migration statistics is now in its fourth edition. Read together, the last two say the same thing in substance — intra-African mobility is overwhelmingly labour mobility — and two different things in figures. It is that double reading which is instructive."
            )}
          </p>

          {/* Releve comparatif : uniquement les points effectivement publies. */}
          <div className="bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <th className="text-left font-semibold px-4 py-2.5 text-slate-700">{L("Indicateur", "Indicator")}</th>
                  <th className="text-right font-semibold px-4 py-2.5 text-slate-700 whitespace-nowrap">{L("3e éd. — 2019", "3rd ed. — 2019")}</th>
                  <th className="text-right font-semibold px-4 py-2.5 text-slate-700 whitespace-nowrap">{L("4e éd. — 2022", "4th ed. — 2022")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(lang === 'fr' ? [
                  ["Travailleurs migrants internationaux", "14,5 M (9,5 M en 2010)", "13,1 M (9,3 M en 2010)"],
                  ["Migrants en âge de travailler", "20,2 M — 77 % des migrants", "20,4 M — au moins 78 %"],
                  ["Part dans la population active", "72 %", "64 %"],
                  ["Part des femmes parmi les travailleurs migrants", "38 % en moyenne", "37 % en moyenne"],
                  ["Concentration régionale", "—", "Ouest, Est et Sud : 76 % des travailleurs migrants"],
                  ["Envois de fonds — régions dominantes", "Nord 43 % + Ouest 39 % = 82 %", "Nord 45 % + Ouest 34 % = 79 %"],
                ] : [
                  ["International migrant workers", "14.5 M (9.5 M in 2010)", "13.1 M (9.3 M in 2010)"],
                  ["Working-age migrants", "20.2 M — 77% of migrants", "20.4 M — at least 78%"],
                  ["Share in the labour force", "72%", "64%"],
                  ["Women among migrant workers", "38% on average", "37% on average"],
                  ["Regional concentration", "—", "West, East and Southern: 76% of migrant workers"],
                  ["Remittances — leading regions", "North 43% + West 39% = 82%", "North 45% + West 34% = 79%"],
                ]).map(([k, a, b], i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-slate-700">{k}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 whitespace-nowrap">{a}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900 whitespace-nowrap">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {L("Ce que la révision de la série nous apprend", "What the revision of the series tells us")}
            </h4>
            <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
              {L(
                "Le point de départ lui-même a bougé : 9,5 millions de travailleurs migrants en 2010 selon la 3e édition, 9,3 millions selon la 4e. Il s'agit d'une révision : méthodologie affinée, davantage d'États déclarants, séries recalculées. La 4e édition documente d'ailleurs le décrochage de 2020 (croissance tombée à 0,67 %, effet de la pandémie sur la mobilité) que la précédente ne pouvait pas voir. Une plateforme de données doit montrer ces révisions plutôt que de retenir le chiffre le plus commode : c'est précisément l'objet de l'harmonisation que vise SHaSA.",
                "The starting point itself moved: 9.5 million migrant workers in 2010 according to the 3rd edition, 9.3 million according to the 4th. This is a revision: refined methodology, more reporting states, recomputed series. The 4th edition also documents the 2020 break (growth down to 0.67%, the pandemic's effect on mobility) that the previous one could not see. A data platform should show such revisions rather than retain the most convenient figure: that is exactly what SHaSA's harmonisation is for."
              )}
            </p>
          </div>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {L("Là où la donnée manque vraiment", "Where the data really runs out")}
            </h4>
            <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
              {L(
                "Pour établir les caractéristiques d'emploi des migrants, la 3e édition n'a pu s'appuyer que sur dix États déclarants sur cinquante-quatre — Cabo Verde, Cameroun, Tchad, Égypte, Liberia, Mali, Namibie, Niger, Nigeria, Seychelles. C'est sur cette base que l'on sait que l'agriculture, la sylviculture et la pêche employaient 27,5 % des travailleurs migrants recensés. Le chiffre est solide pour ces dix pays ; il ne l'est pas pour le continent. Le déficit n'est donc pas dans la production de données brutes, il est dans la chaîne de remontée et d'harmonisation (Ben Mokhtar, 2026).",
                "To establish migrants' employment characteristics, the 3rd edition could draw on only ten reporting states out of fifty-four — Cabo Verde, Cameroon, Chad, Egypt, Liberia, Mali, Namibia, Niger, Nigeria, Seychelles. It is on that basis that agriculture, forestry and fishing are known to have employed 27.5% of the migrant workers recorded. The figure is sound for those ten countries; it is not sound for the continent. The deficit therefore sits in the reporting and harmonisation chain rather than in producing raw data (Ben Mokhtar, 2026)."
              )}
            </p>
          </div>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {L("Le lien avec la libre circulation et la ZLECAf", "The link with free movement and the AfCFTA")}
            </h4>
            <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
              {L(
                "La 4e édition établit elle-même le lien : l'augmentation du nombre de travailleurs migrants « pourrait être liée à l'assouplissement des restrictions migratoires et à la mise en œuvre des dispositions de libre circulation entre pays africains ». Elle en donne un cas mesuré — au sein de la Communauté d'Afrique de l'Est, les travailleurs migrants passent de 1,14 million en 2008 à 2,69 millions en 2019. Et elle constate que l'Ouest, l'Est et le Sud, où les protocoles CEDEAO, CAE et SADC fonctionnent, concentrent 77,3 % des migrants internationaux du continent.",
                "The 4th edition draws the link itself: the rise in migrant worker numbers \"might be linked to relaxed migration restrictions and to the implementation of free movement provisions between African countries\". It gives one measured case — within the East African Community, migrant workers rise from 1.14 million in 2008 to 2.69 million in 2019. And it notes that West, East and Southern Africa, where the ECOWAS, EAC and SADC protocols operate, concentrate 77.3% of the continent's international migrants."
              )}
            </p>
            <p className="text-[13px] text-slate-600 leading-relaxed text-justify mt-3">
              {L(
                "C'est là que le paradoxe documenté ailleurs sur cette plateforme prend sa mesure économique : la ZLECAf compte 50 ratifications sur 54, le Protocole sur la libre circulation des personnes 4 sur 54. Les marchandises ont obtenu leur cadre continental, les travailleurs qui les produisent ne l'ont pas. Là où la libre circulation existe malgré tout, c'est au niveau régional qu'elle a été conquise — et c'est là que la mobilité de travail se mesure.",
                "This is where the paradox documented elsewhere on this platform takes its economic measure: the AfCFTA has 50 ratifications out of 54, the Protocol on Free Movement of Persons 4 out of 54. Goods obtained their continental framework; the workers who produce them did not. Where free movement nonetheless exists, it was won at regional level — and that is where labour mobility can be measured."
              )}
            </p>
          </div>

          <div className="p-5" style={{ backgroundColor: 'var(--warn-soft)', border: '1px solid #E4CFA4' }}>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--warn-ink)' }}>
              {L("Protection sociale : l'angle mort", "Social protection: the blind spot")}
            </h4>
            <p className="text-[13px] leading-relaxed text-justify" style={{ color: 'var(--warn-ink)' }}>
              {L(
                "La 4e édition rappelle que 19,1 % seulement de la population africaine est couverte par au moins une prestation de protection sociale (indicateur ODD 1.3.1), contre 52,4 % dans le monde — la première fois que la moitié de l'humanité est couverte. Un travailleur migrant cumule ce déficit continental et la non-portabilité de ses droits d'un pays à l'autre.",
                "The 4th edition recalls that only 19.1% of Africa's population is covered by at least one social protection benefit (SDG indicator 1.3.1), against 52.4% worldwide — the first time half of humanity is covered. A migrant worker compounds this continental deficit with the non-portability of entitlements across borders."
              )}
            </p>
          </div>
        </AfricanCounterpoint>
      </Reveal>

      {/* Les conventions de l'OIT : le meme motif que l'ancrage continental */}
      <Reveal delay={35}>
        <section className="bg-white" style={{ borderStyle: 'solid', borderColor: 'var(--rule)', borderWidth: 1, borderTopWidth: 2, borderTopColor: 'var(--warn-ink)' }}>
          <div className="px-6 md:px-8 pt-6 pb-5 border-b border-slate-200">
            <span className="block text-[11px] font-bold uppercase mb-2" style={{ letterSpacing: '.18em', color: 'var(--warn-ink)' }}>
              {L('Calculé depuis la base de la plateforme', 'Computed from the platform database')}
            </span>
            <h4 className="font-serif font-bold text-xl md:text-2xl text-slate-900 leading-snug">
              {L("Les droits opposables : sept États sur cinquante-quatre ont le socle complet",
                 'Enforceable rights: seven states out of fifty-four have the full floor')}
            </h4>
          </div>

          <div className="px-6 md:px-8 py-6 space-y-6 text-sm text-slate-700 leading-relaxed">
            <p className="text-justify">
              {L(
                "Onze conventions de l'OIT posent le socle des droits d'un travailleur migrant : liberté syndicale, négociation collective, abolition du travail forcé, âge minimum, pires formes de travail des enfants, égalité de rémunération, non-discrimination, sécurité et santé au travail. Ce sont celles-là qui comptent, bien plus que le nombre total de textes signés par le pays d'accueil. Le compte, pays par pays, donne un résultat net.",
                "Eleven ILO conventions set the floor of a migrant worker's rights: freedom of association, collective bargaining, abolition of forced labour, minimum age, worst forms of child labour, equal remuneration, non-discrimination, occupational safety and health. Those are what count, far more than the total number of texts the host country has signed. Counted country by country, the result is stark."
              )}
            </p>

            <div>
              <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                {L('Combien des 11 conventions fondamentales, et combien de pays', 'How many of the 11 fundamental conventions, and how many countries')}
              </h4>
              <div className="space-y-2">
                {ilo.buckets.map((b, i) => (
                  <div key={b.k} className="flex items-center gap-3 figure-row px-1 py-1">
                    <span className="text-[11px] font-semibold w-28 shrink-0 tabular-nums text-slate-700">
                      {b.k}/11
                    </span>
                    <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                      <div className={`h-full bar-fill bar-fill--d${Math.min(5, i + 1)}`}
                           style={{ width: `${(b.v / maxFund) * 100}%`,
                                    backgroundColor: b.k >= 11 ? 'var(--ok)' : b.k >= 9 ? 'var(--warn-ink)' : 'var(--bad)' }} />
                    </div>
                    <span className="text-xs font-bold w-24 text-right shrink-0 tabular-nums text-slate-800">
                      {b.v} {L(b.v > 1 ? 'pays' : 'pays', b.v > 1 ? 'countries' : 'country')}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }}>
                <span className="font-bold uppercase tracking-widest">{L('Socle complet :', 'Full floor:')}</span>{' '}
                {ilo.complet.map(r => r.n).join(', ')}.
              </p>
            </div>

            <div className="p-5" style={{ backgroundColor: 'var(--warn-soft)', borderLeft: '2px solid var(--warn-ink)' }}>
              <h4 className="block text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--warn-ink)' }}>
                {L('Le volume ne dit pas la protection', 'Volume does not equal protection')}
              </h4>
              <p className="text-[13px] leading-relaxed text-justify" style={{ color: 'var(--ink-soft)' }}>
                {L(
                  `Le nombre total de conventions ratifiées varie de ${ilo.rows[ilo.rows.length - 1].total} à ${ilo.rows[0].total}, pour une moyenne de ${fmt(ilo.moyenne)}. Mais un total élevé ne garantit rien : plusieurs États figurant en tête du classement général n'ont pas le socle fondamental complet, tandis que Madagascar l'a intégralement avec un total bien plus modeste. C'est le même motif que celui observé sur les instruments continentaux — l'adhésion large précède, et parfois remplace, l'engagement contraignant (Ben Mokhtar, 2026).`,
                  `The total number of ratified conventions ranges from ${ilo.rows[ilo.rows.length - 1].total} to ${ilo.rows[0].total}, averaging ${fmt(ilo.moyenne)}. But a high total guarantees nothing: several states at the top of the overall ranking lack the complete fundamental floor, while Madagascar holds it in full with a far more modest total. It is the same pattern observed on continental instruments — broad accession precedes, and sometimes replaces, binding commitment (Ben Mokhtar, 2026).`
                )}
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-200">
              <table className="w-full text-[12px]">
                <thead>
                  <tr style={{ backgroundColor: 'var(--paper-sunk)' }}>
                    <th className="text-left font-semibold px-3 py-2 text-slate-700">{L('Pays', 'Country')}</th>
                    <th className="px-2 py-2 font-semibold text-slate-700 text-right">{L('Fondamentales', 'Fundamental')}</th>
                    <th className="px-2 py-2 font-semibold text-slate-700 text-right">{L('Gouvernance', 'Governance')}</th>
                    <th className="px-2 py-2 font-semibold text-slate-700 text-right">{L('Techniques', 'Technical')}</th>
                    <th className="px-3 py-2 font-semibold text-slate-700 text-right">{L('Total', 'Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ilo.rows.map(r => (
                    <tr key={r.n} className="figure-row">
                      <td className="px-3 py-1.5 text-slate-800 whitespace-nowrap">{r.n}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold"
                          style={{ color: r.fund >= 11 ? 'var(--ok)' : r.fund >= 9 ? 'var(--warn-ink)' : 'var(--bad)' }}>
                        {r.fund}/11
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.gov}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{r.tech}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-bold text-slate-900">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 md:px-8 py-4" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
            <h4 className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-2">{L('Source', 'Source')}</h4>
            <a href="https://normlex.ilo.org/" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-start gap-1.5 text-[11px] hover:underline" style={{ color: 'var(--accent-2)' }}>
              <span>{L(
                "OIT — base NORMLEX (ratifications par pays). Compilation integree a la base pays de la plateforme ; chaque fiche pays renvoie a la page NORMLEX de l'Etat concerne.",
                'ILO — NORMLEX database (ratifications by country). Compiled into the platform country base; each country profile links to that state\'s NORMLEX page.'
              )}</span>
              <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
            </a>
          </div>
        </section>
      </Reveal>

      <PrintCitationFooter lang={lang} sectionLabel={L('Migration de travail', 'Labour migration')} />
    </div>
  );
};

const TabGovernance = ({ text, lang, activeSdgzTab, setActiveSdgzTab }) => {
  const [expandedRec, setExpandedRec] = useState(null);
  const [matrixView, setMatrixView] = useState('table'); // 'table' ou 'details'
  const [expandedGovBody, setExpandedGovBody] = useState(null); // 'stc' | 'pafom' | null

  // ========================================================================
  // 1. LES COMMUNAUTÉS ÉCONOMIQUES RÉGIONALES (CER)
  // ========================================================================
  const recsList = [
    {
      id: 'cedeao',
      avoi: 0.629,
      founded: 1975,
      hq: { fr: 'Abuja, Nigeria', en: 'Abuja, Nigeria' },
      name: { fr: 'CEDEAO / ECOWAS (Afrique de l’Ouest)', en: 'ECOWAS (West Africa)' },
      tag: lang === 'fr' ? 'Ouverture standardisée & pionnière' : 'Pioneering & standardized openness',
      desc: {
        fr: "La CEDEAO constitue le bloc de référence du régime continental. L'ouverture y est une présomption stabilisée dans les pratiques administratives, malgré la sécession en 2024-2025 de l'Alliance des États du Sahel (AES - Mali, Burkina Faso, Niger) qui vient fragmenter l'acquis historique de 1979.",
        en: "ECOWAS constitutes the reference bloc of the continental regime. Openness is a stabilized presumption in administrative practices, despite the 2024-2025 secession of the Alliance of Sahel States (AES - Mali, Burkina Faso, Niger) which fragments the historical 1979 acquis."
      },
      instruments: {
        fr: "Protocole de 1979 et Actes additionnels de 2014 (suppression de la limite de 90 jours). Processus consultatif : MIDWA (Dialogue sur la Migration en Afrique de l'Ouest).",
        en: "1979 Protocol and 2014 Additional Acts (removal of the 90-day limit). Consultative process: MIDWA (Migration Dialogue for West Africa)."
      },
      dynamics: {
        fr: "La région affiche l'indice AVOI le plus élevé des huit CER (0,629 en 2024, moyenne continentale : 0,501), portée par le Protocole de 1979. Le retrait effectif du Mali, du Burkina Faso et du Niger, le 29 janvier 2025, ramène la Communauté à douze membres. La CEDEAO a pourtant demandé aux États restants de continuer à reconnaître les passeports et cartes d'identité des trois pays, et de laisser circuler leurs ressortissants sans visa. La sortie politique se trouve ainsi découplée du régime de mobilité.",
        en: "The region shows the highest AVOI index of the eight RECs (0.629 in 2024, continental average: 0.501), driven by the 1979 Protocol. The effective withdrawal of Mali, Burkina Faso, and Niger on 29 January 2025 brings the Community down to twelve members; ECOWAS nonetheless asked its remaining states to keep recognising the three countries' passports and ID cards and to maintain visa-free movement for their nationals, effectively decoupling the political exit from the mobility regime."
      },
      sources: [
        { label: "CEDEAO — Retrait du Burkina Faso, du Mali et du Niger (2025)", url: "https://www.ecowas.int/burkina-faso-mali-and-nigers-withdrawal-from-ecowas-is-now-a-reality/" },
        { label: "BAD / CUA — Africa Visa Openness Index", url: "https://www.visaopenness.org/" },
        { label: "Union africaine — Fiche CER : CEDEAO", url: "https://au.int/en/recs/ecowas" },
      ]
    },
    {
      id: 'cae',
      avoi: 0.504,
      founded: 2000,
      hq: { fr: 'Arusha, Tanzanie', en: 'Arusha, Tanzania' },
      name: { fr: 'CAE / EAC (Communauté d’Afrique de l’Est)', en: 'EAC (East African Community)' },
      tag: lang === 'fr' ? 'Citoyenneté de marché & corridors' : 'Market citizenship & corridors',
      desc: {
        fr: "La CAE fonde son intégration sur une citoyenneté de marché. La mobilité y est pensée comme une condition de crédibilité du marché commun, articulant droit au travail, résidence et établissement de manière asymétrique.",
        en: "The EAC bases its integration on market citizenship. Mobility is seen as a condition for the credibility of the common market, asymmetrically articulating the right to work, residence, and establishment."
      },
      instruments: {
        fr: "Protocole du Marché commun (2010), politique de migration de travail (2025-2030), et forte procéduralisation douanière via les Postes-frontières à arrêt unique (OSBP).",
        en: "Common Market Protocol (2010), labor migration policy (2025-2030), and strong customs proceduralization via One-Stop Border Posts (OSBP)."
      },
      dynamics: {
        fr: "Un score AVOI de 0,504 en 2024 (au-dessus de la moyenne continentale de 0,501), porté par le Rwanda et le Kenya. La Communauté est passée de six à huit partenaires en moins de deux ans : la RDC le 11 juillet 2022, puis la Somalie, membre de plein droit le 4 mars 2024. Cet élargissement rapide étend le marché commun à des espaces sécuritairement complexes, dont les feuilles de route d'intégration restent en négociation.",
        en: "An AVOI score of 0.504 in 2024 (above the 0.501 continental average), driven by Rwanda and Kenya. The Community moved from six to eight partner states in under two years — DRC (11 July 2022) then Somalia (full member on 4 March 2024) — a rapid enlargement extending the common market into security-complex areas, with integration roadmaps still under negotiation."
      },
      sources: [
        { label: "CAE — Vue d'ensemble et États partenaires", url: "https://www.eac.int/overview-of-eac" },
        { label: "CAE — Adhésion de la Somalie comme 8e État partenaire", url: "https://www.eac.int/press-releases/3049-somalia-finally-joins-eac-as-the-bloc-s-8th-partner-state" },
        { label: "BAD / CUA — Africa Visa Openness Index", url: "https://www.visaopenness.org/" },
      ]
    },
    {
      id: 'sadc',
      avoi: 0.547,
      founded: 1992,
      hq: { fr: 'Gaborone, Botswana', en: 'Gaborone, Botswana' },
      name: { fr: 'SADC (Communauté de Développement de l’Afrique Australe)', en: 'SADC (Southern African Development Community)' },
      tag: lang === 'fr' ? 'Procéduralisation sectorielle & prudence' : 'Sectoral approach & caution',
      desc: {
        fr: "Face aux réticences souverainistes (notamment de l'Afrique du Sud), la SADC déploie une intégration asymétrique et sélective, privilégiant la gestion logistique des corridors et l'attraction des talents plutôt qu'une ouverture universelle.",
        en: "Faced with sovereign reluctance (notably from South Africa), SADC deploys an asymmetric and selective integration, prioritizing logistics corridor management and talent attraction over universal openness."
      },
      instruments: {
        fr: "Protocole de 2005, Plan sur la migration de travail (2020-2025). Processus consultatif : MIDSA (Dialogue sur la Migration pour l'Afrique Australe).",
        en: "2005 Protocol, Labour migration plan (2020-2025). Consultative process: MIDSA (Migration Dialogue for Southern Africa)."
      },
      dynamics: {
        fr: "Deuxième CER la plus ouverte du continent avec un score AVOI de 0,547 en 2024, en progression continue, portée notamment par l'Angola qui a près de doublé le nombre de nationalités bénéficiant d'un accès sans visa fin 2023. L'espace reste néanmoins polarisé par Pretoria (réforme BMA et White Paper de 2024) ; l'innovation passe aussi par des accords bilatéraux (ex : carte d'identité commune Botswana-Namibie).",
        en: "The second-most open REC on the continent with an AVOI score of 0.547 in 2024, on a continuing upward trend, driven notably by Angola which nearly doubled the number of nationalities granted visa-free access in late 2023. The space remains polarized by Pretoria (BMA reform and 2024 White Paper); innovation also comes through bilateral agreements (e.g. the joint Botswana-Namibia ID card)."
      },
      sources: [
        { label: "SADC — États membres", url: "https://www.sadc.int/member-states" },
        { label: "SADC — Histoire et Traité", url: "https://www.sadc.int/pages/history-and-treaty" },
        { label: "BAD / CUA — Africa Visa Openness Index", url: "https://www.visaopenness.org/" },
      ]
    },
    {
      id: 'comesa',
      avoi: 0.463,
      founded: 1994,
      hq: { fr: 'Lusaka, Zambie', en: 'Lusaka, Zambia' },
      name: { fr: 'COMESA (Marché Commun de l’Afrique Orientale et Australe)', en: 'COMESA (Common Market for Eastern and Southern Africa)' },
      tag: lang === 'fr' ? 'Facilitation macro-régionale' : 'Macro-regional facilitation',
      desc: {
        fr: "Vaste bloc de 21 États (de la Tunisie à l'Eswatini) où l'intégration humaine avance par accumulation technique (visas d'affaires) afin de réduire les coûts de transaction commerciale dans un espace hétérogène.",
        en: "Vast bloc of 21 States (from Tunisia to Eswatini) where human integration advances through technical accumulation (business visas) to reduce commercial transaction costs in a heterogeneous space."
      },
      instruments: {
        fr: "Protocoles de 1984 et 1998 (application inégale). Processus consultatif : MIDCOM. Production massive d'outils de capacitation technique.",
        en: "1984 and 1998 Protocols (uneven application). Consultative process: MIDCOM. Massive production of technical capacity-building tools."
      },
      dynamics: {
        fr: "Score AVOI de 0,463 en 2024, légèrement au-dessous de la moyenne continentale (0,501). L'obligation juridique de libre circulation pure y est supplantée par une rationalisation pragmatique liée à la facilitation commerciale et à la complémentarité avec la ZLECAf.",
        en: "AVOI score of 0.463 in 2024, slightly below the continental average (0.501). The pure legal obligation of free movement is supplanted by pragmatic rationalization linked to trade facilitation and complementarity with the AfCFTA."
      },
      sources: [
        { label: "COMESA — États membres", url: "https://www.comesa.int/comesa-members-states/" },
        { label: "Union africaine — Fiche CER : COMESA", url: "https://au.int/en/recs/comesa" },
        { label: "BAD / CUA — Africa Visa Openness Index", url: "https://www.visaopenness.org/" },
      ]
    },
    {
      id: 'igad',
      avoi: 0.376,
      founded: 1996,
      hq: { fr: 'Djibouti, Djibouti', en: 'Djibouti City, Djibouti' },
      name: { fr: 'IGAD (Autorité Intergouvernementale pour le Développement)', en: 'IGAD (Intergovernmental Authority on Development)' },
      tag: lang === 'fr' ? 'Nexus sécurité-climat-mobilité' : 'Security-climate-mobility nexus',
      desc: {
        fr: "Dans une Corne de l'Afrique marquée par les conflits et les chocs climatiques, la mobilité est saisie par l'IGAD à l'articulation exacte entre sécurité régionale, transhumance de survie et développement.",
        en: "In a Horn of Africa marked by conflicts and climate shocks, mobility is captured by IGAD at the exact articulation between regional security, survival transhumance, and development."
      },
      instruments: {
        fr: "Deux protocoles pionniers en 2020 : Libre circulation des personnes ET Transhumance pastorale transfrontalière. Processus consultatif : MIDIGAD.",
        en: "Two pioneering protocols in 2020: Free movement of persons AND Cross-border pastoral transhumance. Consultative process: MIDIGAD."
      },
      dynamics: {
        fr: "Un score AVOI de 0,376 en 2024, nettement sous la moyenne continentale (0,501) et parmi les plus bas du continent : l'homogénéisation de l'ouverture reste suspendue à l'instabilité géopolitique chronique de la sous-région (guerre au Soudan). Le retrait formel de l'Érythrée, notifié en décembre 2025 — deux ans seulement après son retour au sein de l'organisation en juin 2023 —, ramène l'Autorité à sept membres et illustre la fragilité du multilatéralisme régional dans la Corne.",
        en: "An AVOI score of 0.376 in 2024, well below the continental average (0.501) and among the lowest on the continent: homogenizing openness remains suspended on the chronic geopolitical instability of the sub-region (war in Sudan). Eritrea's formal withdrawal, notified in December 2025 — barely two years after it rejoined in June 2023 — brings the Authority down to seven members and illustrates the fragility of regional multilateralism in the Horn."
      },
      sources: [
        { label: "IGAD — Communiqué sur le retrait de l'Érythrée (2025)", url: "https://igad.int/igad-regrets-eritreas-decision-to-withdraw-from-the-organisation/" },
        { label: "IGAD — Présentation et structure", url: "https://igad.int/about/" },
        { label: "Union africaine — Fiche CER : IGAD", url: "https://au.int/en/recs/igad" },
      ]
    },
    {
      id: 'ceeac',
      avoi: 0.320,
      founded: 1983,
      hq: { fr: 'Libreville, Gabon', en: 'Libreville, Gabon' },
      name: { fr: 'CEEAC & CEMAC (Afrique Centrale)', en: 'ECCAS & CEMAC (Central Africa)' },
      tag: lang === 'fr' ? 'Configuration à deux étages' : 'Two-tier configuration',
      desc: {
        fr: "L'Afrique Centrale repose sur une intégration à double vitesse où le noyau dense (CEMAC) porte la facilitation, tandis que le vaste ensemble CEEAC demeure entravé par les contraintes d'enclavement physique.",
        en: "Central Africa relies on a two-tier integration where the dense core (CEMAC) carries facilitation, while the vast ECCAS whole remains hampered by physical landlocked constraints."
      },
      instruments: {
        fr: "Traité révisé de la CEEAC (2019). Actes additionnels CEMAC (2013, 2017) instituant la suppression des visas pour 90 jours et le passeport biométrique communautaire.",
        en: "Revised ECCAS Treaty (2019). CEMAC Additional Acts (2013, 2017) establishing visa abolition for 90 days and the community biometric passport."
      },
      dynamics: {
        fr: "Score AVOI le plus bas du continent avec l'UMA (0,320 en 2024, moyenne continentale : 0,501), même si la CEEAC affiche la plus forte progression annuelle de tous les CER cette année-là. Le défi reste la conversion de l'acquis CEMAC vers les piliers de résidence, et son extension au périmètre CEEAC face à des États très sourcilleux sur leur souveraineté sécuritaire (Gabon, Guinée Équatoriale). Le retrait du Rwanda, annoncé en juin 2025 à la suite d'un différend sur la présidence tournante au sommet de Malabo, ajoute une fracture institutionnelle à une intégration déjà contrainte.",
        en: "The lowest AVOI score on the continent alongside the AMU (0.320 in 2024, continental average: 0.501), even though ECCAS recorded the largest year-on-year increase of any REC that year. The challenge remains converting the CEMAC acquis towards residence pillars, and its extension to the ECCAS perimeter facing States highly sensitive about their security sovereignty (Gabon, Equatorial Guinea). Rwanda's announced withdrawal in June 2025 — following a dispute over the rotating chairmanship at the Malabo summit — adds an institutional fracture to an already constrained integration."
      },
      sources: [
        { label: "CEEAC — Présentation de la Communauté", url: "https://www.ceeac-eccas.org/2023/05/28/eccas-in-brief/" },
        { label: "Union africaine — Fiche CER : CEEAC", url: "https://au.int/en/recs/eccas" },
        { label: "BAD / CUA — Africa Visa Openness Index", url: "https://www.visaopenness.org/" },
      ]
    },
    {
      id: 'uma',
      avoi: 0.306,
      founded: 1989,
      hq: { fr: 'Rabat, Maroc (Secrétariat)', en: 'Rabat, Morocco (Secretariat)' },
      name: { fr: 'UMA (Union du Maghreb Arabe)', en: 'AMU (Arab Maghreb Union)' },
      tag: lang === 'fr' ? 'Normativité d’horizon & gel institutionnel' : 'Horizon normativity & institutional freeze',
      desc: {
        fr: "La paralysie géopolitique structurelle gèle l'ambition fondatrice de 1989. L'intégration de la mobilité maghrébine se fait aujourd'hui par défaut, via l'externalisation sécuritaire européenne et des accords bilatéraux épars.",
        en: "Structural geopolitical paralysis freezes the 1989 founding ambition. Maghreb mobility integration currently happens by default, via European security externalization and scattered bilateral agreements."
      },
      instruments: {
        fr: "Traité de Marrakech (1989) comme pur horizon normatif.",
        en: "Marrakech Treaty (1989) as a pure normative horizon."
      },
      dynamics: {
        fr: "Le bloc affiche la moyenne d'ouverture la plus basse du continent (0,306 en 2024, moyenne continentale : 0,501). L'Algérie a notamment imposé des visas aux ressortissants marocains fin 2024, illustrant le recul de l'intégration sous-régionale. Le Secrétariat permanent siège à Rabat depuis 1992, mais aucun sommet des chefs d'État ne s'est tenu depuis des décennies : l'UMA subsiste comme coquille juridique plus que comme institution opérante.",
        en: "The bloc shows the lowest openness average on the continent (0.306 in 2024, continental average: 0.501). Algeria notably imposed visas on Moroccan nationals in late 2024, illustrating the regression of sub-regional integration. The permanent Secretariat has been based in Rabat since 1992, but no Heads of State summit has been held for decades: the AMU survives as a legal shell rather than an operating institution."
      },
      sources: [
        { label: "UMA — Historique et institutions", url: "https://maghrebarabe.org/en/historical/" },
        { label: "Union africaine — Fiche CER : UMA", url: "https://au.int/en/recs/uma" },
        { label: "BAD / CUA — Africa Visa Openness Index", url: "https://www.visaopenness.org/" },
      ]
    },
    {
      id: 'censad',
      avoi: 0.519,
      founded: 1998,
      hq: { fr: 'Tripoli, Libye', en: 'Tripoli, Libya' },
      name: { fr: 'CEN-SAD (Communauté des États Sahélo-Sahariens)', en: 'CEN-SAD (Community of Sahel-Saharan States)' },
      tag: lang === 'fr' ? 'Coordination sécuritaire de surcouche transrégionale' : 'Transregional security overlay coordination',
      desc: {
        fr: "Avec 24 États membres englobant plusieurs autres CER, la CEN-SAD fonctionne davantage comme un forum politique et sécuritaire que comme un régime juridique autonome de libre circulation, même si letraité fondateur inscrit la libre circulation des personnes parmi ses objectifs centraux.",
        en: "With 24 member states overlapping several other RECs, CEN-SAD functions more as a political and security forum than as an autonomous legal regime of free movement, even though its founding treaty lists free movement of persons among its core objectives."
      },
      instruments: {
        fr: "Traité de 1998 (révisé 2013). La libre circulation des personnes figure parmi les objectifs fondateurs, sans protocole dédié équivalent à ceux de la CEDEAO ou de l'IGAD.",
        en: "1998 Treaty (revised 2013). Free movement of persons is listed among the founding objectives, without a dedicated protocol equivalent to those of ECOWAS or IGAD."
      },
      dynamics: {
        fr: "Score AVOI de 0,519 en 2024, au-dessus de la moyenne continentale (0,501), mais en léger recul par rapport à 2023 où elle occupait la deuxième place ex æquo avec la SADC. Le chevauchement géographique avec la CEDEAO explique une part de cette ouverture. Plusieurs membres de la CEN-SAD ont assoupli leur circulation régionale sous l'effet d'engagements pris ailleurs, plus que par une dynamique propre. La Communauté était institutionnellement en sommeil depuis le conflit libyen de 2011, son secrétariat replié à N'Djamena. Elle a rouvert son siège de Tripoli en avril 2026, devant onze ministres des Affaires étrangères des États membres. Les effets opérationnels de cette réactivation restent à observer.",
        en: "AVOI score of 0.519 in 2024, above the continental average (0.501), though slightly down from 2023 when it held joint second place with SADC. The significant geographic overlap with ECOWAS explains part of this openness: several CEN-SAD members eased regional movement due to commitments made elsewhere, more than through a dynamic specific to CEN-SAD itself. Institutionally dormant after the 2011 Libyan conflict — its secretariat having relocated to N'Djamena — the Community reopened its Tripoli headquarters in April 2026 in the presence of eleven member-state foreign ministers, a reactivation whose operational effects remain to be seen."
      },
      sources: [
        { label: "CEN-SAD — États membres et Secrétariat exécutif", url: "https://censad.int/en/who-are-we/member-states/" },
        { label: "Union africaine — Fiche CER : CEN-SAD", url: "https://au.int/en/recs/censad" },
        { label: "Xinhua — Réouverture du siège de la CEN-SAD à Tripoli (2026)", url: "https://english.news.cn/20260412/160868c2d62b40ff917e3c2b511748a0/c.html" },
      ]
    }
  ];

  // ========================================================================
  // 2. LES CADRES ET TEXTES FONDAMENTAUX DE L'UNION AFRICAINE
  // ========================================================================
  const auFrameworks = [
    {
      title: { fr: "L'Agenda 2063 & STYIP (2024-2033)", en: "Agenda 2063 & STYIP (2024-2033)" },
      tag: { fr: "Vision Téléologique", en: "Teleological Vision" },
      desc: {
        fr: "Adopté en 2015, c'est le grand parapluie stratégique de l'Union. Son Second Plan Décennal de Mise en Œuvre (STYIP) place la libre circulation au cœur du développement.",
        en: "Adopted in 2015, it is the Union's overarching strategic umbrella. Its Second Ten-Year Implementation Plan (STYIP) places free movement at the heart of development."
      },
      article: {
        ref: { fr: "Aspiration N°2 (Agenda 2063)", en: "Aspiration N°2 (Agenda 2063)" },
        textFr: "« Un continent intégré, politiquement uni, basé sur les idéaux du Panafricanisme et la vision de la Renaissance africaine. (...) L'introduction d'un passeport africain et l'abolition de l'obligation de visa pour tous les citoyens africains. »",
        textEn: "« An integrated continent, politically united and based on the ideals of Pan-Africanism and the vision of Africa’s Renaissance. (...) The introduction of an African passport and the abolition of visa requirements for all African citizens. »"
      }
    },
    {
      title: { fr: "Le Traité d'Abuja (1991)", en: "The Abuja Treaty (1991)" },
      tag: { fr: "Acte Fondateur", en: "Foundational Act" },
      badge: { fr: "En vigueur depuis le 12 mai 1994", en: "In force since 12 May 1994" },
      desc: {
        fr: "L'acte fondateur de la Communauté économique africaine (CEA). Il ancre juridiquement la libre circulation comme condition sine qua non de l'intégration des marchés.",
        en: "The founding act of the African Economic Community (AEC). It legally anchors free movement as a sine qua non condition for market integration."
      },
      article: {
        ref: { fr: "Article 43 - Chapitre VI", en: "Article 43 - Chapter VI" },
        textFr: "« Les États membres conviennent d’adopter, individuellement, à l’échelon bilatéral ou régional, les mesures nécessaires en vue de réaliser progressivement la libre circulation des personnes, et de garantir la jouissance du droit de résidence et d’établissement à leurs ressortissants. »",
        textEn: "« Member States agree to adopt, individually, at bilateral or regional levels, the necessary measures, in order to achieve progressively the free movement of persons, and to ensure the enjoyment of the right of residence and the right of establishment by their nationals. »"
      }
    },
    {
      title: { fr: "Le Protocole de Kigali (2018)", en: "The Kigali Protocol (2018)" },
      tag: { fr: "Le Droit Entravé", en: "Hindered Law" },
      stats: [{ value: 4, total: 54, threshold: 15, label: { fr: "États ayant ratifié (seuil : 15)", en: "States having ratified (threshold: 15)" } }],
      desc: {
        fr: "Le Protocole sur la Libre Circulation vise à opérationnaliser l'Art. 43 d'Abuja. Paradoxe : ratifié par 4 pays seulement (Rwanda, Sao Tomé, Mali, Niger - ces deux derniers ayant pourtant quitté la CEDEAO pour l'AES).",
        en: "The Protocol on Free Movement aims to operationalize Art. 43 of Abuja. Paradox: ratified by only 4 countries (Rwanda, Sao Tome, Mali, Niger - the latter two having nevertheless left ECOWAS for the AES)."
      },
      article: {
        ref: { fr: "Article 4 - Réalisation progressive", en: "Article 4 - Progressive Realization" },
        textFr: "« La libre circulation des personnes, le droit de résidence et le droit d'établissement sont réalisés en trois (3) phases : Première phase - Droit d'entrée; Deuxième phase - Droit de résidence; Troisième phase - Droit d'établissement. »",
        textEn: "« The free movement of persons, right of residence and right of establishment shall be achieved in three (3) phases: Phase One - Right of Entry; Phase Two - Right of Residence; Phase Three - Right of Establishment. »"
      }
    },
    {
      title: { fr: "La ZLECAf & Le 'Mode 4' (2018)", en: "AfCFTA & 'Mode 4' (2018)" },
      tag: { fr: "Le Cheval de Troie Économique", en: "Economic Trojan Horse" },
      stats: [{ value: 50, total: 54, threshold: 15, label: { fr: "États ayant ratifié (oct. 2025)", en: "States having ratified (Oct. 2025)" } }],
      desc: {
        fr: "Face au blocage politique du Protocole de Kigali, l'Accord sur la Zone de Libre-Échange force la mobilité par le prisme économique (les services), obligeant les États à laisser circuler les travailleurs qualifiés liés au commerce.",
        en: "Facing the political blockage of the Kigali Protocol, the Free Trade Area Agreement forces mobility through the economic prism (services), compelling States to allow trade-related skilled workers to circulate."
      },
      article: {
        ref: { fr: "Protocole sur le Commerce des Services - Art. 1(p)", en: "Protocol on Trade in Services - Art. 1(p)" },
        textFr: "« Fourniture d'un service par la présence de personnes physiques (Mode 4) d'un État partie sur le territoire d'un autre État partie. (...) Les États parties négocient des engagements spécifiques applicables au mouvement des personnes physiques. »",
        textEn: "« Supply of a service by the presence of natural persons (Mode 4) of a State Party in the territory of any other State Party. (...) State Parties shall negotiate specific commitments applying to the movement of natural persons. »"
      }
    },
    {
      title: { fr: "La Convention de l'OUA sur les Réfugiés (1969)", en: "The OAU Refugee Convention (1969)" },
      tag: { fr: "Asile Élargi", en: "Broadened Asylum" },
      stats: [{ value: 46, total: 54, threshold: 15, label: { fr: "États parties", en: "States parties" } }],
      desc: {
        fr: "L'Afrique a inventé une définition du réfugié plus inclusive que celle des Nations Unies (Convention de Genève, 1951), en l'étendant aux victimes de violences généralisées et non plus à la seule persécution individuelle ciblée.",
        en: "Africa pioneered a more inclusive refugee definition than the United Nations' (1951 Geneva Convention), extending it to victims of generalized violence rather than targeted individual persecution alone."
      },
      article: {
        ref: { fr: "Article 1.2 - Convention OUA 1969", en: "Article 1.2 - 1969 OAU Convention" },
        textFr: "« Le terme “réfugié” s’applique également à toute personne qui, du fait d’une agression, d’une occupation extérieure, d’une domination étrangère ou d’événements troublant gravement l’ordre public (...) est obligée de quitter sa résidence habituelle. »",
        textEn: "« The term “refugee” shall also apply to every person who, owing to external aggression, occupation, foreign domination or events seriously disturbing public order (...) is compelled to leave his place of habitual residence. »"
      }
    },
    {
      title: { fr: "La Convention de Kampala (2009)", en: "The Kampala Convention (2009)" },
      tag: { fr: "Protection des PDI", en: "IDP Protection" },
      stats: [{ value: 33, total: 54, threshold: 15, label: { fr: "États parties (fin 2021)", en: "States parties (end 2021)" } }],
      desc: {
        fr: "L'Afrique est le seul continent doté d'un traité contraignant protégeant spécifiquement les personnes déplacées internes (PDI). Entrée en vigueur le 6 décembre 2012, elle couvre les déplacements liés aux conflits, aux violences généralisées, aux violations des droits humains et aux catastrophes.",
        en: "Africa is the only continent with a binding treaty specifically protecting internally displaced persons (IDPs). It entered into force on 6 December 2012 and covers displacement linked to conflict, generalized violence, human rights violations, and disasters."
      },
      article: {
        ref: { fr: "Article 1 - Convention de Kampala", en: "Article 1 - Kampala Convention" },
        textFr: "« [Les personnes déplacées internes sont] des personnes ou groupes de personnes qui ont été forcés ou obligés de fuir ou de quitter leur foyer (...) notamment en raison d'un conflit armé, de situations de violence généralisée, de violations des droits de l'homme ou de catastrophes naturelles ou provoquées par l'homme, et qui n'ont pas franchi les frontières internationalement reconnues d'un État. »",
        textEn: "« [Internally displaced persons are] persons or groups of persons who have been forced or obliged to flee or to leave their homes (...) in particular as a result of or in order to avoid the effects of armed conflict, situations of generalized violence, violations of human rights or natural or human-made disasters, and who have not crossed an internationally recognized state border. »"
      }
    },
    {
      title: { fr: "La Déclaration de Kampala sur Migration, Environnement et Climat (2022)", en: "The Kampala Declaration on Migration, Environment and Climate Change (2022)" },
      tag: { fr: "Mobilité Climatique", en: "Climate Mobility" },
      desc: {
        fr: "Adoptée en juillet 2022 par 11 États d'Afrique de l'Est et de la Corne de l'Afrique, puis étendue à 48 pays du continent. Elle énonce 12 engagements pour répondre aux effets du changement climatique sur les mobilités humaines, en amont de tout instrument contraignant équivalent à l'échelle mondiale.",
        en: "Adopted in July 2022 by 11 East African and Horn of Africa states, later expanded to 48 countries across the continent. It sets out 12 commitments to address the effects of climate change on human mobility, ahead of any equivalent binding instrument at the global level."
      },
      article: {
        ref: { fr: "KDMECC (2022) - 12 engagements", en: "KDMECC (2022) - 12 commitments" },
        textFr: "La déclaration engage les signataires sur trois points : intégrer la mobilité liée au climat dans les stratégies nationales d'adaptation, renforcer les données sur les déplacements environnementaux, et protéger les personnes déplacées par des chocs climatiques au titre des instruments existants (Convention de Kampala, 2009).",
        en: "The declaration commits signatories in particular to mainstream climate-related mobility into national adaptation strategies, strengthen data on environmental displacement, and protect people displaced by climate shocks under existing instruments (2009 Kampala Convention)."
      }
    }
  ];

  // ========================================================================
  // 3. MATRICES ET PROFILS JURIDIQUES (54 PAYS)
  // ========================================================================
  const legalMatrixData = [
    {
      region: { fr: "Afrique Méditerranéenne", en: "Mediterranean Africa" },
      intro: { fr: "La région méditerranéenne se caractérise par des systèmes d'immigration codifiés, influencés par le droit civil (Maghreb) ou des systèmes mixtes (Égypte, Soudan). Le seuil de résidence y est strictement policé, exigeant souvent une sortie du territoire ou des démarches bureaucratiques complexes pour étendre le séjour au-delà de l'allocation touristique standard.", en: "The Mediterranean region is characterized by codified immigration systems, shaped by civil law (Maghreb) or mixed systems (Egypt, Sudan). The residence threshold is strictly policed, often requiring an exit from the territory or complex bureaucratic steps to extend a stay beyond the standard tourist allowance." },
      countries: [
        {
          name: { fr: "Algérie", en: "Algeria" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Max 180 jours/an. Carte de résident requise après 90 jours.", en: "Max 180 days/year. Resident card required after 90 days." },
          instrument: { fr: "Loi N° 08-11 du 25 juin 2008 relative aux conditions d'entrée, de séjour et de circulation des étrangers.", en: "Law N° 08-11 of 25 June 2008 on the conditions of entry, stay and movement of foreigners." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "La durée maximale de séjour autorisé à chaque entrée est de 90 jours. Cette durée peut être exceptionnellement prorogée de 90 jours supplémentaires, mais le séjour effectif cumulé ne peut excéder 180 jours par an.", en: "The maximum authorized stay per entry is 90 days. This may exceptionally be extended by a further 90 days, but the cumulative effective stay cannot exceed 180 days per year." } },
            { label: { fr: "Obligation de Résidence", en: "Residence Obligation" }, text: { fr: "Tout étranger souhaitant séjourner au-delà de la validité de son visa (ou de l'extension) doit solliciter une « Carte de Résident ». La loi opère une distinction nette entre le « visa de court séjour » et le permis de résidence. Le défaut d'obtention de la carte de résident après l'expiration du visa constitue un séjour illégal passible de sanctions pénales et administratives.", en: "Any foreigner wishing to stay beyond the validity of their visa (or its extension) must apply for a \"Resident Card\". The law draws a clear distinction between the \"short-stay visa\" and the residence permit. Failure to obtain the resident card after visa expiry constitutes an unlawful stay liable to criminal and administrative sanctions." } }
          ]
        },
        {
          name: { fr: "Égypte", en: "Egypt" },
          threshold: { fr: "30-90 Jours", en: "30-90 Days" },
          tableNotes: { fr: "Enregistrement requis sous 7 jours. Permis après expiration visa.", en: "Registration required within 7 days. Permit after visa expiry." },
          instrument: { fr: "Loi N° 89 de 1960 sur l'entrée et le séjour des étrangers (amendée par Loi 88/2005 et Loi 173/2018).", en: "Law N° 89 of 1960 on the entry and residence of foreigners (amended by Law 88/2005 and Law 173/2018)." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "Les visas touristiques standard sont généralement délivrés pour 30 jours. Toutefois, la loi catégorise la résidence en trois niveaux temporels distincts : « Spéciale », « Ordinaire » et « Temporaire ».", en: "Standard tourist visas are generally issued for 30 days. However, the law categorizes residence into three distinct time-based tiers: \"Special\", \"Ordinary\" and \"Temporary\"." } },
            { label: { fr: "Mécanisme de Transition", en: "Transition Mechanism" }, text: { fr: "Un visiteur souhaitant rester doit demander un permis de résidence temporaire (souvent valide pour 6 mois à 1 an) avant l'expiration de son visa touristique. Récemment, des décrets ont instauré une période de grâce pour la régularisation des résidents illégaux moyennant le paiement d'amendes (env. 1 000 USD), soulignant la volonté de l'État d'imposer le permis de résidence.", en: "A visitor wishing to stay must apply for a temporary residence permit (often valid 6 months to 1 year) before their tourist visa expires. Recent decrees have introduced a grace period for regularizing unlawful residents against payment of fines (approx. USD 1,000), underlining the State's intent to enforce the residence permit." } }
          ]
        },
        {
          name: { fr: "Libye", en: "Libya" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Visa de Résidence requis pour séjours > 3 mois.", en: "Residence Visa required for stays > 3 months." },
          instrument: { fr: "Loi N° 6 de 1987 organisant l'entrée, le séjour et la sortie des étrangers.", en: "Law N° 6 of 1987 organizing the entry, residence and exit of foreigners." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "Les visas d'entrée autorisent un séjour maximal de trois mois. L'article 5 de la loi classifie explicitement les visas en : entrée, transit, sortie et résidence.", en: "Entry visas authorize a maximum stay of three months. Article 5 of the law explicitly classifies visas into: entry, transit, exit and residence." } },
            { label: { fr: "Obligation d'Enregistrement", en: "Registration Obligation" }, text: { fr: "Pour séjourner au-delà de trois mois, un étranger doit obtenir un « Visa de Résidence » puis un permis. La loi impose une exigence d'enregistrement stricte : tout étranger doit s'enregistrer auprès de l'autorité des passeports la plus proche dans les sept jours suivant son arrivée. C'est l'une des fenêtres de surveillance administrative les plus étroites du continent.", en: "To stay beyond three months, a foreigner must obtain a \"Residence Visa\" and then a permit. The law imposes a strict registration requirement: every foreigner must register with the nearest passport authority within seven days of arrival — one of the narrowest administrative surveillance windows on the continent." } }
          ]
        },
        {
          name: { fr: "Maroc", en: "Morocco" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Extension possible, mais carte d'immatriculation requise > 90 jours.", en: "Extension possible, but registration card required > 90 days." },
          instrument: { fr: "Loi N° 02-03 relative à l'entrée et au séjour des étrangers au Royaume du Maroc.", en: "Law N° 02-03 on the entry and residence of foreigners in the Kingdom of Morocco." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "L'article 8 de la Loi 02-03 stipule explicitement que tout étranger souhaitant séjourner sur le territoire marocain pour une durée supérieure à 90 jours est tenu de demander une « Carte d'Immatriculation ».", en: "Article 8 of Law 02-03 explicitly states that any foreigner wishing to stay in Moroccan territory for longer than 90 days must apply for a \"Registration Card\"." } },
            { label: { fr: "Sanctions", en: "Sanctions" }, text: { fr: "Le dépassement de ce seuil de 90 jours sans dépôt de demande de carte constitue une infraction. Bien que des prolongations de visa soient possibles pour des motifs exceptionnels, la norme juridique fixe la fin du statut de simple visiteur au 90e jour.", en: "Exceeding this 90-day threshold without filing a card application constitutes an offence. While visa extensions are possible on exceptional grounds, the legal norm sets the end of simple visitor status at day 90." } }
          ]
        },
        {
          name: { fr: "Mauritanie", en: "Mauritania" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi N° 1965-046 et Décrets subséquents.", en: "Law N° 1965-046 and subsequent decrees." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "Les visas sont délivrés pour des durées de 30 à 90 jours. Un étranger désirant rester au-delà de la durée du visa doit obligatoirement solliciter une « Carte de Séjour ».", en: "Visas are issued for 30 to 90 days. A foreigner wishing to stay beyond the visa's validity must apply for a \"Residence Card\"." } },
            { label: { fr: "Réforme", en: "Reform" }, text: { fr: "Récemment, la validité de la carte de séjour a été étendue d'un an à cinq ans, facilitant la vie des résidents à long terme, mais le seuil d'entrée déclenchant cette obligation demeure l'expiration du visa court séjour. Le système « e-visa » facilite l'entrée mais ne confère aucun droit de résidence.", en: "The residence card's validity was recently extended from one year to five, easing life for long-term residents, but the triggering threshold remains the expiry of the short-stay visa. The \"e-visa\" system facilitates entry but confers no right of residence." } }
          ]
        },
        {
          name: { fr: "Tunisie", en: "Tunisia" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Carte de séjour obligatoire après 3 mois consécutifs.", en: "Residence card mandatory after 3 consecutive months." },
          instrument: { fr: "Loi N° 68-7 du 8 mars 1968 relative à la condition des étrangers.", en: "Law N° 68-7 of 8 March 1968 on the status of foreigners." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "L'article 7 précise que le visa d'entrée spécifie la durée de séjour autorisée, qui ne peut excéder trois mois.", en: "Article 7 specifies that the entry visa states the authorized length of stay, which cannot exceed three months." } },
            { label: { fr: "Obligation de Résidence", en: "Residence Obligation" }, text: { fr: "Tout étranger souhaitant séjourner plus de 3 mois consécutifs ou 6 mois au total par an doit demander une « Carte de Séjour » et un « Visa de Séjour ». La règle des 3 mois est appliquée rigoureusement, avec des pénalités hebdomadaires pour tout dépassement non régularisé à la sortie.", en: "Any foreigner wishing to stay more than 3 consecutive months, or 6 months total per year, must apply for a \"Residence Card\" and a \"Residence Visa\". The 3-month rule is strictly enforced, with weekly penalties for any overstay not regularized on exit." } }
          ]
        }
      ]
    },
    {
      region: { fr: "Afrique de l'Ouest", en: "West Africa" },
      intro: { fr: "L'Afrique de l'Ouest présente un régime d'immigration dual : l'un pour les citoyens de la CEDEAO et l'autre pour les ressortissants tiers. Le Protocole A/P.1/5/79 de la CEDEAO établit un privilège de 90 jours sans visa, qui est devenu le seuil de facto pour définir le « visiteur » dans toute la région. Reste la zone la plus intégrée avec 15 pays offrant une libre circulation totale.", en: "West Africa has a dual immigration regime: one for ECOWAS citizens, another for third-country nationals. ECOWAS Protocol A/P.1/5/79 establishes a 90-day visa-free privilege, which has become the de facto threshold defining a \"visitor\" across the region. It remains the most integrated zone, with 15 countries offering full free movement." },
      countries: [
        {
          name: { fr: "Bénin", en: "Benin" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi N° 2022-31 / Loi N° 2025-15 (Nouvelle).", en: "Law N° 2022-31 / Law N° 2025-15 (New)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les e-visas de court séjour sont disponibles pour 30 ou 90 jours.", en: "Short-stay e-visas are available for 30 or 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Tout étranger souhaitant séjourner [...] pour une période excédant 90 jours doit détenir une carte de séjour ». La nouvelle Loi 2025-15 renforce ces conditions, maintenant le seuil de 90 jours comme la ligne de démarcation entre visiteur et résident.", en: "\"Any foreigner wishing to stay [...] for a period exceeding 90 days must hold a residence card.\" The new Law 2025-15 reinforces these conditions, keeping the 90-day threshold as the dividing line between visitor and resident." } }
          ]
        },
        {
          name: { fr: "Burkina Faso", en: "Burkina Faso" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Permis de résidence requis après 90 jours.", en: "Residence permit required after 90 days." },
          instrument: { fr: "Loi 2024 (remplaçant l'Ordonnance n°84-049).", en: "2024 Law (replacing Ordinance n°84-049)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Tout étranger souhaitant séjourner au Burkina Faso pour une période excédant quatre-vingt-dix (90) jours doit détenir soit un visa long séjour, soit un permis de résidence ».", en: "\"Any foreigner wishing to stay in Burkina Faso for a period exceeding ninety (90) days must hold either a long-stay visa or a residence permit.\"" } },
            { label: { fr: "Transition", en: "Transition" }, text: { fr: "Le visa long séjour (valide 1 an) ou la « Carte de Résident » est requis immédiatement après l'expiration de la période visiteur de 90 jours. La loi de 2024 a durci les contrôles aux frontières.", en: "The long-stay visa (valid 1 year) or the \"Resident Card\" is required immediately upon expiry of the 90-day visitor period. The 2024 law tightened border controls." } }
          ]
        },
        {
          name: { fr: "Cap-Vert", en: "Cabo Verde" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Visa extensible, mais autorisation résidence nécessaire > 90 jours.", en: "Extendable visa, but residence authorization required > 90 days." },
          instrument: { fr: "Loi N° 66/VIII/2014.", en: "Law N° 66/VIII/2014." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visas touristiques permettent un séjour jusqu'à 90 jours, prolongeable une fois. Pour les citoyens exemptés de visa, l'enregistrement EASE permet 30 jours.", en: "Tourist visas allow a stay of up to 90 days, extendable once. For visa-exempt citizens, EASE registration allows 30 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Les séjours dépassant la limite du visa (90 jours) nécessitent une « Autorização de Residência ». La loi distingue strictement le « Visa » de la « Résidence ». Des changements récents facilitent l'accès pour la CPLP.", en: "Stays exceeding the visa limit (90 days) require an \"Autorização de Residência\". The law strictly distinguishes the \"Visa\" from \"Residence\". Recent changes ease access for CPLP nationals." } }
          ]
        },
        {
          name: { fr: "Côte d'Ivoire", en: "Côte d'Ivoire" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Titre de séjour obligatoire après 3 mois.", en: "Residence permit mandatory after 3 months." },
          instrument: { fr: "Loi N° 2004-303 (et Loi N° 2002-03).", en: "Law N° 2004-303 (and Law N° 2002-03)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Un permis de résidence (« Titre de Séjour ») est obligatoire pour quiconque a l'intention de séjourner plus de trois mois.", en: "A residence permit (\"Titre de Séjour\") is mandatory for anyone intending to stay more than three months." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "S'applique aux travailleurs, étudiants et dépendants. La « Carte de Résident » est valide 5 ans pour les nationaux CEDEAO et 1 an pour les autres. Le système est biométrique et exige une présence à l'Office National d'Identification.", en: "Applies to workers, students and dependents. The \"Resident Card\" is valid 5 years for ECOWAS nationals and 1 year for others. The system is biometric and requires an in-person appearance at the National Identification Office." } }
          ]
        },
        {
          name: { fr: "Gambie", en: "Gambia" },
          threshold: { fr: "28-90 Jours", en: "28-90 Days" },
          tableNotes: { fr: "Non-CEDEAO besoin permis après 56-90 jours.", en: "Non-ECOWAS nationals need a permit after 56-90 days." },
          instrument: { fr: "Immigration Act (Cap 16:02).", en: "Immigration Act (Cap 16:02)." },
          details: [
            { label: { fr: "Entrée Standard", en: "Standard Entry" }, text: { fr: "Les visiteurs reçoivent généralement un tampon de 28 jours initialement, extensible.", en: "Visitors generally receive an initial 28-day stamp, extendable." } },
            { label: { fr: "Nationaux non-CEDEAO", en: "Non-ECOWAS Nationals" }, text: { fr: "Sont tenus d'obtenir un permis de résidence (« Alien Card » + « Residential Permit B ») s'ils séjournent au-delà de 56 jours, bien que 90 jours soit souvent la limite pratique maximale pour les extensions avant l'application stricte de la résidence.", en: "Required to obtain a residence permit (\"Alien Card\" + \"Residential Permit B\") if staying beyond 56 days, although 90 days is often the practical maximum for extensions before residence is strictly enforced." } }
          ]
        },
        {
          name: { fr: "Ghana", en: "Ghana" },
          threshold: { fr: "60-90 Jours", en: "60-90 Days" },
          tableNotes: { fr: "Max 90 jours (CEDEAO). Permis résidence pour > 90 jours.", en: "Max 90 days (ECOWAS). Residence permit for > 90 days." },
          instrument: { fr: "Immigration Act, 2000 (Act 573).", en: "Immigration Act, 2000 (Act 573)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visiteurs se voient accorder un maximum de 60 jours initialement (90 jours pour la CEDEAO). Cela peut être étendu jusqu'à 90 jours.", en: "Visitors are initially granted a maximum of 60 days (90 days for ECOWAS nationals). This can be extended up to 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Tout non-Ghanéen ayant l'intention de résider pour plus de 90 jours (ou extension maximale de 6 mois) doit obtenir un permis de résidence. La résidence indéfinie est possible après 5 ans.", en: "Any non-Ghanaian intending to reside for more than 90 days (or a maximum extension of 6 months) must obtain a residence permit. Indefinite residence is possible after 5 years." } }
          ]
        },
        {
          name: { fr: "Guinée", en: "Guinea" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi L/94/019/CTRN (1994).", en: "Law L/94/019/CTRN (1994)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le « Visa de court séjour » est valide jusqu'à 90 jours.", en: "The \"short-stay visa\" is valid for up to 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Les étrangers ayant l'intention de rester plus longtemps doivent demander une « Carte de Séjour ». La validité du visa permet l'entrée, mais la carte est le document de résidence requis sur le territoire.", en: "Foreigners intending to stay longer must apply for a \"Residence Card\". The visa's validity permits entry, but the card is the required residence document within the territory." } }
          ]
        },
        {
          name: { fr: "Guinée-Bissau", en: "Guinea-Bissau" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Permis de résidence requis après 90 jours.", en: "Residence permit required after 90 days." },
          instrument: { fr: "Loi N° 2/92 (Citoyenneté) et Décret-Loi sur les Étrangers.", en: "Law N° 2/92 (Citizenship) and Decree-Law on Foreigners." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visas à l'arrivée sont valides pour un maximum de 90 jours.", en: "Visas on arrival are valid for a maximum of 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Pour les séjours dépassant cette période, une « Autorização de Residência » est requise. La loi mandate l'enregistrement pour tout séjour impliquant un établissement.", en: "For stays exceeding this period, an \"Autorização de Residência\" is required. The law mandates registration for any stay involving settlement." } }
          ]
        },
        {
          name: { fr: "Liberia", en: "Liberia" },
          threshold: { fr: "60 Jours", en: "60 Days" },
          tableNotes: { fr: "Séjour initial 60 jours. Permis résidence pour plus long.", en: "Initial 60-day stay. Residence permit for longer stays." },
          instrument: { fr: "Aliens and Nationality Law (Titre 4).", en: "Aliens and Nationality Law (Title 4)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« La période pour laquelle un visiteur étranger est autorisé à entrer au Liberia sera fixée [...] pour une période de 60 jours ».", en: "\"The period for which an alien visitor is permitted to enter Liberia shall be fixed [...] for a period of 60 days.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Ce seuil est notablement plus court que la norme régionale de 90 jours. Pour tout séjour à long terme, un « Residence Permit » est requis immédiatement à l'expiration de l'admission visiteur de 60 jours.", en: "This threshold is notably shorter than the regional 90-day norm. For any long-term stay, a \"Residence Permit\" is required immediately upon expiry of the 60-day visitor admission." } }
          ]
        },
        {
          name: { fr: "Mali", en: "Mali" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi N° 04-058 (2004).", en: "Law N° 04-058 (2004)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le « Visa Long Séjour » est requis pour les séjours excédant 90 jours.", en: "The \"Long-Stay Visa\" is required for stays exceeding 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Dès l'arrivée avec un visa long séjour (ou après 90 jours sur un visa régulier), l'étranger doit solliciter une « Carte de Séjour ». L'article 22 prévoit l'emprisonnement pour séjour sans permis.", en: "Upon arrival with a long-stay visa (or after 90 days on a regular visa), the foreigner must apply for a \"Residence Card\". Article 22 provides for imprisonment for staying without a permit." } }
          ]
        },
        {
          name: { fr: "Niger", en: "Niger" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Ordonnance N° 81-40 (1981).", en: "Ordinance N° 81-40 (1981)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les ressortissants étrangers ayant l'intention de séjourner plus de 90 jours doivent demander une « Carte de Séjour » (Permis de Résidence Temporaire).", en: "Foreign nationals intending to stay more than 90 days must apply for a \"Residence Card\" (Temporary Residence Permit)." } },
            { label: { fr: "Procédure", en: "Procedure" }, text: { fr: "Cette ordonnance reste le socle du droit de l'immigration au Niger. Les citoyens de la CEDEAO nécessitent également des cartes de séjour pour l'établissement, bien que la procédure soit simplifiée.", en: "This ordinance remains the foundation of Nigerien immigration law. ECOWAS citizens also require residence cards for settlement, though the procedure is simplified." } }
          ]
        },
        {
          name: { fr: "Nigeria", en: "Nigeria" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "CERPAC requis pour emploi ou séjour > 90 jours (non-CEDEAO).", en: "CERPAC required for employment or stay > 90 days (non-ECOWAS)." },
          instrument: { fr: "Immigration Act 2015.", en: "Immigration Act 2015." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les Visas de Court Séjour permettent aux voyageurs de visiter le Nigeria pour une période n'excédant pas trois mois (90 jours) ».", en: "\"Short-Stay Visas allow travellers to visit Nigeria for a period not exceeding three months (90 days).\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Pour l'emploi ou la résidence au-delà de 90 jours, le CERPAC est obligatoire. Une mise à jour politique de 2025 a introduit des amendes journalières (15 USD) pour les dépassements de séjour, soulignant la rigueur de la limite.", en: "For employment or residence beyond 90 days, the CERPAC is mandatory. A 2025 policy update introduced daily fines (USD 15) for overstays, underlining the strictness of the limit." } }
          ]
        },
        {
          name: { fr: "Sénégal", en: "Senegal" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte d'identité d'étranger obligatoire après 90 jours.", en: "Foreigner's ID card mandatory after 90 days." },
          instrument: { fr: "Loi N° 71-10 (1971) et Décret 71-860.", en: "Law N° 71-10 (1971) and Decree 71-860." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Pour séjourner au Sénégal plus de 90 jours, vous devez obtenir une carte nationale d'identité étrangère (Carte d'Identité d'Étranger) ».", en: "\"To stay in Senegal beyond 90 days, you must obtain a foreigner's national identity card (Carte d'Identité d'Étranger).\"" } },
            { label: { fr: "Note", en: "Note" }, text: { fr: "Ceci s'applique même aux ressortissants exemptés de visa (comme les Français ou citoyens CEDEAO). La marque des 90 jours est le déclencheur légal définitif.", en: "This applies even to visa-exempt nationals (such as French or ECOWAS citizens). The 90-day mark is the definitive legal trigger." } }
          ]
        },
        {
          name: { fr: "Sierra Leone", en: "Sierra Leone" },
          threshold: { fr: "30-90 Jours", en: "30-90 Days" },
          tableNotes: { fr: "Permis de résidence requis pour séjours > 90 jours.", en: "Residence permit required for stays > 90 days." },
          instrument: { fr: "Non-Citizens (Registration, Immigration and Expulsion) Act, 1965.", en: "Non-Citizens (Registration, Immigration and Expulsion) Act, 1965." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visas à entrer unique sont valides 90 jours à l'émission pour des visites jusqu'à un maximum de 30 jours.", en: "Single-entry visas are valid for 90 days from issuance, for visits of up to a maximum of 30 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Un Permis de Travail & Résidence doit être obtenu dans les 30 jours suivant l'arrivée » pour ceux qui ont l'intention de rester. L'un des seuils les plus courts du continent.", en: "\"A Work & Residence Permit must be obtained within 30 days of arrival\" for those intending to stay. One of the shortest thresholds on the continent." } }
          ]
        },
        {
          name: { fr: "Togo", en: "Togo" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi sur la Police des Étrangers (1987, actualisée 2022).", en: "Law on the Policing of Foreigners (1987, updated 2022)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visas touristiques sont valides jusqu'à 90 jours. « Tout étranger souhaitant séjourner [...] pour une période excédant 90 jours doit détenir une carte de séjour ».", en: "Tourist visas are valid for up to 90 days. \"Any foreigner wishing to stay [...] for a period exceeding 90 days must hold a residence card.\"" } },
            { label: { fr: "Réforme", en: "Reform" }, text: { fr: "La nouvelle loi de 2022 a renforcé les pénalités pour dépassement de séjour et rationalisé le processus de permis de résidence.", en: "The new 2022 law strengthened overstay penalties and streamlined the residence permit process." } }
          ]
        }
      ]
    },
    {
      region: { fr: "Afrique Centrale", en: "Central Africa" },
      intro: { fr: "La région CEMAC soutient théoriquement la libre circulation, mais la mise en œuvre nationale est caractérisée par une haute sécurisation. Le seuil pour les visiteurs est généralement de 90 jours, mais l'exigence de permis de résidence (souvent liée à des cautions de rapatriement) est strictement appliquée.", en: "The CEMAC zone theoretically supports free movement, but national implementation is marked by high securitization. The visitor threshold is generally 90 days, but the residence permit requirement (often tied to repatriation bonds) is strictly enforced." },
      countries: [
        {
          name: { fr: "Cameroun", en: "Cameroon" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Carte de séjour requise après 3 mois.", en: "Residence card required after 3 months." },
          instrument: { fr: "Loi N° 97/012 (1997).", en: "Law N° 97/012 (1997)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "L'article 17 stipule : « Tout étranger [...] doit, dans un délai de trois (3) mois [...] se présenter aux autorités compétentes pour solliciter une carte de séjour ».", en: "Article 17 states: \"Any foreigner [...] must, within three (3) months [...] appear before the competent authorities to apply for a residence card.\"" } },
            { label: { fr: "Mandat", en: "Mandate" }, text: { fr: "La marque des 3 mois est l'échéance statutaire pour demander une carte de séjour. Les visiteurs restant moins de ce délai sont des « visiteurs temporaires ».", en: "The 3-month mark is the statutory deadline to apply for a residence card. Visitors staying less than this period are \"temporary visitors\"." } }
          ]
        },
        {
          name: { fr: "RCA", en: "CAR" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Titre de séjour requis après 3 mois.", en: "Residence permit required after 3 months." },
          instrument: { fr: "Code de l'Immigration.", en: "Immigration Code." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les exemptions de visa (pour la CEMAC) vont jusqu'à 90 jours. Pour les autres, les visas court séjour couvrent la même période.", en: "Visa exemptions (for CEMAC nationals) run up to 90 days. For others, short-stay visas cover the same period." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« À l'arrivée, l'individu doit demander un permis de résidence (Titre de Séjour) pour tout séjour supérieur à trois mois ».", en: "\"Upon arrival, the individual must apply for a residence permit (Titre de Séjour) for any stay exceeding three months.\"" } }
          ]
        },
        {
          name: { fr: "Tchad", en: "Chad" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Carte de séjour requise après 3 mois.", en: "Residence card required after 3 months." },
          instrument: { fr: "Ordonnance N° 27-62.", en: "Ordinance N° 27-62." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Similaire aux autres États de la CEMAC, la période visiteur est plafonnée à 3 mois. « Une carte de séjour est requise pour les expatriés ».", en: "Similar to other CEMAC states, the visitor period is capped at 3 months. \"A residence card is required for expatriates.\"" } },
            { label: { fr: "Enregistrement", en: "Registration" }, text: { fr: "L'enregistrement auprès de l'immigration est requis dans les 72 heures suivant l'arrivée, une mesure de sécurité commune au Sahel.", en: "Registration with immigration authorities is required within 72 hours of arrival, a security measure common across the Sahel." } }
          ]
        },
        {
          name: { fr: "Congo (Rep)", en: "Congo (Rep.)" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Permis de résidence requis après 3 mois.", en: "Residence permit required after 3 months." },
          instrument: { fr: "Loi N° 23-96 (1996).", en: "Law N° 23-96 (1996)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les étrangers séjournant [...] devront dans les trois mois, se soumettre aux dispositions qui précèdent » (concernant la résidence).", en: "\"Foreigners staying [...] must, within three months, comply with the aforementioned provisions\" (regarding residence)." } },
            { label: { fr: "Exigence", en: "Requirement" }, text: { fr: "Un permis de résidence est obligatoire après l'expiration de la fenêtre visiteur de 3 mois.", en: "A residence permit is mandatory upon expiry of the 3-month visitor window." } }
          ]
        },
        {
          name: { fr: "RDC", en: "DR Congo" },
          threshold: { fr: "~6 Mois", en: "~6 Months" },
          tableNotes: { fr: "Visa voyage max 6 mois. Visa établissement pour résidence.", en: "Travel visa max 6 months. Settlement visa for residence." },
          instrument: { fr: "Ordonnance-Loi 83-033 relative à la Police des Étrangers.", en: "Ordinance-Law 83-033 on the Policing of Foreigners." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le « Visa de Voyage » autorise un séjour jusqu'à 6 mois. C'est toutefois la limite supérieure pour un visiteur.", en: "The \"Travel Visa\" authorizes a stay of up to 6 months. This is nonetheless the upper limit for a visitor." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Pour l'« établissement » (résidence), un « Visa d'Établissement » spécifique est requis. La RDC permet une validité de visa visiteur jusqu'à 6 mois, mais l'intention de résidence doit être déclarée plus tôt.", en: "For \"settlement\" (residence), a specific \"Settlement Visa\" is required. The DRC allows a visitor visa validity of up to 6 months, but intent to reside must be declared earlier." } }
          ]
        },
        {
          name: { fr: "Guinée Équatoriale", en: "Equatorial Guinea" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Permis de résidence requis après 90 jours.", en: "Residence permit required after 90 days." },
          instrument: { fr: "Loi Organique N° 3/2010.", en: "Organic Law N° 3/2010." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les visas de court terme sont valides pour 90 jours. Pour des séjours plus longs, vous devez vous adresser aux postes de police locaux ».", en: "\"Short-term visas are valid for 90 days. For longer stays, you must apply at local police stations.\"" } },
            { label: { fr: "Exigence", en: "Requirement" }, text: { fr: "Les permis de résidence sont requis pour tout séjour à long terme au-delà de la limite de 3 mois. Les nationaux CEMAC peuvent entrer avec une CNI, mais le seuil s'applique.", en: "Residence permits are required for any long-term stay beyond the 3-month limit. CEMAC nationals may enter with a national ID card, but the threshold still applies." } }
          ]
        },
        {
          name: { fr: "Gabon", en: "Gabon" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi N° 5/86.", en: "Law N° 5/86." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les visiteurs qui souhaitent rester dans le pays pour plus de 90 jours doivent obtenir un permis de résidence (carte de séjour) ».", en: "\"Visitors wishing to remain in the country for more than 90 days must obtain a residence permit (residence card).\"" } },
            { label: { fr: "Application", en: "Enforcement" }, text: { fr: "Stricte. Les visas de sortie ne sont plus requis pour les résidents, mais la carte de séjour est obligatoire après 3 mois.", en: "Strict. Exit visas are no longer required for residents, but the residence card is mandatory after 3 months." } }
          ]
        },
        {
          name: { fr: "Sao Tomé", en: "Sao Tome" },
          threshold: { fr: "15-30 Jours", en: "15-30 Days" },
          tableNotes: { fr: "Seuil très court. Résidence requise après 30-90 jours.", en: "Very short threshold. Residence required after 30-90 days." },
          instrument: { fr: "Loi N° 5/2008.", en: "Law N° 5/2008." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les exemptions de visa sont souvent de 15 jours. Les visas touristiques sont généralement valides pour 30 jours.", en: "Visa exemptions are often 15 days. Tourist visas are generally valid for 30 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Pour les séjours plus longs que ces courtes durées, un permis de résidence est requis. Le seuil initial de visiteur est notablement plus court que la moyenne continentale.", en: "For stays longer than these short periods, a residence permit is required. The initial visitor threshold is notably shorter than the continental average." } }
          ]
        },
        {
          name: { fr: "Angola", en: "Angola" },
          threshold: { fr: "90 Jours (Agrégé)", en: "90 Days (Aggregate)" },
          tableNotes: { fr: "30 jours par visite, max 90 jours/an.", en: "30 days per visit, max 90 days/year." },
          instrument: { fr: "Loi N° 13/19 (2019).", en: "Law N° 13/19 (2019)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visas touristiques sont valides pour 120 jours, permettant des entrées multiples pour un séjour de jusqu'à 30 jours par visite. Crucialement, le séjour total ne peut excéder 90 jours par an.", en: "Tourist visas are valid for 120 days, allowing multiple entries for stays of up to 30 days per visit. Crucially, the total stay cannot exceed 90 days per year." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Les permis de résidence sont requis pour l'établissement au-delà de cette limite agrégée.", en: "Residence permits are required for settlement beyond this aggregate limit." } }
          ]
        },
        {
          name: { fr: "Burundi", en: "Burundi" },
          threshold: { fr: "30 Jours (extensible)", en: "30 Days (extendable)" },
          tableNotes: { fr: "Permis de résidence généralement requis après 3 mois.", en: "Residence permit generally required after 3 months." },
          instrument: { fr: "Loi N° 1/13 (2011).", en: "Law N° 1/13 (2011)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les voyageurs obtiennent un visa de 30 jours à l'arrivée. Ceci peut être étendu. « Ceux qui restent plus de 30 jours peuvent aussi demander un visa de trois mois [...] Permis de résidence requis pour plus longtemps ».", en: "Travellers obtain a 30-day visa on arrival. This can be extended. \"Those staying more than 30 days may also apply for a three-month visa [...] A residence permit is required for longer stays.\"" } },
            { label: { fr: "Limite", en: "Limit" }, text: { fr: "Le plafond visiteur est généralement fixé à 3 mois avant que le permis de résidence ne devienne nécessaire.", en: "The visitor cap is generally set at 3 months before a residence permit becomes necessary." } }
          ]
        },
        {
          name: { fr: "Rwanda", en: "Rwanda" },
          threshold: { fr: "30-90 Jours", en: "30-90 Days" },
          tableNotes: { fr: "Permis requis après 30/90 jours selon origine.", en: "Permit required after 30/90 days depending on origin." },
          instrument: { fr: "Loi N° 57/2018.", en: "Law N° 57/2018." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "30 jours pour beaucoup de nationaux ; 90 jours pour les accords spécifiques (ex: CAE, UA).", en: "30 days for many nationals; 90 days under specific agreements (e.g. EAC, AU)." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Permis de résidence temporaire [...] période de grâce de 15 jours à l'arrivée [...] pour postuler ». Les visiteurs purs peuvent rester jusqu'à la validité de leur visa.", en: "\"Temporary residence permit [...] 15-day grace period upon arrival [...] to apply.\" Pure visitors may stay until their visa's validity expires." } }
          ]
        }
      ]
    },
    {
      region: { fr: "Afrique de l'Est", en: "East Africa" },
      intro: { fr: "La Communauté d'Afrique de l'Est (CAE) fournit un cadre robuste pour le mouvement, mais des lois nationales distinctes s'appliquent aux non-citoyens de la CAE. Le seuil est généralement de 90 jours, avec des allocations spécifiques (souvent 6 mois) pour les visiteurs régionaux. Forte progression de la réciprocité, notamment entre la RDC, l'Ouganda et le Sud-Soudan.", en: "The East African Community (EAC) provides a robust framework for movement, but distinct national laws apply to non-EAC citizens. The threshold is generally 90 days, with specific allowances (often 6 months) for regional visitors. Strong progress on reciprocity, notably between the DRC, Uganda and South Sudan." },
      countries: [
        {
          name: { fr: "Comores", en: "Comoros" },
          threshold: { fr: "45 Jours", en: "45 Days" },
          tableNotes: { fr: "Visa à l'arrivée 45 jours. Permis résidence pour plus long.", en: "45-day visa on arrival. Residence permit for longer stays." },
          instrument: { fr: "Loi N° 88-025 (1988).", en: "Law N° 88-025 (1988)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le visa à l'arrivée est valide pour 45 jours.", en: "The visa on arrival is valid for 45 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Tout étranger souhaitant rester au-delà de cette période doit demander un permis de résidence. C'est une durée spécifique à l'archipel, légèrement plus courte que les 90 jours standards.", en: "Any foreigner wishing to stay beyond this period must apply for a residence permit. This is an archipelago-specific duration, slightly shorter than the standard 90 days." } }
          ]
        },
        {
          name: { fr: "Djibouti", en: "Djibouti" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de séjour requise après 90 jours.", en: "Residence card required after 90 days." },
          instrument: { fr: "Loi N° 201/AN/07.", en: "Law N° 201/AN/07." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« La loi sur l'immigration djiboutienne permet aux visiteurs d'entrer et de rester pour 90 jours avec un eVisa ».", en: "\"Djiboutian immigration law allows visitors to enter and stay for 90 days with an eVisa.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Ceux souhaitant rester plus de 90 jours doivent travailler avec les autorités pour ajuster leur statut » (Carte de Séjour).", en: "\"Those wishing to stay longer than 90 days must work with the authorities to adjust their status\" (Residence Card)." } }
          ]
        },
        {
          name: { fr: "Érythrée", en: "Eritrea" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Permis de résidence requis après 3-6 mois.", en: "Residence permit required after 3-6 months." },
          instrument: { fr: "Proclamation N° 24/1992.", en: "Proclamation N° 24/1992." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Un visa touristique [...] peut permettre au titulaire de rester en Érythrée pendant les trois mois ».", en: "\"A tourist visa [...] may allow the holder to stay in Eritrea for the three months.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Tout étranger qui [...] a séjourné pour pas plus de six mois doit demander un permis de résidence ». Bien que le visa touristique soit de 3 mois, la date limite absolue pour la résidence semble être de 6 mois.", en: "\"Any foreigner who [...] has stayed for no more than six months must apply for a residence permit.\" While the tourist visa is 3 months, the absolute deadline for residence appears to be 6 months." } }
          ]
        },
        {
          name: { fr: "Éthiopie", en: "Ethiopia" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "ID de Résidence requise après 90 jours.", en: "Residence ID required after 90 days." },
          instrument: { fr: "Immigration Proclamation N° 354/2003.", en: "Immigration Proclamation N° 354/2003." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Lese-visas touristiques sont émis pour 30 ou 90 jours.", en: "Tourist e-visas are issued for 30 or 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Tout étranger qui [...] a l'intention de rester pour plus de quatre-vingt-dix jours [...] doit s'enregistrer dans les trente jours suivant son arrivée ». La marque des 90 jours est le seuil critique.", en: "\"Any foreigner who [...] intends to stay for more than ninety days [...] must register within thirty days of arrival.\" The 90-day mark is the critical threshold." } }
          ]
        },
        {
          name: { fr: "Kenya", en: "Kenya" },
          threshold: { fr: "90 Jours (extensible)", en: "90 Days (extendable)" },
          tableNotes: { fr: "Max 6 mois pass visiteur. Permis requis ensuite.", en: "Max 6 months visitor pass. Permit required thereafter." },
          instrument: { fr: "Kenya Citizenship and Immigration Act 2011.", en: "Kenya Citizenship and Immigration Act 2011." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Un pass visiteur est valide pour 3 mois initialement. Il peut être étendu pour 3 autres mois. La période agrégée maximale est de 6 mois.", en: "A visitor's pass is initially valid for 3 months. It can be extended for a further 3 months. The maximum aggregate period is 6 months." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Au-delà de 6 mois, un Permis (Classe K, etc.) est strictement requis. La transition de Visiteur à Résident doit se produire avant le plafond de 6 mois.", en: "Beyond 6 months, a Permit (Class K, etc.) is strictly required. The transition from Visitor to Resident must occur before the 6-month cap." } }
          ]
        },
        {
          name: { fr: "Madagascar", en: "Madagascar" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Carte de résident requise après 3 mois.", en: "Resident card required after 3 months." },
          instrument: { fr: "Loi N° 62-006 (1962).", en: "Law N° 62-006 (1962)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les étrangers entrant à Madagascar pour une période n'excédant pas trois mois sont des non-immigrants ».", en: "\"Foreigners entering Madagascar for a period not exceeding three months are non-immigrants.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Les étrangers séjournant [...] durant une période supérieure à trois mois sont des immigrants ». Ainsi, le seuil de résidence est de 3 mois.", en: "\"Foreigners staying [...] for a period exceeding three months are immigrants.\" The residence threshold is thus 3 months." } }
          ]
        },
        {
          name: { fr: "Maurice", en: "Mauritius" },
          threshold: { fr: "90-180 Jours", en: "90-180 Days" },
          tableNotes: { fr: "Max 180 jours/an touriste. Permis pour plus long/travail.", en: "Max 180 tourist days/year. Permit for longer stays/work." },
          instrument: { fr: "Immigration Act 2022.", en: "Immigration Act 2022." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Les visas touristiques permettent un séjour cumulatif de 180 jours par an. Toutefois, une visite unique est souvent plafonnée à 90 jours.", en: "Tourist visas allow a cumulative stay of 180 days per year. However, a single visit is often capped at 90 days." } },
            { label: { fr: "Premium Visa", en: "Premium Visa" }, text: { fr: "Maurice a introduit un « Premium Visa » permettant un séjour d'1 an pour les nomades numériques. Les permis de résidence standards sont pour l'emploi/investissement.", en: "Mauritius introduced a \"Premium Visa\" allowing a 1-year stay for digital nomads. Standard residence permits are for employment/investment." } }
          ]
        },
        {
          name: { fr: "Seychelles", en: "Seychelles" },
          threshold: { fr: "3 Mois", en: "3 Months" },
          tableNotes: { fr: "Permis visiteur extensible jusqu'à 12 mois.", en: "Visitor permit extendable up to 12 months." },
          instrument: { fr: "Immigration Decree 1979.", en: "Immigration Decree 1979." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Un permis visiteur est valide pour 3 mois initialement.", en: "A visitor's permit is initially valid for 3 months." } },
            { label: { fr: "Extension", en: "Extension" }, text: { fr: "Il peut être étendu par tranches de 3 mois jusqu'à un maximum de 12 mois. On peut rester « visiteur » jusqu'à un an, mais cela exige une extension active.", en: "It can be extended in 3-month increments up to a maximum of 12 months. One can remain a \"visitor\" for up to a year, but this requires active extension." } }
          ]
        },
        {
          name: { fr: "Somalie", en: "Somalia" },
          threshold: { fr: "30 Jours", en: "30 Days" },
          tableNotes: { fr: "Permis de résidence requis pour plus long.", en: "Residence permit required for longer stays." },
          instrument: { fr: "Immigration Law 1966.", en: "Immigration Law 1966." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le visa à l'arrivée est valide pour 30 jours.", en: "The visa on arrival is valid for 30 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Les visas long terme ont une durée qui excède 90 jours [...] les détenteurs de ces types de visas reçoivent la résidence ». La limite visiteur est très courte.", en: "\"Long-term visas have a duration exceeding 90 days [...] holders of these visa types receive residence.\" The visitor limit is very short." } }
          ]
        },
        {
          name: { fr: "Soudan", en: "Sudan" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Enregistrement étranger requis après 3 mois.", en: "Foreigner registration required after 3 months." },
          instrument: { fr: "Passports and Immigration Act de 1994.", en: "Passports and Immigration Act of 1994." },
          details: [
            { label: { fr: "Analyse Juridique", en: "Legal Analysis" }, text: { fr: "La loi dispose qu'« aucun visa n'est requis pour les visiteurs qui ne restent pas au Soudan plus de trois mois ».", en: "The law provides that \"no visa is required for visitors who do not remain in Sudan for more than three months.\"" } },
            { label: { fr: "Obligation de Résidence", en: "Residence Obligation" }, text: { fr: "La section 25 impose que « tout étranger résidant au Soudan pour plus de trois mois doit s'adresser à l'officier d'enregistrement [...] pour se faire enregistrer ». De plus, les étrangers doivent signaler leur présence dans les 3 jours suivant l'arrivée.", en: "Section 25 requires that \"any foreigner residing in Sudan for more than three months must apply to the registration officer [...] to be registered.\" Foreigners must also report their presence within 3 days of arrival." } }
          ]
        },
        {
          name: { fr: "Soudan du Sud", en: "South Sudan" },
          threshold: { fr: "90 Jours (3 Mois)", en: "90 Days (3 Months)" },
          tableNotes: { fr: "Permis de résidence requis après 3 mois.", en: "Residence permit required after 3 months." },
          instrument: { fr: "Passports and Immigration Act, 2011.", en: "Passports and Immigration Act, 2011." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les touristes séjournant pour une période n'excédant pas trois mois au Nouveau Soudan sont exemptés de prendre des permis de résidence ».", en: "\"Tourists staying for a period not exceeding three months in New Sudan are exempted from obtaining residence permits.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Permis de résidence requis strictement après 3 mois.", en: "Residence permit strictly required after 3 months." } }
          ]
        },
        {
          name: { fr: "Tanzanie", en: "Tanzania" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Permis de Résidence requis après 90 jours.", en: "Residence Permit required after 90 days." },
          instrument: { fr: "Immigration Act 1995 (Cap 54).", en: "Immigration Act 1995 (Cap 54)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« La validité du Pass Visiteur n'excédera pas 90 jours ».", en: "\"The validity of the Visitor's Pass shall not exceed 90 days.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Tout séjour au-delà de 90 jours nécessite un Permis de Résidence (Classe A, B, ou C).", en: "Any stay beyond 90 days requires a Residence Permit (Class A, B, or C)." } }
          ]
        },
        {
          name: { fr: "Ouganda", en: "Uganda" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Special Pass ou Entry Permit requis après 90 jours.", en: "Special Pass or Entry Permit required after 90 days." },
          instrument: { fr: "Citizenship and Immigration Control Act (Cap 66).", en: "Citizenship and Immigration Control Act (Cap 66)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Un étranger en possession d'un pass visiteur valide ou spécial dont la période de séjour n'excède pas quatre-vingt-dix jours » est exempté de l'enregistrement des étrangers.", en: "\"A foreigner in possession of a valid visitor's or special pass whose period of stay does not exceed ninety days\" is exempt from alien registration." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Les séjours au-delà de 90 jours nécessitent généralement un Special Pass (pour courtes extensions) ou un Entry Permit (Travail/Résidence).", en: "Stays beyond 90 days generally require a Special Pass (for short extensions) or an Entry Permit (Work/Residence)." } }
          ]
        }
      ]
    },
    {
      region: { fr: "Afrique Australe", en: "Southern Africa" },
      intro: { fr: "La région de la SADC se caractérise par un calcul « jours par an » pour les visiteurs. Contrairement à d'autres régions où une sortie et réentrée (« border run ») réinitialise le compteur de 90 jours, les pays de la SADC comme l'Afrique du Sud et le Botswana appliquent souvent une limite annuelle agrégée pour empêcher la résidence de fait.", en: "The SADC region is characterized by a \"days per year\" calculation for visitors. Unlike other regions where an exit-and-re-entry (\"border run\") resets the 90-day counter, SADC countries such as South Africa and Botswana often apply an aggregate annual cap to prevent de facto residence." },
      countries: [
        {
          name: { fr: "Botswana", en: "Botswana" },
          threshold: { fr: "90 Jours (Agrégé)", en: "90 Days (Aggregate)" },
          tableNotes: { fr: "Limite stricte de 90 jours par année civile.", en: "Strict 90-day limit per calendar year." },
          instrument: { fr: "Immigration Act 2011.", en: "Immigration Act 2011." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Un non-citoyen [...] ne restera pas au Botswana pour plus de 90 jours au total dans une année quelconque ».", en: "\"A non-citizen [...] shall not remain in Botswana for more than 90 days in aggregate in any given year.\"" } },
            { label: { fr: "Limite Stricte", en: "Strict Limit" }, text: { fr: "Rester au-delà de 90 jours dans une année civile est strictement interdit sans un permis de résidence ou une dérogation spéciale.", en: "Staying beyond 90 days in a calendar year is strictly prohibited without a residence permit or special exemption." } }
          ]
        },
        {
          name: { fr: "Eswatini", en: "Eswatini" },
          threshold: { fr: "60 Jours", en: "60 Days" },
          tableNotes: { fr: "30 jours + 30 extension. Permis résidence après 60 jours.", en: "30 days + 30-day extension. Residence permit after 60 days." },
          instrument: { fr: "Immigration Act 1982.", en: "Immigration Act 1982." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "L'entrée sans visa (ou visa à l'arrivée) est typiquement pour 30 jours. Elle peut être étendue pour 30 autres jours.", en: "Visa-free (or on-arrival visa) entry is typically for 30 days. It can be extended for a further 30 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Si vous voulez rester plus de 60 jours, vous devez demander un permis de résidence temporaire ». C'est plus serré que la norme de 90 jours.", en: "\"If you want to stay longer than 60 days, you must apply for a temporary residence permit.\" This is tighter than the 90-day norm." } }
          ]
        },
        {
          name: { fr: "Lesotho", en: "Lesotho" },
          threshold: { fr: "44-90 Jours", en: "44-90 Days" },
          tableNotes: { fr: "Permis de résidence requis après 90 jours.", en: "Residence permit required after 90 days." },
          instrument: { fr: "Aliens Control Act 1966.", en: "Aliens Control Act 1966." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les visiteurs avec un visa à entrer unique [...] peuvent rester pour une période maximale de 44 jours ». Des permis temporaires peuvent être émis jusqu'à 90 jours.", en: "\"Visitors with a single-entry visa [...] may stay for a maximum period of 44 days.\" Temporary permits may be issued for up to 90 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Les séjours au-delà de la limite du permis temporaire (90 jours) exigent un permis de résidence.", en: "Stays beyond the temporary permit limit (90 days) require a residence permit." } }
          ]
        },
        {
          name: { fr: "Malawi", en: "Malawi" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Permis Résidence Temporaire requis après 90 jours.", en: "Temporary Residence Permit required after 90 days." },
          instrument: { fr: "Immigration Act (Cap 15:03).", en: "Immigration Act (Cap 15:03)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le permis visiteur est valide pour 30 jours, extensible pour 60 jours (Total 90).", en: "The visitor's permit is valid for 30 days, extendable for 60 days (total 90)." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Délivré à un visiteur [...] qui a résidé au Malawi pour le maximum de 90 jours [...] Un Permis de Résidence Temporaire » est alors requis.", en: "\"Issued to a visitor [...] who has resided in Malawi for the maximum of 90 days [...] A Temporary Residence Permit\" is then required." } }
          ]
        },
        {
          name: { fr: "Mozambique", en: "Mozambique" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Nouvelle loi permet 90 jours. Résidence (DIRE) pour plus long.", en: "New law allows 90 days. Residence (DIRE) for longer stays." },
          instrument: { fr: "Loi N° 23/2022 (Nouvelle Loi Immigration).", en: "Law N° 23/2022 (New Immigration Law)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Les citoyens étrangers avec un visa touristique peuvent maintenant rester dans le pays pour une période de 90 jours, continus ou interrompus durant 12 mois ».", en: "\"Foreign nationals with a tourist visa may now stay in the country for a period of 90 days, continuous or interrupted, within 12 months.\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "« Le Permis de Résidence Temporaire du Mozambique est requis pour les nationaux étrangers qui ont l'intention de rester [...] pour plus de trois mois ».", en: "\"Mozambique's Temporary Residence Permit is required for foreign nationals intending to stay [...] for more than three months.\"" } }
          ]
        },
        {
          name: { fr: "Namibie", en: "Namibia" },
          threshold: { fr: "90 Jours (Agrégé)", en: "90 Days (Aggregate)" },
          tableNotes: { fr: "Limite stricte de 90 jours par année civile.", en: "Strict 90-day limit per calendar year." },
          instrument: { fr: "Immigration Control Act 7 of 1993.", en: "Immigration Control Act 7 of 1993." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Le maximum de quatre-vingt-dix (90) jours par an pour visite peut être pris en une fois ou en partie ».", en: "\"The maximum of ninety (90) days per year for a visit may be taken all at once or in parts.\"" } },
            { label: { fr: "Limite Stricte", en: "Strict Limit" }, text: { fr: "Similaire au Botswana, la limite annuelle de 90 jours est strictement appliquée pour empêcher le tourisme perpétuel.", en: "Similar to Botswana, the 90-day annual limit is strictly enforced to prevent perpetual tourism." } }
          ]
        },
        {
          name: { fr: "Afrique du Sud", en: "South Africa" },
          threshold: { fr: "90 Jours (+90 ext)", en: "90 Days (+90 ext)" },
          tableNotes: { fr: "Max 180 jours. Visa Résidence requis pour > 3 mois.", en: "Max 180 days. Residence Visa required for > 3 months." },
          instrument: { fr: "Immigration Act 13 of 2002.", en: "Immigration Act 13 of 2002." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "Le visa visiteur est valide pour 90 jours. Il peut être étendu une fois pour 90 autres jours (Total 180).", en: "The visitor's visa is valid for 90 days. It can be extended once for a further 90 days (total 180)." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Pour des séjours excédant 3 mois (qui ne sont pas de simples extensions touristiques) ou 3 ans (visa visiteur long séjour), un Visa de Résidence Temporaire (TRV) est requis.", en: "For stays exceeding 3 months (that are not simple tourist extensions) or 3 years (long-stay visitor visa), a Temporary Residence Visa (TRV) is required." } }
          ]
        },
        {
          name: { fr: "Zambie", en: "Zambia" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Visiting Permit pour > 90 jours.", en: "Visiting Permit for > 90 days." },
          instrument: { fr: "Immigration and Deportation Act 2010.", en: "Immigration and Deportation Act 2010." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Tous les visiteurs ordinaires et touristes ont droit à une visite gratuite de quatre-vingt-dix (90) jours dans toute période de douze (12) mois ». Les visiteurs d'affaires sont limités à 30 jours.", en: "\"All ordinary visitors and tourists are entitled to a free ninety (90) day visit within any twelve (12) month period.\" Business visitors are limited to 30 days." } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Pour rester plus longtemps, il faut demander un « Visiting Permit » (valide 3 mois, jusqu'à 9 mois total) ou un Permis de Résidence.", en: "To stay longer, one must apply for a \"Visiting Permit\" (valid 3 months, up to 9 months total) or a Residence Permit." } }
          ]
        },
        {
          name: { fr: "Zimbabwe", en: "Zimbabwe" },
          threshold: { fr: "90 Jours", en: "90 Days" },
          tableNotes: { fr: "Max 90 jours touriste. Permis requis ensuite.", en: "Max 90 tourist days. Permit required thereafter." },
          instrument: { fr: "Immigration Act (Chapitre 4:02).", en: "Immigration Act (Chapter 4:02)." },
          details: [
            { label: { fr: "Analyse", en: "Analysis" }, text: { fr: "« Vous pouvez demander 2 extensions consécutives (pour un total de 90 jours) ».", en: "\"You may apply for 2 consecutive extensions (for a total of 90 days).\"" } },
            { label: { fr: "Obligation", en: "Obligation" }, text: { fr: "Les séjours au-delà de 90 jours exigent un permis (Étudiant, Emploi, ou Résidence).", en: "Stays beyond 90 days require a permit (Student, Employment, or Residence)." } }
          ]
        }
      ]
    }
  ];

  const exportRecsCSV = () => {
    const rows = recsList.map(r => ({
      rec_id: r.id, name_fr: r.name.fr, name_en: r.name.en,
      founded: r.founded, headquarters: r.hq?.fr,
      avoi_0_1: r.avoi,
      member_states: Object.values(countryRecAffiliations).filter(a => a.includes(r.id)).length,
      members_iso2: Object.entries(countryRecAffiliations).filter(([, a]) => a.includes(r.id)).map(([iso]) => iso).join(' | '),
      key_instruments_fr: r.instruments?.fr,
      dynamics_fr: r.dynamics?.fr,
      sources: (r.sources || []).map(s => s.url).join(' | '),
    }));
    downloadCSV('souths_recs.csv', toCSV(rows));
  };

  const exportLegalMatrixCSV = () => {
    const rows = legalMatrixData.flatMap(reg => reg.countries.map(c => ({
      region_fr: reg.region.fr, region_en: reg.region.en,
      country_fr: c.name.fr, country_en: c.name.en,
      visitor_threshold_fr: c.threshold.fr, visitor_threshold_en: c.threshold.en,
      legal_instrument_fr: c.instrument?.fr,
      table_notes_fr: c.tableNotes?.fr,
      visa_open_to_all_africa: opennessByName(c.name.fr)?.tier || '',
    })));
    downloadCSV('souths_legal_matrix.csv', toCSV(rows));
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader
        badge={text.headers.governance.badge}
        plate={"Pl. VI"}
        plain={text.headers.governance.plain}
        lang={lang}
        title={text.headers.governance.title}
        highlight={text.headers.governance.highlight}
        desc={text.headers.governance.desc}
        icon={Landmark}
      />

      <div className="flex flex-wrap justify-end gap-2 print:hidden">
        <CsvButton onClick={exportRecsCSV} label={lang === 'fr' ? "CER (CSV)" : "RECs (CSV)"} />
        <CsvButton onClick={exportLegalMatrixCSV} label={lang === 'fr' ? "Matrice juridique (CSV)" : "Legal matrix (CSV)"} />
        <button onClick={() => window.print()} className="flex items-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:text-indigo-700 hover:border-indigo-300 px-4 py-2 rounded-sm text-xs font-bold transition-colors shadow-sm">
          <Printer className="w-3.5 h-3.5" /> <span>{lang === 'fr' ? "Exporter cette section (PDF)" : "Export this section (PDF)"}</span>
        </button>
      </div>

      <section className="bg-slate-50 rounded-xl p-6 md:p-8 shadow-sm">
        
        {/* Sommaire : trois familles, six entrees, chacune annoncant son contenu. */}
        <nav className="bg-white border border-slate-200 mb-8" aria-label={lang === 'fr' ? "Sommaire de la section" : "Section contents"}>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {[
              {
                icon: Globe,
                family: lang === 'fr' ? "Cadres mondiaux" : "Global frameworks",
                items: [
                  { id: 'sdgs', label: lang === 'fr' ? "ODD — Agenda 2030" : "SDGs — 2030 Agenda",
                    hint: lang === 'fr' ? "6 cibles liées aux mobilités, et l'Agenda 2063 en regard" : "6 mobility-linked targets, with Agenda 2063 alongside" },
                  { id: 'gcm', label: lang === 'fr' ? "Pacte mondial — Migrations" : "Global Compact — Migration",
                    hint: lang === 'fr' ? "23 objectifs, et la Position africaine commune" : "23 objectives, and the Common African Position" },
                  { id: 'gcr', label: lang === 'fr' ? "Pacte mondial — Réfugiés" : "Global Compact — Refugees",
                    hint: lang === 'fr' ? "Partage des charges, lu depuis la Convention de 1969" : "Responsibility-sharing, read from the 1969 Convention" },
                ],
              },
              {
                icon: MapIcon,
                family: lang === 'fr' ? "Cadres africains" : "African frameworks",
                items: [
                  { id: 'au', label: lang === 'fr' ? "Union africaine" : "African Union",
                    hint: lang === 'fr' ? "Traités, organes politiques et 5 agences spécialisées" : "Treaties, political organs and 5 specialized agencies" },
                  { id: 'recs', label: lang === 'fr' ? "Communautés économiques régionales" : "Regional Economic Communities",
                    hint: lang === 'fr' ? "8 CER, ouverture comparée et instruments propres" : "8 RECs, compared openness and their own instruments" },
                ],
              },
              {
                icon: Scale,
                family: lang === 'fr' ? "États juridiques" : "Legal frameworks",
                items: [
                  { id: 'matrix', label: lang === 'fr' ? "Entrées & séjours" : "Entry & residence",
                    hint: lang === 'fr' ? "Les 54 pays : seuils légaux, instruments, ouverture" : "All 54 countries: legal thresholds, instruments, openness" },
                ],
              },
            ].map((group, gi) => {
              const FamilyIcon = group.icon;
              return (
                <div key={gi} className="p-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    <FamilyIcon className="w-3 h-3" />
                    <span>{group.family}</span>
                  </div>
                  <ul className="space-y-1">
                    {group.items.map(item => {
                      const isActive = activeSdgzTab === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => setActiveSdgzTab(item.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className="gov-subnav w-full text-left px-3 py-2.5 border"
                          >
                            <span className="gov-subnav-label block text-xs font-semibold leading-snug">{item.label}</span>
                            <span className="gov-subnav-hint block text-[10px] leading-snug mt-0.5">
                              {item.hint}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>

        {/* ============================================================== */}
        {/* Rendu des Onglets Globaux (ODD, GCM, GCR) */}
        {/* ============================================================== */}
        {activeSdgzTab === 'sdgs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed">{text.sdg_section.sdg_desc}</p>
              <a href="https://www.un.org/sustainabledevelopment/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {text.sdg_section.sdg_points.map((pt, idx) => (
                <div key={idx} className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm flex gap-4">
                  {sdgIcons[pt.goal] && (
                    <img src={sdgIcons[pt.goal]} alt={`SDG ${pt.goal}`} className="w-14 h-14 rounded-md shrink-0 shadow-sm" />
                  )}
                  <div>
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-1">{lang === 'fr' ? "Cible ONU" : "UN Target"}</span>
                    <h4 className="font-serif font-bold text-slate-900 text-base mb-2">{pt.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <AfricanCounterpoint
              lang={lang}
              kicker={lang === 'fr' ? "Le pendant africain" : "The African counterpart"}
              title={lang === 'fr'
                ? "L'Agenda 2063 : l'Afrique s'est dotée de son propre horizon, et il est plus ancien que 2030"
                : "Agenda 2063: Africa set its own horizon, and it predates 2030"}
              sources={[
                { label: lang === 'fr'
                    ? "Union africaine — Projets phares de l'Agenda 2063 (liste officielle des 15 projets)"
                    : "African Union — Agenda 2063 Flagship Projects (official list of the 15 projects)",
                  url: "https://au.int/en/agenda2063/flagship-projects" },
                { label: lang === 'fr'
                    ? "Union africaine — « African Union Passport Launched during Opening of 27th AU Summit in Kigali » (communiqué, 17 juillet 2016)"
                    : "African Union — \"African Union Passport Launched during Opening of 27th AU Summit in Kigali\" (press release, 17 July 2016)",
                  url: "https://au.int/en/pressreleases/20160717/african-union-passport-launched-during-opening-27th-au-summit-kigali" },
                { label: lang === 'fr'
                    ? "AUDA-NEPAD — agence de mise en œuvre de l'Agenda 2063"
                    : "AUDA-NEPAD — implementing agency for Agenda 2063",
                  url: "https://www.nepad.org/" },
              ]}
            >
              <p className="text-justify">
                {lang === 'fr'
                  ? "Adopté en 2015, l'Agenda 2063 suit son calendrier propre, sur cinquante ans, indépendamment de l'Agenda 2030. Sa deuxième aspiration vise « un continent intégré, politiquement uni, fondé sur les idéaux du panafricanisme et la vision de la renaissance africaine ». La mobilité n'y est pas un chapitre parmi d'autres — elle est l'un des quinze projets phares."
                  : "Adopted in 2015, Agenda 2063 runs on its own fifty-year horizon, independently of Agenda 2030. Its second aspiration is \"an integrated continent, politically united, based on the ideals of Pan-Africanism and the vision of Africa's Renaissance\". Mobility is not one chapter among others there — it is one of the fifteen flagship projects."}
              </p>

              <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  {lang === 'fr' ? "Projet phare n° 4 sur 15" : "Flagship project no. 4 of 15"}
                </h4>
                <h5 className="font-serif font-bold text-slate-900 mb-2">
                  {lang === 'fr' ? "Le passeport africain et la libre circulation des personnes" : "The African Passport and Free Movement of People"}
                </h5>
                <p className="text-[13px] text-slate-600 italic leading-relaxed">
                  {lang === 'fr'
                    ? "« Lever les restrictions à la capacité des Africains de voyager, travailler et vivre sur leur propre continent. L'initiative vise à transformer les législations africaines, qui restent globalement restrictives sur la circulation des personnes malgré les engagements politiques d'abaisser les frontières. » (formulation officielle de l'UA)"
                    : "\"Remove restrictions on Africans ability to travel, work and live within their own continent. The initiative aims at transforming Africa's laws, which remain generally restrictive on movement of people despite political commitments to bring down borders.\" (official AU wording)"}
                </p>
              </div>

              <CounterpointFacts items={[
                { when: "2014", what: lang === 'fr'
                    ? "Le projet de passeport continental est arrêté comme projet phare de l'Agenda 2063."
                    : "The continental passport is agreed as an Agenda 2063 flagship project." },
                { when: lang === 'fr' ? "17 juil. 2016" : "17 July 2016", what: lang === 'fr'
                    ? "Lancement du passeport de l'UA à l'ouverture du 27e Sommet, à Kigali : les premiers exemplaires sont remis au président en exercice Idriss Déby Itno et au président Paul Kagame par la présidente de la Commission Nkosazana Dlamini-Zuma."
                    : "The AU passport is launched at the opening of the 27th Summit in Kigali: the first copies are handed to AU Chairperson Idriss Déby Itno and President Paul Kagame by AUC Chairperson Nkosazana Dlamini-Zuma." },
                { when: "2018", what: lang === 'fr'
                    ? "Le Protocole sur la libre circulation des personnes est adopté à Kigali — c'est lui qui doit donner au passeport sa portée juridique."
                    : "The Protocol on Free Movement of Persons is adopted in Kigali — it is what would give the passport its legal reach." },
              ]} />

              <p className="text-justify">
                {lang === 'fr'
                  ? "C'est ici que le geste symbolique et l'ancrage juridique se séparent. Le passeport a été lancé en 2016 ; le Protocole censé le rendre opposable comptait 4 ratifications sur 54 lors de la dernière vérification, très loin des 15 requises pour son entrée en vigueur. L'Agenda 2063 n'échoue donc pas faute de vision ni faute de texte : il bute sur le pas de porte des administrations nationales (Ben Mokhtar, 2026)."
                  : "This is where the symbolic gesture and the legal anchor part ways. The passport was launched in 2016; the Protocol meant to make it enforceable stood at 4 ratifications out of 54 at last check, far from the 15 required for entry into force. Agenda 2063 is therefore not failing for want of vision or of text: it stalls on the doorstep of national administrations (Ben Mokhtar, 2026)."}
              </p>
            </AfricanCounterpoint>
          </div>
        )}

        {activeSdgzTab === 'gcm' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed">{text.sdg_section.gcm_desc}</p>
              <a href="https://www.iom.int/global-compact-migration" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <AfricanCounterpoint
              lang={lang}
              accent="var(--accent-2)"
              kicker={lang === 'fr' ? "Clef de lecture" : "How to read it"}
              title={lang === 'fr'
                ? "Ce que le Pacte est, et ce qu'il n'est pas"
                : "What the Compact is, and what it is not"}
              sources={[
                { label: lang === 'fr'
                    ? "Pacte mondial pour des migrations sûres, ordonnées et régulières — document final (par. 15 et 49)"
                    : "Global Compact for Safe, Orderly and Regular Migration — final outcome document (paras. 15 and 49)",
                  url: "https://refugeesmigrants.un.org/sites/default/files/180713_agreed_outcome_global_compact_for_migration.pdf" },
                { label: lang === 'fr'
                    ? "Assemblée générale des Nations unies, résolution 73/195 (19 décembre 2018)"
                    : "United Nations General Assembly, resolution 73/195 (19 December 2018)",
                  url: "https://www.iom.int/resources/global-compact-safe-orderly-and-regular-migration-res-73-195" },
                { label: lang === 'fr'
                    ? "Réseau des Nations unies sur les migrations — Forum d'examen des migrations internationales 2026"
                    : "UN Network on Migration — International Migration Review Forum 2026",
                  url: "https://migrationnetwork.un.org/international-migration-review-forum-2026" },
              ]}
            >
              <p className="text-justify">
                {lang === 'fr'
                  ? "Le Pacte a été adopté lors de la conférence intergouvernementale de Marrakech le 10 décembre 2018, puis entériné par l'Assemblée générale des Nations unies le 19 décembre 2018 (résolution 73/195), au terme d'un vote enregistré de 152 voix pour, 5 contre et 12 abstentions. C'est un cadre de coopération juridiquement non contraignant : il ne crée aucune obligation opposable, et le texte lui-même précise que « son autorité repose sur son caractère consensuel, sa crédibilité, l'appropriation collective, la mise en œuvre conjointe, le suivi et l'examen »."
                  : "The Compact was adopted at the intergovernmental conference in Marrakech on 10 December 2018, then endorsed by the UN General Assembly on 19 December 2018 (resolution 73/195), by a recorded vote of 152 in favour, 5 against and 12 abstentions. It is a non-legally binding cooperative framework: it creates no enforceable obligation, and the text itself states that \"its authority rests on its consensual nature, credibility, collective ownership, joint implementation, follow-up and review\"."}
              </p>

              <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  {lang === 'fr' ? "Principe de souveraineté nationale (par. 15)" : "National sovereignty principle (para. 15)"}
                </h4>
                <p className="text-[13px] text-slate-600 italic leading-relaxed">
                  {lang === 'fr'
                    ? "« Le Pacte mondial réaffirme le droit souverain des États de définir leur politique migratoire nationale et leur prérogative de gouverner les migrations relevant de leur juridiction, en conformité avec le droit international. »"
                    : "\"The Global Compact reaffirms the sovereign right of States to determine their national migration policy and their prerogative to govern migration within their jurisdiction, in conformity with international law.\""}
                </p>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {lang === 'fr'
                    ? "Cette clause est ce qui a rendu le texte adoptable ; c'est aussi ce qui limite sa portée. Elle explique pourquoi un même objectif peut être invoqué pour ouvrir des voies régulières comme pour justifier un durcissement des entrées."
                    : "This clause is what made the text adoptable; it is also what limits its reach. It explains why the same objective can be invoked to open regular pathways and to justify tightening entry alike."}
                </p>
              </div>

              <div>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  {lang === 'fr'
                    ? "Les dix principes directeurs, transversaux et interdépendants (par. 15)"
                    : "The ten cross-cutting and interdependent guiding principles (para. 15)"}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {(lang === 'fr' ? [
                    ["Centré sur les personnes", "place les individus au cœur du dispositif"],
                    ["Coopération internationale", "aucun État ne peut traiter seul un phénomène transnational"],
                    ["Souveraineté nationale", "le droit de définir sa politique migratoire est réaffirmé"],
                    ["État de droit et régularité de la procédure", "accès à la justice à tous les stades"],
                    ["Développement durable", "adossé à l'Agenda 2030"],
                    ["Droits humains", "non-régression et non-discrimination, quel que soit le statut"],
                    ["Prise en compte du genre", "sortir du prisme de la seule victimité pour les femmes migrantes"],
                    ["Prise en compte de l'enfance", "intérêt supérieur de l'enfant comme considération primordiale"],
                    ["Approche pangouvernementale", "cohérence horizontale et verticale entre secteurs et niveaux"],
                    ["Approche pansociétale", "migrants, diasporas, société civile, université, secteur privé, syndicats"],
                  ] : [
                    ["People-centred", "places individuals at its core"],
                    ["International cooperation", "no state can address a transnational phenomenon alone"],
                    ["National sovereignty", "the right to determine migration policy is reaffirmed"],
                    ["Rule of law and due process", "access to justice at every stage"],
                    ["Sustainable development", "rooted in the 2030 Agenda"],
                    ["Human rights", "non-regression and non-discrimination, whatever the status"],
                    ["Gender-responsive", "moving away from a victimhood-only lens on migrant women"],
                    ["Child-sensitive", "the best interests of the child as a primary consideration"],
                    ["Whole-of-government", "horizontal and vertical coherence across sectors and levels"],
                    ["Whole-of-society", "migrants, diasporas, civil society, academia, private sector, unions"],
                  ]).map(([name, gloss], i) => (
                    <div key={i} className="flex gap-2.5 py-1.5" style={{ borderBottom: '1px solid var(--rule)' }}>
                      <span className="shrink-0 text-[11px] font-bold tabular-nums pt-px" style={{ color: 'var(--accent-2)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[13px] leading-snug">
                        <span className="font-semibold text-slate-800">{name}</span>
                        <span className="text-slate-500"> — {gloss}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed text-justify">
                  {lang === 'fr'
                    ? "Ces dix principes ne sont pas un préambule décoratif : ils sont la grille d'interprétation des 23 objectifs qui suivent. Un objectif se lit toujours à travers eux — et c'est là que se joue l'écart entre deux mises en œuvre du même texte."
                    : "These ten principles are not decorative preamble: they are the interpretive grid for the 23 objectives that follow. An objective is always read through them — and that is where two implementations of the same text diverge."}
                </p>
              </div>

              <CounterpointFacts items={[
                { when: lang === 'fr' ? "10 déc. 2018" : "10 Dec. 2018", what: lang === 'fr'
                    ? "Adoption à la conférence intergouvernementale de Marrakech."
                    : "Adoption at the intergovernmental conference in Marrakech." },
                { when: lang === 'fr' ? "19 déc. 2018" : "19 Dec. 2018", what: lang === 'fr'
                    ? "Entérinement par l'Assemblée générale (résolution 73/195) : 152 pour, 5 contre, 12 abstentions."
                    : "Endorsement by the General Assembly (resolution 73/195): 152 in favour, 5 against, 12 abstentions." },
                { when: lang === 'fr' ? "16-20 mai 2022" : "16-20 May 2022", what: lang === 'fr'
                    ? "Premier Forum d'examen des migrations internationales (FEMI), à New York. Prévu au paragraphe 49 du Pacte, il en est la principale plateforme intergouvernementale de suivi, réunie tous les quatre ans."
                    : "First International Migration Review Forum (IMRF), New York. Provided for in paragraph 49 of the Compact, it is its primary intergovernmental follow-up platform, convened every four years." },
                { when: lang === 'fr' ? "5-8 mai 2026" : "5-8 May 2026", what: lang === 'fr'
                    ? "Deuxième FEMI, à New York. Les examens régionaux l'alimentent — celui de l'Afrique a été conduit par l'UA en 2021."
                    : "Second IMRF, New York. Regional reviews feed into it — Africa's was conducted by the AU in 2021." },
              ]} />
            </AfricanCounterpoint>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {text.sdg_section.gcm_objectives_list.map((obj, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 px-1.5 py-0.5 rounded-sm inline-block mb-1.5">{obj.num}</span>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-1.5">{obj.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{obj.desc}</p>
                </div>
              ))}
            </div>

            <AfricanCounterpoint
              lang={lang}
              kicker={lang === 'fr' ? "Le pendant africain" : "The African counterpart"}
              title={lang === 'fr'
                ? "La Position africaine commune : l'Afrique est arrivée à Marrakech avec un texte à elle"
                : "The Common African Position: Africa came to Marrakech with a text of its own"}
              sources={[
                { label: lang === 'fr'
                    ? "Union africaine — « Draft Common African Position (CAP) on the Global Compact for Safe, Orderly and Regular Migration », octobre 2017 (document de travail, Addis-Abeba)"
                    : "African Union — \"Draft Common African Position (CAP) on the Global Compact for Safe, Orderly and Regular Migration\", October 2017 (working document, Addis Ababa)",
                  url: "https://au.int/sites/default/files/newsevents/workingdocuments/33023-wd-english_common_african_position_on_gcom.pdf" },
                { label: lang === 'fr'
                    ? "Union africaine — Revue régionale africaine de la mise en œuvre du Pacte mondial sur les migrations (2021)"
                    : "African Union — Africa Regional Review of the Implementation of the Global Compact on Migration (2021)",
                  url: "https://au.int/en/newsevents/20210826/africa-regional-review-implementation-global-compact-migration" },
                { label: lang === 'fr'
                    ? "Union africaine — Validation du plan d'action pour la mise en œuvre du GCM en Afrique (communiqué, 28 août 2024)"
                    : "African Union — Senior officers validate the action plan for GCM implementation in Africa (press release, 28 August 2024)",
                  url: "https://au.int/en/pressreleases/20240828/senior-officers-validate-action-plan-gcm-implementation-africa" },
              ]}
            >
              <p className="text-justify">
                {lang === 'fr'
                  ? "Un an avant l'adoption du Pacte de Marrakech, l'Union africaine se dote d'une Position africaine commune. Élaborée en octobre 2017 sous le mot d'ordre « One Africa, One Voice, One Message », elle est portée devant les sessions ordinaires de 2018 du Conseil exécutif et de la Conférence. Le geste compte autant que le contenu : il s'agit de négocier un instrument mondial en bloc, avec une doctrine préalable, plutôt que d'y réagir État par État."
                  : "A year before the Marrakech Compact was adopted, the African Union produced a Common African Position (CAP), drafted in October 2017 under the motto \"One Africa, One Voice, One Message\" and brought before the 2018 ordinary sessions of the Executive Council and the Assembly. The gesture matters as much as the content: it means negotiating a global instrument as a bloc, with a doctrine agreed beforehand, rather than reacting to it state by state."}
              </p>

              <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
                <p className="text-[13px] text-slate-600 italic leading-relaxed">
                  {lang === 'fr'
                    ? "« L'adoption d'une Position africaine commune sur le Pacte mondial sur les migrations sera guidée par le fait que la mobilité humaine et la libre circulation de toutes les personnes à l'intérieur du continent constituent l'un des piliers d'une Afrique intégrée. » (PAC, § 1.6)"
                    : "\"The adoption of a Common African Position on the Global Compact on Migration will be guided by the fact that human mobility and free movement of all persons within the continent constitute one of the pillars of an integrated Africa.\" (CAP, § 1.6)"}
                </p>
              </div>

              <div>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  {lang === 'fr' ? "Les six domaines thématiques de la Position" : "The six thematic areas of the Position"}
                </h4>
                <ol className="space-y-2">
                  {(lang === 'fr' ? [
                    "Agir sur les moteurs de la migration — effets du changement climatique, catastrophes naturelles, crises d'origine humaine, inégalités de genre et autres.",
                    "Droits humains de tous les migrants — inclusion sociale, cohésion, lutte contre le racisme, la xénophobie et les discriminations.",
                    "Trafic de migrants, traite des personnes et formes contemporaines d'esclavage.",
                    "Coopération internationale et gouvernance des migrations — synergies entre États membres, harmonisation de la gestion des frontières et des données.",
                    "Migration irrégulière et voies régulières — créer les canaux dont l'absence pousse vers les routes dangereuses.",
                    "Contributions des migrants et des diasporas — y compris des femmes et des jeunes — aux pays d'origine, de transit et d'accueil.",
                  ] : [
                    "Addressing the drivers of migration — adverse effects of climate change, natural disasters, human-made crises, gender and other inequalities.",
                    "Human rights of all migrants — social inclusion, cohesion, and countering racism, xenophobia and discrimination.",
                    "Smuggling of migrants, trafficking in persons and contemporary forms of slavery.",
                    "International cooperation and governance of migration — synergies among member states, harmonised border management and data.",
                    "Irregular migration and regular pathways — creating the channels whose absence pushes people onto dangerous routes.",
                    "Contributions of migrants and diasporas — including women and youth — to countries of origin, transit and destination.",
                  ]).map((t, i) => (
                    <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                      <span className="shrink-0 font-serif font-bold tabular-nums" style={{ color: 'var(--accent-deep)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-slate-700">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <p className="text-justify">
                {lang === 'fr'
                  ? "Ces six domaines épousent délibérément l'architecture thématique du Pacte mondial — l'Afrique occupe le cadre qui se négocie et y inscrit ses propres priorités, au lieu d'en bâtir un à côté. La suite se lit dans la mécanique bureaucratique plutôt que dans les déclarations. Revue régionale africaine de la mise en œuvre du GCM en 2021. Plan d'action continental validé au niveau des hauts fonctionnaires en août 2024, puis adopté par le CTS-MRIDP à sa 5e session en novembre 2025."
                  : "These six areas deliberately mirror the Global Compact's own thematic architecture — Africa occupies the framework being negotiated and writes its priorities into it, instead of building one alongside. What follows is legible in bureaucratic machinery rather than declarations: the Africa regional review of GCM implementation in 2021, a continental action plan validated at senior-officials level in August 2024, then adopted by the STC-MRIDPs at its 5th session in November 2025."}
              </p>
            </AfricanCounterpoint>
          </div>
        )}

        {activeSdgzTab === 'gcr' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed">{text.sdg_section.gcr_desc}</p>
              <a href="https://globalcompactrefugees.org/about-digital-platform/global-compact-refugees" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {text.sdg_section.gcr_objectifs.map((obj, idx) => (
                <div key={idx} className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="font-serif font-bold text-slate-900 text-base mb-2">{obj.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{obj.desc}</p>
                </div>
              ))}
            </div>

            <AfricanCounterpoint
              lang={lang}
              kicker={lang === 'fr' ? "Le pendant africain" : "The African counterpart"}
              title={lang === 'fr'
                ? "L'Afrique avait déjà son instrument — et il est plus large que celui de Genève"
                : "Africa already had its instrument — and it is broader than Geneva's"}
              sources={[
                { label: lang === 'fr'
                    ? "OUA — Convention régissant les aspects propres aux problèmes des réfugiés en Afrique (Addis-Abeba, 10 septembre 1969 ; entrée en vigueur le 20 juin 1974)"
                    : "OAU — Convention Governing the Specific Aspects of Refugee Problems in Africa (Addis Ababa, 10 September 1969; entered into force 20 June 1974)",
                  url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" },
                { label: lang === 'fr'
                    ? "UA — Convention de Kampala sur la protection et l'assistance aux personnes déplacées internes (2009)"
                    : "AU — Kampala Convention on the Protection and Assistance of Internally Displaced Persons (2009)",
                  url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" },
                { label: lang === 'fr'
                    ? "HCR — Global Trends : Forced Displacement (édition 2025)"
                    : "UNHCR — Global Trends: Forced Displacement (2025 edition)",
                  url: "https://www.unhcr.org/global-trends" },
              ]}
            >
              <p className="text-justify">
                {lang === 'fr'
                  ? "Le Pacte mondial sur les réfugiés date de 2018. La Convention de l'OUA sur les réfugiés date de 1969 : un demi-siècle plus tôt, et avec une définition plus large que celle de Genève. Là où la Convention de 1951 exige une crainte de persécution individualisée, l'article I(2) du texte africain protège aussi quiconque fuit « une agression extérieure, une occupation, une domination étrangère ou des événements troublant gravement l'ordre public ». C'est la définition que cette plateforme retient comme référence."
                  : "The Global Compact on Refugees dates from 2018. The OAU Refugee Convention dates from 1969: half a century earlier, and with a broader definition than Geneva's. Where the 1951 Convention requires an individualised fear of persecution, Article I(2) of the African text also protects anyone fleeing \"external aggression, occupation, foreign domination or events seriously disturbing public order\". That is the definition this platform treats as its reference."}
              </p>

              <CounterpointFacts items={[
                { when: "1969", what: lang === 'fr'
                    ? "Convention de l'OUA, adoptée à Addis-Abeba le 10 septembre — définition élargie du réfugié, en vigueur depuis le 20 juin 1974."
                    : "OAU Convention, adopted in Addis Ababa on 10 September — broadened refugee definition, in force since 20 June 1974." },
                { when: "2009", what: lang === 'fr'
                    ? "Convention de Kampala : premier — et toujours seul — traité régional contraignant au monde sur les personnes déplacées internes."
                    : "Kampala Convention: the first — and still the only — binding regional treaty in the world on internally displaced persons." },
                { when: "2017", what: lang === 'fr'
                    ? "Déploiement du CRRF, le cadre d'action qui préfigure le Pacte mondial ; ses situations d'application initiales sont très majoritairement africaines (l'Éthiopie le lance le 28 novembre 2017)."
                    : "Roll-out of the CRRF, the framework that prefigured the Global Compact; its initial application situations are overwhelmingly African (Ethiopia launches it on 28 November 2017)." },
                { when: "2018", what: lang === 'fr'
                    ? "Pacte mondial sur les réfugiés — il érige en principe un partage des charges que le continent assumait déjà."
                    : "Global Compact on Refugees — it turns into a principle a sharing of responsibility the continent was already carrying." },
              ]} />

              <p className="text-justify">
                {lang === 'fr'
                  ? "Cette antériorité change la façon de lire le Pacte. Le « partage équitable des charges » qu'il proclame ne décrit pas une charge à venir. D'après le HCR, six pays accueillent à eux seuls plus du tiers des réfugiés du monde. Deux d'entre eux sont africains : l'Ouganda et le Tchad. L'enjeu, pour le continent, n'est donc pas d'adhérer à une norme venue d'ailleurs, mais d'obtenir que la norme mondiale reconnaisse et finance une pratique déjà ancienne (Ben Mokhtar, 2026)."
                  : "This precedence changes how the Compact reads. The \"equitable sharing of the burden\" it proclaims does not describe a burden to come: according to UNHCR, six countries alone host more than a third of the world's refugees, and two of them — Uganda and Chad — are African. For the continent the stake is therefore not to sign up to a norm from elsewhere, but to get the global norm to recognise and fund a long-standing practice (Ben Mokhtar, 2026)."}
              </p>
            </AfricanCounterpoint>
          </div>
        )}

        {/* ============================================================== */}
        {/* Rendu des Onglets Africains (UA, CER) */}
        {/* ============================================================== */}
        {activeSdgzTab === 'au' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-emerald-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10 pointer-events-none">
                <Landmark className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-2">
                  <span className="shrink-0 w-14 h-14 rounded-lg bg-white/95 border border-emerald-700 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/logos/au.png" alt="" className="max-h-full max-w-full object-contain" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      {lang === 'fr' ? 'Architecture Continentale Endogène' : 'Endogenous Continental Architecture'}
                    </span>
                    <span className="text-xs text-emerald-200/80">
                      {lang === 'fr' ? "Union africaine — Addis-Abeba" : "African Union — Addis Ababa"}
                    </span>
                  </div>
                </div>
                <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 leading-tight">
                  {lang === 'fr' ? "L'Union Africaine et le Régime Panafricain des Mobilités" : "The African Union and the Pan-African Mobility Regime"}
                </h3>
                <p className="text-emerald-100 text-sm md:text-base leading-relaxed max-w-4xl text-justify">
                  {lang === 'fr'
                    ? "La gouvernance des mobilités en Afrique ne se réduit pas aux pactes mondiaux. Elle s'enracine dans une architecture institutionnelle propre, structurée par l'Union Africaine (UA). Cette architecture illustre la tension du « normer sans ancrer » : une densification normative exceptionnelle (traités, positions communes, agences) qui se heurte souvent aux capacités et aux réticences des États dans l'« entre-deux national » (Ben Mokhtar, 2026). Le régime continental repose sur la construction d'une souveraineté épistémique (produire ses propres données et diagnostics) et sur un maillage de textes et de bureaucraties interconnectés."
                    : "African mobility governance is not reduced to global compacts. It is rooted in its own institutional architecture, structured by the African Union (AU). This architecture illustrates the tension of 'norming without anchoring': exceptional normative densification that often clashes with State capacities and reluctance in the 'national in-between' (Ben Mokhtar, 2026). The continental regime relies on building epistemic sovereignty and a network of interconnected texts and bureaucracies."}
                </p>
                <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-100"><span className="font-bold text-white">2002</span> — {lang === 'fr' ? 'succède à l\'OUA (fondée en 1963)' : 'succeeds the OAU (founded 1963)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-100 font-bold text-white">{lang === 'fr' ? 'Addis-Abeba, Éthiopie' : 'Addis Ababa, Ethiopia'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Textes Fondateurs */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <FileText className="w-5 h-5 mr-2 text-emerald-700" />
                  {lang === 'fr' ? "Textes Fondateurs & Cadres Politiques" : "Foundational Texts & Policy Frameworks"}
                </h4>
                <div className="space-y-4">
                  {auFrameworks.map((fw, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest inline-block mb-2">
                          {fw.tag[lang]}
                        </span>
                        <h5 className="font-bold text-slate-900 text-lg mb-2 leading-tight">{fw.title[lang]}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{fw.desc[lang]}</p>
                        {fw.stats && fw.stats.map((stat, sIdx) => {
                          const inForce = stat.value >= (stat.threshold || 15);
                          const barColor = inForce ? 'bg-emerald-600' : 'bg-rose-600';
                          const textColor = inForce ? 'text-emerald-700' : 'text-rose-700';
                          return (
                            <div key={sIdx} className="mt-4 pt-4 border-t border-slate-200">
                              <div className="flex items-baseline justify-between gap-2 mb-1.5 flex-wrap">
                                <div className="flex items-baseline gap-2">
                                  <span className={`text-2xl font-serif font-bold ${textColor}`}>{stat.value}</span>
                                  <span className="text-xs font-bold text-slate-500">/ {stat.total} {stat.label[lang]}</span>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border shrink-0 ${inForce ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                  {inForce ? (lang === 'fr' ? 'En vigueur' : 'In force') : (lang === 'fr' ? 'Pas encore en vigueur' : 'Not yet in force')}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {Array.from({ length: stat.total }).map((_, i) => (
                                  <span key={i} className={`h-2 flex-1 rounded-sm ${i < stat.value ? barColor : 'bg-slate-200'}`}></span>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                        {fw.badge && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border bg-emerald-50 border-emerald-200 text-emerald-700">
                              {fw.badge[lang]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="md:w-2/3 bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-center relative shadow-sm">
                        <Quote className="absolute top-4 left-4 w-6 h-6 text-slate-100" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-6">{fw.article.ref[lang]}</span>
                        <p className="text-sm font-serif italic text-slate-800 leading-relaxed ml-6 relative z-10">
                          {lang === 'fr' ? fw.article.textFr : fw.article.textEn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* La meme donnee que la matrice, vue en geographie : la matrice
                  dit qui a signe quoi, la carte dit ou se trouvent les creux. */}
              <CarteSection
                lang={lang}
                indicateur={CARTE_ANCRAGE}
                kicker={lang === 'fr' ? "Géographie de l'engagement" : 'Geography of commitment'}
                titre={lang === 'fr'
                  ? "Ce que les États ont signé, vu du continent"
                  : 'What states have signed, seen from the continent'}
                plain={{
                  fr: "Chaque pays est teinté selon le nombre de grands textes de l'Union africaine qu'il a officiellement ratifiés, sur six. Plus la teinte est dense, plus l'engagement juridique est complet.",
                  en: 'Each country is shaded by how many of the African Union’s six major instruments it has formally ratified. The denser the shade, the more complete the legal commitment.',
                }}
                sources={[{ label: lang === 'fr'
                              ? "Union africaine — listes officielles de statut des traités"
                              : 'African Union — official treaty status lists',
                            url: 'https://au.int/en/treaties' }]}
              />

              <AnchoringMatrix lang={lang} />

              <GovernanceCross lang={lang} />

              {/* Organe de pilotage politique & forum consultatif */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <Landmark className="w-5 h-5 mr-2 text-emerald-700" />
                  {lang === 'fr' ? "Pilotage Politique & Forum Consultatif" : "Political Steering & Consultative Forum"}
                </h4>
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 overflow-hidden">
                    <button onClick={() => setExpandedGovBody(expandedGovBody === 'stc' ? null : 'stc')} className="w-full text-left p-6 hover:bg-emerald-50 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                        <h5 className="font-bold text-emerald-900 text-base">
                          {lang === 'fr' ? "Comité Technique Spécialisé Migration, Réfugiés & PDI (STC-MRIDPs)" : "Specialized Technical Committee on Migration, Refugees & IDPs (STC-MRIDPs)"}
                        </h5>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                            {lang === 'fr' ? "5 sessions depuis 2015" : "5 sessions since 2015"}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform ${expandedGovBody === 'stc' ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {lang === 'fr'
                          ? "Institué par l'article 5 de l'Acte constitutif de l'UA, ce Comité technique spécialisé est l'organe politique de tutelle du régime migratoire continental. Il se réunit au niveau ministériel et technique, prépare les projets et programmes de l'Union sur les mobilités, et en supervise le suivi auprès du Conseil exécutif. C'est devant ce circuit de reddition de comptes que l'Observatoire Africain des Migrations (OAM) rend compte de ses travaux."
                          : "Established under Article 5 of the AU Constitutive Act, this Specialized Technical Committee is the political oversight organ of the continental migration regime: it meets at ministerial and technical level, prepares the Union's migration-related projects and programmes, and supervises their follow-up before the Executive Council. It is before this accountability circuit that the African Migration Observatory (AMO) reports on its work."}
                      </p>
                    </button>
                    {expandedGovBody === 'stc' && (
                      <div className="px-6 pb-6 pt-2 border-t border-emerald-100 space-y-3 animate-in fade-in duration-300">
                        {stcSessions.map((s, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                              <span className="font-bold text-slate-900 text-xs">{s.num[lang]} — {s.date[lang]}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.format[lang]}</span>
                            </div>
                            <p className="text-xs text-emerald-700 font-bold mb-1.5">{s.focus[lang]}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{s.outcome[lang]}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-amber-50/50 rounded-lg border border-amber-100 overflow-hidden">
                    <button onClick={() => setExpandedGovBody(expandedGovBody === 'pafom' ? null : 'pafom')} className="w-full text-left p-6 hover:bg-amber-50 transition-colors">
                      <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                        <h5 className="font-bold text-amber-900 text-base">
                          {lang === 'fr' ? "Forum Panafricain sur la Migration (PAFoM)" : "Pan-African Forum on Migration (PAFoM)"}
                        </h5>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                            {lang === 'fr' ? "9 sessions depuis 2015" : "9 sessions since 2015"}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform ${expandedGovBody === 'pafom' ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {lang === 'fr'
                          ? "Créé en 2006 par la décision EX.CL/276(IX) du Conseil exécutif, le PAFoM est le processus consultatif continental de référence. Il s'est réuni pour la première fois à Accra en 2015. Il rassemble les États membres de l'UA, les CER, les processus régionaux de Rabat et de Khartoum et les agences onusiennes, pour façonner les politiques migratoires africaines."
                          : "Created by Executive Council Decision EX.CL/276(IX) (2006), PAFoM is the continent's flagship consultative process, first convened in Accra in 2015: it brings together AU member states, RECs, regional processes (Rabat, Khartoum), and UN agencies to shape African migration policy."}
                      </p>
                    </button>
                    {expandedGovBody === 'pafom' && (
                      <div className="px-6 pb-6 pt-2 border-t border-amber-100 space-y-3 animate-in fade-in duration-300">
                        {pafomSessions.map((s, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                              <span className="font-bold text-slate-900 text-xs">{s.num} — {s.date[lang]}</span>
                            </div>
                            <p className="text-xs text-amber-700 font-bold mb-1.5">{s.focus[lang]}</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{s.outcome[lang]}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* JLMP */}
              <div className="bg-blue-50 p-6 md:p-7 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start gap-4 mb-5">
                  <Activity className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1.5">{lang === 'fr' ? "Le Programme Conjoint sur la Migration de Main-d'œuvre (JLMP)" : "The Joint Labour Migration Programme (JLMP)"}</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      {lang === 'fr'
                        ? "Là où le droit pur bloque (Kigali), la gouvernance avance par la technique. Porté conjointement par la CUA, l'OIT, l'OIM et la CEA, avec le PNUD, le JLMP met en œuvre le 5e domaine prioritaire de la Déclaration d'Addis-Abeba sur l'emploi (2015). Il vise quatre chantiers : la portabilité des compétences, celle des droits à la sécurité sociale, le recrutement équitable et la protection des travailleurs migrants."
                        : "Where pure law stalls (Kigali), governance advances through technical means. Jointly carried by the AUC, ILO, IOM, and ECA (+ UNDP), the JLMP implements the 5th priority area of the 2015 Addis Ababa Declaration on Employment, targeting skills portability, social security portability, fair recruitment, and migrant worker protection."}
                    </p>
                  </div>
                </div>
                <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2 block">{lang === 'fr' ? "Phase actuelle — JLMP Action (jusqu'à déc. 2024)" : "Current Phase — JLMP Action (through Dec. 2024)"}</span>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    {lang === 'fr'
                      ? "Déploiement ciblé dans 5 États membres (Cameroun, Côte d'Ivoire, Éthiopie, Malawi, Maroc) et 2 CER partenaires (CEEAC, COMESA) — un choix pilote plutôt qu'une couverture continentale immédiate, financé par la SIDA (Suède) depuis la phase « JLMP Priority » (2018)."
                      : "Targeted rollout in 5 member states (Cameroon, Côte d'Ivoire, Ethiopia, Malawi, Morocco) and 2 partner RECs (ECCAS, COMESA) — a pilot approach rather than immediate continental coverage, funded by SIDA (Sweden) since the \"JLMP Priority\" phase (2018)."}
                  </p>
                </div>
              </div>

              {/* Partenariats de Compétences */}
              <div className="bg-teal-50 p-6 md:p-7 rounded-xl border border-teal-200 shadow-sm">
                <div className="flex items-start gap-4 mb-5">
                  <Briefcase className="w-6 h-6 text-teal-700 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-teal-900 mb-1.5">{lang === 'fr' ? "Partenariats de Compétences (Global Skills Partnerships) en Action" : "Global Skills Partnerships in Action"}</h4>
                    <p className="text-xs text-teal-800 leading-relaxed">
                      {lang === 'fr'
                        ? "Au-delà des cadres continentaux, des accords bilatéraux concrets appliquent déjà le modèle du « partenariat de compétences » (voir Glossaire) entre États africains et européens — une alternative testée à la fuite des cerveaux, où la formation est financée conjointement avant le départ."
                        : "Beyond continental frameworks, concrete bilateral agreements already apply the \"Global Skills Partnership\" model (see Glossary) between African and European states — a tested alternative to brain drain, where training is jointly funded before departure."}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-2 block">{lang === 'fr' ? "PALIM — Maroc ↔ Belgique (depuis 2019)" : "PALIM — Morocco ↔ Belgium (since 2019)"}</span>
                    <p className="text-xs text-teal-900 leading-relaxed">{lang === 'fr' ? "120 diplômés formés aux métiers du numérique : 40 partis travailler en Flandre, 80 restés au Maroc — un résultat pensé comme un gain pour les deux économies, non comme une perte sèche." : "120 graduates trained in digital skills: 40 went to work in Flanders, 80 stayed in Morocco — a result designed as a gain for both economies, not a net loss."}</p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-2 block">{lang === 'fr' ? "THAMM / THAMM Plus (2019-2027)" : "THAMM / THAMM Plus (2019-2027)"}</span>
                    <p className="text-xs text-teal-900 leading-relaxed">{lang === 'fr' ? "Développement de compétences en Égypte, au Maroc et en Tunisie, avec des passerelles de mobilité vers la Belgique, la France et l'Allemagne." : "Skills development in Egypt, Morocco, and Tunisia, with mobility pathways to Belgium, France, and Germany."}</p>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-2 block">{lang === 'fr' ? "Sénégal / Ghana ↔ Allemagne (dès 2026)" : "Senegal / Ghana ↔ Germany (from 2026)"}</span>
                    <p className="text-xs text-teal-900 leading-relaxed">{lang === 'fr' ? "Formation professionnelle dans le secteur du bâtiment, avec un premier départ de candidats prévu durant l'été 2026." : "Vocational training in the construction sector, with the first candidates' departure planned for summer 2026."}</p>
                  </div>
                </div>
              </div>

              {/* Agences et Infrastructures */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <Database className="w-5 h-5 mr-2 text-indigo-700" />
                  {lang === 'fr' ? "Agences Spécialisées & Souveraineté Épistémique" : "Specialized Agencies & Epistemic Sovereignty"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                  <AuAgencyCard
                    lang={lang}
                    acronym={lang === 'fr' ? "OAM" : "AMO"}
                    fullName={lang === 'fr' ? "Observatoire africain des migrations" : "African Migration Observatory"}
                    seat={lang === 'fr' ? "Rabat, Maroc" : "Rabat, Morocco"}
                    founded={lang === 'fr' ? "créé 2018 — lancé 2020" : "created 2018 — launched 2020"}
                    source={{ url: "https://amo.au.int/en", label: lang === 'fr' ? "Site de l'OAM" : "AMO website" }}
                  >
                    {lang === 'fr'
                      ? "Bureau technique spécialisé de l'UA, institué dans le sillage de la Déclaration de New York (2016) et de l'Objectif 1 du Pacte mondial (données factuelles), lancé le 18 décembre 2020. Il doit doter le continent de données migratoires centralisées, harmonisées et opportunes — le bras qui permet de produire ses propres diagnostics plutôt que de les recevoir. Son financement reste largement extrabudgétaire."
                      : "AU specialized technical office, established in the wake of the 2016 New York Declaration and Objective 1 of the Global Compact (evidence-based data), launched on 18 December 2020. Its purpose is to give the continent centralised, harmonised and timely migration data — the arm that allows Africa to produce its own diagnoses rather than receive them. Its funding remains largely off the regular budget."}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym={lang === 'fr' ? "CERSM / ACSRM" : "ACSRM"}
                    fullName={lang === 'fr' ? "Centre d'études et de recherche sur les migrations" : "African Centre for the Study and Research on Migration"}
                    seat={lang === 'fr' ? "Bamako, Mali" : "Bamako, Mali"}
                    founded={lang === 'fr' ? "décidé 2020 — lancé 2021" : "decided 2020 — launched 2021"}
                    source={{ url: "https://au.int/", label: lang === 'fr' ? "Union africaine" : "African Union" }}
                  >
                    {lang === 'fr'
                      ? "Bureau technique spécialisé de la Commission de l'UA, établi par décision de la 33e Conférence (février 2020) et officiellement lancé le 19 mars 2021. Mandat continental : produire de la connaissance sur les migrations africaines (« African Migration Policy Briefs »), suivre la mise en œuvre des cadres de politique migratoire et renforcer les capacités des États et des CER."
                      : "Specialized technical office of the AU Commission, established by decision of the 33rd Assembly (February 2020) and officially launched on 19 March 2021. Continental mandate: producing knowledge on African migration (\"African Migration Policy Briefs\"), monitoring implementation of migration policy frameworks, and building the capacity of States and RECs."}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym="COC"
                    fullName={lang === 'fr' ? "Centre opérationnel continental de Khartoum" : "Continental Operational Centre in Khartoum"}
                    seat={lang === 'fr' ? "Khartoum, Soudan" : "Khartoum, Sudan"}
                    founded={lang === 'fr' ? "statut propre" : "own statute"}
                    source={{ url: "https://au.int/", label: lang === 'fr' ? "Union africaine" : "African Union" }}
                  >
                    {lang === 'fr'
                      ? "Bureau technique spécialisé doté de son propre statut (Conseil de gestion, Secrétariat), dédié à la lutte contre la migration irrégulière, la traite des personnes et le trafic de migrants. Plateforme de coopération policière continentale, aujourd'hui fragilisée par le conflit au Soudan."
                      : "Specialized technical office with its own statute (Management Board, Secretariat), dedicated to countering irregular migration, trafficking in persons and migrant smuggling. A continental law-enforcement cooperation platform, today weakened by the conflict in Sudan."}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym="AIR"
                    fullName={lang === 'fr' ? "Institut africain pour les transferts de fonds" : "African Institute for Remittances"}
                    seat={lang === 'fr' ? "Nairobi, Kenya" : "Nairobi, Kenya"}
                    founded="2014"
                    source={{ url: "https://au.int/en/sa/air", label: lang === 'fr' ? "Fiche AIR (UA)" : "AIR page (AU)" }}
                  >
                    {lang === 'fr'
                      ? "Le Conseil exécutif ayant accepté l'offre d'accueil du Kenya (décision EX.CL/Dec.808(XXIV)), l'accord de siège est signé et l'Institut lancé le 28 novembre 2014 ; il est hébergé par la Kenya School of Monetary Studies. Trois objectifs : abaisser le coût d'envoi d'argent vers l'Afrique et à l'intérieur du continent, améliorer la mesure et la déclaration des données sur les transferts dans les États membres, et convertir ces flux en effet économique et social. L'AIR touche donc à la fois au droit bancaire et à la statistique migratoire."
                      : "After the Executive Council accepted Kenya's offer to host it (decision EX.CL/Dec.808(XXIV)), the host agreement was signed and the Institute launched on 28 November 2014; it is hosted by the Kenya School of Monetary Studies. Three objectives: lowering the cost of sending money to and within Africa, improving the measurement and reporting of remittance data across member states, and converting those flows into social and economic effect. AIR therefore sits at the junction of banking regulation and migration statistics."}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym="STATAFRIC"
                    fullName={lang === 'fr' ? "Institut panafricain de statistique de l'Union africaine" : "African Union Institute for Statistics"}
                    seat={lang === 'fr' ? "Tunis, Tunisie" : "Tunis, Tunisia"}
                    founded={lang === 'fr' ? "créé 2013 — activités 2019" : "created 2013 — activities 2019"}
                    source={{ url: "https://statafric.au.int/en/mandate", label: lang === 'fr' ? "Mandat de STATAFRIC" : "STATAFRIC mandate" }}
                  >
                    {lang === 'fr'
                      ? "Créé en janvier 2013 par la Conférence de l'UA à Addis-Abeba, installé à Tunis, ses activités ont été lancées en novembre 2019 en marge de la 13e session des directeurs généraux des instituts nationaux de statistique. Son mandat : conduire la production et la promotion d'une information statistique harmonisée et de qualité à l'appui de l'agenda africain d'intégration, en collectant et en agrégeant ce que publient les instituts nationaux. C'est l'infrastructure sur laquelle repose toute comparabilité continentale — y compris migratoire."
                      : "Created in January 2013 by the AU Assembly in Addis Ababa and seated in Tunis, its activities were launched in November 2019 alongside the 13th session of the Committee of Directors General of national statistics offices. Its mandate: to lead the provision and promotion of harmonised, quality statistical information in support of the African integration agenda, by collecting and aggregating what national statistics institutes publish. It is the infrastructure on which all continental comparability rests — migration included."}
                  </AuAgencyCard>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-5 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
                  {lang === 'fr'
                    ? "AIR et STATAFRIC sont souvent cités ensemble, à tort : le premier est un institut sectoriel adossé à la régulation bancaire kényane, le second l'appareil statistique de l'Union tout entière. Les confondre revient à confondre une source de données avec le système qui les rend comparables (Ben Mokhtar, 2026)."
                    : "AIR and STATAFRIC are often cited together, wrongly: the first is a sectoral institute anchored in Kenyan banking regulation, the second the statistical apparatus of the Union as a whole. Conflating them means conflating a data source with the system that makes data comparable (Ben Mokhtar, 2026)."}
                </p>
              </div>

              {/* Chronologie OAM : institutionnalisation par couches successives */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-2">
                  <MapPin className="w-5 h-5 mr-2 text-indigo-700" />
                  {lang === 'fr' ? "Gros Plan : l'OAM, une institution en construction" : "Close-Up: The AMO, an Institution Under Construction"}
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  {lang === 'fr'
                    ? "Chronologie construite à partir des documents publics de l'UA — notamment le Rapport d'activités de l'Observatoire Africain des Migrations (2021-2024) — et des communiqués officiels de l'UA."
                    : "Chronology built from public AU documents — notably the African Migration Observatory's Activity Report (2021-2024) — and official AU press releases."}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-2 mb-6 pb-4 border-b border-slate-100">
                  <a href="https://amo.au.int/sites/default/files/files/2025-04/amoactivityreport-2021-2024.pdf"
                     target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline" style={{ color: 'var(--accent-deep)' }}>
                    {lang === 'fr'
                      ? "→ Rapport d'activités de l'OAM, nov. 2021 – juin 2024 (PDF)"
                      : "→ AMO Report on Activities, Nov. 2021 – June 2024 (PDF)"} <ExternalLink className="w-3 h-3" />
                  </a>
                  <a href="https://amo.au.int/en/resources" target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline" style={{ color: 'var(--accent-2)' }}>
                    {lang === 'fr' ? "→ Ressources et documents de l'OAM" : "→ AMO resources and documents"} <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="space-y-5">
                  {[
                    {
                      year: "2018",
                      fr: "Décision d'établissement de l'Observatoire au Maroc par l'Assemblée de l'UA (Assembly/AU/Dec.695(XXXI)).",
                      en: "AU Assembly decision establishing the Observatory in Morocco (Assembly/AU/Dec.695(XXXI))."
                    },
                    {
                      year: "2020",
                      fr: "Inauguration officielle à Rabat le 18 décembre. Le siège de Mahaj Riad — bâtiment de 4 étages mis à disposition par le gouvernement marocain via l'AMCI, conformément à l'accord de siège — donne à l'OAM une existence territoriale et matérielle dans l'architecture continentale.",
                      en: "Official inauguration in Rabat on December 18. The Mahaj Riad headquarters — a 4-storey building provided by the Moroccan government via AMCI, under the host-country agreement — gives the AMO a territorial and material presence in the continental architecture."
                    },
                    {
                      year: "2021–2022",
                      fr: "Première phase d'activation technique : ateliers de Hammamet, Marrakech et Le Caire sur la désagrégation et l'harmonisation des données migratoires (statuts, définitions, méthodologies).",
                      en: "First technical activation phase: workshops in Hammamet, Marrakech, and Cairo on disaggregating and harmonizing migration data (statuses, definitions, methodologies)."
                    },
                    {
                      year: "2023",
                      fr: "Densification : ateliers de Lomé et Marrakech (avec les CER, sur les « Migration Data Hubs »), puis ateliers pilotes nationaux à Windhoek et Kampala.",
                      en: "Densification: workshops in Lomé and Marrakech (with the RECs, on \"Migration Data Hubs\"), followed by national pilot workshops in Windhoek and Kampala."
                    },
                    {
                      year: "2024",
                      fr: "Rapport d'activités 2021-2024 structuré autour de 4 axes (harmonisation des données, formations ciblées, Data Hubs régionaux, forums internationaux) ; lancement du projet AU-UMA Migration Data Hub ; side event à l'Assemblée générale de l'ONU sur la « narrative africaine » des données migratoires.",
                      en: "2021-2024 activity report structured around 4 pillars (data harmonization, targeted training, regional Data Hubs, international forums); launch of the AU-UMA Migration Data Hub project; UN General Assembly side event on the African \"narrative\" of migration data."
                    },
                    {
                      year: "2025",
                      fr: "Exposition aux circuits de reddition de comptes de l'UA (réunions du STC-MRIDPs à Addis-Abeba, février) ; lancement du site web officiel ; publication d'un glossaire africain des termes de migration et mobilité ; 2e session de travail OAM-CER à Casablanca.",
                      en: "Exposure to the AU's accountability circuits (STC-MRIDPs meetings in Addis Ababa, February); launch of the official website; publication of an African glossary of migration and mobility terms; 2nd AMO-REC working session in Casablanca."
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="shrink-0 w-16 text-right">
                        <span className="text-xs font-bold text-indigo-700">{item.year}</span>
                      </div>
                      <div className="shrink-0 flex flex-col items-center pt-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                        {idx < 5 && <span className="w-px flex-1 bg-slate-200 mt-1"></span>}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed pb-1">{lang === 'fr' ? item.fr : item.en}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSdgzTab === 'recs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                {lang === 'fr' ? 'Les Blocs Régionalisés du Régime Continental' : 'Regionalized Blocs of the Continental Regime'}
              </span>
              <h3 className="font-serif font-bold text-2xl mb-3">
                {lang === 'fr' ? "Les Communautés Économiques Régionales (CER)" : "Regional Economic Communities (RECs)"}
              </h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                {lang === 'fr' 
                  ? "L'architecture continentale repose sur 8 CER reconnues. L'analyse démontre que l'intégration humaine y est à « géométrie variable » : chaque sous-région développe une trajectoire d'ouverture conditionnée par son histoire, son économie et ses défis sécuritaires."
                  : "The continental architecture relies on 8 recognized RECs. Analysis shows human integration is of 'variable geometry': each sub-region develops an openness trajectory conditioned by its history, economy, and security challenges."}
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                {lang === 'fr' ? "Classement de l'ouverture visa (indice AVOI, 2024)" : "Visa openness ranking (AVOI index, 2024)"}
              </h4>
              <p className="text-xs text-slate-500 mb-5">
                {lang === 'fr'
                  ? "Score moyen par CER (BAD/UA). Le repère vertical marque la moyenne continentale des 8 CER (0,501)."
                  : "Average score per REC (AfDB/AU). The vertical marker shows the continental average across the 8 RECs (0.501)."}
              </p>
              <div className="space-y-3">
                {[...recsList].sort((a, b) => b.avoi - a.avoi).map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3" title={`${rec.name[lang]}: ${rec.avoi.toFixed(3)}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide w-16 shrink-0">{rec.id === 'censad' ? 'CEN-SAD' : rec.id.toUpperCase()}</span>
                    <div className="flex-1 relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-700 rounded-full bar-fill" style={{ width: `${Math.max(4, rec.avoi * 100)}%` }}></div>
                      <div className="absolute top-0 bottom-0 w-px bg-slate-400" style={{ left: '50.1%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-12 text-right shrink-0 tabular-nums">{rec.avoi.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {recsList.map((rec) => {
                const isOpen = expandedRec === rec.id;
                return (
                  <div key={rec.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                    <button onClick={() => setExpandedRec(isOpen ? null : rec.id)} className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="shrink-0 min-w-11 h-11 px-1.5 rounded-full bg-white border border-emerald-200 flex items-center justify-center overflow-hidden text-emerald-700 font-serif font-bold text-[10px] leading-none tracking-tight">
                          {recLogos[rec.id]
                            ? <img src={recLogos[rec.id]} alt="" className="max-h-8 max-w-9 object-contain" />
                            : (rec.id === 'censad' ? 'CEN-SAD' : rec.id.toUpperCase())}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-slate-900 text-base md:text-lg">{rec.name[lang]}</h4>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1.5 inline-block">
                            {rec.tag}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-serif font-bold text-slate-800 tabular-nums">{rec.avoi.toFixed(3)}</div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AVOI</span>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-6 bg-slate-50 border-t border-slate-200 animate-in fade-in duration-300 space-y-5">
                        <div className="flex flex-wrap gap-4 pb-4 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600"><span className="font-bold text-slate-800">{rec.founded}</span> — {lang === 'fr' ? 'fondation' : 'founded'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600 font-bold text-slate-800">{rec.hq[lang]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600"><span className="font-bold text-slate-800">{Object.values(countryRecAffiliations).filter(a => a.includes(rec.id)).length}</span> {lang === 'fr' ? 'États membres' : 'member states'}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">{lang === 'fr' ? rec.desc.fr : rec.desc.en}</p>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                          <div className="lg:col-span-2 bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                            <AfricaRecMap recId={rec.id} lang={lang} />
                          </div>
                          <div className="lg:col-span-3 bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-3">
                              <Users className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> {lang === 'fr' ? "États membres" : "Member states"}
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(countryRecAffiliations)
                                .filter(([, recs]) => recs.includes(rec.id))
                                .map(([iso2]) => {
                                  const meta = Object.values(countryIdIndex).find(m => m.iso2 === iso2);
                                  const note = countryRecNotes[iso2];
                                  return (
                                    <span
                                      key={iso2}
                                      title={note ? note[lang] : undefined}
                                      className="group/chip relative inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md cursor-default transition-all duration-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 hover:-translate-y-0.5 hover:shadow-sm"
                                    >
                                      <CountryFlag iso2={iso2} emoji="" size="sm" />
                                      {meta ? (meta.name[lang] || meta.name.fr) : iso2.toUpperCase()}
                                      {note && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                    </span>
                                  );
                                })}
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-3">
                              {lang === 'fr'
                                ? "Survolez un pays (carte ou étiquette) pour le situer ; le pictogramme ambré signale un retrait récent ou en cours."
                                : "Hover a country (map or label) to locate it; the amber icon flags a recent or ongoing withdrawal."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-2"><FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> {lang === 'fr' ? "Instruments Clés" : "Key Instruments"}</h5>
                            <p className="text-xs text-slate-700 leading-relaxed">{lang === 'fr' ? rec.instruments.fr : rec.instruments.en}</p>
                          </div>
                          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-2"><Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> {lang === 'fr' ? "Dynamique & Défis" : "Dynamics & Challenges"}</h5>
                            <p className="text-xs text-slate-700 leading-relaxed">{lang === 'fr' ? rec.dynamics.fr : rec.dynamics.en}</p>
                          </div>
                        </div>

                        {rec.sources && (
                          <div className="pt-4 border-t border-slate-200">
                            <h5 className="flex items-center font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                              <BookOpen className="w-3 h-3 mr-1.5" /> {lang === 'fr' ? "Sources" : "Sources"}
                            </h5>
                            <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
                              {rec.sources.map((s, si) => (
                                <li key={si}>
                                  <a href={s.url} target="_blank" rel="noopener noreferrer"
                                     className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-blue-700 hover:underline">
                                    {s.label} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* NOUVEAU TAB 3 : ÉTATS JURIDIQUES ET MATRICE DES 54 PAYS */}
        {/* ============================================================== */}
        {activeSdgzTab === 'matrix' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-slate-800">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">
                {lang === 'fr' ? "Cartographie Réglementaire Continentale" : "Continental Regulatory Mapping"}
              </span>
              <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 leading-tight">
                {lang === 'fr' ? "Matrices de réciprocité des visas et profils d'entrée et de séjour (54 pays)" : "Visa reciprocity matrices and entry/residence profiles (54 countries)"}
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl">
                {lang === 'fr'
                  ? "L'analyse des seuils d'entrée et de l'obligation de résidence montre qu'une frontière juridique stricte sépare deux statuts. Le « visiteur » est toléré pour le commerce ou le tourisme de courte durée ; l'« immigrant », lui, dépend du pouvoir discrétionnaire de l'État pour s'établir. Le seuil standard en Afrique est de 90 jours."
                  : "Analysis of entry thresholds and the residence obligation shows the persistence of a strict legal border between \"visitor\" status (tolerated for short-term trade or tourism) and \"immigrant\" status (subject to the State's discretionary power over settlement). The standard threshold across Africa is 90 days."}
              </p>
            </div>

            {/* Disclaimer Methodologique */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">{lang === 'fr' ? "À propos de ces données" : "About this data"}</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {lang === 'fr' ? (
                      <>Ce tableau de synthèse et les fiches détaillées par pays résultent d'une <strong>analyse comparative des instruments juridiques nationaux</strong> (Lois sur l'immigration et codes des étrangers) en vigueur sur le continent en 2025. Ces données contextualisent les indicateurs de l'Africa Visa Openness Index (BAD).</>
                    ) : (
                      <>This summary table and the detailed country sheets result from a <strong>comparative analysis of national legal instruments</strong> (immigration laws and codes on foreigners) in force across the continent in 2025. This data contextualizes the Africa Visa Openness Index (AfDB) indicators.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Distribution des seuils légaux (54 pays) */}
            {(() => {
              const parseThresholdDays = (str) => {
                const hasDays = /\d+\s*(Jours?|Days?)/i.test(str);
                if (!hasDays) {
                  const monthMatch = str.match(/(\d+)\s*(Mois|Months?)/i);
                  if (monthMatch) return parseInt(monthMatch[1], 10) * 30;
                }
                const nums = str.match(/\d+/g);
                if (!nums) return null;
                return Math.max(...nums.map(Number));
              };
              const buckets = [
                { key: '<=30', labelFr: '≤ 30 jours', labelEn: '≤ 30 days', test: (d) => d <= 30 },
                { key: '31-89', labelFr: '31-89 jours', labelEn: '31-89 days', test: (d) => d > 30 && d < 90 },
                { key: '90', labelFr: '90 jours (la norme)', labelEn: '90 days (the norm)', test: (d) => d === 90 },
                { key: '91-179', labelFr: '91-179 jours', labelEn: '91-179 days', test: (d) => d > 90 && d < 180 },
                { key: '>=180', labelFr: '≥ 180 jours', labelEn: '≥ 180 days', test: (d) => d >= 180 },
              ];
              const allCountries = legalMatrixData.flatMap((r) => r.countries);
              const counts = buckets.map((b) => {
                const members = allCountries.filter((c) => {
                  const d = parseThresholdDays(c.threshold.en);
                  return d !== null && b.test(d);
                });
                return { ...b, count: members.length, members };
              });
              const maxCount = Math.max(...counts.map((c) => c.count), 1);
              return (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-bold text-slate-800 mb-1">
                    {lang === 'fr' ? "Distribution des seuils légaux de visiteur (54 pays)" : "Distribution of legal visitor thresholds (54 countries)"}
                  </h4>
                  <p className="text-xs text-slate-500 mb-5">
                    {lang === 'fr'
                      ? "Nombre de pays par palier de seuil, calculé en direct depuis la matrice ci-dessous."
                      : "Number of countries per threshold band, computed live from the matrix below."}
                  </p>
                  <div className="space-y-3">
                    {counts.filter((b) => b.count > 0).map((b) => (
                      <div key={b.key} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide w-28 shrink-0">{lang === 'fr' ? b.labelFr : b.labelEn}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${b.key === '90' ? 'bg-amber-600' : 'bg-slate-400'}`}
                            style={{ width: `${Math.max(3, (b.count / maxCount) * 100)}%` }}
                          ></div>
                        </div>
                        {/* Les pays s'affichent au survol du compte, pour garder le graphique lisible. */}
                        <span className="group relative w-20 text-right shrink-0">
                          <span className="text-xs font-bold text-slate-700 tabular-nums border-b border-dotted border-slate-300 cursor-help">
                            {b.count} {lang === 'fr' ? 'pays' : 'countries'}
                          </span>
                          <span className="pointer-events-none absolute right-0 bottom-full mb-2 z-20 hidden group-hover:block w-64 text-left bg-slate-900 text-white rounded-md shadow-lg p-3">
                            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {lang === 'fr' ? b.labelFr : b.labelEn}
                            </h4>
                            <span className="block text-[11px] leading-relaxed">
                              {b.members.map((m) => m.name[lang]).join(' · ')}
                            </span>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic mt-4 pt-3 border-t border-slate-100">
                    {lang === 'fr'
                      ? "Survolez un effectif pour afficher les pays concernés. Les paliers sans aucun pays ne sont pas représentés."
                      : "Hover a count to reveal the countries concerned. Bands with no country are not shown."}
                  </p>
                </div>
              );
            })()}

            {/* Toggle Vue Tableau / Vue Fiches */}
            <div className="flex bg-slate-200 p-1.5 rounded-lg w-fit mx-auto md:mx-0">
              <button
                onClick={() => setMatrixView('table')}
                className={`py-2 px-6 rounded-md text-xs font-bold transition-all flex items-center ${matrixView === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <TableProperties className="w-3.5 h-3.5 mr-2" /> {lang === 'fr' ? "Vue Tableau (Synthèse)" : "Table View (Summary)"}
              </button>
              <button
                onClick={() => setMatrixView('details')}
                className={`py-2 px-6 rounded-md text-xs font-bold transition-all flex items-center ${matrixView === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5 mr-2" /> {lang === 'fr' ? "Fiches Détaillées" : "Detailed Sheets"}
              </button>
            </div>

            {/* VUE : TABLEAU */}
            {matrixView === 'table' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{lang === 'fr' ? "Région" : "Region"}</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{lang === 'fr' ? "Pays" : "Country"}</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{lang === 'fr' ? "Seuil Légal Visiteur" : "Legal Visitor Threshold"}</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{lang === 'fr' ? "Notes sur l'Obligation de Résidence" : "Notes on the Residence Obligation"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {legalMatrixData.map((regionObj, rIdx) => (
                        <React.Fragment key={rIdx}>
                          {regionObj.countries.map((country, cIdx) => (
                            <tr key={cIdx} className="hover:bg-slate-50 transition-colors">
                              {cIdx === 0 && (
                                <td rowSpan={regionObj.countries.length} className="py-3 px-4 font-bold text-slate-900 bg-slate-50/50 align-top border-r border-slate-100">
                                  {regionObj.region[lang]}
                                </td>
                              )}
                              <td className="py-3 px-4 font-bold text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  {country.name[lang]}
                                  {(() => {
                                    const o = opennessByName(country.name.fr);
                                    return o ? <Star className={`w-3 h-3 shrink-0 ${visaOpenTiers[o.tier].dot}`} title={`${visaOpenTiers[o.tier].label[lang]} — ${o.note[lang]}`} /> : null;
                                  })()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                                  {country.threshold[lang]}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 leading-relaxed">{country.tableNotes[lang]}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Légende des étoiles : indispensable, la même symbolique est utilisée dans l'Explorateur */}
                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
                    {lang === 'fr' ? "Légende — ouverture aux ressortissants africains" : "Legend — openness to African nationals"}
                  </span>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {Object.entries(visaOpenTiers).map(([key, tier]) => (
                      <span key={key} className="flex items-start gap-1.5">
                        <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.dot}`} />
                        <span>
                          <span className="text-[11px] font-bold text-slate-700 block">{tier.label[lang]}</span>
                          <span className="text-[10px] text-slate-500">
                            {key === 'full' && (lang === 'fr' ? "Aucun visa requis, pour tous les Africains" : "No visa required, for all Africans")}
                            {key === 'partial' && (lang === 'fr' ? "Ouvert, à l'exception de certains États" : "Open, with named exceptions")}
                            {key === 'announced' && (lang === 'fr' ? "Mesure annoncée, pas encore effective" : "Announced, not yet in force")}
                          </span>
                        </span>
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic mt-3">
                    {lang === 'fr'
                      ? "Sources : annonces officielles nationales et Africa Visa Openness Index (BAD/CUA, 2024). Même symbolique que dans l'Explorateur."
                      : "Sources: official national announcements and the Africa Visa Openness Index (AfDB/AUC, 2024). Same symbols as in the Explorer."}
                  </p>
                </div>
              </div>
            )}

            {/* VUE : FICHES DÉTAILLÉES */}
            {matrixView === 'details' && (
              <div className="space-y-8 animate-in fade-in">
                {legalMatrixData.map((regionObj, rIdx) => (
                  <div key={rIdx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xl font-serif font-bold text-slate-900 mb-3 border-b border-slate-100 pb-3">{regionObj.region[lang]}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium italic">{regionObj.intro[lang]}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {regionObj.countries.map((country, cIdx) => (
                        <div key={cIdx} className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              {country.name[lang]}
                              {(() => {
                                const o = opennessByName(country.name.fr);
                                return o ? <Star className={`w-4 h-4 shrink-0 ${visaOpenTiers[o.tier].dot}`} title={`${visaOpenTiers[o.tier].label[lang]} — ${o.note[lang]}`} /> : null;
                              })()}
                            </h5>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{country.threshold[lang]}</span>
                          </div>
                          <div className="text-xs text-slate-500 mb-4 pb-3 border-b border-slate-200">
                            <strong className="text-slate-700 uppercase tracking-widest">{lang === 'fr' ? "Instrument : " : "Instrument: "}</strong>
                            <span className="italic">{country.instrument[lang]}</span>
                          </div>
                          <div className="space-y-3 flex-grow">
                            {country.details.map((detail, dIdx) => (
                              <div key={dIdx}>
                                <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{detail.label[lang]}</h6>
                                <p className="text-xs text-slate-800 leading-relaxed">{detail.text[lang]}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sources Légales */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                {lang === 'fr' ? "Liste des Instruments Juridiques Analysés (Sources)" : "List of Legal Instruments Analyzed (Sources)"}
              </h4>
              <div className="h-48 overflow-y-auto pr-4 custom-scrollbar text-xs text-slate-600 leading-relaxed space-y-3">
                {lang === 'fr' ? (
                  <>
                    <p><strong>Afrique méditerranéenne :</strong><br/>
                    Algérie : Loi n° 08-11 (2008). Égypte : Loi n° 89 (1960, am. 2018). Libye : Loi n° 6 (1987). Maroc : Loi n° 02-03 (2003). Mauritanie : Loi n° 1965-046. Soudan : Passports and Immigration Act (1994). Tunisie : Loi n° 68-7 (1968).</p>
                    <p><strong>Afrique de l'Ouest :</strong><br/>
                    Bénin : Loi n° 2025-15. Burkina Faso : Loi de 2024. Cap-Vert : Loi n° 66/VIII/2014. Côte d'Ivoire : Loi n° 2004-303. Gambie : Immigration Act (Cap. 16:02). Ghana : Immigration Act (2000). Guinée : Loi L/94/019. Guinée-Bissau : Loi n° 2/92. Liberia : Aliens and Nationality Law. Mali : Loi n° 04-058. Niger : Ordonnance n° 81-40. Nigeria : Immigration Act 2015. Sénégal : Loi n° 71-10. Sierra Leone : Non-Citizens Act (1965). Togo : Loi sur la police des étrangers (2022).</p>
                    <p><strong>Afrique Centrale :</strong><br/>
                    Angola : Loi n° 13/19. Burundi : Loi n° 1/13. Cameroun : Loi n° 97/012. Gabon : Loi n° 5/86. Guinée équat. : Loi org. n° 3/2010. RCA : Code de l'immigration. RDC : Ordonnance n° 83-033. Congo : Loi n° 23-96. Rwanda : Loi n° 57/2018. Sao Tomé : Loi n° 5/2008. Tchad : Ordonnance n° 27-62.</p>
                    <p><strong>Afrique de l'Est :</strong><br/>
                    Comores : Loi n° 88-025. Djibouti : Loi n° 201/AN/07. Érythrée : Proclamation n° 24/1992. Éthiopie : Proclamation n° 354/2003. Kenya : Citizenship and Immigration Act (2011). Madagascar : Loi n° 62-006. Maurice : Immigration Act 2022. Ouganda : Act (Cap. 66). Seychelles : Decree 1979. Somalie : Law 1966. Soudan du Sud : Act 2011. Tanzanie : Act 1995.</p>
                    <p><strong>Afrique Australe :</strong><br/>
                    Afrique du Sud : Act 13 (2002). Botswana : Act 2011. Eswatini : Act 1982. Lesotho : Act 1966. Malawi : Act (Cap. 15:03). Mozambique : Loi n° 23/2022. Namibie : Act 7 (1993). Zambie : Act 2010. Zimbabwe : Act (Chapter 4:02).</p>
                  </>
                ) : (
                  <>
                    <p><strong>Mediterranean Africa:</strong><br/>
                    Algeria: Law No. 08-11 (2008). Egypt: Law No. 89 (1960, am. 2018). Libya: Law No. 6 (1987). Morocco: Law No. 02-03 (2003). Mauritania: Law No. 1965-046. Sudan: Passports and Immigration Act (1994). Tunisia: Law No. 68-7 (1968).</p>
                    <p><strong>West Africa:</strong><br/>
                    Benin: Law No. 2025-15. Burkina Faso: 2024 Law. Cabo Verde: Law No. 66/VIII/2014. Côte d'Ivoire: Law No. 2004-303. Gambia: Immigration Act (Cap. 16:02). Ghana: Immigration Act (2000). Guinea: Law L/94/019. Guinea-Bissau: Law No. 2/92. Liberia: Aliens and Nationality Law. Mali: Law No. 04-058. Niger: Ordinance No. 81-40. Nigeria: Immigration Act 2015. Senegal: Law No. 71-10. Sierra Leone: Non-Citizens Act (1965). Togo: Law on the Policing of Foreigners (2022).</p>
                    <p><strong>Central Africa:</strong><br/>
                    Angola: Law No. 13/19. Burundi: Law No. 1/13. Cameroon: Law No. 97/012. Gabon: Law No. 5/86. Equatorial Guinea: Organic Law No. 3/2010. CAR: Immigration Code. DRC: Ordinance No. 83-033. Congo (Rep.): Law No. 23-96. Rwanda: Law No. 57/2018. Sao Tome: Law No. 5/2008. Chad: Ordinance No. 27-62.</p>
                    <p><strong>East Africa:</strong><br/>
                    Comoros: Law No. 88-025. Djibouti: Law No. 201/AN/07. Eritrea: Proclamation No. 24/1992. Ethiopia: Proclamation No. 354/2003. Kenya: Citizenship and Immigration Act (2011). Madagascar: Law No. 62-006. Mauritius: Immigration Act 2022. Uganda: Act (Cap. 66). Seychelles: Decree 1979. Somalia: Law 1966. South Sudan: Act 2011. Tanzania: Act 1995.</p>
                    <p><strong>Southern Africa:</strong><br/>
                    South Africa: Act 13 (2002). Botswana: Act 2011. Eswatini: Act 1982. Lesotho: Act 1966. Malawi: Act (Cap. 15:03). Mozambique: Law No. 23/2022. Namibia: Act 7 (1993). Zambia: Act 2010. Zimbabwe: Act (Chapter 4:02).</p>
                  </>
                )}
              </div>
            </div>

          </div>
        )}

      </section>
    </div>
  );
};

const TabExplorer = ({ text, lang, activeSubRegion, setActiveSubRegion, activeSubTab, setActiveSubTab, searchTerm, setSearchTerm, filteredCountries, display, setShowModal, exportCountriesCSV, explorerView, setExplorerView, mapIndicatorKey, setMapIndicatorKey }) => {
  const mapIndicator = mapIndicators.find(i => i.key === mapIndicatorKey) || mapIndicators[0];
  return (
  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
    <PageHeader
      badge={text.headers.explorer.badge}
      plate={"Pl. III"}
      plain={text.headers.explorer.plain}
      lang={lang}
      title={text.headers.explorer.title}
      highlight={text.headers.explorer.highlight}
      desc={text.headers.explorer.desc}
      icon={MapIcon}
    />

    <div className="flex flex-col lg:flex-row gap-8 items-start">
      
      {/* SIDEBAR GAUCHE : NAVIGATION */}
      <div className="w-full lg:w-1/4 space-y-6 lg:sticky lg:top-24">
        
        {/* RECHERCHE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            /* Un placeholder n'est pas un nom accessible : il disparait des qu'on
               saisit et n'est pas restitue de facon fiable par les lecteurs d'ecran. */
            aria-label={lang === 'fr' ? 'Rechercher un pays' : 'Search for a country'}
            placeholder={text.sidebar.search}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTRES DE RÉGION */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <MapIcon className="w-3.5 h-3.5 mr-1.5" />
            {text.sidebar.title}
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveSubRegion('all'); setActiveSubTab('perspective'); setSearchTerm(''); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center ${activeSubRegion === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Globe className={`w-4 h-4 mr-2.5 ${activeSubRegion === 'all' ? 'text-blue-400' : 'text-slate-400'}`} />
              {text.all_regions}
            </button>
            
            <div className="pt-3 pb-2">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-4">{text.sidebar.subregion}</span>
            </div>
            
            {Object.keys(text.regions).map(regionKey => (
              <button
                key={regionKey}
                onClick={() => { setActiveSubRegion(regionKey); setActiveSubTab('perspective'); setSearchTerm(''); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-between items-center group ${activeSubRegion === regionKey ? 'bg-blue-50 text-blue-800 border border-blue-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
              >
                <span>{text.regions[regionKey]}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeSubRegion === regionKey ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ZONE PRINCIPALE : RÉSULTATS */}
      <div className="w-full lg:w-3/4 space-y-6">
        
        {/* TABS (Perspective globale vs Liste de pays) */}
        <div className="flex bg-slate-200 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveSubTab('perspective')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'perspective' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {activeSubRegion === 'all' ? text.perspectives.continent : text.perspectives.subregion}
          </button>
          <button
            onClick={() => {
              if (filteredCountries.length > 0) {
                setActiveSubTab(filteredCountries[0].id);
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeSubTab !== 'perspective' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {lang === 'fr' ? 'Profils Nationaux' : 'National Profiles'} ({filteredCountries.length})
          </button>
        </div>

        {/* CONTENU (Vue Perspective) */}
        {activeSubTab === 'perspective' && (
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
              <div>
                <span className="inline-block px-2.5 py-1 rounded bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                  {text.badge.regional}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 flex items-center">
                  {display.flagIcon ? (
                    <span className={`mr-3 p-1.5 rounded-lg bg-slate-50 border border-slate-200 ${display.flagColor || 'text-blue-700'}`}>
                      <display.flagIcon className="w-6 h-6" />
                    </span>
                  ) : (
                    <span className="mr-3 text-3xl">{display.flag}</span>
                  )}
                  {display.name}
                </h2>
              </div>
              <button onClick={() => setShowModal(true)} className="hidden md:flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-md font-bold text-xs transition shadow-sm">
                <BarChart3 className="w-4 h-4" />
                <span>{text.analysis_btn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><Users className="w-3 h-3 mr-1.5" /> {text.metrics.stock}</span>
                <div className="text-3xl font-serif font-bold text-slate-900">{display.stock}</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><PieChart className="w-3 h-3 mr-1.5" /> {text.metrics.evolution}</span>
                <div className="text-3xl font-serif font-bold text-blue-700">{display.evolution}%</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><HeartPulse className="w-3 h-3 mr-1.5" /> {text.metrics.female}</span>
                <div className="text-3xl font-serif font-bold text-rose-700">{display.female}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-emerald-50/60 p-5 rounded-lg border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 block flex items-center"><ArrowRight className="w-3 h-3 mr-1.5" /> {lang === 'fr' ? "Rétention (Sud)" : "Retention (South)"}</span>
                <div className="text-3xl font-serif font-bold text-emerald-700">{display.retention}%</div>
              </div>
              <div className="bg-amber-50/60 p-5 rounded-lg border border-amber-100">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 block flex items-center"><TrendingUp className="w-3 h-3 mr-1.5" /> {lang === 'fr' ? "Transferts (% PIB, moy.)" : "Remittances (% GDP, avg.)"}</span>
                <div className="text-3xl font-serif font-bold text-amber-700">{display.remittances !== null && display.remittances !== undefined ? `${display.remittances}%` : (lang === 'fr' ? 'N/D' : 'N/A')}</div>
              </div>
              <div className="bg-indigo-50/60 p-5 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 block flex items-center"><Briefcase className="w-3 h-3 mr-1.5" /> {lang === 'fr' ? "Activité Migrants (OIT, moy.)" : "Migrant Activity (ILO, avg.)"}</span>
                <div className="text-3xl font-serif font-bold text-indigo-700">{display.labour_participation !== null && display.labour_participation !== undefined ? `${display.labour_participation}%` : (lang === 'fr' ? 'N/D' : 'N/A')}</div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-widest flex items-center">
                <TableProperties className="w-4 h-4 mr-2" />
                {text.comparative_view_title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {text.comparative_view_desc}
              </p>
              
              {/* Distribution Bar if available (for 'all' regions view) */}
              {display.distribution && (
                <div className="mt-6 pt-5 border-t border-blue-200/50">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-800">{display.distribution[0].label[lang]} ({display.distribution[0].value}%)</span>
                    <span className="text-slate-600">{display.distribution[1].label[lang]} ({display.distribution[1].value}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${display.distribution[0].value}%`}}></div>
                    <div className="h-full bg-slate-500 transition-all duration-1000" style={{width: `${display.distribution[1].value}%`}}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowModal(true)} className="w-full mt-6 md:hidden flex justify-center items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-md font-bold text-sm transition shadow-sm">
              <BarChart3 className="w-4 h-4" />
              <span>{text.analysis_btn}</span>
            </button>
          </div>
        )}

        {/* CONTENU (Liste des Pays) */}
        {activeSubTab !== 'perspective' && (
          <div className="space-y-4">

            {/* Carte interactive : porte d'entrée principale */}
            <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800">
                    {lang === 'fr' ? "Lecture cartographique" : "Map view"}
                  </h3>
                  {/* Ce que montre la carte, dit simplement — puis la definition
                      technique de l'indicateur, pour qui la cherche. */}
                  <p className="text-[13px] text-slate-700 mt-1 max-w-xl leading-relaxed">
                    {mapIndicator.plain
                      ? mapIndicator.plain[lang]
                      : mapIndicator.hint[lang]}
                    {mapIndicator.term && (
                      <> <Terme k={mapIndicator.term} lang={lang}>
                        {lang === 'fr' ? 'Voir la définition' : 'See the definition'}
                      </Terme></>
                    )}
                  </p>
                  <p className="text-[11px] mt-1 max-w-xl leading-relaxed" style={{ color: 'var(--label)' }}>
                    {mapIndicator.hint[lang]}
                  </p>
                </div>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
                  <button
                    onClick={() => setExplorerView('map')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${explorerView === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {lang === 'fr' ? 'Carte' : 'Map'}
                  </button>
                  <button
                    onClick={() => setExplorerView('list')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${explorerView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {lang === 'fr' ? 'Liste' : 'List'}
                  </button>
                </div>
              </div>

              {explorerView === 'map' && (
                <>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mapIndicators.map(ind => (
                      <button
                        key={ind.key}
                        onClick={() => setMapIndicatorKey(ind.key)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
                          ind.key === mapIndicator.key
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {ind.label[lang]}
                      </button>
                    ))}
                  </div>
                  <AfricaChoropleth
                    indicator={mapIndicator}
                    lang={lang}
                    selectedId={activeSubTab}
                    onSelect={(id) => setActiveSubTab(id)}
                  />
                </>
              )}
            </div>

            {/* Grille des drapeaux pour navigation rapide */}
            <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm ${explorerView === 'map' ? 'hidden' : ''}`}>
              {filteredCountries.length === 0 && (
                <div className="w-full p-4 text-center text-slate-400 text-sm">
                  {lang === 'fr' ? 'Aucun pays trouvé.' : 'No country found.'}
                </div>
              )}
              {activeSubRegion === 'all' && filteredCountries.length > 0 ? (
                <div className="space-y-4">
                  {Object.keys(text.regions).map(regionKey => {
                    const regionCountries = filteredCountries.filter(c => countryRegionMap[c.id] === regionKey);
                    if (regionCountries.length === 0) return null;
                    return (
                      <div key={regionKey}>
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-0.5">
                          {text.regions[regionKey]} <span className="text-slate-300">({regionCountries.length})</span>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {regionCountries.map(c => {
                            const openness = visaOpenToAllAfrica[c.iso2];
                            return (
                              <button
                                key={c.id}
                                onClick={() => setActiveSubTab(c.id)}
                                title={openness ? `${visaOpenTiers[openness.tier].label[lang]} — ${openness.note[lang]}` : undefined}
                                className={`px-3 py-1.5 rounded border transition-all text-xs font-bold flex items-center space-x-2 ${
                                  activeSubTab === c.id
                                    ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <CountryFlag iso2={c.iso2} emoji={c.flag} size="sm" />
                                <span className="hidden sm:inline">{c.name[lang] || c.name.fr}</span>
                                {openness && <Star className={`w-3 h-3 shrink-0 ${visaOpenTiers[openness.tier].dot}`} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {filteredCountries.map(c => {
                    const openness = visaOpenToAllAfrica[c.iso2];
                    return (
                      <button
                        key={c.id}
                        onClick={() => setActiveSubTab(c.id)}
                        title={openness ? `${visaOpenTiers[openness.tier].label[lang]} — ${openness.note[lang]}` : undefined}
                        className={`px-3 py-1.5 rounded border transition-all text-xs font-bold flex items-center space-x-2 ${
                          activeSubTab === c.id
                            ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <CountryFlag iso2={c.iso2} emoji={c.flag} size="sm" />
                        <span className="hidden sm:inline">{c.name[lang] || c.name.fr}</span>
                        {openness && <Star className={`w-3 h-3 shrink-0 ${visaOpenTiers[openness.tier].dot}`} />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2">
                <CsvButton onClick={exportCountriesCSV} label={lang === 'fr' ? "54 pays — tous indicateurs (CSV)" : "54 countries — all indicators (CSV)"} className="basis-full sm:basis-auto justify-center" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {lang === 'fr' ? "Ouverture aux ressortissants africains" : "Openness to African nationals"}
                </span>
                {Object.entries(visaOpenTiers).map(([key, tier]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <Star className={`w-3 h-3 ${tier.dot}`} />
                    <span className="text-[10px] font-bold text-slate-500">{tier.label[lang]}</span>
                  </span>
                ))}
                <span className="text-[10px] text-slate-400 italic basis-full">
                  {lang === 'fr' ? "Sources : annonces officielles nationales et " : "Sources: official national announcements and "}
                  <a href="https://www.visaopenness.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">
                    {lang === 'fr' ? "Africa Visa Openness Index (BAD/CUA, 2024)" : "Africa Visa Openness Index (AfDB/AUC, 2024)"}
                  </a>.
                </span>
              </div>
            </div>

            {/* Profil du pays sélectionné */}
            {filteredCountries.find(c => c.id === activeSubTab) && (
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                      {text.badge.country}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 flex items-center flex-wrap gap-y-2">
                      <CountryFlag iso2={display.iso2} emoji={display.flag} size="md" className="mr-3" />
                      {display.name}
                      {visaOpenToAllAfrica[display.iso2] && (
                        <Star className={`w-5 h-5 ml-3 ${visaOpenTiers[visaOpenToAllAfrica[display.iso2].tier].dot}`} />
                      )}
                    </h2>
                    {visaOpenToAllAfrica[display.iso2] && (() => {
                      const o = visaOpenToAllAfrica[display.iso2];
                      const tier = visaOpenTiers[o.tier];
                      return (
                        <div className={`mt-3 inline-flex items-start gap-2 px-3 py-2 rounded-md border max-w-2xl ${tier.style}`}>
                          <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.dot}`} />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest block">{tier.label[lang]}</span>
                            <span className="text-xs leading-relaxed block mt-0.5">{o.note[lang]}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <button onClick={() => setShowModal(true)} className="hidden md:flex items-center space-x-2 px-5 py-2.5 font-bold text-xs transition shrink-0 self-start" style={{ backgroundColor: 'var(--ink)', color: '#FFFDF9', borderRadius: 2, boxShadow: 'inset 2px 0 0 var(--accent)' }}>
                    <Target className="w-4 h-4" />
                    <span>{text.analysis_btn}</span>
                  </button>
                </div>

                {/* Releve d'indicateurs, groupe par ce qu'il dit et source par famille. */}
                <div className="border border-slate-200 mb-6 stagger">
                  {[
                    {
                      title: lang === 'fr' ? "Qui est là" : 'Who is there',
                      source: 'UN DESA (2024)',
                      wash: 'wash-inkblue', tone: 'figure-inkblue', dot: 'var(--accent-2)',
                      cells: [
                        { v: <Num value={display.stock} lang={lang} />, l: lang === 'fr' ? 'Migrants internationaux' : 'International migrants' },
                        { v: `${fmtNum(display.evolution, lang)} %`, l: lang === 'fr' ? 'De la population nationale' : 'Of the national population' },
                        { v: `${fmtNum(display.female, lang)} %`, l: lang === 'fr' ? 'De femmes parmi eux' : 'Women among them' },
                      ],
                    },
                    {
                      title: lang === 'fr' ? "D'où l'on vient" : 'Where they come from',
                      source: 'UA / OIT / OIM / CEA (2021)',
                      wash: 'wash-terra', tone: 'figure-terra', dot: 'var(--accent)',
                      cells: [
                        { v: `${fmtNum(display.retention, lang)} %`, l: lang === 'fr' ? 'Rétention Sud-Sud' : 'South-South retention' },
                      ],
                    },
                    {
                      title: lang === 'fr' ? 'Ce que cela produit' : 'What it produces',
                      source: lang === 'fr' ? 'Banque mondiale / OIT' : 'World Bank / ILO',
                      wash: 'wash-ok', tone: 'figure-ok', dot: 'var(--ok)',
                      cells: [
                        {
                          v: display.remittances != null ? `${fmtNum(display.remittances, lang)} %` : (lang === 'fr' ? 'N/D' : 'N/A'),
                          l: (lang === 'fr' ? 'Transferts de fonds (% PIB)' : 'Remittances (% GDP)')
                             + (display.remittances_year ? ` — ${display.remittances_year}` : ''),
                        },
                        {
                          v: display.labour_participation != null ? `${fmtNum(display.labour_participation, lang)} %` : (lang === 'fr' ? 'N/D' : 'N/A'),
                          l: (lang === 'fr' ? "Activité des migrants" : 'Migrant labour activity')
                             + (display.labour_participation_year ? ` — ${display.labour_participation_year}` : ''),
                        },
                      ],
                    },
                  ].map((grp, gi) => (
                    <div key={gi} style={gi > 0 ? { borderTop: '1px solid var(--rule)' } : undefined}>
                      <div className={`flex flex-wrap items-baseline justify-between gap-2 px-5 py-2.5 ${grp.wash}`}>
                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                              style={{ color: 'var(--ink)' }}>
                          <span className="dot" style={{ backgroundColor: grp.dot }} />
                          {grp.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--label)' }}>
                          {grp.source}
                        </span>
                      </div>
                      <div className={`grid grid-cols-1 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 ${grp.cells.length === 1 ? '' : grp.cells.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                        {grp.cells.map((c, ci) => (
                          <div key={ci} className="figure-row px-5 py-4">
                            <div className={`text-2xl font-serif font-bold tabular-nums leading-none ${grp.tone}`}>{c.v}</div>
                            <span className="block text-[10px] font-bold uppercase tracking-widest mt-2 leading-snug"
                                  style={{ color: 'var(--label)' }}>
                              {c.l}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {display.impact && (
                   <div className="bg-amber-50 p-5 rounded-lg border border-amber-100 flex items-start mb-6">
                     <Info className="w-5 h-5 text-amber-600 mr-3 shrink-0 mt-0.5" />
                     <p className="text-sm text-amber-900 font-medium leading-relaxed">{display.impact}</p>
                   </div>
                )}
                
                <button onClick={() => setShowModal(true)} className="w-full mt-4 md:hidden flex justify-center items-center space-x-2 px-5 py-3 font-bold text-sm transition" style={{ backgroundColor: 'var(--ink)', color: '#FFFDF9', borderRadius: 2 }}>
                  <Target className="w-4 h-4" />
                  <span>{text.analysis_btn}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
};

const glossaryData = [
  {
    category: { fr: "Typologie des Mobilités", en: "Mobility Typology" },
    icon: Globe,
    terms: [
      {
        term: "Migration",
        en_term: "Migration",
        fr: "Le mouvement d'une personne ou d'un groupe de personnes d'une unité géographique à une autre à travers une frontière administrative ou politique, avec l'intention de s'installer indéfiniment ou temporairement dans un lieu autre que son lieu d'origine (Statut de l'OAM).",
        en: "The movement of a person or group of persons from one geographical unit to another across an administrative or political border, with the intention of settling indefinitely or temporarily in a place other than their place of origin (AMO Statute).",
        source: { fr: "Statut de l'Observatoire africain des migrations (UA)", en: "Statute of the African Migration Observatory (AU)", url: "https://amo.au.int/en" }
      },
      {
        term: "Migration internationale",
        en_term: "International Migration",
        fr: "Mouvement d'individus à travers des frontières étatiques internationalement reconnues avec l'intention d'établir une résidence. À des fins statistiques, l'ONU (UNDESA) et l'OIM définissent un migrant international comme une personne qui change de pays de résidence habituelle pour une période d'au moins 12 mois.",
        en: "Movement of individuals across internationally recognized state borders with the intention of establishing residence. For statistical purposes, the UN (UNDESA) and IOM define an international migrant as a person who moves to a country other than their usual residence for at least 12 months.",
        source: { fr: "UN DESA — définition opératoire (résidence habituelle, 12 mois)", en: "UN DESA — operational definition (usual residence, 12 months)" }
      },
      {
        term: "Migration interne",
        en_term: "Internal Migration",
        fr: "Mouvement de personnes à l'intérieur d'un État impliquant l'établissement d'une nouvelle résidence temporaire ou permanente (ex: rural vers urbain). C'est la forme de migration la plus courante (OIM).",
        en: "Movement of people within a State involving the establishment of a new temporary or permanent residence (e.g., rural-to-urban). It is the most common form of migration (IOM).",
        source: { fr: "OIM — Glossaire de la migration", en: "IOM — Glossary on Migration" }
      },
      {
        term: "Migration de travail",
        en_term: "Labor Migration",
        fr: "Mouvement d'individus de leur pays d'origine vers un autre pays à des fins d'emploi. L'OIT et le MPFA (2018-2030) soulignent qu'elle peut générer un « triple gain » (pour le pays d'origine, de destination et le migrant) si elle est bien gouvernée.",
        en: "Movement of individuals from their home country to another country for the purpose of employment. The ILO and MPFA (2018-2030) emphasize that it can create a 'triple win' scenario if well-governed."
      },
      {
        term: "Migration circulaire",
        en_term: "Circular Migration",
        fr: "Mouvement temporaire et répété d'individus entre leur pays d'origine et un ou plusieurs pays d'accueil, souvent à des fins économiques, permettant le maintien de liens forts avec les communautés d'origine (OIM).",
        en: "Temporary and repeated movement of individuals between their country of origin and one or more host countries, typically for economic purposes, allowing the maintenance of strong links with home communities (IOM).",
        source: { fr: "OIM — Glossaire de la migration", en: "IOM — Glossary on Migration" }
      },
      {
        term: "Migration saisonnière",
        en_term: "Seasonal Migration (Labor)",
        fr: "Déplacement temporaire lié aux fluctuations saisonnières de secteurs spécifiques (agriculture, tourisme). En Afrique, c'est une stratégie de subsistance traditionnelle facilitée par des protocoles régionaux comme celui de la CEDEAO.",
        en: "Temporary movement linked to seasonal fluctuations in specific industries (agriculture, tourism). In Africa, it is a traditional livelihood strategy facilitated by regional protocols like ECOWAS.",
        source: { fr: "Protocole de la CEDEAO sur la libre circulation", en: "ECOWAS Protocol on Free Movement" }
      },
      {
        term: "Mobilité induite par le climat",
        en_term: "Climate-Induced Mobility",
        fr: "Mouvement (interne ou transfrontalier, volontaire ou forcé) déclenché par des changements climatiques soudains (inondations) ou progressifs (sécheresse). Bien que le terme « réfugié climatique » n'ait pas d'existence légale sous la Convention de 1951, ces populations nécessitent une protection (HCR, Déclaration de Kampala 2022).",
        en: "Movement (internal or cross-border, voluntary or forced) driven by sudden (floods) or progressive (drought) climate changes. While the term 'climate refugee' has no legal standing under the 1951 Convention, these populations require protection (UNHCR, Kampala Declaration 2022).",
        source: { fr: "HCR ; Déclaration ministérielle de Kampala sur migrations, environnement et changement climatique (2022)", en: "UNHCR; Kampala Ministerial Declaration on Migration, Environment and Climate Change (2022)", url: "https://au.int/" }
      },
      {
        term: "Migration régulière",
        en_term: "Regular Migration",
        fr: "Mouvement s'effectuant en conformité avec les lois et règlements des pays d'origine, de transit et de destination (OIM). Le Pacte Mondial (GCM) encourage l'expansion des voies régulières pour réduire les vulnérabilités.",
        en: "Movement that occurs in compliance with the laws and regulations of sending, transit, and receiving states (IOM). The Global Compact (GCM) encourages expanding regular pathways to reduce vulnerabilities.",
        source: { fr: "Pacte mondial pour les migrations (GCM, 2018)", en: "Global Compact for Migration (GCM, 2018)" }
      },
      {
        term: "Migration irrégulière",
        en_term: "Irregular Migration",
        fr: "Mouvement de personnes s'opérant en dehors des lois, règlements ou accords internationaux régissant l'entrée ou la sortie (OIM). Cela inclut le franchissement non autorisé des frontières ou le dépassement de la durée de validité d'un visa (overstaying).",
        en: "Movement of persons that takes place outside the laws, regulations, or international agreements governing entry or exit (IOM). This includes unauthorized border crossings or visa overstaying."
      },
      {
        term: "Dépassement de séjour (Overstaying)",
        en_term: "Overstaying",
        fr: "Fait de rester dans un pays au-delà de la période autorisée par un visa ou un permis. C'est l'une des formes les plus courantes de migration irrégulière, souvent liée à des lenteurs administratives ou à l'absence de voies de régularisation claires.",
        en: "Remaining in a country beyond the authorized period granted by a visa or permit. It is one of the most common forms of irregular migration, often linked to administrative delays or lack of clear regularization pathways."
      },
      { 
        term: "Nomadisme & Pastoralisme", 
        en_term: "Nomadism & Mobile Pastoralism", 
        fr: "Forme traditionnelle et adaptative de mobilité où les communautés se déplacent pour assurer leurs moyens de subsistance, étroitement liée à la gestion du bétail et aux variations climatiques. Le MPFA souligne la nécessité de sécuriser cette mobilité vitale, souvent menacée par le changement climatique et l'expansion agricole sédentaire.", 
        en: "Traditional and adaptive form of mobility where communities move to sustain their livelihoods, closely tied to livestock management and climatic variations. The MPFA highlights the need to secure this vital mobility, often threatened by climate change and sedentary agricultural expansion." 
      },
    ]
  },
  {
    category: { fr: "Personnes & Statuts Juridiques", en: "People & Legal Statuses" },
    icon: Users,
    terms: [
      {
        term: "Migrant international",
        en_term: "International Migrant",
        fr: "Toute personne résidant dans un pays autre que son pays de naissance ou de nationalité, indépendamment de son statut légal ou du motif de son déplacement (UN DESA).",
        en: "Any person residing in a country other than their country of birth or nationality, regardless of their legal status or the reason for their movement (UN DESA).",
        source: { fr: "UN DESA", en: "UN DESA" }
      },
      {
        term: "Réfugié",
        en_term: "Refugee",
        fr: "La Convention de l'OUA (1969) définit le réfugié plus largement que celle de Genève (1951). À la crainte de persécution individuelle, elle ajoute l'agression extérieure, l'occupation et les événements troublant gravement l'ordre public.",
        en: "The OAU Convention (1969) defines a refugee more broadly than the Geneva Convention (1951): it includes anyone compelled to flee not only due to individual persecution but also due to external aggression, occupation, or events seriously disturbing public order.",
        source: { fr: "Convention de l'OUA (1969), art. I(2) — définition de référence de la plateforme", en: "OAU Convention (1969), Art. I(2) — the platform's reference definition", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Demandeur d'asile",
        en_term: "Asylum Seeker",
        fr: "Individu ayant quitté son pays d'origine et formellement demandé une protection internationale, mais dont la demande de statut de réfugié n'a pas encore été statuée (HCR). Contrairement au réfugié, son statut juridique est en cours d'évaluation.",
        en: "An individual who has left their country of origin and formally applied for international protection, but whose claim for refugee status has not yet been determined (UNHCR). Unlike a refugee, their legal status is pending assessment.",
        source: { fr: "HCR", en: "UNHCR" }
      },
      {
        term: "Personne déplacée interne (PDI)",
        en_term: "Internally Displaced Person (IDP)",
        fr: "Selon la Convention de Kampala (2009, Art. 1) : personne ou groupe forcé de fuir son foyer (conflit, violences, catastrophes) sans avoir franchi de frontière internationale. Ne relève donc pas des statistiques de migration internationale.",
        en: "Under the Kampala Convention (2009, Art. 1): persons or groups forced to flee their homes (conflict, violence, disasters) without crossing an internationally recognized State border. They are not counted in international migration statistics.",
        source: { fr: "Convention de Kampala (2009), art. 1", en: "Kampala Convention (2009), Art. 1", url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" }
      },
      {
        term: "Apatride",
        en_term: "Stateless Person",
        fr: "Personne qu'aucun État ne considère comme son ressortissant par l'application de sa législation (Convention de 1954). Cette situation prive l'individu de l'accès aux droits fondamentaux, à l'identité légale et aux services de base.",
        en: "A person who is not considered as a national by any State under the operation of its law (1954 Convention). This condition deprives individuals of access to fundamental rights, legal identity, and basic services.",
        source: { fr: "Convention de 1954 relative au statut des apatrides", en: "1954 Convention relating to the Status of Stateless Persons" }
      },
      {
        term: "Mineur non accompagné",
        en_term: "Unaccompanied Migrant Minor",
        fr: "Enfant (moins de 18 ans) séparé de ses parents ou de son tuteur légal lors d'un mouvement migratoire. L'approche juridique (Charte africaine des droits et du bien-être de l'enfant) exige que « l'intérêt supérieur de l'enfant » prime sur toute décision migratoire.",
        en: "A child (under 18) separated from both parents and legally responsible caregivers during a migratory movement. The legal approach (African Charter on the Rights and Welfare of the Child) requires that the 'best interests of the child' be the primary consideration.",
        source: { fr: "Charte africaine des droits et du bien-être de l'enfant ; Convention relative aux droits de l'enfant", en: "African Charter on the Rights and Welfare of the Child; Convention on the Rights of the Child", url: "https://au.int/" }
      },
      {
        term: "Travailleur transfrontalier",
        en_term: "Cross-Border Worker",
        fr: "Individu maintenant sa résidence principale dans un pays tout en se rendant régulièrement dans un autre pour y travailler. Une pratique courante en Afrique, facilitée par les zones de libre circulation des CER (CEDEAO, CAE).",
        en: "An individual maintaining their primary residence in one country while regularly traveling to another for employment. A common practice in Africa, facilitated by REC free movement zones (ECOWAS, EAC).",
        source: { fr: "Protocoles de libre circulation des CER (CEDEAO, CAE)", en: "REC free movement protocols (ECOWAS, EAC)" }
      },
      {
        term: "Survivant de la traite",
        en_term: "Survivor of Human Trafficking",
        fr: "Personne ayant subi une exploitation (travail forcé, exploitation sexuelle) via le recrutement ou le transfert par la menace, la force ou la tromperie (Protocole de Palerme). Le terme « survivant » (plutôt que victime) reconnaît l'agentivité de l'individu dans sa reconstruction.",
        en: "A person who has experienced exploitation (forced labor, sexual exploitation) through recruitment or transfer by means of threat, force, or deception (Palermo Protocol). The term 'survivor' (rather than victim) acknowledges the individual's agency in recovery."
      }
    ]
  },
  {
    category: { fr: "Frontières, Droits & Protection", en: "Borders, Rights & Protection" },
    icon: ShieldAlert,
    terms: [
      {
        term: "Asile (droit d')",
        en_term: "Asylum (right to)",
        fr: "Le droit de chercher asile et de bénéficier de l'asile en d'autres pays, énoncé à l'article 14 de la Déclaration universelle des droits de l'homme. En Afrique, la Convention de l'OUA de 1969 va plus loin. Son article II engage les États membres à faire « tout ce qui est en leur pouvoir » pour recevoir les réfugiés et assurer leur installation. Il pose aussi l'octroi de l'asile comme un acte pacifique et humanitaire, qu'aucun État ne peut tenir pour inamical.",
        en: "The right to seek and to enjoy asylum in other countries, set out in Article 14 of the Universal Declaration of Human Rights. In Africa the 1969 OAU Convention goes further than recognising a right to seek: its Article II commits member states to use \"their best endeavours\" to receive refugees and secure their settlement, and establishes that granting asylum is a peaceful and humanitarian act that cannot be regarded as unfriendly by any other state.",
        source: { fr: "Convention de l'OUA (1969), art. II ; DUDH, art. 14", en: "OAU Convention (1969), Art. II; UDHR, Art. 14", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" },
        stakes: { fr: "Qualifier l'asile d'acte « pacifique et humanitaire » désamorce l'argument diplomatique du pays d'origine qui reprocherait à son voisin d'accueillir ses opposants. C'est une clause de protection des États d'accueil autant que des personnes.", en: "Framing asylum as a \"peaceful and humanitarian act\" defuses the diplomatic argument of an origin state accusing its neighbour of harbouring its opponents. It protects host states as much as people." }
      },
      {
        term: "Reconnaissance prima facie",
        en_term: "Prima facie recognition",
        fr: "Reconnaissance du statut de réfugié fondée sur des circonstances objectives et manifestes dans le pays d'origine, sans examen individuel du dossier. Elle s'applique typiquement aux arrivées massives, où la détermination individuelle serait impraticable. Bien que peu codifiée, c'est la voie par laquelle la majorité des réfugiés du monde sont reconnus — et la pratique dominante en Afrique, où la définition élargie de la Convention de l'OUA s'y prête directement.",
        en: "Recognition of refugee status based on readily apparent, objective circumstances in the country of origin, without individual examination. It typically applies to large-scale arrivals where individual determination would be impracticable. Though thinly codified, it is the route by which most of the world's refugees are recognised — and the dominant practice in Africa, where the OAU Convention's broadened definition lends itself directly to it.",
        source: { fr: "HCR, Principes directeurs sur la protection internationale n° 11 (2015)", en: "UNHCR, Guidelines on International Protection No. 11 (2015)", url: "https://www.unhcr.org/media/guidelines-international-protection-no-11-prima-facie-recognition-refugee-status-5-june-2015" },
        stakes: { fr: "Une reconnaissance de groupe donne un statut immédiat sans file d'attente administrative. La basculer en examen individuel — comme certains États le font sous pression budgétaire ou politique — laisse des dizaines de milliers de personnes sans statut pendant des années, sans qu'aucun texte n'ait changé.", en: "Group recognition confers immediate status with no administrative queue. Switching to individual examination — as some states do under budgetary or political pressure — leaves tens of thousands without status for years, with no text having changed." }
      },
      {
        term: "Détermination du statut de réfugié (DSR)",
        en_term: "Refugee Status Determination (RSD)",
        fr: "Procédure, administrative ou judiciaire, par laquelle un État ou le HCR établit si une personne relève de la définition du réfugié. En Afrique, elle est conduite tantôt par une commission nationale d'éligibilité, tantôt par le HCR agissant sous mandat lorsque l'État n'a pas encore d'appareil dédié — configuration qui déplace vers une organisation internationale une décision de souveraineté.",
        en: "The administrative or judicial procedure by which a state or UNHCR establishes whether a person falls within the refugee definition. In Africa it is conducted sometimes by a national eligibility commission, sometimes by UNHCR acting under its mandate where the state has no dedicated apparatus — a configuration that shifts a sovereign decision to an international organisation.",
        source: { fr: "HCR ; Convention de l'OUA (1969)", en: "UNHCR; OAU Convention (1969)", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Déplacement prolongé",
        en_term: "Protracted displacement",
        fr: "Situation dans laquelle des personnes déplacées se trouvent durablement sans solution — ni retour, ni intégration locale, ni réinstallation — souvent pendant des années voire des décennies. La notion déplace le regard de l'urgence vers la durée : elle décrit non pas une crise mais un régime d'attente institutionnalisé.",
        en: "A situation in which displaced people remain durably without a solution — no return, no local integration, no resettlement — often for years or decades. The notion shifts attention from emergency to duration: it describes not a crisis but an institutionalised regime of waiting.",
        source: { fr: "HCR, Global Trends", en: "UNHCR, Global Trends", url: "https://www.unhcr.org/global-trends" },
        stakes: { fr: "Tant qu'une situation est nommée « urgence », elle appelle des financements humanitaires courts et renouvelables. La nommer « prolongée » ouvre au contraire les instruments de développement — mais suppose de reconnaître une présence durable, ce que les États d'accueil hésitent souvent à faire.", en: "As long as a situation is named an \"emergency\", it draws short, renewable humanitarian funding. Naming it \"protracted\" opens development instruments instead — but requires acknowledging a lasting presence, which host states are often reluctant to do." }
      },
      {
        term: "Externalisation des frontières",
        en_term: "Border externalisation",
        fr: "Ensemble des dispositifs par lesquels un État reporte le contrôle de ses frontières au-delà de son territoire : financement et équipement de forces de sécurité tierces, agents de liaison, campagnes de dissuasion, conditionnement de l'aide à la coopération migratoire. Le contrôle s'exerce ainsi loin du lieu où le droit d'asile pourrait être invoqué.",
        en: "The set of arrangements by which a state pushes control of its borders beyond its own territory: funding and equipping third-country security forces, liaison officers, deterrence campaigns, tying aid to migration cooperation. Control is thereby exercised far from where a right to asylum could be invoked.",
        source: { fr: "Notion analytique consolidée dans la littérature sur les régimes de mobilité ; voir Achiume (2019) et Bakewell (2008) en Bibliothèque", en: "Analytical notion consolidated in the mobility-regimes literature; see Achiume (2019) and Bakewell (2008) in the Library" },
        stakes: { fr: "Le déplacement du contrôle déplace aussi la responsabilité juridique : une personne interceptée avant d'atteindre un territoire ne peut y demander l'asile, et l'État qui a financé l'interception n'est pas celui qui la refuse. La responsabilité se dilue exactement là où elle serait exigible (Ben Mokhtar, 2026).", en: "Displacing control also displaces legal responsibility: a person intercepted before reaching a territory cannot claim asylum there, and the state that funded the interception is not the one refusing it. Accountability dissolves precisely where it would be enforceable (Ben Mokhtar, 2026)." }
      },
      {
        term: "Accord de réadmission",
        en_term: "Readmission agreement",
        fr: "Instrument bilatéral ou régional par lequel un État s'engage à reprendre ses ressortissants — et parfois des ressortissants de pays tiers ayant transité par son territoire — éloignés depuis un autre État. Souvent négocié en contrepartie de facilités de visa, d'aide au développement ou de coopération commerciale.",
        en: "A bilateral or regional instrument by which a state undertakes to take back its nationals — and sometimes third-country nationals who transited its territory — removed from another state. Often negotiated in exchange for visa facilitation, development aid or trade cooperation.",
        source: { fr: "Pratique conventionnelle bilatérale ; voir Adamson & Tsourapas (2019) sur la diplomatie migratoire, en Bibliothèque", en: "Bilateral treaty practice; see Adamson & Tsourapas (2019) on migration diplomacy, in the Library" },
        stakes: { fr: "La clause « ressortissants de pays tiers » transforme un État de transit en dépositaire de personnes qui n'en sont pas originaires. C'est le point où un accord technique produit des effets de séjour durables, sans qu'aucun droit de séjour n'ait été accordé.", en: "The \"third-country nationals\" clause turns a transit state into the custodian of people who are not from it. That is where a technical agreement produces lasting residence effects without any residence right having been granted." }
      },
      {
        term: "Visa (régime de)",
        en_term: "Visa (regime)",
        fr: "Autorisation préalable d'entrée délivrée par un État. Trois régimes structurent les mobilités intra-africaines : le visa requis avant le départ, le visa à l'arrivée (délivré au poste-frontière) et l'exemption. La distinction n'est pas de degré mais de nature : le visa préalable transfère la décision au consulat du pays de départ, c'est-à-dire hors de portée d'un recours dans le pays de destination.",
        en: "A prior entry authorisation issued by a state. Three regimes structure intra-African mobility: visa required before departure, visa on arrival (issued at the border post), and exemption. The distinction is not one of degree but of kind: a prior visa moves the decision to the consulate in the country of departure — that is, beyond the reach of any appeal in the destination country.",
        source: { fr: "BAD & CUA, Africa Visa Openness Report", en: "AfDB & AUC, Africa Visa Openness Report", url: "https://www.visaopenness.org/" }
      },
      {
        term: "Gestion intégrée des frontières",
        en_term: "Integrated Border Management",
        fr: "Administration globale et coordonnée visant à réguler les flux transfrontaliers, harmonisant les contrôles d'immigration, les douanes et la sécurité, tout en identifiant les personnes vulnérables nécessitant une protection (OIM, 2019).",
        en: "Comprehensive and coordinated administration to regulate cross-border flows, harmonizing immigration, customs, and security controls, while identifying vulnerable persons requiring protection (IOM, 2019).",
        source: { fr: "OIM (2019)", en: "IOM (2019)" }
      },
      {
        term: "Principe de non-refoulement",
        en_term: "Non-Refoulement Principle",
        fr: "Norme impérative (jus cogens) du droit international interdisant à un État d'expulser ou de renvoyer un individu vers un territoire où sa vie ou sa liberté seraient menacées (Art. 33 de la Convention de Genève 1951 ; Art. II(3) de la Convention de l'OUA 1969).",
        en: "Peremptory norm (jus cogens) of international law prohibiting a state from expelling or returning an individual to a territory where their life or freedom would be threatened (Art. 33 of the 1951 Geneva Convention; Art. II(3) of the 1969 OAU Convention).",
        source: { fr: "Convention de Genève (1951), art. 33 ; Convention de l'OUA (1969), art. II(3)", en: "Geneva Convention (1951), Art. 33; OAU Convention (1969), Art. II(3)", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Trafic illicite de migrants",
        en_term: "Smuggling of Migrants",
        fr: "Fait d'assurer, afin d'en tirer un avantage financier, l'entrée illégale d'une personne dans un État (Protocole de Palerme, 2000). Contrairement à la traite, le trafic implique le consentement initial du migrant et prend fin une fois la frontière franchie, bien que les risques d'abus soient immenses.",
        en: "The procurement, for financial benefit, of the illegal entry of a person into a State (Palermo Protocol, 2000). Unlike trafficking, smuggling involves the initial consent of the migrant and ends once the border is crossed, though the risks of abuse are immense.",
        source: { fr: "Protocole de Palerme (2000)", en: "Palermo Protocol (2000)" }
      },
      {
        term: "Traite des êtres humains",
        en_term: "Human Trafficking",
        fr: "Recrutement, transport, transfert ou hébergement de personnes par la force, la contrainte ou la tromperie à des fins d'exploitation (travail forcé, servitude, exploitation sexuelle). Elle n'implique pas nécessairement le franchissement d'une frontière internationale (Protocole de Palerme).",
        en: "Recruitment, transportation, transfer, or harboring of persons by force, coercion, or deception for the purpose of exploitation (forced labor, servitude, sexual exploitation). It does not necessarily involve crossing an international border (Palermo Protocol).",
        source: { fr: "Protocole de Palerme (2000)", en: "Palermo Protocol (2000)" }
      },
      {
        term: "Vulnérabilités des migrants",
        en_term: "Migrant Vulnerabilities",
        fr: "Capacité diminuée d'un individu à résister ou se relever de l'exploitation, de la violence ou des violations de droits (OIM, 2019). Ces vulnérabilités naissent de l'interaction entre des facteurs personnels (âge, sexe, santé) et structurels (absence de statut légal, pauvreté, discrimination).",
        en: "The diminished capacity of an individual to resist or recover from exploitation, violence, or rights violations (IOM, 2019). These vulnerabilities arise from the interaction of personal factors (age, gender, health) and structural factors (lack of legal status, poverty, discrimination)."
      },
      {
        term: "Identité légale",
        en_term: "Legal Identity",
        fr: "Reconnaissance de l'identité d'un individu par l'État (enregistrement des naissances, documents de voyage). Sans identité légale, les migrants sont exposés à l'exclusion systémique, à la détention arbitraire et au risque d'apatridie (Cible ODD 16.9).",
        en: "State recognition of an individual's identity (birth registration, travel documents). Without legal identity, migrants face systemic exclusion, arbitrary detention, and the risk of statelessness (SDG Target 16.9).",
        source: { fr: "Cible 16.9 des Objectifs de développement durable", en: "Sustainable Development Goal target 16.9", url: "https://www.un.org/sustainabledevelopment/" }
      }
    ]
  },
  {
    category: { fr: "Retour, Intégration & Résidence", en: "Return, Integration & Residence" },
    icon: MapPin,
    terms: [
      {
        term: "Solutions durables",
        en_term: "Durable solutions",
        fr: "Les trois issues reconnues à une situation de déplacement : le rapatriement volontaire dans le pays d'origine, l'intégration locale dans le pays d'accueil, et la réinstallation dans un pays tiers. Une solution n'est dite durable que lorsqu'elle met fin au besoin de protection internationale — critère rarement rempli à l'échelle des effectifs déplacés.",
        en: "The three recognised outcomes of a displacement situation: voluntary repatriation to the country of origin, local integration in the host country, and resettlement in a third country. A solution counts as durable only when it ends the need for international protection — a threshold rarely met at the scale of displaced populations.",
        source: { fr: "HCR ; Pacte mondial sur les réfugiés (2018)", en: "UNHCR; Global Compact on Refugees (2018)", url: "https://globalcompactrefugees.org/" }
      },
      {
        term: "Réinstallation",
        en_term: "Resettlement",
        fr: "Transfert d'un réfugié depuis son pays d'asile vers un pays tiers qui accepte de l'admettre et de lui accorder une résidence durable. Les places de réinstallation offertes chaque année restent très inférieures aux besoins identifiés, ce qui en fait moins une solution générale qu'un dispositif de protection ciblée.",
        en: "The transfer of a refugee from their country of asylum to a third state that agrees to admit them and grant durable residence. The resettlement places offered each year remain far below identified needs, making it less a general solution than a targeted protection mechanism.",
        source: { fr: "HCR, Projected Global Resettlement Needs", en: "UNHCR, Projected Global Resettlement Needs", url: "https://www.unhcr.org/global-trends" }
      },
      {
        term: "Voies complémentaires",
        en_term: "Complementary pathways",
        fr: "Canaux d'admission légale distincts de la réinstallation — visas humanitaires, regroupement familial élargi, bourses d'études, mobilité professionnelle — mobilisés pour ouvrir des accès sûrs sans passer par le contingent de réinstallation. Complémentaires signifie qu'elles s'ajoutent à la protection, sans s'y substituer.",
        en: "Legal admission channels distinct from resettlement — humanitarian visas, extended family reunification, scholarships, labour mobility — used to open safe access outside the resettlement quota. \"Complementary\" means they add to protection rather than replace it.",
        source: { fr: "Pacte mondial sur les réfugiés (2018)", en: "Global Compact on Refugees (2018)", url: "https://globalcompactrefugees.org/" }
      },
      {
        term: "Intégration locale",
        en_term: "Local integration",
        fr: "Processus par lequel un réfugié s'installe durablement dans son pays d'asile, avec une dimension juridique (accès à un statut stable, voire à la naturalisation), économique (droit au travail et aux moyens de subsistance) et sociale. C'est la solution durable la plus fréquente en Afrique de fait, et la moins reconnue en droit.",
        en: "The process by which a refugee settles durably in the country of asylum, with a legal dimension (access to a stable status, possibly naturalisation), an economic one (right to work and to livelihoods), and a social one. It is the most common durable solution in Africa in practice, and the least recognised in law.",
        source: { fr: "HCR ; Convention de l'OUA (1969), art. II", en: "UNHCR; OAU Convention (1969), Art. II", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Retour (Volontaire vs Forcé)",
        en_term: "Return (Voluntary vs Forced)",
        fr: "Processus par lequel un migrant regagne son pays d'origine. Le retour est « volontaire » lorsqu'il repose sur un consentement libre et éclairé. Il est « forcé » (expulsion, déportation) lorsqu'imposé par l'État hôte, devant toutefois respecter les droits humains et le non-refoulement (MPFA 2018-2030).",
        en: "Process by which a migrant goes back to their country of origin. Return is 'voluntary' when based on free and informed consent. It is 'forced' (expulsion, deportation) when imposed by the host state, though it must respect human rights and non-refoulement (MPFA 2018-2030).",
        source: { fr: "Cadre de politique migratoire pour l'Afrique (MPFA 2018-2030)", en: "Migration Policy Framework for Africa (MPFA 2018-2030)", url: "https://au.int/" }
      },
      {
        term: "Rapatriement",
        en_term: "Repatriation",
        fr: "Droit d'un réfugié ou d'une personne déplacée à retourner dans son pays d'origine dans des conditions de sécurité et de dignité, telles que définies par le droit international (Convention de Genève, Convention de l'OUA 1969).",
        en: "The right of a refugee or displaced person to return to their country of origin in safety and dignity, as defined by international law (Geneva Convention, 1969 OAU Convention).",
        source: { fr: "Convention de Genève (1951) ; Convention de l'OUA (1969)", en: "Geneva Convention (1951); OAU Convention (1969)", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Réintégration",
        en_term: "Reintegration",
        fr: "Processus permettant aux migrants de retour de se réinsérer économiquement, socialement et psychologiquement dans leur communauté d'origine. Une réintégration durable prévient la réémigration irrégulière (MPFA 2018-2030).",
        en: "Process through which returning migrants re-establish themselves economically, socially, and psychologically in their community of origin. Sustainable reintegration prevents irregular re-migration (MPFA 2018-2030).",
        source: { fr: "Cadre de politique migratoire pour l'Afrique (MPFA 2018-2030)", en: "Migration Policy Framework for Africa (MPFA 2018-2030)", url: "https://au.int/" }
      },
      {
        term: "Résidence (Droit de)",
        en_term: "Residence",
        fr: "Statut légal accordé à un non-ressortissant pour séjourner légalement sur le territoire. Le Protocole de Kigali de l'UA (2018) promeut le droit de résidence pour l'emploi ou l'établissement commercial pour tous les citoyens africains.",
        en: "Legal status granted to a non-citizen to lawfully stay in the territory. The AU Kigali Protocol (2018) promotes the right of residence for employment or business establishment for all African citizens.",
        source: { fr: "Protocole de l'UA sur la libre circulation (2018)", en: "AU Free Movement Protocol (2018)", url: "https://au.int/en/treaties/protocol-treaty-establishing-african-economic-community-relating-free-movement-persons" }
      },
      {
        term: "Naturalisation",
        en_term: "Naturalization",
        fr: "Processus légal (souvent discrétionnaire) par lequel un non-national acquiert la citoyenneté d'un pays d'accueil. Reconnue comme un levier d'intégration sociale et de réduction de l'apatridie (Déclaration d'Abidjan, 2015).",
        en: "Legal process (often discretionary) by which a non-national acquires the citizenship of a host country. Recognized as a tool for social integration and reducing statelessness (Abidjan Declaration, 2015).",
        source: { fr: "Déclaration d'Abidjan sur l'éradication de l'apatridie (2015)", en: "Abidjan Declaration on the Eradication of Statelessness (2015)" }
      },
      {
        term: "Résilience des migrants",
        en_term: "Resilience of Migrants",
        fr: "Capacité des migrants à s'adapter, résister et se remettre des chocs (économiques, climatiques, discriminatoires) rencontrés durant le parcours migratoire, souvent soutenue par les réseaux de la diaspora et les cadres d'inclusion locaux.",
        en: "The capacity of migrants to adapt, resist, and recover from shocks (economic, climatic, discriminatory) encountered during the migration journey, often supported by diaspora networks and local inclusion frameworks."
      }
    ]
  },
  {
    category: { fr: "Économie, Compétences & Développement", en: "Economy, Skills & Development" },
    icon: Briefcase,
    terms: [
      {
        term: "Transferts de fonds (Remittances)",
        en_term: "Remittances",
        fr: "Fonds ou biens transférés par les migrants vers leur pays d'origine. Les remises migratoires constituent souvent la première source de financement externe en Afrique, dépassant l'Aide publique au développement (OIM, 2019).",
        en: "Money or goods transferred by migrants to their country of origin. Remittances are often the leading source of external financing in Africa, exceeding Official Development Assistance (IOM, 2019).",
        source: { fr: "OIM (2019) ; Banque mondiale — données sur les transferts", en: "IOM (2019); World Bank — remittances data" }
      },
      {
        term: "Fuite des cerveaux (Brain Drain)",
        en_term: "Brain Drain",
        fr: "Émigration d'individus hautement qualifiés entraînant l'épuisement du capital humain du pays d'origine, un défi critique pour les secteurs de la santé et de l'éducation en Afrique.",
        en: "Emigration of highly skilled individuals leading to the depletion of the source country's human capital, a critical challenge for Africa's health and education sectors."
      },
      {
        term: "Gain de compétences (Brain Gain)",
        en_term: "Brain Gain",
        fr: "Bénéfice tiré par un pays grâce à l'immigration de professionnels hautement qualifiés ou au retour de ses nationaux ayant acquis une expertise à l'étranger (Réseaux de la diaspora).",
        en: "The benefit a country derives from the immigration of highly qualified professionals or the return of its nationals who acquired expertise abroad (Diaspora networks)."
      },
      {
        term: "Circulation des cerveaux (Brain Circulation)",
        en_term: "Brain Circulation",
        fr: "Mouvement répété et bidirectionnel de professionnels qualifiés entre pays d'origine et de destination, par opposition à un départ ou un retour définitifs. Ce cadre déplace le débat de la « fuite » (perte nette et irréversible) vers un échange continu de compétences, de capitaux et de réseaux.",
        en: "Repeated, bidirectional movement of skilled professionals between origin and destination countries, as opposed to a one-way departure or permanent return. This framework shifts the debate from \"drain\" (a net, irreversible loss) toward a continuous exchange of skills, capital, and networks."
      },
      {
        term: "Gaspillage de compétences (Brain Waste)",
        en_term: "Brain Waste",
        fr: "Situation où des migrants hautement qualifiés occupent des emplois sans rapport avec leurs diplômes, souvent en raison de la non-reconnaissance de leurs qualifications étrangères ou de barrières systémiques.",
        en: "Situation where highly skilled migrants are employed in jobs unrelated to their qualifications, often due to the non-recognition of foreign credentials or systemic barriers."
      },
      {
        term: "Coût de la fuite (Brain Cost)",
        en_term: "Brain Cost",
        fr: "Pertes économiques, sociales et développementales (incluant les fonds publics investis dans l'éducation de l'individu) subies par l'État d'origine lorsque ses travailleurs qualifiés émigrent définitivement.",
        en: "The economic, social, and developmental losses (including public funds invested in the individual's education) incurred by the origin State when its skilled workers emigrate permanently."
      },
      {
        term: "Investissement des diasporas",
        en_term: "Investment by Migrants",
        fr: "Contributions économiques des migrants au-delà des simples transferts de fonds familiaux : entrepreneuriat, immobilier, « diaspora bonds », transfert de technologies et de capitaux vers les secteurs productifs.",
        en: "Economic contributions of migrants beyond basic family remittances: entrepreneurship, real estate, diaspora bonds, technology transfer, and capital investment in productive sectors."
      },
      {
        term: "Partenariat de compétences (Global Skills Partnership)",
        en_term: "Global Skills Partnership",
        fr: "Accord bilatéral par lequel un pays d'origine et un pays de destination financent ensemble la formation de travailleurs avant leur départ, dans des compétences utiles aux deux économies. L'idée est de faire de la mobilité de main-d'œuvre un investissement partagé, plutôt qu'un prélèvement de capital humain déjà formé.",
        en: "A bilateral agreement between an origin and a destination country jointly funding worker training, before departure, in skills useful to both economies — designed to convert labour mobility into shared investment rather than a simple draw on already-trained human capital.",
        source: { fr: "Objectif 18 du Pacte mondial pour les migrations", en: "Objective 18 of the Global Compact for Migration" }
      }
    ]
  },
  {
    category: { fr: "Gouvernance, Données & Concepts Théoriques", en: "Governance, Data & Theoretical Concepts" },
    icon: Brain,
    terms: [
      {
        term: "Corridor migratoire",
        en_term: "Migration Corridor",
        fr: "Paire pays d'origine–pays de destination reliée par un flux ou un stock significatif de migrants, unité d'analyse standard des statistiques bilatérales de migration (UN DESA, Banque Mondiale) — permet de voir au-delà des agrégats nationaux la géographie réelle des déplacements.",
        en: "An origin-destination country pair linked by a significant migrant flow or stock, the standard unit of analysis in bilateral migration statistics (UN DESA, World Bank) — lets the real geography of movement be seen beyond national aggregates."
      },
      {
        term: "Régime (de gouvernance migratoire)",
        en_term: "Regime (of migration governance)",
        fr: "Ensemble de principes, normes, règles et procédures de décision autour desquels les attentes des acteurs convergent dans un domaine donné. Appliquée au cas africain, la notion permet de tenir ensemble ce qu'une lecture par les seuls traités sépare : les textes adoptés, les bureaucraties qui les portent et les pratiques effectives des postes-frontières (Ben Mokhtar, 2026).",
        en: "A set of principles, norms, rules and decision-making procedures around which actors' expectations converge in a given area. Applied to the African case, the notion holds together what a treaty-only reading separates: the texts adopted, the bureaucracies that carry them, and the actual practices of border posts (Ben Mokhtar, 2026).",
        source: { fr: "Cadre de la théorie des régimes internationaux, appliqué au cas africain par Ben Mokhtar (2026)", en: "International regime theory framework, applied to the African case by Ben Mokhtar (2026)" }
      },
      {
        term: "Extraversion",
        en_term: "Extraversion",
        fr: "Stratégie par laquelle des acteurs africains convertissent leur position de dépendance en ressource, en mobilisant la relation extérieure — financements, coopération, reconnaissance — comme instrument de pouvoir interne. Appliquée aux migrations, elle éclaire pourquoi certains États négocient activement une coopération qui semble d'abord servir l'agenda de leurs partenaires.",
        en: "A strategy by which African actors convert a position of dependence into a resource, mobilising the external relationship — funding, cooperation, recognition — as an instrument of domestic power. Applied to migration, it explains why some states actively negotiate cooperation that appears to serve their partners' agenda first.",
        source: { fr: "Bayart (2000), « Africa in the World: A History of Extraversion » — voir Bibliothèque", en: "Bayart (2000), \"Africa in the World: A History of Extraversion\" — see Library" }
      },
      {
        term: "Gouvernementalité",
        en_term: "Governmentality",
        fr: "Manière dont un pouvoir gouverne des populations non par la contrainte directe mais par des dispositifs de savoir : catégories, recensements, indicateurs, procédures. Dans le champ migratoire, la notion invite à examiner les instruments de mesure eux-mêmes — compter, classer, nommer — comme des actes de gouvernement plutôt que comme des descriptions neutres.",
        en: "The way a power governs populations not through direct coercion but through knowledge devices: categories, censuses, indicators, procedures. In the migration field, the notion invites examining measurement instruments themselves — counting, classifying, naming — as acts of government rather than neutral descriptions.",
        source: { fr: "Cadre foucaldien, mobilisé dans l'analyse du régime africain (Ben Mokhtar, 2026)", en: "Foucauldian framework, mobilised in the analysis of the African regime (Ben Mokhtar, 2026)" }
      },
      {
        term: "Lecture décoloniale",
        en_term: "Decolonial reading",
        fr: "Approche qui rapporte les asymétries contemporaines de mobilité à l'ordre colonial qui les a instituées : ce ne sont pas les mêmes personnes qui peuvent circuler, et cette inégalité a une histoire. Appliquée au droit international des migrations, elle conteste que les régimes de mobilité mondiaux soient neutres quant à l'origine.",
        en: "An approach that relates contemporary asymmetries of mobility to the colonial order that instituted them: not everyone can move, and that inequality has a history. Applied to international migration law, it contests the claim that global mobility regimes are neutral as to origin.",
        source: { fr: "Achiume (2019), « Migration as Decolonization » — voir Bibliothèque", en: "Achiume (2019), \"Migration as Decolonization\" — see Library", url: "https://ssrn.com/abstract=3330353" }
      },
      {
        term: "Communs migratoires vernaculaires",
        en_term: "Vernacular migration commons",
        fr: "Arrangements collectifs non étatiques qui organisent concrètement la circulation — réseaux d'hébergement, caisses d'entraide, savoirs de route, régulations de corridor — et qui préexistent souvent aux dispositifs publics ou en comblent les vides. Les penser comme des communs, plutôt que comme du désordre, déplace la question vers celle de leur reconnaissance (Ben Mokhtar, 2026).",
        en: "Non-state collective arrangements that concretely organise movement — accommodation networks, mutual-aid funds, route knowledge, corridor regulation — which often predate public schemes or fill their gaps. Thinking of them as commons rather than as disorder changes the question: not how to suppress them, but how to recognise them (Ben Mokhtar, 2026).",
        source: { fr: "Cadre des communs (Ostrom), appliqué aux corridors africains (Ben Mokhtar, 2026)", en: "Commons framework (Ostrom), applied to African corridors (Ben Mokhtar, 2026)" }
      },
      {
        term: "Souveraineté épistémique",
        en_term: "Epistemic sovereignty",
        fr: "Capacité d'un ensemble politique à produire lui-même les catégories, les données et les diagnostics qui le décrivent, plutôt que de les recevoir. C'est la justification explicite des organes africains de données migratoires : sans appareil propre, le continent se lit dans les instruments de ceux qui l'observent.",
        en: "The capacity of a political entity to produce for itself the categories, data and diagnoses that describe it, rather than receiving them. It is the explicit rationale of Africa's migration-data bodies: without its own apparatus, the continent reads itself through the instruments of those who observe it.",
        source: { fr: "Justification institutionnelle des organes de données de l'UA (OAM, STATAFRIC) ; lecture développée dans Ben Mokhtar (2026)", en: "Institutional rationale of the AU's data bodies (AMO, STATAFRIC); reading developed in Ben Mokhtar (2026)" }
      },
      {
        term: "Conditionnalité migratoire",
        en_term: "Migration conditionality",
        fr: "Subordination d'un avantage — aide, préférence commerciale, facilitation de visa — à la coopération d'un État en matière de contrôle migratoire ou de réadmission. Elle installe la migration comme monnaie d'échange dans des négociations qui portent formellement sur autre chose.",
        en: "Making a benefit — aid, trade preference, visa facilitation — conditional on a state's cooperation in migration control or readmission. It installs migration as a bargaining chip in negotiations formally about something else.",
        source: { fr: "Voir Adamson & Tsourapas (2019) sur la diplomatie migratoire — Bibliothèque", en: "See Adamson & Tsourapas (2019) on migration diplomacy — Library", url: "https://doi.org/10.1093/isp/eky015" }
      },
      {
        term: "Entre-deux national",
        en_term: "National In-Between",
        fr: "L'espace de traduction, de filtrage et de mise en procédure où les engagements normatifs continentaux (UA, CER) sont retravaillés, ralentis ou réinterprétés par les bureaucraties nationales. Concept central de la thèse à l'origine de cette plateforme (Ben Mokhtar, 2026).",
        en: "The space of translation, filtering, and procedural conversion where continental normative commitments (AU, RECs) are reworked, slowed, or reinterpreted by national bureaucracies. A central concept of the thesis behind this platform (Ben Mokhtar, 2026).",
        source: { fr: "Ben Mokhtar (2026) — concept central de la thèse à l'origine de la plateforme", en: "Ben Mokhtar (2026) — core concept of the doctoral thesis behind this platform" }
      },
      {
        term: "Capabilités de mouvement",
        en_term: "Capabilities of Movement",
        fr: "Cadre théorique (de Haas, 2021) situant mobilité et immobilité sur un même continuum d'aspirations et de capacités effectivement exerçables, dépassant la dichotomie simpliste volontaire/forcé.",
        en: "Theoretical framework (de Haas, 2021) placing mobility and immobility on the same continuum of aspirations and actually exercisable capabilities, moving beyond the simplistic voluntary/forced dichotomy.",
        source: { fr: "de Haas (2021), « A theory of migration: the aspirations–capabilities framework »", en: "de Haas (2021), 'A theory of migration: the aspirations-capabilities framework'", url: "https://doi.org/10.1186/s40878-020-00210-4" }
      },
      {
        term: "Gouvernance des migrations",
        en_term: "Migration Governance",
        fr: "Ensemble des normes juridiques, politiques, institutions et processus (du niveau local au niveau mondial) façonnant la gestion des mobilités, les droits des migrants et la coopération entre États (OIM, 2015 ; MPFA, 2018).",
        en: "The combined frameworks of legal norms, policies, institutions, and processes (from local to global levels) shaping the management of mobility, migrant rights, and inter-state cooperation (IOM, 2015; MPFA, 2018).",
        source: { fr: "OIM (2015) ; Cadre de politique migratoire pour l'Afrique (MPFA, 2018)", en: "IOM (2015); Migration Policy Framework for Africa (MPFA, 2018)", url: "https://au.int/" }
      },
      {
        term: "Sécurisation (Securitization)",
        en_term: "Securitization",
        fr: "Processus par lequel la migration est progressivement traitée comme une menace sécuritaire (contrôle des frontières, criminalisation) au détriment de ses dimensions développementales et des droits humains.",
        en: "The process by which migration is increasingly framed and governed as a security threat (border control, criminalization) at the expense of its developmental and human rights dimensions."
      },
      {
        term: "Désagrégation des données",
        en_term: "Data Disaggregation",
        fr: "Processus technique consistant à ventiler des données statistiques agrégées en sous-catégories (par âge, sexe, statut migratoire) pour identifier les disparités et orienter l'élaboration de politiques basées sur des preuves (Cible ODD 17.18).",
        en: "The technical process of breaking down aggregated statistical data into subcategories (by age, gender, migration status) to identify disparities and guide evidence-based policymaking (SDG Target 17.18).",
        source: { fr: "Cible 17.18 des Objectifs de développement durable", en: "Sustainable Development Goal target 17.18", url: "https://www.un.org/sustainabledevelopment/" }
      },
      {
        term: "Facteurs Push & Pull (Causes profondes)",
        en_term: "Push & Pull Factors (Root Causes)",
        fr: "Conditions structurelles motivant le départ d'une région (Push : pauvreté, chocs climatiques, conflits) ou l'attraction vers une autre (Pull : emploi, réseaux familiaux, stabilité). Le GCM et le MPFA appellent à traiter ces causes profondes pour faire de la migration un choix et non une nécessité vitale.",
        en: "Structural conditions motivating departure from a region (Push: poverty, climate shocks, conflict) or attraction to another (Pull: jobs, family networks, stability). The GCM and MPFA call for addressing these root causes to make migration a choice rather than a necessity."
      },
      {
        term: "Diplomatie migratoire",
        en_term: "Migration Diplomacy",
        fr: "Utilisation stratégique de la coopération migratoire par les États dans l'arène internationale, s'en servant comme levier de négociation pour obtenir des financements, une reconnaissance politique ou des accords commerciaux (Adamson & Tsourapas, 2019).",
        en: "The strategic use of migration cooperation by states in the international arena, utilizing it as a bargaining lever to secure funding, political recognition, or trade agreements (Adamson & Tsourapas, 2019).",
        source: { fr: "Adamson & Tsourapas (2019), « Migration Diplomacy in World Politics »", en: "Adamson & Tsourapas (2019), 'Migration Diplomacy in World Politics'", url: "https://doi.org/10.1093/isp/eky015" }
      },
      { 
        term: "Nord Global & Sud Global", 
        en_term: "Global North & Global South", 
        fr: "Dichotomie socio-économique et politique. Le Sud Global ne désigne pas une géographie stricte, mais un ensemble d'économies en développement partageant des héritages historiques de colonialisme, d'exploitation des ressources et d'inégalités structurelles dans les accords commerciaux mondiaux.", 
        en: "Socio-economic and political dichotomy. The Global South does not refer to a strict geography, but rather developing economies sharing historical legacies of colonialism, resource exploitation, and structural inequalities in global trade agreements." 
      },
      { 
        term: "Numérisation de la gouvernance (Digitalization)", 
        en_term: "Digitalization of Migration Governance", 
        fr: "Intégration de technologies numériques (biométrie, e-visas, systèmes de surveillance) pour gérer les migrations. L'utilisation généralisée d'outils développés hors du continent soulève des préoccupations majeures quant à l'appropriation africaine (African ownership) et à la souveraineté épistémique des données.", 
        en: "Integration of digital technologies (biometrics, e-visas, surveillance systems) to manage migration. The widespread use of tools developed outside the continent raises major concerns regarding African ownership and the epistemic sovereignty of data." 
      },
      { 
        term: "Processus Consultatifs Régionaux (RCPs)", 
        en_term: "Regional Consultative Processes (RCPs)", 
        fr: "Plateformes étatiques, informelles et non contraignantes de dialogue sur les migrations (ex: MIDWA en Afrique de l'Ouest, MIDSA en Afrique Australe). Les Processus de Rabat et de Khartoum illustrent cette dynamique en structurant la coopération entre l'Afrique et l'Europe.", 
        en: "State-led, informal, and non-binding platforms for migration dialogue (e.g., MIDWA in West Africa, MIDSA in Southern Africa). The Rabat and Khartoum Processes illustrate this dynamic by structuring cooperation between Africa and Europe." 
      },
    ]
  },
  {
    category: { fr: "Instruments & Institutions du Régime Africain", en: "Instruments & Institutions of the African Regime" },
    icon: Landmark,
    terms: [
      {
        term: "Convention de l'OUA (1969)",
        en_term: "OAU Convention (1969)",
        fr: "Convention régissant les aspects propres aux problèmes des réfugiés en Afrique, adoptée à Addis-Abeba le 10 septembre 1969, en vigueur depuis le 20 juin 1974. Son article I(2) élargit la définition du réfugié à quiconque fuit une agression extérieure, une occupation, une domination étrangère ou des événements troublant gravement l'ordre public — sans exiger de crainte de persécution individualisée. C'est la définition de référence de cette plateforme.",
        en: "Convention Governing the Specific Aspects of Refugee Problems in Africa, adopted in Addis Ababa on 10 September 1969, in force since 20 June 1974. Its Article I(2) broadens the refugee definition to anyone fleeing external aggression, occupation, foreign domination or events seriously disturbing public order — with no individualised fear of persecution required. It is this platform's reference definition.",
        source: { fr: "Union africaine — texte du traité", en: "African Union — treaty text", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" },
        stakes: { fr: "Sous la définition de Genève, une personne fuyant une guerre généralisée sans être personnellement visée peut être écartée. Sous l'article I(2), elle est réfugiée. Le même trajet, deux textes, deux issues.", en: "Under the Geneva definition, someone fleeing generalised war without being personally targeted can be excluded. Under Article I(2), they are a refugee. Same journey, two texts, two outcomes." }
      },
      {
        term: "Convention de Kampala (2009)",
        en_term: "Kampala Convention (2009)",
        fr: "Convention de l'Union africaine sur la protection et l'assistance aux personnes déplacées en Afrique. Premier — et toujours seul — traité régional contraignant au monde consacré aux personnes déplacées internes. Son article 1 donne la définition de référence de la PDI retenue sur cette plateforme.",
        en: "African Union Convention for the Protection and Assistance of Internally Displaced Persons in Africa. The first — and still the only — binding regional treaty in the world devoted to internally displaced persons. Its Article 1 provides the reference IDP definition used on this platform.",
        source: { fr: "Union africaine — texte du traité", en: "African Union — treaty text", url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" }
      },
      {
        term: "Protocole sur la libre circulation (2018)",
        en_term: "Free Movement Protocol (2018)",
        fr: "Protocole au Traité d'Abuja relatif à la libre circulation des personnes, au droit de résidence et au droit d'établissement, adopté à Kigali en 2018. Il organise l'ouverture en trois phases successives — entrée, résidence, établissement — chacune conditionnant la suivante. Son entrée en vigueur requiert 15 ratifications ; il en compte 4 sur 54.",
        en: "Protocol to the Abuja Treaty on Free Movement of Persons, Right of Residence and Right of Establishment, adopted in Kigali in 2018. It organises opening in three successive phases — entry, residence, establishment — each conditioning the next. Entry into force requires 15 ratifications; it stands at 4 of 54.",
        source: { fr: "Union africaine — texte du traité", en: "African Union — treaty text", url: "https://au.int/en/treaties/protocol-treaty-establishing-african-economic-community-relating-free-movement-persons" },
        stakes: { fr: "Le découpage en phases est ce qui rend le texte signable : un État peut adhérer au principe d'entrée sans s'engager sur le droit d'établissement. C'est aussi ce qui permet de s'arrêter à la première phase indéfiniment.", en: "The phased design is what makes the text signable: a state can endorse entry without committing to establishment rights. It is also what allows stopping at phase one indefinitely." }
      },
      {
        term: "MPFA (2018-2030)",
        en_term: "MPFA (2018-2030)",
        fr: "Cadre de politique migratoire pour l'Afrique et son plan d'action décennal, révisé et adopté en 2018. Document d'orientation non contraignant qui décline les priorités continentales — gouvernance du travail migrant, données, protection, diaspora — et sert de référence aux politiques migratoires nationales et régionales.",
        en: "Migration Policy Framework for Africa and its ten-year action plan, revised and adopted in 2018. A non-binding guidance document setting out continental priorities — labour migration governance, data, protection, diaspora — and serving as the reference for national and regional migration policies.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "AVOI",
        en_term: "AVOI",
        fr: "Indice d'ouverture des visas en Afrique (Africa Visa Openness Index), publié conjointement par la Banque africaine de développement et la Commission de l'Union africaine. Il mesure, pour chaque pays, la facilité d'entrée offerte aux ressortissants des autres États africains selon la part de pays admis sans visa, avec visa à l'arrivée ou avec visa préalable.",
        en: "Africa Visa Openness Index, published jointly by the African Development Bank and the African Union Commission. For each country it measures the ease of entry offered to nationals of other African states, based on the share of countries admitted visa-free, with visa on arrival, or requiring a prior visa.",
        source: { fr: "BAD & CUA, Africa Visa Openness Report", en: "AfDB & AUC, Africa Visa Openness Report", url: "https://www.visaopenness.org/" }
      },
      {
        term: "CER",
        en_term: "REC",
        fr: "Communauté économique régionale. Huit CER sont reconnues par l'Union africaine comme les blocs constitutifs de l'intégration continentale. Elles sont, en matière de mobilité, l'échelon où la libre circulation s'exerce réellement : plusieurs ont ouvert leurs frontières intérieures bien avant que le protocole continental n'existe.",
        en: "Regional Economic Community. Eight RECs are recognised by the African Union as the building blocs of continental integration. On mobility they are the level at which free movement actually operates: several opened their internal borders long before the continental protocol existed.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "ZLECAf",
        en_term: "AfCFTA",
        fr: "Zone de libre-échange continentale africaine. Accord commercial continental dont la mise en œuvre suppose une mobilité des personnes que le protocole sur la libre circulation n'a pas encore rendue effective — ce qui fait de la circulation des marchandises et de celle des personnes deux chantiers volontairement dissociés.",
        en: "African Continental Free Trade Area. A continental trade agreement whose implementation presupposes a mobility of persons that the free movement protocol has not yet made effective — making the movement of goods and of people two deliberately decoupled projects.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/en/agenda2063/flagship-projects" }
      },
      {
        term: "GCR",
        en_term: "GCR",
        fr: "Pacte mondial sur les réfugiés, affirmé par l'Assemblée générale des Nations unies en 2018. Instrument non contraignant organisé autour du partage équitable des charges et des responsabilités. Il est postérieur d'un demi-siècle à la Convention de l'OUA, qui portait déjà l'essentiel de ses principes en droit contraignant.",
        en: "Global Compact on Refugees, affirmed by the UN General Assembly in 2018. A non-binding instrument organised around equitable sharing of burdens and responsibilities. It postdates by half a century the OAU Convention, which already carried most of its principles in binding law.",
        source: { fr: "Nations unies / HCR", en: "United Nations / UNHCR", url: "https://globalcompactrefugees.org/" }
      },
      {
        term: "CTS-MRIDP",
        en_term: "STC-MRIDPs",
        fr: "Comité technique spécialisé sur la migration, les réfugiés et les personnes déplacées. Organe ministériel de l'Union africaine institué sur la base de l'article 5 de l'Acte constitutif ; il se réunit tous les deux ans et supervise la redevabilité des organes techniques du régime, dont l'OAM.",
        en: "Specialized Technical Committee on Migration, Refugees and Displaced Persons. An African Union ministerial organ established under Article 5 of the Constitutive Act; it meets every two years and oversees the accountability of the regime's technical bodies, including the AMO.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "PAFoM",
        en_term: "PAFoM",
        fr: "Forum panafricain sur la migration. Processus consultatif continental créé par décision du Conseil exécutif en 2006, dont la première session s'est tenue à Accra en 2015. Il réunit États membres, CER, processus régionaux et agences onusiennes, sans pouvoir décisionnel propre.",
        en: "Pan-African Forum on Migration. A continental consultative process created by Executive Council decision in 2006, whose first session was held in Accra in 2015. It brings together member states, RECs, regional processes and UN agencies, with no decision-making power of its own.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "JLMP",
        en_term: "JLMP",
        fr: "Programme conjoint sur la migration de travail (Joint Labour Migration Programme), porté par la Commission de l'UA avec l'OIT, l'OIM et la CEA. Il met en œuvre le cinquième domaine prioritaire de la Déclaration d'Addis-Abeba sur l'emploi (2015) autour de quatre axes : portabilité des compétences, portabilité de la protection sociale, recrutement équitable et protection des travailleurs.",
        en: "Joint Labour Migration Programme, led by the AU Commission with the ILO, IOM and ECA. It implements the fifth priority area of the 2015 Addis Ababa Declaration on Employment around four axes: skills portability, social-security portability, fair recruitment and worker protection.",
        source: { fr: "Union africaine / OIT / OIM / CEA", en: "African Union / ILO / IOM / ECA", url: "https://au.int/" }
      }
    ]
  }
];

const libraryData = [
  {
    section: { fr: "Rapports Institutionnels & Données", en: "Institutional Reports & Data" },
    icon: Database,
    items: [
      { title: "UN DESA — International Migrant Stock (2024)", year: 2024, type: { fr: "Données", en: "Data" }, desc: { fr: "Stocks migratoires mondiaux par pays d'origine et de destination.", en: "Global migrant stocks by country of origin and destination." }, url: "https://www.un.org/development/desa/pd/data/international-migrant-stock" },
      { title: "UNHCR — Global Trends Report (2025)", year: 2025, essential: true, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Statistiques mondiales sur les réfugiés et demandeurs d'asile.", en: "Global statistics on refugees and asylum seekers." }, url: "https://www.unhcr.org/refugee-statistics/" },
      { title: "IDMC — Global Report on Internal Displacement / GRID (2025)", year: 2025, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Déplacements internes liés aux conflits et aux catastrophes.", en: "Internal displacement linked to conflict and disasters." }, url: "https://www.internal-displacement.org/database/displacement-data/" },
      { title: "IOM — World Migration Report (2024)", year: 2024, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Panorama biennal des tendances migratoires mondiales.", en: "Biennial overview of global migration trends." }, url: "https://www.iom.int/" },
      { title: "AfDB & AUC — Africa Visa Openness Report (2024)", year: 2024, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Indice d'ouverture des visas par pays et par CER.", en: "Visa openness index by country and REC." }, url: "https://www.afdb.org/en" },
      { title: "World Bank — Remittances Data (2024)", year: 2024, essential: true, type: { fr: "Données", en: "Data" }, desc: { fr: "Transferts de fonds des diasporas, par pays et par an.", en: "Diaspora remittances, by country and year." }, url: "https://data.worldbank.org/" },
      { title: "World Bank / KNOMAD — Migration and Development Brief 39", year: 2023, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Analyse semestrielle des flux de transferts de fonds mondiaux et régionaux.", en: "Biannual analysis of global and regional remittance flows." }, url: "https://www.knomad.org/publication/migration-and-development-brief-39" },
      { title: "AUC & IOM — Africa Migration Report, 2nd Edition", year: 2024, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Panorama continental reliant politiques, pratiques et bien-être des migrants africains.", en: "Continental overview linking policy, practice, and the welfare of African migrants." }, url: "https://publications.iom.int/system/files/pdf/pub2023-132-r-iom-au-africa-migration-report-second-edition_3.pdf" },
      { title: "AUC, AfDB & UNECA — Africa Regional Integration Index (ARII)", year: 2019, type: { fr: "Base de données", en: "Database" }, desc: { fr: "Indice comparatif de l'intégration régionale, incluant la dimension libre circulation.", en: "Comparative regional integration index, including the free movement dimension." }, url: "https://www.arii.uneca.org" },
      { title: "AUC, ILO, IOM & UNECA — Labour Migration Statistics Report in Africa, 3rd Ed.", year: 2021, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Statistiques comparées sur la migration de main-d'œuvre en Afrique.", en: "Comparative statistics on labour migration in Africa." }, url: "https://au.int/en/documents/20211118/report-labour-migration-statistics-africa-third-edition-2019" },
      { title: "AUC, ILO & IOM — Report on Labour Migration Statistics in Africa, 4th Ed. (2022 data)", year: 2026, essential: true, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Quatrieme edition du rapport continental, produite sous le programme JLMP. Serie 2010-2022 des travailleurs migrants, part des femmes, envois de fonds par sous-region, couverture de protection sociale. Revise a la baisse la serie de la 3e edition.", en: "Fourth edition of the continental report, produced under the JLMP programme. 2010-2022 series on migrant workers, women's share, remittances by subregion, social protection coverage. Revises the 3rd edition's series downward." }, url: "https://au.int/sites/default/files/4th_Edi_LMSRA_EN_WEB_20260626.pdf" },
      { title: "Banque mondiale — Global Findex (inclusion financiere)", year: 2025, essential: true, type: { fr: "Base de donnees", en: "Database" }, desc: { fr: "Enquete mondiale sur la detention de comptes, le mobile money et la reception de transferts, par pays et par vague. Interrogeable via l API v2 de la Banque mondiale. Integree ici pour 48 pays africains : elle documente le canal par lequel les transferts arrivent, la ou les autres sources ne donnent que le montant.", en: "Global survey on account ownership, mobile money and remittance receipt, by country and wave. Queryable through the World Bank v2 API. Integrated here for 48 African countries: it documents the rail remittances travel on, where other sources give only the amount." }, url: "https://www.worldbank.org/en/publication/globalfindex" },
      { title: "UNHCR — Refugee Data Finder (API publique)", year: 2026, essential: true, type: { fr: "Base de donnees", en: "Database" }, desc: { fr: "Base publique du HCR sur les populations deplacees et apatrides, par pays d asile et par annee, sur plus de 70 ans. Interrogeable par API. Integree a cette plateforme pour les millesimes 2014 et 2024 : refugies, demandeurs d asile, deplaces internes suivis, apatrides.", en: "UNHCR public database on displaced and stateless populations, by country of asylum and year, spanning over 70 years. Queryable by API. Integrated into this platform for 2014 and 2024: refugees, asylum seekers, monitored IDPs, stateless persons." }, url: "https://www.unhcr.org/refugee-statistics" },
      { title: "UN DESA — Principles and Recommendations for Population and Housing Censuses, Rev. 3", year: 2017, type: { fr: "Norme statistique", en: "Statistical standard" }, desc: { fr: "La norme onusienne du recensement : cinq caractéristiques essentielles, périodicité d'au moins dix ans, et les caractéristiques de migration internationale à collecter. C'est l'étalon contre lequel se mesure la régularité des recensements africains.", en: "The UN census standard: five essential features, a periodicity of at least ten years, and the international migration characteristics to be collected. It is the yardstick against which the regularity of African censuses is measured." }, url: "https://unstats.un.org/unsd/demographic-social/Standards-and-Methods/files/Principles_and_Recommendations/Population-and-Housing-Censuses/Series_M67rev3-E.pdf" },
      { title: "African Union — Strategy for the Harmonization of Statistics in Africa (SHaSA / SHaSA 2)", year: 2010, type: { fr: "Stratégie continentale (UA)", en: "Continental strategy (AU)" }, desc: { fr: "Adoptée à Kampala en juillet 2010 par la Conférence des chefs d'État. Porte sur l'harmonisation des concepts, des définitions et des méthodologies statistiques à l'échelle du continent ; deuxième phase 2017-2026, mise en œuvre par STATAFRIC.", en: "Adopted in Kampala in July 2010 by the Assembly of Heads of State. Covers the harmonisation of statistical concepts, definitions and methodologies continent-wide; second phase 2017-2026, implemented by STATAFRIC." }, url: "https://au.int/en/ea/statistics/shasa" },
      { title: "Mixed Migration Centre — 4Mi Data Explorer", year: 2026, essential: true, type: { fr: "Données de terrain", en: "Field Data" }, desc: { fr: "Plus de 100 000 entretiens directs avec des migrants et réfugiés sur leur parcours, leurs motivations et les risques rencontrés — une contrepartie empirique de terrain aux statistiques agrégées des organisations internationales.", en: "Over 100,000 direct interviews with migrants and refugees on their journeys, motivations, and risks faced — a field-level empirical counterpart to international organizations' aggregate statistics." }, url: "https://mixedmigration.org/4mi-data-explorer/en" },
      { title: "Afrobarometer — Attitudes on Migration & Cross-Border Mobility", year: 2026, type: { fr: "Enquête d'opinion", en: "Opinion Survey" }, desc: { fr: "Sondages d'opinion publique menés dans plus de 30 pays africains sur les perceptions de l'immigration, de l'émigration et de la libre circulation — rare source de données sur ce que pensent les citoyens africains eux-mêmes, plutôt que sur les seules statistiques de flux.", en: "Public opinion surveys conducted in 30+ African countries on perceptions of immigration, emigration, and free movement — a rare source of data on what African citizens themselves think, rather than flow statistics alone." }, url: "https://www.afrobarometer.org/" },
      { title: "ISS African Futures — Migration & Demographic Projections", year: 2026, type: { fr: "Recherche & prospective", en: "Research & Foresight" }, desc: { fr: "Modélisation prospective des dynamiques migratoires et démographiques africaines par l'Institute for Security Studies (Pretoria).", en: "Forward-looking modelling of African migration and demographic dynamics by the Institute for Security Studies (Pretoria)." }, url: "https://futures.issafrica.org/" },
      { title: "World Bank — Groundswell: Acting on Internal Climate Migration", year: 2021, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Projections de migration climatique interne à l'horizon 2050 : jusqu'à 216 millions de personnes dans le monde, dont environ 86 millions pour la seule Afrique subsaharienne.", en: "Projections of internal climate migration to 2050: up to 216 million people worldwide, including roughly 86 million in Sub-Saharan Africa alone." }, url: "https://www.worldbank.org/en/news/feature/2021/09/13/millions-on-the-move-in-their-own-countries-the-human-face-of-climate-change" },
      { title: "WHO — Health Workforce Support and Safeguards List", year: 2023, type: { fr: "Liste officielle", en: "Official List" }, desc: { fr: "Recense les pays confrontés aux pénuries les plus critiques de personnel de santé — largement concentrés en Afrique subsaharienne. Référence du débat sur la « fuite des cerveaux » médicale.", en: "Identifies countries facing the most critical health-personnel shortages — heavily concentrated in Sub-Saharan Africa. The reference point for the medical brain-drain debate." }, url: "https://www.who.int/publications/i/item/9789240069787" },
      { title: "IATA — Travel Information Manual (TIM)", year: 2024, type: { fr: "Base de données", en: "Database" }, desc: { fr: "Source primaire des exigences de visa par nationalité ; alimente notamment l'Africa Visa Openness Index de la BAD et de la CUA.", en: "Primary source on visa requirements by nationality; notably feeds the AfDB/AUC Africa Visa Openness Index." }, url: "https://www.iata.org/en/publications/timatic/" },
      { title: "Eurostat — Migration and Asylum Statistics", year: 2025, type: { fr: "Base de données", en: "Database" }, desc: { fr: "Statistiques européennes de migration et d'asile, mobilisées ici comme contrepoint pour situer les flux Afrique-Europe.", en: "European migration and asylum statistics, used here as a counterpoint to situate Africa-Europe flows." }, url: "https://ec.europa.eu/eurostat/web/migration-asylum/overview" },
      { title: "Frontex — Risk Analysis", year: 2025, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Détections de franchissements irréguliers aux frontières extérieures de l'UE. Citée comme donnée européenne de comparaison, avec ses limites méthodologiques connues (comptage d'événements et non de personnes).", en: "Detections of irregular crossings at the EU's external borders. Cited as European comparison data, with its known methodological limits (it counts events, not persons)." }, url: "https://www.frontex.europa.eu/publications/" },
      { title: "ICMPD — Migration Policy Frameworks", year: 2025, type: { fr: "Rapport", en: "Report" }, desc: { fr: "Analyses des cadres de politique migratoire, notamment sur les dialogues Afrique-Europe (Processus de Rabat et de Khartoum).", en: "Analyses of migration policy frameworks, notably on the Africa-Europe dialogues (Rabat and Khartoum Processes)." }, url: "https://www.icmpd.org/" },
      { title: "UN DESA — Drivers of Migration and Urbanization in Africa", year: 2017, type: { fr: "Document de travail", en: "Working Paper" }, desc: { fr: "Décompose les moteurs de l'urbanisation africaine et la part respective de la migration rurale-urbaine, de l'accroissement naturel et de la reclassification administrative.", en: "Breaks down the drivers of African urbanization and the respective shares of rural-urban migration, natural increase, and administrative reclassification." }, url: "https://www.un.org/development/desa/pd/sites/www.un.org.development.desa.pd/files/unpd_egm_201709_s3_paper-awunbila-final.pdf" },
      { title: "Mo Ibrahim Foundation — Ibrahim Index of African Governance (IIAG)", year: 2024, essential: true, type: { fr: "Indice & base de données", en: "Index & Database" }, desc: { fr: "Évaluation biennale de la qualité de la gouvernance dans les 54 pays africains : 81 indicateurs issus de 47 sources africaines et internationales. Fournit le contexte institutionnel dans lequel s'inscrivent les politiques migratoires.", en: "Biennial assessment of governance quality across all 54 African countries: 81 indicators drawn from 47 African and international sources. Provides the institutional context in which migration policy operates." }, url: "https://mo.ibrahim.foundation/our-research/iiag" },
      { title: "Mo Ibrahim Foundation — IIAG Data Portal", year: 2024, type: { fr: "Portail de données", en: "Data Portal" }, desc: { fr: "Portail interactif permettant d'explorer et de télécharger les séries de l'IIAG pays par pays.", en: "Interactive portal to explore and download IIAG series country by country." }, url: "https://iiag.online/" },
      { title: "Commission européenne (JRC/KCMD) — Atlas of Migration", year: 2025, essential: true, type: { fr: "Atlas & base de données", en: "Atlas & Database" }, desc: { fr: "Atlas annuel du Centre commun de recherche : données migratoires harmonisées et validées pour 171 pays et territoires, avec profils nationaux. Source de comparaison européenne, à lire en tenant compte de son point de vue institutionnel.", en: "Annual atlas from the Joint Research Centre: harmonised and validated migration data for 171 countries and territories, with country profiles. A European comparison source, to be read with its institutional standpoint in mind." }, url: "https://knowledge4policy.ec.europa.eu/atlas-migration_en" },
      { title: "Commission européenne — Knowledge Centre on Migration and Demography (KCMD)", year: 2025, type: { fr: "Centre de connaissances", en: "Knowledge Centre" }, desc: { fr: "Portail du centre de connaissances de la Commission sur la migration et la démographie, dont dépend l'Atlas of Migration.", en: "Portal of the Commission's knowledge centre on migration and demography, which produces the Atlas of Migration." }, url: "https://knowledge4policy.ec.europa.eu/migration-demography_en" },
    ]
  },
  {
    section: { fr: "Union africaine, agences & Communautés économiques régionales", en: "African Union, Agencies & Regional Economic Communities" },
    icon: Landmark,
    items: [
      { title: "Observatoire africain des migrations (OAM / AMO)", year: 2025, essential: true, type: { fr: "Agence de l'UA", en: "AU Agency" }, desc: { fr: "Organe de l'Union africaine chargé de la collecte, de l'analyse et de l'harmonisation des données migratoires continentales. Siège à Rabat ; publie rapports d'activités et notes analytiques.", en: "African Union body responsible for collecting, analysing, and harmonising continental migration data. Based in Rabat; publishes activity reports and analytical notes." }, url: "https://amo.au.int/en" },
      { title: "Centre africain d'études et de recherche sur les migrations (ACSRM / CERSM)", year: 2025, type: { fr: "Agence de l'UA", en: "AU Agency" }, desc: { fr: "Bureau technique spécialisé de la CUA (lancé en 2021) : recherche appliquée et « African Migration Policy Briefs » à destination des États et des CER.", en: "AUC specialised technical office (launched 2021): applied research and \"African Migration Policy Briefs\" for member states and RECs." }, url: "https://acsrm-au.org/" },
      { title: "Union africaine — Documents, rapports et décisions", year: 2025, type: { fr: "Portail documentaire", en: "Document Portal" }, desc: { fr: "Portail officiel des documents de l'UA : décisions des sommets, rapports des CTS, cadres politiques et communiqués — source primaire pour tout élément de gouvernance cité sur cette plateforme.", en: "Official AU document portal: summit decisions, STC reports, policy frameworks, and communiqués — the primary source for governance material cited across this platform." }, url: "https://au.int/en/documents" },
      { title: "AUDA-NEPAD — Agence de développement de l'Union africaine", year: 2025, type: { fr: "Agence de l'UA", en: "AU Agency" }, desc: { fr: "Agence de mise en œuvre de l'Agenda 2063, notamment sur la libre circulation des personnes et le passeport africain.", en: "Implementing agency for Agenda 2063, notably on free movement of persons and the African passport." }, url: "https://www.nepad.org/" },
      { title: "CEDEAO / ECOWAS — Portail officiel", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Protocole de 1979 sur la libre circulation, actes additionnels et processus consultatif MIDWA. Bloc le plus ouvert du continent (AVOI 0,629).", en: "1979 free movement Protocol, additional acts, and the MIDWA consultative process. The continent's most open bloc (AVOI 0.629)." }, url: "https://www.ecowas.int/" },
      { title: "CAE / EAC — Portail officiel", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Protocole du Marché commun (2010), politique de migration de travail et postes-frontières à arrêt unique (OSBP).", en: "Common Market Protocol (2010), labour migration policy, and One-Stop Border Posts (OSBP)." }, url: "https://www.eac.int/" },
      { title: "SADC — Portail officiel", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Protocole de 2005 sur la facilitation des mouvements de personnes, plan sur la migration de travail et processus consultatif MIDSA.", en: "2005 Protocol on the Facilitation of Movement of Persons, labour migration plan, and the MIDSA consultative process." }, url: "https://www.sadc.int/" },
      { title: "COMESA — Portail officiel", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Protocoles de 1984 et 1998, facilitation des visas d'affaires et processus consultatif MIDCOM sur un espace de 21 États.", en: "1984 and 1998 Protocols, business visa facilitation, and the MIDCOM consultative process across 21 states." }, url: "https://www.comesa.int/" },
      { title: "IGAD — Portail officiel", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Deux protocoles pionniers adoptés en 2020 : libre circulation des personnes et transhumance pastorale transfrontalière.", en: "Two pioneering protocols adopted in 2020: free movement of persons and cross-border pastoral transhumance." }, url: "https://igad.int/" },
      { title: "CEEAC / ECCAS — Portail officiel", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Traité révisé de 2019 ; intégration à deux étages avec la CEMAC (suppression des visas 90 jours, passeport biométrique communautaire).", en: "Revised 2019 Treaty; two-tier integration alongside CEMAC (90-day visa abolition, community biometric passport)." }, url: "https://www.ceeac-eccas.org/" },
      { title: "UMA / AMU — Fiche officielle de l'Union africaine", year: 2025, type: { fr: "CER", en: "REC" }, desc: { fr: "Traité de Marrakech (1989), secrétariat à Rabat. Le site propre de l'organisation étant indisponible, la fiche de l'UA fait référence.", en: "Marrakech Treaty (1989), secretariat in Rabat. As the organisation's own site is unavailable, the AU factsheet serves as reference." }, url: "https://au.int/en/recs/uma" },
      { title: "CEN-SAD — Portail officiel", year: 2026, type: { fr: "CER", en: "REC" }, desc: { fr: "Traité de 1998 (révisé en 2013), 24 États membres. Siège rouvert à Tripoli en avril 2026 après relocalisation post-2011.", en: "1998 Treaty (revised 2013), 24 member states. Headquarters reopened in Tripoli in April 2026 after post-2011 relocation." }, url: "https://censad.int/en/" },
    ]
  },
  {
    section: { fr: "Cadres Juridiques & Instruments", en: "Legal Frameworks & Instruments" },
    icon: Scale,
    items: [
      { title: "African Union — Treaties, Conventions & Protocols Database", year: 2025, essential: true, type: { fr: "Base de données", en: "Database" }, desc: { fr: "Textes et statuts de ratification des instruments de l'UA.", en: "Texts and ratification status of AU instruments." }, url: "https://au.int/en/treaties" },
      { title: "ILO NORMLEX — International Labour Standards Database", year: 2025, type: { fr: "Base de données", en: "Database" }, desc: { fr: "Ratifications des conventions de l'OIT, pays par pays.", en: "ILO convention ratifications, country by country." }, url: "https://normlex.ilo.org/" },
      { title: "AU Protocol on Free Movement of Persons, Right of Residence and Right of Establishment", year: 2018, type: { fr: "Instrument juridique", en: "Legal Instrument" }, desc: { fr: "Protocole continental sur la libre circulation, la résidence et l'établissement.", en: "Continental protocol on free movement, residence, and establishment." }, url: "https://au.int/en/treaties/protocol-treaty-establishing-african-economic-community-relating-free-movement-persons" },
      { title: "Common African Position (CAP) on the Global Compact for Safe, Orderly and Regular Migration", year: 2017, type: { fr: "Position commune (UA)", en: "Common Position (AU)" }, desc: { fr: "Doctrine africaine négociée en amont du Pacte de Marrakech, structurée en six domaines thématiques et adossée à la libre circulation continentale. Document de travail de l'UA, Addis-Abeba, octobre 2017.", en: "African doctrine negotiated ahead of the Marrakech Compact, structured around six thematic areas and anchored in continental free movement. AU working document, Addis Ababa, October 2017." }, url: "https://au.int/sites/default/files/newsevents/workingdocuments/33023-wd-english_common_african_position_on_gcom.pdf" },
      { title: "Agenda 2063 — Flagship Projects (African Passport and Free Movement of People)", year: 2015, type: { fr: "Cadre stratégique (UA)", en: "Strategic Framework (AU)" }, desc: { fr: "Liste officielle des quinze projets phares de l'Agenda 2063 ; le quatrième porte le passeport africain et la libre circulation des personnes.", en: "Official list of Agenda 2063's fifteen flagship projects; the fourth carries the African Passport and free movement of persons." }, url: "https://au.int/en/agenda2063/flagship-projects" },
      { title: "AU Convention for the Protection and Assistance of IDPs (Kampala Convention)", year: 2009, type: { fr: "Instrument juridique", en: "Legal Instrument" }, desc: { fr: "Premier traité contraignant au monde sur les personnes déplacées internes.", en: "World's first binding treaty on internally displaced persons." }, url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" },
      { title: "Treaty Establishing the African Economic Community (Abuja Treaty)", year: 1991, type: { fr: "Instrument juridique", en: "Legal Instrument" }, desc: { fr: "Traité fondateur du projet d'intégration économique continentale.", en: "Founding treaty of the continental economic integration project." }, url: "https://au.int/en/treaties/treaty-establishing-african-economic-community" },
      { title: "Migration Policy Framework for Africa and Plan of Action (2018–2030)", year: 2018, essential: true, type: { fr: "Cadre politique", en: "Policy Framework" }, desc: { fr: "Cadre stratégique continental de référence en matière de gouvernance des migrations.", en: "The continent's reference strategic framework for migration governance." }, url: "https://au.int/sites/default/files/documents/35956-doc-2018_mpfa_english_version.pdf" },
      { title: "Global Compact for Migration (GCM)", year: 2018, type: { fr: "Pacte mondial", en: "Global Compact" }, desc: { fr: "Texte intégral et portail officiel du pacte de Marrakech.", en: "Full text and official portal of the Marrakech Compact." }, url: "https://www.iom.int/global-compact-migration" },
      { title: "Global Compact on Refugees (GCR)", year: 2018, type: { fr: "Pacte mondial", en: "Global Compact" }, desc: { fr: "Cadre de partage équitable des charges pour les réfugiés.", en: "Framework for equitable responsibility-sharing on refugees." }, url: "https://globalcompactrefugees.org/about-digital-platform/global-compact-refugees" },
      { title: "UN Sustainable Development Goals — Agenda 2030", year: 2015, type: { fr: "Cadre mondial", en: "Global Framework" }, desc: { fr: "Cibles 10.7, 10.c, 17.18 et 8.8 sur la mobilité et le travail.", en: "Targets 10.7, 10.c, 17.18 and 8.8 on mobility and labour." }, url: "https://www.un.org/sustainabledevelopment/" },
    ]
  },
  {
    section: { fr: "Recherche & Références Académiques", en: "Research & Academic References" },
    icon: BookOpen,
    items: [
      { title: "Ben Mokhtar, Y. — Dynamiques multiniveaux du régime africain de gouvernance migratoire : Principes, normes, règles et procédures à l'épreuve de l'entre-deux national", year: 2026, essential: true, type: { fr: "Thèse doctorale", en: "Doctoral Thesis" }, desc: { fr: "Thèse doctorale (UIR, septembre 2026) sur le régime africain de gouvernance migratoire, à l'origine de cette plateforme.", en: "Doctoral thesis (UIR, September 2026) on the African migration governance regime, the origin of this platform." }, url: null },
      { title: "de Haas, H. (2021) — A Theory of Migration: The Aspirations–Capabilities Framework", year: 2021, essential: true, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Cadre analytique des capabilités de mouvement (Comparative Migration Studies).", en: "Analytical framework of movement capabilities (Comparative Migration Studies)." }, url: "https://doi.org/10.1186/s40878-020-00210-4" },
      { title: "de Haas, H. (2023) — How Migration Really Works", year: 2023, type: { fr: "Ouvrage", en: "Book" }, desc: { fr: "Guide factuel contre les principaux mythes du débat migratoire contemporain.", en: "A factful guide against the major myths of the contemporary migration debate." }, url: null },
      { title: "Adamson, F. & Tsourapas, G. (2019) — Migration Diplomacy in World Politics", year: 2019, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Concept de diplomatie migratoire (International Studies Perspectives).", en: "The concept of migration diplomacy (International Studies Perspectives)." }, url: "https://doi.org/10.1093/isp/eky015" },
      { title: "Achiume, E. T. (2019) — Migration as Decolonization", year: 2019, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Relit le droit international de la migration à travers le prisme décolonial.", en: "Reframes international migration law through a decolonial lens." }, url: "https://ssrn.com/abstract=3330353" },
      { title: "Bakewell, O. (2008) — 'Keeping Them in Their Place'", year: 2008, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Critique le lien ambivalent entre développement et migration en Afrique.", en: "Critiques the ambivalent relationship between development and migration in Africa." }, url: "https://doi.org/10.1080/01436590802386492" },
      { title: "Flahaux, M.-L. & de Haas, H. (2016) — African Migration: Trends, Patterns, Drivers", year: 2016, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Synthèse des grandes tendances et moteurs des migrations africaines.", en: "Synthesis of the major trends and drivers of African migration." }, url: "https://doi.org/10.1186/s40878-015-0015-6" },
      { title: "Mbembe, A. & Sarr, F. (dir., 2017) — Écrire l'Afrique-Monde", year: 2017, type: { fr: "Ouvrage collectif", en: "Edited Volume" }, desc: { fr: "Perspective panafricaine sur les recompositions du monde contemporain.", en: "A pan-African perspective on the reconfigurations of the contemporary world." }, url: null },
      { title: "Mamdani, M. (1996) — Citizen and Subject", year: 1996, type: { fr: "Ouvrage", en: "Book" }, desc: { fr: "Analyse fondatrice de l'héritage institutionnel colonial en Afrique.", en: "Foundational analysis of the colonial institutional legacy in Africa." }, url: null },
      { title: "Landau, L. B. (2019) — A Chronotope of Containment Development", year: 2019, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Analyse la reterritorialisation de l'Afrique face à la crise migratoire européenne.", en: "Analyzes Africa's reterritorialization in response to Europe's migration crisis." }, url: "https://doi.org/10.1111/anti.12420" },
      { title: "De Genova, N. (2013) — Spectacles of Migrant 'Illegality'", year: 2013, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Déconstruit la fabrication politique de l'« illégalité » migratoire.", en: "Deconstructs the political production of migrant 'illegality'." }, url: "https://doi.org/10.1080/01419870.2013.783710" },
      { title: "Adepoju, A. (2008) — Migration in Sub-Saharan Africa", year: 2008, type: { fr: "Chapitre d'ouvrage", en: "Book Chapter" }, desc: { fr: "Chapitre de référence sur les dynamiques migratoires subsahariennes.", en: "Reference chapter on Sub-Saharan African migration dynamics." }, url: "https://publications.iom.int/books/migration-and-development-perspectives-south" },
      { title: "Bayart, J.-F. (2000) — Africa in the World: A History of Extraversion", year: 2000, type: { fr: "Article académique", en: "Journal Article" }, desc: { fr: "Théorie de l'extraversion comme stratégie historique des élites africaines.", en: "Theory of extraversion as a historical strategy of African elites." }, url: "https://doi.org/10.1093/afraf/99.395.217" },
    ]
  }
];

const LibraryCard = ({ item, lang, essential = false }) => {
  const CardTag = item.url ? 'a' : 'div';
  const cardProps = item.url ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <CardTag
      {...cardProps}
      className={essential
        ? `p-5 rounded-lg border border-amber-200 bg-amber-50 flex flex-col gap-2 transition-colors duration-200 ${item.url ? 'hover:border-amber-500 group cursor-pointer' : ''}`
        : `p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-1.5 transition-colors ${item.url ? 'hover:border-amber-300 hover:bg-amber-50/50 group cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">{item.type[lang]}</span>
        {essential ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> : <span className="text-[9px] font-bold text-slate-400">{item.year}</span>}
      </div>
      <div className="flex items-start justify-between gap-2">
        <span className={`font-bold text-slate-800 leading-snug group-hover:text-amber-900 ${essential ? 'text-sm' : 'text-xs'}`}>{item.title}</span>
        {item.url && !essential && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 mt-0.5" />}
      </div>
      <p className={`text-slate-500 leading-relaxed text-xs ${essential ? 'flex-1' : ''}`}>{item.desc[lang]}</p>
      {essential && (
        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-1">
          {item.url ? <>{lang === 'fr' ? 'Consulter' : 'View source'} <ExternalLink className="w-3 h-3" /></> : (lang === 'fr' ? `Année ${item.year}` : `Year ${item.year}`)}
        </span>
      )}
    </CardTag>
  );
};

const TabLibrary = ({ text, lang, exportLibraryCSV, children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const totalDocs = libraryData.reduce((sum, s) => sum + s.items.length, 0);
  const essentials = libraryData.flatMap(s => s.items.filter(i => i.essential));

  const query = searchTerm.trim().toLowerCase();
  const matchesSearch = (item) => {
    if (!query) return true;
    return item.title.toLowerCase().includes(query) || item.desc.fr.toLowerCase().includes(query) || item.desc.en.toLowerCase().includes(query);
  };

  const filteredSections = libraryData
    .map((section, idx) => ({ ...section, idx, items: section.items.filter(matchesSearch) }))
    .filter(section => (activeFilter === 'all' || activeFilter === String(section.idx)) && section.items.length > 0);

  const noResults = filteredSections.length === 0;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
      <PageHeader
        badge={text.headers.library.badge}
        plate={"Pl. VIII"}
        plain={text.headers.library.plain}
        lang={lang}
        title={text.headers.library.title}
        highlight={text.headers.library.highlight}
        desc={text.headers.library.desc}
        icon={BookOpen}
      />
      {children}

      <div>
        <h3 className="flex items-center text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
          <Star className="w-4 h-4 mr-2 text-amber-500 fill-amber-400" />
          {lang === 'fr' ? "Essentiels — Pour Commencer" : "Essentials — Start Here"}
          <CsvButton onClick={exportLibraryCSV} label={lang === 'fr' ? "Bibliographie (CSV)" : "Bibliography (CSV)"} className="ml-auto normal-case tracking-normal" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {essentials.map((item, idx) => <LibraryCard key={idx} item={item} lang={lang} essential />)}
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            aria-label={lang === 'fr' ? 'Rechercher dans la bibliothèque' : 'Search the library'}
            placeholder={lang === 'fr' ? "Rechercher une source, un auteur, un mot-clé…" : "Search a source, author, keyword…"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${activeFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {lang === 'fr' ? 'Tout voir' : 'View All'} ({totalDocs})
          </button>
          {libraryData.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFilter(String(idx))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${activeFilter === String(idx) ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {section.section[lang]} ({section.items.length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {noResults ? (
          <div className="p-16 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">{lang === 'fr' ? "Aucune source ne correspond à votre recherche." : "No source matches your search."}</p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.idx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
                <section.icon className="w-5 h-5 mr-2.5 text-amber-700" />
                {section.section[lang]}
                <span className="ml-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{section.items.length}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {section.items.map((item, iIdx) => <LibraryCard key={iIdx} item={item} lang={lang} />)}
              </div>
            </div>
          ))
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-800 leading-relaxed">
          {lang === 'fr'
            ? `Cette bibliothèque rassemble ${totalDocs} sources institutionnelles, juridiques et académiques vérifiées — dont une sélection tirée du corpus bibliographique de la thèse à l'origine de cette plateforme. Chaque référence pointe vers son texte ou portail officiel lorsqu'un lien stable existe.`
            : `This library gathers ${totalDocs} verified institutional, legal, and academic sources — including a selection drawn from the bibliographic corpus of the thesis behind this platform. Each reference links to its official text or portal where a stable link exists.`}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Données & statistiques : la production statistique africaine, ses volumes réels
// et l'endroit exact où se situe le déficit. Compilation de l'auteur d'après l'UNSD.
// ----------------------------------------------------------------------------
const censusQuestionDepth = [
  { key: 'intl', label: { fr: "Migration internationale (au moins une question)", en: "International migration (at least one question)" }, states: 46, pctRound: 98, pct54: 85 },
  { key: 'citizenship', label: { fr: "Citoyenneté", en: "Citizenship" }, states: 42, pctRound: 91.5, pct54: 78, core: true },
  { key: 'birth', label: { fr: "Pays de naissance", en: "Country of birth" }, states: 40, pctRound: 87, pct54: 74, core: true },
  { key: 'emigration', label: { fr: "Émigration d'un membre du ménage", en: "Emigration of a household member" }, states: 23, pctRound: 55, pct54: 42.5 },
  { key: 'arrival', label: { fr: "Année ou période d'arrivée", en: "Year or period of arrival" }, states: 7, pctRound: 15, pct54: 13, core: true },
  { key: 'reason', label: { fr: "Motif de la migration", en: "Reason for migration" }, states: 6, pctRound: 13.6, pct54: 11.1 },
];

const censusNoRound2010 = ["Comores", "Centrafrique", "RDC", "Érythrée", "Madagascar", "Somalie", "Soudan du Sud"];
const censusNoRound2010En = ["Comoros", "Central African Republic", "DR Congo", "Eritrea", "Madagascar", "Somalia", "South Sudan"];

const IndicatorsMatrix = ({ text, lang, expandedIndicator, setExpandedIndicator, exportIndicatorsCSV }) => (
    <section id="data">
      <div className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-100 rounded-sm border border-slate-200"><BookOpen className="h-6 w-6 text-slate-700" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 tracking-tight">{text.sections.data}</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-3xl">{text.indicator_desc}</p>
            </div>
          </div>
          <button onClick={exportIndicatorsCSV} className="flex items-center space-x-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-sm font-bold text-xs transition-all border border-slate-300 shadow-sm shrink-0">
            <Download className="w-4 h-4" /> <span>{text.download_indicators}</span>
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-10 flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed text-justify">
            {lang === 'fr'
              ? "À la différence des autres sections de cette plateforme — qui consolident des données déjà collectées par les institutions internationales — cette matrice est une proposition originale issue de la recherche doctorale à l'origine du projet. Elle propose 12 indicateurs alternatifs, pensés en contrepoint des cadres statistiques dominants — stocks migratoires, index sécuritaires, cibles ODD. Ils visent des dimensions structurellement sous-documentées des mobilités africaines, qu'aucune mesure continentale ne couvre encore — résilience économique diasporique, féminisation des flux, mobilité circulaire, décriminalisation de l'irrégularité. Chaque fiche explicite, dans « Le Changement de Paradigme », le récit qu'elle vient déplacer. Il s'agit d'une recommandation méthodologique adressée aux instituts nationaux de statistique et aux chercheurs de terrain — pas d'un jeu de données déjà constitué."
              : "Unlike the other sections of this platform — which consolidate data already collected by international institutions — this matrix is an original proposal stemming from the doctoral research behind the project. It proposes 12 alternative indicators, designed as a counterpoint to dominant statistical frameworks — migrant stocks, security indices, SDG targets. They target structurally under-documented dimensions of African mobility, none of which any continental measure yet covers — diaspora economic resilience, feminization of flows, circular mobility, decriminalization of irregularity. Each card spells out, under \"The Paradigm Shift\", the narrative it displaces. This is a methodological recommendation aimed at national statistical institutes and field researchers — not an already-constituted dataset."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {indicatorThemes.map((theme, i) => (
            <div key={i}>
              <h3 className={`flex items-center text-base font-serif font-bold ${theme.color} mb-5`}>
                {React.cloneElement(theme.icon, { className: "w-5 h-5 mr-2" })} 
                {lang === 'fr' ? theme.theme_fr : theme.theme_en}
              </h3>
              <div className="space-y-3">
                {theme.items.map((ind, j) => (
                  <div 
                    key={j} 
                    onClick={() => setExpandedIndicator(expandedIndicator === ind.id ? null : ind.id)}
                    className={`p-4 border rounded-lg transition-all cursor-pointer group flex flex-col items-start relative overflow-hidden ${expandedIndicator === ind.id ? 'bg-slate-50 border-blue-300 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between w-full mb-2 relative z-10">
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm tracking-widest shrink-0 uppercase">
                        Ind. {ind.id}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expandedIndicator === ind.id ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug relative z-10">
                      {lang === 'fr' ? ind.fr : ind.en}
                    </p>
                    {(lang === 'fr' ? ind.desc_fr : ind.desc_en) && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed relative z-10">
                        {lang === 'fr' ? ind.desc_fr : ind.desc_en}
                      </p>
                    )}
                      
                    <div className={`w-full overflow-hidden transition-all duration-500 relative z-10 print:!max-h-none print:!opacity-100 print:mt-4 print:pt-4 print:border-t print:border-slate-200 print:break-inside-avoid ${expandedIndicator === ind.id ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Search className="w-3 h-3" />{lang === 'fr' ? "Méthodologie & Collecte" : "Methodology & Data Collection"}</span>
                          <p className="text-xs text-slate-700 leading-relaxed">{lang === 'fr' ? ind.method_fr : ind.method_en}</p>
                        </div>
                        <div className="bg-white p-3 rounded-sm border border-slate-200">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" />{lang === 'fr' ? "Le Changement de Paradigme" : "The Paradigm Shift"}</span>
                          <p className="text-xs text-slate-800 italic leading-relaxed">{lang === 'fr' ? ind.contrast_fr : ind.contrast_en}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
);

// Frise des cycles de recensement d'un pays (base : compilation de l'auteur d'apres l'UNSD).
const CensusTimeline = ({ iso2, lang, compact = false }) => {
  const rec = iso2 ? censusByCountry[iso2] : null;
  if (!rec) return null;
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const st = census2020Status[rec.status2020] || census2020Status.none;

  return (
    <div className={compact ? '' : 'bg-white p-7 rounded-lg border border-slate-200 shadow-sm'}>
      {!compact && (
        <>
          <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg">
            <Calendar className="w-5 h-5 mr-2.5 text-slate-400" /> {L("Recensements de la population", "Population censuses")}
          </h3>
          <p className="text-sm text-slate-600 mb-5">
            {L("Dates des recensements nationaux par cycle décennal. Le recensement reste la source la plus complète sur les migrants présents sur un territoire.",
               "National census dates by decennial round. The census remains the most comprehensive source on migrants present in a territory.")}
          </p>
        </>
      )}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {censusRoundMeta.map((r) => {
          const c = censusMark(rec[r.key]);
          // Le statut ne teinte que la case du cycle qu'il decrit : 2020, ou 2030
          // pour les Etats qui ont recense apres la cloture du cycle precedent.
          const carries = r.key === (rec.status2020 === 'late' ? 'r2030' : 'r2020');
          const tone = carries ? st.cls
            : c.counted ? 'bg-slate-50 border-slate-200 text-slate-800'
            : c.empty ? 'bg-slate-50 border-slate-200 text-slate-300'
            : 'border-dashed';  // indiquee, non comptabilisee
          return (
            <div key={r.key} className={`rounded-md border px-2 py-2 text-center ${tone}`}
                 style={!carries && !c.counted && !c.empty
                   ? { backgroundColor: 'var(--paper-sunk)', borderColor: 'var(--rule-strong)', color: 'var(--label)' }
                   : undefined}
                 title={!c.counted && !c.empty ? markLegend(c.mark, lang) : undefined}>
              <span className="block text-[9px] font-bold uppercase tracking-widest opacity-70">{r.label[lang]}</span>
              <span className="block text-[11px] font-bold tabular-nums mt-0.5 leading-tight">
                {c.year ? (
                  <>{c.raw.replace(/\*+/, '')}<sup className="font-normal">{c.mark}</sup></>
                ) : c.mark ? (
                  <>—<sup className="font-normal">{c.mark}</sup></>
                ) : '—'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border ${st.cls}`}>
          {rec.status2020 === 'late'
            ? st[lang]
            : `${L("Cycle 2020 : ", "2020 round: ")}${st[lang]}`}
        </span>
        {rec.updated2026 && (
          <span className="text-[10px] font-medium" style={{ color: 'var(--label)' }}>
            <span className="font-bold" style={{ color: 'var(--accent-2)' }}>
              {L("Vérifié en août 2026 — ", "Verified August 2026 — ")}
            </span>
            {typeof rec.updated2026 === 'string' ? rec.updated2026 : rec.updated2026[lang]}
          </span>
        )}
      </div>
      {/* La legende ne liste que les marques reellement presentes chez ce pays —
          elle ne portait que sur r1970, l'Erythree et la Namibie n'en voyaient aucune. */}
      {(() => {
        const marks = [...new Set(censusRoundMeta
          .map(r => censusMark(rec[r.key]).mark)
          .filter(Boolean))].sort((a, b) => a.length - b.length);
        if (!marks.length) return null;
        return (
          <ul className="mt-2 space-y-0.5">
            {marks.map(mk => (
              <li key={mk} className="text-[10px] italic leading-snug" style={{ color: 'var(--label)' }}>
                <sup className="not-italic font-bold">{mk}</sup> {markLegend(mk, lang)}
              </li>
            ))}
          </ul>
        );
      })()}
      {!compact && (
        <p className="text-[10px] text-slate-400 italic mt-3 pt-3 border-t border-slate-100">
          {L("Source : compilation de l'auteur (Ben Mokhtar, 2024) d'après la Division de statistique des Nations unies (UNSD) et UN DESA.",
             "Source: author's own compilation (Ben Mokhtar, 2024) from the United Nations Statistics Division (UNSD) and UN DESA.")}
        </p>
      )}
    </div>
  );
};

const TabDataStats = ({ text, lang, exportCensusCSV, expandedIndicator, setExpandedIndicator, exportIndicatorsCSV }) => {
  const L = (fr, en) => (lang === 'fr' ? fr : en);
  const headline = [
    { val: "47/54", lbl: L("États ayant recensé (cycle 2010)", "States that censused (2010 round)"), sub: L("soit 87 % du continent", "i.e. 87% of the continent") },
    { val: "11,1", lbl: L("Années entre deux recensements", "Years between two censuses"), sub: L("recommandation ONU : 10 ans", "UN recommendation: 10 years") },
    { val: "1-5 €", lbl: L("Coût par habitant recensé", "Cost per inhabitant enumerated"), sub: L("charge logistique majeure", "a major logistical burden") },
    { val: "13,6 %", lbl: L("Recensements interrogeant le motif", "Censuses asking the reason"), sub: L("le déficit est là, pas dans la collecte", "the deficit sits here, not in collection") },
  ];

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
      <PageHeader
        badge={L("Production statistique africaine", "African statistical production")}
        plate={"Pl. VII"}
        plain={{"fr":"On répète souvent que l'Afrique manque de données. Cette section compte ce que le continent produit réellement, et regarde où le déficit se situe.","en":"It is often repeated that Africa lacks data. This section counts what the continent actually produces, and looks at where the shortfall really sits."}}
        lang={lang}
        title={L("Données & statistiques", "Data & Statistics")}
        highlight={L("où se situe réellement le déficit.", "where the deficit actually lies.")}
        desc={L(
          "Le récit d'une Afrique « sans données » est l'un des plus solidement installés — et l'un des moins vérifiés. Cette section confronte ce récit au volume réel de la production statistique du continent.",
          "The narrative of an Africa \"without data\" is among the most firmly established — and the least verified. This section tests it against the continent's actual statistical output."
        )}
        icon={Database}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 divide-x divide-y md:divide-y-0 divide-slate-200">
        {headline.map((h, i) => (
          <div key={i} className="px-5 py-6">
            <div className="text-3xl font-serif font-bold text-slate-900 tabular-nums leading-none">{h.val}</div>
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2.5 block leading-snug">{h.lbl}</span>
            <span className="text-[10px] text-slate-400 mt-1.5 block">{h.sub}</span>
          </div>
        ))}
      </div>

      <MovementOpener
        n="01"
        accent="var(--accent-2)"
        kicker={L("Le constat", "The finding")}
        thesis={L(
          "Les États africains recensent, à une fréquence qui tient la norme internationale. La collecte n'est pas le maillon faible.",
          "African states do census, at a frequency that holds to the international standard. Collection is not the weak link."
        )}
      />

      <Reveal className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-3">
          {L("La collecte n'est pas le maillon faible", "Collection is not the weak link")}
        </h2>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <p>{L(
            "Lors du cycle de recensements de 2010 — qui court en pratique de 2006 à 2014 — 47 États africains sur 54 ont conduit un recensement national, soit 87 % du continent. À l'échelle mondiale, 178 des 193 États membres de l'ONU en ont fait autant : la participation africaine se situe donc dans la norme internationale, et non en marge d'elle.",
            "During the 2010 census round — which in practice runs from 2006 to 2014 — 47 of 54 African states conducted a national census, that is 87% of the continent. Globally, 178 of the UN's 193 member states did the same: African participation therefore sits within the international norm, not at its margins."
          )}</p>
          <p>{L(
            "L'intervalle moyen entre deux recensements y est de 11,1 ans, à peine au-delà des dix ans recommandés par les Nations unies, pour un coût compris entre 1 et 5 € par habitant dénombré (Gendreau & Dackam-Ngatchou, 2023). Rapportée à la contrainte budgétaire et logistique que représente un recensement exhaustif, cette régularité traduit une priorité politique assumée, non une défaillance.",
            "The average interval between two censuses there is 11.1 years, barely beyond the ten years recommended by the United Nations, at a cost of between €1 and €5 per inhabitant enumerated (Gendreau & Dackam-Ngatchou, 2023). Set against the budgetary and logistical constraint an exhaustive census represents, this regularity reflects a deliberate political priority, not a failure."
          )}</p>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-5 flex items-start gap-3 max-w-4xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed text-justify">
            {L(
              "Un taux de couverture ne dit rien de la qualité des dénombrements. Sept États n'ont pas recensé durant le cycle 2010 — " + censusNoRound2010.join(", ") + " — et la République démocratique du Congo n'a conduit qu'un seul recensement dans son histoire, en 1984. L'Éthiopie a recensé, mais sans question sur la migration internationale.",
              "A coverage rate says nothing about enumeration quality. Seven states did not census during the 2010 round — " + censusNoRound2010En.join(", ") + " — and the Democratic Republic of the Congo has conducted only one census in its history, in 1984. Ethiopia censused, but without any question on international migration."
            )}
          </p>
        </div>
      </Reveal>

      <Reveal delay={15}>
        <CensusRhythm lang={lang} />
      </Reveal>

      {/* Le retard n'est pas une absence : ce que l'audit des statuts a fait apparaitre. */}
      <Reveal delay={17}>
        <LateRound lang={lang} />
      </Reveal>

      {/* La meme information en geographie. Un statut n'est pas une grandeur :
          la carte est donc categorielle, pas en degrade. */}
      <Reveal delay={19}>
        <CarteSection
          lang={lang}
          indicateur={CARTE_RECENSEMENT}
          kicker={L('Qui compte sa population', 'Who counts their population')}
          titre={L("Le recensement, pays par pays", 'The census, country by country')}
          plain={{
            fr: "Chaque pays porte la couleur de son dernier recensement : abouti dans la fenêtre 2015-2024, abouti après elle, en cours, annoncé, ou aucun en vue. Ce n'est pas une quantité, ce sont cinq situations.",
            en: 'Each country carries the colour of its latest census: completed within the 2015-2024 window, completed after it, under way, announced, or none in sight. This is not a quantity but five situations.',
          }}
          sources={[{ label: L("Compilation de l'auteur d'après UNSD et UN DESA, statuts vérifiés en août 2026 sur les instituts nationaux",
                               "Author's compilation after UNSD and UN DESA; statuses verified in August 2026 against national institutes") }]}
        />
      </Reveal>

      {/* La norme onusienne : l'etalon contre lequel se mesure la regularite africaine. */}
      <Reveal delay={20}>
        <AfricanCounterpoint
          lang={lang}
          accent="var(--accent-2)"
          kicker={L("La norme de référence", "The reference standard")}
          title={L(
            "Ce qu'un recensement doit être : la règle que les États africains appliquent déjà",
            "What a census must be: the rule African states already apply"
          )}
          sources={[
            { label: L(
                "Nations unies, Département des affaires économiques et sociales, Division de statistique — « Principles and Recommendations for Population and Housing Censuses », Revision 3, New York, 2017 (ST/ESA/STAT/SER.M/67/Rev.3)",
                "United Nations, Department of Economic and Social Affairs, Statistics Division — \"Principles and Recommendations for Population and Housing Censuses\", Revision 3, New York, 2017 (ST/ESA/STAT/SER.M/67/Rev.3)"
              ), url: "https://unstats.un.org/unsd/demographic-social/Standards-and-Methods/files/Principles_and_Recommendations/Population-and-Housing-Censuses/Series_M67rev3-E.pdf" },
          ]}
        >
          <p className="text-justify">
            {L(
              "Un recensement n'est pas un dénombrement quelconque. Depuis 1958, les Nations unies en codifient la définition et en promeuvent des programmes décennaux mondiaux. La troisième révision de la norme, publiée en 2017, énumère cinq caractéristiques sans lesquelles une opération ne peut être qualifiée de recensement.",
              "A census is not just any headcount. Since 1958 the United Nations has codified its definition and promoted decennial worldwide census programmes. The standard's third revision, published in 2017, lists five features without which an operation cannot be called a census."
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {(lang === 'fr' ? [
              ["Dénombrement individuel", "chaque personne est comptée séparément, avec ses caractéristiques propres"],
              ["Universalité sur un territoire défini", "toute la population du territoire, sans exception"],
              ["Simultanéité", "tous rapportés à un même instant de référence"],
              ["Périodicité définie", "à intervalles réguliers, pour que les cycles soient comparables"],
              ["Capacité à produire des statistiques locales", "descendre sous le niveau national"],
            ] : [
              ["Individual enumeration", "each person counted separately, with their own characteristics"],
              ["Universality within a defined territory", "the whole population of the territory, no exception"],
              ["Simultaneity", "all referred to one and the same reference moment"],
              ["Defined periodicity", "at regular intervals, so that rounds remain comparable"],
              ["Capacity to produce small-area statistics", "going below the national level"],
            ]).map(([name, gloss], i) => (
              <div key={i} className="flex gap-2.5 py-2" style={{ borderBottom: '1px solid var(--rule)' }}>
                <span className="shrink-0 text-[11px] font-bold tabular-nums pt-px" style={{ color: 'var(--accent-2)' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[13px] leading-snug">
                  <span className="font-semibold text-slate-800">{name}</span>
                  <span className="text-slate-500"> — {gloss}</span>
                </span>
              </div>
            ))}
          </div>

          <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {L("Périodicité recommandée (§ 1.12 et 1.13)", "Recommended periodicity (§§ 1.12 and 1.13)")}
            </h4>
            <p className="text-[13px] text-slate-600 italic leading-relaxed">
              {L(
                "« Il est recommandé qu'un recensement national soit conduit au moins tous les dix ans. » La norme ajoute que les pays devraient s'efforcer de recenser lors des années se terminant par « 0 », ou au plus près, afin que les résultats restent comparables d'un pays à l'autre.",
                "\"It is recommended that a national census be taken at least every 10 years.\" The standard adds that countries should make all efforts to census in years ending in \"0\", or as close as possible, so that results remain comparable across countries."
              )}
            </p>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {L(
                "C'est l'étalon utile : l'intervalle moyen observé en Afrique est de 11,1 ans. L'écart à la norme est d'un an, pas d'une génération.",
                "This is the useful yardstick: the average interval observed in Africa is 11.1 years. The gap to the standard is one year, not a generation."
              )}
            </p>
          </div>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {L(
                "Les caractéristiques de migration internationale prévues par la norme",
                "The international migration characteristics the standard provides for"
              )}
            </h4>
            <ul className="space-y-1">
              {(lang === 'fr' ? [
                ["Pays de naissance", true],
                ["Pays de citoyenneté", true],
                ["Année ou période d'arrivée dans le pays", true],
                ["Acquisition de la citoyenneté", false],
              ] : [
                ["Country of birth", true],
                ["Country of citizenship", true],
                ["Year or period of arrival in the country", true],
                ["Acquisition of citizenship", false],
              ]).map(([name, core], i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]" style={{ borderBottom: '1px solid var(--rule)' }}>
                  <span className="text-slate-700">{name}</span>
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: core ? 'var(--accent-2)' : 'var(--muted)' }}>
                    {core ? L("Thème central", "Core topic") : L("Thème additionnel", "Additional topic")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3 leading-relaxed text-justify">
              {L(
                "Trois de ces quatre caractéristiques sont des « thèmes centraux » : la norme recommande que tout recensement les collecte. L'instrument de mesure des migrations est donc déjà à l'intérieur du standard que les États africains appliquent. Ce n'est pas l'outil qui manque — c'est ce qu'on en fait en aval.",
                "Three of these four characteristics are \"core topics\": the standard recommends that every census collect them. The instrument for measuring migration is therefore already inside the standard African states apply. It is not the tool that is missing — it is what is done with it downstream."
              )}
            </p>
          </div>
        </AfricanCounterpoint>
      </Reveal>

      <MovementOpener
        n="02"
        accent="var(--bad)"
        kicker={L("Le décrochage", "Where it breaks")}
        thesis={L(
          "Le déficit est en aval : dans ce qui remonte, dans ce qui est harmonisé, et dans la profondeur des questions posées.",
          "The deficit lies downstream: in what gets reported, in what gets harmonised, and in the depth of the questions asked."
        )}
      />



      <Reveal delay={40} className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900">
            {L("Le déficit est dans la profondeur des questions", "The deficit is in the depth of the questions")}
          </h2>
          <CsvButton onClick={exportCensusCSV} label={L("Profondeur des questions (CSV)", "Question depth (CSV)")} />
        </div>
        <p className="text-sm text-slate-500 leading-relaxed max-w-4xl mb-6">
          {L(
            "Part des 47 recensements africains du cycle 2010 comportant chaque question migratoire. La citoyenneté et le pays de naissance sont presque systématiques ; le motif du départ et la date d'arrivée disparaissent presque entièrement.",
            "Share of the 47 African censuses in the 2010 round including each migration question. Citizenship and country of birth are near-systematic; reason for leaving and date of arrival almost entirely vanish."
          )}
        </p>

        <div className="mb-8">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            {L("Couverture par cycle de recensement", "Coverage by census round")}
          </h3>
          <div className="space-y-2.5">
            {censusRoundMeta.map((r) => {
              const pct = r.pct; // pourcentages tels que publies par l'auteur (troncature, non arrondi)
              // Le cycle 2030 vient de s'ouvrir : sa barre mesure une avancee, pas un manque.
              return (
                <div key={r.key} className="flex items-center gap-3">
                  <span className={`text-[11px] font-bold w-32 shrink-0 ${r.inProgress ? '' : 'text-slate-600'}`}
                        style={r.inProgress ? { color: 'var(--accent-2)' } : undefined}>
                    {r.label[lang]} <span className="text-slate-400 font-normal">({r.span})</span>
                  </span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden relative"
                       style={r.inProgress
                         ? { background: 'repeating-linear-gradient(135deg, var(--paper-sunk) 0 5px, #FFF 5px 10px)' }
                         : { backgroundColor: '#F1F5F9' }}>
                    <div className={`h-full rounded-full bar-fill ${r.inProgress ? '' : 'bg-teal-600'}`}
                         style={{ width: `${pct}%`, ...(r.inProgress ? { backgroundColor: 'var(--accent-2)' } : null) }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-24 text-right shrink-0 tabular-nums">
                    {r.conducted}/{r.base} · {pct} %
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }}>
            <span className="inline-block w-3 h-2 mr-1.5 align-middle rounded-sm"
                  style={{ background: 'repeating-linear-gradient(135deg, var(--paper-sunk) 0 3px, #FFF 3px 6px)', border: '1px solid var(--rule)' }} />
            {L("Le cycle 2030 vient de s'ouvrir (fenêtre 2025-2034) : sa barre mesure une avance, pas un retard.",
               "The 2030 round has only just opened (2025–2034 window): its bar measures progress, not shortfall.")}
          </p>
          <p className="text-[10px] text-slate-500 italic mt-1.5 leading-relaxed text-justify">
            {L("Le dénominateur varie : il correspond au nombre d'États africains indépendants au moment de chaque cycle. Compilation arrêtée en septembre 2024, puis actualisée en 2026 pour les recensements aboutis depuis : Angola, Maroc, Tunisie, Ouganda. Un audit des statuts encore ouverts, en août 2026, y a ajouté la Gambie (mai 2024) et São Tomé-et-Principe (novembre 2024). Le cycle 2020 passe ainsi de 29 à 35 États.",
               "The denominator varies: it reflects the number of independent African states at the time of each round. Compilation closed in September 2024, then updated in 2026 for censuses completed since: Angola, Morocco, Tunisia, Uganda. An audit of the statuses still open, in August 2026, added The Gambia (May 2024) and São Tomé and Príncipe (November 2024). The 2020 round thus moves from 29 to 35 states.")}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {L("Profondeur des questions migratoires (cycle 2010)", "Depth of migration questions (2010 round)")}
          </h3>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: 'var(--accent-2)' }}>
            <span className="inline-block w-2 h-2" style={{ backgroundColor: 'var(--accent-2)' }} />
            {L("Thème central de la norme UN DESA", "Core topic under the UN DESA standard")}
          </span>
        </div>
        <div className="space-y-3">
          {censusQuestionDepth.map((q) => (
            <div key={q.key} className="flex items-center gap-3">
              <span className="text-[11px] font-medium w-56 shrink-0 leading-snug flex items-start gap-1.5"
                    style={{ color: q.core ? 'var(--accent-2)' : 'var(--ink-soft)' }}>
                {q.core && <span className="inline-block w-2 h-2 mt-1 shrink-0" style={{ backgroundColor: 'var(--accent-2)' }} />}
                {q.label[lang]}
              </span>
              {/* Teinte unique : la grandeur est deja portee par la longueur. */}
              <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                <div className="h-full bar-fill"
                     style={{ width: `${q.pctRound}%`, backgroundColor: 'var(--accent)' }} />
              </div>
              <span className="text-xs font-bold text-slate-700 w-24 text-right shrink-0 tabular-nums">
                {q.states}/47 · {String(q.pctRound).replace('.', ',')} %
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
          <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L("Ce que le croisement avec la norme révèle", "What the overlay with the standard reveals")}
          </h4>
          <p className="text-[13px] text-slate-600 leading-relaxed text-justify">
            {L(
              "La norme onusienne place trois caractéristiques sur le même plan, toutes « thèmes centraux » : pays de naissance, citoyenneté, année d'arrivée. Les deux premières sont presque universelles dans les recensements africains — 87 % et 91,5 %. La troisième tombe à 15 %. Ce n'est ni une question de moyens ni une question de capacité : les trois figurent dans le même questionnaire de référence, et deux sont posées. Ce qui décroche, c'est précisément la question qui permettrait de dater les trajectoires — donc de les analyser. Quant au motif du départ, posé par 6 États, il ne figure même pas parmi les caractéristiques prévues par la norme : l'interroger est un choix national, au-delà du standard (Ben Mokhtar, 2026).",
              "The UN standard places three characteristics on the same footing, all \"core topics\": country of birth, citizenship, year of arrival. The first two are near-universal in African censuses — 87% and 91.5%. The third falls to 15%. This is neither a resource nor a capacity issue: all three sit in the same reference questionnaire, and two are asked. What drops out is precisely the question that would let trajectories be dated — and therefore analysed. As for reason for departure, asked by 6 states, it is not even among the characteristics the standard provides for: asking it is a national choice, beyond the standard (Ben Mokhtar, 2026)."
            )}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 italic mt-4 pt-3 border-t border-slate-100">
          {L(
            "Source : Division de statistique des Nations unies (UNSD) — compilation de l'auteur (Ben Mokhtar, 2024). Pourcentages rapportés aux 47 États ayant recensé.",
            "Source: United Nations Statistics Division (UNSD) — author's own compilation (Ben Mokhtar, 2024). Percentages relative to the 47 states that censused."
          )}
        </p>
      </Reveal>

      <MovementOpener
        n="03"
        accent="var(--ok)"
        kicker={L("La réponse", "The response")}
        thesis={L(
          "L'Afrique ne subit pas ce diagnostic : elle s'est donné une stratégie pour y répondre, et cette plateforme propose ses propres instruments.",
          "Africa is not subjected to this diagnosis: it has given itself a strategy to answer it, and this platform proposes instruments of its own."
        )}
      />

      <Reveal delay={25}>
        <MobileMoneyRail lang={lang} />
      </Reveal>

      {/* SHaSA : la reponse africaine, endogene, a la question de l'harmonisation. */}
      <Reveal delay={30}>
        <AfricanCounterpoint
          lang={lang}
          kicker={L("La stratégie africaine", "The African strategy")}
          title={L(
            "SHaSA : l'Afrique s'est donné sa propre stratégie statistique, et elle porte d'abord sur les mots",
            "SHaSA: Africa gave itself its own statistical strategy, and it is about words first"
          )}
          sources={[
            { label: L(
                "Union africaine — Stratégie pour l'harmonisation des statistiques en Afrique (SHaSA)",
                "African Union — Strategy for the Harmonization of Statistics in Africa (SHaSA)"
              ), url: "https://au.int/en/ea/statistics/shasa" },
            { label: L(
                "STATAFRIC — Institut de statistique de l'Union africaine (Tunis), sur la mise en œuvre de SHaSA 2 (2017-2026)",
                "STATAFRIC — African Union Institute for Statistics (Tunis), on implementing SHaSA 2 (2017-2026)"
              ), url: "https://statafric.au.int/en/about-statafric" },
          ]}
        >
          <p className="text-justify">
            {L(
              "La Conférence des chefs d'État et de gouvernement de l'Union africaine adopte à Kampala, en juillet 2010, la Stratégie pour l'harmonisation des statistiques en Afrique. Elle porte sur ce qui précède le chiffre : les concepts et les définitions, l'adaptation des bonnes pratiques internationales, et l'usage de méthodologies communes de production et de diffusion. Elle est aujourd'hui dans sa deuxième phase, SHaSA 2, qui court de 2017 à 2026.",
              "The African Union Assembly of Heads of State and Government adopted the Strategy for the Harmonization of Statistics in Africa in Kampala, in July 2010. It addresses what comes before the figure: concepts and definitions, the adaptation of international good practice, and the use of common methodologies for producing and disseminating statistics. It is now in its second phase, SHaSA 2, running from 2017 to 2026."
            )}
          </p>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              {L("Les quatre thèmes stratégiques", "The four strategic themes")}
            </h4>
            <ol className="space-y-2">
              {(lang === 'fr' ? [
                "Produire des statistiques de qualité pour l'Afrique.",
                "Coordonner la production de statistiques de qualité pour l'Afrique.",
                "Bâtir une capacité institutionnelle durable au sein du système statistique africain.",
                "Promouvoir une culture de la décision fondée sur la qualité.",
              ] : [
                "To produce quality statistics for Africa.",
                "To coordinate the production of quality statistics for Africa.",
                "To build sustainable institutional capacity in the African statistical system.",
                "To promote a culture of quality decision-making.",
              ]).map((t, i) => (
                <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                  <span className="shrink-0 font-serif font-bold tabular-nums" style={{ color: 'var(--accent-deep)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ol>
          </div>

          <p className="text-justify">
            {L(
              "L'ordre de ces thèmes n'est pas anodin. La production vient d'abord, la coordination ensuite, la capacité institutionnelle en troisième — c'est-à-dire que le problème identifié par les États africains eux-mêmes porte sur la comparabilité de ce qui est déjà collecté. Harmoniser des concepts et des définitions à l'échelle de 54 appareils statistiques nationaux, c'est exactement l'enjeu que soulève le Glossaire de cette plateforme, porté au niveau continental (Ben Mokhtar, 2026).",
              "The order of these themes is not incidental. Production comes first, coordination second, institutional capacity third — meaning that the problem African states themselves identify is the comparability of what is already collected. Harmonising concepts and definitions across 54 national statistical systems is exactly the issue this platform's Glossary raises, carried to continental scale (Ben Mokhtar, 2026)."
            )}
          </p>
        </AfricanCounterpoint>
      </Reveal>

      <Reveal delay={40} className="bg-slate-900 rounded-xl p-8 md:p-10 border border-slate-800 shadow-sm text-white">
        <h2 className="text-xl md:text-2xl font-serif font-bold mb-3">
          {L("Produire n'est pas analyser", "Producing is not analysing")}
        </h2>
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-w-4xl text-justify">
          <p>{L(
            "Le goulot d'étranglement se situe après la collecte. Une part importante du traitement des données de recensement africaines a longtemps été assurée depuis l'extérieur — le Bureau du recensement des États-Unis (USCB) a accompagné pendant des décennies le traitement de ces données. Cette dépendance déplace le problème : la donnée brute existe ; ce qui fait défaut, c'est la maîtrise de sa mise en forme, de son interprétation et des catégories qu'elle mobilise.",
            "The bottleneck sits after collection. A significant share of the processing of African census data has long been carried out externally — the United States Census Bureau (USCB) supported that processing for decades. This dependence shifts the problem: the raw data exists; what is missing is control over its shaping, its interpretation, and the categories it mobilises."
          )}</p>
          <p>{L(
            "Or la catégorie n'est jamais neutre. Décider si l'on dénombre les résidents habituels (population de jure) ou toutes les personnes présentes (de facto), retenir la citoyenneté plutôt que le pays de naissance, poser ou non la question du motif : chacun de ces choix produit une image différente de la même population. Tant que ces arbitrages sont opérés ailleurs, la souveraineté statistique reste formelle.",
            "Yet the category is never neutral. Deciding whether to enumerate usual residents (de jure population) or all persons present (de facto), retaining citizenship rather than country of birth, asking or not asking the reason: each of these choices produces a different image of the same population. As long as these trade-offs are made elsewhere, statistical sovereignty remains formal."
          )}</p>
          <p className="text-white font-medium">{L(
            "C'est le sens de l'investissement continental dans ses propres instruments — l'Observatoire africain des migrations, STATAFRIC, la Stratégie d'harmonisation des statistiques en Afrique (SHaSA), dont l'objet est de reprendre la main sur le cadrage et l'analyse de ce qui est déjà collecté.",
            "This is the point of the continental investment in its own instruments — the African Migration Observatory, STATAFRIC, the Strategy for the Harmonization of Statistics in Africa (SHaSA): not to collect more, but to regain control over the framing and analysis of what is already collected."
          )}</p>
        </div>
      </Reveal>

      <IndicatorsMatrix
        text={text} lang={lang}
        expandedIndicator={expandedIndicator} setExpandedIndicator={setExpandedIndicator}
        exportIndicatorsCSV={exportIndicatorsCSV}
      />
    </div>
  );
};

const TabGlossary = ({ lang, text, exportGlossaryCSV, children }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const query = searchTerm.trim().toLowerCase();

  const filteredCategories = glossaryData
    .map(cat => ({
      ...cat,
      terms: cat.terms
        .filter(t => !query || t.term.toLowerCase().includes(query) || t.en_term.toLowerCase().includes(query) || t.fr.toLowerCase().includes(query) || t.en.toLowerCase().includes(query))
        .sort((a, b) => (lang === 'fr' ? a.term : a.en_term).localeCompare(lang === 'fr' ? b.term : b.en_term))
    }))
    .filter(cat => cat.terms.length > 0);

  const totalTerms = glossaryData.reduce((sum, c) => sum + c.terms.length, 0);
  const noResults = filteredCategories.length === 0;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
      <PageHeader
        badge={text.headers.glossary.badge}
        plate={"Pl. IX"}
        plain={text.headers.glossary.plain}
        lang={lang}
        title={text.headers.glossary.title}
        highlight={text.headers.glossary.highlight}
        desc={text.headers.glossary.desc}
        icon={Brain}
      />
      {children}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center">
            <Brain className="w-5 h-5 mr-2.5 text-teal-700" />
            {lang === 'fr' ? 'Glossaire & Concepts Clés' : 'Glossary & Key Concepts'}
          </h2>
          <CsvButton onClick={exportGlossaryCSV} label={lang === 'fr' ? "Glossaire (CSV)" : "Glossary (CSV)"} />
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-5">
          {lang === 'fr'
            ? `${totalTerms} termes techniques et notions théoriques mobilisés à travers cette plateforme, expliqués et référencés.`
            : `${totalTerms} technical terms and theoretical concepts used throughout this platform, explained and referenced.`}
        </p>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={lang === 'fr' ? "Rechercher un terme…" : "Search a term…"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
          />
        </div>
      </div>

      {noResults ? (
        <div className="p-16 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">{lang === 'fr' ? "Aucun terme ne correspond à votre recherche." : "No term matches your search."}</p>
        </div>
      ) : (
        filteredCategories.map((cat, cIdx) => (
          <div key={cIdx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
              <cat.icon className="w-5 h-5 mr-2.5 text-teal-700" />
              {cat.category[lang]}
              <span className="ml-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{cat.terms.length}</span>
            </h3>
            <div className="space-y-4">
              {cat.terms.map((t, tIdx) => (
                <div key={tIdx} className="p-4 border border-slate-200 bg-slate-50">
                  <h4 className="font-serif font-bold text-slate-900 text-[15px] mb-2">{lang === 'fr' ? t.term : t.en_term}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed text-justify">{lang === 'fr' ? t.fr : t.en}</p>

                  {/* Ce que le choix du mot produit : la definition n'est pas descriptive,
                      elle ouvre ou ferme des droits. */}
                  {t.stakes && (
                    <div className="mt-3 pl-3 py-1" style={{ borderLeft: '2px solid var(--accent)' }}>
                      <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-deep)' }}>
                        {lang === 'fr' ? "Ce que la définition change" : "What the definition changes"}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{t.stakes[lang]}</p>
                    </div>
                  )}

                  {t.source && (
                    <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--rule)' }}>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mr-1.5">
                        {lang === 'fr' ? "Source" : "Source"}
                      </span>
                      {t.source.url ? (
                        <a href={t.source.url} target="_blank" rel="noopener noreferrer"
                           className="text-[11px] hover:underline inline-flex items-center gap-1" style={{ color: 'var(--accent-2)' }}>
                          {t.source[lang]} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">{t.source[lang]}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ----------------------------------------------------------------------------
// Méthodologie : conventions, chaîne de traitement et limites déclarées.
// Décrit ce que la plateforme fait réellement — pas de pipeline automatisé fictif.
// ----------------------------------------------------------------------------
const methodPipeline = [
  {
    icon: Search,
    title: { fr: "1. Identification de la source", en: "1. Source identification" },
    body: {
      fr: "Chaque indicateur est rattaché à une institution productrice identifiée (UN DESA, HCR, IDMC, OIT, Banque mondiale, BAD, CUA, OIM). Aucune donnée n'est retenue sans producteur nommé et série publiquement consultable.",
      en: "Each indicator is tied to an identified producing institution (UN DESA, UNHCR, IDMC, ILO, World Bank, AfDB, AUC, IOM). No figure is retained without a named producer and a publicly consultable series."
    }
  },
  {
    icon: Database,
    title: { fr: "2. Harmonisation", en: "2. Harmonisation" },
    body: {
      fr: "Les séries sont ramenées à un périmètre commun de 54 pays et au découpage régional de l'Union africaine. Les millésimes hétérogènes sont conservés tels quels et datés champ par champ, plutôt que ré-estimés pour produire une fausse homogénéité.",
      en: "Series are brought onto a common 54-country perimeter and the African Union's regional breakdown. Heterogeneous vintages are kept as-is and dated field by field, rather than re-estimated to manufacture false homogeneity."
    }
  },
  {
    icon: Scale,
    title: { fr: "3. Arbitrage définitionnel", en: "3. Definitional arbitration" },
    body: {
      fr: "Lorsqu'une notion possède à la fois une définition onusienne et une définition africaine, c'est la définition de l'Union africaine qui est retenue comme référence, la définition onusienne n'étant citée que comme point de comparaison.",
      en: "Where a concept has both a UN and an African definition, the African Union definition is retained as the reference, with the UN definition cited only as a comparison point."
    }
  },
  {
    icon: CheckCircle2,
    title: { fr: "4. Vérification et datation", en: "4. Verification and dating" },
    body: {
      fr: "Les chiffres de ratification, d'adhésion ou de composition sont vérifiés sur les portails officiels avant publication. Lorsqu'un chiffre exact n'est pas vérifiable, la plateforme affiche une valeur datée assortie d'une réserve explicite plutôt qu'une estimation lissée.",
      en: "Ratification, accession, and membership figures are checked against official portals before publication. Where an exact figure cannot be verified, the platform shows a dated value with an explicit caveat rather than a smoothed estimate."
    }
  },
  {
    icon: Download,
    title: { fr: "5. Restitution traçable", en: "5. Traceable output" },
    body: {
      fr: "Chaque jeu de données affiché est exportable (CSV) et chaque export PDF embarque la source, l'adresse de la plateforme et la référence de citation, afin qu'un document sorti de son contexte reste attribuable.",
      en: "Every displayed dataset is exportable (CSV) and every PDF export embeds the source, the platform address, and the citation reference, so a document taken out of context remains attributable."
    }
  },
];

const methodConventions = [
  {
    label: { fr: "Périmètre géographique", en: "Geographic perimeter" },
    value: { fr: "54 pays", en: "54 countries" },
    detail: {
      fr: "Le Sahara occidental n'est pas traité comme une entité distincte : il est intégré au Maroc, y compris dans les cartes. Ce choix est constant sur l'ensemble de la plateforme.",
      en: "Western Sahara is not treated as a separate entity: it is integrated into Morocco, including on maps. This choice is applied consistently across the platform."
    }
  },
  {
    label: { fr: "Découpage régional", en: "Regional breakdown" },
    value: { fr: "5 régions de l'UA", en: "5 AU regions" },
    detail: {
      fr: "La plateforme suit le découpage officiel de l'Union africaine, et non la nomenclature M49 des Nations unies : la Mauritanie est rattachée au Nord, le Burundi et le Rwanda au Centre, le Malawi, le Mozambique, la Zambie et le Zimbabwe au Sud.",
      en: "The platform follows the African Union's official breakdown rather than the UN M49 nomenclature: Mauritania is attached to the North, Burundi and Rwanda to Central, and Malawi, Mozambique, Zambia, and Zimbabwe to the South."
    }
  },
  {
    label: { fr: "Appartenance aux CER", en: "REC membership" },
    value: { fr: "Multiple assumée", en: "Multiple by design" },
    detail: {
      fr: "L'appartenance simultanée à plusieurs CER est la règle et non l'exception : elle est représentée telle quelle. Les retraits récents ou en cours sont signalés et datés plutôt que silencieusement appliqués.",
      en: "Simultaneous membership in several RECs is the rule, not the exception: it is represented as such. Recent or ongoing withdrawals are flagged and dated rather than silently applied."
    }
  },
  {
    label: { fr: "Échelles de l'indice AVOI", en: "AVOI index scales" },
    value: { fr: "0-100 / 0-1", en: "0-100 / 0-1" },
    detail: {
      fr: "Il s'agit du même indice d'ouverture des visas (BAD/CUA), stocké à l'échelle 0-100 au niveau des pays et 0-1 au niveau des CER. Les deux échelles ne sont jamais comparées directement dans un même graphique.",
      en: "This is the same visa openness index (AfDB/AUC), stored on a 0-100 scale at country level and 0-1 at REC level. The two scales are never compared directly within a single chart."
    }
  },
  {
    label: { fr: "Priorité définitionnelle", en: "Definitional priority" },
    value: { fr: "Instrument africain", en: "African instrument" },
    detail: {
      fr: "Pour toute notion juridique disposant à la fois d'une définition onusienne et d'une définition africaine, c'est la seconde qui fait référence : réfugié selon la Convention de l'OUA (1969), personne déplacée interne selon la Convention de Kampala (2009). La définition onusienne n'est citée qu'en comparaison. Les agrégats purement statistiques suivent en revanche UN DESA, condition de comparabilité internationale.",
      en: "For any legal concept holding both a UN and an African definition, the latter is the reference: refugee under the OAU Convention (1969), internally displaced person under the Kampala Convention (2009). The UN definition is cited only for comparison. Purely statistical aggregates, by contrast, follow UN DESA — a precondition for international comparability."
    }
  },
  {
    label: { fr: "Millésimes", en: "Vintages" },
    value: { fr: "Datés, non alignés", en: "Dated, not aligned" },
    detail: {
      fr: "Les séries ne partagent pas toutes la même année de référence. Chaque champ concerné porte son année d'observation (transferts de fonds, activité des migrants, ratifications). Aucune interpolation n'est pratiquée pour produire une homogénéité de façade.",
      en: "Series do not all share a reference year. Each affected field carries its own observation year (remittances, migrant activity, ratifications). No interpolation is applied to manufacture surface-level homogeneity."
    }
  },
  {
    label: { fr: "Chiffres non vérifiables", en: "Unverifiable figures" },
    value: { fr: "Datés et réservés", en: "Dated and caveated" },
    detail: {
      fr: "Lorsqu'un décompte exact ne peut être confirmé sur une source officielle, la plateforme affiche la dernière valeur vérifiée avec sa date et une réserve explicite — plutôt qu'une estimation lissée ou un chiffre arrondi sans provenance.",
      en: "When an exact count cannot be confirmed against an official source, the platform shows the last verified value with its date and an explicit caveat — rather than a smoothed estimate or a rounded figure without provenance."
    }
  },
  {
    label: { fr: "Seuil d'entrée en vigueur", en: "Entry-into-force threshold" },
    value: { fr: "15 ratifications", en: "15 ratifications" },
    detail: {
      fr: "Les instruments de l'UA soumis à ratification sont affichés en rouge tant qu'ils n'atteignent pas 15 États parties — seuil standard d'entrée en vigueur pour cette catégorie de protocoles — et en vert au-delà. Le seuil est stocké par instrument, non codé en dur.",
      en: "AU instruments subject to ratification display in red below 15 states parties — the standard entry-into-force threshold for this class of protocol — and green above it. The threshold is stored per instrument, not hard-coded."
    }
  },
  {
    label: { fr: "Dénomination des pays", en: "Country naming" },
    value: { fr: "Variantes réconciliées", en: "Reconciled variants" },
    detail: {
      fr: "Un même État peut porter des libellés différents selon le jeu de données (« RDC » / « R.D. Congo », « Cap-Vert » / « Cabo Verde »). Les deux formes restent affichées telles quelles ; la correspondance est assurée par une table d'alias, sans renommage des sources.",
      en: "A single state may carry different labels depending on the dataset (\"DRC\" / \"D.R. Congo\", \"Cape Verde\" / \"Cabo Verde\"). Both forms remain displayed as-is; matching is handled by an alias table, without renaming the sources."
    }
  },
  {
    label: { fr: "Affirmations évaluées", en: "Assessed claims" },
    value: { fr: "Formulées par l'auteur", en: "Authored in-house" },
    detail: {
      fr: "Les affirmations examinées dans Evidence Check sont rédigées par l'auteur pour illustrer des perceptions courantes ; ce ne sont pas des citations de médias ou d'institutions identifiés. Seules les sections « ce que montrent les données » sont sourcées institutionnellement.",
      en: "The claims examined in Evidence Check are written by the author to illustrate common perceptions; they are not quotations from identified media or institutions. Only the \"what the data shows\" sections carry institutional sourcing."
    }
  },
  {
    label: { fr: "Matrice d'indicateurs", en: "Indicator matrix" },
    value: { fr: "Proposition, non collecte", en: "Proposal, not collection" },
    detail: {
      fr: "Les 12 indicateurs alternatifs présentés plus bas sont une proposition méthodologique issue de la recherche doctorale, adressée aux instituts nationaux de statistique. Ils ne décrivent pas une réalité déjà mesurée à l'échelle continentale.",
      en: "The 12 alternative indicators presented below are a methodological proposal stemming from doctoral research, addressed to national statistical institutes. They do not describe a reality already measured at continental scale."
    }
  },
];

const methodLimits = [
  {
    fr: "Sous-enregistrement structurel : une part importante des mobilités africaines est intra-régionale, terrestre et informelle. Elle échappe largement aux dispositifs statistiques nationaux, qui sont conçus autour des points de passage officiels.",
    en: "Structural under-registration: a large share of African mobility is intra-regional, overland, and informal. It largely escapes national statistical systems, which are built around official crossing points."
  },
  {
    fr: "Millésimes hétérogènes : les séries n'ont pas toutes la même année de référence. Chaque champ concerné porte son année d'observation ; aucune interpolation n'est pratiquée pour aligner artificiellement les dates.",
    en: "Heterogeneous vintages: series do not all share the same reference year. Each affected field carries its own observation year; no interpolation is applied to artificially align dates."
  },
  {
    fr: "Stocks et non flux : la plupart des indicateurs démographiques mesurent un stock de personnes présentes à une date donnée. Ils ne rendent donc pas compte des mobilités circulaires, saisonnières ou temporaires, pourtant centrales sur le continent.",
    en: "Stocks, not flows: most demographic indicators measure a stock of persons present at a given date. They therefore fail to capture circular, seasonal, or temporary mobility, which is nonetheless central on the continent."
  },
  {
    fr: "Droit formel et pratique administrative : la matrice juridique décrit des textes en vigueur, non leur application effective aux guichets. L'écart entre la norme écrite et la pratique n'est pas mesuré ici.",
    en: "Formal law versus administrative practice: the legal matrix describes texts in force, not their effective application at the counter. The gap between written norm and practice is not measured here."
  },
  {
    fr: "Matrice d'indicateurs prospective : les 12 indicateurs alternatifs ci-dessous sont une proposition méthodologique, non un jeu de données déjà collecté à l'échelle continentale.",
    en: "Forward-looking indicator matrix: the 12 alternative indicators below are a methodological proposal, not a dataset already collected at continental scale."
  },
];

const TabMethodology = ({ text, lang, children }) => (
  <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
    <PageHeader
      badge={text.headers.methodology.badge}
      plate={"Pl. X"}
      plain={text.headers.methodology.plain}
      lang={lang}
      title={text.headers.methodology.title}
      highlight={text.headers.methodology.highlight}
      desc={text.headers.methodology.desc}
      icon={Database}
    />
    {children}

    <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 divide-x divide-y md:divide-y-0 divide-slate-200">
      {[
        { v: indicatorThemes.length, l: lang === 'fr' ? "Axes thématiques" : "Thematic axes" },
        { v: indicatorThemes.reduce((sum, th) => sum + th.items.length, 0), l: lang === 'fr' ? "Indicateurs originaux" : "Original indicators" },
        { v: Object.keys(text.method).filter(k => /^s\d+$/.test(k)).length, l: lang === 'fr' ? "Sources primaires" : "Primary sources" },
        { v: Object.values(countryData).flat().length, l: lang === 'fr' ? "Pays couverts (UA)" : "Countries covered (AU)" },
      ].map((k, i) => (
        <div key={i} className="px-5 py-6">
          <div className="text-3xl font-serif font-bold text-slate-900 tabular-nums leading-none">{k.v}</div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-2.5 block">{k.l}</span>
        </div>
      ))}
    </div>

    {/* Chaîne de traitement */}
    <Reveal className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
      <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-2">
        {lang === 'fr' ? "De la source à la page" : "From source to page"}
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed max-w-3xl mb-8">
        {lang === 'fr'
          ? "La plateforme ne produit pas de données primaires : elle consolide des séries publiques et en documente le traitement. Voici les cinq étapes appliquées à chaque indicateur."
          : "The platform does not produce primary data: it consolidates public series and documents how they are handled. These are the five steps applied to every indicator."}
      </p>
      <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {methodPipeline.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={i} className="relative bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-teal-300 hover:bg-white transition-colors group">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 mb-3 group-hover:border-teal-300 transition-colors">
                <Icon className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5 leading-snug">{step.title[lang]}</h3>
              <p className="text-[11px] text-slate-600 leading-relaxed">{step.body[lang]}</p>
            </li>
          );
        })}
      </ol>
    </Reveal>

    {/* Conventions déclarées */}
    <Reveal delay={40} className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
      <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-2">
        {lang === 'fr' ? "Conventions déclarées" : "Declared conventions"}
      </h2>
      <p className="text-sm text-slate-500 leading-relaxed max-w-3xl mb-8">
        {lang === 'fr'
          ? `Les ${methodConventions.length} choix structurants ci-dessous conditionnent la lecture de l'ensemble des chiffres présentés sur la plateforme. Ils sont explicités pour être discutables — et reproductibles.`
          : `The ${methodConventions.length} structuring choices below condition how every figure on the platform should be read. They are spelled out so they can be contested — and reproduced.`}
      </p>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {methodConventions.map((c, i) => (
          <div key={i} className="border-l-2 border-teal-200 pl-4">
            <dt className="flex flex-wrap items-baseline gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{c.label[lang]}</span>
              <span className="text-sm font-serif font-bold text-teal-800">{c.value[lang]}</span>
            </dt>
            <dd className="text-xs text-slate-600 leading-relaxed text-justify">{c.detail[lang]}</dd>
          </div>
        ))}
      </dl>
    </Reveal>

    {/* Limites */}
    <Reveal delay={40} className="bg-slate-900 rounded-xl p-8 md:p-10 border border-slate-800 shadow-sm text-white">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <h2 className="text-xl md:text-2xl font-serif font-bold">
          {lang === 'fr' ? "Ce que ces données ne disent pas" : "What this data does not say"}
        </h2>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed max-w-3xl mb-8">
        {lang === 'fr'
          ? "Énoncer les limites d'un jeu de données fait partie du jeu de données. Les cinq réserves suivantes s'appliquent à l'ensemble de la plateforme."
          : "Stating a dataset's limits is part of the dataset. The following five caveats apply across the whole platform."}
      </p>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {methodLimits.map((l, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
            <p className="text-xs text-slate-300 leading-relaxed text-justify">{l[lang]}</p>
          </li>
        ))}
      </ul>
    </Reveal>


    <section className="bg-white rounded-xl p-8 md:p-10 border shadow-sm relative border-slate-200">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-serif font-bold text-slate-900 flex items-center"><Database className="w-5 h-5 mr-2.5 text-blue-700" /> {text.sections.method_title}</h2></div>
      <p className="text-slate-700 text-sm leading-relaxed mb-2">{text.method.summary}</p>
      <div className="mt-6 pt-6 border-t border-slate-100">
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {['m1', 'm2', 'm3', 'm4', 'm5', 'm6'].filter(k => text.method[k]).map((k, i) => {
            // Le nombre de references est substitue au rendu : il suit la
            // Bibliotheque au lieu d'etre fige dans le texte.
            const raw = text.method[k].replace(
              '{libraryCount}',
              libraryData.reduce((n, sec) => n + sec.items.length, 0)
            );
            const split = raw.indexOf('.');
            const head = split > 0 ? raw.slice(0, split + 1) : '';
            const body = split > 0 ? raw.slice(split + 1).trim() : raw;
            return (
              <li key={k} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-md bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center mt-0.5 tabular-nums">
                  {i + 1}
                </span>
                <p className="text-slate-600 text-sm leading-relaxed text-justify">
                  <strong className="text-slate-900">{head}</strong> {body}
                </p>
              </li>
            );
          })}
        </ol>
      </div>
        
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{text.method.sources_title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://au.int/en/documents/20211118/report-labour-migration-statistics-africa-third-edition-2019" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s1}</span>
          </a>
          <a href="https://www.un.org/development/desa/pd/data/international-migrant-stock" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Database className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s2}</span>
          </a>
          <a href="https://www.unhcr.org/refugee-statistics/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s3}</span>
          </a>
          <a href="https://www.internal-displacement.org/database/displacement-data/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s4}</span>
          </a>
          <a href="https://www.iom.int/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s5}</span>
          </a>
          <a href="https://normlex.ilo.org/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Scale className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s6}</span>
          </a>
          <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Landmark className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s7}</span>
          </a>
          <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s8}</span>
          </a>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center">
          <MapIcon className="w-3.5 h-3.5 mr-1.5" />
          {lang === 'fr' ? "Régionalisation : Union africaine (et non M49/ONU)" : "Regionalization: African Union (not UN M49)"}
        </h4>
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-700 leading-relaxed">
            {lang === 'fr'
              ? "Les sous-régions affichées dans l'Explorateur et dans la matrice « Entrées & Séjours » suivent le découpage officiel en cinq régions de l'Union africaine — et non le découpage M49 des Nations Unies qu'utilise UNDESA pour publier ses propres tableaux de stocks migratoires. Les deux grilles divergent sur sept pays. La Mauritanie est en Afrique du Nord pour l'UA, en Afrique de l'Ouest pour l'ONU. Le Burundi et le Rwanda passent d'Afrique centrale à Afrique de l'Est. Le Malawi, le Mozambique, la Zambie et le Zimbabwe, d'Afrique australe à Afrique de l'Est. Les sous-totaux par région affichés ici ne coïncideront donc pas exactement avec les tableaux régionaux publiés directement par UNDESA pour ces pays. Ce choix aligne le site sur le cadrage institutionnel de l'Union africaine utilisé par ailleurs dans la section Gouvernance."
              : "The sub-regions shown in the Explorer and in the \"Entry & Residence\" matrix follow the African Union's official five-region breakdown — not the UN M49 classification UNDESA uses to publish its own migrant stock tables. The two groupings diverge on seven countries. Mauritania sits in North Africa under the AU, in West Africa under the UN. Burundi and Rwanda move from Central to East Africa. Malawi, Mozambique, Zambia and Zimbabwe, from Southern to East Africa. As a result, the regional subtotals shown here will not exactly match UNDESA's own published regional tables for these countries. This choice aligns the site with the African Union institutional framing used elsewhere in the Governance section."}
          </p>
        </div>
      </div>
    </section>
  </div>
);

// Publications et interventions médiatiques de l'auteur (source : CV, août 2026).
const authorPublications = [
  {
    ref: "Ben Mokhtar, Y. « Dynamiques migratoires africaines : enjeux, défis et perspectives de gouvernance ». Afrique(s) en mouvement 6, no 2 (2023) : 104-107.",
    kind: { fr: "Article de revue à comité de lecture", en: "Peer-reviewed journal article" },
    year: 2023,
    url: "https://doi.org/10.3917/aem.006.0104"
  },
  {
    ref: "Ben Mokhtar, Y. « Post-August 2022 shifts: Examining the evolution of governance for the Moroccans of the world ». In Transformation Issues in Current Arab Societies, dir. M. Younes et F. Bendridi, 29-72. AlphaDoc, 2025.",
    kind: { fr: "Chapitre d'ouvrage à comité de lecture", en: "Peer-reviewed book chapter" },
    year: 2025,
    url: null
  },
  {
    ref: "Ben Mokhtar, Y. « Un “modèle” africain ? Gouverner les mobilités en Afrique, entre ambitions continentales et prises administratives ». In ouvrage collectif dir. Chadia Arab et Leila Bouasria. En Toutes Lettres, 2026.",
    kind: { fr: "Chapitre d'ouvrage à comité de lecture", en: "Peer-reviewed book chapter" },
    year: 2026,
    url: null
  },
  {
    ref: "Ben Mokhtar, Y. « Promises on Paper, Precarity in Practice: (Un)governing Undocumented Migrant Workers in Africa ». In Making Human Rights a Reality for Undocumented and Precarious Migrant Workers, dir. J. Dez et Y. Arbaoui. Amsterdam University Press, à paraître 2026.",
    kind: { fr: "Chapitre d'ouvrage à comité de lecture (à paraître)", en: "Peer-reviewed book chapter (forthcoming)" },
    year: 2026,
    url: null
  },
  {
    ref: "El Asri, F., S. Jorio, Y. Ben Mokhtar et al. Ethnographic Study on the Return of Moroccan Global Talents. CCME / UIR, à paraître 2026.",
    kind: { fr: "Étude collective (à paraître)", en: "Collaborative study (forthcoming)" },
    year: 2026,
    url: null
  },
];

const authorMedia = [
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2026,
    title: { fr: "L'Espagne à contre-courant de la politique migratoire de l'UE", en: "Spain against the grain of EU migration policy" },
    date: { fr: "31 janv. 2026", en: "31 Jan. 2026" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2025,
    title: { fr: "Migration dans le monde en 2025 et politique du Maroc", en: "Global migration in 2025 and Morocco's policy" },
    date: { fr: "30 déc. 2025", en: "30 Dec. 2025" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2025,
    title: { fr: "Vers une migration sélective en Europe ?", en: "Towards selective migration in Europe?" },
    date: { fr: "22 nov. 2025", en: "22 Nov. 2025" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2025,
    title: { fr: "Le Maroc, premier contributeur au Fonds de résilience pour la migration de l'ONU", en: "Morocco, lead contributor to the UN migration resilience fund" },
    date: { fr: "2 août 2025", en: "2 Aug. 2025" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2025,
    title: { fr: "La gouvernance humanisée des frontières", en: "Humanised border governance" },
    date: { fr: "31 janv. 2025", en: "31 Jan. 2025" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1 Podcast — Destination Afrique", kind: 'podcast', year: 2025,
    title: { fr: "Retour de Donald Trump : quel impact pour le Maroc et l'Afrique ?", en: "Trump's return: what impact for Morocco and Africa?" },
    date: { fr: "24 janv. 2025", en: "24 Jan. 2025" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2025,
    title: { fr: "USA : le bilan des politiques migratoires de Trump", en: "USA: assessing Trump's migration policies" },
    date: { fr: "20 janv. 2025", en: "20 Jan. 2025" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2024,
    title: { fr: "Journée internationale des migrants : état des lieux", en: "International Migrants Day: state of play" },
    date: { fr: "18 déc. 2024", en: "18 Dec. 2024" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2024,
    title: { fr: "Lutte contre les migrations clandestines : la visite de Sánchez en Afrique", en: "Countering irregular migration: Sánchez's Africa visit" },
    date: { fr: "27 août 2024", en: "27 Aug. 2024" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
  {
    outlet: "TelQuel", kind: 'press', year: 2023,
    title: { fr: "« Il ne s'agit pas d'un retour des MRE à proprement parler, plutôt d'un véritable départ vers l'étranger »", en: "\"This is not really a return of Moroccans abroad, but rather a genuine departure overseas\"" },
    date: { fr: "22 déc. 2023", en: "22 Dec. 2023" },
    role: { fr: "Entretien de presse", en: "Press interview" },
    url: "https://telquel.ma/2023/12/22/yassine-ben-mokhtar-il-ne-sagit-pas-dun-retour-des-mre-a-proprement-parler-plutot-dun-veritable-depart-vers-letranger_1847681"
  },
  {
    outlet: "Medi1TV Afrique", kind: 'tv', year: 2023,
    title: { fr: "Migrations en Afrique, défis et opportunités", en: "Migration in Africa: challenges and opportunities" },
    date: { fr: "21 déc. 2023", en: "21 Dec. 2023" },
    role: { fr: "Expert invité", en: "Guest expert" }
  },
];

const mediaKindStyle = {
  tv: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 border-rose-200' },
  podcast: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 border-violet-200' },
  press: { dot: 'bg-slate-500', chip: 'bg-slate-100 text-slate-700 border-slate-300' },
};

const TabAbout = ({ text, lang, children }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(text.about.citation_text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie de la citation : ", err);
    }
  };

  return (
    <section className="animate-in fade-in zoom-in-95 duration-500 space-y-6">
      <PageHeader
        badge={text.headers.about.badge}
        plate={"Pl. XI"}
        plain={text.headers.about.plain}
        lang={lang}
        title={text.headers.about.title}
        highlight={text.headers.about.highlight}
        desc={text.headers.about.desc}
        icon={Info}
      />
      {children}
      
      {/* Ouverture editoriale : le bandeau sombre est desormais porte par le masthead,
          ce bloc revient donc au papier et s'ouvre sur une lettrine. */}
      <div className="bg-white border border-slate-200 p-8 md:p-12">
        <span className="block text-[10px] font-semibold uppercase mb-3" style={{ letterSpacing: '.18em', color: 'var(--accent-deep)' }}>
          {text.about.intro_subtitle}
        </span>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 mb-6 max-w-3xl">
          {text.about.intro_title}
        </h2>
        <span className="block h-px w-24 mb-7" style={{ backgroundColor: 'var(--accent)' }} />
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-3xl text-justify">
          <p className="lede">{text.about.intro_p1}</p>
          <p>{text.about.intro_p2}</p>
          <p>{text.about.intro_p3}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-blue-50 rounded-sm"><BookOpen className="w-5 h-5 text-blue-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.research_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <p>{text.about.research_p1}</p>
            <p>{text.about.research_p2}</p>
            <p>{text.about.research_p3}</p>
            <p className="font-medium text-slate-800">{text.about.research_p4}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-emerald-50 rounded-sm"><Database className="w-5 h-5 text-emerald-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.data_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <p>{text.about.data_p1}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
              {text.about.data_list.map((item, idx) => {
                // Sans emblème disponible, on retombe sur l'icône générique : le repli
                // textuel de InstitutionLogo doublonnerait le nom affiché juste à côté.
                const logo = item.logo ? institutionLogos.find(i => i.key === item.logo) : null;
                const logoBox = logo && logo.src && (
                  <span className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center p-1 mr-2.5 shrink-0">
                    <InstitutionLogo name={logo.name} src={logo.src} className="max-h-5 max-w-full" />
                  </span>
                );
                return item.url ? (
                  <a
                    key={idx}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-md bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group shadow-sm"
                  >
                    {logoBox || <ExternalLink className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0 group-hover:text-emerald-700" />}
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-900">{item.name}</span>
                  </a>
                ) : (
                  <div key={idx} className="flex items-center p-3 rounded-md bg-slate-50 border border-slate-100">
                    {logoBox || <CheckCircle2 className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />}
                    <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs italic text-slate-400">
              {lang === 'fr'
                ? "Ces institutions sont citées comme sources de données publiques ouvertes ; leur présence ne constitue ni un partenariat ni un endossement du projet."
                : "These institutions are cited as sources of open public data; their presence does not constitute a partnership or endorsement of the project."}
            </p>

            <p>{text.about.data_p2}</p>
            <p className="italic">{text.about.data_p3}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-amber-50 rounded-sm"><Globe className="w-5 h-5 text-amber-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.south_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <p>{text.about.south_p1}</p>
            <ul className="space-y-2 my-4 bg-slate-50 p-4 rounded-md border border-slate-100">
              {text.about.south_list.map((item, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3"></span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <p>{text.about.south_p2}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-purple-50 rounded-sm"><TrendingUp className="w-5 h-5 text-purple-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.evolution_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <p>{text.about.evolution_p1}</p>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mt-5 mb-2">
              {lang === 'fr' ? "Déjà disponible" : "Already available"}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {text.about.evolution_done.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0 mt-1" />
                  <span className="text-xs">{item}</span>
                </li>
              ))}
            </ul>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-6 mb-2">
              {lang === 'fr' ? "Prochaines étapes" : "Next steps"}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {text.about.evolution_next.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0 mt-1" />
                  <span className="text-xs text-slate-500">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-bold text-slate-800">{text.about.evolution_p2}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10">
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">{text.about.founder_title}</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 text-justify">
            <p>{text.about.founder_p1}</p>
            <p>{text.about.founder_p2}</p>
            <p>{text.about.founder_p3}</p>
            <p className="text-xs italic text-slate-500 border-l-2 border-slate-300 pl-3 mt-4">{text.about.founder_p4}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">{text.about.collab_title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{text.about.collab_p1}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{text.about.contact_p}</p>
            
            <div className="flex flex-col gap-3">
              <a href="mailto:benmokhtary1@gmail.com?subject=South(s)%20Mobility%20DataHub%20-%20Contact" 
                 className="inline-flex items-center space-x-3 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 px-4 py-3 rounded-md transition-colors shadow-sm w-fit">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-bold">benmokhtary1@gmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/yassine-b-m" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center space-x-3 bg-[#0a66c2] hover:bg-[#084e96] text-white px-4 py-3 rounded-md transition-colors shadow-sm w-fit">
                <LinkedInIcon className="w-4 h-4" />
                <span className="text-sm font-bold">Yassine Ben Mokhtar</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
              </a>
            </div>
          </div>

          <div className="bg-amber-50 text-amber-800 text-xs p-4 rounded-md border border-amber-200 leading-relaxed">
            {text.about.disclaimer}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-7">
        <h3 className="flex items-center text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
          <Sparkles className="w-4 h-4 mr-2 text-amber-500" /> {lang === 'fr' ? "Récemment enrichi" : "Recently Enriched"}
        </h3>
        <div className="border border-dashed border-slate-300 rounded-lg py-10 px-6 flex flex-col items-center justify-center text-center bg-slate-50/50">
          <Clock className="w-5 h-5 text-slate-300 mb-3" />
          <p className="text-sm font-serif font-bold text-slate-500">{lang === 'fr' ? "À venir" : "Coming soon"}</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed">
            {lang === 'fr'
              ? "Cet espace signalera les enrichissements récents de la plateforme au fil de leur publication."
              : "This space will flag the platform's recent additions as they are published."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Publications */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 text-white shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-serif font-bold text-slate-900">{lang === 'fr' ? "Publications" : "Publications"}</h2>
              <a href="https://shs.cairn.info/publications-de-yassine-ben-mokhtar--773358?lang=fr" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 hover:underline mt-0.5">
                {lang === 'fr' ? "Profil Cairn.info" : "Cairn.info profile"} <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 tabular-nums shrink-0">
              {authorPublications.length}
            </span>
          </div>
          <ol className="divide-y divide-slate-100">
            {[...authorPublications].sort((a, b) => b.year - a.year).map((pub, idx) => (
              <li key={idx} className="group flex gap-4 px-7 py-4 hover:bg-slate-50/70 transition-colors">
                <span className="shrink-0 w-10 pt-0.5 font-serif font-bold text-slate-300 text-sm tabular-nums group-hover:text-blue-500 transition-colors">
                  {pub.year}
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 leading-relaxed">{pub.ref}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{pub.kind[lang]}</span>
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer"
                         className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 hover:underline">
                        DOI <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Interventions médiatiques */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-7 py-5 border-b border-slate-100">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-rose-600 text-white shrink-0">
              <Mic className="w-4 h-4" />
            </span>
            <h2 className="text-lg font-serif font-bold text-slate-900 flex-1">{lang === 'fr' ? "Interventions médiatiques" : "Media Appearances"}</h2>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1 tabular-nums">
              {authorMedia.length}
            </span>
          </div>
          <div className="px-7 py-5">
            {[...new Set(authorMedia.map(m => m.year))].map((yr) => (
              <div key={yr} className="mb-5 last:mb-0">
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="font-serif font-bold text-slate-800 text-sm tabular-nums">{yr}</span>
                  <span className="h-px flex-1 bg-slate-100"></span>
                </div>
                <ul className="relative pl-4 border-l border-slate-200 space-y-3">
                  {authorMedia.filter(m => m.year === yr).map((m, idx) => {
                    const st = mediaKindStyle[m.kind] || mediaKindStyle.press;
                    return (
                      <li key={idx} className="relative group">
                        <span className={`absolute -left-[1.3rem] top-1.5 w-2 h-2 rounded-full ring-2 ring-white transition-transform group-hover:scale-150 ${st.dot}`}></span>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <span className={`text-[9px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded-sm ${st.chip}`}>{m.outlet}</span>
                          <span className="text-[10px] font-bold text-slate-400 tabular-nums">{m.date[lang]}</span>
                        </div>
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer"
                             className="text-xs text-slate-700 leading-relaxed italic hover:text-rose-800 hover:underline inline-flex items-start gap-1">
                            {m.title[lang]} <ExternalLink className="w-2.5 h-2.5 shrink-0 mt-1" />
                          </a>
                        ) : (
                          <p className="text-xs text-slate-700 leading-relaxed italic group-hover:text-slate-900 transition-colors">{m.title[lang]}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center space-x-2">
            <Quote className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-700">{text.about.citation_title}</h4>
          </div>
          
          <button 
            onClick={handleCopyCitation}
            className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-sm text-xs font-bold transition-all border shadow-sm w-full sm:w-auto
            ${isCopied ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? (lang === 'fr' ? 'Copié !' : 'Copied!') : (lang === 'fr' ? 'Copier' : 'Copy')}</span>
          </button>
        </div>
        <p className="text-sm text-slate-600 font-serif italic border-l-2 border-blue-500 pl-4 leading-relaxed">
          {text.about.citation_text}
        </p>
      </div>
    </section>
  );
};

// ============================================================================
// 4. COMPOSANT PRINCIPAL (App)
// ============================================================================

// ---------------------------------------------------------------------------
// Adressage
// ---------------------------------------------------------------------------
// La plateforme vivait entierement sur une seule URL : impossible de partager
// une fiche pays, de citer une affirmation, d'utiliser precedent/suivant, ou
// d'etre trouve autrement que par l'accueil. Pour un travail dont l'objet est
// la preuve citable, c'etait un manque de fond.
//
// Pas de bibliotheque de routage : l'API History suffit pour un plan a deux
// niveaux, et une dependance de plus n'apporterait rien ici. Les segments sont
// traduits — une URL francaise se lit en francais, ce qui compte autant pour la
// clarte que pour le referencement.
const ROUTES = {
  home:       { fr: 'accueil',      en: 'home' },
  evidence:   { fr: 'verification', en: 'evidence' },
  explorer:   { fr: 'pays',         en: 'countries' },
  forced:     { fr: 'deplacement',  en: 'displacement' },
  labour:     { fr: 'travail',      en: 'labour' },
  governance: { fr: 'gouvernance',  en: 'governance' },
  data:       { fr: 'donnees',      en: 'data' },
  resources:  { fr: 'ressources',   en: 'resources' },
  about:      { fr: 'methodologie', en: 'methodology' },
};

const slugPays = (nom) => String(nom || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // on retire les diacritiques
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// URL -> etat. Tolerante : un segment inconnu ramene a l'accueil plutot que
// d'afficher une page vide.
const lireURL = () => {
  const bouts = window.location.pathname.split('/').filter(Boolean);
  const lang = bouts[0] === 'en' ? 'en' : 'fr';
  const seg = bouts[1];
  let tab = 'home';
  if (seg) {
    const trouve = Object.entries(ROUTES).find(([, s]) => s.fr === seg || s.en === seg);
    if (trouve) tab = trouve[0];
  }
  return { lang, tab, detail: bouts[2] ? decodeURIComponent(bouts[2]) : null };
};

const ecrireURL = ({ lang, tab, detail }, remplacer = false) => {
  const seg = ROUTES[tab]?.[lang] || ROUTES.home[lang];
  const chemin = `/${lang}/${seg}${detail ? `/${detail}` : ''}`;
  if (chemin === window.location.pathname) return;
  window.history[remplacer ? 'replaceState' : 'pushState']({ lang, tab, detail }, '', chemin);
};

export default function App() {
  const depart = useRef(lireURL()).current;
  const [lang, setLang] = useState(depart.lang);
  const [activeTab, setActiveTab] = useState(depart.tab);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [activeSubRegion, setActiveSubRegion] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('perspective');
  const [explorerView, setExplorerView] = useState('map');          // 'map' | 'list'
  const [mapIndicatorKey, setMapIndicatorKey] = useState('evolution');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState('demography'); 
  const [expandedIndicator, setExpandedIndicator] = useState(null);
  const [activeSdgzTab, setActiveSdgzTab] = useState('sdgs');
  const [activeAboutTab, setActiveAboutTab] = useState('methodology');
  const [activeResourceTab, setActiveResourceTab] = useState('library');

  useEffect(() => { setIsLoaded(true); }, []);

  // --- Adressage : l'etat ecrit l'URL, l'URL relit l'etat -------------------
  // Le pays selectionne fait partie de l'adresse : c'est lui qu'on partage ou
  // qu'on cite. Les autres reglages (vue carte/liste, indicateur) restent hors
  // URL — ce sont des preferences d'affichage, pas des objets a citer.
  // Le repere suit la langue de l'adresse : une URL anglaise dit « chad », pas
  // « tchad ». A la relecture on accepte les deux, pour qu'un lien deja partage
  // continue de fonctionner apres un changement de langue.
  const paysSlug = useMemo(() => {
    if (activeTab !== 'explorer' || activeSubTab === 'perspective') return null;
    const c = Object.values(countryData).flat().find(x => x.id === activeSubTab);
    return c ? slugPays(c.name?.[lang] || c.name?.fr || c.name) : null;
  }, [activeTab, activeSubTab, lang]);

  const paysParSlug = (s) => Object.values(countryData).flat().find(x =>
    slugPays(x.name?.fr || x.name) === s || slugPays(x.name?.en || x.name) === s);

  useEffect(() => {
    ecrireURL({ lang, tab: activeTab, detail: paysSlug });
  }, [lang, activeTab, paysSlug]);

  // Precedent / suivant du navigateur.
  useEffect(() => {
    const surRetour = () => {
      const e = lireURL();
      setLang(e.lang);
      setActiveTab(e.tab);
      if (e.tab === 'explorer') {
        if (e.detail) {
          const c = paysParSlug(e.detail);
          setActiveSubTab(c ? c.id : 'perspective');
        } else setActiveSubTab('perspective');
      }
    };
    window.addEventListener('popstate', surRetour);
    return () => window.removeEventListener('popstate', surRetour);
  }, []);

  // Arrivee par lien profond : on retablit le pays demande.
  useEffect(() => {
    if (depart.tab === 'explorer' && depart.detail) {
      const c = paysParSlug(depart.detail);
      if (c) setActiveSubTab(c.id);
    }
    ecrireURL({ lang: depart.lang, tab: depart.tab, detail: depart.detail }, true);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const text = t[lang];

  const currentCountries = useMemo(() => {
    if (activeSubRegion === 'all') return Object.values(countryData).flat();
    return countryData[activeSubRegion] || [];
  }, [activeSubRegion]);

  const filteredCountries = useMemo(() => {
    return currentCountries.filter(c => {
      const cName = c.name?.[lang] || c.name?.fr || 'Unknown';
      return cName.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => (a.name[lang] || a.name.fr).localeCompare(b.name[lang] || b.name.fr));
  }, [currentCountries, searchTerm, lang]);

  const regionAggregate = useMemo(() => computeRegionAggregate(currentCountries), [currentCountries]);

  const display = useMemo(() => {
    const country = currentCountries.find(c => c.id === activeSubTab);
    
    if (country && activeSubTab !== 'perspective') {
      return {
        name: country.name?.[lang] || country.name?.fr || 'Unknown', flag: country.flag, iso2: country.iso2, flagIcon: null, flagColor: null, stock: country.stock, female: country.female, evolution: country.evolution,
        retention: country.retention ?? 50,
        remittances: country.remittances ?? null, remittances_year: country.remittances_year ?? null,
        labour_participation: country.labour_participation ?? null, labour_participation_year: country.labour_participation_year ?? null,
        aid: country.aid ?? 0, history: country.history || [],
        evo_desc: country.evo_desc?.[lang] || country.evo_desc?.fr || "", origDest: country.origDest?.[lang] || country.origDest?.fr || "", trigger: country.trigger?.[lang] || country.trigger?.fr || "", response: country.response?.[lang] || country.response?.fr || "", impact: country.impact?.[lang] || country.impact?.fr || "",
        idp_conflict: country.idp_conflict || 0, idp_disaster: country.idp_disaster || 0, refugees_hosted: country.refugees_hosted || 0, avoi: country.avoi || null,
        normlex: country.normlex || null,
        au_treaties: country.au_treaties || null,
        isRegion: false
      };
    }

    const fallbackKey = activeSubRegion === 'all' ? 'africa_perspective' : `${activeSubRegion}_perspective`;
    const fallback = aggregates[fallbackKey] || aggregates['africa_perspective'];
    const agg = regionAggregate;

    return {
      name: typeof fallback.name === 'object' ? (fallback.name?.[lang] || fallback.name?.fr || 'Unknown') : String(fallback.name || 'Unknown'),
      flag: null,
      iso2: null,
      flagIcon: fallback.flagIcon,
      flagColor: fallback.flagColor,
      stock: formatNumber(Math.round(agg.stock), lang),
      female: agg.female ?? fallback.female,
      evolution: fallback.evolution,
      retention: agg.retention ?? (fallback.retention || 50),
      remittances: agg.remittances,
      remittances_year: agg.remittancesYearLabel,
      labour_participation: agg.labourParticipation,
      labour_participation_year: null,
      aid: agg.aid ?? (fallback.aid || 0),
      history: fallback.history, distribution: fallback.distribution || null,
      evo_desc: typeof fallback.evo_desc === 'object' ? (fallback.evo_desc?.[lang] || fallback.evo_desc?.fr || "") : (fallback.evo_desc || ""),
      origDest: typeof fallback.origDest === 'object' ? (fallback.origDest?.[lang] || fallback.origDest?.fr || "") : (fallback.origDest || ""),
      trigger: typeof fallback.trigger === 'object' ? (fallback.trigger?.[lang] || fallback.trigger?.fr || "") : (fallback.trigger || ""),
      response: typeof fallback.response === 'object' ? (fallback.response?.[lang] || fallback.response?.fr || "") : (fallback.response || ""),
      impact: typeof fallback.impact === 'object' ? (fallback.impact?.[lang] || fallback.impact?.fr || "") : (fallback.impact || ""),
      idp_conflict: 0, idp_disaster: 0, refugees_hosted: 0, avoi: null, normlex: null, au_treaties: null,
      isRegion: true,
      countryCount: agg.countryCount
    };
  }, [activeSubTab, activeSubRegion, lang, currentCountries, regionAggregate]);

  // Titre et description suivent l'adresse : c'est ce qui apparait dans un
  // resultat de recherche, un signet ou un partage. Le titre ne nommait le pays
  // que dans l'Explorateur ; ailleurs, huit pages portaient le meme.
  useEffect(() => {
    // On n'utilise pas `navigation` ici : il est declare plus bas, et la liste
    // de dependances est evaluee au rendu — la reference leverait une erreur.
    const NOMS = {
      home: { fr: 'Accueil', en: 'Home' },
      evidence: { fr: 'Évaluation des affirmations', en: 'Evidence Check' },
      explorer: { fr: 'Explorateur', en: 'Data Explorer' },
      forced: { fr: 'Mobilités contraintes', en: 'Forced mobility' },
      labour: { fr: 'Migration de travail', en: 'Labour migration' },
      governance: { fr: 'Gouvernance', en: 'Governance' },
      data: { fr: 'Données & statistiques', en: 'Data & Statistics' },
      resources: { fr: 'Ressources', en: 'Resources' },
      about: { fr: 'Méthodologie & à propos', en: 'Methodology & About' },
    };
    const nomSection = NOMS[activeTab]?.[lang];
    const partie = activeTab === 'explorer' && activeSubTab !== 'perspective'
      ? display.name
      : nomSection;
    document.title = partie ? `${partie} | South(s) Mobility DataHub` : 'South(s) Mobility DataHub';
    document.documentElement.lang = lang;

    const desc = activeTab === 'explorer' && activeSubTab !== 'perspective'
      ? (lang === 'fr'
          ? `${display.name} : migrants présents, départs, ouverture des visas et traités ratifiés. Données vérifiées et sourcées.`
          : `${display.name}: resident migrants, departures, visa openness and ratified treaties. Verified, sourced data.`)
      : (text.headers[activeTab]?.plain
         || (lang === 'fr'
             ? "Données vérifiées et en accès libre sur les mobilités africaines."
             : 'Verified, openly accessible data on African mobility.'));
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    m.content = String(desc).slice(0, 300);
  }, [display, lang, activeTab, activeSubTab, text]);

  const exportIndicatorsCSV = () => {
    let csvContent = "ID,Theme(FR),Theme(EN),Indicator(FR),Indicator(EN),Description(FR),Description(EN)\n";
    indicatorThemes.forEach(thm => thm.items.forEach(i => {
      csvContent += `${i.id},"${thm.theme_fr}","${thm.theme_en}","${(i.fr||'').replace(/"/g, '""')}","${(i.en||'').replace(/"/g, '""')}","${(i.desc_fr||"").replace(/"/g, '""')}","${(i.desc_en||"").replace(/"/g, '""')}"\n`;
    }));
    downloadCSV("souths_indicators_registry.csv", csvContent);
  };

  const exportCountryProfileCSV = () => {
    const remitValue = display.remittances !== null && display.remittances !== undefined ? `${display.remittances} (${display.remittances_year || 's.d.'})` : 'N/A';
    const labourValue = display.labour_participation !== null && display.labour_participation !== undefined ? `${display.labour_participation} (${display.labour_participation_year || 's.d.'})` : 'N/A';
    const csvContent = `Metric,Value\nProfile,"${display.name}"\nStock,"${display.stock}"\nFemale Share %,"${display.female}"\nEvolution,"${display.evolution}"\nRemittances % GDP (year),"${remitValue}"\nMigrant Labour Participation % (year),"${labourValue}"\nOrig/Dest,"${display.origDest}"\nTrigger,"${display.trigger}"\nResponse,"${display.response}"\nImpact,"${display.impact}"\nIDP Conflict,"${display.idp_conflict}"\nIDP Disaster,"${display.idp_disaster}"\n`;
    downloadCSV(`Profile_${display.name}.csv`, csvContent);
  };

  // --- Exports CSV de tous les jeux de données affichés ---------------------
  const exportCountriesCSV = () => {
    const rows = Object.entries(countryData).flatMap(([region, list]) => list.map(c => ({
      id: c.id, iso2: c.iso2, country_fr: c.name?.fr, country_en: c.name?.en, au_region: region,
      migrant_stock_2024: c.stock, share_national_pop_pct: c.evolution, female_share_pct: c.female,
      south_south_retention_pct: c.retention, remittances_pct_gdp: c.remittances, remittances_year: c.remittances_year,
      oda_pct_gdp: c.aid, migrant_labour_participation_pct: c.labour_participation, labour_year: c.labour_participation_year,
      idp_conflict: c.idp_conflict, idp_disaster: c.idp_disaster, refugees_hosted: c.refugees_hosted,
      avoi_0_100: c.avoi,
      recs: (countryRecAffiliations[c.iso2] || []).join(' | '),
      visa_open_to_all_africa: visaOpenToAllAfrica[c.iso2]?.tier || '',
      ilo_conventions_total: c.normlex?.total,
      au_treaties_ratified: c.au_treaties ? Object.entries(c.au_treaties).filter(([, v]) => v).map(([k]) => k).join(' | ') : '',
    })));
    downloadCSV('souths_country_indicators.csv', toCSV(rows));
  };

  const exportEvidenceCSV = () => {
    const rows = evidenceCheckData.map(e => ({
      id: e.id, category_fr: e.category?.fr, category_en: e.category?.en,
      confidence: e.confidence_level, verdict_fr: e.verdict?.fr, verdict_en: e.verdict?.en,
      claim_fr: e.narrative?.fr, claim_en: e.narrative?.en,
      reality_fr: e.reality?.fr, reality_en: e.reality?.en,
      sources: (e.sources?.fr || []).join(' | '),
      limits_fr: e.limits?.fr,
    }));
    downloadCSV('souths_evidence_check.csv', toCSV(rows));
  };

  const exportCensusCSV = () => {
    const rows = censusQuestionDepth.map(q => ({
      question_fr: q.label.fr, question_en: q.label.en,
      states_of_47: q.states,
      pct_of_censusing_states: q.pctRound,
      pct_of_54_african_states: q.pct54,
    }));
    downloadCSV('souths_census_question_depth_2010round.csv', toCSV(rows));
  };

  const exportGlossaryCSV = () => {
    const rows = glossaryData.flatMap(cat => cat.terms.map(t => ({
      category_fr: cat.category?.fr, category_en: cat.category?.en,
      term_fr: t.term, term_en: t.en_term,
      definition_fr: t.fr, definition_en: t.en,
      source_fr: t.source?.fr || '', source_en: t.source?.en || '', source_url: t.source?.url || '',
      stakes_fr: t.stakes?.fr || '', stakes_en: t.stakes?.en || '',
    })));
    downloadCSV('souths_glossary.csv', toCSV(rows));
  };

  const exportLibraryCSV = () => {
    const rows = libraryData.flatMap(sec => sec.items.map(i => ({
      section_fr: sec.section?.fr, section_en: sec.section?.en,
      title: i.title, year: i.year,
      type_fr: i.type?.fr, type_en: i.type?.en,
      description_fr: i.desc?.fr, url: i.url || '',
      essential: i.essential ? 'yes' : 'no',
    })));
    downloadCSV('souths_library.csv', toCSV(rows));
  };

  const navigation = [
    { id: 'home', icon: Compass, label: { fr: 'Accueil', en: 'Home' } },
    { id: 'evidence', icon: Globe, label: { fr: 'Evidence Check', en: 'Evidence Check' } },
    { id: 'explorer', icon: MapPin, label: { fr: 'Explorateur', en: 'Data Explorer' } },
    { id: 'forced', icon: ShieldAlert, label: { fr: 'Mobilités contraintes', en: 'Forced mobility' } },
    { id: 'labour', icon: Briefcase, label: { fr: 'Migration de travail', en: 'Labour migration' } },
    { id: 'governance', icon: Landmark, label: { fr: 'Gouvernance', en: 'Governance' } },
    { id: 'data', icon: BarChart3, label: { fr: 'Données & Stats', en: 'Data & Stats' } },
    { id: 'resources', icon: BookOpen, label: { fr: 'Ressources', en: 'Resources' } },
    { id: 'about', icon: Database, label: { fr: 'Méthodologie & À Propos', en: 'Methodology & About' } },
  ];

  // Knowledge Hub : les onglets de lecture (essai éditorial, à propos, bibliothèque) adoptent une
  // colonne plus resserrée qu'un simple dashboard de données ; l'explorateur et la gouvernance,
  // denses en grilles/tableaux, conservent la pleine largeur.
  // Une seule largeur pour tout le site. Trois onglets tenaient dans 1152 px et
  // six dans 1271 px : la page changeait de laize a chaque changement d'onglet,
  // ce qui se voit et desoriente. La mesure du confort de lecture se joue au
  // niveau du paragraphe (voir `.text-justify` et `p` dans theme.css), pas au
  // niveau du conteneur : c'est la que la largeur doit etre bridee.
  const mainMaxWidth = 'max-w-7xl';

  return (
    <div className={`min-h-screen bg-[#f8f9fa] font-sans text-slate-800 text-sm transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} print:bg-white print:text-black`}>
      {/* Lien d'evitement : au clavier, la premiere tabulation saute les neuf
          onglets de navigation et mene directement au contenu. */}
      <a href="#contenu" className="skip-link">
        {lang === 'fr' ? 'Aller au contenu' : 'Skip to content'}
      </a>
      <style type="text/css">
        {`
          /* Les polices et la palette sont definies dans theme.css (DA « atlas editorial »). */
        `}
      </style>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 11mm 12mm 13mm 12mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .print\\:hidden { display: none !important; }
          .break-inside-avoid, .print\\:break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          a { text-decoration: none; }
          h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }

          /* --- Dossier PDF dédié : mise en page propre, indépendante de l'écran --- */
          .pdf-doc { display: block !important; font-size: 8.2pt; line-height: 1.34; color: #0f172a; }
          .pdf-doc .pdf-cols { column-count: 2; column-gap: 6.5mm; }
          .pdf-doc .pdf-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 3.2mm; }
          .pdf-doc h2 { font-size: 8.6pt; letter-spacing: .07em; text-transform: uppercase; margin: 0 0 1.4mm; padding-bottom: .8mm; border-bottom: .4pt solid #cbd5e1; color: #334155; }
          .pdf-doc table { width: 100%; border-collapse: collapse; }
          .pdf-doc td { padding: .7mm 0; vertical-align: top; border-bottom: .3pt dotted #e2e8f0; }
          .pdf-doc td.k { color: #64748b; padding-right: 2mm; }
          .pdf-doc td.v { text-align: right; font-weight: 700; white-space: nowrap; }
          .pdf-doc .kpi { border: .4pt solid #cbd5e1; border-radius: 1.2mm; padding: 1.6mm 1.8mm; }
          .pdf-doc .kpi .lbl { font-size: 5.9pt; letter-spacing: .09em; text-transform: uppercase; color: #64748b; display: block; }
          .pdf-doc .kpi .val { font-size: 12pt; font-weight: 700; font-family: Merriweather, serif; line-height: 1.1; }
          .pdf-doc .chip { display: inline-block; border: .4pt solid #cbd5e1; border-radius: 6pt; padding: .35mm 1.4mm; margin: 0 1mm .8mm 0; font-size: 6.4pt; font-weight: 700; }
        `}
      </style>
      <style>{`
        .flag-emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          font-size: 1.2em;
          display: inline-block;
          vertical-align: middle;
        }
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ::selection {
          background-color: #bfdbfe;
          color: #1e3a8a;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>

      <nav className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-md print:hidden">
        <div className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-14 items-center">
            <div className="flex items-center space-x-3">
              <BrandMark className="h-8 w-8 shrink-0" tone="dark" />
              <span className="text-base font-serif font-bold tracking-tight leading-none">
                <span style={{ color: '#FFFDF9' }}>{text.title}</span>{' '}
                <span className="font-sans font-normal italic text-[13px]" style={{ color: '#93A3CF' }}>{text.subtitle}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* La recherche precede les reglages : c'est l'action, eux sont
                  le confort. Elle mene a une URL reelle, donc partageable. */}
              <RechercheGlobale
                lang={lang}
                aller={(r) => {
                  if (r.lien) { window.open(r.lien, '_blank', 'noopener'); return; }
                  setActiveTab(r.aller.tab);
                  if (r.aller.tab === 'explorer' && r.aller.id) setActiveSubTab(r.aller.id);
                }}
              />
              <PrefsLecture lang={lang} />
              <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
                      aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
                      className="flex items-center space-x-1 text-[10px] font-bold bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700 transition hover:bg-blue-900 hover:text-white hover:border-blue-700">
                <Languages className="h-3 w-3" aria-hidden="true" /> <span>{lang.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto custom-scrollbar">
          <div className="flex space-x-1 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="nav-tab flex items-center px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-t-2"
                  style={navTabStyle(isActive)}
                >
                  <Icon className="w-4 h-4 mr-2" style={{ color: isActive ? '#8FA0CE' : '#7A7167' }} />
                  {item.label[lang]}
                </button>
              );
            })}
          </div>
        </div>
        <ScrollProgress />
      </nav>

      {/* data-section : c'est lui qui redefinit --accent pour toute la section.
          Aucun composant n'a besoin de connaitre la couleur de l'onglet. */}
      <main id="contenu" tabIndex={-1} data-section={activeTab} className={`${mainMaxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-10 ${showModal ? 'print:hidden' : ''}`}>
        {activeTab === 'home' && (
          <TabHome text={text} lang={lang} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'evidence' && (
          <TabEvidenceCheck text={text} lang={lang} exportEvidenceCSV={exportEvidenceCSV} />
        )}
        {activeTab === 'explorer' && (
          <TabExplorer 
            text={text} lang={lang} 
            activeSubRegion={activeSubRegion} setActiveSubRegion={setActiveSubRegion}
            activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filteredCountries={filteredCountries} display={display} setShowModal={setShowModal} exportCountriesCSV={exportCountriesCSV}
            explorerView={explorerView} setExplorerView={setExplorerView} mapIndicatorKey={mapIndicatorKey} setMapIndicatorKey={setMapIndicatorKey}
          />
        )}
        {activeTab === 'forced' && <TabForced text={text} lang={lang} />}
        {activeTab === 'labour' && <TabLabour text={text} lang={lang} />}
        {activeTab === 'governance' && (
          <TabGovernance text={text} lang={lang} activeSdgzTab={activeSdgzTab} setActiveSdgzTab={setActiveSdgzTab} />
        )}
        {activeTab === 'resources' && (
          <div className="space-y-8">
            {(() => {
              const resourceSwitch = (
                <div className="flex bg-slate-200 p-1.5 rounded-xl max-w-lg">
                  <button
                    onClick={() => setActiveResourceTab('library')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeResourceTab === 'library' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Bibliothèque' : 'Library'}
                  </button>
                  <button
                    onClick={() => setActiveResourceTab('glossary')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeResourceTab === 'glossary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Brain className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Glossaire' : 'Glossary'}
                  </button>
                </div>
              );
              return activeResourceTab === 'library'
                ? <TabLibrary text={text} lang={lang} exportLibraryCSV={exportLibraryCSV}>{resourceSwitch}</TabLibrary>
                : <TabGlossary lang={lang} text={text} exportGlossaryCSV={exportGlossaryCSV}>{resourceSwitch}</TabGlossary>;
            })()}
          </div>
        )}
        {activeTab === 'data' && (
          <TabDataStats
            text={text} lang={lang} exportCensusCSV={exportCensusCSV}
            expandedIndicator={expandedIndicator} setExpandedIndicator={setExpandedIndicator}
            exportIndicatorsCSV={exportIndicatorsCSV}
          />
        )}
        {activeTab === 'about' && (
          <div className="space-y-8">
            {(() => {
              const aboutSwitch = (
                <div className="flex bg-slate-200 p-1.5 rounded-xl max-w-lg">
                  <button
                    onClick={() => setActiveAboutTab('methodology')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeAboutTab === 'methodology' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Database className="w-3.5 h-3.5" /> {lang === 'fr' ? 'Méthodologie' : 'Methodology'}
                  </button>
                  <button
                    onClick={() => setActiveAboutTab('about')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeAboutTab === 'about' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Info className="w-3.5 h-3.5" /> {lang === 'fr' ? 'À Propos' : 'About'}
                  </button>
                </div>
              );
              return activeAboutTab === 'about'
                ? <TabAbout text={text} lang={lang}>{aboutSwitch}</TabAbout>
                : <TabMethodology text={text} lang={lang}>{aboutSwitch}</TabMethodology>;
            })()}
          </div>
        )}
        <PrintCitationFooter lang={lang} sectionLabel={navigation.find(i => i.id === activeTab)?.label?.[lang]} />
      </main>

      {/* Dossier PDF dédié : seul élément imprimé quand la fiche pays est ouverte. */}
      {showModal && <PdfCountryDossier display={display} lang={lang} text={text} continentalAvoiAvg={continentalAvoiAvg} />}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          /* .reader : le rapport pays est monte hors de <main>. Sans cette classe,
             il echappe a toute la couche de lisibilite de theme.css (plancher de
             corps, promotion des gris faibles, justification limitee aux paragraphes). */
          className="reader fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-5 bg-[#0f172a]/90 backdrop-blur-sm animate-in fade-in duration-300 print:hidden"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-slate-50 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-700 print:shadow-none print:border-none print:max-h-none print:rounded-none"
          >
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-white print:border-b-2 print:border-slate-900 print:pb-4 gap-5 print:break-inside-avoid">
              <div className="flex items-center space-x-5">
                {display.flagIcon ? (
                  <span className={`border border-slate-200 rounded-sm bg-slate-50 p-2.5 shadow-sm print:border-none ${display.flagColor || 'text-blue-700'}`}>
                    <display.flagIcon className="w-8 h-8 md:w-9 md:h-9" />
                  </span>
                ) : (
                  <CountryFlag iso2={display.iso2} emoji={display.flag} size="lg" className="border border-slate-200 rounded-sm bg-slate-50 p-1 shadow-sm print:border-none" />
                )}
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 uppercase tracking-tight">{display.name}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 border border-slate-200 inline-block px-2 py-0.5 rounded-sm">{display.isRegion ? (text.modal.south_view || "") : text.modal.raw_data_title}</p>
                </div>
              </div>
                
              <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 print:hidden">
                <button onClick={() => setModalView('demography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'demography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.demo}</button>
                <button onClick={() => setModalView('geography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'geography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.geo}</button>
                <button onClick={() => setModalView('economy')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'economy' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.econ}</button>
              </div>
              <button onClick={() => setShowModal(false)} aria-label={lang === 'fr' ? 'Fermer le rapport' : 'Close the report'} className="absolute top-6 right-6 p-2 bg-white hover:bg-slate-50 rounded-sm border border-slate-200 transition-colors print:hidden shadow-sm"><X className="w-4 h-4 text-slate-600" aria-hidden="true" /></button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto space-y-10 print:overflow-visible print:p-0 print:pt-6 bg-slate-50 print:bg-white h-full print:flex print:flex-col print:gap-6 print:space-y-0">
              <div className={`grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 ${modalView === 'demography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:border print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Users className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Le Réel Poids Démographique" : "The Real Demographic Weight"}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "La population migrante comparée à la population totale." : "Migrant population compared to total population."}</p>
                  <div className="relative pt-6 pb-3 print:pt-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-serif font-bold text-blue-800 print:text-lg">{display.evolution}%</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lang === 'fr' ? "Population totale" : "Total population"}</span>
                    </div>
                    <div className="h-10 w-full bg-slate-100 rounded-sm relative overflow-hidden flex items-center border border-slate-200 print:h-8 print:!bg-slate-100">
                      <div className="h-full bg-blue-700 transition-all duration-1000 print:!bg-blue-700" style={{width: `${Math.max(5, parseFloat(display.evolution))}%`}}></div>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100 print:mt-3 print:pt-3">
                    <h4 className="font-bold text-slate-800 text-[10px] mb-2 uppercase tracking-widest print:text-[9px]">
                      {display.isRegion ? text.modal.evo_title : (lang === 'fr' ? "Évolution du stock migratoire absolu (1990-2024)" : "Absolute migrant stock evolution (1990-2024)")}
                    </h4>
                    <HistoricalChart data={display.history} colorClass="bg-blue-700" />
                  </div>
                </div>
                  
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center print:border print:p-4">
                   <h3 className="font-serif font-bold text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><HeartPulse className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.parity}</h3>
                   <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-sm border border-slate-100 print:w-24 print:h-24" style={{ background: `conic-gradient(#1d4ed8 ${display.female}%, #f1f5f9 0)` }}>
                     <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center border border-slate-50">
                       <span className="text-3xl font-serif font-bold text-slate-900 print:text-xl">{display.female}%</span>
                       <span className="text-[9px] font-bold text-blue-700 uppercase mt-0.5 tracking-widest">{lang === 'fr' ? "Femmes" : "Women"}</span>
                     </div>
                   </div>
                   <p className="text-center text-sm text-slate-600 mt-6 max-w-xs leading-relaxed print:mt-3 print:text-[10px]">{lang === 'fr' ? "La migration n'est pas qu'une affaire d'hommes fuyant la misère. Elle est structurellement féminisée." : "Migration is not just men fleeing poverty. It is structurally feminized."}</p>
                </div>
              </div>

              <div className={`animate-in fade-in duration-500 ${modalView === 'demography' ? 'block' : 'hidden print:block'} print:mb-6`}>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-6 print:p-4">
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center print:w-12 print:h-12">
                      <Activity className="w-7 h-7 text-emerald-700 print:w-5 print:h-5" />
                    </div>
                    <div>
                      <span className="text-3xl font-serif font-bold text-slate-900 print:text-xl">
                        {display.labour_participation !== null && display.labour_participation !== undefined ? `${display.labour_participation}%` : (lang === 'fr' ? 'N/D' : 'N/A')}
                      </span>
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                        {lang === 'fr' ? `Taux d'activité des migrants${display.labour_participation_year ? ` (OIT ${display.labour_participation_year})` : ' (OIT)'}` : `Migrant labour participation${display.labour_participation_year ? ` (ILO ${display.labour_participation_year})` : ' (ILO)'}`}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-6 pt-4 sm:pt-0">
                    {display.labour_participation !== null && display.labour_participation !== undefined
                      ? (lang === 'fr'
                          ? "Part des migrants en âge de travailler qui sont actifs (en emploi ou en recherche d'emploi), estimation modélisée par l'OIT — un indicateur direct de l'insertion économique, distinct du volume migratoire lui-même."
                          : "Share of working-age migrants who are economically active (employed or seeking work), ILO modelled estimate — a direct indicator of economic insertion, distinct from migration volume itself.")
                      : (lang === 'fr'
                          ? "L'OIT ne publie pas d'estimation modélisée pour cette entité (échantillon insuffisant)."
                          : "The ILO does not publish a modelled estimate for this entity (insufficient sample).")}
                  </p>
                </div>
              </div>

              <div className={`grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500 ${modalView === 'geography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                <div className="lg:col-span-2 bg-[#0f172a] rounded-lg p-7 text-white shadow-md flex flex-col justify-center items-center print:bg-white print:text-slate-900 print:border print:border-slate-200 print:p-4 print:shadow-none">
                  <h3 className="font-serif font-bold text-white print:text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><Globe className="w-5 h-5 mr-2.5 text-blue-400 print:w-4 print:h-4" /> {text.modal.retention_title}</h3>
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner border border-slate-700 print:shadow-inner print:w-24 print:h-24 print:border-slate-200" style={{ background: `conic-gradient(#3b82f6 ${display.retention}%, ${display.isRegion ? '#1e293b' : '#1e293b'} 0)` }}>
                    <div className="absolute inset-4 bg-[#0f172a] print:bg-white rounded-full flex flex-col items-center justify-center border border-slate-800 print:border-slate-100">
                      <span className="text-3xl font-serif font-bold text-white print:text-slate-900 print:text-xl">{display.retention}%</span>
                      <span className="text-[9px] font-bold text-blue-400 uppercase mt-0.5 tracking-widest text-center px-2">{lang === 'fr' ? "Restent dans la région" : "Stay in the region"}</span>
                    </div>
                  </div>
                </div>
                  
                <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-7 shadow-sm flex flex-col justify-between print:p-4 print:break-inside-avoid">
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 mb-4 flex items-center text-xl print:mb-2 print:text-lg"><GitMerge className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.orig_dest_title}</h3>
                    <p className="text-slate-700 text-base leading-relaxed print:text-xs">{display.origDest}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 print:mt-2 print:pt-2">
                      <p className="text-xs text-slate-500 italic print:text-[10px]">{lang === 'fr' ? "Cette dynamique prouve que les pays du Sud sont avant tout des pays d'accueil et de passage interne." : "This dynamic proves that Southern countries are primarily host and internal passage countries."}</p>
                    </div>
                  </div>
                    
                  {!display.isRegion && (
                    <div className="mt-6 flex flex-col gap-4 print:mt-3 print:gap-2">
                      {(display.idp_conflict > 0 || display.idp_disaster > 0 || display.refugees_hosted > 0) && (
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-200 print:p-3">
                          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center print:text-xs print:mb-2"><ShieldAlert className="w-4 h-4 mr-2 text-slate-400" /> {text.modal.idp_title}</h4>
                          <div className="space-y-4 print:space-y-2">
                            {display.refugees_hosted > 0 && (
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                                  <span className="text-slate-600 print:!text-slate-600">{text.modal.hcr_hosted}</span>
                                  <span className="text-slate-900 print:!text-slate-900"><Num value={display.refugees_hosted} lang={lang} /></span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200"><div className="h-full bg-slate-500 rounded-sm print:!bg-slate-500" style={{width: '100%'}}></div></div>
                              </div>
                            )}
                            {display.idp_conflict > 0 && (
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                                  <span className="text-rose-700 print:!text-rose-700">{text.modal.idp_conflict}</span>
                                  <span className="text-rose-900 print:!text-rose-900"><Num value={display.idp_conflict} lang={lang} /></span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200"><div className="h-full bg-rose-700 rounded-sm print:!bg-rose-700" style={{width: '100%'}}></div></div>
                              </div>
                            )}
                            {display.idp_disaster > 0 && (
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                                  <span className="text-blue-600 print:!text-blue-600">{text.modal.idp_disaster}</span>
                                  <span className="text-blue-800 print:!text-blue-800"><Num value={display.idp_disaster} lang={lang} /></span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200"><div className="h-full bg-blue-600 rounded-sm print:!bg-blue-600" style={{width: '100%'}}></div></div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-3 italic print:mt-1.5 print:text-[8px]">{text.modal.idp_desc}</p>
                        </div>
                      )}

                      {display.avoi !== null && (
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-200 print:p-3">
                          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center print:text-xs print:mb-2"><Unlock className="w-4 h-4 mr-2 text-slate-400" /> {text.modal.avoi_title}</h4>
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                              <span className="text-slate-600 print:!text-slate-600">Score</span>
                              <span className="text-slate-900 print:!text-slate-900">{display.avoi}/100</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden relative print:h-1.5 print:!bg-slate-200">
                              <div className="h-full bg-slate-600 rounded-sm transition-all duration-1000 print:!bg-slate-600" style={{width: `${display.avoi}%`}}></div>
                              {continentalAvoiAvg !== null && (
                                <div className="absolute top-0 bottom-0 w-px bg-amber-500 print:!bg-amber-500" style={{ left: `${continentalAvoiAvg}%` }} title={`${lang === 'fr' ? 'Moyenne continentale' : 'Continental average'}: ${continentalAvoiAvg}/100`}></div>
                              )}
                            </div>
                            {continentalAvoiAvg !== null && (
                              <p className="text-xs text-amber-700 mt-1.5 font-bold">
                                {lang === 'fr' ? `Moyenne continentale : ${continentalAvoiAvg}/100` : `Continental average: ${continentalAvoiAvg}/100`}
                              </p>
                            )}
                            <p className="text-xs text-slate-500 mt-2 italic print:text-[8px] print:mt-1.5">{text.modal.avoi_desc}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={`space-y-8 animate-in fade-in duration-500 ${modalView === 'economy' ? 'block' : 'hidden print:block'} print:space-y-4 print:break-inside-avoid`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Landmark className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.econ_title}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "L'apport des diasporas face à l'Assistance Publique au Développement (APD)." : "Diaspora contribution vs. Official Development Assistance (ODA)."}</p>
                  <div className="max-w-2xl"><EconomicComparison remittances={display.remittances} remittancesYear={display.remittances_year} aid={display.aid} lang={lang} /></div>
                  <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:mt-3 print:p-2"><p className="text-slate-700 text-sm print:text-[10px]">{lang === 'fr' ? "Les diasporas injectent massivement du capital directement dans l'économie réelle (familles, santé, éducation), rendant les Suds économiquement résilients sans dépendre exclusivement de la charité internationale." : "Diasporas inject massive capital directly into the real economy, making the Souths economically resilient without depending solely on international charity."}</p></div>
                </div>

                {display.au_treaties && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><FileText className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.au_instruments}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "État de ratification des conventions phares de l'OUA/UA en matière d'intégration et de mobilité." : "Ratification status of key OAU/AU conventions on integration and mobility."}</p>
                    <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-blue-700 font-bold hover:underline mb-6 print:hidden">
                      {lang === 'fr' ? "→ Consulter la base des traités de l'UA" : "→ View AU Treaties Database"}
                    </a>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'constitutive', fr: "Acte Constitutif UA", en: "AU Constitutive Act" },
                        { key: 'abuja', fr: "Traité d'Abuja (AEC)", en: "Abuja Treaty (AEC)" },
                        { key: 'refugees_1969', fr: "Conv. Réfugiés (1969)", en: "Refugee Conv. (1969)" },
                        { key: 'kampala', fr: "Conv. de Kampala (IDPs)", en: "Kampala Conv. (IDPs)" },
                        { key: 'free_movement', fr: "Protocole Libre Circ.", en: "Free Movement Protocol" },
                        { key: 'zlecaf', fr: "Accord ZLECAf", en: "AfCFTA Agreement" },
                      ].map((t) => {
                        const ratified = display.au_treaties[t.key];
                        return (
                          <div key={t.key} className={`p-3 rounded-md border flex items-center justify-between ${ratified ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                            <span className="text-xs font-bold">{lang === 'fr' ? t.fr : t.en}</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${ratified ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                              {ratified ? (lang === 'fr' ? 'Ratifié' : 'Ratified') : (lang === 'fr' ? 'Non ratifié' : 'Not ratified')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {display.iso2 && censusByCountry[display.iso2] && (
                  <div className="print:break-inside-avoid">
                    <CensusTimeline iso2={display.iso2} lang={lang} />
                  </div>
                )}

                {display.iso2 && countryRecAffiliations[display.iso2] && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4 print:break-inside-avoid">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Users className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Affiliation aux Communautés Économiques Régionales" : "Regional Economic Community Affiliation"}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "Blocs régionaux dont le pays est membre (l'appartenance à plusieurs CER est courante en Afrique)." : "Regional blocs the country belongs to (multiple REC membership is common in Africa)."}</p>
                    <div className="flex flex-wrap gap-3">
                      {countryRecAffiliations[display.iso2].map((recId) => (
                        <div key={recId} className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-full pl-1.5 pr-4 py-1.5 print:bg-white">
                          <span className="w-8 h-8 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 font-serif font-bold text-[9px] shrink-0">
                            {recId === 'censad' ? 'CS' : recId.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-emerald-900">{recNames[recId][lang]}</span>
                        </div>
                      ))}
                    </div>
                    {countryRecNotes[display.iso2] && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 flex items-start gap-2 print:bg-white">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {countryRecNotes[display.iso2][lang]}
                      </p>
                    )}
                    {visaOpenToAllAfrica[display.iso2] && (() => {
                      const openness = visaOpenToAllAfrica[display.iso2];
                      const tier = visaOpenTiers[openness.tier];
                      return (
                        <div className={`mt-4 p-4 rounded-md border flex items-start gap-3 print:bg-white ${tier.style}`}>
                          <Star className={`w-4 h-4 shrink-0 mt-0.5 ${tier.dot}`} />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">{tier.label[lang]}</span>
                            <p className="text-xs leading-relaxed">{openness.note[lang]}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {display.normlex && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Scale className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Évaluation Juridique des Droits (Base NORMLEX OIT)" : "Legal Evaluation of Rights (ILO NORMLEX)"}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "Ratification des conventions internationales du travail et protection des travailleurs." : "Ratification of international labor standards and worker protection."}</p>
                    {display.normlex.link && (
                      <a href={display.normlex.link} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-blue-700 font-bold hover:underline mb-6 print:hidden">
                        {lang === 'fr' ? "→ Consulter le profil national NORMLEX" : "→ View NORMLEX National Profile"}
                      </a>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Fondamentales" : "Fundamental"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.fundamental} / 11</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Gouvernance" : "Governance"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.governance} / 4</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Techniques" : "Technical"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.technical}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Total Ratifications" : "Total Ratified"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.total}</span>
                      </div>
                    </div>
                  </div>
                )}
                  
                <div className="bg-[#0f172a] p-7 rounded-lg text-white relative overflow-hidden shadow-md print:bg-white print:text-slate-900 print:shadow-none print:border print:border-slate-200 print:p-4 print:break-inside-avoid">
                  <h3 className="text-lg font-serif font-bold mb-6 border-b border-slate-700 pb-3 print:border-slate-200 print:mb-3 print:pb-2 print:text-base">{text.modal.causal_chain}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 print:gap-3">
                    <div className="bg-slate-800/50 p-5 rounded-md border border-slate-700/50 print:bg-slate-50 print:border print:border-slate-200 print:p-3">
                      <span className="text-amber-400 print:text-amber-600 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> {text.modal.trigger}</span>
                      <p className="text-sm leading-relaxed print:text-xs text-slate-200 print:text-slate-800 mt-2">{display.trigger}</p>
                    </div>
                    <div className="bg-slate-800/50 p-5 rounded-md border border-slate-700/50 print:bg-slate-50 print:border print:border-slate-200 print:p-3">
                      <span className="text-blue-400 print:text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> {text.modal.response}</span>
                      <p className="text-sm leading-relaxed print:text-xs text-slate-200 print:text-slate-800 mt-2">{display.response}</p>
                    </div>
                    <div className="bg-slate-800/50 p-5 rounded-md border border-slate-700/50 print:bg-slate-50 print:border print:border-slate-200 print:p-3">
                      <span className="text-emerald-400 print:text-emerald-600 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> {text.modal.impact}</span>
                      <p className="text-sm leading-relaxed print:text-xs text-slate-200 print:text-slate-800 mt-2">{display.impact}</p>
                    </div>
                  </div>
                </div>

                <PrintCitationFooter lang={lang} sectionLabel={display.isRegion ? (lang === 'fr' ? 'Profil Régional' : 'Regional Profile') : (lang === 'fr' ? 'Profil Pays' : 'Country Profile')} />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">{text.modal.data_source}</span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button onClick={exportCountryProfileCSV} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:text-blue-700 px-4 py-2 rounded-sm text-[11px] font-bold transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> <span>{text.modal.export_csv}</span></button>
                <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-sm text-[11px] font-bold transition-colors shadow-sm"><Printer className="w-3.5 h-3.5" /> <span>{text.modal.export_pdf}</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 print:hidden" style={{ backgroundColor: 'var(--ink)' }}>
        {/* filet de signature en tete de pied de page */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, var(--accent), rgba(43,58,103,.38) 40%, transparent)' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">

            {/* Marque */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3 mb-4">
                <BrandMark className="h-9 w-9 shrink-0" tone="dark" />
                <span className="font-serif font-bold text-xl leading-none" style={{ color: '#FFFDF9' }}>
                  South(s) Mobility
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#A79E92' }}>
                {text.footer.tag}
              </p>
            </div>

            {/* Navigation secondaire */}
            <div className="md:col-span-3">
              <span className="block text-[10px] font-semibold uppercase mb-4" style={{ letterSpacing: '.18em', color: 'var(--accent-light)' }}>
                {lang === 'fr' ? 'Explorer' : 'Explore'}
              </span>
              <ul className="space-y-2">
                {navigation.filter(n => n.id !== 'home').map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className="text-sm transition-colors hover:text-[#8FA0CE]"
                      style={{ color: '#CFC6BA' }}
                    >
                      {item.label[lang]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Provenance & contact */}
            <div className="md:col-span-4">
              <span className="block text-[10px] font-semibold uppercase mb-4" style={{ letterSpacing: '.18em', color: 'var(--accent-light)' }}>
                {lang === 'fr' ? 'Sources & contact' : 'Sources & contact'}
              </span>
              <p className="text-xs leading-relaxed mb-4" style={{ color: '#A79E92' }}>
                {text.footer.sources}
              </p>
              <a
                href="mailto:benmokhtary1@gmail.com?subject=South(s)%20Mobility%20-%20Contact"
                className="inline-flex items-center gap-2 text-sm transition-colors hover:text-[#8FA0CE]"
                style={{ color: '#CFC6BA' }}
              >
                <Mail className="w-3.5 h-3.5" /> benmokhtary1@gmail.com
              </a>
            </div>
          </div>

          <div className="mt-12 pt-6 flex flex-col sm:flex-row justify-between gap-3" style={{ borderTop: '1px solid rgba(255,253,249,.10)' }}>
            <p className="text-[11px]" style={{ color: '#8A8175' }}>
              © 2026 Yassine Ben Mokhtar — {lang === 'fr' ? 'Initiative citoyenne & recherche indépendante' : 'Independent research & civic initiative'}
            </p>
            <p className="text-[11px] italic" style={{ color: '#8A8175' }}>
              {lang === 'fr' ? 'Données publiques consolidées, sources citées.' : 'Consolidated public data, sources cited.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}