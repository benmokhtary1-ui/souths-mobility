import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { 
  Globe, ShieldAlert, TrendingUp, MapPin, Database, 
  ArrowRight, Languages, Activity, Users, Scale, Leaf, 
  Search, HeartPulse, ChevronRight, ChevronLeft, ChevronDown, X, BarChart3, GitMerge,
  Download, Printer, Map as MapIcon, Info, BookOpen, CheckCircle2, 
  PieChart, TableProperties, Landmark, Quote, Unlock, Target, ExternalLink, FileText,
  Copy, Check, Mail, AlertCircle, XCircle, AlertTriangle, HelpCircle, MinusCircle,
  Briefcase, Brain, Lightbulb, Compass, Star, Clock, Sparkles, Calendar, Mic, Type,
  PlayCircle
} from 'lucide-react';
import { evidenceCheckData } from './narrativesData';
import { LANGUES, ACTIVES, LANGUE_DEFAUT, estRTL, tagDe } from './i18n/langues';
import { tr, faireL, pluriel, appliquerLangue, catalogue } from './i18n/tr';
import { africaCountryPaths, AFRICA_VIEWBOX } from './africaMapPaths';
import { censusByCountry, censusRoundMeta, census2020Status } from './censusData';
import { unhcrByCountry, unhcrTotals, UNHCR_SOURCE } from './unhcrData';
import { findexByCountry, FINDEX_SOURCE } from './findexData';
import { iiagRank, IIAG_SOURCE } from './iiagData';
import { countryData } from './data/countries';
import { genericDesc } from './data/genericDesc';
import { glossaryData } from './data/glossary';
import { libraryData } from './data/library';
import { methodConventions } from './data/methodConventions';

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
  return tr({ fr: str.replace('.', ','), en: str }, lang);
};

// --- Nombres -----------------------------------------------------------------
// Un grand nombre ne se lit pas chiffre a chiffre : il se lit par tranches de
// trois. Le separateur de groupe est donc traite ici comme une respiration
// typographique et non comme un caractere parmi d'autres — il garde sa valeur
// textuelle (copier-coller, lecteurs d'ecran) mais recoit une marge propre.
// Cette marge est logique (margin-inline), donc elle suivra le sens de lecture
// le jour ou l'arabe rejoindra les langues de la plateforme.
// Le tag Intl vient desormais du registre des langues : une seule table a
// tenir a jour le jour ou l'arabe ou le kiswahili rejoignent la plateforme.
const localeOf = (lang) => tagDe(lang);

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
    fr: "Le traité africain de 2009 qui protège les personnes chassées de chez elles mais restées dans leur propre pays. Le seul texte contraignant au monde sur ce sujet.",
    en: 'The 2009 African treaty protecting people driven from their homes but still inside their own country. The only binding treaty in the world on this subject.',
  },
  retention: {
    label: { fr: 'rétention Sud-Sud', en: 'South-South retention' },
    fr: "La part des personnes parties d'un pays qui sont restées en Afrique, plutôt que d'aller vers l'Europe ou l'Amérique du Nord.",
    en: 'The share of people who left a country and stayed within Africa, rather than heading to Europe or North America.',
  },
  capabilites: {
    label: { fr: 'capabilités de mouvement', en: 'movement capabilities' },
    fr: "On ne part pas seulement parce qu'on le veut : il faut aussi le pouvoir — un passeport, un visa, de l'argent, un droit. Le cadre « aspirations et capabilités » de Hein de Haas (2021) va plus loin : la mobilité, c'est la capacité de choisir où vivre, y compris celle de rester.",
    en: 'People do not move only because they want to: they must also be able to — a passport, a visa, money, a legal right. Hein de Haas\'s aspirations–capabilities framework (2021) goes further: mobility is the capability to choose where to live, including the capability to stay.',
    source: { label: 'de Haas (2021), A theory of migration: the aspirations–capabilities framework',
              url: 'https://doi.org/10.1186/s40878-020-00210-4' },
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
  pdi: {
    label: { fr: 'personne déplacée interne', en: 'internally displaced person' },
    fr: "Quelqu'un qui a dû quitter son foyer — guerre, violence, catastrophe — mais qui est resté dans son propre pays. Il n'a franchi aucune frontière, et n'est donc pas un réfugié au sens du droit. En Afrique, c'est de loin la forme la plus courante de départ contraint.",
    en: 'Someone forced to leave home — war, violence, disaster — but who has stayed inside their own country. They crossed no border, so they are not a refugee in law. In Africa this is by far the commonest form of forced departure.',
  },
  refugie: {
    label: { fr: 'réfugié', en: 'refugee' },
    fr: "Quelqu'un qui a franchi une frontière parce qu'il ne pouvait plus rester. Le texte africain de 1969 va plus loin que celui de Genève : il protège aussi ceux qui fuient une guerre, une occupation ou des troubles graves, sans avoir à prouver qu'ils étaient personnellement visés.",
    en: 'Someone who crossed a border because staying was no longer possible. The 1969 African instrument goes further than the Geneva one: it also protects those fleeing war, occupation or serious unrest, with no need to prove they were personally targeted.',
  },
  remises: {
    label: { fr: 'transferts de fonds', en: 'remittances' },
    fr: "L'argent que les personnes parties envoient à leur famille restée au pays. Pris ensemble, ces envois dépassent l'aide publique au développement dans de nombreux pays africains, et arrivent directement dans les ménages.",
    en: 'The money people who have left send back to family at home. Taken together these transfers exceed official development aid in many African countries, and they reach households directly.',
  },
  ratification: {
    label: { fr: 'ratification', en: 'ratification' },
    fr: "Signer un traité ne l'engage pas encore. Le ratifier, si : l'État le fait approuver chez lui, puis dépose l'instrument auprès de l'organisation. C'est cette dernière étape qui compte dans les décomptes de cette plateforme.",
    en: 'Signing a treaty does not yet bind a state. Ratifying does: the state has it approved at home, then deposits the instrument with the organisation. It is that last step the counts on this platform record.',
  },
  entree_vigueur: {
    label: { fr: 'entrée en vigueur', en: 'entry into force' },
    fr: "Le moment où un traité commence réellement à s'appliquer. Il faut pour cela qu'un nombre minimum d'États l'aient ratifié — quinze, pour cette catégorie de protocoles de l'Union africaine. En dessous, le texte existe sans produire d'effet.",
    en: 'The moment a treaty actually starts to apply. A minimum number of states must have ratified it first — fifteen, for this class of African Union protocols. Below that, the text exists without effect.',
  },
  libre_circulation: {
    label: { fr: 'libre circulation', en: 'free movement' },
    fr: "Le droit d'entrer, de séjourner et de s'installer dans un autre pays du même ensemble régional sans visa. La CEDEAO l'applique depuis 1979 ; le protocole qui l'étendrait à tout le continent, adopté à Kigali en 2018, n'est pas encore en vigueur.",
    en: 'The right to enter, stay and settle in another country of the same regional bloc without a visa. ECOWAS has applied it since 1979; the protocol that would extend it to the whole continent, adopted in Kigali in 2018, is not yet in force.',
  },
  recensement: {
    label: { fr: 'recensement', en: 'census' },
    fr: "L'opération par laquelle un pays compte toute sa population, en principe tous les dix ans. Couvrant tout le monde, il sert de base à presque tous les autres chiffres. Une date annoncée puis reportée ne compte pas comme un recensement réalisé.",
    en: 'The operation by which a country counts its whole population, in principle every ten years. Covering everyone, it underpins almost every other figure. A date announced then postponed does not count as a census held.',
  },
  dejure: {
    label: { fr: 'population de jure', en: 'de jure population' },
    fr: "Compter les résidents habituels (de jure) ou toutes les personnes présentes le jour du recensement (de facto) ne donne pas le même total. Le choix change le nombre de migrants comptés, et il n'est pas le même d'un pays à l'autre.",
    en: 'Counting usual residents (de jure) or everyone present on census day (de facto) does not give the same total. The choice changes how many migrants are counted, and it differs from country to country.',
  },
  externalisation: {
    label: { fr: 'externalisation des frontières', en: 'border externalisation' },
    fr: "Quand un État fait contrôler sa frontière loin de chez lui : en finançant et équipant les forces d'un pays tiers, en y postant des agents de liaison, ou en liant son aide à la coopération migratoire. La frontière se déplace ; le contrôle reste.",
    en: 'When a state has its border policed far from home: by funding and equipping a third country’s forces, posting liaison officers there, or tying its aid to migration cooperation. The border moves; the control stays.',
  },
  diaspora: {
    label: { fr: 'diaspora', en: 'diaspora' },
    fr: "L'ensemble des personnes originaires d'un pays qui vivent ailleurs, et qui gardent un lien avec lui — famille, argent envoyé, allers-retours, parfois un droit de vote. L'Union africaine la considère comme sa « sixième région ».",
    en: 'Everyone originating from a country who lives elsewhere and keeps a link to it — family, money sent home, back-and-forth travel, sometimes a vote. The African Union treats it as its "sixth region".',
  },
  cedeao: {
    label: { fr: 'CEDEAO', en: 'ECOWAS' },
    fr: "La Communauté économique des États de l'Afrique de l'Ouest. Son protocole de 1979 sur la libre circulation est le plus ancien du continent, et l'un des mieux appliqués : on y circule sans visa entre pays membres.",
    en: 'The Economic Community of West African States. Its 1979 free-movement protocol is the continent’s oldest and among the best applied: nationals move between member states without a visa.',
  },
  protocole: {
    label: { fr: 'protocole', en: 'protocol' },
    fr: "Un texte qui complète un traité déjà existant, sur un point précis. Comme le traité, il n'a d'effet qu'une fois ratifié par assez d'États — signer ne suffit pas.",
    en: 'A text that supplements an existing treaty on one specific point. Like the treaty, it takes effect only once enough states have ratified it — signing is not enough.',
  },
  mpfa: {
    label: { fr: 'MPFA', en: 'MPFA' },
    fr: "Le Cadre de politique migratoire pour l'Afrique, adopté par l'Union africaine et révisé pour 2018-2030. Un texte d'orientation, adopté sans procédure de ratification : il propose aux États une trame commune pour écrire leurs propres politiques.",
    en: 'The Migration Policy Framework for Africa, adopted by the African Union and revised for 2018-2030. A policy orientation adopted without any ratification procedure: it offers states a shared template for writing their own policies.',
  },
  shasa: {
    label: { fr: 'SHaSA', en: 'SHaSA' },
    fr: "La Stratégie d'harmonisation des statistiques en Afrique. Son objet : que deux pays africains comptent la même chose de la même façon, faute de quoi leurs chiffres ne peuvent pas être comparés.",
    en: 'The Strategy for the Harmonisation of Statistics in Africa. Its purpose: that two African countries count the same thing the same way — otherwise their figures cannot be compared.',
  },
  statafric: {
    label: { fr: 'STATAFRIC', en: 'STATAFRIC' },
    fr: "L'institut de statistique de l'Union africaine, installé à Tunis. Il ne collecte pas lui-même : il fait converger les méthodes des instituts nationaux pour que les chiffres du continent tiennent ensemble.",
    en: 'The African Union’s statistics institute, based in Tunis. It does not collect data itself: it aligns the methods of national institutes so the continent’s figures hold together.',
  },
  apd: {
    label: { fr: 'aide publique au développement', en: 'official development assistance' },
    fr: "L'argent que les États riches versent aux pays plus pauvres, directement ou via des organisations. Dans de nombreux pays africains, les transferts des diasporas dépassent désormais cette aide.",
    en: 'Money that wealthy states give to poorer countries, directly or through organisations. In many African countries, diaspora transfers now exceed this aid.',
  },
  intraafricain: {
    label: { fr: 'intra-africain', en: 'intra-African' },
    fr: "Qui se passe à l'intérieur du continent, d'un pays africain à un autre. C'est le cas d'environ sept départs sur dix — la donnée que le débat public oublie le plus souvent.",
    en: 'Happening inside the continent, from one African country to another. That is the case for roughly seven departures in ten — the figure public debate most often forgets.',
  },
  hcr: {
    label: { fr: 'HCR', en: 'UNHCR' },
    fr: "L'agence des Nations unies pour les réfugiés. C'est elle qui publie les décomptes de réfugiés, de demandeurs d'asile et d'apatrides utilisés ici, et qui, dans certains pays, examine elle-même les demandes d'asile.",
    en: 'The United Nations refugee agency. It publishes the counts of refugees, asylum seekers and stateless people used here, and in some countries it examines asylum claims itself.',
  },
  oim: {
    label: { fr: 'OIM', en: 'IOM' },
    fr: "L'Organisation internationale pour les migrations, entrée dans le système des Nations unies en 2016. Elle publie le Rapport sur les migrations dans le monde et, avec l'Union africaine, le Rapport sur les migrations en Afrique.",
    en: 'The International Organization for Migration, which joined the United Nations system in 2016. It publishes the World Migration Report and, with the African Union, the Africa Migration Report.',
  },
  oit: {
    label: { fr: 'OIT', en: 'ILO' },
    fr: "L'Organisation internationale du travail. Elle est tripartite : États, employeurs et syndicats y siègent ensemble. Ses conventions fixent le socle des droits des travailleurs, migrants compris.",
    en: 'The International Labour Organization. It is tripartite: states, employers and unions sit together. Its conventions set the floor of workers’ rights, migrant workers included.',
  },
  idmc: {
    label: { fr: 'IDMC', en: 'IDMC' },
    fr: "Le centre de Genève qui compte, année après année, les personnes déplacées à l'intérieur de leur propre pays — par un conflit ou par une catastrophe. Sur ce déplacement-là, ses chiffres font référence.",
    en: 'The Geneva centre that counts, year after year, people displaced inside their own country — by conflict or by disaster. On that form of displacement, its figures are the reference.',
  },
  normlex: {
    label: { fr: 'NORMLEX', en: 'NORMLEX' },
    fr: "La base de l'Organisation internationale du travail qui recense, pays par pays, les conventions du travail ratifiées. C'est là qu'on lit si un État s'est engagé sur les droits des travailleurs migrants.",
    en: 'The International Labour Organization database recording, country by country, which labour conventions have been ratified. It is where one reads whether a state has committed on migrant workers’ rights.',
  },
  desa: {
    label: { fr: 'UN DESA', en: 'UN DESA' },
    fr: "Le service statistique des Nations unies qui publie les chiffres de référence sur les migrants dans le monde. Ses chiffres sont les plus cités, Afrique comprise.",
    en: 'The United Nations statistical office that publishes the reference figures on migrants worldwide. Its figures are the most cited, Africa included.',
  },
};

// Ou reconnaitre chaque notion dans un texte courant. Les definitions
// existaient depuis un moment, mais le lecteur ne les rencontrait qu'a deux
// endroits du site : elles ne servaient a personne. Ces motifs permettent de
// les proposer partout ou le mot apparait, sans avoir a baliser la prose a la
// main — et sans jamais la modifier.
const MOTIFS_TERMES = {
  avoi:              { fr: /\bAVOI\b/, en: /\bAVOI\b/ },
  zlecaf:            { fr: /\bZLECAf\b/, en: /\bAfCFTA\b/ },
  iiag:              { fr: /\bIIAG\b/, en: /\bIIAG\b/ },
  kampala:           { fr: /Convention de Kampala/, en: /Kampala Convention/ },
  retention:         { fr: /rétention (?:Sud-Sud|continentale)/, en: /South-South retention/ },
  capabilites:       { fr: /capabilités de mouvement/, en: /(?:movement capabilities|capabilities of movement)/ },
  apatridie:         { fr: /apatridie/, en: /statelessness/ },
  gcm:               { fr: /Pacte mondial(?: sur les migrations)?/, en: /Global Compact for (?:Safe, Orderly and Regular )?Migration/ },
  stock:             { fr: /stock de migrants/, en: /migrant stock/ },
  cer:               { fr: /Communautés? économiques? régionales?/, en: /Regional Economic Communit(?:y|ies)/ },
  oam:               { fr: /Observatoire africain des migrations/, en: /African Migration Observatory/ },
  spearman:          { fr: /corrélation de rang/, en: /rank correlation/ },
  cycle:             { fr: /cycles? de recensements?/, en: /census rounds?/ },
  ancrage:           { fr: /score d'ancrage/, en: /anchoring score/ },
  desa:              { fr: /UN DESA/, en: /UN DESA/ },
  pdi:               { fr: /personnes? déplacées? internes?/, en: /internally displaced persons?/ },
  refugie:           { fr: /réfugiés?\b/, en: /refugees?\b/ },
  remises:           { fr: /transferts de fonds/, en: /remittances/ },
  ratification:      { fr: /ratifications?\b/, en: /ratifications?\b/ },
  entree_vigueur:    { fr: /entrée en vigueur/, en: /entry into force/ },
  libre_circulation: { fr: /libre circulation/, en: /free movement/ },
  recensement:       { fr: /recensements?\b/, en: /census(?:es)?\b/ },
  dejure:            { fr: /population de jure/, en: /de jure population/ },
  externalisation:   { fr: /externalisation des frontières/, en: /border externalisation/ },
  normlex:           { fr: /NORMLEX/, en: /NORMLEX/ },
  diaspora:          { fr: /diasporas?\b/, en: /diasporas?\b/ },
  cedeao:            { fr: /\bCEDEAO\b/, en: /\bECOWAS\b/ },
  protocole:         { fr: /protocoles?\b/, en: /protocols?\b/ },
  mpfa:              { fr: /\bMPFA\b/, en: /\bMPFA\b/ },
  shasa:             { fr: /\bSHaSA\b/, en: /\bSHaSA\b/ },
  statafric:         { fr: /\bSTATAFRIC\b/, en: /\bSTATAFRIC\b/ },
  apd:               { fr: /aide publique au développement|\bAPD\b/, en: /official development assistance|\bODA\b/ },
  intraafricain:     { fr: /intra-africaine?s?\b/, en: /intra-African\b/ },
  hcr:               { fr: /\bHCR\b/, en: /\bUNHCR\b/ },
  oim:               { fr: /\bOIM\b/, en: /\bIOM\b/ },
  oit:               { fr: /\bOIT\b/, en: /\bILO\b/ },
  idmc:              { fr: /\bIDMC\b/, en: /\bIDMC\b/ },
};

// Assemble une seule expression pour toute la langue : un seul passage sur le
// texte, et le motif le plus long l'emporte quand deux se chevauchent
// (« personne deplacee interne » avant « recensement », par exemple).
const CACHE_MOTIF = new Map();
const motifGlobal = (lang) => {
  if (!CACHE_MOTIF.has(lang)) {
    const parts = Object.entries(MOTIFS_TERMES)
      .map(([k, m]) => ({ k, src: (m[lang] || m.fr).source }))
      .sort((a, b) => b.src.length - a.src.length);
    CACHE_MOTIF.set(lang, {
      re: new RegExp(parts.map(p => '(?:' + p.src + ')').join('|'), 'gi'),
      ordre: parts,
    });
  }
  return CACHE_MOTIF.get(lang);
};

// Retrouve la cle du terme correspondant a un fragment reconnu.
const cleDuFragment = (fragment, lang) => {
  for (const { k, src } of motifGlobal(lang).ordre) {
    if (new RegExp('^(?:' + src + ')$', 'i').test(fragment)) return k;
  }
  return null;
};

// Prose : le texte est rendu tel quel, a ceci pres que la PREMIERE occurrence
// de chaque notion devient consultable. Une seule par bloc — un paragraphe
// constelle de mots soulignes se lit plus mal, pas mieux.
const Prose = ({ children, lang = 'fr', className, ...reste }) => {
  const texte = typeof children === 'string' ? children : null;
  if (!texte) return <p className={className} {...reste}>{children}</p>;

  const { re } = motifGlobal(lang);
  re.lastIndex = 0;
  const morceaux = [];
  const vus = new Set();
  let dernier = 0, m;

  // Deux notions au plus par paragraphe. Au-dela, le texte se constelle de
  // mots soulignes et l'oeil ne sait plus ou se poser : l'aide devient une gene.
  const PLAFOND = 2;

  while ((m = re.exec(texte)) !== null) {
    const k = cleDuFragment(m[0], lang);
    if (!k || vus.has(k) || !PLAIN_TERMS[k] || vus.size >= PLAFOND) continue;
    vus.add(k);
    if (m.index > dernier) morceaux.push(texte.slice(dernier, m.index));
    morceaux.push(<Terme key={k + m.index} k={k} lang={lang}>{m[0]}</Terme>);
    dernier = m.index + m[0].length;
  }
  if (!morceaux.length) return <p className={className} {...reste}>{texte}</p>;
  morceaux.push(texte.slice(dernier));

  return <p className={className} {...reste}>{morceaux}</p>;
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

  const label = tr(entry.label, lang) || entry.label.fr;
  return (
    <span className="terme-wrap">
      <button
        ref={ref}
        type="button"
        className="terme"
        aria-expanded={open}
        aria-label={`${label} — ${tr({ fr: 'voir la définition simple', en: 'show the plain definition' }, lang)}`}
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
          <span className="terme-pop-lbl">{tr({ fr: 'En clair', en: 'In plain terms' }, lang)}</span>
          <span className="terme-pop-txt">{tr(entry, lang) || entry.fr}</span>
          {/* Une notion empruntee a un auteur se cite la ou elle est expliquee,
              pas seulement dans la bibliographie. */}
          {entry.source && (
            <a className="terme-pop-src" href={entry.source.url} target="_blank" rel="noopener noreferrer">
              {entry.source.label}
              <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
            </a>
          )}
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
  const L = faireL(lang);
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
          <Prose className="prefs-intro" lang={lang}>{L("Réglez la page comme vous la lisez le mieux. Le choix est retenu.",
               'Set the page the way you read best. Your choice is remembered.')}</Prose>
          {LECTURE_REGLAGES.map(r => (
            <fieldset key={r.cle} className="prefs-champ">
              <legend className="prefs-titre">{tr(r.titre, lang)}</legend>
              <div className="prefs-choix">
                {r.options.map(o => (
                  <button key={o.val} type="button"
                          aria-pressed={vals[r.cle] === o.val}
                          onClick={() => setVals(v => ({ ...v, [r.cle]: o.val }))}>
                    {tr(o.lib, lang)}
                  </button>
                ))}
              </div>
              <Prose className="prefs-aide" lang={lang}>{tr(r.aide, lang)}</Prose>
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
    <span className="en-clair-lbl">{tr({ fr: 'En clair', en: 'In plain terms' }, lang)}</span>
    <span className="en-clair-txt">{tr({ fr: fr, en: en }, lang)}</span>
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
        transform: shown ? 'none' : 'translateY(var(--reveal-shift))',
        transition: `opacity var(--dur-slow) var(--ease-entry) ${delay}ms, transform var(--dur-slow) var(--ease-entry) ${delay}ms`,
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
// Le fil de lecture. Quand le navigateur sait lier une animation au defilement,
// la barre est purement declarative : plus d'ecouteur de scroll, plus de rendu
// React a chaque image, et le trait suit le doigt sans retard d'une frame.
// Sinon, on retombe sur la mesure en JavaScript.
const pilotageParDefilement = () =>
  typeof CSS !== 'undefined' && CSS.supports && CSS.supports('animation-timeline: scroll()');

const ScrollProgress = () => {
  const natif = useMemo(pilotageParDefilement, []);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (natif) return;
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
  }, [natif]);

  return (
    <div className="h-0.5 w-full print:hidden" style={{ backgroundColor: 'rgba(255,253,249,.10)' }} aria-hidden="true">
      {natif ? (
        <span className="fil-lecture" />
      ) : (
        <div
          className="h-full transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent-deep), var(--accent) 60%, #8FA0CE)' }}
        />
      )}
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
              <span className="absolute -top-6 start-1/2 -translate-x-1/2 text-[10px] font-black text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100 whitespace-nowrap">
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
  const remLabel = tr({ fr: `Transferts des diasporas (BM, ${remittancesYear || 's.d.'})`, en: `Remittances (World Bank, ${remittancesYear || 'n.d.'})` }, lang);

  return (
    <div className="space-y-5 mt-4">
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-amber-600 print:!text-amber-600">{remLabel}</span>
          {hasRemittances ? (
            <span className="text-amber-700 print:!text-amber-700">{remittances}% PIB</span>
          ) : (
            <span className="text-slate-400 italic normal-case tracking-normal print:!text-slate-400">{tr({ fr: "Donnée non disponible", en: "Data not available" }, lang)}</span>
          )}
        </div>
        {hasRemittances ? (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden print:!bg-slate-200">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 print:!bg-amber-500" style={{width: `${remPct}%`}}></div>
          </div>
        ) : (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-dashed border-slate-300 print:!bg-slate-200" title={tr({ fr: "La Banque Mondiale ne publie plus de série récente pour ce pays", en: "The World Bank no longer publishes a recent series for this country" }, lang)}></div>
        )}
      </div>
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-slate-500 print:!text-slate-500">{tr({ fr: "Aide Internationale - APD (OCDE, 2024)", en: "International Aid - ODA (OECD, 2024)" }, lang)}</span>
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
// ---------------------------------------------------------------------------
// La planche d'atlas du bandeau de titre.
//
// Elle montrait toujours le meme morceau de continent, quelle que soit la
// section : un decor, donc, et un decor qui ne disait rien. Chaque planche a
// desormais son propre cadrage, choisi pour ce dont la section parle — la
// Corne pour le deplacement contraint, le corridor CEDEAO pour le travail,
// Addis-Abeba pour la gouvernance. Le fond devient une indication de lieu.
//
// Reperes en coordonnees de la planche (viewBox 1000 x 1126), pris au centre
// du trace de chaque pays. Ils servent a la fois aux cadrages et aux
// trajectoires tracees en arriere-plan.
const LIEUX = {
  rabat: [196, 125], tunis: [420, 52], tripoli: [512, 154], caire: [675, 148],
  nouakchott: [174, 224], dakar: [131, 308], bamako: [257, 268], ouaga: [286, 336],
  niamey: [402, 269], abidjan: [238, 394], accra: [293, 389], lagos: [409, 375],
  ndjamena: [530, 295], khartoum: [668, 296], juba: [662, 390], addis: [792, 374],
  djibouti: [818, 342], mogadiscio: [861, 423], nairobi: [761, 480], kampala: [693, 468],
  kinshasa: [567, 535], luanda: [520, 622], lusaka: [640, 645], dar: [725, 562],
  harare: [655, 718], maputo: [732, 716], lecap: [632, 942], tana: [869, 717],
};

// Une planche par section, reperee par son numero — celui que le bandeau
// affiche deja. Aucun appel de <PageHeader> n'a besoin d'etre modifie.
// Le cadrage se lit d'abord comme une carte, ensuite comme un indice de lieu :
// trop serre, il ne reste qu'une tache. Chaque planche garde donc au moins les
// deux tiers d'une dimension du continent, et les onze centres sont ecartes les
// uns des autres — deux sections ne doivent pas ouvrir sur la meme region.
const ATLAS_CADRAGES = {
  // Pl. I — l'Atlas : le continent entier, sans cadrage. C'est la premiere
  // feuille du recueil, celle par laquelle on entre.
  'Pl. I':     { crop: [0, 0, 1000, 1126], arcs: [['dakar','lagos'], ['lagos','kinshasa'], ['kinshasa','nairobi'], ['nairobi','caire'], ['kinshasa','lecap']] },
  // Pl. II — l'accueil : le meme continent entier, puisqu'on s'y oriente.
  'Pl. II':    { crop: [0, 0, 1000, 1126], arcs: [['dakar','lagos'], ['lagos','kinshasa'], ['kinshasa','nairobi'], ['nairobi','caire'], ['kinshasa','lecap']] },
  // Quart nord-ouest : les traversees que le debat public imagine.
  'Pl. III':   { crop: [30, 0, 830, 700],  arcs: [['dakar','rabat'], ['bamako','tripoli'], ['niamey','tunis']] },
  // Facade est, large : Corne, Grands Lacs et vallee du Nil ensemble.
  'Pl. IV':   { crop: [370, 130, 630, 640], arcs: [['mogadiscio','nairobi'], ['khartoum','juba'], ['juba','kampala'], ['kampala','kinshasa']] },
  // Facade ouest : le corridor CEDEAO d'un bout a l'autre.
  'Pl. V':    { crop: [30, 110, 660, 590], arcs: [['dakar','abidjan'], ['abidjan','accra'], ['accra','lagos'], ['bamako','ouaga'], ['ouaga','abidjan']] },
  // Gouvernance : le continent en entier. L'Union africaine gouverne 54 Etats,
  // pas une region — un cadrage sur la Corne repetait celui du deplacement
  // contraint et disait le contraire de ce que fait cette section. Les
  // trajectoires, elles, partent bien d'Addis-Abeba vers les quatre horizons.
  'Pl. VI':   { crop: [0, 0, 1000, 940], arcs: [['addis','rabat'], ['addis','dakar'], ['addis','lecap'], ['addis','djibouti']] },
  // Explorateur : presque tout le continent, puisque l'outil couvre les 54.
  'Pl. VII':  { crop: [10, 40, 980, 1040], arcs: [['dakar','ndjamena'], ['ndjamena','nairobi'], ['lagos','kinshasa'], ['kinshasa','lusaka']] },
  // Centre-sud : la ou se concentrent les appareils statistiques compares.
  'Pl. VIII':  { crop: [250, 290, 720, 720], arcs: [['ndjamena','juba'], ['juba','kinshasa'], ['kinshasa','dar'], ['dar','lusaka']] },
  // Moitie sud, jusqu'a Madagascar.
  'Pl. IX': { crop: [300, 460, 700, 666], arcs: [['luanda','lusaka'], ['lusaka','harare'], ['harare','maputo'], ['maputo','tana']] },
  // Bassin centre-equatorial.
  'Pl. X':   { crop: [200, 230, 700, 660], arcs: [['juba','kampala'], ['kampala','nairobi'], ['kinshasa','juba']] },
  // Bande mediterraneenne et saharienne, d'un ocean a l'autre.
  'Pl. XI':    { crop: [40, 0, 820, 570],  arcs: [['rabat','tunis'], ['tunis','tripoli'], ['rabat','nouakchott']] },
  // Facade atlantique, du detroit au golfe de Guinee.
  'Pl. XII':   { crop: [20, 20, 620, 780], arcs: [['rabat','dakar'], ['dakar','bamako'], ['bamako','rabat']] },
};

// Une trajectoire se courbe : la corde droite dit une ligne sur une carte, la
// courbe dit un deplacement. Le point de controle est deporte
// perpendiculairement a la corde, proportionnellement a sa longueur.
const arcTrajet = ([x1, y1], [x2, y2], k = 0.2) => {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  return `M${x1} ${y1} Q${(mx - dy * k).toFixed(1)} ${(my + dx * k).toFixed(1)} ${x2} ${y2}`;
};

const AfricaPlate = React.memo(({ opacity = 0.13, plate }) => {
  const cadre = ATLAS_CADRAGES[plate] || ATLAS_CADRAGES['Pl. I'];
  const [cx, cy, cw, ch] = cadre.crop;
  const viewBox = `${cx} ${cy} ${cw} ${ch}`;
  // L'epaisseur est donnee en unites de la planche : sur un cadrage serre,
  // un trait constant deviendrait un cable. On le ramene a l'echelle du crop.
  const trait = (0.9 * cw) / 1000;

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="atlas-plate absolute pointer-events-none select-none"
      style={{ opacity }}
    >
      <g fill="none" stroke="#FFFDF9" strokeWidth={trait} strokeLinejoin="round">
        {Object.entries(africaCountryPaths).map(([id, d]) => <path key={id} d={d} />)}
      </g>
      {/* Les trajectoires du fond : elles se tracent l'une apres l'autre.
          `pathLength=1` normalise la longueur, si bien que le meme pointille
          convient a un arc court comme a un arc qui traverse le continent. */}
      <g className="atlas-trajets" fill="none" stroke="#FFFDF9" strokeLinecap="round">
        {cadre.arcs.map(([a, b], i) => (
          LIEUX[a] && LIEUX[b] ? (
            <path
              key={a + b}
              d={arcTrajet(LIEUX[a], LIEUX[b])}
              pathLength="1"
              strokeWidth={trait * 1.6}
              style={{ animationDelay: `${240 + i * 200}ms` }}
            />
          ) : null
        ))}
        {[...new Set(cadre.arcs.flat())].map((k, i) => (
          LIEUX[k] ? (
            <circle
              key={k}
              cx={LIEUX[k][0]} cy={LIEUX[k][1]} r={trait * 2.2}
              fill="#FFFDF9" stroke="none"
              className="atlas-escale"
              style={{ animationDelay: `${520 + i * 90}ms` }}
            />
          ) : null
        ))}
      </g>
    </svg>
  );
});

// ---------------------------------------------------------------------------
// Rail de cartes : une lecture au doigt, a la molette ou au clavier.
//
// L'accrochage (scroll-snap) est natif : le rail s'arrete sur une carte, jamais
// entre deux. La mise en avant de la carte centrale est pilotee par le
// defilement du rail lui-meme — la ou le navigateur le sait faire, aucun
// JavaScript n'intervient dans l'animation. Le composant ne garde en memoire
// que la position courante, pour l'annoncer et pour griser les fleches.
const RailCartes = ({ children, lang = 'fr', etiquette, className = '' }) => {
  const ref = useRef(null);
  const [pos, setPos] = useState(0);
  const total = React.Children.count(children);
  const L = faireL(lang);

  const mesurer = useCallback(() => {
    const el = ref.current;
    if (!el || !el.firstElementChild) return;
    const pas = el.firstElementChild.getBoundingClientRect().width + 16;
    setPos(Math.round(el.scrollLeft / Math.max(1, pas)));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let brut = null;
    const surDefilement = () => {
      if (brut) return;
      brut = requestAnimationFrame(() => { brut = null; mesurer(); });
    };
    el.addEventListener('scroll', surDefilement, { passive: true });
    el.addEventListener('scrollend', mesurer);
    mesurer();
    return () => {
      el.removeEventListener('scroll', surDefilement);
      el.removeEventListener('scrollend', mesurer);
      if (brut) cancelAnimationFrame(brut);
    };
  }, [mesurer, total]);

  const glisser = (sens) => {
    const el = ref.current;
    if (!el || !el.firstElementChild) return;
    const pas = el.firstElementChild.getBoundingClientRect().width + 16;
    el.scrollBy({ left: sens * pas, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // Le compteur avance avec le geste, sans attendre l'evenement de
    // defilement : sur un defilement doux il arriverait une demi-seconde plus
    // tard, et les fleches resteraient grisees a contretemps.
    setPos(p => Math.max(0, Math.min(total - 1, p + sens)));
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--label)' }}>
          {etiquette}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums" style={{ color: 'var(--muted)' }} aria-live="polite">
            {Math.min(pos + 1, total)} / {total}
          </span>
          <button type="button" onClick={() => glisser(-1)} disabled={pos <= 0}
            className="rail-fleche" aria-label={L('Carte précédente', 'Previous card', { ar: 'البطاقة السابقة' })}>
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => glisser(1)} disabled={pos >= total - 1}
            className="rail-fleche" aria-label={L('Carte suivante', 'Next card', { ar: 'البطاقة التالية' })}>
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* tabIndex sur le conteneur : le rail se parcourt aussi aux fleches du
          clavier, comme n'importe quelle zone defilante. */}
      <div ref={ref} className="rail custom-scrollbar" tabIndex={0}
           role="group" aria-label={etiquette}>
        {children}
      </div>
    </div>
  );
};

// Comparaison de proportions : la these du site en une image. Toutes les
// valeurs sont celles du paragraphe voisin, deja sourcees — rien n'est
// introduit ici. Teinte unique, etiquettes directes, pas de legende.
// Afrobarometer : le versant « aspiration » du cadre que la plateforme mobilise.
// Toutes les valeurs proviennent de l'enquete 2024 (24 pays) publiee par
// Afrobarometer ; aucune n'est derivee ni recalculee ici.
const AspirationGap = ({ lang }) => {
  const L = faireL(lang);
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
      <span className="text-xs font-bold w-10 text-end shrink-0 tabular-nums text-slate-800">{v} %</span>
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
        <Prose className="text-justify" lang={lang}>{L(
            "Cette plateforme s'appuie sur le cadre des « capabilités de mouvement » : la mobilité s'y comprend comme la rencontre entre une aspiration et une capacité effectivement exerçable. Jusqu'ici elle ne mesurait que le second terme — des stocks, des ratifications, des recensements. Afrobarometer, seule enquête menée à l'échelle continentale auprès des citoyens eux-mêmes, permet enfin de chiffrer le premier.",
            'This platform works from the "capabilities of movement" framework: mobility is understood as the meeting of an aspiration with a capability that can actually be exercised. Until now it measured only the second term — stocks, ratifications, censuses. Afrobarometer, the only continental survey of citizens themselves, finally makes the first one countable.'
          )}</Prose>

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
          <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
              "Soixante pour cent de ceux qui envisagent de partir nomment l'Amérique du Nord ou l'Europe. Or, dans les faits, plus de sept migrants d'origine africaine sur dix restent sur le continent. Ce décalage est la définition même de la capabilité. L'aspiration se forme largement en direction du Nord ; la capacité de la réaliser, elle, est distribuée tout autrement — et c'est le régime de mobilité, visas, coûts, routes, accords, qui opère ce tri. Mesurer l'aspiration sans mesurer la capacité produit le récit de l'invasion ; mesurer la capacité sans l'aspiration produit celui de l'immobilité. Il faut les deux (Ben Mokhtar, 2026).",
              'Sixty per cent of those considering leaving name North America or Europe. Yet in fact more than seven in ten migrants of African origin stay on the continent. That gap is the very definition of capability. Aspiration forms largely towards the North; the capacity to realise it is distributed quite differently — and it is the mobility regime, visas, costs, routes, agreements, that does the sorting. Measuring aspiration without capability produces the invasion narrative; measuring capability without aspiration produces the immobility narrative. Both are needed (Ben Mokhtar, 2026).'
            )}</Prose>
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
  const L = faireL(lang);
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
  return typeof n === 'string' ? n : (tr(n, lang) || n.fr || fallback);
};

const markLegend = (mark, lang) => {
  const L = faireL(lang);
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
  const L = faireL(lang);
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

  const fmt = (v) => (tr({ fr: String(v).replace('.', ','), en: String(v) }, lang));
  const maxBucket = Math.max(...Object.values(data.byCount));

  return (
    <Chapitre lang={lang}>
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
          <Prose className="text-justify" lang={lang}>{L(
              `La compilation porte, pour chaque pays, la date de chaque recensement depuis le cycle 1970. On peut donc calculer ${data.total} intervalles réels au lieu de se contenter d'une moyenne. Et la distribution ne ressemble pas à la moyenne : elle superpose deux régimes que le chiffre unique fusionne.`,
              `The compilation carries, for each country, the date of every census since the 1970 round. That makes ${data.total} actual intervals computable instead of relying on an average. And the distribution does not look like the average: it superimposes two regimes that a single figure merges.`
            )}</Prose>
  
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
                  <span className="text-xs font-bold w-20 text-end shrink-0 tabular-nums text-slate-800">
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
                  <span className="text-xs font-bold w-14 text-end shrink-0 tabular-nums text-slate-800">{r.gap} {L('ans', 'yrs')}</span>
                  <span className="text-[11px] w-24 text-end shrink-0 tabular-nums" style={{ color: 'var(--label)' }}>
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
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                `L'intervalle médian est de ${data.median} ans, contre une moyenne de ${fmt(data.mean.toFixed(1))} : l'écart entre les deux mesure exactement la déformation produite par une poignée de très longues interruptions. ${data.metronomes.length} États ont conduit six recensements sans jamais dépasser douze ans d'écart — un rythme conforme à la recommandation onusienne, tenu sur un demi-siècle. À l'autre extrémité, ${data.jamais.length} n'ont aucune ou qu'une seule opération comptabilisable sur la période — dont la République démocratique du Congo, dont le seul recensement national date de 1984. Parler d'un « rythme africain » unique revient donc à moyenner un métronome et une horloge arrêtée : le résultat ne décrit ni l'un ni l'autre, et il masque là où l'appui statistique serait réellement utile (Ben Mokhtar, 2026).`,
                `The median interval is ${data.median} years against a mean of ${fmt(data.mean.toFixed(1))}: the gap between the two measures exactly the distortion produced by a handful of very long interruptions. ${data.metronomes.length} states have conducted six censuses without ever exceeding twelve years between them — a rhythm consistent with the UN recommendation, sustained over half a century. At the other end, ${data.jamais.length} have no countable operation at all, or only one, over the period — among them the Democratic Republic of the Congo, whose only national census dates from 1984. Speaking of a single "African rhythm" therefore means averaging a metronome and a stopped clock: the result describes neither, and it hides where statistical support would actually be useful (Ben Mokhtar, 2026).`
              )}</Prose>
            <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }}>
              <span className="font-bold uppercase tracking-widest">{L('Au rythme de métronome :', 'Metronomic:')}</span>{' '}
              {data.metronomes.map(c => censusName(c.iso2, c.name, lang)).join(', ')}.
            </p>
          </div>
        </div>
  
        <div className="px-6 md:px-8 py-4" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
          <Prose className="text-[11px] leading-relaxed text-justify" style={{ color: 'var(--label)' }} lang={lang}>{L(
              `Calcul effectué sur la compilation de l'auteur (d'après UNSD / UN DESA), qui recense la date de chaque opération nationale des cycles 1970 à 2030. Deux règles écartent une opération du calcul. D'abord, une date annoncée n'est pas une donnée : les recensements programmés puis reportés, longtemps portés dans la base comme s'ils avaient eu lieu, ont été retirés lors de l'audit d'août 2026. Ensuite, une opération conduite sur un territoire non encore indépendant, ou par un État tiers, est signalée dans la frise du pays mais n'est pas comptabilisée. Mesurer la régularité d'un État depuis un dénombrement colonial reviendrait à lui imputer le rythme de la puissance qui l'administrait. Ces ${data.exclus} opérations pré-indépendance sont donc visibles et non comptées — la frise de l'Angola, de la Namibie ou du Mozambique les porte en clair. La ligne de couverture par cycle, plus haut, reste celle publiée par l'auteur et n'est pas recalculée ici. Les dénominateurs varient donc d'un pays à l'autre — c'est précisément ce que ce calcul rend visible.`,
              `Computed from the author's compilation (after UNSD / UN DESA), which records the date of every national operation from the 1970 to the 2030 round. Two rules remove an operation from the calculation. First, an announced date is not data: censuses scheduled and then postponed, long carried in the base as though they had happened, were removed in the August 2026 audit. Second, an operation conducted on a territory not yet independent, or by a third state, is flagged in that country's timeline but not counted. Measuring a state's regularity from a colonial enumeration would credit it with the rhythm of the power that administered it. Those ${data.exclus} pre-independence operations are therefore visible and uncounted — the timelines for Angola, Namibia and Mozambique carry them plainly. The coverage-by-round row above remains the author's published figure and is not recomputed here. Denominators therefore vary between countries — which is precisely what this calculation makes visible.`
            )}</Prose>
        </div>
      </section>
    </Chapitre>
  );
};

// Ce que l'audit d'aout 2026 a fait apparaitre : les Etats donnes pour
// « defaillants » au cycle 2020 avaient pour la plupart un recensement en cours.
// Il a abouti — apres la cloture du cycle. Le retard n'est pas une absence.
const LateRound = ({ lang }) => {
  const L = faireL(lang);

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
    <Chapitre lang={lang}>
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
          <Prose className="text-justify" lang={lang}>{L(
              `Neuf États figuraient encore sur cette plateforme comme « recensement prévu » ou « en cours », pour des dates toutes dépassées. Leur vérification, une par une, auprès des instituts nationaux, donne un résultat que la lecture par cycle rendait invisible. Six de ces opérations ont bien eu lieu. Mais ${rows.length} d'entre elles se sont achevées après la clôture du cycle 2020, le 31 décembre 2024. Aucune n'apparaît donc dans le taux de couverture du cycle, alors que le recensement existe, que les ménages ont été dénombrés et que les résultats sont en cours de publication.`,
              `Nine states still appeared on this platform as "census planned" or "under way", all for dates now past. Checking each against its national institute yields a result the round-by-round reading made invisible. Six of those operations did take place. But ${rows.length} of them were completed after the 2020 round closed on 31 December 2024. None therefore counts toward the round's coverage rate, even though the census exists, households were enumerated and results are being published.`
            )}</Prose>
  
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
                  <span className="text-xs font-bold w-16 text-end shrink-0 tabular-nums text-slate-800">
                    {r.gap} {L('ans', 'yrs')}
                  </span>
                  <span className="text-[11px] w-28 text-end shrink-0 tabular-nums" style={{ color: 'var(--label)' }}>
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
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                "Ces quatre États sont voisins, et leur calendrier s'est resserré sur dix-huit mois : décembre 2025 pour la Centrafrique, avril-mai 2026 pour le Cameroun, mai 2026 pour le Gabon, juin-août 2026 pour le Tchad. Trois de ces opérations sont les premières entièrement numériques de leur pays, deux sont couplées à un recensement agricole. Lues à travers le seul cycle 2020, elles comptent pour zéro et alimentent le récit du déficit. Lues pour ce qu'elles sont, elles ouvrent la série 2030. Elles sortent aussi l'Afrique centrale d'une interruption qui durait, selon les pays, de treize à vingt-deux ans. Le découpage décennal sert la comparaison internationale ; il ne mesure pas l'effort statistique national. Il pénalise même mécaniquement les États dont l'opération a été retardée par un conflit ou par un financement tardif (Ben Mokhtar, 2026).",
                "These four states are neighbours, and their calendars converged within eighteen months: December 2025 for the Central African Republic, April–May 2026 for Cameroon, May 2026 for Gabon, June–August 2026 for Chad. Three of these operations are their country's first fully digital census, two are coupled with an agricultural census. Read through the 2020 round alone, they count for zero and feed the deficit narrative. Read for what they are, they open the 2030 series. They also lift Central Africa out of an interruption lasting, depending on the country, thirteen to twenty-two years. The decennial cut is an instrument of international comparison, not a measure of national statistical effort — and it mechanically penalises states whose operation was delayed by conflict or by late financing (Ben Mokhtar, 2026)."
              )}</Prose>
          </div>
        </div>
  
        <div className="px-6 md:px-8 py-4" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
          <Prose className="text-[11px] leading-relaxed text-justify" style={{ color: 'var(--label)' }} lang={lang}>{L(
              "Sources : ICASEES (Centrafrique, RGPH-4), BUCREP (Cameroun, RGPH-4), ministère de la Planification et de la Prospective (Gabon, RGPL), INSEED (Tchad, RGPH-3), GBoS (Gambie), INE São Tomé-et-Principe, INStaD (Bénin), Statistics Sierra Leone, SNBS et UNFPA (Somalie). Chaque date figure dans la fiche du pays concerné, dans l'Explorateur. Les deux opérations achevées dans la fenêtre du cycle — Gambie et São Tomé-et-Principe — ont été reversées au cycle 2020.",
              "Sources: ICASEES (CAR, 4th census), BUCREP (Cameroon, 4th census), Ministry of Planning and Foresight (Gabon, RGPL), INSEED (Chad, 3rd census), GBoS (The Gambia), INE São Tomé and Príncipe, INStaD (Benin), Statistics Sierra Leone, SNBS and UNFPA (Somalia). Each date appears in the relevant country profile, in the Explorer. The two operations completed within the round's window — The Gambia and São Tomé and Príncipe — were moved into the 2020 round."
            )}</Prose>
        </div>
      </section>
    </Chapitre>
  );
};

const MobileMoneyRail = ({ lang }) => {
  const L = faireL(lang);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (tr(c.name, lang) || c.name?.fr || ''));

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
  const fmt = (v) => (tr({ fr: String(v).replace('.', ','), en: String(v) }, lang));

  return (
    <Chapitre lang={lang}>
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
          <Prose className="text-justify" lang={lang}>{L(
              "Cette plateforme donnait jusqu'ici le volume des transferts de la diaspora sans dire par où ils passent. La question n'est pas secondaire : dans une bonne partie du continent, l'inclusion financière passe par le téléphone bien avant de passer par la banque. Là où le compte existe, il est très majoritairement un compte de téléphone.",
              'Until now this platform gave the volume of diaspora remittances without saying how they travel. The question is not secondary: across much of the continent, financial inclusion runs through the phone long before it runs through a bank. Where an account exists, it is overwhelmingly a phone account.'
            )}</Prose>
  
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
                      <span className="ms-2 font-bold" style={{ color: 'var(--ok)' }}>{Math.round(r.share)} %</span>
                    </span>
                  </div>
                  {/* La barre pale porte le compte, la barre pleine la part mobile. */}
                  <div className="relative h-4 w-full" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                    <div className="absolute inset-y-0 start-0" style={{ width: `${r.account}%`, backgroundColor: 'var(--rule-strong)' }} />
                    <div className={`absolute inset-y-0 start-0 bar-fill bar-fill--d${Math.min(5, i + 1)}`}
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
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                "Un montant ne dit rien du coût ni de l'accès. Si le canal est mobile, le transfert atteint des zones sans agence bancaire, à des frais et des délais différents, et il laisse une trace numérique exploitable statistiquement. C'est aussi ce qui rend crédible l'objectif de ramener sous 3 % les coûts de transaction (cible 10.c des ODD) : la baisse ne viendra pas des guichets, elle vient déjà des opérateurs. Nommer le canal, c'est cesser de traiter les transferts comme une manne indifférenciée pour les traiter comme une infrastructure — construite en Afrique, sans avoir attendu que le système bancaire s'étende (Ben Mokhtar, 2026).",
                'An amount says nothing about cost or access. If the rail is mobile, the transfer reaches areas with no bank branch, at different fees and delays, and it leaves a digital trace that can be exploited statistically. It is also what makes the target of cutting transaction costs below 3% (SDG target 10.c) credible: the fall will not come from counters, it is already coming from operators. Naming the rail means ceasing to treat remittances as an undifferentiated windfall and treating them as infrastructure — built in Africa, without waiting for the banking system to extend (Ben Mokhtar, 2026).'
              )}</Prose>
          </div>
        </div>
  
        <div className="px-6 md:px-8 pb-5">
          <Sources lang={lang} items={[{ label: tr(FINDEX_SOURCE.label, lang), url: FINDEX_SOURCE.url }]}
            note={L("Millésime le plus récent disponible par pays (2021 à 2024 selon les séries). Findex est une enquête par sondage : tous les pays ne sont pas couverts à chaque vague.",
                    'Most recent available year per country (2021 to 2024 depending on the series). Findex is a sample survey: not every country is covered in every wave.')} />
        </div>
      </section>
    </Chapitre>
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
    /* Le bandeau portait deux halos indigo écrits en dur : la même couleur dans
       les neuf sections, quelle que soit leur teinte. Il prend maintenant la
       gamme de la section — l'accent en haut à gauche, sa variante claire en
       bas à droite, sur l'encre. C'est la plus grande surface du site : c'est
       là que la couleur de section doit se voir. */
    className="page-bandeau relative overflow-hidden rounded-xl mb-8 px-6 lg:px-12 py-14 md:py-16"
  >
    {/* Le trait d'ouverture de la section : il se trace a l'arrivee. */}
    <div className="absolute inset-x-0 bottom-0 h-px overflow-hidden">
      {/* Le dégradé vient de la section, plus d'un indigo écrit en dur ici :
          c'est ce qui fait que le filet d'ouverture change de teinte d'une
          section à l'autre au lieu de rester bleu partout. */}
      <span className="trait-trace trait-trace--ouverture" />
    </div>
    <AfricaPlate plate={plate} />
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
          <span className="text-[10px] font-semibold uppercase tabular-nums" style={{ letterSpacing: '.2em', color: 'var(--accent-light)' }}>
            {plate}
          </span>
          <span className="block h-px flex-1 max-w-[7rem]" style={{ backgroundColor: 'rgba(255,253,249,.22)' }} />
          <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: 'rgba(255,253,249,.45)' }} strokeWidth={1.5} />
        </div>
      )}

      {/* Le numero de planche, l'etiquette et le mot en italique du titre
          prenaient le meme indigo dans les neuf sections : la couleur de
          section s'arretait au fond du bandeau, sans jamais toucher la
          typographie. Ils se calculent maintenant sur l'accent de la section,
          au-dessus de l'encre. */}
      <span
        className="inline-flex items-center gap-2 px-3 py-1 rounded-sm mb-5 text-[10px] font-semibold uppercase"
        style={{
          letterSpacing: '.18em',
          color: 'color-mix(in oklab, var(--accent-light) 62%, #FFFDF9)',
          backgroundColor: 'color-mix(in oklab, var(--accent) 24%, transparent)',
          border: '1px solid color-mix(in oklab, var(--accent-light) 34%, transparent)',
        }}
      >
        {badge}
      </span>

      <h1
        className="font-serif font-black text-[2.4rem] md:text-[3.6rem] leading-[1.02] tracking-[-0.025em]"
        style={{ color: '#FFFDF9' }}
      >
        {title}{' '}
        <span className="italic font-normal" style={{ color: 'var(--accent-light)' }}>{highlight}</span>
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

// Barre d'outils de section : sous le bandeau, alignee a droite, la meme
// partout.
//
// L'export PDF n'existait que dans Gouvernance. Une fonction offerte dans une
// seule section sur douze n'est pas une fonction : personne ne va la chercher
// ailleurs, et celui qui la trouve croit qu'elle vaut pour tout le site. Elle
// est donc au meme endroit dans chaque section — l'impression emporte deja le
// pied de citation, rendu pour toutes les sections.
//
// Les exports CSV, eux, restent contre le tableau qu'ils exportent : un bouton
// « Recensements (CSV) » en haut de page ne dirait pas ce qu'il telecharge.
// Ceux qui portent sur la section entiere peuvent etre passes en enfants.
const BarreSection = ({ lang, children = null }) => (
  <div className="flex flex-wrap items-center justify-end gap-2 -mt-4 print:hidden">
    {children}
    <button
      type="button"
      onClick={() => window.print()}
      className="barre-section-pdf inline-flex items-center gap-1.5 px-4 py-2 rounded-sm text-xs font-bold"
    >
      <Printer className="w-3.5 h-3.5" aria-hidden="true" />
      <span>{tr({ fr: "Exporter cette section (PDF)", en: "Export this section (PDF)" }, lang)}</span>
    </button>
  </div>
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
  const date = new Date().toLocaleDateString(tr({ fr: 'fr-FR', en: 'en-GB' }, lang), { day: '2-digit', month: 'long', year: 'numeric' });
  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
  const L = faireL(lang);
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
              <strong>{tr(visaOpenTiers[openness.tier].label, lang)} — </strong>{tr(openness.note, lang)}
            </p>
          )}
        </div>

        {recs.length > 0 && (
          <div className="pdf-block">
            <h2>{L('Appartenance aux CER', 'REC membership')}</h2>
            <div>{recs.map(r => <span key={r} className="chip">{tr(recNames[r], lang)}</span>)}</div>
            {countryRecNotes[iso] && (
              <Prose style={{ margin: '.8mm 0 0', fontSize: '6.8pt', color: '#92400e' }} lang={lang}>{tr(countryRecNotes[iso], lang)}</Prose>
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
                  <td className="k">{tr({ fr: t.fr, en: t.en }, lang)}</td>
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
        <div style={{ marginBottom: '.8mm' }}><strong>{L('Citation', 'Citation')} · </strong><em>{tr(PRINT_CITATION, lang)}</em></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>South(s) Mobility DataHub — {siteUrl}</span>
          <span>© 2026 Yassine Ben Mokhtar · {L('Généré le', 'Generated')} {date}</span>
        </div>
      </div>
    </div>
  );
};

const PrintCitationFooter = ({ lang, sectionLabel, tab = null, detail = null }) => {
  // L'adresse imprimee se deduit de la section, pas de la barre du navigateur.
  // L'URL est ecrite par un effet, donc apres le rendu : la lire pendant le
  // rendu donnait l'adresse de la section PRECEDENTE — la citation d'un
  // document imprime renvoyait ailleurs que ce qu'il contient. Les effets d'un
  // enfant s'executent avant ceux du parent : attendre ne reglait rien.
  const seg = tab ? tr(ROUTES[tab], lang) : null;
  const chemin = seg
    ? `/${lang}/${seg}${detail ? `/${detail}` : ''}`
    : (typeof window !== 'undefined' ? window.location.pathname : '');
  const siteUrl = typeof window !== 'undefined' ? `${window.location.origin}${chemin}` : 'South(s) Mobility DataHub';
  const printDate = new Date().toLocaleDateString(tr({ fr: 'fr-FR', en: 'en-US' }, lang), { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="hidden print:block mt-8 pt-4 border-t-2 border-slate-900 break-inside-avoid">
      <div className="flex items-center gap-2 mb-1.5">
        <Globe className="w-3.5 h-3.5 text-slate-700" />
        <span className="font-serif font-bold text-slate-900 text-xs">South(s) Mobility DataHub</span>
        {sectionLabel && <span className="text-slate-400 text-[10px]">— {sectionLabel}</span>}
      </div>
      <p className="text-[10px] text-slate-600">{siteUrl}</p>
      <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
        {tr({ fr: 'Citation suggérée : ', en: 'Suggested citation: ' }, lang)}
        <span className="italic">{tr(PRINT_CITATION, lang)}</span>
      </p>
      <p className="text-[9px] text-slate-400 mt-1.5">
        {tr({ fr: 'Document généré le', en: 'Document generated on' }, lang)} {printDate} — © 2026 Yassine Ben Mokhtar
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
  { key: 'ilo', name: "OIT", full: "OIT / ILO — NORMLEX", src: null },   // embleme officiel a recuperer aupres de l'OIT : le fichier Commons portant ce sigle est celui d'un motoriste allemand
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
  { key: 'eurostat', name: "Eurostat", src: "/logos/eurostat.png" },
  { key: 'frontex', name: "Frontex", src: "/logos/frontex.svg" },
  { key: 'moibrahim', name: "Mo Ibrahim Foundation", full: "Mo Ibrahim Foundation — IIAG", src: "/logos/moibrahim.svg" },
  { key: 'ecjrc', name: "EC JRC", full: "Commission européenne — Centre commun de recherche (JRC/KCMD)", src: "/logos/ec-jrc.svg" },
  // Trois sources citees dans les fiches mais absentes du bandeau : le bandeau
  // annonce « les sources institutionnelles suivantes », il doit donc les
  // porter toutes. Emblemes officiels a recuperer.
  { key: 'unodc', name: "UNODC", full: "ONUDC / UNODC — Global Study on Smuggling of Migrants", src: "/logos/unodc.jpg" },
  { key: 'unesco', name: "UNESCO", full: "UNESCO — Global Education Monitoring", src: "/logos/unesco.svg" },
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
        evidence: {
          badge: "Observatoire des Narratifs",
          title: "Évaluation des affirmations",
          highlight: "à la lumière des données.",
          desc: "Cette section évalue le niveau de robustesse scientifique des affirmations publiques courantes sur les migrations. Elle ne cherche pas à juger, mais à objectiver le débat en croisant les meilleures sources institutionnelles disponibles.",
          plain: "Soixante-dix affirmations qu'on entend souvent sur les migrations africaines, reprises une par une et confrontées aux sources. Chacune reçoit une note de solidité."
        },
        data: {
          badge: "Production statistique africaine",
          title: "Données & statistiques",
          highlight: "où se situe réellement le déficit.",
          desc: "Le récit d'une Afrique « sans données » est l'un des plus solidement installés — et l'un des moins vérifiés. Cette section confronte ce récit au volume réel de la production statistique du continent.",
          plain: "On répète souvent que l'Afrique manque de données. Cette section compte ce que le continent produit réellement, et regarde où le déficit se situe."
        },
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
          desc: "Déplacés internes, réfugiés, apatrides, déplacement lié aux catastrophes : les formes contraintes de mobilité sont, en Afrique, massivement internes. Elles relèvent d'instruments africains antérieurs et plus larges que les cadres mondiaux, là où l'écart entre la norme et l'ancrage se paie le plus cher.",
          plain: "En Afrique, la plupart des personnes qui fuient la guerre ou une catastrophe restent dans leur propre pays. Elles n'apparaissent donc dans aucune statistique migratoire. Cette section les compte."
        },
        glossary: {
          badge: "Lexique & Définitions",
          title: "Les mots du régime",
          highlight: "et leur définition africaine.",
          desc: "Chaque notion est définie d'abord par l'instrument africain qui fait référence : Convention de l'OUA sur les réfugiés (1969), Convention de Kampala sur les déplacés internes (2009). La définition opératoire d'UN DESA n'intervient que pour les agrégats statistiques. Le choix du mot n'est jamais neutre : il détermine ce qui est compté.",
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
        p1: "Un écart mesurable sépare la perception publique des mobilités africaines de leur réalité statistique. Le stock mondial de migrants internationaux s'élève à environ 304 millions de personnes en 2024, soit 3,6 % de la population mondiale — une proportion restée remarquablement stable depuis 1990 (UN DESA, 2024). Sur ce total, l'Afrique n'accueille qu'environ 29 millions de migrants internationaux, soit 9,5 % du stock mondial. C'est loin derrière l'Europe et l'Asie, et bien en deçà du poids démographique du continent — près de 18 % de la population mondiale. Il s'agit ici du stock de migrants présents en Afrique, non de l'émigration africaine : plus de sept migrants d'origine africaine sur dix restent d'ailleurs sur le continent (UA/OIT/OIM/CEA, 2021).",
        p1b: "Cette proportion contraste avec la place que les mobilités africaines occupent dans le débat public occidental. L'attention s'y concentre de manière disproportionnée sur les traversées vers l'Europe, un biais médiatique déjà documenté par la recherche (de Haas, 2017). Ce déséquilibre masque une réalité plus structurante : l'essentiel de la mobilité forcée sur le continent se joue à l'intérieur des frontières nationales. L'Afrique subsaharienne compte à elle seule près de 38,8 millions de personnes déplacées internes, soit environ 46 % du total mondial — 82,2 millions recensés dans 104 pays. C'est davantage que tous les migrants internationaux présents sur l'ensemble du continent (IDMC). La forme de mobilité la plus massive en Afrique se déroule donc entièrement à l'intérieur d'un pays. Elle ne produit ni image de traversée, ni statistique d'entrée dans les pays du Nord. Elle disparaît donc des récits dominants sur « la migration africaine ».",
        caveats: "Ces chiffres appellent une prudence méthodologique explicite. Les statistiques migratoires africaines souffrent d'un sous-enregistrement chronique — mobilités informelles, circulations transfrontalières non déclarées, capacités administratives inégales selon les pays. Cette plateforme travaille avec les meilleures données disponibles (UN DESA, OIM, IDMC, UA/OIT/OIM/CEA) tout en reconnaissant ces angles morts statistiques, documentés au cas par cas dans la section Méthodologie plutôt que dissimulés. Une distinction s'impose enfin sur les définitions. Pour les agrégats statistiques, la plateforme retient la définition opératoire d'UN DESA — condition de toute comparaison internationale. Pour les notions juridiques et normatives, en revanche, c'est l'instrument africain qui fait référence. Le réfugié se lit à travers la Convention de l'OUA de 1969, plus large que celle de Genève ; la personne déplacée interne, à travers la Convention de Kampala de 2009. Chaque terme est explicité dans le Glossaire.",
        p2: "Un cadre théorique plus large éclaire ce constat. La recherche sur les « capabilités de mouvement » place mobilité et immobilité sur un même continuum : celui des aspirations et des capacités réellement exerçables. Elle s'écarte ainsi de la coupure habituelle entre départ volontaire et départ contraint (de Haas, 2021). Les travaux sur la « diplomatie migratoire » montrent que les États africains négocient et retournent les agendas migratoires du Nord. Loin d'en être de simples récepteurs, ils instrumentalisent la coopération migratoire à leur propre bénéfice (Adamson & Tsourapas, 2019). Une lecture décoloniale du droit international de la migration questionne enfin l'asymétrie structurelle des régimes de mobilité mondiaux (Achiume, 2019).",
        p3: "South(s) Mobility DataHub part de ce cadre pour proposer une réponse méthodologique plutôt que polémique. Il consolide, harmonise et recontextualise des données déjà produites par les institutions internationales et africaines, au lieu d'en produire de nouvelles. La plateforme privilégie la proportion à la valeur absolue, et la comparaison à l'anecdote. Elle place l'architecture institutionnelle africaine — Union africaine, Communautés économiques régionales — avant les seuls cadres normatifs venus du Nord. Cela ne nie en rien les asymétries de pouvoir et de financement qui structurent ce régime (Bakewell, 2008 ; Bayart, 2000).",
        p3b: "Cette architecture produit un paradoxe que la plateforme documente chiffre à l'appui. L'Afrique a parfois devancé la norme internationale. Avec la Convention de Kampala (2009), elle a adopté le premier traité régional contraignant au monde sur les personnes déplacées internes — à ce jour, toujours le seul. Quatre États (Bénin, Gambie, Rwanda, Seychelles) accueillent déjà sans visa l'ensemble des ressortissants africains. Pourtant, le Protocole continental sur la libre circulation adopté à Kigali en 2018 ne compte que 4 ratifications sur 54, très loin des 15 requises pour son entrée en vigueur. C'est donc l'ancrage dans les administrations qui tarde, bien plus que la production normative nationales.",
        pullquote: "Entre les principes proclamés à Addis-Abeba et leur application aux postes-frontières s'ouvre un « entre-deux national » : l'espace où le régime africain de gouvernance migratoire se joue réellement (Ben Mokhtar, 2026).",
        p4: "Cette exigence scientifique n'exclut pas la vulgarisation : elle la conditionne. La section Evidence Check applique cette méthode affirmation par affirmation ; la section Gouvernance documente l'architecture institutionnelle qui tente — avec des moyens souvent limités — de gouverner ces mobilités à l'échelle continentale. Le lecteur pressé peut se contenter des chiffres ; le lecteur exigeant trouvera, à chaque affirmation, la source qui la fonde. Une réserve, enfin, sur ce que cette plateforme ne prétend pas être. Elle ne produit aucune statistique officielle, ne se substitue à aucun institut national de statistique et ne formule aucune recommandation de politique publique. Elle consolide, situe et rend citable un matériau déjà public. Choisir ce que l'on met en avant, et l'échelle à laquelle on le rapporte, est déjà un geste analytique : la plateforme l'assume plutôt que de se présenter comme un simple reflet des données.",
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
          { goal: 10, title: "Cible 10.7 (Gouvernance des migrations)", desc: "Faciliter une migration ordonnée, sûre, régulière et responsable grâce à des politiques planifiées et bien gérées. La cible migratoire de l'Agenda 2030, suivie par 4 indicateurs (coûts de recrutement, gouvernance, sécurité des parcours, réfugiés)." },
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
        { myth: "Les travailleurs migrants sont un fardeau pour le pays hôte.", real: "Moteurs de l'emploi et de la valeur ajoutée locale.", stat_text: "+ Valeur (2021)", stat_val: 85, color: "bg-emerald-700", desc: "Rapport UA/OIT (2021) : dans les dix États ayant déclaré leurs données d'emploi, 27,5 % des migrants occupés travaillent dans l'agriculture, la sylviculture ou la pêche. Ils y comblent des pénuries de main-d'œuvre et dynamisent les marchés locaux. La couverture déclarative reste le point faible : voir Données & Stats." }
      ],
      about: {
        intro_title: "À propos de South(s) Mobility",
        intro_subtitle: "Une infrastructure ouverte pour comprendre les mobilités dans les Suds",
        intro_p1: "South(s) Mobility DataHub est une plateforme indépendante de recherche, de données et de visualisation consacrée aux mobilités humaines dans les Suds, avec une première focalisation sur l'Afrique.",
        intro_p2: "La plateforme se tient à l'intersection des sciences sociales, de la science des données et des études sur les migrations. Elle rassemble, harmonise et met en valeur des données, indicateurs, cartes, publications, instruments juridiques et ressources documentaires d'institutions internationales, régionales et nationales.",
        intro_p3: "Son ambition est de rendre les données sur les mobilités humaines plus accessibles, plus comparables et plus intelligibles, afin de favoriser une compréhension empirique, nuancée et documentée des dynamiques migratoires contemporaines.",
        
        research_title: "Une plateforme née de la recherche",
        research_p1: "Un projet de recherche doctorale sur la gouvernance des migrations africaines est à l'origine de ce travail.",
        research_p2: "Au cours de cette recherche, un constat s'est imposé. Une grande quantité de données de qualité est déjà produite par des institutions publiques et internationales, mais ces ressources restent dispersées, hétérogènes et parfois difficiles d'accès. Les croiser, les contextualiser ou simplement les retrouver représente souvent un travail considérable.",
        research_p3: "Le projet est né de cette observation. Le projet rassemble ces ressources dans un environnement unique, ouvert et évolutif. Chercheurs, étudiants, journalistes, décideurs publics, organisations internationales — et quiconque s'intéresse aux mobilités humaines — peuvent ainsi les consulter, les comparer et les réutiliser.",
        research_p4: "Il relève de la science ouverte : diffuser les connaissances et rendre la recherche utilisable.",

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
        data_p3: "Aucune statistique officielle n'est produite ici : la plateforme agit comme une infrastructure de consolidation, de contextualisation et de diffusion des connaissances.",

        south_title: "Une perspective ancrée dans les Suds",
        south_p1: "Le regard porte depuis les Suds, avec une attention particulière aux dynamiques souvent moins visibles dans les bases de données internationales. Cela inclut notamment :",
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
        m2: "Harmonisation du périmètre. Les séries sont ramenées à 54 pays et au découpage régional de l'Union africaine — et non à la nomenclature M49 des Nations unies. Une table d'alias réconcilie les variantes de dénomination entre jeux de données (« RDC » / « R.D. Congo », « Cap-Vert » / « Cabo Verde ») sans renommer les sources.",
        m3: "Datation champ par champ. Les millésimes ne sont pas alignés artificiellement : transferts de fonds, activité des migrants et ratifications portent chacun leur année d'observation. Aucune interpolation n'est pratiquée pour produire une homogénéité de façade, et un chiffre non vérifiable est affiché daté et assorti d'une réserve plutôt que lissé.",
        m4: "Proportion plutôt que valeur absolue. Les effectifs sont systématiquement rapportés à la population de référence. Les échelles ne sont jamais mélangées dans une même représentation (l'indice AVOI est stocké de 0 à 100 au niveau des pays, de 0 à 1 au niveau des CER). Les cartes choroplèthes utilisent un découpage par quantiles, robuste aux distributions très asymétriques comme celle des déplacés internes.",
        m5: "Évaluation juridique seuillée. Les décomptes de ratification sont vérifiés sur les portails officiels avant publication. Le seuil d'entrée en vigueur est stocké instrument par instrument : 15 États parties pour cette catégorie de protocoles. Il pilote directement l'affichage du statut, « en vigueur » ou « pas encore en vigueur ».",
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
        evidence: {
          badge: "Narratives Observatory",
          title: "Evidence Check",
          highlight: "powered by open data.",
          desc: "This section assesses the scientific robustness of common public claims regarding migrations based on the best available institutional sources.",
          plain: "Seventy claims commonly made about African migration, taken one by one and checked against the sources. Each is given a robustness rating."
        },
        data: {
          badge: "African statistical production",
          title: "Data & Statistics",
          highlight: "where the deficit actually lies.",
          desc: "The narrative of an Africa \"without data\" is among the most firmly established — and the least verified. This section tests it against the continent's actual statistical output.",
          plain: "It is often repeated that Africa lacks data. This section counts what the continent actually produces, and looks at where the shortfall really sits."
        },
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
          desc: "Internally displaced people, refugees, stateless persons, disaster displacement: in Africa the constrained forms of mobility are overwhelmingly internal. They fall under African instruments that predate and exceed the global frameworks, where the gap between norm and anchoring costs the most.",
          plain: "In Africa, most people fleeing war or disaster stay inside their own country. They therefore appear in no migration statistic. This section counts them."
        },
        glossary: {
          badge: "Lexicon & Definitions",
          title: "The words of the regime",
          highlight: "and their African definition.",
          desc: "Each term is defined first by the African instrument that governs it: the OAU Refugee Convention (1969), the Kampala Convention on internally displaced persons (2009). UN DESA's operational definition comes in only for statistical aggregates. The choice of word is never neutral: it determines what gets counted.",
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
        p1: "A measurable gap separates public perception of African mobility from its statistical reality. The world's international migrant stock stands at roughly 304 million people in 2024, or 3.6% of the world's population — a share that has remained remarkably stable since 1990 (UN DESA, 2024). Of that total, Africa hosts about 29 million international migrants on its soil — 9.5% of the world stock. That is far behind Europe and Asia, and well below the continent's demographic weight, close to 18% of the world's population. This is the stock of migrants present in Africa, not African emigration: more than seven in ten migrants of African origin in fact remain on the continent (AU/ILO/IOM/ECA, 2021).",
        p1b: "This proportion contrasts sharply with the place African mobility occupies in Western public debate, where attention is disproportionately focused on crossings toward Europe — a media bias already documented by research (de Haas, 2017). This imbalance obscures a more structural reality: most forced mobility on the continent stays inside national borders. Sub-Saharan Africa alone accounts for close to 38.8 million internally displaced people, roughly 46% of the global total — 82.2 million recorded across 104 countries. That is more than all the international migrants present across the entire continent (IDMC). Africa's largest form of mobility therefore unfolds entirely inside a single country: it produces neither crossing imagery nor entry statistics in Northern countries, and therefore vanishes from dominant narratives about \"African migration\".",
        caveats: "These figures call for explicit methodological caution. African migration statistics suffer from chronic under-registration — informal mobility, undeclared cross-border circulation, uneven administrative capacity across countries. This platform works with the best available data (UN DESA, IOM, IDMC, AU/ILO/IOM/ECA) while acknowledging these statistical blind spots, documented case by case in the Methodology section rather than concealed. One distinction finally matters on definitions. For statistical aggregates, the platform retains UN DESA's operational definition — a precondition for any international comparison. But for legal and normative concepts, the African instrument is the reference: refugee is read through the 1969 OAU Convention, broader than the Geneva one, and internally displaced person through the 2009 Kampala Convention. Each term is spelled out in the Glossary.",
        p2: "A broader theoretical framework lights this observation. Research on \"capabilities of movement\" places mobility and immobility on a single continuum: that of aspirations and of the capabilities people can actually exercise. It thereby departs from the usual split between voluntary and forced departure (de Haas, 2021). Work on \"migration diplomacy\" shows that African states negotiate, redirect and instrumentalize migration cooperation with the North, far from merely receiving its agendas to their own benefit (Adamson & Tsourapas, 2019). A decolonial reading of international migration law, finally, questions the structural asymmetry of global mobility regimes (Achiume, 2019).",
        p3: "South(s) Mobility DataHub builds on this framework to offer a methodological response rather than a polemical one. It consolidates, harmonizes and recontextualizes data already produced by international and African institutions, instead of producing new data of its own. The platform favours proportion over absolute value, comparison over anecdote, and African institutional architecture — the African Union, the Regional Economic Communities — over normative frameworks imported solely from the North. This does not deny the power and funding asymmetries that concretely structure the regime (Bakewell, 2008; Bayart, 2000).",
        p3b: "This architecture produces a paradox the platform documents with figures. Africa has at times moved ahead of the international norm. With the Kampala Convention (2009) it adopted the world's first binding regional treaty on internally displaced persons — to this day, still the only one. Four states (Benin, The Gambia, Rwanda, Seychelles) already admit all African nationals without a visa. Yet the continental Free Movement Protocol adopted in Kigali in 2018 has secured only 4 ratifications out of 54, far short of the 15 required for it to enter into force. What lags, then, is the anchoring in national administrations, far more than the drafting of norms.",
        pullquote: "Between the principles proclaimed in Addis Ababa and their application at border posts lies a \"national in-between\": the space where the African migration governance regime is actually played out (Ben Mokhtar, 2026).",
        p4: "This scientific rigor does not exclude accessibility: it is its precondition. The Evidence Check section applies this method claim by claim; the Governance section documents the institutional architecture that — with often limited means — attempts to govern these mobilities at the continental scale. The hurried reader can settle for the figures; the demanding reader will find, behind every claim, the source that grounds it. One caveat, finally, on what this platform does not claim to be: it produces no official statistics, substitutes for no national statistical institute and issues no policy recommendation. It consolidates, situates and makes citable a body of already-public material. Choosing what to foreground, and the scale against which to measure it, is itself an analytical act — one this platform states openly.",
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
        research_p1: "A doctoral research project on the governance of African migration is where this work began.",
        research_p2: "During this research, a clear observation emerged: a vast amount of quality data is already produced by public and international institutions, but these resources remain widely scattered, heterogeneous, and sometimes difficult to access. Cross-referencing, contextualizing, or simply finding them often requires considerable effort.",
        research_p3: "The project was born from this observation. The project aims to gather these resources in a single, open, and scalable environment to facilitate their consultation, comparison, and reuse by researchers, students, journalists, public decision-makers, international organizations, and anyone interested in human mobility.",
        research_p4: "It follows an Open Science approach: disseminate knowledge and make research usable.",

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
        data_p3: "No official statistics are produced here: the platform acts as an infrastructure for consolidation, contextualization, and knowledge dissemination.",

        south_title: "A perspective rooted in the Souths",
        south_p1: "The vantage point is the Global South, with particular attention to dynamics that are often less visible in international databases. This includes:",
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
        m2: "Perimeter harmonisation. Series are brought onto a 54-country perimeter and the African Union's regional breakdown — not the UN M49 nomenclature. An alias table reconciles naming variants across datasets (\"DRC\" / \"D.R. Congo\", \"Cape Verde\" / \"Cabo Verde\") without renaming the sources.",
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
// Les douze États dont le tracé tombe sous le seuil de visibilité, avec le
// centre de leur emprise. Mesuré sur les tracés eux-mêmes plutôt que choisi :
// est petit ce qui couvre moins de 1 000 unités carrées sur une planche de
// 1000 × 1126 — les Seychelles en occupent cinq.
const PETITS_ETATS = [
  ['690', 972, 541],   // Seychelles
  ['480', 997, 733],   // Maurice
  ['174', 832, 628],   // Comores
  ['678', 388, 474],   // Sao Tomé-et-Principe
  ['270', 120, 322],   // Gambie
  ['748', 683, 816],   // Eswatini
  ['262', 817, 341],   // Djibouti
  ['646', 664, 508],   // Rwanda
  ['108', 665, 525],   // Burundi
  ['624', 122, 342],   // Guinée-Bissau
  ['426', 644, 858],   // Lesotho
  ['132',  16, 290],   // Cabo Verde
];

// Le cadrage d'une sous-région, calculé sur l'emprise réunie de ses pays plutôt
// que choisi à la main : ajouter un pays à une région recalcule son cadre.
// Marge de 4 % pour que les côtes ne collent pas au bord.
//
// Regarder l'Afrique de l'Ouest en affichant tout le continent oblige à
// chercher la région dans l'image à chaque fois. Une carte régionale doit
// cadrer sa région.
const CADRES_REGIONS = {
  af_med:     [73, -26, 701, 357],
  af_west:    [-20, 154, 537, 299],
  af_central: [362, 174, 339, 551],
  af_east:    [544, 187, 480, 640],
  af_south:   [424, 562, 393, 586],
};

const AfricaChoropleth = ({ indicator, lang, selectedId, onSelect, compact = false, region = null }) => {
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
      return c ? tr(c.label, lang) : (tr({ fr: 'donnée indisponible', en: 'no data' }, lang));
    }
    if (!Number.isFinite(v)) return tr({ fr: 'donnée indisponible', en: 'no data' }, lang);
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
  const L = faireL(lang);

  const releve = paysLu ? [
    { l: tr(indicator.label, lang), v: fmt(valueOf(lu)), fort: true },
    { l: L('Migrants internationaux', 'International migrants'), v: formatNumber(paysLu.stock, lang) },
    { l: L('Ouverture des visas', 'Visa openness'), v: paysLu.avoi == null ? '—' : `${paysLu.avoi}/100` },
    { l: L('Rétention Sud-Sud', 'South-South retention'), v: paysLu.retention == null ? '—' : `${paysLu.retention} %` },
  ] : [];

  return (
    <div className="grid lg:grid-cols-[1fr_15rem] gap-4 items-start">
      <svg viewBox={(region && CADRES_REGIONS[region]) ? CADRES_REGIONS[region].join(' ') : AFRICA_VIEWBOX}
           className="w-full h-auto max-h-[34rem] block"
           aria-label={L(`Carte de l'Afrique — ${indicator.label.fr}. Chaque pays est sélectionnable.`,
                         `Map of Africa — ${indicator.label.en}. Each country is selectable.`)}
           onMouseLeave={() => setSurvole(null)}>
        {Object.entries(africaCountryPaths).map(([id, d]) => {
          const v = valueOf(id);
          const isSel = selectedId === id;
          const isLu = lu === id;
          const nom = tr(countryById[id]?.name, lang) || id;
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

        {/* Les États trop petits pour être vus.
            Les Seychelles occupent 1,9 × 2,7 unités sur une planche de
            1000 × 1126 : à l'écran, une poussière. Douze pays sont dans ce cas,
            dont Cabo Verde, Maurice, les Comores et São Tomé — l'essentiel des
            États insulaires du continent. Une carte qui les rend invisibles les
            efface de la comparaison.

            Ils reçoivent une amorce : un cercle à leur position, de la teinte
            que porte leur valeur, cerné de blanc pour se détacher de la mer.
            Le cercle porte aussi l'interaction — le tracé, lui, est trop petit
            pour être visé. */}
        {PETITS_ETATS.map(([id, cx, cy]) => {
          const v = valueOf(id);
          const isSel = selectedId === id;
          const isLu = lu === id;
          const nom = tr(countryById[id]?.name, lang) || id;
          return (
            <circle
              key={'amorce-' + id}
              cx={cx} cy={cy} r={isSel || isLu ? 11 : 8.5}
              fill={colorFor(v)}
              stroke={isSel ? '#14161C' : isLu ? 'var(--accent)' : '#FFFFFF'}
              strokeWidth={isSel ? 2.6 : isLu ? 2.2 : 1.6}
              className="cursor-pointer choro-pays choro-amorce"
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
              {tr(paysLu.name, lang) || ''}
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
              <Prose className="text-[11px] mt-3.5 pt-3 border-t leading-snug"
                 style={{ borderColor: 'var(--rule)', color: 'var(--label)' }} lang={lang}>{selectedId === lu
                  ? L('Pays sélectionné. Son profil complet est affiché ci-dessous.',
                      'Country selected. Its full profile appears below.')
                  : L('Cliquez le pays pour ouvrir son profil complet.',
                      'Click the country to open its full profile.')}</Prose>
            )}
          </>
        ) : (
          <Prose className="text-[13px] leading-relaxed" style={{ color: 'var(--label)' }} lang={lang}>{L('Survolez un pays — ou parcourez la carte au clavier — pour lire ses chiffres ici.',
               'Hover a country — or move through the map with the keyboard — to read its figures here.')}</Prose>
        )}
      </aside>

      {/* Légende. Une rampe se lit « faible → élevé » ; des catégories se
          nomment une par une — les confondre ferait passer un statut pour
          une grandeur. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 pt-2 border-t border-slate-100 lg:col-span-2">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--label)' }}>
          {tr(indicator.label, lang)}
        </span>
        {categoriel ? (
          indicator.categories.map(c => (
            <span key={c.key} className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-[1px] shrink-0" style={{ background: c.color }} />
              <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>{tr(c.label, lang)}</span>
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
  const L = (o) => (typeof o === 'string' ? o : (tr(o, lang) || o?.fr || ''));
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
    contexte: [L(REGIONS[region]), c.stock ? `${formatNumber(c.stock, lang)} ${tr({ fr: 'migrants', en: 'migrants' }, lang)}` : null]
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
    titre: tr({ fr: t.term, en: (t.en_term || t.term) }, lang),
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
  const L = faireL(lang);
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
                    {tr(lib, lang)} <span className="num">{parType[k]}</span>
                  </button>
                ))}
              </div>

              {vus.length === 0 ? (
                <Prose className="recherche-vide" lang={lang}>{L('Rien ne correspond. Essayez un mot plus court, ou le nom d’un pays.',
                     'Nothing matches. Try a shorter word, or a country name.')}</Prose>
              ) : (
                <ul className="recherche-liste">
                  {vus.map((r, i) => (
                    <li key={i}>
                      <button type="button" onClick={() => { setOuvert(false); setQ(''); aller(r); }}>
                        <span className="recherche-type">{tr(TYPES[r.type], lang)}</span>
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
// ---------------------------------------------------------------------------
// L'ATLAS — la carte cesse d'etre un composant pour devenir l'ecran.
//
// L'ancienne entree posait neuf onglets nommes par discipline : « Gouvernance »,
// « Donnees & statistiques ». Ils demandaient au lecteur de savoir d'avance
// dans quelle case habitait sa question. Ici, on n'entre plus par une
// discipline mais par une question — et la reponse est le continent lui-meme,
// colore par la donnee qui repond.
//
// Chaque couche est un indicateur deja verifie ailleurs sur la plateforme :
// rien de neuf n'est introduit, c'est la meme donnee, prise par l'autre bout.
const COUCHES_ATLAS = [
  { cle: 'accueil', ind: () => mapIndicators.find(i => i.key === 'evolution'), mene: 'explorer',
    question: { fr: 'Qui accueille ?', en: 'Who hosts?', ar: 'مَن يستقبل؟' } },
  { cle: 'reste', ind: () => mapIndicators.find(i => i.key === 'retention'), mene: 'mobilites', volet: 'travail',
    question: { fr: 'Qui reste en Afrique ?', en: 'Who stays in Africa?', ar: 'مَن يبقى في أفريقيا؟' } },
  { cle: 'ouvre', ind: () => mapIndicators.find(i => i.key === 'avoi'), mene: 'governance', sousOnglet: 'recs',
    question: { fr: 'Qui ouvre ses frontières ?', en: 'Who opens its borders?', ar: 'مَن يفتح حدوده؟' } },
  { cle: 'deplace', ind: () => mapIndicators.find(i => i.key === 'idp_conflict'), mene: 'mobilites', volet: 'contraintes',
    question: { fr: 'Qui est déplacé chez soi ?', en: 'Who is displaced at home?', ar: 'مَن نزح داخل بلده؟' } },
  { cle: 'argent', ind: () => mapIndicators.find(i => i.key === 'remittances'), mene: 'mobilites', volet: 'travail',
    question: { fr: "Où l'argent revient-il ?", en: 'Where does the money return?', ar: 'إلى أين تعود الأموال؟' } },
  { cle: 'femmes', ind: () => mapIndicators.find(i => i.key === 'female'), mene: 'mobilites', volet: 'travail',
    question: { fr: 'Où les femmes partent-elles autant ?', en: 'Where do women leave as much?', ar: 'أين تهاجر النساء بالقدر نفسه؟' } },
  { cle: 'ratifie', ind: () => CARTE_ANCRAGE, mene: 'governance', sousOnglet: 'au',
    question: { fr: 'Qui a ratifié ?', en: 'Who has ratified?', ar: 'مَن صادَق؟' },
    plain: { fr: "Combien des six grands textes de l'Union africaine chaque pays a officiellement ratifiés. Six, c'est l'engagement complet ; zéro, aucun.",
             en: 'How many of the African Union’s six major instruments each country has formally ratified. Six is full commitment; zero is none.' },
    hint: { fr: "Décompte établi sur les listes officielles de statut de l'Union africaine.", en: 'Counted from the African Union’s official status lists.' } },
  { cle: 'compte', ind: () => CARTE_RECENSEMENT, mene: 'data',
    question: { fr: 'Qui compte sa population ?', en: 'Who counts its people?', ar: 'مَن يُحصي سكانه؟' },
    plain: { fr: "Où en est chaque pays de son recensement. Une date annoncée puis reportée ne compte pas comme un recensement réalisé.",
             en: 'Where each country stands on its census. A date announced then postponed does not count as a census held.' },
    hint: { fr: 'Compilation de l’auteur d’après UNSD et UN DESA, statuts vérifiés en 2026 sur les instituts nationaux.', en: 'Compiled by the author from UNSD and UN DESA, statuses verified in 2026 against national institutes.' } },
];

// Les corridors qui vivent dans le bandeau d'ouverture. Ce ne sont pas des
// traces decoratifs : chacun relie deux points que la plateforme documente, et
// tous figurent dans les sections correspondantes. Le mouvement est le sujet du
// site — autant le montrer plutot que le dire.
// Escales supplementaires, tirees des cartes de routes de l'OIM. Coordonnees
// posees dans le repere de la planche a partir de l'emprise du pays concerne.
const ESCALES_OIM = {
  nouadhibou: [112, 196],   // Mauritanie, cote nord-ouest
  dakhla:     [116, 178],   // sud du Maroc, cote atlantique
  conakry:    [140, 385],   // Guinee
  obock:      [820, 336],   // Djibouti, depart vers le Yemen
  bosasso:    [880, 352],   // Puntland, Somalie
  moyale:     [745, 425],   // frontiere Ethiopie-Kenya
  beitbridge: [648, 752],   // frontiere Zimbabwe-Afrique du Sud
};

// Les corridors du bandeau d'ouverture.
//
// Ils etaient jusqu'ici plausibles mais de mon fait : des arcs entre capitales,
// sans reference. Ils suivent desormais les trois routes africaines documentees
// par l'Organisation internationale pour les migrations dans son « Global
// Overview of Migration Routes » (DTM, janvier-avril 2026), avec leurs points
// de passage reels.
//
//   Route atlantique ouest-africaine — Bamako-Kayes, Nouakchott-Rosso, puis
//   l'embarquement depuis Nouadhibou, Dakhla et la cote senegalaise vers les
//   Canaries. L'OIM note le glissement des departs vers le sud (Guinee,
//   Guinee-Bissau, Gambie) a mesure que les controles se durcissent au nord.
//
//   Route orientale de la Corne — de l'Ethiopie et de la Somalie vers la
//   peninsule Arabique, par Obock a Djibouti et Bosasso au Puntland.
//
//   Route Afrique orientale-australe (ESAR) — du sud de l'Ethiopie (zones
//   Hadiya et Kembata) vers l'Afrique du Sud, par Moyale, Nairobi, la Tanzanie
//   et Beitbridge.
//
// La source est citee dans le bandeau : un trace sur une carte est une
// affirmation comme une autre.
const CORRIDORS = [
  // ---- Corridors intra-africains -------------------------------------------
  // Ils viennent en premier parce qu'ils pesent le plus, et parce qu'aucun
  // atlas ne les trace. Effectifs : stocks bilateraux d'UN DESA, repris par
  // l'OIM dans le Rapport sur les migrations dans le monde.
  { de: 'ouaga', vers: 'abidjan', intra: true, poids: 1376350, note: { fr: "Burkina Faso → Côte d'Ivoire", en: "Burkina Faso → Côte d'Ivoire" } },
  { de: 'bamako', vers: 'abidjan', intra: true, poids: 522146, note: { fr: "Mali → Côte d'Ivoire", en: "Mali → Côte d'Ivoire" } },
  { de: 'conakry', vers: 'abidjan', intra: true, poids: 167516, note: { fr: "Guinée → Côte d'Ivoire", en: "Guinea → Côte d'Ivoire" } },
  { de: 'juba', vers: 'kampala', intra: true, poids: 1100000, note: { fr: 'Soudan du Sud → Ouganda', en: 'South Sudan → Uganda' } },
  { de: 'kinshasa', vers: 'kampala', intra: true, poids: 320000, note: { fr: 'RDC → Ouganda', en: 'DRC → Uganda' } },

  // ---- Routes extracontinentales, cartographiees par l'OIM -----------------
  // Route atlantique ouest-africaine
  { de: 'bamako', vers: 'nouakchott' },
  { de: 'dakar', vers: 'nouadhibou' },
  { de: 'conakry', vers: 'dakar' },
  { de: 'nouadhibou', vers: 'dakhla' },
  { de: 'dakhla', vers: 'rabat' },
  // Route orientale de la Corne
  { de: 'addis', vers: 'obock' },
  { de: 'mogadiscio', vers: 'bosasso' },
  { de: 'obock', vers: 'bosasso' },
  // Route Afrique orientale-australe
  { de: 'addis', vers: 'moyale' },
  { de: 'moyale', vers: 'nairobi' },
  { de: 'nairobi', vers: 'dar' },
  { de: 'dar', vers: 'lusaka' },
  { de: 'lusaka', vers: 'beitbridge' },
  { de: 'beitbridge', vers: 'lecap' },
  { de: 'harare', vers: 'maputo' },
];

// Une courbe qui passe par un point intermediaire quand il y en a un, sinon un
// arc simple. La corde droite dirait une ligne sur une carte ; la courbe dit
// un trajet.
// Un seul repere pour les deux jeux de points : capitales et escales de l'OIM.
const POINTS = { ...LIEUX, ...ESCALES_OIM };

const traceCorridor = (c) => {
  const a = POINTS[c.de], b = POINTS[c.vers], m = c.via ? POINTS[c.via] : null;
  if (!a || !b) return null;
  if (m) return `M${a[0]} ${a[1]} Q${m[0]} ${m[1]} ${b[0]} ${b[1]}`;
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return `M${a[0]} ${a[1]} Q${(mx - dy * 0.22).toFixed(1)} ${(my + dx * 0.22).toFixed(1)} ${b[0]} ${b[1]}`;
};

// Le bandeau d'ouverture de l'Atlas : le continent en clair sur l'encre, les
// corridors qui se tracent, et des grains qui les parcourent.
//
// Les grains sont portes par `offset-path` : le navigateur deplace l'element le
// long du trace lui-meme, sur le compositeur, sans qu'aucun JavaScript ne
// tourne. C'est la seule facon d'animer une douzaine de particules sans faire
// chauffer la page — et cela suit exactement la courbe, pas une approximation.
const SceneFlux = ({ lang, children }) => {
  const traces = useMemo(() => CORRIDORS.map(traceCorridor).filter(Boolean), []);
  // animateMotion echappe a `prefers-reduced-motion` : la regle CSS ne l'atteint
  // pas. On ne monte donc simplement pas les grains quand le mouvement est
  // refuse — les corridors, eux, restent visibles, traces d'un coup.
  const reduit = useMemo(prefersReducedMotion, []);
  return (
    <section className="scene-flux">
      <svg className="scene-flux-carte" viewBox={AFRICA_VIEWBOX} aria-hidden="true" focusable="false"
           preserveAspectRatio="xMaxYMid meet">
        <g className="flux-continent">
          {Object.entries(africaCountryPaths).map(([id, d]) => <path key={id} d={d} />)}
        </g>
        <g className="flux-corridors">
          {traces.map((d, i) => (
            /* Le trait dit le rapport de grandeur : plein pour les corridors
               intra-africains, fin pour les routes qui sortent du continent.
               Sans cette hiérarchie, la carte donnerait le même poids visuel à
               un corridor d'1,4 million de personnes et à une route qui en
               compte quarante mille par an. */
            <path key={i} d={d} pathLength="1"
                  className={CORRIDORS[i]?.intra ? 'flux-intra' : 'flux-hors'}
                  style={{ animationDelay: `${300 + i * 140}ms` }} />
          ))}
        </g>
        {/* Les escales : elles battent, faiblement, decalees les unes des autres. */}
        <g className="flux-escales">
          {[...new Set(CORRIDORS.flatMap(c => [c.de, c.vers]))].map((k, i) => (
            POINTS[k] ? <circle key={k} cx={POINTS[k][0]} cy={POINTS[k][1]} r="4"
                               style={{ animationDelay: `${i * 260}ms` }} /> : null
          ))}
        </g>
        {/* Les grains voyagent DANS le dessin, portes par animateMotion.
            `offset-path` en CSS aurait ete tentant, mais il travaille en pixels
            quand le trace est en unites du dessin : il aurait fallu recalculer
            l'echelle a chaque redimensionnement, et la moindre erreur decalait
            les grains hors de leur corridor. Ici la geometrie est la meme des
            deux cotes, par construction. */}
        {!reduit && (
          <g className="flux-grains">
            {traces.flatMap((d, i) => [0, 1].map(j => (
              <circle key={i + '-' + j} r="3.4">
                <animateMotion path={d} rotate="auto" repeatCount="indefinite"
                  dur={`${(5.5 + (i % 4) * 1.1).toFixed(1)}s`}
                  begin={`${(i * 0.7 + j * 2.6).toFixed(2)}s`} />
              </circle>
            )))}
          </g>
        )}
      </svg>
      <div className="scene-flux-voile" aria-hidden="true" />
      <div className="scene-flux-texte">{children}</div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Le chapitre repliable.
//
// « Donnees & statistiques » faisait quinze ecrans d'affilee. Le lecteur y
// descendait en esperant croiser ce qui l'interesse, sans jamais savoir ce qui
// restait devant lui. Un sommaire aurait ajoute une couche de navigation ; on
// prefere que chaque analyse annonce ce qu'elle contient et se deplie sur
// demande.
//
// Le chapitre ne se replie que s'il en vaut la peine : sous le seuil, il reste
// ouvert et le bouton n'apparait pas. Rien n'est cache a l'impression, ni aux
// moteurs de recherche — le contenu est toujours dans le document, seule sa
// hauteur est bornee.
const SEUIL_CHAPITRE = 620;

const Chapitre = ({ children, lang = 'fr' }) => {
  const L = faireL(lang);
  const ref = useRef(null);
  const [long, setLong] = useState(false);
  const [ouvert, setOuvert] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setLong(el.scrollHeight > SEUIL_CHAPITRE + 120);
    mesurer();
    // Le contenu bouge avec la largeur de la fenetre et le chargement des
    // polices : une mesure unique au montage se tromperait a la premiere
    // rotation d'ecran.
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [children]);

  const replie = long && !ouvert;

  return (
    <div className="chapitre" data-replie={replie ? 'true' : 'false'}>
      <div ref={ref} className="chapitre-corps">{children}</div>
      {long && (
        <button type="button" className="chapitre-bouton" onClick={() => setOuvert(o => !o)} aria-expanded={ouvert}>
          {ouvert ? L('Replier', 'Collapse', { ar: 'طيّ' }) : L('Lire la suite', 'Read on', { ar: 'تابع القراءة' })}
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

// Le panneau de lecture. Cliquer un pays ne doit plus faire quitter la carte :
// on perdait le continent des yeux, donc le contexte, et il fallait revenir en
// arriere pour comparer. Le panneau s'ouvre a cote, la carte se resserre, le
// pays reste eclaire. La fiche complete demeure a un clic, pour qui la veut.
const PanneauPays = ({ pays, lang, text, indicateur, onFermer, onFiche }) => {
  const L = faireL(lang);
  const ref = useRef(null);

  // Le clavier doit pouvoir entrer dans le panneau et en sortir. On y place le
  // focus a l'ouverture, et Echap le referme comme n'importe quel tiroir.
  useEffect(() => {
    ref.current?.focus();
    const surTouche = (e) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [onFermer]);

  if (!pays) return null;
  const ouverture = visaOpenToAllAfrica[pays.iso2];
  const cer = countryRecAffiliations[pays.iso2] || [];
  const ratifies = pays.au_treaties
    ? ['constitutive', 'abuja', 'refugees_1969', 'zlecaf', 'kampala', 'free_movement']
        .reduce((n, k) => n + (pays.au_treaties[k] ? 1 : 0), 0)
    : null;
  // La valeur de la couche en cours vient en tete : c'est la question posee.
  const valeurCouche = indicateur?.get ? indicateur.get(pays) : null;
  const lisible = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : formatNumber(v, lang));

  // Le releve ne repete pas la valeur mise en avant : lire deux fois le meme
  // chiffre a dix centimetres d'ecart fait douter qu'il s'agisse du meme.
  const releve = [
    { cle: 'stock', l: L('Migrants présents', 'Resident migrants'), v: formatNumber(pays.stock, lang) },
    { cle: 'evolution', l: L('Part de la population', 'Share of population'), v: `${formatNumber(pays.evolution, lang)} %` },
    { cle: 'avoi', l: L('Ouverture des visas', 'Visa openness'), v: pays.avoi == null ? '—' : `${formatNumber(pays.avoi, lang)}/100` },
    { cle: 'retention', l: L('Rétention Sud-Sud', 'South-South retention'), v: pays.retention == null ? '—' : `${formatNumber(pays.retention, lang)} %` },
  ].filter(r => r.cle !== indicateur?.key);

  return (
    <aside ref={ref} tabIndex={-1} className="panneau-pays" aria-label={tr(pays.name, lang)}>
      <div className="flex items-start gap-3 mb-4">
        <CountryFlag iso2={pays.iso2} emoji={pays.flag} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="font-serif font-bold text-xl leading-tight text-slate-900 truncate">
            {tr(pays.name, lang)}
          </h3>
          <span className="block text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--label)' }}>
            {tr(text.regions?.[countryRegionMap[pays.id]], lang) || ''}
          </span>
        </div>
        <button type="button" onClick={onFermer} className="panneau-fermer"
                aria-label={L('Fermer le panneau', 'Close the panel', { ar: 'إغلاق اللوحة' })}>
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* La réponse à la question posée par la couche, mise en avant. */}
      {indicateur && (
        <div className="panneau-vedette">
          <span className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--label)' }}>
            {tr(indicateur.label, lang)}
          </span>
          <span className="font-serif font-bold text-3xl tabular-nums leading-none" style={{ color: 'var(--accent-deep)' }}>
            {Array.isArray(indicateur.categories)
              ? (tr(indicateur.categories.find(c => c.key === valeurCouche)?.label, lang) || '—')
              : <>{lisible(valeurCouche)}<span className="text-base font-semibold"> {indicateur.unit}</span></>}
          </span>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        {releve.map((r, i) => (
          <div key={i}>
            <dt className="text-[10px] leading-snug" style={{ color: 'var(--label)' }}>{r.l}</dt>
            <dd className="font-serif font-bold text-[15px] tabular-nums text-slate-900">{r.v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 pt-3.5 border-t space-y-3" style={{ borderColor: 'var(--rule)' }}>
        {ratifies !== null && (
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[11px]" style={{ color: 'var(--label)' }}>
              {L("Textes de l'UA ratifiés", 'AU instruments ratified')}
            </span>
            <span className="font-serif font-bold tabular-nums text-slate-900">{ratifies}<span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}> / 6</span></span>
          </div>
        )}
        {cer.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] me-1" style={{ color: 'var(--label)' }}>{L('CER', 'RECs')}</span>
            {cer.map(k => <span key={k} className="panneau-cer">{recNames[k] ? tr(recNames[k], lang) : k}</span>)}
          </div>
        )}
        {ouverture && (
          <div className="flex items-start gap-2">
            <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${visaOpenTiers[ouverture.tier].dot}`} aria-hidden="true" />
            <span className="text-[11px] leading-snug" style={{ color: 'var(--ink-soft)' }}>
              {tr(visaOpenTiers[ouverture.tier].label, lang)}
            </span>
          </div>
        )}
      </div>

      <button type="button" onClick={() => onFiche(pays.id)} className="panneau-fiche">
        {L('Ouvrir la fiche complète', 'Open the full profile', { ar: 'فتح البطاقة الكاملة' })}
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </aside>
  );
};

const TabAtlas = ({ lang, text, allerVers, ouvrirPays, setVoletMobilites, setSousOngletGouvernance }) => {
  const L = faireL(lang);
  const [coucheCle, setCoucheCle] = useState('accueil');
  const [paysOuvert, setPaysOuvert] = useState(null);
  const couche = COUCHES_ATLAS.find(c => c.cle === coucheCle) || COUCHES_ATLAS[0];
  const indicateur = couche.ind();
  const plain = couche.plain || indicateur.plain;
  const hint = couche.hint || indicateur.hint;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* L'ouverture. Le continent y est deja vivant : douze corridors reels,
          parcourus. On comprend le sujet avant d'avoir lu une ligne. */}
      <SceneFlux lang={lang}>
        <div className="max-w-3xl">
          <span className="block text-[10px] font-semibold uppercase mb-3"
                style={{ letterSpacing: '.2em', color: 'var(--accent-light)' }}>
            Pl. I · {L('Atlas des mobilités africaines', 'Atlas of African mobilities', { ar: 'أطلس التنقلات الأفريقية' })}
          </span>
          <h1 className="font-serif font-bold text-2xl md:text-4xl leading-[1.06]"
              style={{ color: '#FFFFFF' }}>
            {L('Les mobilités africaines,', 'African mobility,', { ar: 'التنقلات الأفريقية،' })}{' '}
            <span style={{ color: 'var(--accent-light)' }}>
              {L('par les données africaines.', 'through African data.', { ar: 'من خلال البيانات الأفريقية.' })}
            </span>
          </h1>
          <Prose className="mt-3 text-[13.5px] md:text-[15px] leading-relaxed max-w-xl"
                 style={{ color: '#D6DAE4' }} lang={lang}>{L(
            "Choisissez une question. Le continent y répond, pays par pays. Survolez pour lire un chiffre, cliquez pour ouvrir la fiche complète.",
            'Pick a question. The continent answers it, country by country. Hover to read a figure, click to open the full profile.',
            { ar: 'اختر سؤالاً. تجيب عنه القارة، بلداً بلداً. مرّر المؤشر لقراءة رقم، وانقر لفتح البطاقة الكاملة.' }
          )}</Prose>

          {/* Les questions vivent dans le bandeau, pas en dessous. Elles y
              tiennent la colonne de gauche sur toute sa hauteur : le vide qui
              separait le titre du continent disparait parce qu'il est occupe,
              et l'entree du site devient utilisable des le premier ecran. */}
          <nav aria-label={L('Couches de la carte', 'Map layers', { ar: 'طبقات الخريطة' })} className="mt-5">
            <div className="flex flex-wrap gap-2">
              {COUCHES_ATLAS.map(c => {
                const actif = c.cle === coucheCle;
                return (
                  <button
                    key={c.cle}
                    type="button"
                    onClick={() => setCoucheCle(c.cle)}
                    aria-pressed={actif}
                    className="couche-btn couche-btn--sombre"
                    data-actif={actif ? 'true' : 'false'}
                  >
                    {tr(c.question, lang)}
                  </button>
                );
              })}
            </div>
          </nav>
          {/* La provenance des traces. Un corridor dessine sur une carte est
              une affirmation : il se source comme un chiffre. */}
          <p className="scene-flux-source">
            {L("Corridors intra-africains : stocks bilatéraux UN DESA, repris par l'OIM. Routes extracontinentales : OIM, Global Overview of Migration Routes, janvier-avril 2026. Le trait plein pèse ce que pèse le corridor.",
               "Intra-African corridors: UN DESA bilateral stocks, reported by IOM. Extra-continental routes: IOM, Global Overview of Migration Routes, January-April 2026. Line weight follows corridor size.",
               { ar: 'الممرات: المنظمة الدولية للهجرة — نظرة عامة عالمية على مسارات الهجرة، يناير-أبريل 2026' })}
          </p>
        </div>
      </SceneFlux>

      {/* La carte et sa lecture. Choisir un pays ouvre le panneau a cote au
          lieu de quitter l'ecran : le continent reste sous les yeux, le pays
          choisi reste eclaire, et la comparaison d'un pays a l'autre se fait
          sans aller-retour. */}
      <div className="atlas-scene" data-panneau={paysOuvert ? 'ouvert' : 'ferme'}>
        <div className="atlas-carte">
          <AfricaChoropleth
            indicator={{ ...indicateur, plain, hint }}
            lang={lang}
            selectedId={paysOuvert}
            onSelect={(id) => setPaysOuvert(id === paysOuvert ? null : id)}
          />
        </div>
        {paysOuvert && countryById[paysOuvert] && (
          <PanneauPays
            pays={countryById[paysOuvert]}
            lang={lang}
            text={text}
            indicateur={indicateur}
            onFermer={() => setPaysOuvert(null)}
            onFiche={ouvrirPays}
          />
        )}
      </div>

      {/* Ce que la couche montre, et par ou continuer. */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 pt-1 border-t" style={{ borderColor: 'var(--rule)' }}>
        <Prose className="text-[13px] leading-relaxed max-w-2xl mt-4" style={{ color: 'var(--ink-soft)' }} lang={lang}>{tr(plain, lang)}</Prose>
        <button
          type="button"
          onClick={() => {
            // La question posee sur la carte doit retomber sur le volet qui y
            // repond, pas sur la premiere page de la section.
            if (couche.volet) setVoletMobilites?.(couche.volet);
            if (couche.sousOnglet) setSousOngletGouvernance?.(couche.sousOnglet);
            allerVers(couche.mene);
          }}
          className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--accent-deep)' }}
        >
          {L('Approfondir cette question', 'Go deeper on this question', { ar: 'التعمّق في هذا السؤال' })}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

const CarteSection = ({ lang, indicateur, kicker, titre, plain, sources = [] }) => (
  <Chapitre lang={lang}>
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
  </Chapitre>
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
           aria-label={tr({ fr: "Carte des États membres", en: "Map of member states" }, lang)}>
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

      <div className="absolute top-2 start-2 pointer-events-none">
        {hoveredMeta ? (
          <div className="bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md rounded-md px-3 py-2 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-900 block">{tr(hoveredMeta.name, lang) || hoveredMeta.name.fr}</span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${hoveredIsMember ? 'text-emerald-700' : 'text-slate-400'}`}>
              {hoveredIsMember ? (tr({ fr: 'État membre', en: 'Member state' }, lang)) : (tr({ fr: 'Non membre', en: 'Not a member' }, lang))}
            </span>
          </div>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {tr({ fr: 'Survolez la carte', en: 'Hover the map' }, lang)}
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
        contrast_fr: "Le PIB classique ignore l'économie informelle. Cet indicateur montre que les mobilités circulaires portent la survie et l'intégration des communautés frontalières.", contrast_en: "Classic GDP ignores the informal economy. This indicator shows that circular mobilities carry the survival and integration of border communities."
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
  { id: 'mobilites', icon: ShieldAlert, label: { fr: 'Mobilités', en: 'Mobilities' },
    desc: { fr: "Déplacement contraint et migration de travail : ce qui pousse au départ, et ce qui se gagne à l'arrivée.",
            en: "Forced displacement and labour migration: what drives departure, and what is earned on arrival." } },
  { id: 'governance', icon: Landmark, label: { fr: 'Gouvernance', en: 'Governance' },
    desc: { fr: "L'architecture juridique panafricaine, et ce que les États ont réellement ratifié.",
            en: "The pan-African legal architecture, and what states have actually ratified." } },
  { id: 'explorer', icon: MapPin, label: { fr: 'Explorateur', en: 'Data Explorer' },
    desc: { fr: "Profils détaillés pour 54 pays africains et leurs 5 sous-régions.",
            en: "Detailed profiles for 54 African countries and their 5 sub-regions." } },
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
      door: { fr: 'Comprendre pourquoi', en: 'Understand why' }, tab: 'mobilites' },
  ];

  const essayWordCount = [text.home_editorial.p1, text.home_editorial.p1b, text.home_editorial.caveats, text.home_editorial.p2, text.home_editorial.p3, text.home_editorial.pullquote, text.home_editorial.p4]
    .join(' ').trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.round(essayWordCount / 200));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.home.badge}
        plate={"Pl. II"}
        plain={text.headers.home.plain}
        lang={lang}
        title={text.headers.home.title}
        highlight={text.headers.home.highlight}
        desc={text.headers.home.desc}
        icon={Globe}
      />

      <BarreSection lang={lang} />

      {/* Releve de chiffres : une seule feuille divisee par des filets, plutot que
          quatre vignettes posees cote a cote. */}
      <Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 bg-white border border-slate-200 divide-x divide-y lg:divide-y-0 divide-slate-200 stat-ledger stagger">
          {statTiles.map((stat, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(stat.tab)}
              aria-label={`${stat.value} ${stat.unit ? tr(stat.unit, lang) + ' ' : ''}${tr(stat.label, lang)} — ${tr(stat.door, lang)}`}
              className="relative overflow-hidden px-5 py-6 text-start group flex flex-col"
            >
              <span
                className="absolute start-0 top-0 h-full w-[2px] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <div className="text-4xl font-serif font-bold text-slate-900 tabular-nums leading-none">
                <CountUp value={stat.value} />
                  {/* L'espace est dans le texte, pas seulement dans la marge :
                      sans lui, un copier-coller donne « 29millions ». */}
                {stat.unit && (
                  <span className="text-lg font-semibold" style={{ color: 'var(--label)' }}>
                    {' '}{tr(stat.unit, lang)}
                  </span>
                )}
              </div>
              {/* Ce que compte le chiffre : c'est cette ligne qui porte le sens. */}
              <span className="block mt-2 text-[13px] leading-snug text-slate-700 flex-1">
                {tr(stat.label, lang)}
              </span>
              {/* Ce que fait le clic : rien ne disait que ces tuiles menaient quelque part. */}
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold group-hover:gap-2 transition-[gap]"
                    style={{ color: 'var(--accent)' }}>
                {tr(stat.door, lang)}
                <ArrowRight className="w-3 h-3 shrink-0" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      <Reveal delay={60}>
        <h2 className="text-lg font-serif font-bold text-slate-800 mb-4">{tr({ fr: "Explorer le Knowledge Hub", en: "Explore the Knowledge Hub" }, lang)}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
          {homeCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => setActiveTab(card.id)}
                className="hub-card lift text-start p-6 bg-white border border-slate-200 group flex flex-col h-full relative"
              >
                {/* Numerotation d'entree : la rubrique se lit comme une section d'ouvrage. */}
                <div className="flex items-baseline justify-between mb-5">
                  <span className="font-serif font-bold text-2xl leading-none tabular-nums" style={{ color: 'var(--accent-deep)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon className="w-[18px] h-[18px] shrink-0" style={{ color: 'var(--rule-strong)' }} />
                </div>
                <span className="block h-px w-full mb-4" style={{ backgroundColor: 'var(--rule)' }} />
                <h3 className="font-serif font-bold text-lg text-slate-900 mb-2 leading-snug">{tr(card.label, lang)}</h3>
                <Prose className="text-xs text-slate-500 leading-relaxed flex-1" lang={lang}>{tr(card.desc, lang).replace('{count}', totalLibrary)}</Prose>
                <span className="hub-card-cta flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-5">
                  {tr({ fr: "Découvrir", en: "Discover" }, lang)} <ArrowRight className="w-3 h-3 ms-1.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={40} className="note-cadrage bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-12">
        <span className="note-cadrage-filet" aria-hidden="true" />
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest">
            {text.home_editorial.badge}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <Clock className="w-3 h-3" /> {readingMinutes} {tr({ fr: "min de lecture", en: "min read" }, lang)}
          </span>
        </div>
        <h2 className="text-2xl md:text-4xl font-serif font-bold text-slate-900 mb-6 text-center">{text.home_editorial.title}</h2>
        <Chapitre lang={lang}>
        <div className="note-cadrage-corps space-y-4 text-sm text-slate-700 leading-relaxed text-justify">
          <Prose className="lede" lang={lang}>{text.home_editorial.p1}</Prose>
        </div>

        <div className="max-w-4xl">
          <ProportionGap lang={lang} />
          <AspirationGap lang={lang} />
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <Prose lang={lang}>{text.home_editorial.p1b}</Prose>
        </div>
        <div className="max-w-4xl bg-slate-50 border border-slate-200 rounded-lg p-5 my-5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <Prose className="text-xs text-slate-600 leading-relaxed text-justify" lang={lang}>{text.home_editorial.caveats}</Prose>
        </div>
        <div className="space-y-4 text-sm text-slate-700 leading-relaxed max-w-4xl text-justify">
          <Prose lang={lang}>{text.home_editorial.p2}</Prose>
          <Prose lang={lang}>{text.home_editorial.p3}</Prose>
          <Prose lang={lang}>{text.home_editorial.p3b}</Prose>
          <blockquote className="border-s-4 border-amber-400 ps-5 py-1 italic text-slate-800 not-italic font-serif text-base my-2">
            {text.home_editorial.pullquote}
          </blockquote>
          <Prose className="font-medium text-slate-800" lang={lang}>{text.home_editorial.p4}</Prose>
        </div>
        </Chapitre>
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
          {tr({ fr: "Données croisées et vérifiées à partir des sources institutionnelles suivantes", en: "Data cross-checked and verified against the following institutional sources" }, lang)}
        </h4>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {institutionLogos.map((inst) => (
            <div key={inst.key} className="h-9 flex items-center justify-center" title={inst.full || inst.name}>
              <InstitutionLogo name={inst.name} src={inst.src} />
            </div>
          ))}
        </div>
        <Prose className="text-center text-xs text-slate-400 mt-8 max-w-xl mx-auto leading-relaxed" lang={lang}>{tr({ fr: "Ces institutions sont citées comme sources de données publiques ouvertes. Leur présence ne constitue ni un partenariat, ni une validation ou un endossement de South(s) Mobility DataHub.", en: "These institutions are cited as sources of open public data. Their presence does not constitute a partnership, endorsement, or validation of South(s) Mobility DataHub." }, lang)}</Prose>
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
      ? { backgroundColor: 'var(--ink)', color: '#FFFDF9', borderColor: 'var(--ink)', borderRadius: 999 }
      : { backgroundColor: 'transparent', color: 'var(--ink-soft)', borderColor: 'var(--rule)', borderRadius: 999 }}
  >
    {children}
  </button>
);

// Dossier d'une affirmation : citation, verdict, donnees, puis l'appareil critique.
const EvidenceDossier = ({ fiche, lang, onBack, showBack }) => {
  const t = tierOf(fiche.confidence_level);
  const VerdictIcon = t.Icon;
  const CatIcon = evidenceCategoryIcons[fiche.category.fr] || Globe;
  const L = faireL(lang);
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{tr(fiche.category, lang)}</span>
        </div>

        <blockquote
          className="font-serif font-bold text-xl md:text-2xl leading-snug text-slate-900 ps-4"
          style={{ borderLeft: '2px solid var(--rule-strong)' }}
        >
          {tr(fiche.narrative, lang)}
        </blockquote>

        <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <RobustnessMeter level={fiche.confidence_level} />
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: t.color }}>
            <VerdictIcon className="w-3.5 h-3.5" /> {tr(fiche.verdict, lang)}
          </span>
        </div>
      </header>

      <div className="px-6 md:px-8 py-6" style={{ backgroundColor: 'var(--paper-sunk)', borderTop: '1px solid var(--rule)' }}>
        <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--accent-deep)' }}>
          {L("Ce que montrent les donn\u00e9es", "What data shows")}
        </h4>
        <Prose className="text-[15px] leading-relaxed text-slate-800" lang={lang}>{tr(fiche.reality, lang)}</Prose>
      </div>

      <div className="px-6 md:px-8 py-6 space-y-6">
        {fiche.why_persists && tr(fiche.why_persists, lang).length > 0 && (
          <section>
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {isSubstantiated
                ? L("Pourquoi cette r\u00e9alit\u00e9 reste peu visible", "Why this reality is under-recognized")
                : L("Pourquoi ce narratif persiste", "Why this narrative persists")}
            </h4>
            <ul className="space-y-1.5">
              {tr(fiche.why_persists, lang).map((reason, i) => (
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
              {tr(fiche.indicators, lang).map((ind, i) => (
                <li key={i} className="text-xs text-slate-700 py-1.5" style={{ borderBottom: '1px solid var(--rule)' }}>{ind}</li>
              ))}
            </ul>
          </section>
          <section>
            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Landmark className="w-3 h-3" /> {L("Sources", "Sources")}
            </h4>
            <ul className="space-y-1">
              {tr(fiche.sources, lang).map((src, i) => (
                <li key={i} className="text-xs font-medium py-1.5" style={{ color: 'var(--accent-2)', borderBottom: '1px solid var(--rule)' }}>{src}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="pt-4" style={{ borderTop: '1px solid var(--rule)' }}>
          <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" /> {L("Limites m\u00e9thodologiques", "Methodological limits")}
          </h4>
          <Prose className="text-xs text-slate-500 italic leading-relaxed" lang={lang}>{tr(fiche.limits, lang)}</Prose>
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
    return found ? tr(found.category, lang) : key;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evidenceCheckData
      .filter(f => activeCategory === 'All' || f.category.fr === activeCategory)
      .filter(f => activeTier === 'All' || f.confidence_level === activeTier)
      .filter(f => !q
        || tr(f.narrative, lang).toLowerCase().includes(q)
        || tr(f.reality, lang).toLowerCase().includes(q)
        || tr(f.category, lang).toLowerCase().includes(q))
      .sort((a, b) => {
        if (sortMode === 'theme') {
          const c = tr(a.category, lang).localeCompare(tr(b.category, lang));
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
    return sample ? tr(sample.verdict, lang) : level;
  };
  const L = faireL(lang);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.evidence.badge}
        plate={"Pl. III"}
        plain={text.headers.evidence.plain}
        lang={lang}
        title={text.headers.evidence.title}
        highlight={text.headers.evidence.highlight}
        desc={text.headers.evidence.desc}
        icon={Search}
      />

      <BarreSection lang={lang} />

      {/* Note de provenance : les affirmations sont de l'auteur, les donnees ne le sont pas. */}
      <div className="bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <Prose className="text-xs text-amber-800 leading-relaxed" lang={lang}>{L(
            "Les affirmations examin\u00e9es ci-dessous sont formul\u00e9es par l'auteur pour illustrer des perceptions et discours courants sur les migrations africaines. Elles reformulent des perceptions, sans reprendre les mots d'un m\u00e9dia ou d'une institution identifi\u00e9s ; seules les sections \u00ab Ce que montrent les donn\u00e9es \u00bb sont sourc\u00e9es aupr\u00e8s d'institutions v\u00e9rifiables (voir Sources).",
            "The claims examined below are formulated by the author to illustrate common perceptions and discourse about African migration. They are not direct quotes from identified media outlets or institutions: only the \"What data shows\" sections are sourced from verifiable institutions (see Sources)."
          )}</Prose>
      </div>

      {/* Barre de recherche et de tri du registre */}
      <div className="bg-white border border-slate-200 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={L('Rechercher parmi les affirmations v\u00e9rifi\u00e9es', 'Search the fact-checked claims')}
              placeholder={L("Rechercher une affirmation, une donn\u00e9e, un th\u00e8me\u2026", "Search a claim, a figure, a theme\u2026")}
              className="w-full ps-9 pe-3 py-2.5 text-sm bg-transparent border border-slate-200 focus:outline-none"
              style={{ borderRadius: 999 }}
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 me-1">
              {L("Robustesse", "Robustness")}
            </span>
            <FilterChip active={activeTier === 'All'} onClick={() => setActiveTier('All')}>
              {L("Toutes", "All")}
            </FilterChip>
            {tierFilters.map(lv => (
              <FilterChip key={lv} active={activeTier === lv} onClick={() => setActiveTier(lv)}>
                <RobustnessMeter level={lv} className="me-1.5" /> {tierName(lv)}
              </FilterChip>
            ))}
          </div>

          {/* Deux entrees dans le meme corpus : par robustesse ou par theme */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 me-1">
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
              style={{ borderRadius: 999 }}
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
          <Prose className="text-sm text-slate-500" lang={lang}>{L("Aucune affirmation ne correspond \u00e0 cette recherche.", "No claim matches this search.")}</Prose>
        </div>
      ) : (
        <>
        {/* ------- Parcours en cartes -------
            Le registre donne la vue d'ensemble, le dossier donne la lecture ;
            entre les deux il manquait le feuilletage. Le rail suit les memes
            filtres que la liste et designe la meme fiche. */}
        {results.length > 1 && (
          <RailCartes
            lang={lang}
            className="mb-8 print:hidden"
            etiquette={L(
              `Feuilleter — ${results.length} affirmation${results.length > 1 ? 's' : ''}`,
              `Browse — ${results.length} claim${results.length > 1 ? 's' : ''}`
            )}
          >
            {results.map((f) => {
              const t = tierOf(f.confidence_level);
              const CatIcon = evidenceCategoryIcons[f.category.fr] || Globe;
              const isSel = selected && selected.id === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedId(f.id)}
                  aria-current={isSel ? 'true' : undefined}
                  className="lift text-start bg-white border p-4 flex flex-col gap-3"
                  style={{
                    borderColor: isSel ? 'var(--accent)' : 'var(--rule)',
                    borderInlineStartWidth: '3px',
                    borderInlineStartColor: t.color,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <RobustnessMeter level={f.confidence_level} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
                      {tr(f.category, lang)}
                    </span>
                    <CatIcon className="w-3.5 h-3.5 shrink-0 ms-auto" style={{ color: 'var(--rule-strong)' }} aria-hidden="true" />
                  </span>
                  <span className="block text-[13px] leading-snug text-slate-800 font-medium">
                    {tr(f.narrative, lang)}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--accent-deep)' }}>
                    {L('Ouvrir le dossier', 'Open the file')}
                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </RailCartes>
        )}

        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start print:hidden">

          {/* ------- Registre ------- */}
          <div className={`lg:col-span-5 ${selected ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-white border border-slate-200">
              <div className="px-4 py-2.5 border-b border-slate-200 flex items-baseline justify-between gap-3">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  {L("Registre des affirmations", "Register of claims")}
                </span>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 text-end">
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
                            <CatIcon className="w-3 h-3" /> {tr(f.category, lang)}
                          </span>
                          <span className="text-[10px] font-bold tabular-nums text-slate-500">{groupSize}</span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedId(f.id)}
                        aria-current={isSel ? 'true' : undefined}
                        className="evidence-row w-full text-start flex gap-3 px-4 py-3.5"
                        style={isSel ? { backgroundColor: 'var(--paper-sunk)' } : undefined}
                      >
                        <span className="block w-[3px] shrink-0 self-stretch" style={{ backgroundColor: t.color }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 mb-1.5">
                            <RobustnessMeter level={f.confidence_level} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 truncate">
                              {tr(f.category, lang)}
                            </span>
                          </span>
                          <span className="block text-[13px] leading-snug text-slate-800 font-medium">
                            {tr(f.narrative, lang)}
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
                <Prose className="text-sm text-slate-500" lang={lang}>{L("S\u00e9lectionnez une affirmation dans le registre.", "Select a claim from the register.")}</Prose>
              </div>
            )}
          </div>
        </div>
        </>
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
  const L = faireL(lang);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (tr(c.name, lang) || c.name?.fr || ''));
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
    return tr({ fr: t.replace('.', ','), en: t }, lang);
  };
  const W = 560, H = 360, PAD = 44;
  const x = (g) => PAD + ((g - 1) / 53) * (W - PAD - 14);
  const y = (a) => H - PAD - (a / 100) * (H - PAD - 16);
  const tone = (a) => (a >= 6 ? 'var(--ok)' : a >= 5 ? 'var(--warn-ink)' : a >= 4 ? 'var(--accent)' : 'var(--bad)');

  return (
    <Chapitre lang={lang}>
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
          <Prose className="text-justify" lang={lang}>{L(
              "La plateforme porte trois mesures indépendantes pour chacun des 54 États : la qualité de gouvernance mesurée par l'Indice Ibrahim, l'ouverture effective des frontières mesurée par l'indice AVOI, et le nombre d'instruments continentaux ratifiés. On peut donc tester ce que l'on suppose souvent sans le vérifier : est-ce que mieux gouverner, c'est plus ouvrir ? Et est-ce que signer, c'est ouvrir ?",
              'The platform holds three independent measures for each of the 54 states: governance quality as measured by the Ibrahim Index, effective border openness as measured by the AVOI, and the number of continental instruments ratified. That makes it possible to test what is often assumed without checking: does governing better mean opening more? And does signing mean opening?'
            )}</Prose>
  
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
          <Prose className="text-[11px]" style={{ color: 'var(--label)' }} lang={lang}>{L(
              "Corrélations de rang de Spearman, ex aequo traités par rang moyen. Un coefficient proche de zéro signifie que connaître l'une des deux mesures n'apprend rien sur l'autre.",
              'Spearman rank correlations, ties handled by average rank. A coefficient close to zero means that knowing one measure tells you nothing about the other.'
            )}</Prose>
  
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
                      <th className="text-start font-semibold px-3 py-2 text-slate-700">{L('Pays', 'Country')}</th>
                      <th className="px-2 py-2 font-semibold text-slate-700 text-end">{L('Gouvernance', 'Governance')}</th>
                      <th className="px-2 py-2 font-semibold text-slate-700 text-end">AVOI</th>
                      <th className="px-3 py-2 font-semibold text-slate-700 text-end">{L('Ancrage', 'Anchoring')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...d.pts].sort((a, b) => a.rank - b.rank).map(p => (
                      <tr key={p.iso2 || p.n} className="figure-row">
                        <td className="px-3 py-1.5 text-slate-800 whitespace-nowrap">{p.n}</td>
                        <td className="px-2 py-1.5 text-end tabular-nums text-slate-600">{p.rank}/54</td>
                        <td className="px-2 py-1.5 text-end tabular-nums text-slate-600">{p.avoi}</td>
                        <td className="px-3 py-1.5 text-end tabular-nums font-bold" style={{ color: tone(p.anchor) }}>{p.anchor}/6</td>
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
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                `Mieux gouverner va bien avec plus ouvrir : le lien existe, modéré mais net. En revanche, la qualité de gouvernance ne dit rien de l'ancrage juridique, et — résultat le plus net — l'ouverture effective des frontières ne dit rien des ratifications, ni l'inverse. Les États qui ouvrent et ceux qui signent forment deux groupes distincts. Le Rwanda est le seul à faire les deux pleinement. Les Seychelles ouvrent totalement tout en n'ayant ratifié que quatre instruments sur six ; le Botswana et le Lesotho sont bien gouvernés et fermés ; le Burundi et le Mozambique ouvrent largement avec une gouvernance mal classée. L'ouverture n'est donc ni un effet de la capacité administrative, ni la conséquence d'un engagement juridique : c'est une décision souveraine, prise instrument par instrument et frontière par frontière. C'est exactement ce que décrit l'entre-deux national (Ben Mokhtar, 2026).`,
                `Governing better does go with opening more: the relationship exists, moderate but clear. Governance quality, however, says nothing about legal anchoring — and, the sharpest result, effective border openness says nothing about ratifications, nor the reverse. The states that open and the states that sign form two distinct groups. Rwanda alone does both fully. Seychelles opens completely while having ratified only four instruments out of six; Botswana and Lesotho are well governed and closed; Burundi and Mozambique open widely with poorly ranked governance. Openness is therefore neither a product of administrative capacity nor a consequence of legal commitment: it is a sovereign decision, taken instrument by instrument and border by border. That is precisely what the national in-between describes (Ben Mokhtar, 2026).`
              )}</Prose>
            <Prose className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }} lang={lang}>{L(
                "Une corrélation de rang ne dit rien d'une causalité, et l'IIAG comme l'AVOI sont des indices composites dont la construction porte ses propres choix. Le résultat qui compte ici est négatif — l'absence de lien — et c'est le type de résultat le plus robuste à ces réserves.",
                'A rank correlation says nothing about causation, and both the IIAG and the AVOI are composite indices whose construction carries its own choices. The result that matters here is a negative one — the absence of a relationship — and that is the kind of result most robust to those caveats.'
              )}</Prose>
          </div>
        </div>
  
        <div className="px-6 md:px-8 pb-5">
          <Sources lang={lang} items={[
            { label: tr(IIAG_SOURCE.label, lang), url: IIAG_SOURCE.url },
            { label: L('BAD & CUA — Indice d\'ouverture des visas (AVOI)', 'AfDB & AUC — Africa Visa Openness Index (AVOI)'),
              url: 'https://www.visaopenness.org/' },
          ]} />
        </div>
      </section>
    </Chapitre>
  );
};

const AnchoringMatrix = ({ lang }) => {
  const L = faireL(lang);
  const [sortBy, setSortBy] = useState('score');

  const rows = useMemo(() => {
    const all = Object.values(countryData).flat().filter(c => c.au_treaties);
    return all.map(c => ({
      // c.name est bilingue : on retient le libelle de la langue courante.
      name: typeof c.name === 'string' ? c.name : (tr(c.name, lang) || c.name?.fr || ''),
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
    <Chapitre lang={lang}>
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
          <Prose className="text-justify" lang={lang}>{L(
              "Adhérer à l'Union est une chose, s'engager sur la mobilité des personnes en est une autre. En rangeant les six instruments continentaux du plus consensuel au plus contraignant, on obtient une courbe de décrochage : l'appartenance est unanime, la libre circulation ne l'est presque pas.",
              'Joining the Union is one thing; committing on the mobility of persons is another. Ordering the six continental instruments from the most consensual to the most binding produces a curve of attrition: membership is unanimous, free movement almost non-existent.'
            )}</Prose>
  
          {/* Courbe de decrochage */}
          <div className="space-y-2.5">
            {totals.map((i, idx) => (
              <div key={i.key} className="flex items-center gap-3">
                <span className="text-[11px] font-semibold w-40 shrink-0 leading-snug text-slate-700">{tr(i.short, lang)}</span>
                <div className="flex-1 h-5 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <div
                    className={`h-full bar-fill bar-fill--d${Math.min(5, idx + 1)}`}
                    style={{
                      width: `${(i.n / total) * 100}%`,
                      backgroundColor: i.n >= 46 ? 'var(--ok)' : i.n >= 30 ? 'var(--warn)' : 'var(--bad)',
                    }}
                  />
                </div>
                <span className="text-xs font-bold w-16 text-end shrink-0 tabular-nums text-slate-800">
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
            <Prose className="text-[13px] leading-relaxed text-justify" style={{ color: 'var(--ink-soft)' }} lang={lang}>{L(
                `${asym.refOnly.length} États ont ratifié la Convention de l'OUA de 1969 — celle qui protège le réfugié venu d'ailleurs — sans ratifier la Convention de Kampala, celle qui protège leur propre population déplacée à l'intérieur des frontières. L'inverse ne se produit que dans ${asym.kampOnly.length} cas. La protection s'arrête donc plus souvent à la frontière qu'elle ne la franchit — alors que le déplacement interne est, en Afrique, la forme de mobilité forcée la plus massive (Ben Mokhtar, 2026).`,
                `${asym.refOnly.length} states have ratified the 1969 OAU Convention — which protects the refugee arriving from elsewhere — without ratifying the Kampala Convention, which protects their own population displaced inside their borders. The reverse occurs in only ${asym.kampOnly.length} cases. Protection therefore stops at the border more often than it crosses it — while internal displacement is, in Africa, the most massive form of forced mobility (Ben Mokhtar, 2026).`
              )}</Prose>
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
                    <th className="text-start font-semibold px-3 py-2 text-slate-700 whitespace-nowrap">{L('Pays', 'Country')}</th>
                    {ANCHOR_INSTRUMENTS.map(i => (
                      <th key={i.key} className="px-2 py-2 font-semibold text-slate-700 text-center whitespace-nowrap"
                          title={tr(i.full, lang)}>
                        {tr(i.short, lang)}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-semibold text-slate-700 text-end whitespace-nowrap">{L('Score', 'Score')}</th>
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
                                title={`${tr(i.full, lang)} — ${r.t[i.key] ? L('ratifié', 'ratified') : L('non ratifié', 'not ratified')}`} />
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-end font-bold tabular-nums"
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
          <Prose className="text-[11px] leading-relaxed text-slate-600 text-justify" lang={lang}>{L(
              "Matrice constituée par l'auteur d'après les listes de ratification de l'Union africaine. La colonne ZLECAf a été reprise en août 2026 sur la liste nominative de tralac et de l'UA : 48 États ont déposé leur instrument. Les six qui manquent sont l'Érythrée, non signataire ; le Bénin, la Libye, le Soudan et le Soudan du Sud, dont la ratification n'est pas approuvée ; et la Somalie, qui a approuvé sans déposer. Le Liberia et Madagascar, marqués non-ratifiants à tort, ont été corrigés. La colonne Kampala a été reprise sur la liste de statut officielle de l'UA arrêtée au 8 juillet 2024, qui donne 33 ratifications et 33 dépôts. Sao Tomé-et-Principe, marqué non-ratifiant à tort, a été corrigé. La matrice concorde avec les listes de l'UA, État par État.",
              "Matrix compiled by the author from African Union ratification lists. The AfCFTA column was revised in August 2026 against the named list from tralac and the AU: 48 states have deposited their instrument. The six outstanding are Eritrea, not a signatory; Benin, Libya, Sudan and South Sudan, whose ratification is not approved; and Somalia, which approved without depositing. Liberia and Madagascar, wrongly marked as non-ratifiers, have been corrected. The Kampala column was revised against the AU's official status list as at 8 July 2024, which records 33 ratifications and 33 deposits. Sao Tome and Principe, wrongly marked as a non-ratifier, has been corrected. The matrix matches the AU lists state by state."
            )}</Prose>
        </div>
      </section>
    </Chapitre>
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
  const L = faireL(lang);
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
const TabForced = ({ text, lang, children }) => {
  const L = faireL(lang);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (tr(c.name, lang) || c.name?.fr || ''));

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
            <span className="text-xs font-bold w-24 text-end shrink-0 tabular-nums text-slate-800">{fmt(r.v)}</span>
            {unitTotal ? (
              <span className="text-[10px] w-12 text-end shrink-0 tabular-nums" style={{ color: 'var(--label)' }}>
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

      <BarreSection lang={lang} />
      {children}

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
          <Prose className="lede" lang={lang}>{L(
              "Parler de « migration » pour désigner l'ensemble des mobilités africaines efface la distinction qui compte le plus en droit. Celle qui sépare la personne qui choisit de partir de celle qui y est contrainte. Or, parmi les contraintes, le droit distingue encore selon qu'une frontière internationale a été franchie. Cette frontière décide de tout : du statut, de l'institution compétente, du financement, et même de la visibilité statistique.",
              'Speaking of "migration" for all African mobility erases the distinction that matters most in law: between the person who chooses to leave and the person compelled to. And among the compelled, law still distinguishes according to whether an international border was crossed — and that border decides everything: status, competent institution, funding, and even statistical visibility.'
            )}</Prose>
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
        <Prose className="text-sm text-slate-500 leading-relaxed max-w-4xl mb-6" lang={lang}>{L(
            "Calculé sur la base pays de la plateforme. Le déplacement interne lié aux conflits est extrêmement concentré : une poignée d'États porte l'essentiel du total continental.",
            'Computed from the platform country base. Conflict-related internal displacement is extremely concentrated: a handful of states carries most of the continental total.'
          )}</Prose>

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
            "L'apatridie recensée sur le continent est écrasée par un seul pays. Ce chiffre a une histoire : la Côte d'Ivoire concentre l'héritage des migrations de main-d'œuvre coloniales et post-coloniales dont les descendants n'ont jamais obtenu de nationalité. Ailleurs, l'apatridie est probablement sous-recensée plutôt qu'absente — elle ne se compte que là où un État accepte de la mesurer.",
            "Recorded statelessness on the continent is dominated by a single country. That figure has a history: Côte d'Ivoire concentrates the legacy of colonial and post-colonial labour migrations whose descendants never obtained nationality. Elsewhere statelessness is likely under-recorded rather than absent — it is only counted where a state agrees to measure it."
          )}
        />

        {/* Ce qu'un etat instantane masquait : la pente sur dix ans. */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--rule)' }}>
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
            {L('Une décennie de bascule (HCR, 2014 → 2024)', 'A decade of shift (UNHCR, 2014 → 2024)')}
          </h3>
          <Prose className="text-xs text-slate-500 mb-4" lang={lang}>{L('Périmètre : les pays africains couverts par la base du HCR.', 'Perimeter: the African countries covered by the UNHCR base.')}</Prose>
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
                    <span className="text-[11px] font-bold tabular-nums ms-auto" style={{ color: mult >= 2 ? 'var(--bad)' : 'var(--ink-soft)' }}>
                      ×{mult.toFixed(1).replace('.', tr({ fr: ',', en: '.' }, lang))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify mt-4" lang={lang}>{L(
              "En dix ans, le nombre de personnes déplacées dans leur propre pays et suivies par le HCR a plus que triplé sur le continent. Les réfugiés, eux — ceux qui franchissent une frontière —, ont un peu plus que doublé. La mobilité forcée africaine ne s'internationalise donc pas : elle s'intensifie à l'intérieur des frontières. C'est exactement la population que les statistiques migratoires ne comptent pas, et celle dont le traité qui la protège attend encore ses ratifications.",
              "In a decade, the number of people displaced inside their own country and monitored by UNHCR has more than tripled on the continent. Refugees — those who cross a border — have a little more than doubled. African forced mobility is therefore not internationalising: it is intensifying within borders. That is precisely the population migration statistics do not count, and the one whose protecting treaty is still awaiting ratifications."
            )}</Prose>
        </div>

        <Prose className="text-[10px] italic mt-6 pt-3" style={{ color: 'var(--label)', borderTop: '1px solid var(--rule)' }} lang={lang}>{L(
            "Sources : IDMC (Global Report on Internal Displacement) pour le déplacement interne par cause, intégré à la base pays ; HCR (Refugee Data Finder, API publique) pour les réfugiés, demandeurs d'asile, apatrides et déplacés internes suivis. Les totaux de déplacés internes des deux institutions diffèrent — périmètres de suivi et méthodes distincts. Les deux sont affichés plutôt qu'harmonisés.",
            'Sources: IDMC (Global Report on Internal Displacement) for internal displacement by cause, integrated into the country base; UNHCR (Refugee Data Finder, public API) for refugees, asylum seekers, stateless persons and monitored IDPs. The two institutions\' IDP totals differ — distinct monitoring perimeters and methods. Both are shown rather than reconciled.'
          )}</Prose>
      </Reveal>

      {/* Solutions durables */}
      <Reveal delay={50} className="bg-white border border-slate-200 p-8 md:p-10">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-4">
          {L('Sortir du déplacement : trois issues, rarement atteintes', 'Leaving displacement: three exits, rarely reached')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger">
          {[
            { t: L('Rapatriement volontaire', 'Voluntary repatriation'), d: L("Le retour au pays d'origine, librement consenti et dans la sécurité. Suppose que la cause du départ ait cessé — condition rarement réunie dans les situations prolongées.", 'Return to the country of origin, freely consented and in safety. Presupposes that the cause of flight has ceased — a condition rarely met in protracted situations.') },
            { t: L('Intégration locale', 'Local integration'), d: L("L'installation durable dans le pays d'asile, avec accès à un statut, au travail et aux services. Fréquente dans les faits, rarement consacrée par le droit.", 'Durable settlement in the country of asylum, with access to status, work and services. Common in fact, seldom enshrined in law.') },
            { t: L('Réinstallation', 'Resettlement'), d: L("Le transfert vers un pays tiers. Les places offertes chaque année couvrent une fraction des besoins : un dispositif de protection ciblée.", 'Transfer to a third country. The places offered each year cover a fraction of the need: a targeted protection mechanism.') },
          ].map((x, i) => (
            <div key={i} className="border border-slate-200 p-5 lift">
              <span className="block font-serif font-bold text-slate-900 mb-2">{x.t}</span>
              <p className="text-xs text-slate-600 leading-relaxed text-justify">{x.d}</p>
            </div>
          ))}
        </div>
        <Prose className="text-sm text-slate-700 leading-relaxed text-justify max-w-4xl mt-6" lang={lang}>{L(
            "Tant qu'aucune des trois n'aboutit, la situation devient un déplacement prolongé : non plus une urgence, mais un régime d'attente institutionnalisé. La nuance n'est pas sémantique — elle décide du type de financement mobilisable, humanitaire et court d'un côté, développement et long de l'autre. Nommer une situation « prolongée » suppose toutefois de reconnaître une présence durable, ce que les États d'accueil hésitent souvent à faire. Voir le Glossaire.",
            'As long as none of the three is achieved, the situation becomes protracted displacement: no longer an emergency but an institutionalised regime of waiting. The nuance is not semantic — it decides what funding can be mobilised, humanitarian and short on one side, development and long on the other. Naming a situation "protracted" does, however, require acknowledging a lasting presence, which host states are often reluctant to do. See the Glossary.'
          )}</Prose>
      </Reveal>

      <PrintCitationFooter lang={lang} tab="mobilites" sectionLabel={L('Mobilités contraintes', 'Forced mobility')} />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Migration de travail. Le releve et la comparaison des ratifications OIT sont
// calcules en direct depuis la base pays ; le panneau des quatre editions
// reprend les chiffres publies par l'UA, l'OIT et l'OIM.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Les mobilites, en une seule section.
//
// « Mobilites contraintes » et « Migration de travail » vivaient separement.
// Les separer revenait a poser en entree du site la coupure volontaire /
// contraint — celle-la meme que le cadre theorique de la plateforme discute :
// de Haas place mobilite et immobilite sur un continuum d'aspirations et de
// capacites exercables, pas de part et d'autre d'une frontiere nette. Une
// personne qui part travailler parce que son exploitation a brule n'est ni tout
// a fait volontaire ni tout a fait deplacee.
//
// Les deux corpus restent distincts — ils ne decrivent pas la meme chose et
// leurs sources different — mais ils se lisent sous un meme toit, et l'on passe
// de l'un a l'autre sans revenir au menu. Aucun contenu n'a ete deplace : ce
// sont les memes composants, sous une entree commune.
const TabMobilites = ({ text, lang, volet, setVolet }) => {
  const L = faireL(lang);
  const volets = [
    { cle: 'contraintes', label: { fr: 'Mobilités contraintes', en: 'Forced mobility', ar: 'التنقلات القسرية' } },
    { cle: 'travail', label: { fr: 'Migration de travail', en: 'Labour migration', ar: 'هجرة العمل' } },
  ];
  // La bascule est passee en enfant au volet, qui la place sous son bandeau :
  // au-dessus du titre, elle flottait sans rien a quoi se rattacher.
  const bascule = (
    <nav className="flex flex-wrap gap-2 -mt-2 mb-2" aria-label={L('Volets de la section', 'Section panes', { ar: 'أقسام الصفحة' })}>
        {volets.map(v => (
          <button
            key={v.cle}
            type="button"
            onClick={() => setVolet(v.cle)}
            aria-pressed={volet === v.cle}
            className="couche-btn"
            data-actif={volet === v.cle ? 'true' : 'false'}
          >
            {tr(v.label, lang)}
          </button>
      ))}
    </nav>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {volet === 'travail'
        ? <TabLabour text={text} lang={lang}>{bascule}</TabLabour>
        : <TabForced text={text} lang={lang}>{bascule}</TabForced>}
    </div>
  );
};

const TabLabour = ({ text, lang, children }) => {
  const L = faireL(lang);
  const nm = (c) => (typeof c.name === 'string' ? c.name : (tr(c.name, lang) || c.name?.fr || ''));

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

  const fmt = (v) => (tr({ fr: String(v).replace('.', ','), en: String(v) }, lang));
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

      <BarreSection lang={lang} />
      {children}

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
          <Prose className="text-justify" lang={lang}>{L(
              "Le rapport continental sur les statistiques de migration de travail en est à sa quatrième édition. Lues ensemble, les deux dernières disent la même chose sur le fond — la mobilité intra-africaine est massivement une mobilité de travail — et deux choses différentes sur les chiffres. C'est cette double lecture qui est instructive.",
              "The continental report on labour migration statistics is now in its fourth edition. Read together, the last two say the same thing in substance — intra-African mobility is overwhelmingly labour mobility — and two different things in figures. It is that double reading which is instructive."
            )}</Prose>

          {/* Releve comparatif : uniquement les points effectivement publies. */}
          <div className="bg-white border border-slate-200 overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--paper-sunk)' }}>
                  <th className="text-start font-semibold px-4 py-2.5 text-slate-700">{L("Indicateur", "Indicator")}</th>
                  <th className="text-end font-semibold px-4 py-2.5 text-slate-700 whitespace-nowrap">{L("3e éd. — 2019", "3rd ed. — 2019")}</th>
                  <th className="text-end font-semibold px-4 py-2.5 text-slate-700 whitespace-nowrap">{L("4e éd. — 2022", "4th ed. — 2022")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tr({ fr: [
                  ["Travailleurs migrants internationaux", "14,5 M (9,5 M en 2010)", "13,1 M (9,3 M en 2010)"],
                  ["Migrants en âge de travailler", "20,2 M — 77 % des migrants", "20,4 M — au moins 78 %"],
                  ["Part dans la population active", "72 %", "64 %"],
                  ["Part des femmes parmi les travailleurs migrants", "38 % en moyenne", "37 % en moyenne"],
                  ["Concentration régionale", "—", "Ouest, Est et Sud : 76 % des travailleurs migrants"],
                  ["Envois de fonds — régions dominantes", "Nord 43 % + Ouest 39 % = 82 %", "Nord 45 % + Ouest 34 % = 79 %"],
                ], en: [
                  ["International migrant workers", "14.5 M (9.5 M in 2010)", "13.1 M (9.3 M in 2010)"],
                  ["Working-age migrants", "20.2 M — 77% of migrants", "20.4 M — at least 78%"],
                  ["Share in the labour force", "72%", "64%"],
                  ["Women among migrant workers", "38% on average", "37% on average"],
                  ["Regional concentration", "—", "West, East and Southern: 76% of migrant workers"],
                  ["Remittances — leading regions", "North 43% + West 39% = 82%", "North 45% + West 34% = 79%"],
                ] }, lang)).map(([k, a, b], i) => (
                  <tr key={i}>
                    <td className="px-4 py-2.5 text-slate-700">{k}</td>
                    <td className="px-4 py-2.5 text-end tabular-nums text-slate-600 whitespace-nowrap">{a}</td>
                    <td className="px-4 py-2.5 text-end tabular-nums font-semibold text-slate-900 whitespace-nowrap">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {L("Ce que la révision de la série nous apprend", "What the revision of the series tells us")}
            </h4>
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                "Le point de départ lui-même a bougé : 9,5 millions de travailleurs migrants en 2010 selon la 3e édition, 9,3 millions selon la 4e. Il s'agit d'une révision : méthodologie affinée, davantage d'États déclarants, séries recalculées. La 4e édition documente d'ailleurs le décrochage de 2020 (croissance tombée à 0,67 %, effet de la pandémie sur la mobilité) que la précédente ne pouvait pas voir. Une plateforme de données doit montrer ces révisions plutôt que de retenir le chiffre le plus commode : c'est précisément l'objet de l'harmonisation que vise SHaSA.",
                "The starting point itself moved: 9.5 million migrant workers in 2010 according to the 3rd edition, 9.3 million according to the 4th. This is a revision: refined methodology, more reporting states, recomputed series. The 4th edition also documents the 2020 break (growth down to 0.67%, the pandemic's effect on mobility) that the previous one could not see. A data platform should show such revisions rather than retain the most convenient figure: that is exactly what SHaSA's harmonisation is for."
              )}</Prose>
          </div>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {L("Là où la donnée manque vraiment", "Where the data really runs out")}
            </h4>
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                "Pour établir les caractéristiques d'emploi des migrants, la 3e édition n'a pu s'appuyer que sur dix États déclarants sur cinquante-quatre — Cabo Verde, Cameroun, Tchad, Égypte, Liberia, Mali, Namibie, Niger, Nigeria, Seychelles. C'est sur cette base que l'on sait que l'agriculture, la sylviculture et la pêche employaient 27,5 % des travailleurs migrants recensés. Le chiffre est solide pour ces dix pays ; il ne l'est pas pour le continent. Le déficit n'est donc pas dans la production de données brutes, il est dans la chaîne de remontée et d'harmonisation (Ben Mokhtar, 2026).",
                "To establish migrants' employment characteristics, the 3rd edition could draw on only ten reporting states out of fifty-four — Cabo Verde, Cameroon, Chad, Egypt, Liberia, Mali, Namibia, Niger, Nigeria, Seychelles. It is on that basis that agriculture, forestry and fishing are known to have employed 27.5% of the migrant workers recorded. The figure is sound for those ten countries; it is not sound for the continent. The deficit therefore sits in the reporting and harmonisation chain rather than in producing raw data (Ben Mokhtar, 2026)."
              )}</Prose>
          </div>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {L("Le lien avec la libre circulation et la ZLECAf", "The link with free movement and the AfCFTA")}
            </h4>
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
                "La 4e édition établit elle-même le lien. L'augmentation du nombre de travailleurs migrants « pourrait être liée à l'assouplissement des restrictions migratoires et à la mise en œuvre des dispositions de libre circulation entre pays africains ». Elle en donne un cas mesuré — au sein de la Communauté d'Afrique de l'Est, les travailleurs migrants passent de 1,14 million en 2008 à 2,69 millions en 2019. Et elle constate que l'Ouest, l'Est et le Sud, où les protocoles CEDEAO, CAE et SADC fonctionnent, concentrent 77,3 % des migrants internationaux du continent.",
                "The 4th edition draws the link itself: the rise in migrant worker numbers \"might be linked to relaxed migration restrictions and to the implementation of free movement provisions between African countries\". It gives one measured case — within the East African Community, migrant workers rise from 1.14 million in 2008 to 2.69 million in 2019. And it notes that West, East and Southern Africa, where the ECOWAS, EAC and SADC protocols operate, concentrate 77.3% of the continent's international migrants."
              )}</Prose>
            <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify mt-3" lang={lang}>{L(
                "Le paradoxe documenté ailleurs sur cette plateforme prend ici sa mesure économique : la ZLECAf compte 48 ratifications sur 54, le Protocole sur la libre circulation des personnes 4 sur 54. Les marchandises ont obtenu leur cadre continental, les travailleurs qui les produisent ne l'ont pas. Là où la libre circulation existe malgré tout, elle a été conquise au niveau régional, et c'est à cette échelle que la mobilité de travail se mesure.",
                "The paradox documented elsewhere on this platform takes its economic measure here: the AfCFTA has 48 ratifications out of 54, the Protocol on Free Movement of Persons 4 out of 54. Goods obtained their continental framework; the workers who produce them did not. Where free movement nonetheless exists, it was won at regional level, and that is the scale at which labour mobility can be measured."
              )}</Prose>
          </div>

          <div className="p-5" style={{ backgroundColor: 'var(--warn-soft)', border: '1px solid #E4CFA4' }}>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--warn-ink)' }}>
              {L("Protection sociale : l'angle mort", "Social protection: the blind spot")}
            </h4>
            <Prose className="text-[13px] leading-relaxed text-justify" style={{ color: 'var(--warn-ink)' }} lang={lang}>{L(
                "La 4e édition rappelle que 19,1 % seulement de la population africaine bénéficie d'au moins une prestation de protection sociale (indicateur ODD 1.3.1). La moyenne mondiale est de 52,4 % — la première fois que la moitié de l'humanité est couverte. Un travailleur migrant cumule ce déficit continental et la non-portabilité de ses droits d'un pays à l'autre.",
                "The 4th edition recalls that only 19.1% of Africa's population is covered by at least one social protection benefit (SDG indicator 1.3.1), against 52.4% worldwide — the first time half of humanity is covered. A migrant worker compounds this continental deficit with the non-portability of entitlements across borders."
              )}</Prose>
          </div>
        </AfricanCounterpoint>
      </Reveal>

      {/* Les conventions de l'OIT : le meme motif que l'ancrage continental */}
      <Reveal delay={35}>
        <Chapitre lang={lang}>
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
              <Prose className="text-justify" lang={lang}>{L(
                  "Onze conventions de l'OIT posent le socle des droits d'un travailleur migrant. Liberté syndicale, négociation collective, abolition du travail forcé, âge minimum, pires formes de travail des enfants, égalité de rémunération, non-discrimination, sécurité et santé au travail. Ce sont celles-là qui comptent, bien plus que le nombre total de textes signés par le pays d'accueil. Le compte, pays par pays, donne un résultat net.",
                  "Eleven ILO conventions set the floor of a migrant worker's rights: freedom of association, collective bargaining, abolition of forced labour, minimum age, worst forms of child labour, equal remuneration, non-discrimination, occupational safety and health. Those are what count, far more than the total number of texts the host country has signed. Counted country by country, the result is stark."
                )}</Prose>
  
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
                      <span className="text-xs font-bold w-24 text-end shrink-0 tabular-nums text-slate-800">
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
                <Prose className="text-[13px] leading-relaxed text-justify" style={{ color: 'var(--ink-soft)' }} lang={lang}>{L(
                    `Le nombre total de conventions ratifiées varie de ${ilo.rows[ilo.rows.length - 1].total} à ${ilo.rows[0].total}, pour une moyenne de ${fmt(ilo.moyenne)}. Mais un total élevé ne garantit rien : plusieurs États figurant en tête du classement général n'ont pas le socle complet, tandis que Madagascar l'a intégralement avec un total bien plus modeste. C'est le même motif que celui observé sur les instruments continentaux — l'adhésion large précède, et parfois remplace, l'engagement contraignant (Ben Mokhtar, 2026).`,
                    `The total number of ratified conventions ranges from ${ilo.rows[ilo.rows.length - 1].total} to ${ilo.rows[0].total}, averaging ${fmt(ilo.moyenne)}. But a high total guarantees nothing: several states at the top of the overall ranking lack the complete fundamental floor, while Madagascar holds it in full with a far more modest total. It is the same pattern observed on continental instruments — broad accession precedes, and sometimes replaces, binding commitment (Ben Mokhtar, 2026).`
                  )}</Prose>
              </div>
  
              <div className="overflow-x-auto border border-slate-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--paper-sunk)' }}>
                      <th className="text-start font-semibold px-3 py-2 text-slate-700">{L('Pays', 'Country')}</th>
                      <th className="px-2 py-2 font-semibold text-slate-700 text-end">{L('Fondamentales', 'Fundamental')}</th>
                      <th className="px-2 py-2 font-semibold text-slate-700 text-end">{L('Gouvernance', 'Governance')}</th>
                      <th className="px-2 py-2 font-semibold text-slate-700 text-end">{L('Techniques', 'Technical')}</th>
                      <th className="px-3 py-2 font-semibold text-slate-700 text-end">{L('Total', 'Total')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ilo.rows.map(r => (
                      <tr key={r.n} className="figure-row">
                        <td className="px-3 py-1.5 text-slate-800 whitespace-nowrap">{r.n}</td>
                        <td className="px-2 py-1.5 text-end tabular-nums font-bold"
                            style={{ color: r.fund >= 11 ? 'var(--ok)' : r.fund >= 9 ? 'var(--warn-ink)' : 'var(--bad)' }}>
                          {r.fund}/11
                        </td>
                        <td className="px-2 py-1.5 text-end tabular-nums text-slate-600">{r.gov}</td>
                        <td className="px-2 py-1.5 text-end tabular-nums text-slate-600">{r.tech}</td>
                        <td className="px-3 py-1.5 text-end tabular-nums font-bold text-slate-900">{r.total}</td>
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
        </Chapitre>
      </Reveal>

      <PrintCitationFooter lang={lang} tab="mobilites" sectionLabel={L('Migration de travail', 'Labour migration')} />
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
      tag: tr({ fr: 'Ouverture standardisée & pionnière', en: 'Pioneering & standardized openness' }, lang),
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
        en: "The region shows the highest AVOI index of the eight RECs (0.629 in 2024, continental average: 0.501), driven by the 1979 Protocol. The effective withdrawal of Mali, Burkina Faso and Niger on 29 January 2025 brings the Community down to twelve members. ECOWAS nonetheless asked its remaining states to keep recognising the three countries' passports and ID cards, and to maintain visa-free movement for their nationals. The political exit is thereby decoupled from the mobility regime."
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
      tag: tr({ fr: 'Citoyenneté de marché & corridors', en: 'Market citizenship & corridors' }, lang),
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
        en: "An AVOI score of 0.504 in 2024 (above the 0.501 continental average), driven by Rwanda and Kenya. The Community moved from six to eight partner states in under two years: the DRC on 11 July 2022, then Somalia as a full member on 4 March 2024. This rapid enlargement extends the common market into security-complex areas, and the integration roadmaps are still under negotiation."
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
      tag: tr({ fr: 'Procéduralisation sectorielle & prudence', en: 'Sectoral approach & caution' }, lang),
      desc: {
        fr: "Face aux réticences souverainistes (notamment de l'Afrique du Sud), la SADC déploie une intégration asymétrique et sélective, privilégiant la gestion logistique des corridors et l'attraction des talents plutôt qu'une ouverture universelle.",
        en: "Faced with sovereign reluctance (notably from South Africa), SADC deploys an asymmetric and selective integration, prioritizing logistics corridor management and talent attraction over universal openness."
      },
      instruments: {
        fr: "Protocole de 2005, Plan sur la migration de travail (2020-2025). Processus consultatif : MIDSA (Dialogue sur la Migration pour l'Afrique Australe).",
        en: "2005 Protocol, Labour migration plan (2020-2025). Consultative process: MIDSA (Migration Dialogue for Southern Africa)."
      },
      dynamics: {
        fr: "Deuxième CER la plus ouverte du continent, avec un score AVOI de 0,547 en 2024 et en progression continue. L'Angola y contribue fortement : le pays a près de doublé le nombre de nationalités bénéficiant d'un accès sans visa fin 2023. L'espace reste néanmoins polarisé par Pretoria (réforme BMA et White Paper de 2024) ; l'innovation passe aussi par des accords bilatéraux (ex : carte d'identité commune Botswana-Namibie).",
        en: "The second-most open REC on the continent, with an AVOI score of 0.547 in 2024 and a continuing upward trend. Angola contributes strongly: it nearly doubled the number of nationalities granted visa-free access in late 2023. The space remains polarized by Pretoria (BMA reform and 2024 White Paper); innovation also comes through bilateral agreements (e.g. the joint Botswana-Namibia ID card)."
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
      tag: tr({ fr: 'Facilitation macro-régionale', en: 'Macro-regional facilitation' }, lang),
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
      tag: tr({ fr: 'Nexus sécurité-climat-mobilité', en: 'Security-climate-mobility nexus' }, lang),
      desc: {
        fr: "Dans une Corne de l'Afrique marquée par les conflits et les chocs climatiques, la mobilité est saisie par l'IGAD à l'articulation exacte entre sécurité régionale, transhumance de survie et développement.",
        en: "In a Horn of Africa marked by conflicts and climate shocks, mobility is captured by IGAD at the exact articulation between regional security, survival transhumance, and development."
      },
      instruments: {
        fr: "Deux protocoles pionniers en 2020 : Libre circulation des personnes ET Transhumance pastorale transfrontalière. Processus consultatif : MIDIGAD.",
        en: "Two pioneering protocols in 2020: Free movement of persons AND Cross-border pastoral transhumance. Consultative process: MIDIGAD."
      },
      dynamics: {
        fr: "Un score AVOI de 0,376 en 2024, nettement sous la moyenne continentale de 0,501, et parmi les plus bas du continent. L'homogénéisation de l'ouverture reste suspendue à l'instabilité géopolitique chronique de la sous-région, guerre au Soudan comprise. L'Érythrée a notifié son retrait formel en décembre 2025, deux ans seulement après son retour dans l'organisation en juin 2023. L'Autorité revient ainsi à sept membres, ce qui dit la fragilité du multilatéralisme régional dans la Corne.",
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
      tag: tr({ fr: 'Configuration à deux étages', en: 'Two-tier configuration' }, lang),
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
      tag: tr({ fr: 'Normativité d’horizon & gel institutionnel', en: 'Horizon normativity & institutional freeze' }, lang),
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
      tag: tr({ fr: 'Coordination sécuritaire de surcouche transrégionale', en: 'Transregional security overlay coordination' }, lang),
      desc: {
        fr: "Avec 24 États membres, qui englobent plusieurs autres CER, la CEN-SAD tient davantage du forum politique et sécuritaire que du régime juridique autonome de libre circulation. Son traité fondateur inscrit pourtant la libre circulation des personnes parmi ses objectifs centraux.",
        en: "With 24 member states, which overlap several other RECs, CEN-SAD is more a political and security forum than an autonomous legal regime of free movement. Its founding treaty nonetheless lists free movement of persons among its core objectives."
      },
      instruments: {
        fr: "Traité de 1998 (révisé 2013). La libre circulation des personnes figure parmi les objectifs fondateurs, sans protocole dédié équivalent à ceux de la CEDEAO ou de l'IGAD.",
        en: "1998 Treaty (revised 2013). Free movement of persons is listed among the founding objectives, without a dedicated protocol equivalent to those of ECOWAS or IGAD."
      },
      dynamics: {
        fr: "Score AVOI de 0,519 en 2024, au-dessus de la moyenne continentale (0,501), mais en léger recul par rapport à 2023 où elle occupait la deuxième place ex æquo avec la SADC. Le chevauchement géographique avec la CEDEAO explique une part de cette ouverture. Plusieurs membres de la CEN-SAD ont assoupli leur circulation régionale sous l'effet d'engagements pris ailleurs, plus que par une dynamique propre. La Communauté était institutionnellement en sommeil depuis le conflit libyen de 2011, son secrétariat replié à N'Djamena. Elle a rouvert son siège de Tripoli en avril 2026, devant onze ministres des Affaires étrangères des États membres. Les effets opérationnels de cette réactivation restent à observer.",
        en: "AVOI score of 0.519 in 2024, above the continental average (0.501), though slightly down from 2023 when it held joint second place with SADC. The significant geographic overlap with ECOWAS explains part of this openness: several CEN-SAD members eased regional movement due to commitments made elsewhere, more than through a dynamic specific to CEN-SAD itself. The Community lay institutionally dormant after the 2011 Libyan conflict, its secretariat having relocated to N'Djamena. It reopened its Tripoli headquarters in April 2026, in the presence of eleven member-state foreign ministers. The operational effects of that reactivation remain to be seen."
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
        fr: "Adopté en 2015, c'est le grand parapluie stratégique de l'Union. Son Second Plan Décennal de Mise en Œuvre (STYIP) fait de la libre circulation un levier de développement.",
        en: "Adopted in 2015, it is the Union's overarching strategic umbrella. Its Second Ten-Year Implementation Plan (STYIP) makes free movement a lever of development."
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
        textFr: "La déclaration engage les signataires sur trois points. Intégrer la mobilité liée au climat dans les stratégies nationales d'adaptation. Renforcer les données sur les déplacements environnementaux. Protéger les personnes déplacées par des chocs climatiques au titre des instruments existants (Convention de Kampala, 2009).",
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
            { label: { fr: "Réforme", en: "Reform" }, text: { fr: "La validité de la carte de séjour a été récemment étendue d'un an à cinq ans, ce qui facilite la vie des résidents de longue durée. Le seuil qui déclenche cette obligation reste l'expiration du visa court séjour. Le système « e-visa » facilite l'entrée mais ne confère aucun droit de résidence.", en: "The residence card's validity was recently extended from one year to five, easing life for long-term residents, but the triggering threshold remains the expiry of the short-stay visa. The \"e-visa\" system facilitates entry but confers no right of residence." } }
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
            { label: { fr: "Nationaux non-CEDEAO", en: "Non-ECOWAS Nationals" }, text: { fr: "Un permis de résidence est exigé au-delà de 56 jours : « Alien Card » et « Residential Permit B ». En pratique, les extensions dépassent rarement 90 jours avant que la règle de résidence ne s'applique strictement.", en: "Required to obtain a residence permit (\"Alien Card\" + \"Residential Permit B\") if staying beyond 56 days, although 90 days is often the practical maximum for extensions before residence is strictly enforced." } }
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
      intro: { fr: "La région de la SADC se caractérise par un calcul « jours par an » pour les visiteurs. Ailleurs, une sortie suivie d'une réentrée — le « border run » — remet le compteur de 90 jours à zéro. Plusieurs pays de la SADC, dont l'Afrique du Sud et le Botswana, appliquent au contraire une limite annuelle cumulée, pour empêcher la résidence de fait.", en: "The SADC region is characterized by a \"days per year\" calculation for visitors. Unlike other regions where an exit-and-re-entry (\"border run\") resets the 90-day counter, SADC countries such as South Africa and Botswana often apply an aggregate annual cap to prevent de facto residence." },
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
    <div className="space-y-8 animate-in fade-in duration-500">
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

      <BarreSection lang={lang}>
        <CsvButton onClick={exportRecsCSV} label={tr({ fr: "CER (CSV)", en: "RECs (CSV)" }, lang)} />
        <CsvButton onClick={exportLegalMatrixCSV} label={tr({ fr: "Matrice juridique (CSV)", en: "Legal matrix (CSV)" }, lang)} />
      </BarreSection>

      <section className="bg-slate-50 rounded-xl p-6 md:p-8 shadow-sm">
        
        {/* Sommaire : trois familles, six entrees, chacune annoncant son contenu.
            Les cadres africains ouvrent la section. La plateforme declare que
            l'instrument africain fait reference pour toute notion disposant
            aussi d'une definition onusienne : ouvrir sur l'Agenda 2030 aurait
            dit l'inverse de ce que la methode annonce. */}
        <nav className="bg-white border border-slate-200 mb-8" aria-label={tr({ fr: "Sommaire de la section", en: "Section contents" }, lang)}>
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {[
              {
                icon: MapIcon,
                family: tr({ fr: "Cadres africains", en: "African frameworks" }, lang),
                items: [
                  { id: 'au', label: tr({ fr: "Union africaine", en: "African Union" }, lang),
                    hint: tr({ fr: "Traités, organes politiques et 5 agences spécialisées", en: "Treaties, political organs and 5 specialized agencies" }, lang)},
                  { id: 'recs', label: tr({ fr: "Communautés économiques régionales", en: "Regional Economic Communities" }, lang),
                    hint: tr({ fr: "8 CER, ouverture comparée et instruments propres", en: "8 RECs, compared openness and their own instruments" }, lang)},
                ],
              },
              {
                icon: Globe,
                family: tr({ fr: "Cadres mondiaux", en: "Global frameworks" }, lang),
                items: [
                  { id: 'sdgs', label: tr({ fr: "ODD — Agenda 2030", en: "SDGs — 2030 Agenda" }, lang),
                    hint: tr({ fr: "6 cibles liées aux mobilités, et l'Agenda 2063 en regard", en: "6 mobility-linked targets, with Agenda 2063 alongside" }, lang)},
                  { id: 'gcm', label: tr({ fr: "Pacte mondial — Migrations", en: "Global Compact — Migration" }, lang),
                    hint: tr({ fr: "23 objectifs, et la Position africaine commune", en: "23 objectives, and the Common African Position" }, lang)},
                  { id: 'gcr', label: tr({ fr: "Pacte mondial — Réfugiés", en: "Global Compact — Refugees" }, lang),
                    hint: tr({ fr: "Partage des charges, lu depuis la Convention de 1969", en: "Responsibility-sharing, read from the 1969 Convention" }, lang)},
                ],
              },
              {
                icon: Scale,
                family: tr({ fr: "États juridiques", en: "Legal frameworks" }, lang),
                items: [
                  { id: 'matrix', label: tr({ fr: "Entrées & séjours", en: "Entry & residence" }, lang),
                    hint: tr({ fr: "Les 54 pays : seuils légaux, instruments, ouverture", en: "All 54 countries: legal thresholds, instruments, openness" }, lang)},
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
                            className="gov-subnav w-full text-start px-3 py-2.5 border"
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
              <Prose className="text-slate-700 text-sm leading-relaxed" lang={lang}>{text.sdg_section.sdg_desc}</Prose>
              <a href="https://www.un.org/sustainabledevelopment/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
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
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-1">{tr({ fr: "Cible ONU", en: "UN Target" }, lang)}</span>
                    <h4 className="font-serif font-bold text-slate-900 text-base mb-2">{pt.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <AfricanCounterpoint
              lang={lang}
              kicker={tr({ fr: "Le pendant africain", en: "The African counterpart" }, lang)}
              title={tr({ fr: "L'Agenda 2063 : l'Afrique s'est dotée de son propre horizon, et il est plus ancien que 2030", en: "Agenda 2063: Africa set its own horizon, and it predates 2030" }, lang)}
              sources={[
                { label: tr({ fr: "Union africaine — Projets phares de l'Agenda 2063 (liste officielle des 15 projets)", en: "African Union — Agenda 2063 Flagship Projects (official list of the 15 projects)" }, lang),
                  url: "https://au.int/en/agenda2063/flagship-projects" },
                { label: tr({ fr: "Union africaine — « African Union Passport Launched during Opening of 27th AU Summit in Kigali » (communiqué, 17 juillet 2016)", en: "African Union — \"African Union Passport Launched during Opening of 27th AU Summit in Kigali\" (press release, 17 July 2016)" }, lang),
                  url: "https://au.int/en/pressreleases/20160717/african-union-passport-launched-during-opening-27th-au-summit-kigali" },
                { label: tr({ fr: "AUDA-NEPAD — agence de mise en œuvre de l'Agenda 2063", en: "AUDA-NEPAD — implementing agency for Agenda 2063" }, lang),
                  url: "https://www.nepad.org/" },
              ]}
            >
              <Prose className="text-justify" lang={lang}>{tr({ fr: "Adopté en 2015, l'Agenda 2063 suit son calendrier propre, sur cinquante ans, indépendamment de l'Agenda 2030. Sa deuxième aspiration vise « un continent intégré, politiquement uni, fondé sur les idéaux du panafricanisme et la vision de la renaissance africaine ». La mobilité n'y est pas un chapitre parmi d'autres — elle est l'un des quinze projets phares.", en: "Adopted in 2015, Agenda 2063 runs on its own fifty-year horizon, independently of Agenda 2030. Its second aspiration is \"an integrated continent, politically united, based on the ideals of Pan-Africanism and the vision of Africa's Renaissance\". Mobility is not one chapter among others there — it is one of the fifteen flagship projects." }, lang)}</Prose>

              <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  {tr({ fr: "Projet phare n° 4 sur 15", en: "Flagship project no. 4 of 15" }, lang)}
                </h4>
                <h5 className="font-serif font-bold text-slate-900 mb-2">
                  {tr({ fr: "Le passeport africain et la libre circulation des personnes", en: "The African Passport and Free Movement of People" }, lang)}
                </h5>
                <Prose className="text-[13px] text-slate-600 italic leading-relaxed" lang={lang}>{tr({ fr: "« Lever les restrictions à la capacité des Africains de voyager, travailler et vivre sur leur propre continent. L'initiative vise à transformer les législations africaines, qui restent globalement restrictives sur la circulation des personnes malgré les engagements politiques d'abaisser les frontières. » (formulation officielle de l'UA)", en: "\"Remove restrictions on Africans ability to travel, work and live within their own continent. The initiative aims at transforming Africa's laws, which remain generally restrictive on movement of people despite political commitments to bring down borders.\" (official AU wording)" }, lang)}</Prose>
              </div>

              <CounterpointFacts items={[
                { when: "2014", what: tr({ fr: "Le projet de passeport continental est arrêté comme projet phare de l'Agenda 2063.", en: "The continental passport is agreed as an Agenda 2063 flagship project." }, lang)},
                { when: tr({ fr: "17 juil. 2016", en: "17 July 2016" }, lang), what: tr({ fr: "Lancement du passeport de l'UA à l'ouverture du 27e Sommet, à Kigali. La présidente de la Commission, Nkosazana Dlamini-Zuma, en remet les premiers exemplaires au président en exercice Idriss Déby Itno et au président Paul Kagame.", en: "The AU passport is launched at the opening of the 27th Summit in Kigali: the first copies are handed to AU Chairperson Idriss Déby Itno and President Paul Kagame by AUC Chairperson Nkosazana Dlamini-Zuma." }, lang)},
                { when: "2018", what: tr({ fr: "Le Protocole sur la libre circulation des personnes est adopté à Kigali — c'est lui qui doit donner au passeport sa portée juridique.", en: "The Protocol on Free Movement of Persons is adopted in Kigali — it is what would give the passport its legal reach." }, lang)},
              ]} />

              <Prose className="text-justify" lang={lang}>{tr({ fr: "C'est ici que le geste symbolique et l'ancrage juridique se séparent. Le passeport a été lancé en 2016 ; le Protocole censé le rendre opposable comptait 4 ratifications sur 54 lors de la dernière vérification, très loin des 15 requises pour son entrée en vigueur. L'Agenda 2063 n'échoue donc pas faute de vision ni faute de texte : il bute sur le pas de porte des administrations nationales (Ben Mokhtar, 2026).", en: "This is where the symbolic gesture and the legal anchor part ways. The passport was launched in 2016; the Protocol meant to make it enforceable stood at 4 ratifications out of 54 at last check, far from the 15 required for entry into force. Agenda 2063 is therefore not failing for want of vision or of text: it stalls on the doorstep of national administrations (Ben Mokhtar, 2026)." }, lang)}</Prose>
            </AfricanCounterpoint>
          </div>
        )}

        {activeSdgzTab === 'gcm' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <Prose className="text-slate-700 text-sm leading-relaxed" lang={lang}>{text.sdg_section.gcm_desc}</Prose>
              <a href="https://www.iom.int/global-compact-migration" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <AfricanCounterpoint
              lang={lang}
              accent="var(--accent-2)"
              kicker={tr({ fr: "Clef de lecture", en: "How to read it" }, lang)}
              title={tr({ fr: "Ce que le Pacte est, et ce qu'il n'est pas", en: "What the Compact is, and what it is not" }, lang)}
              sources={[
                { label: tr({ fr: "Pacte mondial pour des migrations sûres, ordonnées et régulières — document final (par. 15 et 49)", en: "Global Compact for Safe, Orderly and Regular Migration — final outcome document (paras. 15 and 49)" }, lang),
                  url: "https://refugeesmigrants.un.org/sites/default/files/180713_agreed_outcome_global_compact_for_migration.pdf" },
                { label: tr({ fr: "Assemblée générale des Nations unies, résolution 73/195 (19 décembre 2018)", en: "United Nations General Assembly, resolution 73/195 (19 December 2018)" }, lang),
                  url: "https://www.iom.int/resources/global-compact-safe-orderly-and-regular-migration-res-73-195" },
                { label: tr({ fr: "Réseau des Nations unies sur les migrations — Forum d'examen des migrations internationales 2026", en: "UN Network on Migration — International Migration Review Forum 2026" }, lang),
                  url: "https://migrationnetwork.un.org/international-migration-review-forum-2026" },
              ]}
            >
              <Prose className="text-justify" lang={lang}>{tr({ fr: "Le Pacte a été adopté à la conférence intergouvernementale de Marrakech le 10 décembre 2018. L'Assemblée générale des Nations unies l'a entériné le 19 décembre 2018 (résolution 73/195), par 152 voix pour, 5 contre et 12 abstentions. C'est un cadre de coopération juridiquement non contraignant : il ne crée aucune obligation opposable. Le texte le dit lui-même — « son autorité repose sur son caractère consensuel, sa crédibilité, l'appropriation collective, la mise en œuvre conjointe, le suivi et l'examen ».", en: "The Compact was adopted at the intergovernmental conference in Marrakech on 10 December 2018. The UN General Assembly endorsed it on 19 December 2018 by resolution 73/195, on a recorded vote of 152 in favour, 5 against and 12 abstentions. It is a non-legally binding cooperative framework: it creates no enforceable obligation, and the text itself states that \"its authority rests on its consensual nature, credibility, collective ownership, joint implementation, follow-up and review\"." }, lang)}</Prose>

              <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  {tr({ fr: "Principe de souveraineté nationale (par. 15)", en: "National sovereignty principle (para. 15)" }, lang)}
                </h4>
                <Prose className="text-[13px] text-slate-600 italic leading-relaxed" lang={lang}>{tr({ fr: "« Le Pacte mondial réaffirme le droit souverain des États de définir leur politique migratoire nationale et leur prérogative de gouverner les migrations relevant de leur juridiction, en conformité avec le droit international. »", en: "\"The Global Compact reaffirms the sovereign right of States to determine their national migration policy and their prerogative to govern migration within their jurisdiction, in conformity with international law.\"" }, lang)}</Prose>
                <Prose className="text-xs text-slate-500 mt-3 leading-relaxed" lang={lang}>{tr({ fr: "Cette clause est ce qui a rendu le texte adoptable ; c'est aussi ce qui limite sa portée. Elle explique pourquoi un même objectif peut être invoqué pour ouvrir des voies régulières comme pour justifier un durcissement des entrées.", en: "This clause is what made the text adoptable; it is also what limits its reach. It explains why the same objective can be invoked to open regular pathways and to justify tightening entry alike." }, lang)}</Prose>
              </div>

              <div>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  {tr({ fr: "Les dix principes directeurs, transversaux et interdépendants (par. 15)", en: "The ten cross-cutting and interdependent guiding principles (para. 15)" }, lang)}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                  {(tr({ fr: [
                    ["Centré sur les personnes", "traite les migrants comme des sujets de droit"],
                    ["Coopération internationale", "aucun État ne peut traiter seul un phénomène transnational"],
                    ["Souveraineté nationale", "le droit de définir sa politique migratoire est réaffirmé"],
                    ["État de droit et régularité de la procédure", "accès à la justice à tous les stades"],
                    ["Développement durable", "adossé à l'Agenda 2030"],
                    ["Droits humains", "non-régression et non-discrimination, quel que soit le statut"],
                    ["Prise en compte du genre", "sortir du prisme de la seule victimité pour les femmes migrantes"],
                    ["Prise en compte de l'enfance", "intérêt supérieur de l'enfant comme considération primordiale"],
                    ["Approche pangouvernementale", "cohérence horizontale et verticale entre secteurs et niveaux"],
                    ["Approche pansociétale", "migrants, diasporas, société civile, université, secteur privé, syndicats"],
                  ], en: [
                    ["People-centred", "treats migrants as bearers of rights"],
                    ["International cooperation", "no state can address a transnational phenomenon alone"],
                    ["National sovereignty", "the right to determine migration policy is reaffirmed"],
                    ["Rule of law and due process", "access to justice at every stage"],
                    ["Sustainable development", "rooted in the 2030 Agenda"],
                    ["Human rights", "non-regression and non-discrimination, whatever the status"],
                    ["Gender-responsive", "moving away from a victimhood-only lens on migrant women"],
                    ["Child-sensitive", "the best interests of the child as a primary consideration"],
                    ["Whole-of-government", "horizontal and vertical coherence across sectors and levels"],
                    ["Whole-of-society", "migrants, diasporas, civil society, academia, private sector, unions"],
                  ] }, lang)).map(([name, gloss], i) => (
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
                <Prose className="text-xs text-slate-500 mt-3 leading-relaxed text-justify" lang={lang}>{tr({ fr: "Ces dix principes forment la grille d'interprétation des 23 objectifs qui suivent. Un objectif se lit toujours à travers eux : deux États peuvent appliquer le même texte et diverger sur ce seul point.", en: "These ten principles form the interpretive grid for the 23 objectives that follow. An objective is always read through them: two states can apply the same text and part company on this point alone." }, lang)}</Prose>
              </div>

              <CounterpointFacts items={[
                { when: tr({ fr: "10 déc. 2018", en: "10 Dec. 2018" }, lang), what: tr({ fr: "Adoption à la conférence intergouvernementale de Marrakech.", en: "Adoption at the intergovernmental conference in Marrakech." }, lang)},
                { when: tr({ fr: "19 déc. 2018", en: "19 Dec. 2018" }, lang), what: tr({ fr: "Entérinement par l'Assemblée générale (résolution 73/195) : 152 pour, 5 contre, 12 abstentions.", en: "Endorsement by the General Assembly (resolution 73/195): 152 in favour, 5 against, 12 abstentions." }, lang)},
                { when: tr({ fr: "16-20 mai 2022", en: "16-20 May 2022" }, lang), what: tr({ fr: "Premier Forum d'examen des migrations internationales (FEMI), à New York. Prévu au paragraphe 49 du Pacte, il en est la principale plateforme intergouvernementale de suivi, réunie tous les quatre ans.", en: "First International Migration Review Forum (IMRF), New York. Provided for in paragraph 49 of the Compact, it is its primary intergovernmental follow-up platform, convened every four years." }, lang)},
                { when: tr({ fr: "5-8 mai 2026", en: "5-8 May 2026" }, lang), what: tr({ fr: "Deuxième FEMI, à New York. Les examens régionaux l'alimentent — celui de l'Afrique a été conduit par l'UA en 2021.", en: "Second IMRF, New York. Regional reviews feed into it — Africa's was conducted by the AU in 2021." }, lang)},
              ]} />
            </AfricanCounterpoint>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pe-2 custom-scrollbar">
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
              kicker={tr({ fr: "Le pendant africain", en: "The African counterpart" }, lang)}
              title={tr({ fr: "La Position africaine commune : l'Afrique est arrivée à Marrakech avec un texte à elle", en: "The Common African Position: Africa came to Marrakech with a text of its own" }, lang)}
              sources={[
                { label: tr({ fr: "Union africaine — « Draft Common African Position (CAP) on the Global Compact for Safe, Orderly and Regular Migration », octobre 2017 (document de travail, Addis-Abeba)", en: "African Union — \"Draft Common African Position (CAP) on the Global Compact for Safe, Orderly and Regular Migration\", October 2017 (working document, Addis Ababa)" }, lang),
                  url: "https://au.int/sites/default/files/newsevents/workingdocuments/33023-wd-english_common_african_position_on_gcom.pdf" },
                { label: tr({ fr: "Union africaine — Revue régionale africaine de la mise en œuvre du Pacte mondial sur les migrations (2021)", en: "African Union — Africa Regional Review of the Implementation of the Global Compact on Migration (2021)" }, lang),
                  url: "https://au.int/en/newsevents/20210826/africa-regional-review-implementation-global-compact-migration" },
                { label: tr({ fr: "Union africaine — Validation du plan d'action pour la mise en œuvre du GCM en Afrique (communiqué, 28 août 2024)", en: "African Union — Senior officers validate the action plan for GCM implementation in Africa (press release, 28 August 2024)" }, lang),
                  url: "https://au.int/en/pressreleases/20240828/senior-officers-validate-action-plan-gcm-implementation-africa" },
              ]}
            >
              <Prose className="text-justify" lang={lang}>{tr({ fr: "Un an avant l'adoption du Pacte de Marrakech, l'Union africaine se dote d'une Position africaine commune. Élaborée en octobre 2017 sous le mot d'ordre « One Africa, One Voice, One Message », elle est portée devant les sessions ordinaires de 2018 du Conseil exécutif et de la Conférence. Le geste compte autant que le contenu : il s'agit de négocier un instrument mondial en bloc, avec une doctrine préalable, plutôt que d'y réagir État par État.", en: "A year before the Marrakech Compact was adopted, the African Union produced a Common African Position (CAP). It was drafted in October 2017 under the motto \"One Africa, One Voice, One Message\", and brought before the 2018 ordinary sessions of the Executive Council and the Assembly. The gesture matters as much as the content: it means negotiating a global instrument as a bloc, with a doctrine agreed beforehand, rather than reacting to it state by state." }, lang)}</Prose>

              <div className="p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent)' }}>
                <Prose className="text-[13px] text-slate-600 italic leading-relaxed" lang={lang}>{tr({ fr: "« L'adoption d'une Position africaine commune sur le Pacte mondial sur les migrations sera guidée par le fait que la mobilité humaine et la libre circulation de toutes les personnes à l'intérieur du continent constituent l'un des piliers d'une Afrique intégrée. » (PAC, § 1.6)", en: "\"The adoption of a Common African Position on the Global Compact on Migration will be guided by the fact that human mobility and free movement of all persons within the continent constitute one of the pillars of an integrated Africa.\" (CAP, § 1.6)" }, lang)}</Prose>
              </div>

              <div>
                <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  {tr({ fr: "Les six domaines thématiques de la Position", en: "The six thematic areas of the Position" }, lang)}
                </h4>
                <ol className="space-y-2">
                  {(tr({ fr: [
                    "Agir sur les moteurs de la migration — effets du changement climatique, catastrophes naturelles, crises d'origine humaine, inégalités de genre et autres.",
                    "Droits humains de tous les migrants — inclusion sociale, cohésion, lutte contre le racisme, la xénophobie et les discriminations.",
                    "Trafic de migrants, traite des personnes et formes contemporaines d'esclavage.",
                    "Coopération internationale et gouvernance des migrations — synergies entre États membres, harmonisation de la gestion des frontières et des données.",
                    "Migration irrégulière et voies régulières — créer les canaux dont l'absence pousse vers les routes dangereuses.",
                    "Contributions des migrants et des diasporas — y compris des femmes et des jeunes — aux pays d'origine, de transit et d'accueil.",
                  ], en: [
                    "Addressing the drivers of migration — adverse effects of climate change, natural disasters, human-made crises, gender and other inequalities.",
                    "Human rights of all migrants — social inclusion, cohesion, and countering racism, xenophobia and discrimination.",
                    "Smuggling of migrants, trafficking in persons and contemporary forms of slavery.",
                    "International cooperation and governance of migration — synergies among member states, harmonised border management and data.",
                    "Irregular migration and regular pathways — creating the channels whose absence pushes people onto dangerous routes.",
                    "Contributions of migrants and diasporas — including women and youth — to countries of origin, transit and destination.",
                  ] }, lang)).map((t, i) => (
                    <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                      <span className="shrink-0 font-serif font-bold tabular-nums" style={{ color: 'var(--accent-deep)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-slate-700">{t}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Prose className="text-justify" lang={lang}>{tr({ fr: "Ces six domaines épousent délibérément l'architecture thématique du Pacte mondial — l'Afrique occupe le cadre qui se négocie et y inscrit ses propres priorités, au lieu d'en bâtir un à côté. La suite se lit dans la mécanique bureaucratique plutôt que dans les déclarations. Revue régionale africaine de la mise en œuvre du GCM en 2021. Plan d'action continental validé au niveau des hauts fonctionnaires en août 2024, puis adopté par le CTS-MRIDP à sa 5e session en novembre 2025.", en: "These six areas deliberately mirror the Global Compact's own thematic architecture — Africa occupies the framework being negotiated and writes its priorities into it, instead of building one alongside. What follows is legible in bureaucratic machinery more than in declarations. The Africa regional review of GCM implementation took place in 2021. A continental action plan was validated at senior-officials level in August 2024, then adopted by the STC-MRIDPs at its 5th session in November 2025." }, lang)}</Prose>
            </AfricanCounterpoint>
          </div>
        )}

        {activeSdgzTab === 'gcr' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <Prose className="text-slate-700 text-sm leading-relaxed" lang={lang}>{text.sdg_section.gcr_desc}</Prose>
              <a href="https://globalcompactrefugees.org/about-digital-platform/global-compact-refugees" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
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
              kicker={tr({ fr: "Le pendant africain", en: "The African counterpart" }, lang)}
              title={tr({ fr: "L'Afrique avait déjà son instrument — et il est plus large que celui de Genève", en: "Africa already had its instrument — and it is broader than Geneva's" }, lang)}
              sources={[
                { label: tr({ fr: "OUA — Convention régissant les aspects propres aux problèmes des réfugiés en Afrique (Addis-Abeba, 10 septembre 1969 ; entrée en vigueur le 20 juin 1974)", en: "OAU — Convention Governing the Specific Aspects of Refugee Problems in Africa (Addis Ababa, 10 September 1969; entered into force 20 June 1974)" }, lang),
                  url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" },
                { label: tr({ fr: "UA — Convention de Kampala sur la protection et l'assistance aux personnes déplacées internes (2009)", en: "AU — Kampala Convention on the Protection and Assistance of Internally Displaced Persons (2009)" }, lang),
                  url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" },
                { label: tr({ fr: "HCR — Global Trends : Forced Displacement (édition 2025)", en: "UNHCR — Global Trends: Forced Displacement (2025 edition)" }, lang),
                  url: "https://www.unhcr.org/global-trends" },
              ]}
            >
              <Prose className="text-justify" lang={lang}>{tr({ fr: "Le Pacte mondial sur les réfugiés date de 2018. La Convention de l'OUA sur les réfugiés date de 1969 : un demi-siècle plus tôt, et avec une définition plus large que celle de Genève. La Convention de 1951 exige une crainte de persécution individualisée. L'article I(2) du texte africain protège aussi quiconque fuit « une agression extérieure, une occupation, une domination étrangère ou des événements troublant gravement l'ordre public ». C'est la définition que cette plateforme retient comme référence.", en: "The Global Compact on Refugees dates from 2018. The OAU Refugee Convention dates from 1969: half a century earlier, and with a broader definition than Geneva's. Where the 1951 Convention requires an individualised fear of persecution, Article I(2) of the African text also protects anyone fleeing \"external aggression, occupation, foreign domination or events seriously disturbing public order\". That is the definition this platform treats as its reference." }, lang)}</Prose>

              <CounterpointFacts items={[
                { when: "1969", what: tr({ fr: "Convention de l'OUA, adoptée à Addis-Abeba le 10 septembre — définition élargie du réfugié, en vigueur depuis le 20 juin 1974.", en: "OAU Convention, adopted in Addis Ababa on 10 September — broadened refugee definition, in force since 20 June 1974." }, lang)},
                { when: "2009", what: tr({ fr: "Convention de Kampala : le continent se dote du seul traité régional contraignant au monde sur les déplacés internes.", en: "Kampala Convention: the continent adopts the world's only binding regional treaty on internally displaced persons." }, lang)},
                { when: "2017", what: tr({ fr: "Déploiement du CRRF, le cadre d'action qui préfigure le Pacte mondial ; ses situations d'application initiales sont très majoritairement africaines (l'Éthiopie le lance le 28 novembre 2017).", en: "Roll-out of the CRRF, the framework that prefigured the Global Compact; its initial application situations are overwhelmingly African (Ethiopia launches it on 28 November 2017)." }, lang)},
                { when: "2018", what: tr({ fr: "Pacte mondial sur les réfugiés — il érige en principe un partage des charges que le continent assumait déjà.", en: "Global Compact on Refugees — it turns into a principle a sharing of responsibility the continent was already carrying." }, lang)},
              ]} />

              <Prose className="text-justify" lang={lang}>{tr({ fr: "Cette antériorité change la façon de lire le Pacte. Le « partage équitable des charges » qu'il proclame ne décrit pas une charge à venir. D'après le HCR, six pays accueillent à eux seuls plus du tiers des réfugiés du monde. Deux d'entre eux sont africains : l'Ouganda et le Tchad. L'enjeu, pour le continent, n'est donc pas d'adhérer à une norme venue d'ailleurs, mais d'obtenir que la norme mondiale reconnaisse et finance une pratique déjà ancienne (Ben Mokhtar, 2026).", en: "This precedence changes how the Compact reads. The \"equitable sharing of the burden\" it proclaims concerns a burden already borne. According to UNHCR, six countries alone host more than a third of the world's refugees. Two of them are African: Uganda and Chad. For the continent the stake is therefore not to sign up to a norm from elsewhere, but to get the global norm to recognise and fund a long-standing practice (Ben Mokhtar, 2026)." }, lang)}</Prose>
            </AfricanCounterpoint>
          </div>
        )}

        {/* ============================================================== */}
        {/* Rendu des Onglets Africains (UA, CER) */}
        {/* ============================================================== */}
        {activeSdgzTab === 'au' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-emerald-800 relative overflow-hidden">
              <div className="absolute top-0 end-0 -me-10 -mt-10 opacity-10 pointer-events-none">
                <Landmark className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <div className="flex items-start gap-4 mb-2">
                  <span className="shrink-0 w-14 h-14 rounded-lg bg-white/95 border border-emerald-700 flex items-center justify-center p-1.5 shadow-sm">
                    <img src="/logos/au.png" alt="" className="max-h-full max-w-full object-contain" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                      {tr({ fr: 'Architecture Continentale Endogène', en: 'Endogenous Continental Architecture' }, lang)}
                    </span>
                    <span className="text-xs text-emerald-200/80">
                      {tr({ fr: "Union africaine — Addis-Abeba", en: "African Union — Addis Ababa" }, lang)}
                    </span>
                  </div>
                </div>
                <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 leading-tight">
                  {tr({ fr: "L'Union Africaine et le Régime Panafricain des Mobilités", en: "The African Union and the Pan-African Mobility Regime" }, lang)}
                </h3>
                <Prose className="text-emerald-100 text-sm md:text-base leading-relaxed max-w-4xl text-justify" lang={lang}>{tr({ fr: "La gouvernance des mobilités en Afrique ne se réduit pas aux pactes mondiaux. Elle s'enracine dans une architecture institutionnelle propre, structurée par l'Union Africaine (UA). Cette architecture illustre la tension du « normer sans ancrer ». La densification normative est exceptionnelle — traités, positions communes, agences — mais elle se heurte souvent aux capacités et aux réticences des États dans l'« entre-deux national » (Ben Mokhtar, 2026). Le régime continental repose sur la construction d'une souveraineté épistémique (produire ses propres données et diagnostics) et sur un maillage de textes et de bureaucraties interconnectés.", en: "African mobility governance is not reduced to global compacts. It is rooted in its own institutional architecture, structured by the African Union (AU). This architecture illustrates the tension of 'norming without anchoring': exceptional normative densification that often clashes with State capacities and reluctance in the 'national in-between' (Ben Mokhtar, 2026). The continental regime relies on building epistemic sovereignty and a network of interconnected texts and bureaucracies." }, lang)}</Prose>
                <div className="flex flex-wrap gap-5 mt-6 pt-5 border-t border-emerald-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-100"><span className="font-bold text-white">2002</span> — {tr({ fr: 'succède à l\'OUA (fondée en 1963)', en: 'succeeds the OAU (founded 1963)' }, lang)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-100 font-bold text-white">{tr({ fr: 'Addis-Abeba, Éthiopie', en: 'Addis Ababa, Ethiopia' }, lang)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Textes Fondateurs */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <FileText className="w-5 h-5 me-2 text-emerald-700" />
                  {tr({ fr: "Textes Fondateurs & Cadres Politiques", en: "Foundational Texts & Policy Frameworks" }, lang)}
                </h4>
                <div className="space-y-4">
                  {auFrameworks.map((fw, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest inline-block mb-2">
                          {tr(fw.tag, lang)}
                        </span>
                        <h5 className="font-bold text-slate-900 text-lg mb-2 leading-tight">{tr(fw.title, lang)}</h5>
                        <Prose className="text-xs text-slate-600 leading-relaxed" lang={lang}>{tr(fw.desc, lang)}</Prose>
                        {fw.stats && fw.stats.map((stat, sIdx) => {
                          const inForce = stat.value >= (stat.threshold || 15);
                          const barColor = inForce ? 'bg-emerald-600' : 'bg-rose-600';
                          const textColor = inForce ? 'text-emerald-700' : 'text-rose-700';
                          return (
                            <div key={sIdx} className="mt-4 pt-4 border-t border-slate-200">
                              <div className="flex items-baseline justify-between gap-2 mb-1.5 flex-wrap">
                                <div className="flex items-baseline gap-2">
                                  <span className={`text-2xl font-serif font-bold ${textColor}`}>{stat.value}</span>
                                  <span className="text-xs font-bold text-slate-500">/ {stat.total} {tr(stat.label, lang)}</span>
                                </div>
                                <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-sm border shrink-0 ${inForce ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                                  {inForce ? (tr({ fr: 'En vigueur', en: 'In force' }, lang)) : (tr({ fr: 'Pas encore en vigueur', en: 'Not yet in force' }, lang))}
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
                              {tr(fw.badge, lang)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="md:w-2/3 bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-center relative shadow-sm">
                        <Quote className="absolute top-4 start-4 w-6 h-6 text-slate-100" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ms-6">{tr(fw.article.ref, lang)}</span>
                        <Prose className="text-sm font-serif italic text-slate-800 leading-relaxed ms-6 relative z-10" lang={lang}>{tr({ fr: fw.article.textFr, en: fw.article.textEn }, lang)}</Prose>
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
                kicker={tr({ fr: "Géographie de l'engagement", en: 'Geography of commitment' }, lang)}
                titre={tr({ fr: "Ce que les États ont signé, vu du continent", en: 'What states have signed, seen from the continent' }, lang)}
                plain={{
                  fr: "Chaque pays est teinté selon le nombre de grands textes de l'Union africaine qu'il a officiellement ratifiés, sur six. Plus la teinte est dense, plus l'engagement juridique est complet.",
                  en: 'Each country is shaded by how many of the African Union’s six major instruments it has formally ratified. The denser the shade, the more complete the legal commitment.',
                }}
                sources={[{ label: tr({ fr: "Union africaine — listes officielles de statut des traités", en: 'African Union — official treaty status lists' }, lang),
                            url: 'https://au.int/en/treaties' }]}
              />

              <AnchoringMatrix lang={lang} />

              <GovernanceCross lang={lang} />

              {/* Organe de pilotage politique & forum consultatif */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <Landmark className="w-5 h-5 me-2 text-emerald-700" />
                  {tr({ fr: "Pilotage Politique & Forum Consultatif", en: "Political Steering & Consultative Forum" }, lang)}
                </h4>
                <div className="space-y-4">
                  <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedGovBody(expandedGovBody === 'stc' ? null : 'stc')}
                      aria-expanded={expandedGovBody === 'stc'}
                      className="w-full text-start px-6 pt-6 pb-2 hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <h5 className="font-bold text-emerald-900 text-base">
                          {tr({ fr: "Comité Technique Spécialisé Migration, Réfugiés & PDI (STC-MRIDPs)", en: "Specialized Technical Committee on Migration, Refugees & IDPs (STC-MRIDPs)" }, lang)}
                        </h5>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                            {tr({ fr: "5 sessions depuis 2015", en: "5 sessions since 2015" }, lang)}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform ${expandedGovBody === 'stc' ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                    </button>
                    {/* Le paragraphe reste hors du bouton : ses termes de glossaire
                        sont eux-memes cliquables. */}
                    <div className="px-6 pb-6"><Prose className="text-xs text-slate-700 leading-relaxed" lang={lang}>{tr({ fr: "Institué par l'article 5 de l'Acte constitutif de l'UA, ce Comité technique spécialisé est l'organe politique de tutelle du régime migratoire continental. Il se réunit au niveau ministériel et technique, prépare les projets et programmes de l'Union sur les mobilités, et en supervise le suivi auprès du Conseil exécutif. C'est devant ce circuit de reddition de comptes que l'Observatoire Africain des Migrations (OAM) rend compte de ses travaux.", en: "Established under Article 5 of the AU Constitutive Act, this Specialized Technical Committee is the political oversight organ of the continental migration regime. It meets at ministerial and technical level, prepares the Union's migration-related projects and programmes, and supervises their follow-up before the Executive Council. It is before this accountability circuit that the African Migration Observatory (AMO) reports on its work." }, lang)}</Prose>
                    </div>
                    {expandedGovBody === 'stc' && (
                      <div className="px-6 pb-6 pt-2 border-t border-emerald-100 space-y-3 animate-in fade-in duration-300">
                        {stcSessions.map((s, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                              <span className="font-bold text-slate-900 text-xs">{tr(s.num, lang)} — {tr(s.date, lang)}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{tr(s.format, lang)}</span>
                            </div>
                            <Prose className="text-xs text-emerald-700 font-bold mb-1.5" lang={lang}>{tr(s.focus, lang)}</Prose>
                            <Prose className="text-xs text-slate-600 leading-relaxed" lang={lang}>{tr(s.outcome, lang)}</Prose>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-amber-50/50 rounded-lg border border-amber-100 overflow-hidden">
                    <button
                      onClick={() => setExpandedGovBody(expandedGovBody === 'pafom' ? null : 'pafom')}
                      aria-expanded={expandedGovBody === 'pafom'}
                      className="w-full text-start px-6 pt-6 pb-2 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <h5 className="font-bold text-amber-900 text-base">
                          {tr({ fr: "Forum Panafricain sur la Migration (PAFoM)", en: "Pan-African Forum on Migration (PAFoM)" }, lang)}
                        </h5>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-sm uppercase tracking-widest">
                            {tr({ fr: "9 sessions depuis 2015", en: "9 sessions since 2015" }, lang)}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform ${expandedGovBody === 'pafom' ? 'rotate-180' : ''}`} />
                        </span>
                      </div>
                    </button>
                    {/* Le paragraphe reste hors du bouton : ses termes de glossaire
                        sont eux-memes cliquables. */}
                    <div className="px-6 pb-6"><Prose className="text-xs text-slate-700 leading-relaxed" lang={lang}>{tr({ fr: "Créé en 2006 par la décision EX.CL/276(IX) du Conseil exécutif, le PAFoM est le processus consultatif continental de référence. Il s'est réuni pour la première fois à Accra en 2015. Il rassemble les États membres de l'UA, les CER, les processus régionaux de Rabat et de Khartoum et les agences onusiennes, pour façonner les politiques migratoires africaines.", en: "Created by Executive Council Decision EX.CL/276(IX) in 2006, PAFoM is the continent's flagship consultative process; it first convened in Accra in 2015. It brings together AU member states, RECs, regional processes such as Rabat and Khartoum, and UN agencies to shape African migration policy." }, lang)}</Prose>
                    </div>
                    {expandedGovBody === 'pafom' && (
                      <div className="px-6 pb-6 pt-2 border-t border-amber-100 space-y-3 animate-in fade-in duration-300">
                        {pafomSessions.map((s, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                              <span className="font-bold text-slate-900 text-xs">{s.num} — {tr(s.date, lang)}</span>
                            </div>
                            <Prose className="text-xs text-amber-700 font-bold mb-1.5" lang={lang}>{tr(s.focus, lang)}</Prose>
                            <Prose className="text-xs text-slate-600 leading-relaxed" lang={lang}>{tr(s.outcome, lang)}</Prose>
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
                    <h4 className="text-sm font-bold text-blue-900 mb-1.5">{tr({ fr: "Le Programme Conjoint sur la Migration de Main-d'œuvre (JLMP)", en: "The Joint Labour Migration Programme (JLMP)" }, lang)}</h4>
                    <Prose className="text-xs text-blue-800 leading-relaxed" lang={lang}>{tr({ fr: "Là où le droit pur bloque (Kigali), la gouvernance avance par la technique. Porté conjointement par la CUA, l'OIT, l'OIM et la CEA, avec le PNUD, le JLMP met en œuvre le 5e domaine prioritaire de la Déclaration d'Addis-Abeba sur l'emploi (2015). Il vise quatre chantiers : la portabilité des compétences, celle des droits à la sécurité sociale, le recrutement équitable et la protection des travailleurs migrants.", en: "Where pure law stalls (Kigali), governance advances through technical means. Jointly carried by the AUC, ILO, IOM and ECA, with UNDP, the JLMP implements the 5th priority area of the 2015 Addis Ababa Declaration on Employment. It targets skills portability, social security portability, fair recruitment and migrant worker protection." }, lang)}</Prose>
                  </div>
                </div>
                <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-2 block">{tr({ fr: "Phase actuelle — JLMP Action (jusqu'à déc. 2024)", en: "Current Phase — JLMP Action (through Dec. 2024)" }, lang)}</span>
                  <Prose className="text-xs text-blue-900 leading-relaxed" lang={lang}>{tr({ fr: "Déploiement ciblé dans cinq États membres — Cameroun, Côte d'Ivoire, Éthiopie, Malawi, Maroc — et deux CER partenaires, la CEEAC et le COMESA. C'est un choix pilote, financé par la SIDA (Suède) depuis la phase « JLMP Priority » en 2018.", en: "Targeted rollout in five member states — Cameroon, Côte d'Ivoire, Ethiopia, Malawi, Morocco — and two partner RECs, ECCAS and COMESA. This is a pilot approach, funded by SIDA (Sweden) since the \"JLMP Priority\" phase in 2018." }, lang)}</Prose>
                </div>
              </div>

              {/* Partenariats de Compétences */}
              <div className="bg-teal-50 p-6 md:p-7 rounded-xl border border-teal-200 shadow-sm">
                <div className="flex items-start gap-4 mb-5">
                  <Briefcase className="w-6 h-6 text-teal-700 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-teal-900 mb-1.5">{tr({ fr: "Partenariats de Compétences (Global Skills Partnerships) en Action", en: "Global Skills Partnerships in Action" }, lang)}</h4>
                    <Prose className="text-xs text-teal-800 leading-relaxed" lang={lang}>{tr({ fr: "Au-delà des cadres continentaux, des accords bilatéraux appliquent déjà le modèle du « partenariat de compétences » entre États africains et européens. La formation y est financée conjointement avant le départ : c'est une alternative à la fuite des cerveaux, et elle est déjà testée.", en: "Beyond continental frameworks, concrete bilateral agreements already apply the \"Global Skills Partnership\" model (see Glossary) between African and European states — a tested alternative to brain drain, where training is jointly funded before departure." }, lang)}</Prose>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-2 block">{tr({ fr: "PALIM — Maroc ↔ Belgique (depuis 2019)", en: "PALIM — Morocco ↔ Belgium (since 2019)" }, lang)}</span>
                    <Prose className="text-xs text-teal-900 leading-relaxed" lang={lang}>{tr({ fr: "120 diplômés formés aux métiers du numérique : 40 partis travailler en Flandre, 80 restés au Maroc — un résultat pensé comme un gain pour les deux économies, non comme une perte sèche.", en: "120 graduates trained in digital skills: 40 went to work in Flanders, 80 stayed in Morocco — a result designed as a gain for both economies, not a net loss." }, lang)}</Prose>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-2 block">{tr({ fr: "THAMM / THAMM Plus (2019-2027)", en: "THAMM / THAMM Plus (2019-2027)" }, lang)}</span>
                    <Prose className="text-xs text-teal-900 leading-relaxed" lang={lang}>{tr({ fr: "Développement de compétences en Égypte, au Maroc et en Tunisie, avec des passerelles de mobilité vers la Belgique, la France et l'Allemagne.", en: "Skills development in Egypt, Morocco, and Tunisia, with mobility pathways to Belgium, France, and Germany." }, lang)}</Prose>
                  </div>
                  <div className="bg-white/70 p-4 rounded-lg border border-teal-100">
                    <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest mb-2 block">{tr({ fr: "Sénégal / Ghana ↔ Allemagne (dès 2026)", en: "Senegal / Ghana ↔ Germany (from 2026)" }, lang)}</span>
                    <Prose className="text-xs text-teal-900 leading-relaxed" lang={lang}>{tr({ fr: "Formation professionnelle dans le secteur du bâtiment, avec un premier départ de candidats prévu durant l'été 2026.", en: "Vocational training in the construction sector, with the first candidates' departure planned for summer 2026." }, lang)}</Prose>
                  </div>
                </div>
              </div>

              {/* Agences et Infrastructures */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <Database className="w-5 h-5 me-2 text-indigo-700" />
                  {tr({ fr: "Agences Spécialisées & Souveraineté Épistémique", en: "Specialized Agencies & Epistemic Sovereignty" }, lang)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger">
                  <AuAgencyCard
                    lang={lang}
                    acronym={tr({ fr: "OAM", en: "AMO" }, lang)}
                    fullName={tr({ fr: "Observatoire africain des migrations", en: "African Migration Observatory" }, lang)}
                    seat={tr({ fr: "Rabat, Maroc", en: "Rabat, Morocco" }, lang)}
                    founded={tr({ fr: "créé 2018 — lancé 2020", en: "created 2018 — launched 2020" }, lang)}
                    source={{ url: "https://amo.au.int/en", label: tr({ fr: "Site de l'OAM", en: "AMO website" }, lang)}}
                  >
                    {tr({ fr: "Bureau technique spécialisé de l'UA, institué dans le sillage de la Déclaration de New York (2016) et de l'Objectif 1 du Pacte mondial (données factuelles), lancé le 18 décembre 2020. Il doit doter le continent de données migratoires centralisées, harmonisées et opportunes — le bras qui permet de produire ses propres diagnostics plutôt que de les recevoir. Son financement reste largement extrabudgétaire.", en: "AU specialized technical office, established in the wake of the 2016 New York Declaration and Objective 1 of the Global Compact (evidence-based data), launched on 18 December 2020. Its purpose is to give the continent centralised, harmonised and timely migration data — the arm that allows Africa to produce its own diagnoses rather than receive them. Its funding remains largely off the regular budget." }, lang)}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym={tr({ fr: "CERSM / ACSRM", en: "ACSRM" }, lang)}
                    fullName={tr({ fr: "Centre d'études et de recherche sur les migrations", en: "African Centre for the Study and Research on Migration" }, lang)}
                    seat={tr({ fr: "Bamako, Mali", en: "Bamako, Mali" }, lang)}
                    founded={tr({ fr: "décidé 2020 — lancé 2021", en: "decided 2020 — launched 2021" }, lang)}
                    source={{ url: "https://au.int/", label: tr({ fr: "Union africaine", en: "African Union" }, lang)}}
                  >
                    {tr({ fr: "Bureau technique spécialisé de la Commission de l'UA, établi par décision de la 33e Conférence (février 2020) et officiellement lancé le 19 mars 2021. Mandat continental : produire de la connaissance sur les migrations africaines, à travers les « African Migration Policy Briefs ». Suivre la mise en œuvre des cadres de politique migratoire et renforcer les capacités des États et des CER.", en: "Specialized technical office of the AU Commission, established by decision of the 33rd Assembly (February 2020) and officially launched on 19 March 2021. Continental mandate: producing knowledge on African migration (\"African Migration Policy Briefs\"), monitoring implementation of migration policy frameworks, and building the capacity of States and RECs." }, lang)}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym="COC"
                    fullName={tr({ fr: "Centre opérationnel continental de Khartoum", en: "Continental Operational Centre in Khartoum" }, lang)}
                    seat={tr({ fr: "Khartoum, Soudan", en: "Khartoum, Sudan" }, lang)}
                    founded={tr({ fr: "statut propre", en: "own statute" }, lang)}
                    source={{ url: "https://au.int/", label: tr({ fr: "Union africaine", en: "African Union" }, lang)}}
                  >
                    {tr({ fr: "Bureau technique spécialisé doté de son propre statut (Conseil de gestion, Secrétariat), dédié à la lutte contre la migration irrégulière, la traite des personnes et le trafic de migrants. Plateforme de coopération policière continentale, aujourd'hui fragilisée par le conflit au Soudan.", en: "Specialized technical office with its own statute (Management Board, Secretariat), dedicated to countering irregular migration, trafficking in persons and migrant smuggling. A continental law-enforcement cooperation platform, today weakened by the conflict in Sudan." }, lang)}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym="AIR"
                    fullName={tr({ fr: "Institut africain pour les transferts de fonds", en: "African Institute for Remittances" }, lang)}
                    seat={tr({ fr: "Nairobi, Kenya", en: "Nairobi, Kenya" }, lang)}
                    founded="2014"
                    source={{ url: "https://au.int/en/sa/air", label: tr({ fr: "Fiche AIR (UA)", en: "AIR page (AU)" }, lang)}}
                  >
                    {tr({ fr: "Le Conseil exécutif ayant accepté l'offre d'accueil du Kenya (décision EX.CL/Dec.808(XXIV)), l'accord de siège est signé et l'Institut lancé le 28 novembre 2014 ; il est hébergé par la Kenya School of Monetary Studies. Trois objectifs. Abaisser le coût d'envoi d'argent vers l'Afrique et à l'intérieur du continent. Améliorer la mesure et la déclaration des transferts dans les États membres. Convertir ces flux en effet économique et social. L'AIR touche donc à la fois au droit bancaire et à la statistique migratoire.", en: "After the Executive Council accepted Kenya's offer to host it (decision EX.CL/Dec.808(XXIV)), the host agreement was signed and the Institute launched on 28 November 2014; it is hosted by the Kenya School of Monetary Studies. Three objectives: lowering the cost of sending money to and within Africa, improving the measurement and reporting of remittance data across member states, and converting those flows into social and economic effect. AIR therefore sits at the junction of banking regulation and migration statistics." }, lang)}
                  </AuAgencyCard>

                  <AuAgencyCard
                    lang={lang}
                    acronym="STATAFRIC"
                    fullName={tr({ fr: "Institut panafricain de statistique de l'Union africaine", en: "African Union Institute for Statistics" }, lang)}
                    seat={tr({ fr: "Tunis, Tunisie", en: "Tunis, Tunisia" }, lang)}
                    founded={tr({ fr: "créé 2013 — activités 2019", en: "created 2013 — activities 2019" }, lang)}
                    source={{ url: "https://statafric.au.int/en/mandate", label: tr({ fr: "Mandat de STATAFRIC", en: "STATAFRIC mandate" }, lang)}}
                  >
                    {tr({ fr: "Créé en janvier 2013 par la Conférence de l'UA à Addis-Abeba, il est installé à Tunis. Ses activités ont été lancées en novembre 2019, en marge de la 13e session des directeurs généraux des instituts nationaux de statistique. Son mandat : conduire la production et la promotion d'une information statistique harmonisée et de qualité à l'appui de l'agenda africain d'intégration, en collectant et en agrégeant ce que publient les instituts nationaux. C'est l'infrastructure sur laquelle repose toute comparabilité continentale — y compris migratoire.", en: "Created in January 2013 by the AU Assembly in Addis Ababa, it is seated in Tunis. Its activities were launched in November 2019, alongside the 13th session of the Committee of Directors General of national statistics offices. Its mandate: to lead the provision and promotion of harmonised, quality statistical information in support of the African integration agenda, by collecting and aggregating what national statistics institutes publish. It is the infrastructure on which all continental comparability rests — migration included." }, lang)}
                  </AuAgencyCard>
                </div>

                <Prose className="text-xs text-slate-500 leading-relaxed mt-5 pt-4" style={{ borderTop: '1px solid var(--rule)' }} lang={lang}>{tr({ fr: "AIR et STATAFRIC sont souvent cités ensemble, à tort : le premier est un institut sectoriel adossé à la régulation bancaire kényane, le second l'appareil statistique de l'Union tout entière. Les confondre revient à confondre une source de données avec le système qui les rend comparables (Ben Mokhtar, 2026).", en: "AIR and STATAFRIC are often cited together, wrongly: the first is a sectoral institute anchored in Kenyan banking regulation, the second the statistical apparatus of the Union as a whole. Conflating them means conflating a data source with the system that makes data comparable (Ben Mokhtar, 2026)." }, lang)}</Prose>
              </div>

            </div>
          </div>
        )}

        {activeSdgzTab === 'recs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                {tr({ fr: 'Les Blocs Régionalisés du Régime Continental', en: 'Regionalized Blocs of the Continental Regime' }, lang)}
              </span>
              <h3 className="font-serif font-bold text-2xl mb-3">
                {tr({ fr: "Les Communautés Économiques Régionales (CER)", en: "Regional Economic Communities (RECs)" }, lang)}
              </h3>
              <Prose className="text-emerald-100 text-sm leading-relaxed" lang={lang}>{tr({ fr: "L'architecture continentale repose sur 8 CER reconnues. L'analyse démontre que l'intégration humaine y est à « géométrie variable » : chaque sous-région développe une trajectoire d'ouverture conditionnée par son histoire, son économie et ses défis sécuritaires.", en: "The continental architecture relies on 8 recognized RECs. Analysis shows human integration is of 'variable geometry': each sub-region develops an openness trajectory conditioned by its history, economy, and security challenges." }, lang)}</Prose>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                {tr({ fr: "Classement de l'ouverture visa (indice AVOI, 2024)", en: "Visa openness ranking (AVOI index, 2024)" }, lang)}
              </h4>
              <Prose className="text-xs text-slate-500 mb-5" lang={lang}>{tr({ fr: "Score moyen par CER (BAD/UA). Le repère vertical marque la moyenne continentale des 8 CER (0,501).", en: "Average score per REC (AfDB/AU). The vertical marker shows the continental average across the 8 RECs (0.501)." }, lang)}</Prose>
              <div className="space-y-3">
                {[...recsList].sort((a, b) => b.avoi - a.avoi).map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3" title={`${tr(rec.name, lang)}: ${rec.avoi.toFixed(3)}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide w-16 shrink-0">{rec.id === 'censad' ? 'CEN-SAD' : rec.id.toUpperCase()}</span>
                    <div className="flex-1 relative h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-700 rounded-full bar-fill" style={{ width: `${Math.max(4, rec.avoi * 100)}%` }}></div>
                      <div className="absolute top-0 bottom-0 w-px bg-slate-400" style={{ left: '50.1%' }}></div>
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-12 text-end shrink-0 tabular-nums">{rec.avoi.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {recsList.map((rec) => {
                const isOpen = expandedRec === rec.id;
                return (
                  <div key={rec.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                    <button onClick={() => setExpandedRec(isOpen ? null : rec.id)} className="w-full p-5 text-start flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="shrink-0 min-w-11 h-11 px-1.5 rounded-full bg-white border border-emerald-200 flex items-center justify-center overflow-hidden text-emerald-700 font-serif font-bold text-[10px] leading-none tracking-tight">
                          {recLogos[rec.id]
                            ? <img src={recLogos[rec.id]} alt="" className="max-h-8 max-w-9 object-contain" />
                            : (rec.id === 'censad' ? 'CEN-SAD' : rec.id.toUpperCase())}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-serif font-bold text-slate-900 text-base md:text-lg">{tr(rec.name, lang)}</h4>
                          <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1.5 inline-block">
                            {rec.tag}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-end hidden sm:block">
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
                            <span className="text-xs text-slate-600"><span className="font-bold text-slate-800">{rec.founded}</span> — {tr({ fr: 'fondation', en: 'founded' }, lang)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600 font-bold text-slate-800">{tr(rec.hq, lang)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600"><span className="font-bold text-slate-800">{Object.values(countryRecAffiliations).filter(a => a.includes(rec.id)).length}</span> {tr({ fr: 'États membres', en: 'member states' }, lang)}</span>
                          </div>
                        </div>
                        <Prose className="text-sm text-slate-800 leading-relaxed font-medium" lang={lang}>{tr({ fr: rec.desc.fr, en: rec.desc.en }, lang)}</Prose>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                          <div className="lg:col-span-2 bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                            <AfricaRecMap recId={rec.id} lang={lang} />
                          </div>
                          <div className="lg:col-span-3 bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-3">
                              <Users className="w-3.5 h-3.5 me-1.5 text-emerald-600" /> {tr({ fr: "États membres", en: "Member states" }, lang)}
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
                                      title={note ? tr(note, lang) : undefined}
                                      className="group/chip relative inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md cursor-default transition-all duration-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-900 hover:-translate-y-0.5 hover:shadow-sm"
                                    >
                                      <CountryFlag iso2={iso2} emoji="" size="sm" />
                                      {meta ? (tr(meta.name, lang) || meta.name.fr) : iso2.toUpperCase()}
                                      {note && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                                    </span>
                                  );
                                })}
                            </div>
                            <Prose className="text-[10px] text-slate-400 italic mt-3" lang={lang}>{tr({ fr: "Survolez un pays (carte ou étiquette) pour le situer ; le pictogramme ambré signale un retrait récent ou en cours.", en: "Hover a country (map or label) to locate it; the amber icon flags a recent or ongoing withdrawal." }, lang)}</Prose>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-2"><FileText className="w-3.5 h-3.5 me-1.5 text-blue-600" /> {tr({ fr: "Instruments Clés", en: "Key Instruments" }, lang)}</h5>
                            <Prose className="text-xs text-slate-700 leading-relaxed" lang={lang}>{tr({ fr: rec.instruments.fr, en: rec.instruments.en }, lang)}</Prose>
                          </div>
                          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-2"><Activity className="w-3.5 h-3.5 me-1.5 text-emerald-600" /> {tr({ fr: "Dynamique & Défis", en: "Dynamics & Challenges" }, lang)}</h5>
                            <Prose className="text-xs text-slate-700 leading-relaxed" lang={lang}>{tr({ fr: rec.dynamics.fr, en: rec.dynamics.en }, lang)}</Prose>
                          </div>
                        </div>

                        {rec.sources && (
                          <div className="pt-4 border-t border-slate-200">
                            <h5 className="flex items-center font-bold text-[10px] uppercase tracking-widest text-slate-400 mb-2">
                              <BookOpen className="w-3 h-3 me-1.5" /> {tr({ fr: "Sources", en: "Sources" }, lang)}
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
                {tr({ fr: "Cartographie Réglementaire Continentale", en: "Continental Regulatory Mapping" }, lang)}
              </span>
              <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 leading-tight">
                {tr({ fr: "Matrices de réciprocité des visas et profils d'entrée et de séjour (54 pays)", en: "Visa reciprocity matrices and entry/residence profiles (54 countries)" }, lang)}
              </h3>
              <Prose className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl" lang={lang}>{tr({ fr: "L'analyse des seuils d'entrée et de l'obligation de résidence montre qu'une frontière juridique stricte sépare deux statuts. Le « visiteur » est toléré pour le commerce ou le tourisme de courte durée ; l'« immigrant », lui, dépend du pouvoir discrétionnaire de l'État pour s'établir. Le seuil standard en Afrique est de 90 jours.", en: "Analysis of entry thresholds and the residence obligation shows the persistence of a strict legal border. On one side, \"visitor\" status, tolerated for short-term trade or tourism; on the other, \"immigrant\" status, subject to the State's discretionary power over settlement. The standard threshold across Africa is 90 days." }, lang)}</Prose>
            </div>

            {/* Disclaimer Methodologique */}
            <div className="bg-amber-50 border-s-4 border-amber-500 p-5 rounded-e-lg shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 me-3 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">{tr({ fr: "À propos de ces données", en: "About this data" }, lang)}</h4>
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
                    {tr({ fr: "Distribution des seuils légaux de visiteur (54 pays)", en: "Distribution of legal visitor thresholds (54 countries)" }, lang)}
                  </h4>
                  <Prose className="text-xs text-slate-500 mb-5" lang={lang}>{tr({ fr: "Nombre de pays par palier de seuil, calculé en direct depuis la matrice ci-dessous.", en: "Number of countries per threshold band, computed live from the matrix below." }, lang)}</Prose>
                  <div className="space-y-3">
                    {counts.filter((b) => b.count > 0).map((b) => (
                      <div key={b.key} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide w-28 shrink-0">{tr({ fr: b.labelFr, en: b.labelEn }, lang)}</span>
                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${b.key === '90' ? 'bg-amber-600' : 'bg-slate-400'}`}
                            style={{ width: `${Math.max(3, (b.count / maxCount) * 100)}%` }}
                          ></div>
                        </div>
                        {/* Les pays s'affichent au survol du compte, pour garder le graphique lisible. */}
                        <span className="group relative w-20 text-end shrink-0">
                          <span className="text-xs font-bold text-slate-700 tabular-nums border-b border-dotted border-slate-300 cursor-help">
                            {b.count} {tr({ fr: 'pays', en: 'countries' }, lang)}
                          </span>
                          <span className="pointer-events-none absolute end-0 bottom-full mb-2 z-20 hidden group-hover:block w-64 text-start bg-slate-900 text-white rounded-md shadow-lg p-3">
                            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                              {tr({ fr: b.labelFr, en: b.labelEn }, lang)}
                            </h4>
                            <span className="block text-[11px] leading-relaxed">
                              {b.members.map((m) => tr(m.name, lang)).join(' · ')}
                            </span>
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <Prose className="text-[10px] text-slate-400 italic mt-4 pt-3 border-t border-slate-100" lang={lang}>{tr({ fr: "Survolez un effectif pour afficher les pays concernés. Les paliers sans aucun pays ne sont pas représentés.", en: "Hover a count to reveal the countries concerned. Bands with no country are not shown." }, lang)}</Prose>
                </div>
              );
            })()}

            {/* Toggle Vue Tableau / Vue Fiches */}
            <div className="flex bg-slate-200 p-1.5 rounded-lg w-fit mx-auto md:mx-0">
              <button
                onClick={() => setMatrixView('table')}
                className={`py-2 px-6 rounded-md text-xs font-bold transition-all flex items-center ${matrixView === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <TableProperties className="w-3.5 h-3.5 me-2" /> {tr({ fr: "Vue Tableau (Synthèse)", en: "Table View (Summary)" }, lang)}
              </button>
              <button
                onClick={() => setMatrixView('details')}
                className={`py-2 px-6 rounded-md text-xs font-bold transition-all flex items-center ${matrixView === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5 me-2" /> {tr({ fr: "Fiches Détaillées", en: "Detailed Sheets" }, lang)}
              </button>
            </div>

            {/* VUE : TABLEAU */}
            {matrixView === 'table' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{tr({ fr: "Région", en: "Region" }, lang)}</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{tr({ fr: "Pays", en: "Country" }, lang)}</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{tr({ fr: "Seuil Légal Visiteur", en: "Legal Visitor Threshold" }, lang)}</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">{tr({ fr: "Notes sur l'Obligation de Résidence", en: "Notes on the Residence Obligation" }, lang)}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {legalMatrixData.map((regionObj, rIdx) => (
                        <React.Fragment key={rIdx}>
                          {regionObj.countries.map((country, cIdx) => (
                            <tr key={cIdx} className="hover:bg-slate-50 transition-colors">
                              {cIdx === 0 && (
                                <td rowSpan={regionObj.countries.length} className="py-3 px-4 font-bold text-slate-900 bg-slate-50/50 align-top border-e border-slate-100">
                                  {tr(regionObj.region, lang)}
                                </td>
                              )}
                              <td className="py-3 px-4 font-bold text-slate-800">
                                <span className="inline-flex items-center gap-1.5">
                                  {tr(country.name, lang)}
                                  {(() => {
                                    const o = opennessByName(country.name.fr);
                                    return o ? <Star className={`w-3 h-3 shrink-0 ${visaOpenTiers[o.tier].dot}`} title={`${tr(visaOpenTiers[o.tier].label, lang)} — ${tr(o.note, lang)}`} /> : null;
                                  })()}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                                  {tr(country.threshold, lang)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 leading-relaxed">{tr(country.tableNotes, lang)}</td>
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
                    {tr({ fr: "Légende — ouverture aux ressortissants africains", en: "Legend — openness to African nationals" }, lang)}
                  </span>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {Object.entries(visaOpenTiers).map(([key, tier]) => (
                      <span key={key} className="flex items-start gap-1.5">
                        <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.dot}`} />
                        <span>
                          <span className="text-[11px] font-bold text-slate-700 block">{tr(tier.label, lang)}</span>
                          <span className="text-[10px] text-slate-500">
                            {key === 'full' && (tr({ fr: "Aucun visa requis, pour tous les Africains", en: "No visa required, for all Africans" }, lang))}
                            {key === 'partial' && (tr({ fr: "Ouvert, à l'exception de certains États", en: "Open, with named exceptions" }, lang))}
                            {key === 'announced' && (tr({ fr: "Mesure annoncée, pas encore effective", en: "Announced, not yet in force" }, lang))}
                          </span>
                        </span>
                      </span>
                    ))}
                  </div>
                  <Prose className="text-[10px] text-slate-400 italic mt-3" lang={lang}>{tr({ fr: "Sources : annonces officielles nationales et Africa Visa Openness Index (BAD/CUA, 2024). Même symbolique que dans l'Explorateur.", en: "Sources: official national announcements and the Africa Visa Openness Index (AfDB/AUC, 2024). Same symbols as in the Explorer." }, lang)}</Prose>
                </div>
              </div>
            )}

            {/* VUE : FICHES DÉTAILLÉES */}
            {matrixView === 'details' && (
              <div className="space-y-8 animate-in fade-in">
                {legalMatrixData.map((regionObj, rIdx) => (
                  <div key={rIdx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xl font-serif font-bold text-slate-900 mb-3 border-b border-slate-100 pb-3">{tr(regionObj.region, lang)}</h4>
                    <Prose className="text-sm text-slate-600 leading-relaxed mb-6 font-medium italic" lang={lang}>{tr(regionObj.intro, lang)}</Prose>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {regionObj.countries.map((country, cIdx) => (
                        <div key={cIdx} className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                              {tr(country.name, lang)}
                              {(() => {
                                const o = opennessByName(country.name.fr);
                                return o ? <Star className={`w-4 h-4 shrink-0 ${visaOpenTiers[o.tier].dot}`} title={`${tr(visaOpenTiers[o.tier].label, lang)} — ${tr(o.note, lang)}`} /> : null;
                              })()}
                            </h5>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{tr(country.threshold, lang)}</span>
                          </div>
                          <div className="text-xs text-slate-500 mb-4 pb-3 border-b border-slate-200">
                            <strong className="text-slate-700 uppercase tracking-widest">{tr({ fr: "Instrument : ", en: "Instrument: " }, lang)}</strong>
                            <span className="italic">{tr(country.instrument, lang)}</span>
                          </div>
                          <div className="space-y-3 flex-grow">
                            {country.details.map((detail, dIdx) => (
                              <div key={dIdx}>
                                <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{tr(detail.label, lang)}</h6>
                                <Prose className="text-xs text-slate-800 leading-relaxed" lang={lang}>{tr(detail.text, lang)}</Prose>
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
                <BookOpen className="w-4 h-4 me-2 text-slate-400" />
                {tr({ fr: "Liste des Instruments Juridiques Analysés (Sources)", en: "List of Legal Instruments Analyzed (Sources)" }, lang)}
              </h4>
              <div className="h-48 overflow-y-auto pe-4 custom-scrollbar text-xs text-slate-600 leading-relaxed space-y-3">
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
  <div className="space-y-8 animate-in fade-in duration-500">
    <PageHeader
      badge={text.headers.explorer.badge}
      plate={"Pl. VII"}
      plain={text.headers.explorer.plain}
      lang={lang}
      title={text.headers.explorer.title}
      highlight={text.headers.explorer.highlight}
      desc={text.headers.explorer.desc}
      icon={MapIcon}
    />

    <BarreSection lang={lang} />

    <div className="flex flex-col lg:flex-row gap-8 items-start">
      
      {/* SIDEBAR GAUCHE : NAVIGATION */}
      <div className="w-full lg:w-1/4 space-y-6 lg:sticky lg:top-24">
        
        {/* RECHERCHE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
          <Search className="absolute start-7 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            /* Un placeholder n'est pas un nom accessible : il disparait des qu'on
               saisit et n'est pas restitue de facon fiable par les lecteurs d'ecran. */
            aria-label={tr({ fr: 'Rechercher un pays', en: 'Search for a country' }, lang)}
            placeholder={text.sidebar.search}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg ps-10 pe-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTRES DE RÉGION */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <MapIcon className="w-3.5 h-3.5 me-1.5" />
            {text.sidebar.title}
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveSubRegion('all'); setActiveSubTab('perspective'); setSearchTerm(''); }}
              className={`w-full text-start px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center ${activeSubRegion === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Globe className={`w-4 h-4 me-2.5 ${activeSubRegion === 'all' ? 'text-blue-400' : 'text-slate-400'}`} />
              {text.all_regions}
            </button>
            
            <div className="pt-3 pb-2">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-4">{text.sidebar.subregion}</span>
            </div>
            
            {Object.keys(text.regions).map(regionKey => (
              <button
                key={regionKey}
                onClick={() => { setActiveSubRegion(regionKey); setActiveSubTab('perspective'); setSearchTerm(''); }}
                className={`w-full text-start px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-between items-center group ${activeSubRegion === regionKey ? 'bg-blue-50 text-blue-800 border border-blue-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
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
            {tr({ fr: 'Profils Nationaux', en: 'National Profiles' }, lang)} ({filteredCountries.length})
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
                    <span className={`me-3 p-1.5 rounded-lg bg-slate-50 border border-slate-200 ${display.flagColor || 'text-blue-700'}`}>
                      <display.flagIcon className="w-6 h-6" />
                    </span>
                  ) : (
                    <span className="me-3 text-3xl">{display.flag}</span>
                  )}
                  {display.name}
                </h2>
              </div>
              <button onClick={() => setShowModal(true)} className="hidden md:flex items-center space-x-2 rtl:space-x-reverse bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-md font-bold text-xs transition shadow-sm">
                <BarChart3 className="w-4 h-4" />
                <span>{text.analysis_btn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><Users className="w-3 h-3 me-1.5" /> {text.metrics.stock}</span>
                <div className="text-3xl font-serif font-bold text-slate-900">{display.stock}</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><PieChart className="w-3 h-3 me-1.5" /> {text.metrics.evolution}</span>
                <div className="text-3xl font-serif font-bold text-blue-700">{display.evolution}%</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><HeartPulse className="w-3 h-3 me-1.5" /> {text.metrics.female}</span>
                <div className="text-3xl font-serif font-bold text-rose-700">{display.female}%</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-emerald-50/60 p-5 rounded-lg border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 block flex items-center"><ArrowRight className="w-3 h-3 me-1.5" /> {tr({ fr: "Rétention (Sud)", en: "Retention (South)" }, lang)}</span>
                <div className="text-3xl font-serif font-bold text-emerald-700">{display.retention}%</div>
              </div>
              <div className="bg-amber-50/60 p-5 rounded-lg border border-amber-100">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1.5 block flex items-center"><TrendingUp className="w-3 h-3 me-1.5" /> {tr({ fr: "Transferts (% PIB, moy.)", en: "Remittances (% GDP, avg.)" }, lang)}</span>
                <div className="text-3xl font-serif font-bold text-amber-700">{display.remittances !== null && display.remittances !== undefined ? `${display.remittances}%` : (tr({ fr: 'N/D', en: 'N/A' }, lang))}</div>
              </div>
              <div className="bg-indigo-50/60 p-5 rounded-lg border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 block flex items-center"><Briefcase className="w-3 h-3 me-1.5" /> {tr({ fr: "Activité Migrants (OIT, moy.)", en: "Migrant Activity (ILO, avg.)" }, lang)}</span>
                <div className="text-3xl font-serif font-bold text-indigo-700">{display.labour_participation !== null && display.labour_participation !== undefined ? `${display.labour_participation}%` : (tr({ fr: 'N/D', en: 'N/A' }, lang))}</div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-widest flex items-center">
                <TableProperties className="w-4 h-4 me-2" />
                {text.comparative_view_title}
              </h3>
              <Prose className="text-sm text-slate-700 leading-relaxed font-medium" lang={lang}>{text.comparative_view_desc}</Prose>
              
              {/* Distribution Bar if available (for 'all' regions view) */}
              {display.distribution && (
                <div className="mt-6 pt-5 border-t border-blue-200/50">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-800">{tr(display.distribution[0].label, lang)} ({display.distribution[0].value}%)</span>
                    <span className="text-slate-600">{tr(display.distribution[1].label, lang)} ({display.distribution[1].value}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${display.distribution[0].value}%`}}></div>
                    <div className="h-full bg-slate-500 transition-all duration-1000" style={{width: `${display.distribution[1].value}%`}}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowModal(true)} className="w-full mt-6 md:hidden flex justify-center items-center space-x-2 rtl:space-x-reverse bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-md font-bold text-sm transition shadow-sm">
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
                    {tr({ fr: "Lecture cartographique", en: "Map view" }, lang)}
                  </h3>
                  {/* Ce que montre la carte, dit simplement — puis la definition
                      technique de l'indicateur, pour qui la cherche. */}
                  <p className="text-[13px] text-slate-700 mt-1 max-w-xl leading-relaxed">
                    {mapIndicator.plain
                      ? tr(mapIndicator.plain, lang)
                      : tr(mapIndicator.hint, lang)}
                    {mapIndicator.term && (
                      <> <Terme k={mapIndicator.term} lang={lang}>
                        {tr({ fr: 'Voir la définition', en: 'See the definition' }, lang)}
                      </Terme></>
                    )}
                  </p>
                  <Prose className="text-[11px] mt-1 max-w-xl leading-relaxed" style={{ color: 'var(--label)' }} lang={lang}>{tr(mapIndicator.hint, lang)}</Prose>
                </div>
                <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 shrink-0">
                  <button
                    onClick={() => setExplorerView('map')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${explorerView === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tr({ fr: 'Carte', en: 'Map' }, lang)}
                  </button>
                  <button
                    onClick={() => setExplorerView('list')}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${explorerView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tr({ fr: 'Liste', en: 'List' }, lang)}
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
                        {tr(ind.label, lang)}
                      </button>
                    ))}
                  </div>
                  <AfricaChoropleth
                    indicator={mapIndicator}
                    lang={lang}
                    selectedId={activeSubTab}
                    onSelect={(id) => setActiveSubTab(id)}
                    region={activeSubRegion !== 'all' ? activeSubRegion : null}
                  />
                </>
              )}
            </div>

            {/* Feuilletage des pays. La grille de drapeaux sert a viser un pays
                qu'on connait deja ; le rail sert a parcourir, en montrant sur
                chaque carte de quoi decider si l'on veut entrer. */}
            {filteredCountries.length > 1 && (
              <RailCartes
                lang={lang}
                className={`mb-6 print:hidden ${explorerView === 'map' ? 'hidden' : ''}`}
                etiquette={tr({ fr: `Feuilleter — ${filteredCountries.length} pays`, en: `Browse — ${filteredCountries.length} countries` }, lang)}
              >
                {filteredCountries.map(c => {
                  const openness = visaOpenToAllAfrica[c.iso2];
                  const actif = activeSubTab === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveSubTab(c.id)}
                      aria-current={actif ? 'true' : undefined}
                      className="lift text-start bg-white border p-4 flex flex-col gap-3"
                      style={{ borderColor: actif ? 'var(--accent)' : 'var(--rule)' }}
                    >
                      <span className="flex items-center gap-2.5">
                        <CountryFlag iso2={c.iso2} emoji={c.flag} size="md" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif font-bold text-base text-slate-900 truncate">
                            {tr(c.name, lang) || c.name.fr}
                          </span>
                          <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">
                            {text.regions[countryRegionMap[c.id]] || ''}
                          </span>
                        </span>
                        {openness && (
                          <Star className={`w-3.5 h-3.5 shrink-0 ${visaOpenTiers[openness.tier].dot}`}
                                aria-label={tr(visaOpenTiers[openness.tier].label, lang)} />
                        )}
                      </span>
                      <span className="grid grid-cols-3 gap-2 pt-2.5 border-t" style={{ borderColor: 'var(--rule)' }}>
                        {[
                          { l: tr({ fr: 'Migrants', en: 'Migrants' }, lang), v: <Num value={c.stock} lang={lang} /> },
                          { l: tr({ fr: '% pop.', en: '% pop.' }, lang), v: <><Num value={c.evolution} lang={lang} /> %</> },
                          { l: 'AVOI', v: <><Num value={c.avoi} lang={lang} /> /100</> },
                        ].map(x => (
                          <span key={x.l} className="block">
                            <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">{x.l}</span>
                            <span className="block font-serif font-bold text-sm text-slate-900 tabular-nums">{x.v}</span>
                          </span>
                        ))}
                      </span>
                      <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
                            style={{ color: 'var(--accent-deep)' }}>
                        {tr({ fr: 'Ouvrir la fiche', en: 'Open the profile' }, lang)}
                        <ArrowRight className="w-3 h-3" aria-hidden="true" />
                      </span>
                    </button>
                  );
                })}
              </RailCartes>
            )}

            {/* Grille des drapeaux pour navigation rapide */}
            <div className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm ${explorerView === 'map' ? 'hidden' : ''}`}>
              {filteredCountries.length === 0 && (
                <div className="w-full p-4 text-center text-slate-400 text-sm">
                  {tr({ fr: 'Aucun pays trouvé.', en: 'No country found.' }, lang)}
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
                                title={openness ? `${tr(visaOpenTiers[openness.tier].label, lang)} — ${tr(openness.note, lang)}` : undefined}
                                className={`px-3 py-1.5 rounded border transition-all text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse ${
                                  activeSubTab === c.id
                                    ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                                }`}
                              >
                                <CountryFlag iso2={c.iso2} emoji={c.flag} size="sm" />
                                <span className="hidden sm:inline">{tr(c.name, lang) || c.name.fr}</span>
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
                        title={openness ? `${tr(visaOpenTiers[openness.tier].label, lang)} — ${tr(openness.note, lang)}` : undefined}
                        className={`px-3 py-1.5 rounded border transition-all text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse ${
                          activeSubTab === c.id
                            ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-md'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <CountryFlag iso2={c.iso2} emoji={c.flag} size="sm" />
                        <span className="hidden sm:inline">{tr(c.name, lang) || c.name.fr}</span>
                        {openness && <Star className={`w-3 h-3 shrink-0 ${visaOpenTiers[openness.tier].dot}`} />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-x-5 gap-y-2">
                <CsvButton onClick={exportCountriesCSV} label={tr({ fr: "54 pays — tous indicateurs (CSV)", en: "54 countries — all indicators (CSV)" }, lang)} className="basis-full sm:basis-auto justify-center" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  {tr({ fr: "Ouverture aux ressortissants africains", en: "Openness to African nationals" }, lang)}
                </span>
                {Object.entries(visaOpenTiers).map(([key, tier]) => (
                  <span key={key} className="flex items-center gap-1.5">
                    <Star className={`w-3 h-3 ${tier.dot}`} />
                    <span className="text-[10px] font-bold text-slate-500">{tr(tier.label, lang)}</span>
                  </span>
                ))}
                <span className="text-[10px] text-slate-400 italic basis-full">
                  {tr({ fr: "Sources : annonces officielles nationales et ", en: "Sources: official national announcements and " }, lang)}
                  <a href="https://www.visaopenness.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-700">
                    {tr({ fr: "Africa Visa Openness Index (BAD/CUA, 2024)", en: "Africa Visa Openness Index (AfDB/AUC, 2024)" }, lang)}
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
                      <CountryFlag iso2={display.iso2} emoji={display.flag} size="md" className="me-3" />
                      {display.name}
                      {visaOpenToAllAfrica[display.iso2] && (
                        <Star className={`w-5 h-5 ms-3 ${visaOpenTiers[visaOpenToAllAfrica[display.iso2].tier].dot}`} />
                      )}
                    </h2>
                    {visaOpenToAllAfrica[display.iso2] && (() => {
                      const o = visaOpenToAllAfrica[display.iso2];
                      const tier = visaOpenTiers[o.tier];
                      return (
                        <div className={`mt-3 inline-flex items-start gap-2 px-3 py-2 rounded-md border max-w-2xl ${tier.style}`}>
                          <Star className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tier.dot}`} />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest block">{tr(tier.label, lang)}</span>
                            <span className="text-xs leading-relaxed block mt-0.5">{tr(o.note, lang)}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <button onClick={() => setShowModal(true)} className="hidden md:flex items-center space-x-2 rtl:space-x-reverse px-5 py-2.5 font-bold text-xs transition shrink-0 self-start" style={{ backgroundColor: 'var(--ink)', color: '#FFFDF9', borderRadius: 2, boxShadow: 'inset 2px 0 0 var(--accent)' }}>
                    <Target className="w-4 h-4" />
                    <span>{text.analysis_btn}</span>
                  </button>
                </div>

                {/* Releve d'indicateurs, groupe par ce qu'il dit et source par famille. */}
                <div className="border border-slate-200 mb-6 stagger">
                  {[
                    {
                      title: tr({ fr: "Qui est là", en: 'Who is there' }, lang),
                      source: 'UN DESA (2024)',
                      wash: 'wash-inkblue', tone: 'figure-inkblue', dot: 'var(--accent-2)',
                      cells: [
                        { v: <Num value={display.stock} lang={lang} />, l: tr({ fr: 'Migrants internationaux', en: 'International migrants' }, lang)},
                        { v: `${fmtNum(display.evolution, lang)} %`, l: tr({ fr: 'De la population nationale', en: 'Of the national population' }, lang)},
                        { v: `${fmtNum(display.female, lang)} %`, l: tr({ fr: 'De femmes parmi eux', en: 'Women among them' }, lang)},
                      ],
                    },
                    {
                      title: tr({ fr: "D'où l'on vient", en: 'Where they come from' }, lang),
                      source: 'UA / OIT / OIM / CEA (2021)',
                      wash: 'wash-terra', tone: 'figure-terra', dot: 'var(--accent)',
                      cells: [
                        { v: `${fmtNum(display.retention, lang)} %`, l: tr({ fr: 'Rétention Sud-Sud', en: 'South-South retention' }, lang)},
                      ],
                    },
                    {
                      title: tr({ fr: 'Ce que cela produit', en: 'What it produces' }, lang),
                      source: tr({ fr: 'Banque mondiale / OIT', en: 'World Bank / ILO' }, lang),
                      wash: 'wash-ok', tone: 'figure-ok', dot: 'var(--ok)',
                      cells: [
                        {
                          v: display.remittances != null ? `${fmtNum(display.remittances, lang)} %` : (tr({ fr: 'N/D', en: 'N/A' }, lang)),
                          l: (tr({ fr: 'Transferts de fonds (% PIB)', en: 'Remittances (% GDP)' }, lang))
                             + (display.remittances_year ? ` — ${display.remittances_year}` : ''),
                        },
                        {
                          v: display.labour_participation != null ? `${fmtNum(display.labour_participation, lang)} %` : (tr({ fr: 'N/D', en: 'N/A' }, lang)),
                          l: (tr({ fr: "Activité des migrants", en: 'Migrant labour activity' }, lang))
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
                     <Info className="w-5 h-5 text-amber-600 me-3 shrink-0 mt-0.5" />
                     <p className="text-sm text-amber-900 font-medium leading-relaxed">{display.impact}</p>
                   </div>
                )}
                
                <button onClick={() => setShowModal(true)} className="w-full mt-4 md:hidden flex justify-center items-center space-x-2 rtl:space-x-reverse px-5 py-3 font-bold text-sm transition" style={{ backgroundColor: 'var(--ink)', color: '#FFFDF9', borderRadius: 999 }}>
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
        <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">{tr(item.type, lang)}</span>
        {essential ? <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> : <span className="text-[9px] font-bold text-slate-400">{item.year}</span>}
      </div>
      <div className="flex items-start justify-between gap-2">
        <span className={`font-bold text-slate-800 leading-snug group-hover:text-amber-900 ${essential ? 'text-sm' : 'text-xs'}`}>{item.title}</span>
        {item.url && !essential && <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 shrink-0 mt-0.5" />}
      </div>
      <Prose className={`text-slate-500 leading-relaxed text-xs ${essential ? 'flex-1' : ''}`} lang={lang}>{tr(item.desc, lang)}</Prose>
      {essential && (
        <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-1">
          {item.url ? <>{tr({ fr: 'Consulter', en: 'View source' }, lang)} <ExternalLink className="w-3 h-3" /></> : (tr({ fr: `Année ${item.year}`, en: `Year ${item.year}` }, lang))}
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.library.badge}
        plate={"Pl. IX"}
        plain={text.headers.library.plain}
        lang={lang}
        title={text.headers.library.title}
        highlight={text.headers.library.highlight}
        desc={text.headers.library.desc}
        icon={BookOpen}
      />

      <BarreSection lang={lang} />
      {children}

      <div>
        <h3 className="flex items-center text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
          <Star className="w-4 h-4 me-2 text-amber-500 fill-amber-400" />
          {tr({ fr: "Essentiels — Pour Commencer", en: "Essentials — Start Here" }, lang)}
          <CsvButton onClick={exportLibraryCSV} label={tr({ fr: "Bibliographie (CSV)", en: "Bibliography (CSV)" }, lang)} className="ms-auto normal-case tracking-normal" />
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {essentials.map((item, idx) => <LibraryCard key={idx} item={item} lang={lang} essential />)}
        </div>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            aria-label={tr({ fr: 'Rechercher dans la bibliothèque', en: 'Search the library' }, lang)}
            placeholder={tr({ fr: "Rechercher une source, un auteur, un mot-clé…", en: "Search a source, author, keyword…" }, lang)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg ps-10 pe-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${activeFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
          >
            {tr({ fr: 'Tout voir', en: 'View All' }, lang)} ({totalDocs})
          </button>
          {libraryData.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setActiveFilter(String(idx))}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${activeFilter === String(idx) ? 'bg-amber-700 text-white border-amber-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {tr(section.section, lang)} ({section.items.length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        {noResults ? (
          <div className="p-16 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <Prose className="text-slate-500 text-sm" lang={lang}>{tr({ fr: "Aucune source ne correspond à votre recherche.", en: "No source matches your search." }, lang)}</Prose>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.idx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
                <section.icon className="w-5 h-5 me-2.5 text-amber-700" />
                {tr(section.section, lang)}
                <span className="ms-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{section.items.length}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {section.items.map((item, iIdx) => <LibraryCard key={iIdx} item={item} lang={lang} />)}
              </div>
            </div>
          ))
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-xs text-amber-800 leading-relaxed">
          {tr({ fr: `Cette bibliothèque rassemble ${totalDocs} sources institutionnelles, juridiques et académiques vérifiées — dont une sélection tirée du corpus bibliographique de la thèse à l'origine de cette plateforme. Chaque référence pointe vers son texte ou portail officiel lorsqu'un lien stable existe.`, en: `This library gathers ${totalDocs} verified institutional, legal, and academic sources — including a selection drawn from the bibliographic corpus of the thesis behind this platform. Each reference links to its official text or portal where a stable link exists.` }, lang)}
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
      <Chapitre lang={lang}>
        <div className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-5 pb-6 border-b border-slate-100">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="p-3 bg-slate-100 rounded-sm border border-slate-200"><BookOpen className="h-6 w-6 text-slate-700" /></div>
              <div>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 tracking-tight">{text.sections.data}</h2>
                <Prose className="text-slate-500 text-sm mt-2 leading-relaxed max-w-3xl" lang={lang}>{text.indicator_desc}</Prose>
              </div>
            </div>
            <button onClick={exportIndicatorsCSV} className="flex items-center space-x-2 rtl:space-x-reverse bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-sm font-bold text-xs transition-all border border-slate-300 shadow-sm shrink-0">
              <Download className="w-4 h-4" /> <span>{text.download_indicators}</span>
            </button>
          </div>
  
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-10 flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <Prose className="text-xs text-amber-900 leading-relaxed text-justify" lang={lang}>{tr({ fr: "Les autres sections de cette plateforme consolident des données déjà collectées par les institutions internationales. Cette matrice, elle, est une proposition originale issue de la recherche doctorale à l'origine du projet. Elle propose 12 indicateurs alternatifs, pensés en contrepoint des cadres statistiques dominants — stocks migratoires, index sécuritaires, cibles ODD. Ils visent des dimensions structurellement sous-documentées des mobilités africaines, qu'aucune mesure continentale ne couvre encore — résilience économique diasporique, féminisation des flux, mobilité circulaire, décriminalisation de l'irrégularité. Chaque fiche explicite, dans « Le Changement de Paradigme », le récit qu'elle vient déplacer. Il s'agit d'une recommandation méthodologique adressée aux instituts nationaux de statistique et aux chercheurs de terrain — pas d'un jeu de données déjà constitué.", en: "Unlike the other sections of this platform — which consolidate data already collected by international institutions — this matrix is an original proposal stemming from the doctoral research behind the project. It proposes 12 alternative indicators, designed as a counterpoint to dominant statistical frameworks — migrant stocks, security indices, SDG targets. They target structurally under-documented dimensions of African mobility, none of which any continental measure yet covers — diaspora economic resilience, feminization of flows, circular mobility, decriminalization of irregularity. Each card spells out, under \"The Paradigm Shift\", the narrative it displaces. This is a methodological recommendation aimed at national statistical institutes and field researchers — not an already-constituted dataset." }, lang)}</Prose>
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {indicatorThemes.map((theme, i) => (
              <div key={i}>
                <h3 className={`flex items-center text-base font-serif font-bold ${theme.color} mb-5`}>
                  {React.cloneElement(theme.icon, { className: "w-5 h-5 me-2" })} 
                  {tr({ fr: theme.theme_fr, en: theme.theme_en }, lang)}
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
                      <Prose className="text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug relative z-10" lang={lang}>{tr({ fr: ind.fr, en: ind.en }, lang)}</Prose>
                      {(tr({ fr: ind.desc_fr, en: ind.desc_en }, lang)) && (
                        <Prose className="text-xs text-slate-500 mt-1.5 leading-relaxed relative z-10" lang={lang}>{tr({ fr: ind.desc_fr, en: ind.desc_en }, lang)}</Prose>
                      )}
                        
                      {/* depliable : la hauteur reelle est animee. L'ancien
                          max-h-96 imposait un plafond de 384 px — au-dela, la
                          fiche etait tronquee sans que rien ne le signale. */}
                      <div data-ouvert={expandedIndicator === ind.id ? 'true' : 'false'}
                           className={`depliable w-full overflow-hidden transition-all duration-500 relative z-10 print:!max-h-none print:!opacity-100 print:mt-4 print:pt-4 print:border-t print:border-slate-200 print:break-inside-avoid ${expandedIndicator === ind.id ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
                        <div className="space-y-4">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Search className="w-3 h-3" />{tr({ fr: "Méthodologie & Collecte", en: "Methodology & Data Collection" }, lang)}</span>
                            <Prose className="text-xs text-slate-700 leading-relaxed" lang={lang}>{tr({ fr: ind.method_fr, en: ind.method_en }, lang)}</Prose>
                          </div>
                          <div className="bg-white p-3 rounded-sm border border-slate-200">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1 flex items-center gap-1"><Lightbulb className="w-3 h-3" />{tr({ fr: "Le Changement de Paradigme", en: "The Paradigm Shift" }, lang)}</span>
                            <Prose className="text-xs text-slate-800 italic leading-relaxed" lang={lang}>{tr({ fr: ind.contrast_fr, en: ind.contrast_en }, lang)}</Prose>
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
      </Chapitre>
    </section>
);

// Frise des cycles de recensement d'un pays (base : compilation de l'auteur d'apres l'UNSD).
const CensusTimeline = ({ iso2, lang, compact = false }) => {
  const rec = iso2 ? censusByCountry[iso2] : null;
  if (!rec) return null;
  const L = faireL(lang);
  const st = census2020Status[rec.status2020] || census2020Status.none;

  return (
    <div className={compact ? '' : 'bg-white p-7 rounded-lg border border-slate-200 shadow-sm'}>
      {!compact && (
        <>
          <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg">
            <Calendar className="w-5 h-5 me-2.5 text-slate-400" /> {L("Recensements de la population", "Population censuses")}
          </h3>
          <Prose className="text-sm text-slate-600 mb-5" lang={lang}>{L("Dates des recensements nationaux par cycle décennal. Le recensement reste la source la plus complète sur les migrants présents sur un territoire.",
               "National census dates by decennial round. The census remains the most comprehensive source on migrants present in a territory.")}</Prose>
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
              <span className="block text-[9px] font-bold uppercase tracking-widest opacity-70">{tr(r.label, lang)}</span>
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
            ? tr(st, lang)
            : `${L("Cycle 2020 : ", "2020 round: ")}${tr(st, lang)}`}
        </span>
        {rec.updated2026 && (
          <span className="text-[10px] font-medium" style={{ color: 'var(--label)' }}>
            <span className="font-bold" style={{ color: 'var(--accent-2)' }}>
              {L("Vérifié en août 2026 — ", "Verified August 2026 — ")}
            </span>
            {typeof rec.updated2026 === 'string' ? rec.updated2026 : tr(rec.updated2026, lang)}
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
        <Prose className="text-[10px] text-slate-400 italic mt-3 pt-3 border-t border-slate-100" lang={lang}>{L("Source : compilation de l'auteur (Ben Mokhtar, 2024) d'après la Division de statistique des Nations unies (UNSD) et UN DESA.",
             "Source: author's own compilation (Ben Mokhtar, 2024) from the United Nations Statistics Division (UNSD) and UN DESA.")}</Prose>
      )}
    </div>
  );
};

const TabDataStats = ({ text, lang, exportCensusCSV, expandedIndicator, setExpandedIndicator, exportIndicatorsCSV }) => {
  const L = faireL(lang);
  const headline = [
    { val: "47/54", lbl: L("États ayant recensé (cycle 2010)", "States that censused (2010 round)"), sub: L("soit 87 % du continent", "i.e. 87% of the continent") },
    { val: "11,1", lbl: L("Années entre deux recensements", "Years between two censuses"), sub: L("recommandation ONU : 10 ans", "UN recommendation: 10 years") },
    { val: "1-5 €", lbl: L("Coût par habitant recensé", "Cost per inhabitant enumerated"), sub: L("charge logistique majeure", "a major logistical burden") },
    { val: "13,6 %", lbl: L("Recensements interrogeant le motif", "Censuses asking the reason"), sub: L("le déficit est là, pas dans la collecte", "the deficit sits here, not in collection") },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.data.badge}
        plate={"Pl. VIII"}
        plain={text.headers.data.plain}
        lang={lang}
        title={text.headers.data.title}
        highlight={text.headers.data.highlight}
        desc={text.headers.data.desc}
        icon={Database}
      />

      <BarreSection lang={lang} />

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
          <Prose lang={lang}>{L(
            "Lors du cycle de recensements de 2010 — qui court en pratique de 2006 à 2014 — 47 États africains sur 54 ont conduit un recensement national, soit 87 % du continent. À l'échelle mondiale, 178 des 193 États membres de l'ONU en ont fait autant : la participation africaine se situe donc dans la norme internationale, et non en marge d'elle.",
            "During the 2010 census round — which in practice runs from 2006 to 2014 — 47 of 54 African states conducted a national census, that is 87% of the continent. Globally, 178 of the UN's 193 member states did the same: African participation therefore sits within the international norm, not at its margins."
          )}</Prose>
          <Prose lang={lang}>{L(
            "Le rythme observé est de 11,1 ans entre deux recensements, pour une recommandation onusienne de dix ans. Le coût est compris entre 1 et 5 € par habitant dénombré (Gendreau & Dackam-Ngatchou, 2023). Rapportée à la contrainte budgétaire et logistique que représente un recensement exhaustif, cette régularité traduit une priorité politique assumée, non une défaillance.",
            "The observed rhythm is 11.1 years between two censuses, against a UN recommendation of ten, at a cost of between €1 and €5 per inhabitant enumerated (Gendreau & Dackam-Ngatchou, 2023). Set against the budgetary and logistical constraint an exhaustive census represents, this regularity reflects a deliberate political priority, not a failure."
          )}</Prose>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-5 flex items-start gap-3 max-w-4xl">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <Prose className="text-xs text-amber-900 leading-relaxed text-justify" lang={lang}>{L(
              "Derrière le taux, la qualité des dénombrements reste à établir. Sept États n'ont pas recensé durant le cycle 2010 — " + censusNoRound2010.join(", ") + " — et la République démocratique du Congo n'a conduit qu'un seul recensement dans son histoire, en 1984. L'Éthiopie a recensé, mais sans question sur la migration internationale.",
              "Behind the rate, enumeration quality remains to be established. Seven states did not census during the 2010 round — " + censusNoRound2010En.join(", ") + " — and the Democratic Republic of the Congo has conducted only one census in its history, in 1984. Ethiopia censused, but without any question on international migration."
            )}</Prose>
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
            fr: "Chaque pays porte la couleur de son dernier recensement : abouti dans la fenêtre 2015-2024, abouti après elle, en cours, annoncé, ou aucun en vue. Cinq situations, sur une échelle qualitative.",
            en: 'Each country carries the colour of its latest census: completed within the 2015-2024 window, completed after it, under way, announced, or none in sight. Five situations, on a qualitative scale.',
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
          <Prose className="text-justify" lang={lang}>{L(
              "Un recensement n'est pas un dénombrement quelconque. Depuis 1958, les Nations unies en codifient la définition et en promeuvent des programmes décennaux mondiaux. La troisième révision de la norme, publiée en 2017, énumère cinq caractéristiques sans lesquelles une opération ne peut être qualifiée de recensement.",
              "A census is not just any headcount. Since 1958 the United Nations has codified its definition and promoted decennial worldwide census programmes. The standard's third revision, published in 2017, lists five features without which an operation cannot be called a census."
            )}</Prose>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            {(tr({ fr: [
              ["Dénombrement individuel", "chaque personne est comptée séparément, avec ses caractéristiques propres"],
              ["Universalité sur un territoire défini", "toute la population du territoire, sans exception"],
              ["Simultanéité", "tous rapportés à un même instant de référence"],
              ["Périodicité définie", "à intervalles réguliers, pour que les cycles soient comparables"],
              ["Capacité à produire des statistiques locales", "descendre sous le niveau national"],
            ], en: [
              ["Individual enumeration", "each person counted separately, with their own characteristics"],
              ["Universality within a defined territory", "the whole population of the territory, no exception"],
              ["Simultaneity", "all referred to one and the same reference moment"],
              ["Defined periodicity", "at regular intervals, so that rounds remain comparable"],
              ["Capacity to produce small-area statistics", "going below the national level"],
            ] }, lang)).map(([name, gloss], i) => (
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
            <Prose className="text-[13px] text-slate-600 italic leading-relaxed" lang={lang}>{L(
                "« Il est recommandé qu'un recensement national soit conduit au moins tous les dix ans. » La norme ajoute que les pays devraient s'efforcer de recenser lors des années se terminant par « 0 », ou au plus près, afin que les résultats restent comparables d'un pays à l'autre.",
                "\"It is recommended that a national census be taken at least every 10 years.\" The standard adds that countries should make all efforts to census in years ending in \"0\", or as close as possible, so that results remain comparable across countries."
              )}</Prose>
            <Prose className="text-xs text-slate-500 mt-3 leading-relaxed" lang={lang}>{L(
                "C'est l'étalon utile : l'intervalle moyen observé en Afrique est de 11,1 ans. L'écart à la norme est d'un an, pas d'une génération.",
                "This is the useful yardstick: the average interval observed in Africa is 11.1 years. The gap to the standard is one year, not a generation."
              )}</Prose>
          </div>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2.5">
              {L(
                "Les caractéristiques de migration internationale prévues par la norme",
                "The international migration characteristics the standard provides for"
              )}
            </h4>
            <ul className="space-y-1">
              {(tr({ fr: [
                ["Pays de naissance", true],
                ["Pays de citoyenneté", true],
                ["Année ou période d'arrivée dans le pays", true],
                ["Acquisition de la citoyenneté", false],
              ], en: [
                ["Country of birth", true],
                ["Country of citizenship", true],
                ["Year or period of arrival in the country", true],
                ["Acquisition of citizenship", false],
              ] }, lang)).map(([name, core], i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-1.5 text-[13px]" style={{ borderBottom: '1px solid var(--rule)' }}>
                  <span className="text-slate-700">{name}</span>
                  <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: core ? 'var(--accent-2)' : 'var(--muted)' }}>
                    {core ? L("Thème central", "Core topic") : L("Thème additionnel", "Additional topic")}
                  </span>
                </li>
              ))}
            </ul>
            <Prose className="text-xs text-slate-500 mt-3 leading-relaxed text-justify" lang={lang}>{L(
                "Trois de ces quatre caractéristiques sont des « thèmes centraux » : la norme recommande que tout recensement les collecte. L'instrument de mesure des migrations est donc déjà à l'intérieur du standard que les États africains appliquent. L'outil est là ; ce qui se perd se perd en aval, au dépouillement et à la publication.",
                "Three of these four characteristics are \"core topics\": the standard recommends that every census collect them. The instrument for measuring migration is therefore already inside the standard African states apply. The tool is there; what gets lost is lost downstream, in tabulation and publication."
              )}</Prose>
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
        <Prose className="text-sm text-slate-500 leading-relaxed max-w-4xl mb-6" lang={lang}>{L(
            "Part des 47 recensements africains du cycle 2010 comportant chaque question migratoire. La citoyenneté et le pays de naissance sont presque systématiques ; le motif du départ et la date d'arrivée disparaissent presque entièrement.",
            "Share of the 47 African censuses in the 2010 round including each migration question. Citizenship and country of birth are near-systematic; reason for leaving and date of arrival almost entirely vanish."
          )}</Prose>

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
                    {tr(r.label, lang)} <span className="text-slate-400 font-normal">({r.span})</span>
                  </span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden relative"
                       style={r.inProgress
                         ? { background: 'repeating-linear-gradient(135deg, var(--paper-sunk) 0 5px, #FFF 5px 10px)' }
                         : { backgroundColor: '#F1F5F9' }}>
                    <div className={`h-full rounded-full bar-fill ${r.inProgress ? '' : 'bg-teal-600'}`}
                         style={{ width: `${pct}%`, ...(r.inProgress ? { backgroundColor: 'var(--accent-2)' } : null) }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-24 text-end shrink-0 tabular-nums">
                    {r.conducted}/{r.base} · {pct} %
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] mt-3 leading-relaxed" style={{ color: 'var(--label)' }}>
            <span className="inline-block w-3 h-2 me-1.5 align-middle rounded-sm"
                  style={{ background: 'repeating-linear-gradient(135deg, var(--paper-sunk) 0 3px, #FFF 3px 6px)', border: '1px solid var(--rule)' }} />
            {L("Le cycle 2030 vient de s'ouvrir (fenêtre 2025-2034) : sa barre mesure une avance, pas un retard.",
               "The 2030 round has only just opened (2025–2034 window): its bar measures progress, not shortfall.")}
          </p>
          <Prose className="text-[10px] text-slate-500 italic mt-1.5 leading-relaxed text-justify" lang={lang}>{L("Le dénominateur varie : il correspond au nombre d'États africains indépendants au moment de chaque cycle. Compilation arrêtée en septembre 2024, puis actualisée en 2026 pour les recensements aboutis depuis : Angola, Maroc, Tunisie, Ouganda. Un audit des statuts encore ouverts, en août 2026, y a ajouté la Gambie (mai 2024) et São Tomé-et-Principe (novembre 2024). Le cycle 2020 passe ainsi de 29 à 35 États.",
               "The denominator varies: it reflects the number of independent African states at the time of each round. Compilation closed in September 2024, then updated in 2026 for censuses completed since: Angola, Morocco, Tunisia, Uganda. An audit of the statuses still open, in August 2026, added The Gambia (May 2024) and São Tomé and Príncipe (November 2024). The 2020 round thus moves from 29 to 35 states.")}</Prose>
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
                {tr(q.label, lang)}
              </span>
              {/* Teinte unique : la grandeur est deja portee par la longueur. */}
              <div className="flex-1 h-4 overflow-hidden" style={{ backgroundColor: 'var(--paper-sunk)' }}>
                <div className="h-full bar-fill"
                     style={{ width: `${q.pctRound}%`, backgroundColor: 'var(--accent)' }} />
              </div>
              <span className="text-xs font-bold text-slate-700 w-24 text-end shrink-0 tabular-nums">
                {q.states}/47 · {String(q.pctRound).replace('.', ',')} %
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 p-5" style={{ backgroundColor: 'var(--paper-sunk)', borderLeft: '2px solid var(--accent-2)' }}>
          <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            {L("Ce que le croisement avec la norme révèle", "What the overlay with the standard reveals")}
          </h4>
          <Prose className="text-[13px] text-slate-600 leading-relaxed text-justify" lang={lang}>{L(
              "La norme onusienne place trois caractéristiques sur le même plan, toutes « thèmes centraux » : pays de naissance, citoyenneté, année d'arrivée. Les deux premières sont presque universelles dans les recensements africains — 87 % et 91,5 %. La troisième tombe à 15 %. Ce n'est ni une question de moyens ni une question de capacité : les trois figurent dans le même questionnaire de référence, et deux sont posées. Ce qui décroche, c'est précisément la question qui permettrait de dater les trajectoires — donc de les analyser. Quant au motif du départ, posé par 6 États, il ne figure même pas parmi les caractéristiques prévues par la norme : l'interroger est un choix national, au-delà du standard (Ben Mokhtar, 2026).",
              "The UN standard places three characteristics on the same footing, all \"core topics\": country of birth, citizenship, year of arrival. The first two are near-universal in African censuses — 87% and 91.5%. The third falls to 15%. This is neither a resource nor a capacity issue: all three sit in the same reference questionnaire, and two are asked. What drops out is precisely the question that would let trajectories be dated — and therefore analysed. As for reason for departure, asked by 6 states, it is not even among the characteristics the standard provides for: asking it is a national choice, beyond the standard (Ben Mokhtar, 2026)."
            )}</Prose>
        </div>
        <Prose className="text-[10px] text-slate-400 italic mt-4 pt-3 border-t border-slate-100" lang={lang}>{L(
            "Source : Division de statistique des Nations unies (UNSD) — compilation de l'auteur (Ben Mokhtar, 2024). Pourcentages rapportés aux 47 États ayant recensé.",
            "Source: United Nations Statistics Division (UNSD) — author's own compilation (Ben Mokhtar, 2024). Percentages relative to the 47 states that censused."
          )}</Prose>
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
          <Prose className="text-justify" lang={lang}>{L(
              "La Conférence des chefs d'État et de gouvernement de l'Union africaine adopte à Kampala, en juillet 2010, la Stratégie pour l'harmonisation des statistiques en Afrique. Elle porte sur ce qui précède le chiffre : les concepts et les définitions, l'adaptation des bonnes pratiques internationales, et l'usage de méthodologies communes de production et de diffusion. Elle est aujourd'hui dans sa deuxième phase, SHaSA 2, qui court de 2017 à 2026.",
              "The African Union Assembly of Heads of State and Government adopted the Strategy for the Harmonization of Statistics in Africa in Kampala, in July 2010. It addresses what comes before the figure: concepts and definitions, the adaptation of international good practice, and the use of common methodologies for producing and disseminating statistics. It is now in its second phase, SHaSA 2, running from 2017 to 2026."
            )}</Prose>

          <div>
            <h4 className="block text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              {L("Les quatre thèmes stratégiques", "The four strategic themes")}
            </h4>
            <ol className="space-y-2">
              {(tr({ fr: [
                "Produire des statistiques de qualité pour l'Afrique.",
                "Coordonner la production de statistiques de qualité pour l'Afrique.",
                "Bâtir une capacité institutionnelle durable au sein du système statistique africain.",
                "Promouvoir une culture de la décision fondée sur la qualité.",
              ], en: [
                "To produce quality statistics for Africa.",
                "To coordinate the production of quality statistics for Africa.",
                "To build sustainable institutional capacity in the African statistical system.",
                "To promote a culture of quality decision-making.",
              ] }, lang)).map((t, i) => (
                <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
                  <span className="shrink-0 font-serif font-bold tabular-nums" style={{ color: 'var(--accent-deep)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-slate-700">{t}</span>
                </li>
              ))}
            </ol>
          </div>

          <Prose className="text-justify" lang={lang}>{L(
              "L'ordre de ces thèmes n'est pas anodin. La production vient d'abord, la coordination ensuite, la capacité institutionnelle en troisième — c'est-à-dire que le problème identifié par les États africains eux-mêmes porte sur la comparabilité de ce qui est déjà collecté. Harmoniser des concepts et des définitions à l'échelle de 54 appareils statistiques nationaux, c'est exactement l'enjeu que soulève le Glossaire de cette plateforme, porté au niveau continental (Ben Mokhtar, 2026).",
              "The order of these themes is not incidental. Production comes first, coordination second, institutional capacity third — meaning that the problem African states themselves identify is the comparability of what is already collected. Harmonising concepts and definitions across 54 national statistical systems is exactly the issue this platform's Glossary raises, carried to continental scale (Ben Mokhtar, 2026)."
            )}</Prose>
        </AfricanCounterpoint>
      </Reveal>

      <Reveal delay={40} className="bg-slate-900 rounded-xl p-8 md:p-10 border border-slate-800 shadow-sm text-white">
        <h2 className="text-xl md:text-2xl font-serif font-bold mb-3">
          {L("Produire n'est pas analyser", "Producing is not analysing")}
        </h2>
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-w-4xl text-justify">
          <Prose lang={lang}>{L(
            "Le goulot d'étranglement se situe après la collecte. Une part importante du traitement des données de recensement africaines a longtemps été assurée depuis l'extérieur — le Bureau du recensement des États-Unis (USCB) a accompagné pendant des décennies le traitement de ces données. Cette dépendance déplace le problème : la donnée brute existe ; ce qui fait défaut, c'est la maîtrise de sa mise en forme, de son interprétation et des catégories qu'elle mobilise.",
            "The bottleneck sits after collection. A significant share of the processing of African census data has long been carried out externally — the United States Census Bureau (USCB) supported that processing for decades. This dependence shifts the problem: the raw data exists; what is missing is control over its shaping, its interpretation, and the categories it mobilises."
          )}</Prose>
          <Prose lang={lang}>{L(
            "Or la catégorie n'est jamais neutre. Dénombrer les résidents habituels (population de jure) ou toutes les personnes présentes (de facto) ? Retenir la citoyenneté ou le pays de naissance ? Poser ou non la question du motif ? Chacun de ces choix produit une image différente de la même population. Tant que ces arbitrages sont opérés ailleurs, la souveraineté statistique reste formelle.",
            "Yet the category is never neutral. Enumerate usual residents (de jure population) or all persons present (de facto)? Retain citizenship or country of birth? Ask the reason for the move, or leave it out? Each of these choices produces a different image of the same population. As long as these trade-offs are made elsewhere, statistical sovereignty remains formal."
          )}</Prose>
          <Prose className="text-white font-medium" lang={lang}>{L(
            "C'est le sens de l'investissement continental dans ses propres instruments : l'Observatoire africain des migrations, STATAFRIC, la Stratégie d'harmonisation des statistiques en Afrique. Tous ont le même objet — reprendre la main sur le cadrage et l'analyse de ce qui est déjà collecté.",
            "This is the point of the continental investment in its own instruments: the African Migration Observatory, STATAFRIC, the Strategy for the Harmonization of Statistics in Africa. All have the same object — to regain control over the framing and the analysis of what is already collected."
          )}</Prose>
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
        .sort((a, b) => (tr({ fr: a.term, en: a.en_term }, lang)).localeCompare(tr({ fr: b.term, en: b.en_term }, lang)))
    }))
    .filter(cat => cat.terms.length > 0);

  const totalTerms = glossaryData.reduce((sum, c) => sum + c.terms.length, 0);
  const noResults = filteredCategories.length === 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.glossary.badge}
        plate={"Pl. X"}
        plain={text.headers.glossary.plain}
        lang={lang}
        title={text.headers.glossary.title}
        highlight={text.headers.glossary.highlight}
        desc={text.headers.glossary.desc}
        icon={Brain}
      />

      <BarreSection lang={lang} />
      {children}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-serif font-bold text-slate-900 flex items-center">
            <Brain className="w-5 h-5 me-2.5 text-teal-700" />
            {tr({ fr: 'Glossaire & Concepts Clés', en: 'Glossary & Key Concepts' }, lang)}
          </h2>
          <CsvButton onClick={exportGlossaryCSV} label={tr({ fr: "Glossaire (CSV)", en: "Glossary (CSV)" }, lang)} />
        </div>
        <Prose className="text-sm text-slate-500 leading-relaxed mb-5" lang={lang}>{tr({ fr: `${totalTerms} termes techniques et notions théoriques mobilisés à travers cette plateforme, expliqués et référencés.`, en: `${totalTerms} technical terms and theoretical concepts used throughout this platform, explained and referenced.` }, lang)}</Prose>
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={tr({ fr: "Rechercher un terme…", en: "Search a term…" }, lang)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg ps-10 pe-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-shadow"
          />
        </div>
      </div>

      {noResults ? (
        <div className="p-16 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <Prose className="text-slate-500 text-sm" lang={lang}>{tr({ fr: "Aucun terme ne correspond à votre recherche.", en: "No term matches your search." }, lang)}</Prose>
        </div>
      ) : (
        filteredCategories.map((cat, cIdx) => (
          <div key={cIdx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">
              <cat.icon className="w-5 h-5 me-2.5 text-teal-700" />
              {tr(cat.category, lang)}
              <span className="ms-2.5 text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">{cat.terms.length}</span>
            </h3>
            <div className="space-y-4">
              {cat.terms.map((t, tIdx) => (
                <div key={tIdx} className="p-4 border border-slate-200 bg-slate-50">
                  <h4 className="font-serif font-bold text-slate-900 text-[15px] mb-2">{tr({ fr: t.term, en: t.en_term }, lang)}</h4>
                  <Prose className="text-xs text-slate-600 leading-relaxed text-justify" lang={lang}>{tr({ fr: t.fr, en: t.en }, lang)}</Prose>

                  {/* Ce que le choix du mot produit : la definition n'est pas descriptive,
                      elle ouvre ou ferme des droits. */}
                  {t.stakes && (
                    <div className="mt-3 ps-3 py-1" style={{ borderLeft: '2px solid var(--accent)' }}>
                      <h4 className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-deep)' }}>
                        {tr({ fr: "Ce que la définition change", en: "What the definition changes" }, lang)}
                      </h4>
                      <Prose className="text-xs text-slate-600 leading-relaxed" lang={lang}>{tr(t.stakes, lang)}</Prose>
                    </div>
                  )}

                  {t.source && (
                    <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--rule)' }}>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 me-1.5">
                        {tr({ fr: "Source", en: "Source" }, lang)}
                      </span>
                      {t.source.url ? (
                        <a href={t.source.url} target="_blank" rel="noopener noreferrer"
                           className="text-[11px] hover:underline inline-flex items-center gap-1" style={{ color: 'var(--accent-2)' }}>
                          {tr(t.source, lang)} <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-500">{tr(t.source, lang)}</span>
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
  <div className="space-y-8 animate-in fade-in duration-500">
    <PageHeader
      badge={text.headers.methodology.badge}
      plate={"Pl. XI"}
      plain={text.headers.methodology.plain}
      lang={lang}
      title={text.headers.methodology.title}
      highlight={text.headers.methodology.highlight}
      desc={text.headers.methodology.desc}
      icon={Database}
    />

    <BarreSection lang={lang} />
    {children}

    <div className="grid grid-cols-2 md:grid-cols-4 bg-white border border-slate-200 divide-x divide-y md:divide-y-0 divide-slate-200">
      {[
        { v: indicatorThemes.length, l: tr({ fr: "Axes thématiques", en: "Thematic axes" }, lang)},
        { v: indicatorThemes.reduce((sum, th) => sum + th.items.length, 0), l: tr({ fr: "Indicateurs originaux", en: "Original indicators" }, lang)},
        { v: Object.keys(text.method).filter(k => /^s\d+$/.test(k)).length, l: tr({ fr: "Sources primaires", en: "Primary sources" }, lang)},
        { v: Object.values(countryData).flat().length, l: tr({ fr: "Pays couverts (UA)", en: "Countries covered (AU)" }, lang)},
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
        {tr({ fr: "De la source à la page", en: "From source to page" }, lang)}
      </h2>
      <Prose className="text-sm text-slate-500 leading-relaxed max-w-3xl mb-8" lang={lang}>{tr({ fr: "La plateforme ne produit pas de données primaires : elle consolide des séries publiques et en documente le traitement. Voici les cinq étapes appliquées à chaque indicateur.", en: "The platform does not produce primary data: it consolidates public series and documents how they are handled. These are the five steps applied to every indicator." }, lang)}</Prose>
      <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {methodPipeline.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={i} className="relative bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-teal-300 hover:bg-white transition-colors group">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-slate-200 text-teal-700 mb-3 group-hover:border-teal-300 transition-colors">
                <Icon className="w-4 h-4" />
              </span>
              <h3 className="text-xs font-bold text-slate-900 mb-1.5 leading-snug">{tr(step.title, lang)}</h3>
              <Prose className="text-[11px] text-slate-600 leading-relaxed" lang={lang}>{tr(step.body, lang)}</Prose>
            </li>
          );
        })}
      </ol>
    </Reveal>

    {/* Conventions déclarées */}
    <Reveal delay={40} className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
      <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-2">
        {tr({ fr: "Conventions déclarées", en: "Declared conventions" }, lang)}
      </h2>
      <Prose className="text-sm text-slate-500 leading-relaxed max-w-3xl mb-8" lang={lang}>{tr({ fr: `Les ${methodConventions.length} choix structurants ci-dessous conditionnent la lecture de l'ensemble des chiffres présentés sur la plateforme. Ils sont explicités pour être discutables — et reproductibles.`, en: `The ${methodConventions.length} structuring choices below condition how every figure on the platform should be read. They are spelled out so they can be contested — and reproduced.` }, lang)}</Prose>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {methodConventions.map((c, i) => (
          <div key={i} className="border-s-2 border-teal-200 ps-4">
            <dt className="flex flex-wrap items-baseline gap-2 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{tr(c.label, lang)}</span>
              <span className="text-sm font-serif font-bold text-teal-800">{tr(c.value, lang)}</span>
            </dt>
            <dd className="text-xs text-slate-600 leading-relaxed text-justify">{tr(c.detail, lang)}</dd>
          </div>
        ))}
      </dl>
    </Reveal>

    {/* Limites */}
    <Reveal delay={40} className="bg-slate-900 rounded-xl p-8 md:p-10 border border-slate-800 shadow-sm text-white">
      <div className="flex items-center gap-3 mb-2">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <h2 className="text-xl md:text-2xl font-serif font-bold">
          {tr({ fr: "Ce que ces données ne disent pas", en: "What this data does not say" }, lang)}
        </h2>
      </div>
      <Prose className="text-sm text-slate-300 leading-relaxed max-w-3xl mb-8" lang={lang}>{tr({ fr: "Énoncer les limites d'un jeu de données fait partie du jeu de données. Les cinq réserves suivantes s'appliquent à l'ensemble de la plateforme.", en: "Stating a dataset's limits is part of the dataset. The following five caveats apply across the whole platform." }, lang)}</Prose>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {methodLimits.map((l, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
            <Prose className="text-xs text-slate-300 leading-relaxed text-justify" lang={lang}>{tr(l, lang)}</Prose>
          </li>
        ))}
      </ul>
    </Reveal>


    <section className="bg-white rounded-xl p-8 md:p-10 border shadow-sm relative border-slate-200">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-serif font-bold text-slate-900 flex items-center"><Database className="w-5 h-5 me-2.5 text-blue-700" /> {text.sections.method_title}</h2></div>
      <Prose className="text-slate-700 text-sm leading-relaxed mb-2" lang={lang}>{text.method.summary}</Prose>
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
            <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s1}</span>
          </a>
          <a href="https://www.un.org/development/desa/pd/data/international-migrant-stock" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Database className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s2}</span>
          </a>
          <a href="https://www.unhcr.org/refugee-statistics/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s3}</span>
          </a>
          <a href="https://www.internal-displacement.org/database/displacement-data/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s4}</span>
          </a>
          <a href="https://www.iom.int/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s5}</span>
          </a>
          <a href="https://normlex.ilo.org/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Scale className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s6}</span>
          </a>
          <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Landmark className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s7}</span>
          </a>
          <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <TrendingUp className="w-4 h-4 text-slate-400 group-hover:text-blue-600 me-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s8}</span>
          </a>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center">
          <MapIcon className="w-3.5 h-3.5 me-1.5" />
          {tr({ fr: "Régionalisation : Union africaine (et non M49/ONU)", en: "Regionalization: African Union (not UN M49)" }, lang)}
        </h4>
        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
          <Prose className="text-xs text-slate-700 leading-relaxed" lang={lang}>{tr({ fr: "Les sous-régions affichées dans l'Explorateur et dans la matrice « Entrées & Séjours » suivent le découpage officiel de l'Union africaine, en cinq régions. UN DESA publie les siens selon la nomenclature M49 des Nations unies : les deux grilles divergent sur sept pays. La Mauritanie est en Afrique du Nord pour l'UA, en Afrique de l'Ouest pour l'ONU. Le Burundi et le Rwanda passent d'Afrique centrale à Afrique de l'Est. Le Malawi, le Mozambique, la Zambie et le Zimbabwe, d'Afrique australe à Afrique de l'Est. Les sous-totaux par région affichés ici ne coïncideront donc pas exactement avec les tableaux régionaux publiés directement par UNDESA pour ces pays. Ce choix aligne le site sur le cadrage institutionnel de l'Union africaine utilisé par ailleurs dans la section Gouvernance.", en: "The sub-regions shown in the Explorer and in the \"Entry & Residence\" matrix follow the African Union's official five-region breakdown — not the UN M49 classification UNDESA uses to publish its own migrant stock tables. The two groupings diverge on seven countries. Mauritania sits in North Africa under the AU, in West Africa under the UN. Burundi and Rwanda move from Central to East Africa. Malawi, Mozambique, Zambia and Zimbabwe, from Southern to East Africa. As a result, the regional subtotals shown here will not exactly match UNDESA's own published regional tables for these countries. This choice aligns the site with the African Union institutional framing used elsewhere in the Governance section." }, lang)}</Prose>
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
  // Rien d'ouvert au depart : les travaux de l'auteur se consultent, ils ne
  // s'exposent pas.
  const [voletAuteur, setVoletAuteur] = useState(null);

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
    <section className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        badge={text.headers.about.badge}
        plate={"Pl. XII"}
        plain={text.headers.about.plain}
        lang={lang}
        title={text.headers.about.title}
        highlight={text.headers.about.highlight}
        desc={text.headers.about.desc}
        icon={Info}
      />

      <BarreSection lang={lang} />
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
          <Prose className="lede" lang={lang}>{text.about.intro_p1}</Prose>
          <Prose lang={lang}>{text.about.intro_p2}</Prose>
          <Prose lang={lang}>{text.about.intro_p3}</Prose>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-5">
            <div className="p-2 bg-blue-50 rounded-sm"><BookOpen className="w-5 h-5 text-blue-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.research_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <Prose lang={lang}>{text.about.research_p1}</Prose>
            <Prose lang={lang}>{text.about.research_p2}</Prose>
            <Prose lang={lang}>{text.about.research_p3}</Prose>
            <Prose className="font-medium text-slate-800" lang={lang}>{text.about.research_p4}</Prose>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-5">
            <div className="p-2 bg-emerald-50 rounded-sm"><Database className="w-5 h-5 text-emerald-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.data_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <Prose lang={lang}>{text.about.data_p1}</Prose>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
              {text.about.data_list.map((item, idx) => {
                // Sans emblème disponible, on retombe sur l'icône générique : le repli
                // textuel de InstitutionLogo doublonnerait le nom affiché juste à côté.
                const logo = item.logo ? institutionLogos.find(i => i.key === item.logo) : null;
                const logoBox = logo && logo.src && (
                  <span className="w-8 h-8 rounded-sm bg-white border border-slate-200 flex items-center justify-center p-1 me-2.5 shrink-0">
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
                    {logoBox || <ExternalLink className="w-4 h-4 text-emerald-600 me-2.5 shrink-0 group-hover:text-emerald-700" />}
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-900">{item.name}</span>
                  </a>
                ) : (
                  <div key={idx} className="flex items-center p-3 rounded-md bg-slate-50 border border-slate-100">
                    {logoBox || <CheckCircle2 className="w-4 h-4 text-slate-400 me-2.5 shrink-0" />}
                    <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                  </div>
                );
              })}
            </div>
            <Prose className="text-xs italic text-slate-400" lang={lang}>{tr({ fr: "Ces institutions sont citées comme sources de données publiques ouvertes ; leur présence ne constitue ni un partenariat ni un endossement du projet.", en: "These institutions are cited as sources of open public data; their presence does not constitute a partnership or endorsement of the project." }, lang)}</Prose>

            <Prose lang={lang}>{text.about.data_p2}</Prose>
            <Prose className="italic" lang={lang}>{text.about.data_p3}</Prose>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-5">
            <div className="p-2 bg-amber-50 rounded-sm"><Globe className="w-5 h-5 text-amber-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.south_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <Prose lang={lang}>{text.about.south_p1}</Prose>
            <ul className="space-y-2 my-4 bg-slate-50 p-4 rounded-md border border-slate-100">
              {text.about.south_list.map((item, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 me-3"></span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <Prose lang={lang}>{text.about.south_p2}</Prose>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-5">
            <div className="p-2 bg-purple-50 rounded-sm"><TrendingUp className="w-5 h-5 text-purple-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.evolution_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed text-justify">
            <Prose lang={lang}>{text.about.evolution_p1}</Prose>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mt-5 mb-2">
              {tr({ fr: "Déjà disponible", en: "Already available" }, lang)}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {text.about.evolution_done.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 me-2 shrink-0 mt-1" />
                  <span className="text-xs">{item}</span>
                </li>
              ))}
            </ul>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-6 mb-2">
              {tr({ fr: "Prochaines étapes", en: "Next steps" }, lang)}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {text.about.evolution_next.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 me-2 shrink-0 mt-1" />
                  <span className="text-xs text-slate-500">{item}</span>
                </li>
              ))}
            </ul>
            <Prose className="font-bold text-slate-800" lang={lang}>{text.about.evolution_p2}</Prose>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10">
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">{text.about.founder_title}</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3 text-justify">
            <Prose lang={lang}>{text.about.founder_p1}</Prose>
            <Prose lang={lang}>{text.about.founder_p2}</Prose>
            <Prose lang={lang}>{text.about.founder_p3}</Prose>
            <Prose className="text-xs italic text-slate-500 border-s-2 border-slate-300 ps-3 mt-4" lang={lang}>{text.about.founder_p4}</Prose>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">{text.about.collab_title}</h2>
            <Prose className="text-sm text-slate-600 leading-relaxed mb-4" lang={lang}>{text.about.collab_p1}</Prose>
            <Prose className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3" lang={lang}>{text.about.contact_p}</Prose>
            
            <div className="flex flex-col gap-3">
              <a href="mailto:benmokhtary1@gmail.com?subject=South(s)%20Mobility%20DataHub%20-%20Contact" 
                 className="inline-flex items-center space-x-3 rtl:space-x-reverse bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 px-4 py-3 rounded-md transition-colors shadow-sm w-fit">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-bold">benmokhtary1@gmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/yassine-b-m" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center space-x-3 rtl:space-x-reverse bg-[#0a66c2] hover:bg-[#084e96] text-white px-4 py-3 rounded-md transition-colors shadow-sm w-fit">
                <LinkedInIcon className="w-4 h-4" />
                <span className="text-sm font-bold">Yassine Ben Mokhtar</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 ms-1" />
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
          <Sparkles className="w-4 h-4 me-2 text-amber-500" /> {tr({ fr: "Récemment enrichi", en: "Recently Enriched" }, lang)}
        </h3>
        <div className="border border-dashed border-slate-300 rounded-lg py-10 px-6 flex flex-col items-center justify-center text-center bg-slate-50/50">
          <Clock className="w-5 h-5 text-slate-300 mb-3" />
          <Prose className="text-sm font-serif font-bold text-slate-500" lang={lang}>{tr({ fr: "À venir", en: "Coming soon" }, lang)}</Prose>
          <Prose className="text-xs text-slate-400 mt-1.5 max-w-sm leading-relaxed" lang={lang}>{tr({ fr: "Cet espace signalera les enrichissements récents de la plateforme au fil de leur publication.", en: "This space will flag the platform's recent additions as they are published." }, lang)}</Prose>
        </div>
      </div>

      {/* Travaux de l'auteur : replies par defaut.

          Les deux registres s'affichaient en grand, cote a cote, en
          permanence. Sur la page qui explique d'ou vient la plateforme, un
          palmares deploye passe avant la methode qu'on est venu lire. Ils
          gardent leur place et tout leur contenu, mais ne s'ouvrent que si on
          le demande — un volet a la fois. */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ letterSpacing: '.16em', color: 'var(--label)' }}>
            {tr({ fr: "Travaux de l'auteur", en: "Author's work", ar: 'أعمال المؤلف' }, lang)}
          </span>
          <span className="h-px flex-1 min-w-6" style={{ backgroundColor: 'var(--rule)' }} aria-hidden="true" />
          {[
            { cle: 'publications', Icone: FileText, n: authorPublications.length,
              label: { fr: 'Publications', en: 'Publications', ar: 'المنشورات' } },
            { cle: 'medias', Icone: Mic, n: authorMedia.length,
              label: { fr: 'Interventions médiatiques', en: 'Media appearances', ar: 'المداخلات الإعلامية' } },
          ].map(({ cle, Icone, n, label }) => (
            <button
              key={cle}
              type="button"
              onClick={() => setVoletAuteur(voletAuteur === cle ? null : cle)}
              aria-expanded={voletAuteur === cle}
              className="couche-btn"
              data-actif={voletAuteur === cle ? 'true' : 'false'}
            >
              <Icone className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {tr(label, lang)}
              <span className="tabular-nums opacity-55">{n}</span>
              <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${voletAuteur === cle ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          ))}
        </div>

        {voletAuteur === 'publications' && (
          <div className="border-t border-slate-100 animate-in fade-in duration-300">
            <div className="px-7 pt-4">
              <a href="https://shs.cairn.info/publications-de-yassine-ben-mokhtar--773358?lang=fr" target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 hover:underline">
                {tr({ fr: "Profil Cairn.info", en: "Cairn.info profile" }, lang)} <ExternalLink className="w-2.5 h-2.5" />
              </a>
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
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{tr(pub.kind, lang)}</span>
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
        )}

        {voletAuteur === 'medias' && (
          <div className="border-t border-slate-100 px-7 py-5 animate-in fade-in duration-300">
            {[...new Set(authorMedia.map(m => m.year))].map((yr) => (
            <div key={yr} className="mb-5 last:mb-0">
            <div className="flex items-center gap-3 mb-2.5">
            <span className="font-serif font-bold text-slate-800 text-sm tabular-nums">{yr}</span>
            <span className="h-px flex-1 bg-slate-100"></span>
            </div>
            <ul className="relative ps-4 border-s border-slate-200 space-y-3">
            {authorMedia.filter(m => m.year === yr).map((m, idx) => {
            const st = mediaKindStyle[m.kind] || mediaKindStyle.press;
            return (
            <li key={idx} className="relative group">
            <span className={`absolute -start-[1.3rem] top-1.5 w-2 h-2 rounded-full ring-2 ring-white transition-transform group-hover:scale-150 ${st.dot}`}></span>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-bold uppercase tracking-widest border px-1.5 py-0.5 rounded-sm ${st.chip}`}>{m.outlet}</span>
            <span className="text-[10px] font-bold text-slate-400 tabular-nums">{tr(m.date, lang)}</span>
            </div>
            {m.url ? (
            /* Une video ne se signale pas comme un article : quand le lien
               mene a YouTube, le libelle le dit et l'icone change. */
            <a href={m.url} target="_blank" rel="noopener noreferrer"
            className="text-xs text-slate-700 leading-relaxed italic hover:text-rose-800 hover:underline inline-flex items-start gap-1.5">
            {tr(m.title, lang)}
            {/youtu\.?be/.test(m.url)
              ? <span className="not-italic inline-flex items-center gap-1 shrink-0 text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: 'var(--accent-deep)' }}>
                  <PlayCircle className="w-3 h-3" aria-hidden="true" />
                  {tr({ fr: 'Voir', en: 'Watch', ar: 'شاهد' }, lang)}
                </span>
              : <ExternalLink className="w-2.5 h-2.5 shrink-0 mt-1" />}
            </a>
            ) : (
            <Prose className="text-xs text-slate-700 leading-relaxed italic group-hover:text-slate-900 transition-colors" lang={lang}>{tr(m.title, lang)}</Prose>
            )}
            </li>
            );
            })}
            </ul>
            </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Quote className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-700">{text.about.citation_title}</h4>
          </div>
          
          <button 
            onClick={handleCopyCitation}
            className={`inline-flex items-center justify-center space-x-1.5 rtl:space-x-reverse px-4 py-2 rounded-sm text-xs font-bold transition-all border shadow-sm w-full sm:w-auto
            ${isCopied ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? (tr({ fr: 'Copié !', en: 'Copied!' }, lang)) : (tr({ fr: 'Copier', en: 'Copy' }, lang))}</span>
          </button>
        </div>
        <Prose className="text-sm text-slate-600 font-serif italic border-s-2 border-blue-500 ps-4 leading-relaxed" lang={lang}>{text.about.citation_text}</Prose>
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
  atlas:      { fr: 'atlas',        en: 'atlas' },
  home:       { fr: 'accueil',      en: 'home' },
  evidence:   { fr: 'verification', en: 'evidence' },
  explorer:   { fr: 'pays',         en: 'countries' },
  mobilites:  { fr: 'mobilites',    en: 'mobilities' },
  governance: { fr: 'gouvernance',  en: 'governance' },
  data:       { fr: 'donnees',      en: 'data' },
  resources:  { fr: 'ressources',   en: 'resources' },
  about:      { fr: 'a-propos',     en: 'about' },
};

// La methodologie a rejoint « Ressources » ; « A propos » a donc change de
// segment. Les adresses de l'ancienne organisation restent valides plutot que
// de rendre 404 : une URL citee dans un article ne se rattrape pas.
const ROUTES_ANCIENNES = {
  methodologie: 'resources',
  methodology: 'resources',
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
  let tab = 'atlas';
  if (seg) {
    const trouve = Object.entries(ROUTES).find(([, s]) => s.fr === seg || s.en === seg);
    if (trouve) tab = trouve[0];
    else if (ROUTES_ANCIENNES[seg]) tab = ROUTES_ANCIENNES[seg];
  }
  return { lang, tab, detail: bouts[2] ? decodeURIComponent(bouts[2]) : null };
};

const ecrireURL = ({ lang, tab, detail }, remplacer = false) => {
  const seg = tr(ROUTES[tab], lang) || tr(ROUTES.atlas, lang);
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
  // La Gouvernance ouvre sur l'Union africaine, pas sur l'Agenda 2030.
  const [activeSdgzTab, setActiveSdgzTab] = useState('au');
  const [activeResourceTab, setActiveResourceTab] = useState('library');
  // Le volet ouvert dans la section Mobilites : contraintes ou travail.
  const [voletMobilites, setVoletMobilites] = useState('contraintes');

  useEffect(() => { setIsLoaded(true); }, []);

  // La fiche pays laissait le site défiler derrière elle : en la refermant, on
  // se retrouvait là où le doigt avait emmené l'arrière-plan — souvent tout en
  // bas, très loin du pays qu'on venait de quitter.
  //
  // On fige le corps le temps de la lecture et on restitue la position exacte à
  // la fermeture. `position: fixed` plutôt que `overflow: hidden` : lui seul
  // arrête aussi le défilement tactile sur iOS, où le second n'a aucun effet.
  useEffect(() => {
    if (!showModal) return;
    const y = window.scrollY;
    const corps = document.body;
    const memo = { position: corps.style.position, top: corps.style.top, width: corps.style.width };
    corps.style.position = 'fixed';
    corps.style.top = `-${y}px`;
    corps.style.width = '100%';
    return () => {
      corps.style.position = memo.position;
      corps.style.top = memo.top;
      corps.style.width = memo.width;
      window.scrollTo({ top: y, behavior: 'instant' });
    };
  }, [showModal]);

  // Changer de section remplace tout le contenu d'un coup : le lecteur perd le
  // fil de ce qui vient d'arriver. L'API de transition de vue enchaine les deux
  // etats en un fondu court — le navigateur s'en charge, sans bibliotheque et
  // sans rendu supplementaire. La ou elle manque, la bascule reste immediate.
  const allerVers = useCallback((tab) => {
    const appliquer = () => setActiveTab(tab);
    if (typeof document === 'undefined' || !document.startViewTransition || prefersReducedMotion()) {
      appliquer();
      return;
    }
    // flushSync est indispensable : sans lui React repousse le rendu apres la
    // capture d'ecran de depart, et la transition compare l'ancien etat a
    // lui-meme — rien ne bouge.
    const vt = document.startViewTransition(() => flushSync(appliquer));
    // Un clic qui en interrompt un autre annule la transition en cours, et
    // celle-ci rejette ses promesses. Sans ce filet, chaque navigation rapide
    // laisse une erreur non interceptee dans la console : la bascule a bien
    // lieu, mais le journal se remplit de « Transition was aborted ».
    const tairel = () => {};
    vt.ready?.catch(tairel);
    vt.finished?.catch(tairel);
    vt.updateCallbackDone?.catch(tairel);
  }, []);

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
    return c ? slugPays(tr(c.name, lang) || c.name?.fr || c.name) : null;
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

  // Un repli a chaque niveau : une langue partiellement traduite affiche du
  // francais la ou il manque, au lieu de faire tomber la page.
  const text = useMemo(() => catalogue(t, lang), [lang]);

  const currentCountries = useMemo(() => {
    if (activeSubRegion === 'all') return Object.values(countryData).flat();
    return countryData[activeSubRegion] || [];
  }, [activeSubRegion]);

  const filteredCountries = useMemo(() => {
    return currentCountries.filter(c => {
      const cName = tr(c.name, lang) || c.name?.fr || 'Unknown';
      return cName.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => (tr(a.name, lang) || a.name.fr).localeCompare(tr(b.name, lang) || b.name.fr));
  }, [currentCountries, searchTerm, lang]);

  const regionAggregate = useMemo(() => computeRegionAggregate(currentCountries), [currentCountries]);

  const display = useMemo(() => {
    const country = currentCountries.find(c => c.id === activeSubTab);
    
    if (country && activeSubTab !== 'perspective') {
      return {
        name: tr(country.name, lang) || country.name?.fr || 'Unknown', flag: country.flag, iso2: country.iso2, flagIcon: null, flagColor: null, stock: country.stock, female: country.female, evolution: country.evolution,
        retention: country.retention ?? 50,
        remittances: country.remittances ?? null, remittances_year: country.remittances_year ?? null,
        labour_participation: country.labour_participation ?? null, labour_participation_year: country.labour_participation_year ?? null,
        aid: country.aid ?? 0, history: country.history || [],
        evo_desc: tr(country.evo_desc, lang) || country.evo_desc?.fr || "", origDest: tr(country.origDest, lang) || country.origDest?.fr || "", trigger: tr(country.trigger, lang) || country.trigger?.fr || "", response: tr(country.response, lang) || country.response?.fr || "", impact: tr(country.impact, lang) || country.impact?.fr || "",
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
      name: typeof fallback.name === 'object' ? (tr(fallback.name, lang) || fallback.name?.fr || 'Unknown') : String(fallback.name || 'Unknown'),
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
      evo_desc: typeof fallback.evo_desc === 'object' ? (tr(fallback.evo_desc, lang) || fallback.evo_desc?.fr || "") : (fallback.evo_desc || ""),
      origDest: typeof fallback.origDest === 'object' ? (tr(fallback.origDest, lang) || fallback.origDest?.fr || "") : (fallback.origDest || ""),
      trigger: typeof fallback.trigger === 'object' ? (tr(fallback.trigger, lang) || fallback.trigger?.fr || "") : (fallback.trigger || ""),
      response: typeof fallback.response === 'object' ? (tr(fallback.response, lang) || fallback.response?.fr || "") : (fallback.response || ""),
      impact: typeof fallback.impact === 'object' ? (tr(fallback.impact, lang) || fallback.impact?.fr || "") : (fallback.impact || ""),
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
      atlas: { fr: 'Atlas', en: 'Atlas' },
      home: { fr: 'Accueil', en: 'Home' },
      evidence: { fr: 'Évaluation des affirmations', en: 'Evidence Check' },
      explorer: { fr: 'Explorateur', en: 'Data Explorer' },
      mobilites: { fr: 'Mobilités', en: 'Mobilities' },
      mobilites: { fr: 'Mobilités', en: 'Mobilities' },
      governance: { fr: 'Gouvernance', en: 'Governance' },
      data: { fr: 'Données & statistiques', en: 'Data & Statistics' },
      resources: { fr: 'Ressources', en: 'Resources' },
      about: { fr: 'À propos', en: 'About' },
    };
    const nomSection = tr(NOMS[activeTab], lang);
    const partie = activeTab === 'explorer' && activeSubTab !== 'perspective'
      ? display.name
      : nomSection;
    document.title = partie ? `${partie} | South(s) Mobility DataHub` : 'South(s) Mobility DataHub';
    appliquerLangue(lang);

    const desc = activeTab === 'explorer' && activeSubTab !== 'perspective'
      ? (tr({ fr: `${display.name} : migrants présents, départs, ouverture des visas et traités ratifiés. Données vérifiées et sourcées.`, en: `${display.name}: resident migrants, departures, visa openness and ratified treaties. Verified, sourced data.` }, lang))
      : (text.headers[activeTab]?.plain
         || (tr({ fr: "Données vérifiées et en accès libre sur les mobilités africaines.", en: 'Verified, openly accessible data on African mobility.' }, lang)));
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

  // L'ordre suit quatre familles, dans l'ordre ou on les lit : on entre par la
  // carte, on s'oriente, on eprouve une idee recue, on lit les deux analyses,
  // on ouvre les deux outils de donnees, on verifie l'appareil.
  //   entrer     — Atlas, Accueil
  //   eprouver   — Evidence Check
  //   analyser   — Mobilites, Gouvernance
  //   consulter  — Explorateur, Donnees & Stats
  //   verifier   — Ressources & methode, A propos
  // L'Explorateur separait auparavant l'epreuve des analyses, et « Donnees »
  // etait coupe de l'Explorateur par la Gouvernance : les deux outils qui
  // servent le meme geste se suivent maintenant.
  const navigation = [
    { id: 'atlas', icon: MapIcon, label: { fr: 'Atlas', en: 'Atlas', ar: 'الأطلس' } },
    { id: 'home', icon: Compass, label: { fr: 'Accueil', en: 'Home', ar: 'الرئيسية' } },
    { id: 'evidence', icon: Globe, label: { fr: 'Evidence Check', en: 'Evidence Check', ar: 'فحص الأدلة' } },
    { id: 'mobilites', icon: ShieldAlert, label: { fr: 'Mobilités', en: 'Mobilities', ar: 'التنقلات' } },
    { id: 'governance', icon: Landmark, label: { fr: 'Gouvernance', en: 'Governance', ar: 'الحوكمة' } },
    { id: 'explorer', icon: MapPin, label: { fr: 'Explorateur', en: 'Data Explorer', ar: 'مستكشف البلدان' } },
    { id: 'data', icon: BarChart3, label: { fr: 'Données & Stats', en: 'Data & Stats', ar: 'البيانات والإحصاءات' } },
    { id: 'resources', icon: BookOpen, label: { fr: 'Ressources & méthode', en: 'Resources & method', ar: 'المراجع والمنهجية' } },
    { id: 'about', icon: Info, label: { fr: 'À propos', en: 'About', ar: 'عن المنصة' } },
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
        {tr({ fr: 'Aller au contenu', en: 'Skip to content' }, lang)}
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

      <nav className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-md print:hidden nav-chrome">
        <div className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-14 items-center">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
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
                  allerVers(r.aller.tab);
                  if (r.aller.tab === 'explorer' && r.aller.id) setActiveSubTab(r.aller.id);
                }}
              />
              <PrefsLecture lang={lang} />
              {/* Le sélecteur parcourt ACTIVES : le jour où l'arabe ou le
                  kiswahili y entre, il apparaît ici sans qu'on touche à ce
                  bouton. Avec deux langues, c'est la bascule d'avant. */}
              <button onClick={() => setLang(ACTIVES[(ACTIVES.indexOf(lang) + 1) % ACTIVES.length] || LANGUE_DEFAUT)}
                      aria-label={`${tr({ fr: 'Langue', en: 'Language' }, lang)} : ${tr(LANGUES, lang)?.endonyme || lang} — ${tr({ fr: 'changer', en: 'change' }, lang)}`}
                      title={ACTIVES.map(c => LANGUES[c]?.endonyme || c).join(' · ')}
                      className="flex items-center space-x-1 rtl:space-x-reverse text-[10px] font-bold bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700 transition hover:bg-blue-900 hover:text-white hover:border-blue-700">
                <Languages className="h-3 w-3" aria-hidden="true" /> <span>{lang.toUpperCase()}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto custom-scrollbar">
          <div className="flex space-x-1 rtl:space-x-reverse py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => allerVers(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className="nav-tab flex items-center px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-t-2"
                  style={navTabStyle(isActive)}
                >
                  <Icon className="w-4 h-4 me-2" style={{ color: isActive ? '#8FA0CE' : '#7A7167' }} />
                  {tr(item.label, lang)}
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
        {activeTab === 'atlas' && (
          <TabAtlas
            lang={lang} text={text} allerVers={allerVers}
            ouvrirPays={(id) => { setActiveSubTab(id); allerVers('explorer'); }}
            setVoletMobilites={setVoletMobilites}
            setSousOngletGouvernance={setActiveSdgzTab}
          />
        )}
        {activeTab === 'home' && (
          <TabHome text={text} lang={lang} setActiveTab={allerVers} />
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
        {activeTab === 'mobilites' && (
          <TabMobilites text={text} lang={lang} volet={voletMobilites} setVolet={setVoletMobilites} />
        )}
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
                    <BookOpen className="w-3.5 h-3.5" /> {tr({ fr: 'Bibliothèque', en: 'Library', ar: 'المكتبة' }, lang)}
                  </button>
                  <button
                    onClick={() => setActiveResourceTab('glossary')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeResourceTab === 'glossary' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Brain className="w-3.5 h-3.5" /> {tr({ fr: 'Glossaire', en: 'Glossary', ar: 'المعجم' }, lang)}
                  </button>
                  {/* La methodologie rejoint les ressources : d'ou viennent les
                      chiffres, ce que veulent dire les mots et ou lire la suite
                      relevent d'un meme geste — verifier. « A propos » reste a
                      part : ce n'est pas une ressource, c'est une signature. */}
                  <button
                    onClick={() => setActiveResourceTab('methodology')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeResourceTab === 'methodology' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Database className="w-3.5 h-3.5" /> {tr({ fr: 'Méthodologie', en: 'Methodology', ar: 'المنهجية' }, lang)}
                  </button>
                </div>
              );
              if (activeResourceTab === 'methodology')
                return <TabMethodology text={text} lang={lang}>{resourceSwitch}</TabMethodology>;
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
        {activeTab === 'about' && <TabAbout text={text} lang={lang} />}
        <PrintCitationFooter lang={lang} tab={activeTab} detail={paysSlug} sectionLabel={tr(navigation.find(i => i.id === activeTab)?.label, lang)} />
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
              <div className="flex items-center space-x-5 rtl:space-x-reverse">
                {display.flagIcon ? (
                  <span className={`border border-slate-200 rounded-sm bg-slate-50 p-2.5 shadow-sm print:border-none ${display.flagColor || 'text-blue-700'}`}>
                    <display.flagIcon className="w-8 h-8 md:w-9 md:h-9" />
                  </span>
                ) : (
                  <CountryFlag iso2={display.iso2} emoji={display.flag} size="lg" className="border border-slate-200 rounded-sm bg-slate-50 p-1 shadow-sm print:border-none" />
                )}
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 uppercase tracking-tight">{display.name}</h2>
                  <Prose className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 border border-slate-200 inline-block px-2 py-0.5 rounded-sm" lang={lang}>{display.isRegion ? (text.modal.south_view || "") : text.modal.raw_data_title}</Prose>
                </div>
              </div>
                
              <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 print:hidden">
                <button onClick={() => setModalView('demography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'demography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.demo}</button>
                <button onClick={() => setModalView('geography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'geography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.geo}</button>
                <button onClick={() => setModalView('economy')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'economy' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.econ}</button>
              </div>
              <button onClick={() => setShowModal(false)} aria-label={tr({ fr: 'Fermer le rapport', en: 'Close the report' }, lang)} className="absolute top-6 end-6 p-2 bg-white hover:bg-slate-50 rounded-sm border border-slate-200 transition-colors print:hidden shadow-sm"><X className="w-4 h-4 text-slate-600" aria-hidden="true" /></button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto space-y-10 print:overflow-visible print:p-0 print:pt-6 bg-slate-50 print:bg-white h-full print:flex print:flex-col print:gap-6 print:space-y-0">
              <div className={`grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 ${modalView === 'demography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:border print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Users className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {tr({ fr: "Le Réel Poids Démographique", en: "The Real Demographic Weight" }, lang)}</h3>
                  <Prose className="text-sm text-slate-600 mb-6 print:mb-3" lang={lang}>{tr({ fr: "La population migrante comparée à la population totale.", en: "Migrant population compared to total population." }, lang)}</Prose>
                  <div className="relative pt-6 pb-3 print:pt-4">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-2xl font-serif font-bold text-blue-800 print:text-lg">{display.evolution}%</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tr({ fr: "Population totale", en: "Total population" }, lang)}</span>
                    </div>
                    <div className="h-10 w-full bg-slate-100 rounded-sm relative overflow-hidden flex items-center border border-slate-200 print:h-8 print:!bg-slate-100">
                      <div className="h-full bg-blue-700 transition-all duration-1000 print:!bg-blue-700" style={{width: `${Math.max(5, parseFloat(display.evolution))}%`}}></div>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100 print:mt-3 print:pt-3">
                    <h4 className="font-bold text-slate-800 text-[10px] mb-2 uppercase tracking-widest print:text-[9px]">
                      {display.isRegion ? text.modal.evo_title : (tr({ fr: "Évolution du stock migratoire absolu (1990-2024)", en: "Absolute migrant stock evolution (1990-2024)" }, lang))}
                    </h4>
                    <HistoricalChart data={display.history} colorClass="bg-blue-700" />
                  </div>
                </div>
                  
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center print:border print:p-4">
                   <h3 className="font-serif font-bold text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><HeartPulse className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.parity}</h3>
                   <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-sm border border-slate-100 print:w-24 print:h-24" style={{ background: `conic-gradient(#1d4ed8 ${display.female}%, #f1f5f9 0)` }}>
                     <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center border border-slate-50">
                       <span className="text-3xl font-serif font-bold text-slate-900 print:text-xl">{display.female}%</span>
                       <span className="text-[9px] font-bold text-blue-700 uppercase mt-0.5 tracking-widest">{tr({ fr: "Femmes", en: "Women" }, lang)}</span>
                     </div>
                   </div>
                   <Prose className="text-center text-sm text-slate-600 mt-6 max-w-xs leading-relaxed print:mt-3 print:text-[10px]" lang={lang}>{tr({ fr: "La migration n'est pas qu'une affaire d'hommes fuyant la misère. Elle est structurellement féminisée.", en: "Migration is not just men fleeing poverty. It is structurally feminized." }, lang)}</Prose>
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
                        {display.labour_participation !== null && display.labour_participation !== undefined ? `${display.labour_participation}%` : (tr({ fr: 'N/D', en: 'N/A' }, lang))}
                      </span>
                      <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                        {tr({ fr: `Taux d'activité des migrants${display.labour_participation_year ? ` (OIT ${display.labour_participation_year})` : ' (OIT)'}`, en: `Migrant labour participation${display.labour_participation_year ? ` (ILO ${display.labour_participation_year})` : ' (ILO)'}` }, lang)}
                      </span>
                    </div>
                  </div>
                  <Prose className="text-xs text-slate-600 leading-relaxed border-t sm:border-t-0 sm:border-s border-slate-100 sm:ps-6 pt-4 sm:pt-0" lang={lang}>{display.labour_participation !== null && display.labour_participation !== undefined
                      ? (tr({ fr: "Part des migrants en âge de travailler qui sont actifs (en emploi ou en recherche d'emploi), estimation modélisée par l'OIT — un indicateur direct de l'insertion économique, distinct du volume migratoire lui-même.", en: "Share of working-age migrants who are economically active (employed or seeking work), ILO modelled estimate — a direct indicator of economic insertion, distinct from migration volume itself." }, lang))
                      : (tr({ fr: "L'OIT ne publie pas d'estimation modélisée pour cette entité (échantillon insuffisant).", en: "The ILO does not publish a modelled estimate for this entity (insufficient sample)." }, lang))}</Prose>
                </div>
              </div>

              <div className={`grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500 ${modalView === 'geography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                <div className="lg:col-span-2 bg-[#0f172a] rounded-lg p-7 text-white shadow-md flex flex-col justify-center items-center print:bg-white print:text-slate-900 print:border print:border-slate-200 print:p-4 print:shadow-none">
                  <h3 className="font-serif font-bold text-white print:text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><Globe className="w-5 h-5 me-2.5 text-blue-400 print:w-4 print:h-4" /> {text.modal.retention_title}</h3>
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner border border-slate-700 print:shadow-inner print:w-24 print:h-24 print:border-slate-200" style={{ background: `conic-gradient(#3b82f6 ${display.retention}%, ${display.isRegion ? '#1e293b' : '#1e293b'} 0)` }}>
                    <div className="absolute inset-4 bg-[#0f172a] print:bg-white rounded-full flex flex-col items-center justify-center border border-slate-800 print:border-slate-100">
                      <span className="text-3xl font-serif font-bold text-white print:text-slate-900 print:text-xl">{display.retention}%</span>
                      <span className="text-[9px] font-bold text-blue-400 uppercase mt-0.5 tracking-widest text-center px-2">{tr({ fr: "Restent dans la région", en: "Stay in the region" }, lang)}</span>
                    </div>
                  </div>
                </div>
                  
                <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-7 shadow-sm flex flex-col justify-between print:p-4 print:break-inside-avoid">
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 mb-4 flex items-center text-xl print:mb-2 print:text-lg"><GitMerge className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.orig_dest_title}</h3>
                    <p className="text-slate-700 text-base leading-relaxed print:text-xs">{display.origDest}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 print:mt-2 print:pt-2">
                      <Prose className="text-xs text-slate-500 italic print:text-[10px]" lang={lang}>{tr({ fr: "Cette dynamique prouve que les pays du Sud sont avant tout des pays d'accueil et de passage interne.", en: "This dynamic proves that Southern countries are primarily host and internal passage countries." }, lang)}</Prose>
                    </div>
                  </div>
                    
                  {!display.isRegion && (
                    <div className="mt-6 flex flex-col gap-4 print:mt-3 print:gap-2">
                      {(display.idp_conflict > 0 || display.idp_disaster > 0 || display.refugees_hosted > 0) && (
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-200 print:p-3">
                          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center print:text-xs print:mb-2"><ShieldAlert className="w-4 h-4 me-2 text-slate-400" /> {text.modal.idp_title}</h4>
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
                          <Prose className="text-xs text-slate-500 mt-3 italic print:mt-1.5 print:text-[8px]" lang={lang}>{text.modal.idp_desc}</Prose>
                        </div>
                      )}

                      {display.avoi !== null && (
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-200 print:p-3">
                          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center print:text-xs print:mb-2"><Unlock className="w-4 h-4 me-2 text-slate-400" /> {text.modal.avoi_title}</h4>
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                              <span className="text-slate-600 print:!text-slate-600">Score</span>
                              <span className="text-slate-900 print:!text-slate-900">{display.avoi}/100</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden relative print:h-1.5 print:!bg-slate-200">
                              <div className="h-full bg-slate-600 rounded-sm transition-all duration-1000 print:!bg-slate-600" style={{width: `${display.avoi}%`}}></div>
                              {continentalAvoiAvg !== null && (
                                <div className="absolute top-0 bottom-0 w-px bg-amber-500 print:!bg-amber-500" style={{ left: `${continentalAvoiAvg}%` }} title={`${tr({ fr: 'Moyenne continentale', en: 'Continental average' }, lang)}: ${continentalAvoiAvg}/100`}></div>
                              )}
                            </div>
                            {continentalAvoiAvg !== null && (
                              <Prose className="text-xs text-amber-700 mt-1.5 font-bold" lang={lang}>{tr({ fr: `Moyenne continentale : ${continentalAvoiAvg}/100`, en: `Continental average: ${continentalAvoiAvg}/100` }, lang)}</Prose>
                            )}
                            <Prose className="text-xs text-slate-500 mt-2 italic print:text-[8px] print:mt-1.5" lang={lang}>{text.modal.avoi_desc}</Prose>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={`space-y-8 animate-in fade-in duration-500 ${modalView === 'economy' ? 'block' : 'hidden print:block'} print:space-y-4 print:break-inside-avoid`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Landmark className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.econ_title}</h3>
                  <Prose className="text-sm text-slate-600 mb-6 print:mb-3" lang={lang}>{tr({ fr: "L'apport des diasporas face à l'Assistance Publique au Développement (APD).", en: "Diaspora contribution vs. Official Development Assistance (ODA)." }, lang)}</Prose>
                  <div className="max-w-2xl"><EconomicComparison remittances={display.remittances} remittancesYear={display.remittances_year} aid={display.aid} lang={lang} /></div>
                  <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:mt-3 print:p-2"><Prose className="text-slate-700 text-sm print:text-[10px]" lang={lang}>{tr({ fr: "Les diasporas injectent massivement du capital directement dans l'économie réelle (familles, santé, éducation), rendant les Suds économiquement résilients sans dépendre exclusivement de la charité internationale.", en: "Diasporas inject massive capital directly into the real economy, making the Souths economically resilient without depending solely on international charity." }, lang)}</Prose></div>
                </div>

                {display.au_treaties && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><FileText className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.au_instruments}</h3>
                    <Prose className="text-sm text-slate-600 mb-4 print:mb-3" lang={lang}>{tr({ fr: "État de ratification des conventions phares de l'OUA/UA en matière d'intégration et de mobilité.", en: "Ratification status of key OAU/AU conventions on integration and mobility." }, lang)}</Prose>
                    <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-blue-700 font-bold hover:underline mb-6 print:hidden">
                      {tr({ fr: "→ Consulter la base des traités de l'UA", en: "→ View AU Treaties Database" }, lang)}
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
                            <span className="text-xs font-bold">{tr({ fr: t.fr, en: t.en }, lang)}</span>
                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${ratified ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>
                              {ratified ? (tr({ fr: 'Ratifié', en: 'Ratified' }, lang)) : (tr({ fr: 'Non ratifié', en: 'Not ratified' }, lang))}
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
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Users className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {tr({ fr: "Affiliation aux Communautés Économiques Régionales", en: "Regional Economic Community Affiliation" }, lang)}</h3>
                    <Prose className="text-sm text-slate-600 mb-4 print:mb-3" lang={lang}>{tr({ fr: "Blocs régionaux dont le pays est membre (l'appartenance à plusieurs CER est courante en Afrique).", en: "Regional blocs the country belongs to (multiple REC membership is common in Africa)." }, lang)}</Prose>
                    <div className="flex flex-wrap gap-3">
                      {countryRecAffiliations[display.iso2].map((recId) => (
                        <div key={recId} className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-full ps-1.5 pe-4 py-1.5 print:bg-white">
                          <span className="w-8 h-8 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-700 font-serif font-bold text-[9px] shrink-0">
                            {recId === 'censad' ? 'CS' : recId.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-emerald-900">{tr(recNames[recId], lang)}</span>
                        </div>
                      ))}
                    </div>
                    {countryRecNotes[display.iso2] && (
                      <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-3 mt-4 flex items-start gap-2 print:bg-white">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {tr(countryRecNotes[display.iso2], lang)}
                      </p>
                    )}
                    {visaOpenToAllAfrica[display.iso2] && (() => {
                      const openness = visaOpenToAllAfrica[display.iso2];
                      const tier = visaOpenTiers[openness.tier];
                      return (
                        <div className={`mt-4 p-4 rounded-md border flex items-start gap-3 print:bg-white ${tier.style}`}>
                          <Star className={`w-4 h-4 shrink-0 mt-0.5 ${tier.dot}`} />
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest block mb-1">{tr(tier.label, lang)}</span>
                            <Prose className="text-xs leading-relaxed" lang={lang}>{tr(openness.note, lang)}</Prose>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {display.normlex && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Scale className="w-5 h-5 me-2.5 text-slate-400 print:w-4 print:h-4" /> {tr({ fr: "Évaluation Juridique des Droits (Base NORMLEX OIT)", en: "Legal Evaluation of Rights (ILO NORMLEX)" }, lang)}</h3>
                    <Prose className="text-sm text-slate-600 mb-4 print:mb-3" lang={lang}>{tr({ fr: "Ratification des conventions internationales du travail et protection des travailleurs.", en: "Ratification of international labor standards and worker protection." }, lang)}</Prose>
                    {display.normlex.link && (
                      <a href={display.normlex.link} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-blue-700 font-bold hover:underline mb-6 print:hidden">
                        {tr({ fr: "→ Consulter le profil national NORMLEX", en: "→ View NORMLEX National Profile" }, lang)}
                      </a>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{tr({ fr: "Fondamentales", en: "Fundamental" }, lang)}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.fundamental} / 11</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{tr({ fr: "Gouvernance", en: "Governance" }, lang)}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.governance} / 4</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{tr({ fr: "Techniques", en: "Technical" }, lang)}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.technical}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{tr({ fr: "Total Ratifications", en: "Total Ratified" }, lang)}</span>
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

                <PrintCitationFooter lang={lang} sectionLabel={display.isRegion ? (tr({ fr: 'Profil Régional', en: 'Regional Profile' }, lang)) : (tr({ fr: 'Profil Pays', en: 'Country Profile' }, lang))} />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">{text.modal.data_source}</span>
              <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto justify-end">
                <button onClick={exportCountryProfileCSV} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 rtl:space-x-reverse bg-white border border-slate-300 text-slate-700 hover:text-blue-700 px-4 py-2 rounded-sm text-[11px] font-bold transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> <span>{text.modal.export_csv}</span></button>
                <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 rtl:space-x-reverse bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-sm text-[11px] font-bold transition-colors shadow-sm"><Printer className="w-3.5 h-3.5" /> <span>{text.modal.export_pdf}</span></button>
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
              <Prose className="text-sm leading-relaxed max-w-sm" style={{ color: '#A79E92' }} lang={lang}>{text.footer.tag}</Prose>
            </div>

            {/* Navigation secondaire */}
            <div className="md:col-span-3">
              <span className="block text-[10px] font-semibold uppercase mb-4" style={{ letterSpacing: '.18em', color: 'var(--accent-light)' }}>
                {tr({ fr: 'Explorer', en: 'Explore' }, lang)}
              </span>
              <ul className="space-y-2">
                {navigation.filter(n => n.id !== 'home').map(item => (
                  <li key={item.id}>
                    <button
                      onClick={() => allerVers(item.id)}
                      className="text-sm transition-colors hover:text-[#8FA0CE]"
                      style={{ color: '#CFC6BA' }}
                    >
                      {tr(item.label, lang)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Provenance & contact */}
            <div className="md:col-span-4">
              <span className="block text-[10px] font-semibold uppercase mb-4" style={{ letterSpacing: '.18em', color: 'var(--accent-light)' }}>
                {tr({ fr: 'Sources & contact', en: 'Sources & contact' }, lang)}
              </span>
              <Prose className="text-xs leading-relaxed mb-4" style={{ color: '#A79E92' }} lang={lang}>{text.footer.sources}</Prose>
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
              © 2026 Yassine Ben Mokhtar — {tr({ fr: 'Initiative citoyenne & recherche indépendante', en: 'Independent research & civic initiative' }, lang)}
            </p>
            <Prose className="text-[11px] italic" style={{ color: '#8A8175' }} lang={lang}>{tr({ fr: 'Données publiques consolidées, sources citées.', en: 'Consolidated public data, sources cited.' }, lang)}</Prose>
          </div>
        </div>
      </footer>
    </div>
  );
}