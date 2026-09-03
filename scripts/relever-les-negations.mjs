// LA TOURNURE « CE N'EST PAS X, C'EST Y », ET SES VARIANTES
// ===========================================================================
// Demande explicite : cette construction est à proscrire complètement. Elle
// définit par ce que la chose n'est pas, oblige le lecteur à tenir en mémoire
// une proposition fausse avant de recevoir la vraie, et donne au texte un ton
// défensif — comme s'il répondait à une accusation que personne n'a portée.
//
// `auditer-prose` en comptait quinze sur une liste fermée de formules. Celui-ci
// cherche la STRUCTURE, dans les six fichiers de contenu, avec ses variantes :
//
//   ce n'est pas X, c'est Y      ·  ce ne sont pas X, ce sont Y
//   X n'est pas Y mais Z         ·  il ne s'agit pas de X mais de Y
//   non pas X mais Y             ·  moins X que Y
//   loin d'être X, ...           ·  X n'est pas Y : c'est Z
//
// Le rapport donne le fichier, la ligne et la phrase entière, parce qu'une
// réécriture affirmative ne se fait pas au motif : il faut savoir ce que la
// phrase veut dire avant de le dire autrement.
//
//   node scripts/relever-les-negations.mjs
import { readFileSync } from 'node:fs';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/data/countries.js',
                  'src/data/glossary.js', 'src/data/library.js', 'src/data/mondeData.js'];

// La négation contrastive : une négation suivie, dans la même phrase, d'une
// reprise affirmative — « mais », « c'est », « il s'agit », « plutôt ».
const MOTIFS = [
  [/\b(?:ce\s+)?n[e’']\s*(?:est|sont|s[’']agit|a|ont)\s+pas\b[^.!?]{0,120}?[,:;]\s*(?:c[’']est|ce sont|il s[’']agit|mais)\b/gi, 'négation puis reprise'],
  [/\bn[e’']\s*(?:est|sont)\s+pas\b[^.!?]{0,90}?\bmais\b/gi, 'n’est pas … mais'],
  [/\bil\s+ne\s+s[’']agit\s+pas\b[^.!?]{0,90}?\b(?:mais|c[’']est)\b/gi, 'il ne s’agit pas … mais'],
  [/\bnon\s+pas\b[^.!?]{0,90}?\bmais\b/gi, 'non pas … mais'],
  [/\bloin\s+d[’']être\b/gi, 'loin d’être'],
  [/\bmoins\s+[^.!?]{2,40}?\s+que\s+(?:de\s+)?(?:l[ae’]|un[e]?|ce)\b/gi, 'moins X que Y'],
];

// `--toutes` : plus large que la structure contrastive — TOUTE phrase publiée
// qui se définit par une négation. La demande porte sur la tournure « ce n'est
// pas X, c'est Y », mais une définition négative sans reprise pose le même
// problème de lecture, en plus discret.
const TOUTES = process.argv.includes('--toutes');
const NEGATION = /\bn[e’']\s*(?:est|sont|s[’']agit)\s+pas\b/i;

let total = 0;
for (const rel of FICHIERS) {
  let src;
  try { src = readFileSync(rel, 'utf8'); } catch { continue; }
  const lignes = src.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lignes.length; i++) {
    const ligne = lignes[i];
    if (/^\s*(\/\/|\*)/.test(ligne)) continue;           // commentaire de code
    for (const m of [...ligne.matchAll(/"((?:[^"\\]|\\.){40,})"/g), ...ligne.matchAll(/'((?:[^'\\]|\\.){40,})'/g)]) {
      const t = m[1].replace(/\\n/g, ' ');
      if (/[<>{}]/.test(t) || /^https?:/.test(t)) continue;
      if (!/[àâçéèêëîïôûùüœ]/i.test(t)) continue;        // français seulement

      if (TOUTES) {
        for (const phrase of t.split(/(?<=[.!?])\s+/)) {
          if (!NEGATION.test(phrase)) continue;
          console.log(`${rel}:${i + 1}`);
          console.log(`   ${phrase.trim()}\n`);
          total += 1;
        }
        continue;
      }

      for (const [re, nom] of MOTIFS) {
        re.lastIndex = 0;
        const trouve = t.match(re);
        if (!trouve) continue;
        // La phrase entière qui porte la tournure.
        for (const bout of trouve) {
          const p = t.indexOf(bout);
          const avant = t.lastIndexOf('.', p) + 1;
          let apres = t.indexOf('.', p + bout.length);
          if (apres < 0) apres = t.length;
          console.log(`${rel}:${i + 1}  [${nom}]`);
          console.log(`   ${t.slice(avant, apres + 1).trim()}\n`);
          total += 1;
        }
        break;   // un motif par chaîne suffit à la signaler
      }
    }
  }
}
console.log(`${total} tournure(s) relevée(s).`);
