// LA FEUILLE DE LANCEMENT
// ===========================================================================
// Un imprimé qui annonce un site ne sert à rien s'il ne lui ressemble pas :
// celui qui scanne doit reconnaître, à l'écran, la chose qu'il tenait. La
// feuille reprend donc le système de la plateforme plutôt que d'inventer un
// style de flyer — le graphite étalon, Fraunces et IBM Plex, et le continent
// dessiné avec les tracés du site lui-même.
//
// Le script est autonome : il lit l'adresse dans index.html, fabrique le QR,
// et prend le continent dans src/africaMapPaths.js. Rien n'est recopié à la
// main, donc rien ne peut diverger du site le jour où l'adresse change.
//
//   node scripts/composer-le-flyer.mjs                    → flyer.html
//   node scripts/composer-le-flyer.mjs https://mon-domaine.org
import fs from 'node:fs';
import QRCode from 'qrcode';
import { AFRICA_VIEWBOX, africaCountryPaths } from '../src/africaMapPaths.js';

// --- l adresse : celle du site, pas une copie ------------------------------
const canonical = fs.readFileSync('index.html', 'utf8')
  .match(/rel="canonical"\s+href="([^"]+)"/)?.[1];
const ADRESSE = process.argv[2] || canonical;
if (!ADRESSE) throw new Error('aucune adresse : ni argument, ni <link rel="canonical"> dans index.html');

// --- le QR ----------------------------------------------------------------
// On garde la matrice plutot que le SVG tout fait : il faut la taille pour
// calculer le cadre, et la zone de silence de quatre modules doit entrer DANS
// le viewBox — sinon elle depend d un remplissage CSS, et un remplissage se
// perd a l impression.
const q = QRCode.create(ADRESSE, { errorCorrectionLevel: 'M' });
const cote = q.modules.size;
const bits = q.modules.data;
const SILENCE = 4;

let trace = '';
for (let y = 0; y < cote; y += 1) {
  let x = 0;
  while (x < cote) {
    if (!bits[y * cote + x]) { x += 1; continue; }
    let n = 0;
    while (x + n < cote && bits[y * cote + x + n]) n += 1;
    trace += `M${x} ${y + 0.5}h${n}`;
    x += n;
  }
}
const cadreQR = `${-SILENCE} ${-SILENCE} ${cote + SILENCE * 2} ${cote + SILENCE * 2}`;

// --- le continent ---------------------------------------------------------
const continent = Object.values(africaCountryPaths).map(d => `<path d="${d}"/>`).join('');
const pays = Object.keys(africaCountryPaths).length;

const page = `<title>Feuille de lancement</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700;9..144,900&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
  :root {
    --encre:      #14161C;
    --encre-2:    #1D2129;
    --reserve:    #FFFDF9;
    --graphite:   #3F4654;
    --graphite-c: #929AA9;
    --papier:     #FBF9F6;
    --hors:       #EFEDEA;
    --hors-texte: #14161C;
    --hors-doux:  #6B6560;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) { --hors: #101215; --hors-texte: #FFFDF9; --hors-doux: #9AA1AF; }
  }
  :root[data-theme="dark"] { --hors: #101215; --hors-texte: #FFFDF9; --hors-doux: #9AA1AF; }

  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--hors); color: var(--hors-texte);
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    display: flex; flex-direction: column; align-items: center;
    gap: 20px; padding: 28px 16px 48px;
  }

  .commandes { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: center; }
  .commandes button {
    font: 500 13px/1 'IBM Plex Sans', sans-serif; letter-spacing: .04em;
    padding: 9px 15px; cursor: pointer;
    background: transparent; color: var(--hors-texte);
    border: 1px solid color-mix(in oklab, var(--hors-texte) 26%, transparent);
    border-radius: 2px;
  }
  .commandes button[aria-pressed="true"] { background: var(--hors-texte); color: var(--hors); border-color: var(--hors-texte); }
  .commandes button:focus-visible { outline: 2px solid var(--graphite-c); outline-offset: 2px; }
  .note { font-size: 12.5px; color: var(--hors-doux); max-width: 52ch; text-align: center; line-height: 1.55; }
  .note b { color: var(--hors-texte); font-weight: 600; }

  /* --- la feuille ------------------------------------------------------- */
  .feuille {
    position: relative; overflow: hidden;
    width: 148mm; height: 210mm;
    background: var(--encre); color: var(--reserve);
    display: flex; flex-direction: column;
    padding: 14mm 13mm 12mm;
    box-shadow: 0 18px 50px rgba(0,0,0,.30);
  }
  body[data-format="a4"] .feuille { width: 210mm; height: 297mm; padding: 20mm 18mm 17mm; }

  .fond { position: absolute; inset: 0; background: linear-gradient(150deg, var(--encre) 0%, var(--encre-2) 100%); }

  /* La planche occupe la respiration entre l argument et les constats. Deux
     mesures l ont fixee ici. A .17 d opacite elle ne se lisait pas du tout, le
     voile la mangeait. Et debordante — calee sur le bandeau du site — elle se
     coupait en haut ET en bas : il n en restait qu une tache sans contour
     reconnaissable. Sur une feuille, l Afrique doit se lire d un coup ; elle
     tient donc entiere dans la bande, hauteur d abord. */
  .planche { position: absolute; right: 2%; top: 21.5%; height: 33%; width: auto;
             opacity: .30; pointer-events: none; }
  .planche path { fill: var(--graphite); stroke: var(--graphite-c); stroke-width: 1.1; stroke-opacity: .48; }

  /* Le voile ne sert plus qu a garder le texte lisible la ou il croise la
     planche : il s ouvre sur la bande centrale et se referme sur les constats. */
  .voile { position: absolute; inset: 0;
    background: linear-gradient(180deg,
      color-mix(in oklab, var(--encre) 40%, transparent) 18%,
      transparent 30%, transparent 56%,
      color-mix(in oklab, var(--encre) 78%, transparent) 68%,
      var(--encre) 80%); }

  .dessus { position: relative; display: flex; flex-direction: column; height: 100%; }

  .oeil { font-size: 8.4pt; font-weight: 600; letter-spacing: .19em; text-transform: uppercase; color: var(--graphite-c); }
  .filet { height: 2px; width: 46px; background: var(--graphite-c); margin: 7px 0 14px; }

  .nom { font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 30pt; line-height: 1.02; margin: 0; text-wrap: balance; }
  body[data-format="a4"] .nom { font-size: 42pt; }
  .nom em { font-style: italic; }

  .these { font-family: 'Fraunces', Georgia, serif; font-size: 13.5pt; line-height: 1.35; color: var(--graphite-c); margin: 9px 0 0; max-width: 26ch; }
  body[data-format="a4"] .these { font-size: 18pt; max-width: 28ch; }

  /* Mesure : a 44ch en A4 le paragraphe passait 40px SOUS la planche. Les deux
     largeurs sont donc calees sur le bord gauche du continent, pas sur le
     confort de lecture seul — c est la contrainte la plus serree des deux. */
  .quoi { font-size: 9.4pt; line-height: 1.55; margin: 12px 0 0; max-width: 37ch;
          color: color-mix(in oklab, var(--reserve) 74%, var(--encre)); }
  body[data-format="a4"] .quoi { font-size: 12pt; max-width: 38ch; }

  .constats { display: flex; flex-direction: column; gap: 9px; margin-top: auto; padding-top: 14px; }
  /* La colonne des chiffres est mesuree sur le plus large — « 47 / 54 » — et
     non estimee : a 74px il se coupait en deux lignes, seul des trois. */
  .constat { display: grid; grid-template-columns: 88px 1fr; align-items: baseline; gap: 12px;
             padding-top: 8px; border-top: 1px solid color-mix(in oklab, var(--reserve) 13%, transparent); }
  body[data-format="a4"] .constat { grid-template-columns: 122px 1fr; gap: 16px; }
  .chiffre { font-family: 'Fraunces', Georgia, serif; font-weight: 700; font-size: 17pt; line-height: 1;
             font-variant-numeric: tabular-nums; color: var(--reserve); white-space: nowrap; }
  body[data-format="a4"] .chiffre { font-size: 24pt; }
  .quoi-chiffre { font-size: 8.6pt; line-height: 1.42; color: var(--graphite-c); }
  body[data-format="a4"] .quoi-chiffre { font-size: 11pt; }

  .pied { display: flex; align-items: flex-end; gap: 12px; margin-top: 16px;
          padding-top: 13px; border-top: 2px solid var(--graphite-c); }
  body[data-format="a4"] .pied { gap: 18px; margin-top: 24px; }
  .code { background: var(--papier); padding: 5px; border-radius: 2px; flex: none; line-height: 0; }
  .code svg { display: block; width: 30mm; height: 30mm; }
  body[data-format="a4"] .code svg { width: 38mm; height: 38mm; }
  .adresse { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .adresse .url { font-family: 'Fraunces', Georgia, serif; font-weight: 600; font-size: 11.5pt; word-break: break-word; }
  body[data-format="a4"] .adresse .url { font-size: 15pt; }
  .adresse .qui { font-size: 8.2pt; line-height: 1.45; color: var(--graphite-c); }
  body[data-format="a4"] .adresse .qui { font-size: 10.5pt; }

  /* SANS CECI LA FEUILLE SORT BLANCHE. Les navigateurs n impriment pas les
     fonds par defaut : le papier resterait blanc et le texte, qui est en
     reserve, disparaitrait purement et simplement. C est le seul reglage du
     document qui decide si l imprime existe ou non. */
  .feuille, .feuille * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  @media print {
    @page { size: A5 portrait; margin: 0; }
    body { padding: 0; gap: 0; background: #fff; display: block; }
    .commandes, .note { display: none; }
    .feuille { box-shadow: none; width: 148mm; height: 210mm; break-inside: avoid; }
    body[data-format="a4"] .feuille { width: 210mm; height: 297mm; }
  }
</style>

<div class="commandes">
  <button type="button" id="b-a5" aria-pressed="true">A5 — 148 × 210 mm</button>
  <button type="button" id="b-a4" aria-pressed="false">A4 — 210 × 297 mm</button>
  <button type="button" id="b-print">Imprimer</button>
</div>
<p class="note">Le QR pointe sur la plateforme ; il a été relu par un décodeur indépendant, à la taille d’impression comme sur une photo dégradée. À l’impression, choisir <b>marges : aucune</b> et laisser les <b>graphismes d’arrière-plan</b> activés. Pour LinkedIn, une capture de la feuille suffit — elle est dessinée pour tenir à l’écran comme sur le papier.</p>

<div class="feuille">
  <div class="fond"></div>
  <svg class="planche" viewBox="${AFRICA_VIEWBOX}" aria-hidden="true">${continent}</svg>
  <div class="voile"></div>

  <div class="dessus">
    <div>
      <div class="oeil">Plateforme indépendante de recherche</div>
      <div class="filet"></div>
      <h1 class="nom">African<br>Mobility Hub</h1>
      <p class="these">Les mobilités africaines, par les données africaines.</p>
      <p class="quoi">Ce que les institutions publient sur les mobilités des Suds, réuni, daté, rendu comparable — et lu avec les définitions africaines plutôt qu’avec celles du Nord.</p>
    </div>

    <div class="constats">
      <div class="constat">
        <span class="chiffre">54,4 %</span>
        <span class="quoi-chiffre">des personnes nées dans un État de l’Union africaine et parties de leur pays vivent dans un autre État africain</span>
      </div>
      <div class="constat">
        <span class="chiffre">4 / 54</span>
        <span class="quoi-chiffre">États ont ratifié le Protocole sur la libre circulation — contre 54 pour l’Acte constitutif</span>
      </div>
      <div class="constat">
        <span class="chiffre">47 / 54</span>
        <span class="quoi-chiffre">États ont conduit un recensement sur le cycle 2010 : la production existe, le déficit est en aval</span>
      </div>
    </div>

    <div class="pied">
      <div class="code">
        <svg viewBox="${cadreQR}" shape-rendering="crispEdges" role="img"
             aria-label="Code QR vers ${ADRESSE.replace(/^https?:\/\//, '')}">
          <path fill="#FBF9F6" d="M${-SILENCE} ${-SILENCE}h${cote + SILENCE * 2}v${cote + SILENCE * 2}h-${cote + SILENCE * 2}z"/>
          <path stroke="#14161C" d="${trace}"/>
        </svg>
      </div>
      <div class="adresse">
        <span class="url">${ADRESSE.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
        <span class="qui">Yassine Ben Mokhtar — recherche doctorale indépendante sur la gouvernance des mobilités africaines. 54 États, sources institutionnelles vérifiées, données exportables.</span>
      </div>
    </div>
  </div>
</div>

<script>
  const corps = document.body;
  const a5 = document.getElementById('b-a5');
  const a4 = document.getElementById('b-a4');
  const poser = (f) => {
    corps.dataset.format = f;
    a5.setAttribute('aria-pressed', String(f === 'a5'));
    a4.setAttribute('aria-pressed', String(f === 'a4'));
    // La feuille imprimee doit correspondre au format choisi.
    const s = document.getElementById('regle-page') || Object.assign(
      document.head.appendChild(document.createElement('style')), { id: 'regle-page' });
    s.textContent = '@page { size: ' + (f === 'a4' ? 'A4' : 'A5') + ' portrait; margin: 0; }';
  };
  a5.addEventListener('click', () => poser('a5'));
  a4.addEventListener('click', () => poser('a4'));
  document.getElementById('b-print').addEventListener('click', () => window.print());
  poser('a5');
</script>`;

const sortie = process.argv[3] || 'flyer.html';
fs.writeFileSync(sortie, page);
console.log(`${sortie} — ${Math.round(page.length / 1024)} Ko`);
console.log(`  adresse    ${ADRESSE}`);
console.log(`  QR         ${cote}×${cote} modules, correction M, silence ${SILENCE}`);
console.log(`  continent  ${pays} pays, cadre ${AFRICA_VIEWBOX}`);
