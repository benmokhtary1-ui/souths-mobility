// L'IMAGE D'APERÇU AU PARTAGE
// ===========================================================================
// Un lien collé dans un fil de discussion, un signet, une notice de
// bibliothèque : tous affichent l'image déclarée en `og:image`. Sans elle, le
// projet apparaît comme un rectangle gris avec une adresse Vercel.
//
// L'image se COMPOSE ici plutôt que de se dessiner à la main, pour deux
// raisons. Elle doit reprendre exactement la palette et les tracés du site — le
// graphite étalon, la marque, le continent et ses corridors — et elle doit
// pouvoir être refaite d'une commande le jour où l'un des trois change. Une
// capture d'écran se périme en silence ; celle-ci se régénère.
//
//   node scripts/composer-l-apercu.mjs
//
// Format : 1200 × 630, le rapport attendu par Open Graph. Au-delà de 1 Mo,
// certains clients renoncent à la charger — on reste très en dessous.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const L = 1200, H = 630;

// La palette du site, reprise telle quelle.
const ENCRE = '#14161C';
const RESERVE = '#FFFDF9';
const GRAPHITE = '#3F4654';       // la couleur étalon
const GRAPHITE_CLAIR = '#929AA9';

// Le continent et les corridors viennent des mêmes tracés que la plateforme :
// l'aperçu ne peut donc pas dériver du site qu'il annonce.
const paths = readFileSync('src/africaMapPaths.js', 'utf8');
const traces = [...paths.matchAll(/"(\d+)":"(M[^"]+)"/g)].map(m => m[2]);
if (!traces.length) throw new Error('aucun tracé de pays trouvé');
const vb = (paths.match(/AFRICA_VIEWBOX = "([^"]+)"/) || [])[1] || '-8 -8 1022 1142';

console.log(`${traces.length} pays, cadre ${vb}`);

// Le continent occupe la moitié droite, débordant du cadre par le bas : c'est
// la composition du bandeau de l'Atlas, en plus serré.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${H}" viewBox="0 0 ${L} ${H}">
  <defs>
    <linearGradient id="fond" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ENCRE}"/>
      <stop offset="100%" stop-color="#1D2129"/>
    </linearGradient>
    <linearGradient id="voile" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${ENCRE}" stop-opacity="1"/>
      <stop offset="55%" stop-color="${ENCRE}" stop-opacity=".82"/>
      <stop offset="100%" stop-color="${ENCRE}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="${L}" height="${H}" fill="url(#fond)"/>

  <g transform="translate(700, -40) scale(0.62)">
    <svg width="1022" height="1142" viewBox="${vb}">
      <g fill="${GRAPHITE}" fill-opacity=".55" stroke="${GRAPHITE_CLAIR}" stroke-opacity=".28" stroke-width="1.2">
        ${traces.map(d => `<path d="${d}"/>`).join('')}
      </g>
    </svg>
  </g>

  <rect width="${L}" height="${H}" fill="url(#voile)"/>

  <!-- Le filet d'accent, comme en tête de chaque section du site -->
  <rect x="72" y="188" width="88" height="3" fill="${GRAPHITE_CLAIR}"/>

  <text x="72" y="168" font-family="Georgia, serif" font-size="19" letter-spacing="3.4"
        fill="${GRAPHITE_CLAIR}">PLATEFORME INDÉPENDANTE DE RECHERCHE</text>

  <text x="72" y="268" font-family="Georgia, serif" font-size="74" font-weight="700" fill="${RESERVE}">African Mobility</text>
  <text x="72" y="352" font-family="Georgia, serif" font-size="74" font-weight="700" fill="${RESERVE}">Hub</text>

  <text x="72" y="428" font-family="Georgia, serif" font-size="30" fill="${GRAPHITE_CLAIR}">Les mobilités africaines,</text>
  <text x="72" y="470" font-family="Georgia, serif" font-size="30" fill="${GRAPHITE_CLAIR}">par les données africaines.</text>

  <text x="72" y="552" font-family="Helvetica, Arial, sans-serif" font-size="21"
        fill="${GRAPHITE_CLAIR}" fill-opacity=".82">54 États · sources institutionnelles vérifiées · chaque chiffre daté</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile('public/apercu-partage.png');
const { size } = await import('node:fs').then(m => m.promises.stat('public/apercu-partage.png'));
console.log(`public/apercu-partage.png — ${L}×${H}, ${Math.round(size / 1024)} Ko`);
