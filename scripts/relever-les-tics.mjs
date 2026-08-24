// Relève les tics d'écriture du site.
//
// « Le texte est abrupt, sans essence, peu rigoureux, peu académique, peu
// raisonné. » Le diagnostic est juste, et il est mesurable : les passes
// d'épuration ont récompensé la phrase courte et assertive, ce qui a coupé
// les articulations qui font qu'un texte raisonne.
//
// Le relevé cherche quatre signatures, dans cet ordre d'importance :
//
//   FRAGMENT      une phrase sans verbe conjugué : « Une photographie. »,
//                 « Un film. », « C'est la porte d'entrée. » On l'emploie
//                 pour frapper ; elle ne démontre rien.
//   CHUTE         un paragraphe qui se termine sur une phrase de moins de
//                 huit mots. C'est la signature de l'aphorisme : le texte
//                 conclut au lieu de conclure quelque chose.
//   ANTITHESE     le balancement « X ; ce qui… » ou « X ; c'est… », employé
//                 partout comme figure de raisonnement alors qu'il n'en est
//                 que la forme.
//   SANS LIEN     un paragraphe de trois phrases ou plus sans un seul mot de
//                 liaison — donc une juxtaposition, pas une déduction.
//
//   node scripts/relever-les-tics.mjs
//   node scripts/relever-les-tics.mjs --detail
//   node scripts/relever-les-tics.mjs --detail chute
import { readFileSync } from 'node:fs';

// Le texte du site n'est pas tout entier dans App.jsx : les 79 dossiers de
// l'Observatoire des narratifs vivent dans narrativesData.js, et les libellés
// de source dans les fichiers de données. « Partout » veut dire partout.
const FICHIERS = ['src/App.jsx', 'src/narrativesData.js',
                  'src/data/library.js', 'src/data/mondeData.js'];
const src = FICHIERS
  .map((f) => { try { return readFileSync(f, 'utf8'); } catch { return ''; } })
  .join('\n')
  .replace(/\r\n/g, '\n');
const detail = process.argv.includes('--detail');
const seul = process.argv.find((a) => /^(fragment|chute|antithese|lien)$/.test(a));

// --- Le corpus : les chaînes françaises visibles, alinéa par alinéa --------
const paras = [];
const pousser = (brut) => {
  if (!brut) return;
  for (const t of brut.replace(/\\n/g, '\n').split(/\n\s*\n/)) {
    const p = t.trim()
      .replace(/\\'/g, "'").replace(/\\"/g, '"')
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    if (p.length < 90 || /^https?:/.test(p)) continue;
    paras.push(p);
  }
};
for (const m of src.matchAll(/\bfr:\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
for (const m of src.matchAll(/\bL\(\s*"((?:[^"\\]|\\.)*)"/g)) pousser(m[1]);
// Le glossaire est écarté : une définition EST brève et nominale, c'est son
// genre. Lui reprocher de ne pas raisonner n'aurait pas de sens, et sa centaine
// d'entrées noierait la prose qu'on cherche vraiment à reprendre.
const definitions = new Set();
{
  const d = src.indexOf('const PLAIN_TERMS = {');
  if (d >= 0) {
    const bloc = src.slice(d, src.indexOf('\n};', d));
    for (const m of bloc.matchAll(/\n\s*fr: "((?:[^"\\]|\\.)*)"/g)) {
      definitions.add(m[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim());
    }
  }
}
// Et l'on ne pèse que la PROSE : en deçà de cent quarante signes, c'est un
// libellé, une légende ou une entrée de tableau, pas un paragraphe.
const corpus = [...new Set(paras)].filter((p) => p.length >= 140 && !definitions.has(p));

// --- Découpage en phrases --------------------------------------------------
// Les abréviations et les nombres décimaux ne terminent pas une phrase.
const phrasesDe = (p) => p
  .replace(/(\b(?:M|Mme|MM|art|no|n°|p|cf|éd|vol|env|ca|etc|ibid|op|réf|ill)\.)/gi, '$1')
  .replace(/(\d)\.(\d)/g, '$1$2')
  .split(/(?<=[.!?…])\s+(?=[«"'A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸŒ0-9])/)
  .map((s) => s.replace(//g, '.').trim())
  .filter(Boolean);

const mots = (s) => (s.match(/[\p{L}’'-]+/gu) || []).length;

// Un verbe conjugué : on cherche les formes fréquentes et les terminaisons
// verbales usuelles. Approximation assumée — elle suffit à trouver les
// fragments nominaux, qui n'en contiennent aucune.
const VERBES = /\b(est|sont|était|étaient|sera|seront|a|ont|avait|avaient|aura|auront|fait|font|faisait|peut|peuvent|pouvait|doit|doivent|devait|va|vont|reste|restent|restait|vaut|valent|valait|tient|tiennent|tenait|suit|suivent|donne|donnent|porte|portent|compte|comptent|mesure|mesurent|montre|montrent|dit|disent|disait|s'agit|y a|il y|se lit|se fait|existe|existent|manque|manquent|change|changent|passe|passent|vient|viennent|s'ouvre|figure|figurent|couvre|couvrent|répond|répondent|permet|permettent|produit|produisent|décide|décident|sert|servent|dépend|dépendent|reconnaît|reconnaissent|exige|exigent|gèle|gèlent|tombe|tombent|illustre|illustrent|date|datent|opère|opèrent|vise|visent|ancre|ancrent|agit|agissent|chasse|chassent|relève|relèvent|siège|siègent|s'applique|s'appliquent|s'agit|compte|comptent|rassemble|rassemblent|réunit|réunissent|traite|traitent|suppose|supposent|concerne|concernent|comprend|comprennent|contient|contiennent|repose|reposent)\b|\b\p{L}{3,}(?:ait|aient|ent|ons|ez|era|eront|erait|ait|ent|it|issent|issait)\b/iu;

const LIENS = /\b(mais|or|donc|car|dès lors|ainsi|cependant|toutefois|néanmoins|pourtant|puisque|parce que|si bien que|de sorte que|alors que|tandis que|en revanche|à l'inverse|au contraire|en effet|c'est pourquoi|d'où|autrement dit|non seulement|d'abord|ensuite|enfin|par ailleurs|en outre|quand|lorsque|bien que|même si|sauf|hormis|à mesure que|dans la mesure où)\b/i;

const releve = { fragment: [], chute: [], antithese: [], lien: [] };

for (const p of corpus) {
  const ph = phrasesDe(p);
  if (!ph.length) continue;

  for (const s of ph) {
    const n = mots(s);
    if (n >= 2 && n <= 9 && !VERBES.test(s) && !/^[«"]/.test(s) && !/:$/.test(s)) {
      releve.fragment.push({ ou: s, p });
    }
  }

  const der = ph[ph.length - 1];
  if (ph.length >= 2 && mots(der) <= 7) releve.chute.push({ ou: der, p });

  if (/;\s*(ce qui|c'est|ce qu|il|elle)\b/i.test(p)) {
    releve.antithese.push({ ou: (p.match(/[^.;]{0,42};\s*(?:ce qui|c'est|ce qu|il|elle)[^.]{0,42}/i) || [p])[0], p });
  }

  if (ph.length >= 3 && !LIENS.test(p)) releve.lien.push({ ou: ph[0].slice(0, 70), p });
}

const NOMS = {
  fragment: 'FRAGMENTS sans verbe — la phrase qui frappe au lieu de démontrer',
  chute: 'CHUTES courtes — le paragraphe qui finit sur un aphorisme',
  antithese: 'ANTITHÈSES « X ; ce qui… » — la forme du raisonnement sans le raisonnement',
  lien: 'SANS LIAISON — trois phrases ou plus juxtaposées, aucune articulation',
};

console.log('paragraphes examinés : ' + corpus.length + '\n');
for (const [cle, liste] of Object.entries(releve)) {
  if (seul && cle !== seul) continue;
  console.log(NOMS[cle] + ' : ' + liste.length);
  if (detail) {
    for (const x of liste.slice(0, seul ? 60 : 8)) {
      console.log('   · ' + x.ou.slice(0, 96));
      if (seul) console.log('     …dans : ' + x.p.slice(0, 150) + (x.p.length > 150 ? '…' : '') + '\n');
    }
  }
  console.log();
}
const total = Object.values(releve).reduce((n, l) => n + l.length, 0);
console.log('total des signalements : ' + total);
