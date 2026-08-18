// Retire les espaces fines insecables (U+202F) posees dans le CODE.
//
// La passe de typographie francaise a traite le fichier comme de la prose : elle
// a colle une fine devant chaque « ? » et chaque « : », y compris ceux des
// operateurs ternaires et des cles d'objet. Le resultat compile — depuis ES2015
// tout caractere de categorie Zs est un blanc valide — mais un caractere
// invisible dans un operateur piege la relecture, les diffs et les recherches.
//
// On ne peut pas trancher au motif : « mot<fine>? » est fautif dans du code et
// juste dans une phrase francaise. Il faut donc savoir ou l'on se trouve. Ce
// script parcourt le fichier caractere par caractere en suivant l'etat : chaine
// simple, chaine double, gabarit, substitution dans un gabarit, commentaire de
// ligne, commentaire de bloc, expression reguliere. La fine ne tombe qu'en code.
//
//   node scripts/degager-fines-du-code.mjs src/App.jsx
//   node scripts/degager-fines-du-code.mjs src/App.jsx --ecrire
import { readFileSync, writeFileSync } from 'node:fs';

const FINE = ' ';
const ANTISLASH = String.fromCharCode(92);

const fichier = process.argv[2];
const ecrire = process.argv.includes('--ecrire');
if (!fichier) {
  console.error('usage: node scripts/degager-fines-du-code.mjs <fichier> [--ecrire]');
  process.exit(2);
}

const src = readFileSync(fichier, 'utf8');
const out = [];
let i = 0, retirees = 0, gardees = 0;

// Une pile plutot qu'un drapeau : un gabarit peut contenir une substitution qui
// contient elle-meme un autre gabarit.
const pile = [];
const dedans = () => pile[pile.length - 1] || 'code';

// Un « / » ouvre une expression reguliere ou divise. On tranche sur le dernier
// caractere significatif : apres une valeur, c'est une division.
const derniereValeur = () => {
  for (let k = out.length - 1; k >= 0; k--) {
    const c = out[k];
    if (/\s/.test(c)) continue;
    return /[)\]}A-Za-z0-9_$]/.test(c);
  }
  return false;
};

while (i < src.length) {
  const c = src[i], d = src[i + 1];
  const ou = dedans();

  if (ou === 'code' || ou === 'gabarit-code') {
    if (c === '/' && d === '/') { pile.push('ligne'); out.push(c, d); i += 2; continue; }
    if (c === '/' && d === '*') { pile.push('bloc'); out.push(c, d); i += 2; continue; }
    if (c === '/' && !derniereValeur()) { pile.push('regex'); out.push(c); i++; continue; }
    if (c === "'") { pile.push('simple'); out.push(c); i++; continue; }
    if (c === '"') { pile.push('double'); out.push(c); i++; continue; }
    if (c === '`') { pile.push('gabarit'); out.push(c); i++; continue; }
    if (c === '}' && ou === 'gabarit-code') { pile.pop(); out.push(c); i++; continue; }
    if (c === FINE) { retirees++; out.push(' '); i++; continue; }
    out.push(c); i++; continue;
  }

  // Un commentaire est de la prose, pas du code. Ceux de ce depot sont ecrits en
  // francais et soignes — leurs guillemets portent legitimement une fine. Le
  // premier jet du script les nettoyait aussi : il abimait 45 lignes de prose
  // pour rien.
  if (ou === 'ligne') {
    if (c === '\n') { pile.pop(); out.push(c); i++; continue; }
    if (c === FINE) gardees++;
    out.push(c); i++; continue;
  }
  if (ou === 'bloc') {
    if (c === '*' && d === '/') { pile.pop(); out.push(c, d); i += 2; continue; }
    if (c === FINE) gardees++;
    out.push(c); i++; continue;
  }
  if (ou === 'regex') {
    if (c === ANTISLASH) { out.push(c, d); i += 2; continue; }
    if (c === '/' || c === '\n') { pile.pop(); out.push(c); i++; continue; }
    out.push(c); i++; continue;
  }

  // Dans une chaine, la fine est de la typographie francaise : on n'y touche pas.
  if (ou === 'simple' || ou === 'double') {
    const guillemet = ou === 'simple' ? "'" : '"';
    if (c === ANTISLASH) { out.push(c, d); i += 2; continue; }
    if (c === guillemet) { pile.pop(); out.push(c); i++; continue; }
    if (c === FINE) gardees++;
    out.push(c); i++; continue;
  }
  if (ou === 'gabarit') {
    if (c === ANTISLASH) { out.push(c, d); i += 2; continue; }
    if (c === '`') { pile.pop(); out.push(c); i++; continue; }
    if (c === '$' && d === '{') { pile.push('gabarit-code'); out.push(c, d); i += 2; continue; }
    if (c === FINE) gardees++;
    out.push(c); i++; continue;
  }

  out.push(c); i++;
}

const res = out.join('');
console.log('fines retirees du code  :', retirees);
console.log('fines gardees en chaine :', gardees);
console.log('pile en fin de parcours :', pile.length === 0 ? 'vide (parcours coherent)' : pile.join(' > '));

if (ecrire) {
  if (pile.length) { console.error('parcours incoherent : rien ecrit'); process.exit(1); }
  writeFileSync(fichier, res, 'utf8');
  console.log('ecrit.');
}
