// Sonde de contraste et de debordement, a coller dans la console du navigateur.
//
//   await sonder(['/fr/mobilites', '/fr/mobilites/travail'])
//
// Ce fichier existe parce que la mesure naive se trompe, et se trompe toujours
// de la meme facon. Cinq pieges rencontres, cinq parades :
//
//   1. Les transitions prises en vol. Une couleur lue pendant une transition
//      de 420 ms n'est celle d'aucun etat stable. On les fige.
//   2. L'opacite forcee a 1. La parade evidente — tout rendre visible pour
//      tout mesurer — allume les planches decoratives, posees a 0,03 par
//      dessein, et les fait echouer en masse. On ne touche pas a l'opacite :
//      on ignore ce qui est sous 0,85.
//   3. content-visibility: auto. Les chapitres hors ecran ne sont pas mis en
//      page ; innerText y renvoie du vide et les rectangles sont nuls. On les
//      force a se rendre, ce qui ne change aucune couleur.
//   4. Les fonds en degrade. Un bouton actif dont le fond est un
//      linear-gradient a un background-color transparent : le calcul remonte
//      alors jusqu'a la page blanche et annonce du blanc sur blanc. On lit la
//      premiere couleur du degrade.
//   5. Le volet du navigateur masque. clientWidth tombe a 0, et tout
//      scrollWidth devient un debordement. On refuse de mesurer sous 200 px.
//
// Et les elements internes d'un SVG depassent couramment le cadre : ils sont
// rognes par le viewBox. Seul le debordement du document fait foi.

window.sonder = async (chemins = [location.pathname]) => {
  const W0 = document.documentElement.clientWidth;
  if (W0 < 200) return { erreur: 'volet masque ou replie (clientWidth=' + W0 + ') — aucune mesure de mise en page n\'est fiable' };

  const style = document.createElement('style');
  style.id = 'sonde-fige';
  style.textContent =
    '*,*::before,*::after{transition:none!important;animation:none!important;}' +
    '.chapitre{content-visibility:visible!important;}';
  document.head.appendChild(style);

  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  // Le canvas resout oklab(), color-mix() et les variables : il rend la couleur
  // reellement peinte, pas la declaration.
  const rgb = (c) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  // Piege 4 : un degrade ne remplit pas backgroundColor.
  //
  // Et l'ordre compte. CSS empile les couches de fond premiere-au-dessus : le
  // fond reellement opaque est la DERNIERE couche declaree, les precedentes
  // etant des lavis translucides poses par-dessus. Le bandeau de l'Atlas en
  // empile trois — deux voiles colores a 0,3 et 0,38, puis un degrade sombre
  // opaque. Lire la premiere couleur donnait un voile transparent, la sonde
  // remontait alors jusqu'a la page blanche et annoncait du blanc sur blanc
  // sur les quatorze libelles du bandeau, tous parfaitement lisibles.
  //
  // On balaie donc les couleurs de la fin vers le debut, et on retient la
  // premiere reellement opaque.
  const duDegrade = (img) => {
    if (!img || img === 'none') return null;
    const couleurs = img.match(/rgba?\([^)]*\)|#[0-9a-f]{3,8}|oklab\([^)]*\)|oklch\([^)]*\)/gi);
    if (!couleurs) return null;
    for (let i = couleurs.length - 1; i >= 0; i--) {
      const c = rgb(couleurs[i]);
      if (c[3] > 0.9) return c;
    }
    return null;
  };
  const fond = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      const g = duDegrade(cs.backgroundImage);
      if (g && g[3] > 0.9) return g;
      const c = rgb(cs.backgroundColor);
      if (c[3] > 0.9) return c;
      n = n.parentElement;
    }
    return [255, 255, 255, 1];
  };
  const opacite = (el) => {
    let n = el, o = 1;
    while (n && n !== document.documentElement) { o *= parseFloat(getComputedStyle(n).opacity) || 0; n = n.parentElement; }
    return o;
  };

  const resultats = {};
  for (const chemin of chemins) {
    history.pushState({}, '', chemin);
    window.dispatchEvent(new PopStateEvent('popstate'));
    await new Promise(r => setTimeout(r, 1300));

    const W = document.documentElement.clientWidth;
    const echecs = [];
    for (const el of document.querySelectorAll('main[data-section] *')) {
      if (el.ownerSVGElement) continue;                       // le SVG rogne au viewBox
      if (el.children.length && ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
      if (!el.textContent.trim()) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (opacite(el) < 0.85) continue;                       // piege 2 : decor assume
      const ratio = (() => {
        const a = lum(rgb(cs.color)), b = lum(fond(el));
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      })();
      const px = parseFloat(cs.fontSize);
      const gras = (parseInt(cs.fontWeight, 10) || 400) >= 700;
      const seuil = (px >= 24 || (px >= 18.66 && gras)) ? 3 : 4.5;
      if (ratio < seuil - 0.01) echecs.push({ txt: el.textContent.trim().slice(0, 44), ratio: +ratio.toFixed(2), seuil, px });
    }

    resultats[chemin] = {
      largeur: W,
      contraste: echecs.length,
      details: echecs.slice(0, 6),
      debordement: document.documentElement.scrollWidth > W,   // seul juge du debordement
    };
  }

  document.getElementById('sonde-fige')?.remove();
  return resultats;
};
'sonder() est prete';
