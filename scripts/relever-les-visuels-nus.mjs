// QUELLE VISUALISATION NE DIT PAS D'OÙ ELLE VIENT ?
// ===========================================================================
// L'audit externe pose la règle : « pour chaque visualisation, afficher au
// minimum un titre qui dit ce qui est mesuré, la période, l'unité et la
// source ». C'est aussi la règle que le site s'impose à lui-même — un chiffre
// se lit avec son millésime — mais elle n'avait jamais été VÉRIFIÉE objet par
// objet.
//
// Le script relève, dans le rendu, tout ce qui est un objet graphique — carte,
// barres, frise, jauge, tableau — et regarde s'il porte, dans son bloc :
//
//   · un titre ou un intitulé ;
//   · une note de source (la forme `.note-source`, ou le mot « Source ») ;
//   · un millésime, c'est-à-dire une année ou une période.
//
// Il ne juge pas la qualité de la source : il dit si elle est là. Un objet nu
// n'est pas nécessairement fautif — une jauge dans une fiche qui porte déjà sa
// source n'a pas à la répéter — mais il doit pouvoir se justifier, et c'est ce
// que la liste permet de faire.
//
// ATTENTION AU PIEGE : on lit `textContent` et non `innerText`. Le second
// respecte le rendu et renvoie vide pour tout ce qui attend son animation
// d entree — ce qui faisait passer pour nues des cartes parfaitement
// etiquetees.
//
// Il tourne DANS LE NAVIGATEUR, parce qu'un objet graphique n'existe qu'au
// rendu : le code source ne dit pas ce qui finit à l'écran.
//
//   node scripts/relever-les-visuels-nus.mjs   (imprime le script à coller)
//
// La sortie se colle dans la console du volet, ou dans celle d'un navigateur
// ouvert sur le site.
const SONDE = `(async () => {
  const SECTIONS = ['Accueil','Atlas','Vérification','Données','Mobilités','Gouvernance','À propos & méthode'];
  const releve = [];
  const bloc = (e) => e.closest('section, article, .bg-white, [class*="border"]') || e.parentElement;
  const aSource = (b) => !!b && (
    b.querySelector('.note-source') ||
    /\\bSource\\b|\\bSources\\b|\\bd’après\\b|\\bselon\\b/i.test(b.textContent || ''));
  const aMillesime = (b) => !!b && /\\b(19|20)\\d\\d\\b/.test(b.textContent || '');
  const aTitre = (b) => !!b && !!b.querySelector('h1, h2, h3, h4, .surtitre');

  for (const nom of SECTIONS) {
    const t = [...document.querySelectorAll('nav button')].find(x => x.textContent.trim() === nom);
    if (!t) continue;
    t.click();
    await new Promise(r => setTimeout(r, 1200));
    const m = document.querySelector('main');
    // Ce qui compte comme objet graphique : il porte des marques, pas du texte.
    const objets = [...m.querySelectorAll('svg, table, .frise, .classement-jauge, .bar-fill, .feuillet-piste')]
      .map(e => e.closest('svg') || e)
      .filter(e => { const r = e.getBoundingClientRect(); return r.width > 140 && r.height > 60; });
    const vus = new Set();
    for (const o of objets) {
      const b = bloc(o);
      if (!b || vus.has(b)) continue;
      vus.add(b);
      const manque = [];
      if (!aTitre(b)) manque.push('titre');
      if (!aSource(b)) manque.push('source');
      if (!aMillesime(b)) manque.push('millésime');
      if (manque.length) releve.push({
        section: nom,
        objet: o.tagName.toLowerCase() + '.' + ((o.className && (o.className.baseVal ?? o.className)) + '').split(' ').slice(0, 2).join('.'),
        manque: manque.join(' + '),
        extrait: (b.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60),
      });
    }
  }
  return releve.length
    ? releve.map(r => r.section.padEnd(20) + r.manque.padEnd(26) + r.objet.padEnd(24) + '« ' + r.extrait + ' »').join('\\n')
      + '\\n\\n' + releve.length + ' objet(s) sans étiquetage complet.'
    : 'chaque objet graphique porte son titre, sa source et son millésime.';
})()`;

console.log('SONDE À COLLER DANS LA CONSOLE');
console.log('='.repeat(74));
console.log(SONDE);
