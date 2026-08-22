// Sonde d'audit visuel — a coller dans la console de la page.
//
// Elle ne juge pas le gout : elle releve des faits geometriques que l'oeil
// percoit comme des defauts, et que le code ne montre pas.
//
//   1. TEXTE COUPE. Un element dont le contenu deborde de sa boite alors que
//      celle-ci le rogne (overflow hidden, ou un rayon qui mord le texte).
//   2. ICONE SUR TEXTE. Deux elements de meme rang dont les rectangles se
//      recouvrent — typiquement une icone posee sur un mot.
//   3. TROP PETIT. Cible cliquable sous 32 px, ou texte rendu sous 11 px.
//   4. CENTRAGE FAUX. Un enfant unique annonce centre qui ne l'est pas.
//   5. ESPACE PERDU. Un bloc dont plus de la moitie de la hauteur est vide.
//
// Elle rend un inventaire trie par gravite, pas une liste brute.

window.__audit = async (routes = ['atlas','accueil','verification','mobilites',
                                  'gouvernance','donnees','ressources','a-propos']) => {
  const dodo = ms => new Promise(r => setTimeout(r, ms));
  const defauts = [];
  const vu = (e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const texte = (e) => [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1);

  for (const route of routes) {
    history.pushState({}, '', '/fr/' + route);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await dodo(700);
    const main = document.querySelector('main');
    if (!main) continue;
    const s = main.dataset.section || route;
    const tous = [...main.querySelectorAll('*')].filter(vu);

    for (const e of tous) {
      const r = e.getBoundingClientRect();
      const st = getComputedStyle(e);

      // 1. texte rogne par sa propre boite
      if (texte(e) && st.overflow !== 'visible') {
        const dx = e.scrollWidth - e.clientWidth, dy = e.scrollHeight - e.clientHeight;
        if (dx > 2 || dy > 2) defauts.push({ s, type: 'texte rogne', gravite: 3,
          quoi: (e.className.toString() || e.tagName).slice(0, 34),
          detail: `${dx}×${dy} px caches`, txt: e.textContent.trim().slice(0, 30) });
      }

      // 3. cible trop petite, texte trop petit
      // L'interieur d'une carte SVG est hors sujet : un pays y est petit et
      // chevauche ses voisins par construction. Ce n'est pas un defaut de mise
      // en page, c'est une geographie.
      if (e.closest('svg')) continue;
      if (e.matches('a, button, [role="button"]') && !e.closest('p, li')) {
        if (r.height < 32 || r.width < 32) defauts.push({ s, type: 'cible trop petite', gravite: 2,
          quoi: (e.className.toString() || e.tagName).slice(0, 34),
          detail: `${Math.round(r.width)}×${Math.round(r.height)} px`, txt: e.textContent.trim().slice(0, 24) });
      }
      if (texte(e)) {
        const px = parseFloat(st.fontSize);
        const k = e.closest('svg') ? (() => { const sv = e.closest('svg'),
          vb = (sv.getAttribute('viewBox') || '').split(/[\s,]+/).map(Number);
          const w = sv.getBoundingClientRect().width;
          return (vb.length === 4 && w) ? w / vb[2] : 1; })() : 1;
        if (px * k < 11) defauts.push({ s, type: 'texte trop petit', gravite: 3,
          quoi: (e.className.toString() || e.tagName).slice(0, 34),
          detail: (px * k).toFixed(1) + ' px rendus', txt: e.textContent.trim().slice(0, 30) });
      }

      // 4. centrage annonce mais faux
      if (st.textAlign === 'center' && e.children.length === 1) {
        const c = e.children[0].getBoundingClientRect();
        const ecart = Math.abs((c.left + c.right) / 2 - (r.left + r.right) / 2);
        if (ecart > 6 && c.width < r.width - 8) defauts.push({ s, type: 'centrage faux', gravite: 1,
          quoi: (e.className.toString() || e.tagName).slice(0, 34), detail: Math.round(ecart) + ' px hors axe' });
      }
    }

    // 2. recouvrements entre freres visibles
    const cadres = tous.filter(e => e.parentElement && vu(e) && !e.closest('svg'));
    const parGroupe = new Map();
    for (const e of cadres) {
      if (!parGroupe.has(e.parentElement)) parGroupe.set(e.parentElement, []);
      parGroupe.get(e.parentElement).push(e);
    }
    for (const [, freres] of parGroupe) {
      if (freres.length < 2 || freres.length > 40) continue;
      for (let i = 0; i < freres.length; i++) for (let j = i + 1; j < freres.length; j++) {
        const a = freres[i].getBoundingClientRect(), b = freres[j].getBoundingClientRect();
        if (getComputedStyle(freres[i]).position === 'absolute') continue;
        if (getComputedStyle(freres[j]).position === 'absolute') continue;
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 3 && oy > 3) defauts.push({ s, type: 'elements superposes', gravite: 3,
          quoi: freres[i].tagName + ' / ' + freres[j].tagName,
          detail: `${Math.round(ox)}×${Math.round(oy)} px`,
          txt: (freres[i].textContent || '').trim().slice(0, 24) });
      }
    }

    // 5. espace perdu : un bloc dont le contenu occupe moins de la moitie.
    //
    // Un creux SYMETRIQUE n'est pas du vide perdu : c'est un centrage. Les
    // exergues de Gouvernance ont ete signales quatre fois a tort — 80 px en
    // haut, 80 en bas, autour d'une citation posee au milieu de sa carte. On ne
    // retient donc que les creux dissymetriques, ceux qui pendent d'un cote.
    for (const e of main.querySelectorAll('section, [class*="rounded"]')) {
      if (!vu(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.height < 160) continue;
      const enfants = [...e.children]
        .filter(c => vu(c) && getComputedStyle(c).position !== 'absolute');
      if (!enfants.length) continue;
      const haut = Math.min(...enfants.map(c => c.getBoundingClientRect().top)) - r.top;
      const bas = r.bottom - Math.max(...enfants.map(c => c.getBoundingClientRect().bottom));
      if (Math.abs(haut - bas) < 8) continue;            // centre, donc voulu
      const occupe = enfants.reduce((h, c) => h + c.getBoundingClientRect().height, 0);
      if (occupe / r.height < .5) defauts.push({ s, type: 'espace perdu', gravite: 1,
        quoi: (e.className.toString() || e.tagName).slice(0, 34),
        detail: Math.round(r.height - occupe) + ' px vides sur ' + Math.round(r.height) +
                ', dont ' + Math.round(Math.max(haut, bas)) + " d'un seul cote" });
    }
  }

  // Inventaire : par type, du plus grave au moins grave.
  const parType = {};
  for (const d of defauts) {
    (parType[d.type] ||= { n: 0, gravite: d.gravite, sections: new Set(), exemples: [] });
    parType[d.type].n++;
    parType[d.type].sections.add(d.s);
    if (parType[d.type].exemples.length < 3) parType[d.type].exemples.push(d);
  }
  return Object.entries(parType)
    .sort((a, b) => b[1].gravite - a[1].gravite || b[1].n - a[1].n)
    .map(([type, v]) => ({ type, n: v.n, sections: [...v.sections].join(' '), exemples: v.exemples }));
};
'sonde chargee';
