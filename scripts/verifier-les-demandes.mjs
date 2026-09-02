// CHAQUE DEMANDE, VÉRIFIÉE SUR LE CODE — PAS DE MÉMOIRE
// ===========================================================================
// Ce fichier existe à cause d'une faute précise : j'ai annoncé qu'Accueil
// resterait la première section, j'ai écrit pourquoi, et je ne l'ai jamais
// fait. La barre affichait Atlas en tête pendant trois échanges. J'avais
// traité « j'ai tranché » comme « c'est fait ».
//
// Le remède n'est pas de faire plus attention : c'est de ne plus jamais
// rapporter une demande comme traitée sans qu'une vérification l'ait dit. Ce
// script porte donc chaque demande sous une forme que le code peut trancher,
// et il sort en erreur si l'une d'elles a cessé d'être vraie.
//
//   node scripts/verifier-les-demandes.mjs
import { readFileSync } from 'node:fs';

const app = readFileSync('src/App.jsx', 'utf8');
const css = readFileSync('src/theme.css', 'utf8');
const html = readFileSync('index.html', 'utf8');
const tout = app + css;

// Chaque demande : son libellé, et un test qui rend vrai quand elle est tenue.
const DEMANDES = [
  ['la phrase « rattaché à la source qui le publie » est retirée',
   () => !app.includes('rattaché à la source qui le publie')],

  ['le compteur d’assise est retiré de la boîte de l’Atlas',
   () => !app.includes('<ul className="assise"')],

  ['le foliotage en planches n’est plus affiché',
   () => !/\{plate\}\s*$/m.test(app) && !app.includes("Pl. I · {L('Centre de ressources")],

  ['« Qui est en tête, qui ferme la marche » est repris',
   () => !app.includes('Qui est en tête, qui ferme la marche')
      && app.includes('Le continent, du premier au dernier')],

  ['le classement dit sa portée (qui ouvre, qui ferme, de combien)',
   () => app.includes('ouvre le classement avec')],

  ['« Ce que la plateforme ne mesurait pas » est repris',
   () => !app.includes('Ce que la plateforme ne mesurait pas')
      && app.includes('Entre vouloir partir et partir')],

  ['« Hub » porte sa majuscule',
   () => !/\bce hub\b|\ble hub\b|\bthis hub\b/.test(app)],

  ['la légende de la carte est une note, pas du texte plein',
   () => app.includes('<p className="note-source" style={{ marginTop: 0')],

  ['cliquer un pays cale la région',
   () => app.includes('const region = countryRegionMap[id];')],

  ['les trois blocs d’entrée de l’accueil sont fondus en un',
   () => !app.includes('const statTiles = [')
      && !app.includes("chapo={{ fr: 'Comment lire ce hub'")],

  ['l’émeraude de l’Atlas est remplacée par le graphite étalon',
   () => !css.includes('--accent:       #046345;')
      && /data-section="atlas"\]\s*\{[^}]*#3F4654/s.test(css)],

  ['Corridors ouvre sur la scène animée',
   () => app.includes('LA SCÈNE PLUTÔT QUE LE BANDEAU')],

  ['« Ressources & méthode » est fondu dans « À propos »',
   () => !app.includes("id: 'resources', icon: BookOpen, label: { fr: 'Ressources & méthode'")
      && app.includes("setActiveResourceTab('about')")],

  ['ACCUEIL est la première section de la barre',
   () => {
     const i = app.indexOf('const navigation = [');
     const bloc = app.slice(i, i + 1200);
     return bloc.indexOf("id: 'home'") < bloc.indexOf("id: 'atlas'");
   }],

  ['une adresse nue ouvre sur l’accueil',
   () => app.includes("let tab = 'home';")],

  ['la bande des sections est centrée',
   () => css.includes('nav .max-w-7xl.overflow-x-auto > * { justify-content: center; }')],

  ['les bandes à icônes sont centrées et à 15 px',
   () => css.includes(':is(main, .reader) .barre-section { justify-content: center; }')
      && css.includes('font-size: calc(15px * var(--corps, 1));')],

  ['l’appel à l’action des cartes ne se coupe plus en deux lignes',
   () => /\.hub-card-cta\s*\{[^}]*display: inline-flex !important/s.test(css)],

  ['les cartes de grille prennent le pas des items, pas des sections',
   () => css.includes(':not([class*="grid-cols"] > *)')],

  ['la justification tombe sous 768 px',
   () => /max-width: 767px[^@]*text-align: start/s.test(css)],

  ['les cibles tactiles sans libellé font 44 px de large',
   () => css.includes('[aria-label]:not(:has(*:not(svg):not(:empty)))')],

  ['le titre de page n’est plus « datahub »',
   () => !html.includes('<title>datahub</title>')
      && html.includes('South(s) Mobility DataHub —')],

  ['le document porte description, canonical et aperçu de partage',
   () => html.includes('name="description"') && html.includes('rel="canonical"')
      && html.includes('og:image')],

  ['le document est lisible sans JavaScript',
   () => html.includes('<main id="secours">')],

  ['les polices ne sortent plus d’un @import du CSS',
   () => !css.includes('@import url(') && html.includes('rel="preconnect"')],

  ['la couche et la région entrent dans l’adresse',
   () => app.includes("q.set('couche', couche)") && app.includes("q.set('region', region)")],

  ['l’accueil pose trois questions à lien profond',
   () => app.includes('const ENTREES_ACCUEIL = [') && app.includes('allerAtlas(cle)')],

  ['l’accueil porte trois constats vérifiables',
   () => app.includes('const ConstatsClefs =')],

  ['le bandeau d’accueil porte deux chemins',
   () => app.includes('cta cta--plein') && app.includes('cta cta--creux')],

  ['la note de cadrage envisage son objection',
   () => app.includes('appelle son objection')],

  ['la note dit ce qui ferait changer sa lecture',
   () => app.includes('ferait changer cette lecture')],

  ['la note est signée',
   () => app.includes('Yassine Ben Mokhtar, doctorant en relations internationales')],

  ['aucun matériau de terrain non publié n’est cité',
   () => !/observation participante/i.test(app + readFileSync('src/narrativesData.js', 'utf8'))],

  // --- LA FICHE PAYS : ESPACE, ÉPURATION, CLARTÉ --------------------------
  ['le rang continental ne trace plus un trait par pays',
   () => !app.includes('valeurs.map((_, i) => (')
      && css.includes('.rang-rail')],

  ['les trois légendes du rang ne se touchent plus',
   () => !app.includes('<div className="rang-bornes surtitre">')
      && css.includes('.rang-bornes-med')],

  ['les six textes de l’UA se comptent avant de se lire',
   () => app.includes('className="ratif-compte"') && app.includes('const ranges = [...INSTRUMENTS].sort')],

  ['l’état d’un texte ne tient plus à la seule couleur du fond',
   () => !app.includes("bg-blue-50 border-blue-200 text-blue-900") && app.includes('data-ratifie=')],

  ['les communautés régionales portent leur nom complet',
   () => app.includes('const recFullNames = {') && !app.includes("recId === 'censad' ? 'CS'")],

  ['aucune barre n’est figée à 100 % de large',
   () => !/style=\{\{width: '100%'\}\}/.test(app)],

  ['aucune barre n’affiche un minimum de 5 % à la place de sa valeur',
   () => !app.includes('Math.max(5, parseFloat(display.evolution))')],

  ['une série de deux points s’écrit au lieu de se tracer',
   () => app.includes('if (data.length === 2)') && css.includes('.evolution-deux')],

  // La version intermediaire de cette assertion visait une carte imbriquee dans
  // une autre. La refonte a supprime les cartes : plus rien ne peut s y nicher,
  // et c est desormais l ABSENCE de pave qui se verifie.
  ['la fiche ne porte plus de pavés blancs empilés',
   () => {
     const i = app.indexOf('LA FICHE PAYS, REFAITE');
     const j = app.indexOf('Le pied prenait 130 px', i);
     const corps = app.slice(i, j > i ? j : i + 40000);
     return !/bg-white p-\d rounded-lg border/.test(corps) && !/shadow-sm/.test(corps);
   }],

  ['`surtitre` ne bat plus les classes de disposition',
   () => css.includes('.surtitre.flex        { display: flex; }')
      && css.includes('.surtitre.hidden      { display: none; }')],

  // Meme chose : le corps ne paie plus de gouttiere du tout, ce sont les
  // mouvements qui la portent — une seule fois au lieu de deux.
  ['la gouttière ne se paie plus deux fois dans la fiche',
   () => css.includes('.fiche-corps { padding: 0 !important;')
      && /\.fiche-mvt\s*\{[^}]*padding:/s.test(css)
      && css.includes(':not(.fiche-corps)')],

  ['la jauge de robustesse se compte',
   () => css.includes('.jauge-cran') && !app.includes('className="block w-[7px] h-[3px]"')],

  // --- LA FICHE PAYS : LA FORME, REPRISE EN ENTIER -----------------------
  ['la fiche ne cache plus rien derrière un onglet',
   () => !app.includes("setModalView('demography')") && !/modalView === '(demography|geography|economy|rights)'/.test(app)],

  ['la fiche se lit en cinq mouvements numérotés',
   () => app.includes('const MOUVEMENTS_FICHE = [')
      && ['m1', 'm2', 'm3', 'm4', 'm5'].every(k => app.includes(`id="fiche-${k}" data-mvt="${k}"`))
      && (app.match(/<MovementOpener\s+n="0[1-5]" sur="05"/g) || []).length === 5],

  ['le sommaire conduit au mouvement au lieu de le masquer',
   () => app.includes('const allerAuMouvement = useCallback') && app.includes('boite.scrollTop = haut;')],

  ['le sommaire suit la lecture, et non le dernier clic',
   () => app.includes("boite.addEventListener('scroll', relever")],

  ['la position du sommaire ne passe plus par offsetTop',
   () => !app.includes('cible.offsetTop - boite.offsetTop')],

  ['le corps de la fiche est un document, pas une pile de pavés',
   () => css.includes('.fiche-mvt {') && css.includes('.fiche-corps { padding: 0 !important;')
      && !/fiche-corps p-6 md:p-10/.test(app)],

  ['le dialogue échappe au rythme de 40 px entre ses trois parties',
   () => css.includes(':not(.fiche-boite) > * + *') && app.includes('className="fiche-boite')],

  ['le glissement ne décide pas de la justesse du sommaire',
   () => !/\.fiche-corps\s*\{[^}]*scroll-behavior:\s*smooth/s.test(css)],

  ['les colonnes étroites de la fiche ne sont pas justifiées',
   () => css.includes(':not(.fiche-etroit)') && app.includes('<Prose className="fiche-etroit"')],

  // --- ÉPURATION ET HARMONISATION DU SITE --------------------------------
  ['aucune teinte Tailwind brute n’échappe aux jetons',
   () => css.includes('.text-emerald-500 { color: var(--ok) !important; }')
      && css.includes('.fill-emerald-300, .fill-emerald-400, .fill-emerald-500')
      && css.includes('.fill-amber-300, .fill-amber-400, .fill-amber-500')],

  ['le site ne peint que deux rayons',
   () => !/border-radius:\s*2px;/.test(css)],

  ['la moyenne des CER se calcule au lieu de s’écrire',
   () => !app.includes("left: '50.1%'")
      && app.includes('const moyenne = recsList.reduce')],

  ['le repère de la moyenne porte sa légende',
   () => app.includes('Le trait vertical marque la moyenne des huit scores')],

  ['l’écart entre la moyenne publiée et celle des barres est dit',
   () => app.includes('Une réserve sur la moyenne des CER')
      && app.includes('A caveat on the REC average')],

  ['les mises en garde passent toutes par .aparte',
   () => !app.includes('bg-amber-50 border border-amber-200')],
];

console.log('CHAQUE DEMANDE, VÉRIFIÉE SUR LE CODE');
console.log('='.repeat(74));
let tenues = 0;
const perdues = [];
for (const [libelle, test] of DEMANDES) {
  let ok = false;
  try { ok = !!test(); } catch (e) { ok = false; }
  if (ok) tenues += 1; else perdues.push(libelle);
  console.log(`  ${ok ? '·' : '✗'}  ${libelle}`);
}
console.log(`\n${'='.repeat(74)}`);
console.log(`${tenues} sur ${DEMANDES.length} tenues.`);
if (perdues.length) {
  console.log(`\nNON TENUES :\n  ${perdues.join('\n  ')}`);
  process.exitCode = 1;
}
