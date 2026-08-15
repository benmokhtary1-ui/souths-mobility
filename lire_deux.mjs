import { evidenceCheckData } from './src/narrativesData.js';
for (const id of ['045','058']) {
  const f = evidenceCheckData.find(x => x.id === id);
  console.log('========= ' + id + '   ' + (f.category?.fr||'') + '   ' + f.confidence_level + '  ' + (f.verdict?.fr||''));
  console.log('AFFIRMATION : ' + f.narrative.fr);
  console.log('REPONSE     : ' + String(f.reality.fr).slice(0, 420));
  console.log('LIMITES     : ' + String(f.limits?.fr||'—').slice(0, 180));
  console.log('SOURCES     : ' + (f.sources?.fr||[]).join(' | '));
  console.log();
}
