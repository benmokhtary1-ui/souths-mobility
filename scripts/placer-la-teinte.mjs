// OÙ POSER LA COULEUR DE L'ATLAS
// ===========================================================================
// L'Atlas portait l'émeraude #046345, à trois degrés de teinte du vert de
// l'Union africaine. C'est la couleur générale du site : elle signe la marque
// et sert d'accent par défaut, si bien que la plateforme entière se lisait
// comme une émanation de l'Union. Elle ne l'est pas — elle est indépendante,
// et son propos est précisément de distinguer ce que l'Union proclame de ce
// que les États font.
//
// LE CHOIX NE SE DEVINE PAS, il se calcule. Trois contraintes :
//   1. s'écarter des couleurs des institutions de la question migratoire —
//      le vert de l'UA, les bleus de l'ONU, du HCR et de l'OIM, l'or de
//      l'ICMPD ;
//   2. s'écarter des huit autres teintes de section, sinon deux sections se
//      confondent ;
//   3. tenir le contraste : l'accent doit passer 4,5:1 sur le papier, et sa
//      variante profonde 7:1, sans quoi la charte d'accessibilité tombe.
//
// Le script mesure les teintes en OKLCh — l'espace où une distance angulaire
// correspond à une différence PERÇUE, ce que HSL ne garantit pas — cherche le
// plus grand vide sur le cercle, et rend les quatre valeurs de la gamme.
//
//   node scripts/placer-la-teinte.mjs

// --- sRGB -> OKLab -> OKLCh ------------------------------------------------
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

const hexRgb = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255);
};
const rgbHex = (r, g, b) => '#' + [r, g, b]
  .map(v => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0').toUpperCase())
  .join('');

const oklab = (hex) => {
  const [R, G, B] = hexRgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
  ];
};
const deOklab = ([L, a, b]) => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return rgbHex(
    delin(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    delin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    delin(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s));
};
const lch = (hex) => {
  const [L, a, b] = oklab(hex);
  return { L, C: Math.hypot(a, b), h: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360 };
};
const deLch = ({ L, C, h }) => deOklab([L, C * Math.cos(h * Math.PI / 180), C * Math.sin(h * Math.PI / 180)]);

// --- contraste WCAG --------------------------------------------------------
const lum = (hex) => { const [r, g, b] = hexRgb(hex).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// --- ce qu'il faut éviter --------------------------------------------------
const INSTITUTIONS = {
  'Union africaine (vert)':  '#046A38',
  'ONU (bleu)':              '#009EDB',
  'HCR (bleu)':              '#0072BC',
  'OIM (bleu)':              '#0033A0',
  'ICMPD (or)':              '#F0B323',
  'OIT (bleu)':              '#1A3668',
  'Banque mondiale (bleu)':  '#002244',
};
const SECTIONS = {
  home: '#2B3A67', evidence: '#5B3A6E', explorer: '#2E5F6B', mobilites: '#7A2E3E',
  atlas: '#046345', governance: '#3D3A78', data: '#5A581F', resources: '#6B4230',
  about: '#3F4654',
};

const PAPIER = '#FBF9F6';

console.log('LES TEINTES EN PRÉSENCE  (OKLCh — angle perçu)');
console.log('='.repeat(70));
const dire = (nom, hex) => {
  const c = lch(hex);
  console.log(`  ${nom.padEnd(26)} ${hex}  h=${c.h.toFixed(0).padStart(3)}°  C=${c.C.toFixed(3)}  L=${c.L.toFixed(2)}`);
};
console.log('\ninstitutions de la question migratoire — à fuir');
Object.entries(INSTITUTIONS).forEach(([n, h]) => dire(n, h));
console.log('\nsections du site');
Object.entries(SECTIONS).forEach(([n, h]) => dire(n, h));

// --- le plus grand vide, l'Atlas mis de côté -------------------------------
const occupees = [
  ...Object.values(INSTITUTIONS),
  ...Object.entries(SECTIONS).filter(([n]) => n !== 'atlas').map(([, h]) => h),
].map(h => lch(h).h).sort((a, b) => a - b);

let vide = { debut: 0, fin: 0, taille: 0 };
for (let i = 0; i < occupees.length; i++) {
  const a = occupees[i];
  const b = occupees[(i + 1) % occupees.length] + (i === occupees.length - 1 ? 360 : 0);
  if (b - a > vide.taille) vide = { debut: a, fin: b, taille: b - a };
}
const cible = (vide.debut + vide.taille / 2) % 360;

console.log(`\n${'='.repeat(70)}`);
console.log(`Plus grand vide : de ${vide.debut.toFixed(0)}° à ${(vide.fin % 360).toFixed(0)}°  `
  + `(${vide.taille.toFixed(0)}° de large)`);
console.log(`Teinte visée    : ${cible.toFixed(0)}°`);

// --- la gamme, calée sur les contrastes que la charte exige ---------------
// On garde les clartés et les chromas de l'ancienne gamme : c'est ce qui fait
// que la nouvelle teinte se pose sans rerégler quoi que ce soit d'autre.
const MODELE = { accent: '#046345', deep: '#004630', soft: '#D9F5E7', light: '#85B79F' };
console.log(`\nGAMME PROPOSÉE  (clartés et chromas repris de l’ancienne)`);
console.log('-'.repeat(70));
const gamme = {};
for (const [role, hex] of Object.entries(MODELE)) {
  const c = lch(hex);
  const neuf = deLch({ ...c, h: cible });
  gamme[role] = neuf;
  const sur = role === 'light' ? '#14161C' : PAPIER;
  const quoi = role === 'light' ? 'sur l’encre' : 'sur le papier';
  console.log(`  --accent${role === 'accent' ? ':      ' : role === 'deep' ? '-deep: ' : role === 'soft' ? '-soft: ' : '-light:'} `
    + `${neuf}   ${quoi} ${contraste(neuf, sur).toFixed(1)}:1`
    + (role === 'soft' ? `   (l’encre y tient ${contraste('#14161C', neuf).toFixed(1)}:1)` : ''));
}

// --- la distance a tout le reste ------------------------------------------
const dOk = (a, b) => { const [x, y] = [oklab(a), oklab(b)]; return Math.hypot(...x.map((v, i) => (v - y[i]) * 100)); };
console.log(`\nDISTANCE PERÇUE de l’accent proposé (OKLab ×100)`);
console.log('-'.repeat(70));
const toutes = { ...INSTITUTIONS, ...Object.fromEntries(Object.entries(SECTIONS).filter(([n]) => n !== 'atlas')) };
Object.entries(toutes)
  .map(([n, h]) => [n, dOk(gamme.accent, h)])
  .sort((a, b) => a[1] - b[1])
  .slice(0, 6)
  .forEach(([n, d]) => console.log(`  ${n.padEnd(26)} ${d.toFixed(1)}${d < 15 ? '   TROP PROCHE' : ''}`));
