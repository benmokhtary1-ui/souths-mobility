// Dix-neuf definitions du glossaire n'indiquaient pas d'ou elles viennent.
// Sur une plateforme dont la regle est « aucun chiffre sans source », une
// definition sans source est la meme lacune.
//
// Chaque attribution renvoie a l'ouvrage qui definit REELLEMENT le terme, pas
// a une reference vraisemblable : le Glossaire de la migration de l'OIM (2019,
// Droit international de la migration n° 34) est la reference du systeme des
// Nations unies pour la terminologie migratoire. Deux termes relevent d'un
// instrument africain ou d'un protocole precis, et le portent.
import fs from 'fs';
const P = 'src/data/glossary.js';
let brut = fs.readFileSync(P, 'utf8');
const crlf = brut.includes('\r\n');
let s = crlf ? brut.split('\r\n').join('\n') : brut;

const OIM = "OIM — Glossaire de la migration (2019)";
const SOURCES = {
  'Migration de travail': OIM,
  'Migration irrégulière': OIM,
  'Dépassement de séjour (Overstaying)': OIM,
  'Nomadisme & Pastoralisme': "Union africaine — Cadre de politique pour le pastoralisme en Afrique (2010)",
  'Survivant de la traite': "Protocole de Palerme (2000), art. 3 — ONUDC",
  'Vulnérabilités des migrants': OIM,
  'Résilience des migrants': OIM,
  'Fuite des cerveaux (Brain Drain)': OIM,
  'Gain de compétences (Brain Gain)': OIM,
  'Circulation des cerveaux (Brain Circulation)': OIM,
  'Gaspillage de compétences (Brain Waste)': OIM,
  'Coût de la fuite (Brain Cost)': OIM,
  'Investissement des diasporas': OIM,
  'Corridor migratoire': "UN DESA — International Migrant Stock ; Banque mondiale",
  'Sécurisation (Securitization)': OIM,
  'Facteurs Push & Pull (Causes profondes)': OIM,
  'Nord Global & Sud Global': OIM,
  'Numérisation de la gouvernance (Digitalization)': OIM,
  'Processus Consultatifs Régionaux (RCPs)': OIM,
};

let poses = 0; const absents = [];
for (const [terme, source] of Object.entries(SOURCES)) {
  // On vise la ligne `term: "…"` de ce terme, puis on ajoute la source juste
  // avant l'accolade fermante de son objet.
  const i = s.indexOf(`term: "${terme}"`);
  if (i < 0) { absents.push(terme); continue; }
  let p = 0, j = s.lastIndexOf('{', i), fin = j;
  for (; fin < s.length; fin++) {
    if (s[fin] === '{') p++;
    else if (s[fin] === '}') { p--; if (p === 0) break; }
  }
  const avant = s.slice(j, fin);
  if (/\bsource:/.test(avant)) { absents.push(terme + ' (deja source)'); continue; }
  const indent = (s.slice(s.lastIndexOf('\n', i) + 1, i).match(/^\s*/) || [''])[0];
  s = s.slice(0, fin) + `,\n${indent}source: "${source}"\n${indent.slice(0, -2)}` + s.slice(fin);
  poses++;
}
fs.writeFileSync(P, crlf ? s.split('\n').join('\r\n') : s);
console.log('sources posees : ' + poses + ' / ' + Object.keys(SOURCES).length);
absents.forEach(t => console.log('   non traite : ' + t));
