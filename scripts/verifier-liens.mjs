// Verification des liens sortants.
//
// Une bibliotheque de recherche vit de ses liens. Un lien mort n'a pas l'air
// d'un defaut — la page s'affiche, la reference est la — mais il coute au
// lecteur le seul geste que la reference promet.
//
// Deux precautions, apprises en le faisant a la main :
//
//   — Un 403 n'est presque jamais un lien mort. Les DOI, Cloudflare et les
//     portails institutionnels refusent les agents automatiques ; la page
//     s'ouvre parfaitement dans un navigateur. On les classe a part plutot que
//     de les signaler, sinon le rapport crie au loup quinze fois.
//   — Un 000 non plus. C'est un echec de connexion, souvent un blocage ou un
//     delai depasse, parfois un domaine mort. On le signale, en le disant.
//
// Usage : node scripts/verifier-liens.mjs [--tout]
//         --tout inclut les 302 et les 403 dans le detail.
import fs from 'fs';

const FICHIERS = ['src/App.jsx', 'src/narrativesData.js', 'src/censusData.js',
                  'src/data/library.js', 'src/data/glossary.js', 'src/data/countries.js',
                  'src/data/methodConventions.js'];

const urls = new Set();
for (const f of FICHIERS) {
  if (!fs.existsSync(f)) continue;
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/https?:\/\/[^\s"'`)\\]+/g)) {
    urls.add(m[0].replace(/[.,;:]+$/, ''));
  }
}
const liste = [...urls].sort();
console.log(liste.length + ' URL distinctes\n');

const AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const verifier = async (u) => {
  const stop = AbortSignal.timeout(20000);
  try {
    // HEAD d'abord : beaucoup de serveurs le servent sans envoyer le corps.
    // Mais beaucoup le gerent mal — NORMLEX, une application Oracle APEX,
    // repond 404 a un HEAD sur une adresse qui s'ouvre parfaitement. Tout
    // echec en HEAD est donc reessaye en GET avant d'etre retenu.
    let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: stop, headers: { 'User-Agent': AGENT } });
    if (r.status >= 400) {
      r = await fetch(u, { method: 'GET', redirect: 'follow', signal: stop, headers: { 'User-Agent': AGENT } });
    }
    return r.status;
  } catch { return 0; }
};

// Par petits paquets : on interroge des serveurs publics, pas les siens.
const PAQUET = 6;
const resultats = [];
for (let i = 0; i < liste.length; i += PAQUET) {
  const lot = liste.slice(i, i + PAQUET);
  const codes = await Promise.all(lot.map(verifier));
  lot.forEach((u, k) => resultats.push({ u, code: codes[k] }));
  process.stdout.write('  ' + Math.min(i + PAQUET, liste.length) + '/' + liste.length + '\r');
}
console.log(' '.repeat(30) + '\r');

const tout = process.argv.includes('--tout');
// 403 : refus classique aux agents automatiques. 999 : le code que LinkedIn
// renvoie a tout ce qui n'est pas un navigateur — il n'existe pas ailleurs.
const robot   = (c) => c === 403 || c === 999;
const morts   = resultats.filter(r => r.code >= 400 && !robot(r.code));
const refuses = resultats.filter(r => robot(r.code));
const injoignables = resultats.filter(r => r.code === 0);
const ok = resultats.length - morts.length - refuses.length - injoignables.length;

console.log('=== Liens sortants ===');
console.log('  atteignables            : ' + ok);
console.log('  refuses aux robots (403): ' + refuses.length + '  — s\'ouvrent dans un navigateur');
console.log('  injoignables (000)      : ' + injoignables.length);
console.log('  morts (4xx/5xx)         : ' + morts.length);

if (morts.length) { console.log('\nMORTS :'); morts.forEach(r => console.log('  ' + r.code + '  ' + r.u)); }
if (injoignables.length) { console.log('\nINJOIGNABLES :'); injoignables.forEach(r => console.log('  ---  ' + r.u)); }
if (tout && refuses.length) { console.log('\nREFUSES AUX ROBOTS :'); refuses.forEach(r => console.log('  403  ' + r.u)); }

process.exitCode = morts.length ? 1 : 0;
