// Relève les RÉSERVES trop générales de l'Observatoire des narratifs.
//
// Dans un dossier de vérification, le champ « Limites méthodologiques » est
// l'élément le plus exigeant : c'est là que se joue l'honnêteté de l'exercice.
// Une réserve qui pourrait être recopiée sur n'importe quel dossier — « la
// ratification d'un texte ne garantit pas son application effective » — n'en
// est pas une : elle rassure sans informer.
//
// Le relevé sort les dossiers dont la réserve tient en moins de cent trente
// signes, avec l'affirmation examinée et le constat, pour qu'on puisse écrire
// une réserve qui porte sur CE chiffre-là.
//
//   node scripts/relever-les-reserves.mjs          (le compte)
//   node scripts/relever-les-reserves.mjs 0 12     (les dossiers 0 à 11)
import { readFileSync } from 'node:fs';

const src = readFileSync('src/narrativesData.js', 'utf8').replace(/\r\n/g, '\n');

const champ = (bloc, nom) => {
  const m = bloc.match(new RegExp(nom + ':\\s*\\{\\s*fr:\\s*"((?:[^"\\\\]|\\\\.)*)"'));
  return m ? m[1].replace(/\\"/g, '"').replace(/\\'/g, "'") : '';
};

const dossiers = [];
for (const m of src.matchAll(/\n  \{\n    id: "(\d+)",([\s\S]*?)\n  \}/g)) {
  const bloc = m[2];
  dossiers.push({
    id: m[1],
    narrative: champ(bloc, 'narrative'),
    verdict: champ(bloc, 'verdict'),
    reality: champ(bloc, 'reality'),
    limits: champ(bloc, 'limits'),
  });
}

const minces = dossiers.filter((d) => d.limits && d.limits.length < 130);
const [de, combien] = [Number(process.argv[2] ?? -1), Number(process.argv[3] ?? 0)];

if (de < 0) {
  console.log('dossiers            : ' + dossiers.length);
  console.log('réserves trop générales (< 130 signes) : ' + minces.length);
  console.log('\n(relancer avec deux nombres pour lire une tranche : 0 12)');
} else {
  for (const d of minces.slice(de, de + combien)) {
    console.log('=== ' + d.id + '  [' + d.verdict + ']');
    console.log('AFFIRMATION  ' + d.narrative);
    console.log('CONSTAT      ' + d.reality);
    console.log('RÉSERVE      ' + d.limits + '\n');
  }
}
