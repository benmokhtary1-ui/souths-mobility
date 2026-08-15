import { glossaryData } from './src/data/glossary.js';
import { libraryData } from './src/data/library.js';
console.log('=== Termes sans source (' + glossaryData.flatMap(c=>(c.terms||[]).filter(t=>!t.source)).length + ')');
glossaryData.forEach(c => (c.terms||[]).filter(t=>!t.source).forEach(t =>
  console.log('  [' + (c.category?.fr||'').slice(0,22).padEnd(22) + '] ' + t.term)));
console.log('\n=== Documents sans lien');
libraryData.forEach(s => (s.items||[]).filter(d=>!d.url).forEach(d =>
  console.log('  [' + (s.title?.fr||s.category?.fr||'').slice(0,24).padEnd(24) + '] ' + d.title + '  (' + d.year + ')')));
