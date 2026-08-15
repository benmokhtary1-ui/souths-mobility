// Fusion des fiches 045 et 058 : la meme affirmation, posee deux fois.
//
// Extraction par lignes plutot que par expression reguliere : les valeurs
// s'etendent sur plusieurs lignes, et un motif multiligne echouait en silence
// — il avait supprime la 058 sans recopier son contenu, c'est-a-dire perdu
// exactement ce qu'on voulait garder.
import fs from 'fs';
const P = 'src/narrativesData.js';
let brut = fs.readFileSync(P, 'utf8');
const crlf = brut.includes('\r\n');
const lignes = (crlf ? brut.split('\r\n').join('\n') : brut).split('\n');

// Bornes d'une fiche : de son accolade ouvrante a l'accolade appariee.
const bornes = (id) => {
  const i = lignes.findIndex(l => l.includes(`id: "${id}"`));
  if (i < 0) return null;
  let debut = i; while (debut > 0 && !/^\s*\{\s*$/.test(lignes[debut])) debut--;
  let p = 0, fin = debut;
  for (; fin < lignes.length; fin++) {
    for (const c of lignes[fin]) { if (c === '{') p++; else if (c === '}') p--; }
    if (p === 0 && fin > debut) break;
  }
  return { debut, fin };
};

// Les champs de premier rang d'une fiche, avec leurs lignes.
const champs = (b) => {
  const out = {};
  let courant = null;
  for (let k = b.debut + 1; k < b.fin; k++) {
    const m = lignes[k].match(/^    (\w+):/);
    if (m) { courant = m[1]; out[courant] = [k, k]; }
    else if (courant) out[courant][1] = k;
  }
  return out;
};

const b45 = bornes('045'), b58 = bornes('058');
if (!b45 || !b58) { console.log('fiche introuvable'); process.exit(1); }
const c45 = champs(b45), c58 = champs(b58);

// Le corps le mieux etaye passe de la 058 a la 045 ; l'identite, la categorie
// et l'icone restent celles de la 045, qui est deja dans la bonne rubrique.
const A_REPRENDRE = ['narrative', 'reality', 'limits', 'indicators', 'sources', 'why_persists', 'confidence_level', 'verdict'];
const nouvelles = [...lignes];
let repris = 0;
for (const champ of A_REPRENDRE) {
  if (!c45[champ] || !c58[champ]) { console.log('  champ absent : ' + champ); continue; }
  const src = lignes.slice(c58[champ][0], c58[champ][1] + 1);
  nouvelles[c45[champ][0]] = '\u0000' + src.join('\n');       // marqueur : bloc a poser
  for (let k = c45[champ][0] + 1; k <= c45[champ][1]; k++) nouvelles[k] = '\u0001';  // a effacer
  repris++;
}
// La 058 disparait.
for (let k = b58.debut; k <= b58.fin; k++) nouvelles[k] = '\u0001';

let out = nouvelles.filter(l => l !== '\u0001').join('\n').split('\u0000').join('');
// L'affirmation retenue : la plus nette, augmentee de la precision de la 058.
out = out.replace('Chaque migration est soit purement volontaire, soit purement forcée.',
  'Chaque migration est soit purement volontaire, soit purement forcée : les deux catégories ne se recoupent jamais.');
fs.writeFileSync(P, crlf ? out.split('\n').join('\r\n') : out);
console.log('champs repris : ' + repris + ' / ' + A_REPRENDRE.length);
