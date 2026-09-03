// Audit du lexique.
//
// Un hub de recherche se juge sur ses mots autant que sur ses chiffres. Trois
// choses se verifient par machine, et une seule d'entre elles est evidente.
//
// 1. LES ANGLICISMES SUPERFLUS. Certains sont voulus et portent le nom du site
//    ou d'une rubrique — African Mobility Hub, Evidence Check, Knowledge Hub. Les autres
//    sont des glissements : « monitorer » pour suivre, « impacter » pour
//    affecter, « reporting » pour compte rendu. La liste distingue les deux.
//
// 2. L'HOMOGENEITE. Le vrai risque n'est pas le mot fautif mais le mot flottant :
//    « refugie » ici, « personne refugiee » la ; « migrant » et « personne
//    migrante » dans la meme page. Le script compte les variantes de chaque
//    famille et signale celles qui coexistent, sans trancher a la place de
//    l'auteur — c'est un rapport, pas un correcteur.
//
// 3. LA NEUTRALITE. Le vocabulaire de la migration charrie des metaphores qui
//    ne sont pas neutres : flux, vague, afflux, crise, clandestin, illegal.
//    Certaines sont admises dans un usage technique precis — « flux migratoires »
//    est un terme de demographie —, d'autres sont a proscrire. Les secondes sont
//    signalees comme erreurs, les premieres comme points de vigilance.
//
// La regle de fond du site s'applique ici comme ailleurs : les definitions
// africaines priment sur les definitions onusiennes.
//
//   node scripts/auditer-lexique.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const RACINE = 'src';
const EXT = new Set(['.js', '.jsx', '.mjs']);

// ---- ce qu'on cherche ------------------------------------------------------

// Anglicismes voulus : ils nomment le site ou une rubrique, on les laisse.
const VOULUS = [
  'African Mobility Hub', 'Evidence Check', 'Knowledge Hub', 'Knowledge & Data',
  'Global Overview of Migration Routes', 'Free Movement Protocol', 'Data', 'Atlas',
];

// Anglicismes a remplacer : le mot, puis ce qu'il faudrait dire.
const ANGLICISMES = [
  [/\bmonitor(er|ing|é|ee|ée)\b/gi,        'suivre, suivi'],
  [/\bimpact(er|é|ée|ant)\b/gi,            'affecter, peser sur'],
  [/\breporting\b/gi,                      'compte rendu, notification'],
  [/\bdatas\b/gi,                          'données (jamais de s à data)'],
  [/\bimplémenter\b/gi,                    'mettre en œuvre'],
  [/\binitier\b(?! une procédure)/gi,      'lancer, engager, amorcer'],
  [/\bsupporter\b(?! le poids)/gi,         'prendre en charge, admettre'],
  [/\badresser (le|la|les|un|une) (problème|question|enjeu|défi)/gi, 'traiter, aborder'],
  [/\bopportunité de\b/gi,                 'occasion de'],
  [/\bdévelopper une (approche|méthode)\b/gi, 'élaborer'],
  [/\bbasé sur\b/gi,                       'fondé sur, à partir de'],
  [/\ben charge de\b/gi,                   'chargé de'],
  [/\bau final\b/gi,                       'en fin de compte, finalement'],
  [/\bversus\b/gi,                         'contre, face à'],
];

// Metaphores non neutres. Deux niveaux : a proscrire, ou a surveiller.
const PROSCRITS = [
  [/\b(migrants?|personnes?) (clandestins?|illégaux?|illégales?)\b/gi,
   'en situation irrégulière — un statut administratif, pas une qualité de la personne'],
  [/\bclandestins?\b/gi, 'en situation irrégulière'],
  [/\bimmigration (massive|sauvage)\b/gi, 'à reformuler : le qualificatif porte un jugement'],
  [/\b(vague|déferlante|marée|invasion) (migratoire|de migrants)\b/gi,
   'métaphore submersive — dire le nombre, pas la crue'],
  [/\bafflux massif\b/gi, 'arrivées nombreuses, et donner le chiffre'],
];
const VIGILANCE = [
  [/\bflux migratoires?\b/gi, 'admis en démographie ; vérifier qu’il ne remplace pas un chiffre'],
  [/\bcrise migratoire\b/gi,  'nommer la crise : d’accueil, de gouvernance, de protection'],
  [/\bpression migratoire\b/gi, 'terme de discours politique, rarement descriptif'],
  [/\bpays d’accueil\b/gi,    'vérifier la symétrie avec « pays de départ »'],
];

// Familles ou plusieurs formes coexistent : on les compte, on ne tranche pas.
const FAMILLES = [
  ['réfugié',     [/\bréfugiés?\b/gi, /\bpersonnes? réfugiées?\b/gi]],
  ['migrant',     [/\bmigrants?\b/gi, /\bpersonnes? migrantes?\b/gi]],
  ['déplacé',     [/\bdéplacés? internes?\b/gi, /\bpersonnes? déplacées? internes?\b/gi, /\bPDI\b/g]],
  // « mobilités humaines » et « mobilités africaines » sont deux notions, pas
  // deux graphies : les surveiller produisait une fausse alerte a chaque passage.
  ['libre circ.', [/\blibre circulation\b/gi, /\blibre-circulation\b/gi, /\bfree movement\b/gi]],
  // L'alternance entre un nom et son sigle est l'usage normal ; seule la casse
  // du nom developpe merite d'etre surveillee.
  ['UA',          [/Union africaine/g, /Union Africaine/g]],
  ['diaspora',    [/\bdiasporas?\b/gi, /\bcommunautés? de la diaspora\b/gi]],
];

// ---- lecture ---------------------------------------------------------------

const fichiers = [];
(function marcher(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) marcher(p);
    else if (EXT.has(extname(p))) fichiers.push(p);
  }
})(RACINE);

// On ne lit que les chaines francaises, jamais le code : un identifiant
// `handleImpact` n'est pas un anglicisme de prose.
const CHAINE = /(['"`])((?:\\.|(?!\1)[^\\])*?)\1/g;
const ACCENT = /[àâäéèêëîïôöùûüçœ]/i;

const extraits = [];
for (const f of fichiers) {
  const src = readFileSync(f, 'utf8');
  const lignes = src.split(/\r?\n/);
  lignes.forEach((ligne, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) return;          // les commentaires ne comptent pas
    let m;
    CHAINE.lastIndex = 0;
    while ((m = CHAINE.exec(ligne))) {
      const t = m[2];
      if (t.length < 12 || !ACCENT.test(t)) continue;       // heuristique : de la prose francaise
      // Une citation ne se corrige pas. Le premier passage signalait un « basé
      // sur » qui appartenait au texte officiel de l'Aspiration N°2 de
      // l'Agenda 2063 : le releve avait raison sur la langue et tort sur
      // l'objet. Les chaines encadrees de guillemets francais, et celles qui
      // portent un nom de champ de citation, sortent du corpus.
      if (/^\s*«/.test(t) && /»\s*$/.test(t)) continue;
      if (/^\s*(textFr|textEn|citation|quote)\s*:/.test(ligne.trim())) continue;
      extraits.push({ f, n: i + 1, t });
    }
  });
}

const corpus = extraits.map(e => e.t).join('\n');

// ---- rapport ---------------------------------------------------------------

const trouver = (regles) => regles.map(([re, dire]) => {
  const cas = [];
  for (const e of extraits) {
    const m = e.t.match(re);
    if (m) cas.push({ f: e.f, n: e.n, mot: m[0], t: e.t.slice(0, 88) });
  }
  return { re, dire, cas };
}).filter(r => r.cas.length);

const bloc = (titre, resultats) => {
  console.log('\n=== ' + titre + ' ===');
  if (!resultats.length) { console.log('  rien a signaler'); return 0; }
  let n = 0;
  for (const r of resultats) {
    console.log('  ' + r.cas[0].mot + '  (' + r.cas.length + ')  ->  ' + r.dire);
    r.cas.slice(0, 3).forEach(c => console.log('     ' + c.f + ':' + c.n + '  ' + c.t));
    n += r.cas.length;
  }
  return n;
};

console.log('chaines francaises examinees : ' + extraits.length);
const nProscrits = bloc('Metaphores a proscrire', trouver(PROSCRITS));
const nAnglic = bloc('Anglicismes superflus', trouver(ANGLICISMES));
const nVigil = bloc('Points de vigilance', trouver(VIGILANCE));

console.log('\n=== Homogeneite des denominations ===');
let nFlottant = 0;
for (const [nom, formes] of FAMILLES) {
  const comptes = formes.map(re => (corpus.match(re) || []).length);
  const vues = comptes.filter(c => c > 0).length;
  if (vues > 1) {
    nFlottant++;
    console.log('  ' + nom.padEnd(12) + comptes.map((c, i) => formes[i].source.replace(/\\b|\(\?:|\)/g, '') + ' ' + c).join('   |   '));
  }
}
if (!nFlottant) console.log('  chaque famille tient une seule forme');

console.log('\n----------------------------------------------------------------');
console.log('a proscrire ' + nProscrits + '   anglicismes ' + nAnglic +
            '   vigilance ' + nVigil + '   familles flottantes ' + nFlottant);
process.exitCode = (nProscrits + nAnglic) > 0 ? 1 : 0;
