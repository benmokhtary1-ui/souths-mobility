// L ECHELLE TYPOGRAPHIQUE, TELLE QU ELLE EST RENDUE
// ===========================================================================
// Le fichier de style pose une echelle — 31 pour le chiffre de tete, 13 pour
// le plancher — et une couche d interception remonte les tailles ecrites en
// dur. Ce que le code demande n est donc pas ce que le lecteur voit, et c est
// le lecteur qui compte.
//
// Ce script ne lit pas la source : il ne peut pas. Il ecrit la sonde que le
// navigateur executera, et qui releve, pour chaque ROLE (titre de section,
// chiffre de tete, corps, etiquette, note), la ou les tailles effectivement
// peintes. Un role qui rend trois tailles differentes selon l endroit de la
// page est une derive ; un role qui n en rend qu une tient.
//
//   node scripts/auditer-l-echelle-rendue.mjs        (imprime la sonde)
//
// La sonde se colle dans la console du site, ou se passe au volet.
const SONDE = `(async () => {
  const ev = { stopPropagation(){}, preventDefault(){} };
  const clic = (n) => {
    const b = [...document.querySelectorAll('nav button')].find(x => x.textContent.trim() === n);
    if (!b) return false;
    const k = Object.keys(b).find(k => k.startsWith('__reactProps'));
    b[k].onClick(ev);
    return true;
  };

  // Un role se reconnait a ce qu il fait, pas a sa classe.
  const ROLES = [
    ['titre de section',  'main h2'],
    ['intertitre',        'main h3'],
    ['chiffre de tete',   '.fiche-mesure-n, .ratif-n, .evolution-borne--fin b, .kpi .val'],
    ['corps',             'main p:not(.surtitre):not(.note-source):not(.provenance)'],
    ['etiquette',         '.surtitre'],
    ['note',              '.note-source, .provenance, .fiche-note'],
    ['bouton',            'main button:not(.terme)'],
  ];

  const releve = {};
  const pages = ['Accueil', 'Atlas', 'Vérification', 'Données', 'Mobilités', 'Gouvernance', 'À propos & méthode'];
  for (const p of pages) {
    if (!clic(p)) continue;
    await new Promise(r => setTimeout(r, 1700));
    for (const [role, sel] of ROLES) {
      releve[role] = releve[role] || {};
      for (const e of document.querySelectorAll(sel)) {
        if (!(e.textContent || '').trim()) continue;
        const c = getComputedStyle(e);
        const t = Math.round(parseFloat(c.fontSize) * 10) / 10 + 'px/' + c.fontWeight;
        releve[role][t] = (releve[role][t] || 0) + 1;
      }
    }
  }

  const sortie = {};
  for (const [role, tailles] of Object.entries(releve)) {
    sortie[role] = Object.entries(tailles).sort((a, b) => b[1] - a[1]).map(([t, n]) => t + ' x' + n);
  }
  return JSON.stringify(sortie, null, 1);
})()`;

console.log(SONDE);
