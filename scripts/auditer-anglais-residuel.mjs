// Traquer l'anglais residuel dans la version francaise.
//
// Le verificateur i18n dit si un texte est traduisible ; il ne dit pas si la
// traduction existe. Un dictionnaire { fr, en } dont la branche `fr` porte de
// l'anglais passe ses controles sans broncher — et c'est exactement ce qui
// arrive aux libelles d'interface, aux etats vides et aux messages d'erreur,
// ecrits en dernier et souvent en anglais.
//
// Trois reperes, du plus sur au plus incertain :
//   1. la branche fr est identique a la branche en, mot pour mot ;
//   2. la branche fr ne porte aucun signe diacritique ni mot-outil francais ;
//   3. elle contient un mot anglais courant qui n'est pas un emprunt admis.
//
// Les anglicismes voulus du site — African Mobility Hub, Evidence Check, Knowledge Hub — et
// les noms d'institutions ne comptent pas : ce sont des noms propres.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const ADMIS = new Set(['datahub', 'evidence', 'check', 'knowledge', 'hub', 'data', 'atlas',
  'south', 'mobility', 'global', 'report', 'trends', 'stock', 'gap', 'index', 'open',
  'brain', 'circulation', 'commons', 'un', 'desa', 'oim', 'iom', 'unhcr', 'idmc', 'ilo',
  'pdf', 'csv', 'api', 'web', 'internet', 'e', 'pluribus', 'unum']);

const MOTS_FR = /\b(le|la|les|un|une|des|du|de|et|ou|qui|que|dans|pour|sur|avec|par|aux|au|ce|cette|ses|son|leur|plus|moins|entre|selon|sans|est|sont|ne|pas)\b/i;
const DIACRITIQUE = /[àâäéèêëîïôöùûüçœ]/i;
const ANGLAIS = /\b(the|and|with|from|which|that|this|these|those|between|according|without|are|is|not|more|less|for|about|each|every|when|where|what|how|its|their|been|being|shows?|displays?|loading|search|filter|close|open|next|previous|see|view|all|none|error|failed|retry|select|choose)\b/i;

const fichiers = [];
(function marcher(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) marcher(p);
    else if (['.js', '.jsx'].includes(extname(p))) fichiers.push(p);
  }
})('src');

// On lit les paires { fr: "...", en: "..." } et les appels L('fr', 'en').
const PAIRE = /\bfr:\s*(['"`])((?:\.|(?!\1).)*?)\1\s*,\s*en:\s*(['"`])((?:\.|(?!\3).)*?)\3/g;
const APPEL = /\bL\(\s*(['"`])((?:\.|(?!\1).)*?)\1\s*,\s*(['"`])((?:\.|(?!\3).)*?)\3/g;

const identiques = [], sansFrancais = [], anglaisDansFr = [];
let paires = 0;

for (const f of fichiers) {
  const src = readFileSync(f, 'utf8');
  const lignes = src.split(/\r?\n/);
  lignes.forEach((ligne, i) => {
    if (/^\s*(\/\/|\*)/.test(ligne)) return;
    for (const re of [PAIRE, APPEL]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(ligne))) {
        const fr = m[2].trim(), en = m[4].trim();
        if (fr.length < 4) continue;
        paires++;
        const cas = { f, n: i + 1, fr: fr.slice(0, 62), en: en.slice(0, 40) };
        // un libelle court identique peut etre legitime : « Atlas », « CSV »
        const mots = fr.toLowerCase().split(/[^a-zà-ÿ]+/).filter(Boolean);
        const tousAdmis = mots.every(w => ADMIS.has(w));
        // On n'accuse que sur preuve positive d'anglais. La premiere version
        // signalait « ratification », « Cabo Verde », « Composition » : des mots
        // identiques dans les deux langues, ce qui est la norme et non un oubli,
        // et « score d'ancrage » etait pris pour de l'anglais faute d'accent.
        // Un auditeur qui crie 296 fois pour rien ne sera pas lu.
        if (!ANGLAIS.test(fr) || tousAdmis) continue;
        if (fr === en) identiques.push(cas);
        else if (!DIACRITIQUE.test(fr) && !MOTS_FR.test(fr)) sansFrancais.push(cas);
        else anglaisDansFr.push(cas);
      }
    }
  });
}

const bloc = (titre, l, quoi) => {
  console.log('\n=== ' + titre + ' (' + l.length + ') ===');
  if (!l.length) { console.log('  rien a signaler'); return; }
  console.log('  ' + quoi);
  l.slice(0, 8).forEach(c => console.log('   ' + c.f + ':' + c.n + '\n     fr « ' + c.fr + ' »\n     en « ' + c.en + ' »'));
  if (l.length > 8) console.log('   … et ' + (l.length - 8) + ' autres');
};

console.log('paires fr/en examinees : ' + paires);
bloc('Identique a l anglais, et anglais', identiques, 'le francais n a pas ete ecrit');
bloc('Anglais, sans aucun signe francais', sansFrancais, 'mot anglais et ni accent ni mot-outil');
bloc('Mot anglais courant dans la branche fr', anglaisDansFr, 'a verifier un par un');

const total = identiques.length + sansFrancais.length;
console.log('\n----------------------------------------------------------------');
console.log('surs ' + total + '   a verifier ' + anglaisDansFr.length);
process.exitCode = total > 0 ? 1 : 0;
