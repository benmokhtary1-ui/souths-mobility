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

  ['le repère de la moyenne n’est plus écrit en dur',
   () => !app.includes("left: '50.1%'")
      && app.includes('left: `${AVOI_MOYENNE * 100}%`')],

  ['les deux graphiques AVOI partagent une seule référence',
   () => {
     // Le rail des feuillets colore selon AVOI_MOYENNE ; le classement doit
     // tracer le meme repere, sans quoi le COMESA (0,463) serait dit au-dessus
     // a un endroit et en dessous a l autre.
     const n = (app.match(/AVOI_MOYENNE/g) || []).length;
     return n >= 4 && !/left:\s*`\$\{moyenne \* 100\}%`/.test(app);
   }],

  ['le repère de la moyenne porte sa légende',
   () => app.includes('Le trait vertical marque la moyenne publiée des huit CER')],

  ['l’écart entre la moyenne publiée et celle des barres est dit',
   () => app.includes('Une réserve sur la moyenne des CER')
      && app.includes('A caveat on the REC average')],

  ['les mises en garde passent toutes par .aparte',
   () => !app.includes('bg-amber-50 border border-amber-200')],

  // --- LE FEUILLETAGE, SUR LA GÉOMÉTRIE RELEVÉE ---------------------------
  ['la carte centrale écrase ses voisines',
   // Releve sur la reference : 1 / 0,73 / 0,599 — non 1 / 0,90 / 0,85.
   () => app.includes('[1, 0.73, 0.599, 0.52]')],

  ['les voisines ne s’effacent plus, elles se chevauchent',
   () => !app.includes('[1, 0.55, 0.32]')
      && app.includes('const glisse = useTransform([signe, brut],')
      && app.includes('const plan = useTransform(ecart,')],

  ['le plan reste plat — aucune rotation',
   () => !/rotateY: tourner/.test(app)],

  ['le pas commandé suit une courbe, pas un ressort',
   () => app.includes('const COURBE = { duration: 0.7, ease: [0.4, 0, 0.2, 1] };')
      && !app.includes('const RESSORT =')],

  ['les commandes du carrousel sont sous la pile',
   () => app.includes('carrousel-commandes carrousel-commandes--pied')
      && css.includes('.carrousel-commandes--pied')],

  // --- LE BANDEAU DES SOURCES ---------------------------------------------
  ['les sources défilent au lieu de se replier en grille',
   () => app.includes('const BandeauSources = ({ lang }) =>')
      && app.includes('<BandeauSources lang={lang} />')
      && css.includes('@keyframes bandeau-defile')],

  ['le bandeau s’arrête au survol et au clavier',
   () => css.includes('.bandeau-sources:focus-within .bandeau-sources-rail { animation-play-state: paused; }')],

  ['le bandeau ne défile pas quand le mouvement est réduit',
   () => /@media \(prefers-reduced-motion: reduce\) \{ \.bandeau-sources-rail \{ animation: none; \} \}/.test(css)
      && app.includes('if (reduit) {')],

  ['la seconde piste du bandeau est masquée aux lecteurs d’écran',
   // Sans quoi ils annonceraient quarante-six sources pour vingt-trois.
   () => app.includes("aria-hidden={aria ? undefined : 'true'}")],

  // --- L’EN-TÊTE DE LA FICHE PAYS -----------------------------------------
  ['la fiche montre le pays dont elle parle',
   () => app.includes('const cadreDuPays = (() => {')
      && app.includes('className="fiche-tete-silhouette"')
      && app.includes('id: country.id,')],

  ['l’en-tête de la fiche est un plan, pas une bande blanche',
   () => /\.fiche-tete\s*\{[^}]*background-color: var\(--plan-encre\)/s.test(css)],

  ['la silhouette ne prend pas la place du nom',
   () => {
     const r = css.match(/\.fiche-tete-silhouette\s*\{[^}]*\}/s);
     return !!r && /max-width:\s*38%/.test(r[0])
         && /@media \(max-width: 767px\)[^}]*\{\s*\.fiche-tete-silhouette \{ display: none; \}/s.test(css);
   }],

  ['l’en-tête ne remet pas ses éléments absolus dans le flux',
   // `> *` avait rendu `position: relative` a la silhouette ET au bouton de
   // fermeture : soixante pixels de plus sur un en-tete de mobile.
   () => css.includes('.fiche-tete > *:not(.fiche-tete-silhouette):not(.absolute)')],

  ['la fiche est encadrée par deux plans, pas par un seul',
   () => app.includes('className="fiche-pied')
      && /\.fiche-pied\s*\{[^}]*background-color: var\(--plan-encre\)/s.test(css)],

  ['les boutons d’export se lisent sur le plan du pied',
   // Le bouton d impression portait `bg-slate-900` : de l encre sur de l encre.
   () => css.includes(':is(main, .reader) .fiche-pied button[class*="bg-slate-900"]')],

  ['les chiffres de la fiche reposent sur une assise',
   () => /\.fiche-mesure\s*\{[^}]*border-inline-start: 3px solid var\(--accent\)/s.test(css)
      && /\.ratif-compte\s*\{[^}]*border-inline-start: 3px solid var\(--accent\)/s.test(css)],

  ['aucun folio fantôme ne subsiste',
   // Essaye, mesure, abandonne : il tombait sur le libelle du mouvement.
   () => !app.includes('data-folio=') && !css.includes('content: attr(data-folio)')],

  ['l’en-tête ne se laisse pas écraser',
   // `overflow: hidden` retire a un element de flex sa taille minimale
   // automatique : sans `flex: none` l en-tete tombait a 48 px.
   () => /\.fiche-tete\s*\{[^}]*flex: none;[^}]*overflow: hidden/s.test(css)],

  // --- LES CIBLES TACTILES ------------------------------------------------
  ['un lien seul dans sa puce devient une cible, pas une ligne',
   // `min-height` etait pose sur ces liens depuis toujours, et sans effet :
   // une boite inline non remplacee l ignore.
   () => css.includes(':is(main, .reader) li > a[href]:only-child { display: block; }')],

  ['les cibles étroites reçoivent aussi une largeur',
   () => css.includes(':is(main, .reader) :is(.choro-cran, .tri-col) { min-width: 44px; }')],

  // --- LA TYPOGRAPHIE DU POUR-CENT, DANS LES DEUX LANGUES -----------------
  ['le pour-cent passe par une fonction, pas par une concaténation',
   () => /const pourCent = \(val, lang = 'fr'\) =>/.test(app)
      && !/\$\{formatNumber\([^)]+, lang\)\}%/.test(app)],

  ['le rapport exporté écrit ses pourcentages en français',
   () => {
     const nn = app.match(/const nn = \(v, suffix = ''\) => \{[\s\S]*?\n  \};/);
     return !!nn && /formatNumber\(n, lang\)/.test(nn[0]);
   }],

  ['la bande de chiffres de Données est bilingue jusque dans ses valeurs',
   () => app.includes('{ val: formatNumber(11.1, lang)')
      && app.includes('{ val: pourCent(13.6, lang)')
      && app.includes('L("1-5 €", "€1–5")')],

  ['la comparaison régionale formate sa valeur',
   () => app.includes("unite === '%' ? pourCent(v, lang)")],

  // --- LE LEXIQUE, LA BIBLIOGRAPHIE, LA JUSTIFICATION ---------------------
  ['la bibliothèque compte ses références au lieu de les écrire',
   // Le libellé en toutes lettres survit dans le commentaire qui explique
   // pourquoi il est parti — on vise donc le TITRE, pas le fichier entier.
   () => /titre=\{\{ fr: `\$\{totalDocs\} références/.test(app)
      && !app.includes('Rapports institutionnels & données — 28')
      && app.includes('${nbEssentiels} références sont marquées')],

  ['les quatre familles tirent leur compte de la bibliothèque',
   // Quatre familles, deux langues chacune : huit appels, pas quatre.
   () => (app.match(/libraryData\[\d\]\.items\.length/g) || []).length === 8],

  ['la prose emploie la forme de la Convention de Kampala',
   () => !app.includes('Convention de Kampala sur les déplacés internes')
      && app.includes('Convention de Kampala sur les personnes déplacées internes')],

  ['la justification s’arrête sous 26 rem de colonne',
   () => {
     // Le seuil se lit sur le conteneur, pas sur l ecran : une case de grille
     // etroite sur un large ecran est le cas que la mesure a trouve.
     const c = css.match(/@container \(max-width: 26rem\)\s*\{[\s\S]*?\n\}/);
     return !!c && /text-align:\s*start/.test(c[0])
         && css.includes(':is(main, .reader) [class*="grid-cols"] > * { container-type: inline-size; }');
   }],

  // --- L’ORDRE DU REGARD DANS LA FICHE ------------------------------------
  ['les deux faces sont nommées, et `var(--serif)` résout',
   () => /--serif:\s*'Fraunces'/.test(css) && /--sans:\s*'IBM Plex Sans'/.test(css)],

  ['le chiffre passe avant le folio et avant la thèse',
   () => {
     // 31 px pour le nombre mene, 22 pour le folio, 19 pour la these.
     const mesure = css.match(/\.fiche-mesure-n\s*\{[^}]*\}/s);
     return !!mesure && /font-size:\s*calc\(31px/.test(mesure[0])
         && /\.fiche-mvt span\[class\*="text-\\\[2\.6rem\\\]"\]/.test(css)
         && css.includes('.fiche-mvt > div > p.font-serif.font-bold');
   }],

  ['la coupure entre ratifiés et non-ratifiés se voit',
   () => css.includes('.ratif-ligne[data-ratifie="oui"] + .ratif-ligne[data-ratifie="non"]')],

  ['aucune définition n’occupe le champ du mot',
   () => !app.includes("mot: { fr: 'Un événement soudain ou lent")
      && app.includes("mot: { fr: 'Déplacement lié aux catastrophes'")],

  ['les définitions du lexique sont des phrases, pas des fragments',
   () => !app.includes('Chassé de chez lui, resté dans son pays.')
      && !app.includes('Une inondation, une sécheresse, un cyclone, un séisme.')],

  ['le site ne porte qu’un seul dessin d’étiquette',
   () => {
     // `.surtitre` tient 600 / .16em ; la regle des chapeaux tenait 700 / .18em.
     // Deux dessins pour un role, dont l ecart etait juste assez petit pour se
     // lire comme une erreur. Ils doivent coincider.
     const chapeaux = css.match(/span\[class\*="uppercase"\]\[class\*="tracking"\]\s*\{[^}]*\}/s);
     return !!chapeaux
         && /letter-spacing:\s*\.16em/.test(chapeaux[0])
         && /font-weight:\s*600/.test(chapeaux[0]);
   }],

  ['le feuilletage tourne en boucle, sans premier ni dernier',
   () => {
     // Deux choses font la boucle, et elles se tiennent : la distance vue est
     // repliée dans [-total/2, +total/2], et le rang demandé est pris modulo
     // la liste. Une seule des deux, et le carrousel bute à nouveau.
     const compte = (h, n) => h.split(n).length - 1;
     return compte(app, '((d % total) + total + demi) % total - demi') === 2
         && app.includes('const j = total ? ((i % total) + total) % total : 0;')
         && !app.includes('Math.min(total - 1, i)')
         && !app.includes('disabled={pos <= 0}')
         && !app.includes('disabled={pos >= total - 1}');
   }],

  ['la correction de place part du rang réel, non de la distance vue',
   () => {
     // Sans cette distinction, replier la distance envoyait les cartes des
     // deux bouts à plus de vingt-sept mille pixels — mesuré sur le rendu.
     const compte = (h, n) => h.split(n).length - 1;
     return compte(app, 'useTransform([signe, brut], ([d, dBrut])') === 2
         && compte(app, '- dBrut * pas;') === 2;
   }],

  ['la carte centrale passe devant ses voisines',
   () => {
     // `z-index` ne fait rien sur une boîte `static` : la règle calculait
     // 10/9/8 et les cartes se peignaient dans l’ordre du DOM, celle de
     // droite couvrant le centre.
     const i = css.indexOf('.feuillet {');
     if (i < 0) return false;
     return css.slice(i, css.indexOf('}', i)).includes('position: relative');
   }],

  ['le site n’apprend nulle part à se servir d’une souris',
   () => {
     // « tirer pour feuilleter », « Cliquez le pays », « Survolez la carte » :
     // trois consignes eparpillees qui decrivaient le geste au lieu de dire
     // quelque chose. Deux etaient fausses sur un ecran tactile.
     return !app.includes('tirer pour feuilleter')
         && !app.includes('drag to browse')
         && !app.includes('Cliquez le pays')
         && !app.includes('Survolez la carte');
   }],

  ['la vérification tient en deux titres, non en trois',
   () => {
     // La barre de recherche portait son propre titre, entre la portee de la
     // note et les affirmations qu elle filtre. Elle a rejoint ce qu elle
     // filtre, et le compte ne parait plus qu une fois.
     const compte = (h, n) => h.split(n).length - 1;
     return !app.includes('Chercher dans le corpus')
         && compte(app, 'Les affirmations, une par une') === 1
         && app.includes('aria={L(');
   }],

  ['les infographies partagent une seule mise en page',
   () => {
     // Huit planches sur le meme gabarit : chapeau borde, corps, pied de
     // sources. Trois portaient un corps plus haut que les autres, et cinq
     // releves chiffres respiraient deux fois plus que le sixieme.
     const compte = (h, n) => h.split(n).length - 1;
     return !app.includes('px-6 md:px-8 py-6')
         && compte(app, 'px-6 md:px-8 py-5 space-y-5 text-sm text-slate-700 leading-relaxed') === 7
         && !app.includes('figure-row px-1 py-1"')
         && compte(app, 'figure-row px-1 py-0.5"') === 6;
   }],

  ['le titre de section n’a qu’un seul dessin',
   () => {
     // Quinze exemplaires, cinq orthographes : mb-2, mb-3, mb-4, avec ou
     // sans le cran md:text-2xl. Le role est le meme aux quinze endroits.
     //
     // Cinq autres titres restent a vingt pixels, et c est voulu : ils
     // coiffent un panneau, non une section de page. Ils s accordent entre
     // eux — c est un second niveau, pas un sixieme ecart.
     const compte = (h, n) => h.split(n).length - 1;
     const dessin = '<h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-2"';
     return compte(app, dessin) === 15
         && !app.includes('<h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-3"')
         && !app.includes('<h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 mb-4"')
         && !app.includes('<h2 className="text-xl font-serif font-bold text-slate-900 mb-');
   }],

  ['la note de pied suit la forme que la feuille de style annonce',
   () => {
     // « Le composant <Sources> porte la forme de reference (.provenance).
     // Les notes ecrites a la main la reprennent ici. » Deux notes se
     // redessinaient a la main, l une a onze pixels, l autre avec une autre
     // encre ; une bande de pied entiere refaisait le composant.
     return !app.includes("text-[11px] leading-relaxed text-justify\" style={{ color: 'var(--label)' }}")
         && !app.includes('<p className="surtitre">{L(\'Source\', \'Source\')}</p>')
         && css.includes('.note-source:first-child,')
         && css.includes('.surtitre + .note-source');
   }],

  ['le glossaire, la bibliographie et la méthode ont chacun leur adresse',
   () => {
     // Trente-quatre mille caracteres de glossaire, cent soixante-douze
     // entrees, et aucun lien pour les designer : les quatre volets
     // partageaient /fr/a-propos. Un glossaire qu on ne peut pas citer.
     return app.includes('  about: {') && app.includes("about:       { fr: 'presentation', en: 'overview' },")
         && app.includes("glossary:    { fr: 'glossaire',    en: 'glossary' },")
         && app.includes("activeTab === 'about' ? activeResourceTab : null")
         && !app.includes("activeTab === 'resources' ? activeResourceTab");
   }],

  ['aucune adresse conservée ne mène à une page vide',
   () => {
     // « conserve : les liens deja partages doivent continuer d ouvrir » --
     // et /fr/ressources servait un en-tete, un pied, et rien entre les deux.
     // La cle rejoint les adresses d avant, qui redirigent pour de bon.
     return !app.includes("resources:  { fr: 'ressources',   en: 'resources' }")
         && app.includes("  ressources: 'about',")
         && app.includes("  resources: 'about',");
   }],

  ['le titre de la page nomme le volet que l’adresse ouvre',
   () => {
     // Un lien vers le glossaire s annoncait « A propos » dans l onglet, le
     // favori et le partage : indiscernable de la page de signature.
     return app.includes('const VOLETS_APROPOS = {')
         && app.includes('tr(VOLETS_APROPOS[activeResourceTab] || NOMS.about, lang)')
         && app.includes('activeSubTab, activeResourceTab, showModal, text]);');
   }],

  ['le plan du site connaît les trois volets adressables',
   () => {
     const plan = readFileSync('public/sitemap.xml', 'utf8');
     return ['fr/a-propos/glossaire', 'fr/a-propos/bibliotheque', 'fr/a-propos/methode',
             'en/about/glossary', 'en/about/library', 'en/about/method']
       .every((u) => plan.includes(u));
   }],
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
