// LIRE LE QR DE LA FEUILLE AVEC UN AUTRE LECTEUR QUE CELUI QUI L'A ÉCRIT
// ===========================================================================
// Un flyer imprimé à cent exemplaires avec un QR mort est une soirée perdue et
// rien pour le rattraper. Or le code n'est pas exactement ce que `qrcode`
// produit : la matrice est retracée en segments SVG par composer-le-flyer.mjs,
// et c'est cette transformation qui peut casser, pas l'encodage. Le vérifier
// avec `qrcode` ne prouverait donc rien.
//
// On rend le SVG en pixels et on le donne à jsQR — un décodeur indépendant —
// à trois tailles : celle du papier, celle d'une capture d'écran, et une taille
// dégradée, parce qu'un flyer se scanne de loin et de travers.
//
//   node scripts/verifier-le-flyer.mjs [flyer.html]
import fs from 'node:fs';
import sharp from 'sharp';
import jsQR from 'jsqr';

const fichier = process.argv[2] || 'flyer.html';
if (!fs.existsSync(fichier)) {
  console.error(`${fichier} n'existe pas — lancer d'abord : node scripts/composer-le-flyer.mjs`);
  process.exit(1);
}
const page = fs.readFileSync(fichier, 'utf8');

// L'adresse attendue est celle du site, pas une constante recopiée ici.
const attendu = fs.readFileSync('index.html', 'utf8').match(/rel="canonical"\s+href="([^"]+)"/)?.[1];

// On extrait le QR tel qu'il est écrit dans la feuille, cadre compris.
const bloc = page.match(/<svg viewBox="([^"]+)"[^>]*role="img"[\s\S]*?<\/svg>/);
if (!bloc) { console.error('aucun QR trouvé dans la feuille'); process.exit(1); }
const svg = `<svg xmlns="http://www.w3.org/2000/svg" ${bloc[0].slice(5)}`;

const essais = [
  ['papier, 30 mm à 300 ppp', 354],
  ['capture d’écran', 200],
  ['photo de loin, dégradée', 110],
];

console.log(`LE QR DE ${fichier}`);
console.log('='.repeat(66));
let bon = true;
for (const [nom, px] of essais) {
  const { data, info } = await sharp(Buffer.from(svg))
    .resize(px, px, { kernel: 'nearest' })
    .flatten({ background: '#ffffff' })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const lu = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  const ok = !!lu && lu.data === attendu;
  if (!ok) bon = false;
  console.log(`  ${ok ? '·' : '✗'}  ${nom.padEnd(26)} ${lu ? lu.data : 'ILLISIBLE'}`);
}

console.log('='.repeat(66));
console.log(bon
  ? `Le QR décode, et sur ${attendu}`
  : `LE QR NE MÈNE PAS À ${attendu} — NE PAS IMPRIMER.`);
process.exitCode = bon ? 0 : 1;
