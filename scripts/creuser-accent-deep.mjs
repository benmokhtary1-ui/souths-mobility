// Recalcule --accent-deep a partir de --accent, section par section.
//
// Le releve sur le rendu a montre le probleme : dans huit sections sur neuf,
// --accent et --accent-deep sont separes de 0,45 a 1,9 en OKLab (x100). L'oeil
// ne lit rien sous 4. La hierarchie existait donc dans le fichier et pas a
// l'ecran — 58 noeuds de texte de Gouvernance repartis sur deux valeurs
// identiques a la vue, et dans un cas (--accent-deep de Gouvernance) la teinte
// « profonde » etait meme legerement plus claire que l'accent.
//
// Seul l'Atlas avait un vrai ecart : #046345 -> #004630. On en prend la mesure,
// et on l'applique aux autres : meme teinte, meme chroma, luminosite abaissee
// du meme pas. Le contraste sur le papier est ensuite verifie, jamais suppose.
//
//   node scripts/creuser-accent-deep.mjs

const PAPIER = '#FCFAF8';

// ---- sRGB <-> OKLab / OKLch ------------------------------------------------
const lin = u => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
const gam = u => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map(u => Math.round(Math.min(1, Math.max(0, u)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

function rgb2oklab([r, g, b]) {
  r = lin(r); g = lin(g); b = lin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklab2rgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [gam(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
          gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
          gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
}
const lab2lch = ([L, a, b]) => [L, Math.hypot(a, b), Math.atan2(b, a)];
const lch2lab = ([L, C, h]) => [L, C * Math.cos(h), C * Math.sin(h)];
const dansLeGamut = ([r, g, b]) => [r, g, b].every(u => u >= -0.0005 && u <= 1.0005);

// ---- contraste WCAG (calcule, jamais estime) -------------------------------
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contraste = (h1, h2) => {
  const a = lum(hex2rgb(h1)), b = lum(hex2rgb(h2));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
const dE = (h1, h2) => {
  const a = rgb2oklab(hex2rgb(h1)), b = rgb2oklab(hex2rgb(h2));
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) * 100;
};

// ---- le pas, mesure sur l'Atlas -------------------------------------------
const PAS = lab2lch(rgb2oklab(hex2rgb('#046345')))[0] - lab2lch(rgb2oklab(hex2rgb('#004630')))[0];

// Descend la luminosite du pas voulu ; si la couleur sort du gamut, on reduit le
// chroma plutot que d'ecreter les canaux — ecreter deplace la teinte.
function creuser(hex, pas) {
  let [L, C, h] = lab2lch(rgb2oklab(hex2rgb(hex)));
  const cible = Math.max(0.08, L - pas);
  for (let k = 1; k >= 0; k -= 0.01) {
    const rgb = oklab2rgb(lch2lab([cible, C * k, h]));
    if (dansLeGamut(rgb)) return rgb2hex(rgb);
  }
  return hex;
}

const SECTIONS = [
  ['home',       'indigo',        '#2B3A67', '#293969'],
  ['evidence',   'prune',         '#5B3A6E', '#5C3870'],
  ['explorer',   'bleu petrole',  '#2E5F6B', '#295A66'],
  ['mobilites',  'grenat',        '#7A2E3E', '#7D2B3C'],
  ['atlas',      'kola',          '#046345', '#004630'],
  ['governance', 'bleu-violet',   '#3D3A78', '#3B387A'],
  ['data',       'olive',         '#5A581F', '#54531C'],
  ['resources',  'terre brulee',  '#6B4230', '#6D412E'],
  ['about',      'graphite',      '#3F4654', '#3E4655'],
];

console.log('pas de luminosite mesure sur l\'Atlas : ' + (PAS * 100).toFixed(1) + ' (OKLch L x100)\n');
console.log('section      teinte          accent    deep actuel  dE   ->  deep calcule  dE    contraste/papier');
console.log('-'.repeat(104));

const resultats = [];
for (const [cle, nom, accent, deepActuel] of SECTIONS) {
  const propose = cle === 'atlas' ? deepActuel : creuser(accent, PAS);
  const c = contraste(propose, PAPIER);
  resultats.push([cle, propose]);
  console.log(
    cle.padEnd(12) + nom.padEnd(16) + accent + '   ' + deepActuel + '     ' +
    dE(accent, deepActuel).toFixed(1).padStart(4) + '  ->  ' + propose + '      ' +
    dE(accent, propose).toFixed(1).padStart(4) + '   ' + c.toFixed(2) + ':1' +
    (c >= 7 ? '  ok' : c >= 4.5 ? '  titres seuls' : '  INSUFFISANT'));
}

console.log('\nremplacements :');
for (const [cle, hex] of resultats) console.log('  ' + cle + ' -> ' + hex);
