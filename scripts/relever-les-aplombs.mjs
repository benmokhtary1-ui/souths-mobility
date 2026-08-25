// LES PHRASES QUI EN DISENT PLUS QU'ELLES NE SAVENT
// ===========================================================================
// La consigne du site est d'être neutre et réaliste plutôt qu'avantageux : les
// formulations trop assurées décrédibilisent, y compris — surtout — quand elles
// défendent une cause juste. Une plateforme qui existe pour contrer des récits
// réducteurs ne peut pas se permettre d'en produire.
//
// Trois familles se repèrent en machine.
//
//   L'ABSOLU — « aucun », « jamais », « tous », « le seul », « unique au
//   monde ». Un absolu est réfutable par un seul contre-exemple : il faut
//   pouvoir le tenir, et le plus souvent on ne le peut pas.
//
//   LE SUPERLATIF NON ADOSSÉ — « le plus », « sans précédent », « historique »,
//   « majeur ». Légitime quand un classement le fonde, creux sinon.
//
//   LA CAUSE ASSÉNÉE — « prouve », « démontre », « s'explique par », « en
//   raison de ». Une corrélation observée ne prouve rien ; le site le dit
//   ailleurs, il doit se l'appliquer.
//
// LE SCRIPT NE CORRIGE RIEN et se trompe souvent : « le plus ancien protocole
// du continent » est un superlatif parfaitement établi. Il rassemble les
// endroits où la question se pose, pour qu'on les relise en connaissance de
// cause plutôt qu'au hasard.
//
//   node scripts/relever-les-aplombs.mjs
//   node scripts/relever-les-aplombs.mjs absolu|superlatif|cause
import { readFileSync, readdirSync } from 'node:fs';

const fichiers = [];
(function parcourir(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = `${d}/${e.name}`;
    if (e.isDirectory()) parcourir(p);
    else if (/\.(js|jsx)$/.test(e.name)) fichiers.push(p);
  }
})('src');

const dedire = (s) => s
  .replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\\'/g, "'")
  .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

// Seules les phrases FRANÇAISES, et seulement celles qui font une phrase : les
// libellés courts n'argumentent pas, ils nomment.
const phrases = [];
for (const f of fichiers) {
  let brut;
  try { brut = readFileSync(f, 'utf8').replace(/\r\n/g, '\n'); } catch { continue; }
  brut.split('\n').forEach((ligne, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) return;
    for (const m of ligne.matchAll(/["'`]((?:[^"'`\\]|\\.){60,})["'`]/g)) {
      const t = dedire(m[1]);
      if (!/[àâçéèêëîïôûùüÿœ]/.test(t)) continue;          // la version anglaise
      if (!/[.!?]/.test(t)) continue;
      phrases.push({ f: f.replace('src/', ''), i: i + 1, t });
    }
  });
}

const FAMILLES = {
  absolu: {
    titre: 'L’ABSOLU — réfutable par un seul contre-exemple',
    motifs: [
      /\baucun(?:e|s)?\b(?!\s+(?:interpolation|donnée n’|mesure n’|série n’))/gi,
      /\bjamais\b/gi, /\bnulle part\b/gi, /\btoujours\b/gi,
      /\bl[ae] seule?\b/gi, /\bunique au monde\b/gi, /\bsystématiquement\b/gi,
      /\bt(?:ous|outes) les (?:pays|États|migrants|Africains)\b/gi,
    ],
  },
  superlatif: {
    titre: 'LE SUPERLATIF — à fonder sur un classement, ou à retirer',
    motifs: [
      /\bsans précédent\b/gi, /\bhistorique(?:ment)?\b/gi,
      /\bmajeur(?:e|s)?\b/gi, /\bconsidérable(?:s|ment)?\b/gi,
      /\bspectaculaire(?:s|ment)?\b/gi, /\bmassif(?:s|ve|ves)?\b/gi,
      /\bcrucial(?:e|es|aux)?\b/gi, /\bfondamental(?:e|es|aux)?\b/gi,
      /\bexceptionnel(?:le|s|les)?\b/gi, /\bremarquable(?:s|ment)?\b/gi,
    ],
  },
  cause: {
    titre: 'LA CAUSE — une corrélation ne démontre pas',
    motifs: [
      /\bprouv(?:e|ent|é|ée|és|ées)\b/gi, /\bdémontr(?:e|ent|é|ée|és|ées)\b/gi,
      /\bs’explique(?:nt)? par\b/gi, /\ben raison de\b/gi,
      /\bcela (?:montre|signifie|veut dire)\b/gi,
      /\bil est (?:clair|évident|certain)\b/gi, /\bà l’évidence\b/gi,
    ],
  },
};

const seule = process.argv[2];
const noyaux = seule ? { [seule]: FAMILLES[seule] } : FAMILLES;

// La phrase autour du signalement, pour que la relecture ait de quoi trancher.
const autour = (t, i) => {
  let a = 0, b = t.length;
  for (const m of t.matchAll(/[.!?…]\s/g)) { if (m.index < i) a = m.index + m[0].length; else { b = m.index + 1; break; } }
  return t.slice(a, b).replace(/\s+/g, ' ').trim();
};

let total = 0;
for (const [cle, fam] of Object.entries(noyaux)) {
  if (!fam) { console.log(`famille inconnue : ${cle}`); continue; }
  const vus = new Map();
  for (const p of phrases)
    for (const r of fam.motifs)
      for (const m of p.t.matchAll(r)) {
        const ph = autour(p.t, m.index);
        const cle2 = `${p.f}:${p.i}:${ph.slice(0, 40)}`;
        if (!vus.has(cle2)) vus.set(cle2, { ...p, mot: m[0], ph });
      }
  console.log(`\n${fam.titre}   (${vus.size})`);
  console.log('-'.repeat(74));
  for (const x of [...vus.values()].slice(0, 40))
    console.log(`  ${x.f}:${x.i}  « ${x.mot} »\n     ${x.ph.slice(0, 190)}`);
  if (vus.size > 40) console.log(`  (+ ${vus.size - 40} autres)`);
  total += vus.size;
}

console.log(`\n${'='.repeat(74)}`);
console.log(`${phrases.length} phrases françaises relues · ${total} signalements.`);
console.log('Le script rassemble ; il ne tranche pas. Beaucoup sont légitimes.');
