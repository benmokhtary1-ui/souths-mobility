// Dérive l'édition de nuit depuis l'édition de jour, et la vérifie.
//
// Le site n'avait aucun mode sombre : ni `prefers-color-scheme`, ni attribut de
// thème, ni bascule. Sur un site qu'on lit longtemps, c'est l'attente de base ;
// et pour un atlas, ce n'est pas un gadget — une planche a son tirage de jour et
// son tirage de nuit.
//
// ON NE RENVERSE RIEN MÉCANIQUEMENT. Inverser la luminosité d'une palette donne
// des couleurs qui « fonctionnent » au sens du contraste et qui sonnent faux :
// l'indigo d'Accueil devient un bleu de néon, l'ambre un jaune de balisage. On
// dérive donc PAR RÔLE, à teinte et chroma tenus, en visant un contraste et non
// en choisissant une valeur — exactement la méthode du jour (voir le commentaire
// « Une teinte par section » dans theme.css).
//
// LE FOND DE NUIT EST CHAUD. Le papier du site est un blanc à peine chaud
// (#FCFAF8, teinte ~70° en OKLch). Sa nuit garde cette teinte : deux tirages de
// la même famille, pas un site clair et un site froid.
//
// UNE TROUVAILLE. `--accent-light` avait déjà été visé « en réserve sur l'encre,
// 8,0:1 » — c'est-à-dire pour un usage sur fond sombre. La nuit avait donc déjà
// la moitié de ses valeurs, calculées il y a longtemps pour autre chose.
//
//   node scripts/composer-la-nuit.mjs
//   node scripts/composer-la-nuit.mjs --css   (n'imprime que le bloc à coller)

// ---- sRGB <-> OKLab / OKLch ------------------------------------------------
const lin = u => (u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4));
const gam = u => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map(u => Math.round(Math.min(1, Math.max(0, u)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();

function rgb2oklab([r, g, b]) {
  r = lin(r); g = lin(g); b = lin(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
          1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
          0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s];
}
function oklab2rgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [gam(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
          gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
          gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)];
}
const lab2lch = ([L, a, b]) => [L, Math.hypot(a, b), Math.atan2(b, a)];
const lch2lab = ([L, C, h]) => [L, C * Math.cos(h), C * Math.sin(h)];
const dansLeGamut = ([r, g, b]) => [r, g, b].every(u => u >= -0.0005 && u <= 1.0005);
const lch = hex => lab2lch(rgb2oklab(hex2rgb(hex)));

// ---- contraste WCAG (calculé, jamais estimé) -------------------------------
const lumin = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contraste = (h1, h2) => {
  const a = lumin(hex2rgb(h1)), b = lumin(hex2rgb(h2));
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

// Cherche la clarté qui atteint au plus juste la cible de contraste sur `fond`,
// à teinte et chroma tenus. Si la couleur sort du gamut, on réduit le chroma
// plutôt que d'écrêter les canaux : écrêter déplace la teinte.
function viser(hueSource, cible, fond, { versLeClair = true, chromaMax = null } = {}) {
  const [, C0, h] = lch(hueSource);
  const C = chromaMax === null ? C0 : Math.min(C0, chromaMax);
  let meilleur = null;
  for (let L = versLeClair ? 0.20 : 0.98; versLeClair ? L <= 0.99 : L >= 0.05; L += versLeClair ? 0.002 : -0.002) {
    let hex = null;
    for (let k = 1; k >= 0; k -= 0.02) {
      const rgb = oklab2rgb(lch2lab([L, C * k, h]));
      if (dansLeGamut(rgb)) { hex = rgb2hex(rgb); break; }
    }
    if (!hex) continue;
    const c = contraste(hex, fond);
    if (c >= cible) { meilleur = hex; break; }
    meilleur = hex;
  }
  return meilleur;
}

// ---- LE FOND DE NUIT -------------------------------------------------------
// Trois plans, comme le jour : le papier, la feuille posée dessus, le creux.
// La teinte est celle du papier de jour ; seule la clarté change de camp.
const PAPIER_JOUR = '#FCFAF8';
const [, , hPapier] = lch(PAPIER_JOUR);
const plan = (L) => {
  for (let k = 1; k >= 0; k -= 0.02) {
    const rgb = oklab2rgb(lch2lab([L, 0.008 * k, hPapier]));
    if (dansLeGamut(rgb)) return rgb2hex(rgb);
  }
  return '#000000';
};
const NUIT = {
  paper:        plan(0.185),   // le fond de la page
  paperRaised:  plan(0.235),   // la carte posée dessus
  paperSunk:    plan(0.145),   // le creux, un cran sous le fond
  reserve:      plan(0.235),
};

// ---- LES ENCRES ------------------------------------------------------------
// Mêmes rôles qu'au jour, mêmes cibles de contraste, mesurées sur la carte —
// c'est là que le texte se lit le plus souvent, et c'est le fond le plus clair,
// donc le cas le plus défavorable.
const SUR = NUIT.paperRaised;
const ENCRES = {
  ink:        viser('#FCFAF8', 13.5, SUR),
  inkSoft:    viser('#E8E2DA', 9.5,  SUR),
  inkMute:    viser('#C9C0B6', 5.5,  SUR),
  label:      viser('#C9C0B6', 6.2,  SUR),
};
// Les filets ne portent pas de texte : on ne vise pas un contraste de lecture
// mais une présence — assez pour séparer deux plans, pas assez pour quadriller.
const FILETS = { rule: plan(0.315), ruleStrong: plan(0.395) };

// ---- LES TEINTES DE SECTION ------------------------------------------------
// Le jour visait : filet sur papier >= 4,5:1, petit corps >= 7:1, texte foncé sur
// aplat clair >= 4,5:1, réserve sur l'encre >= 6,2:1.
// La nuit garde les mêmes rôles, en montant au lieu de descendre :
//   --accent       la teinte courante, sur la carte        >= 5,5:1
//   --accent-deep  ce qui doit ressortir (petit corps)     >= 8,0:1
//   --accent-soft  l'aplat teinté, qui porte l'encre       encre >= 10:1 dessus
//   --accent-light le pas intermédiaire                    >= 3,5:1
const SECTIONS = [
  ['home',       'indigo',       '#2B3A67'],
  ['evidence',   'prune',        '#5B3A6E'],
  ['explorer',   'bleu pétrole', '#2E5F6B'],
  ['mobilites',  'grenat',       '#7A2E3E'],
  ['atlas',      'kola',         '#046345'],
  ['governance', 'bleu-violet',  '#3D3A78'],
  ['data',       'olive',        '#5A581F'],
  ['resources',  'terre brûlée', '#6B4230'],
  ['about',      'graphite',     '#3F4654'],
];

const aplatSombre = (source) => {
  // L'aplat de nuit est une teinture du fond, pas un pastel assombri : on part
  // du plan de la carte et on y verse la teinte, sans dépasser ce que l'encre
  // peut porter.
  const [, C0, h] = lch(source);
  const [L] = lch(NUIT.paperRaised);
  for (let k = 1; k >= 0; k -= 0.02) {
    const rgb = oklab2rgb(lch2lab([L + 0.045, Math.min(C0, 0.030) * k, h]));
    if (dansLeGamut(rgb)) return rgb2hex(rgb);
  }
  return NUIT.paperRaised;
};

// LA NUIT EST PLUS SOURDE QUE LE JOUR.
//
// Une même saturation ne se lit pas pareil des deux côtés : sur le papier, une
// teinte posée à chroma 0,09 reste sage ; sur un fond sombre, la même valeur
// éclate. Le kola de l'Atlas, profond et sourd de jour, virait à l'émeraude
// franche de nuit — et une émeraude franche sur une plateforme africaine ne se
// lit pas comme une teinte, elle se lit comme une institution.
//
// On plafonne donc le chroma de nuit. Les neuf teintes gardent leur ANGLE, donc
// leur identité ; elles perdent leur éclat. C'est le réglage d'un tirage, pas un
// changement de palette.
const CHROMA_NUIT = 0.038;

const teintes = SECTIONS.map(([cle, nom, jour]) => {
  const accent = viser(jour, 5.5, SUR, { chromaMax: CHROMA_NUIT });
  const deep   = viser(jour, 8.0, SUR, { chromaMax: CHROMA_NUIT });
  const soft   = aplatSombre(jour);
  const light  = viser(jour, 3.5, SUR, { chromaMax: CHROMA_NUIT });
  return { cle, nom, jour, accent, deep, soft, light,
    cAccent: contraste(accent, SUR), cDeep: contraste(deep, SUR),
    cEncreSurSoft: contraste(ENCRES.ink, soft) };
});

// Le graphite de la racine : la teinte du papier, un chroma de rien du tout.
// « À peine teinté », et un cran en deçà de ce que le mot laisse attendre.
const CHROMA_GRAPHITE = 0.009;
const graphiteSource = (() => {
  for (let k = 1; k >= 0; k -= 0.02) {
    const rgb = oklab2rgb(lch2lab([0.6, CHROMA_GRAPHITE * k, hPapier]));
    if (dansLeGamut(rgb)) return rgb2hex(rgb);
  }
  return '#8A8175';
})();
const graphite = {
  accent: viser(graphiteSource, 5.5, SUR, { chromaMax: CHROMA_GRAPHITE }),
  deep:   viser(graphiteSource, 8.0, SUR, { chromaMax: CHROMA_GRAPHITE }),
  soft:   aplatSombre(graphiteSource),
  light:  viser(graphiteSource, 3.5, SUR, { chromaMax: CHROMA_GRAPHITE }),
};

// ---- LES ÉTATS -------------------------------------------------------------
const ETATS = [
  ['ok',      '#0E6B45', 5.5], ['ok-soft',   null, null],
  ['warn',    '#C8892B', 5.5], ['warn-ink',  '#C8892B', 7.0], ['warn-soft', null, null],
  ['bad',     '#A32222', 5.5], ['bad-soft',  null, null],
  ['tier-4',  '#0E6B45', 5.8], ['tier-3', '#6E5A0E', 5.8],
  ['tier-2',  '#8A4310', 5.8], ['tier-1', '#A32222', 5.8],
];
const etats = ETATS.filter(([, src]) => src).map(([nom, src, cible]) => {
  const v = viser(src, cible, SUR);
  return { nom, jour: src, nuit: v, c: contraste(v, SUR) };
});
const aplats = { 'ok-soft': aplatSombre('#0E6B45'), 'warn-soft': aplatSombre('#C8892B'), 'bad-soft': aplatSombre('#A32222') };

// ---- LA LECTURE ------------------------------------------------------------
const lecture = {
  base:  viser('#645444', 5.5, SUR),
  deep:  viser('#645444', 8.0, SUR),
  soft:  aplatSombre('#645444'),
  light: viser('#645444', 3.5, SUR),
};
const accent2 = {
  base:  viser('#0F6E78', 5.5, SUR),
  soft:  aplatSombre('#0F6E78'),
  light: viser('#0F6E78', 3.5, SUR),
};

// ---- SORTIE ----------------------------------------------------------------
const cssSeul = process.argv.includes('--css');

if (!cssSeul) {
  console.log('LE FOND DE NUIT (teinte du papier de jour, ' + (hPapier * 180 / Math.PI).toFixed(0) + '°)');
  for (const [k, v] of Object.entries(NUIT)) console.log('  ' + k.padEnd(14) + v);
  console.log('\nLES ENCRES, mesurées sur la carte ' + SUR);
  for (const [k, v] of Object.entries(ENCRES))
    console.log('  ' + k.padEnd(14) + v + '   ' + contraste(v, SUR).toFixed(2) + ':1');
  console.log('  ' + 'rule'.padEnd(14) + FILETS.rule + '   ' + contraste(FILETS.rule, SUR).toFixed(2) + ':1  (filet, pas du texte)');
  console.log('  ' + 'ruleStrong'.padEnd(14) + FILETS.ruleStrong + '   ' + contraste(FILETS.ruleStrong, SUR).toFixed(2) + ':1');

  console.log('\nLES NEUF TEINTES');
  console.log('section      nom            jour      accent    /1     deep      /1     soft      encre/1');
  console.log('-'.repeat(92));
  for (const t of teintes) {
    console.log(t.cle.padEnd(13) + t.nom.padEnd(15) + t.jour + '   ' +
      t.accent + '  ' + t.cAccent.toFixed(1).padStart(4) + '  ' +
      t.deep + '  ' + t.cDeep.toFixed(1).padStart(4) + '  ' +
      t.soft + '  ' + t.cEncreSurSoft.toFixed(1).padStart(5));
  }
  const pire = Math.min(...teintes.map(t => t.cAccent));
  const pireSoft = Math.min(...teintes.map(t => t.cEncreSurSoft));
  console.log('\n  accent le moins contrasté : ' + pire.toFixed(2) + ':1  (cible 5,5)');
  console.log('  encre sur aplat, au pire  : ' + pireSoft.toFixed(2) + ':1  (cible 10)');

  console.log('\nLES ÉTATS');
  for (const e of etats) console.log('  ' + e.nom.padEnd(10) + e.jour + ' -> ' + e.nuit + '   ' + e.c.toFixed(2) + ':1');
  console.log('\n---- le bloc CSS suit (ou : --css pour lui seul) ----\n');
}

const decl = (o) => Object.entries(o).map(([k, v]) => `  ${k}: ${v};`).join('\n');

const socle = `
  --paper:        ${NUIT.paper};
  --paper-raised: ${NUIT.paperRaised};
  --paper-sunk:   ${NUIT.paperSunk};
  /* --reserve ne bascule pas. Son rôle, écrit dans sa propre note, est « le
     blanc du texte posé sur un fond sombre » — et des fonds sombres existent
     dans les deux tirages : le bandeau, la barre, le pied de page, les cartes
     d'emphase. L'assombrir de nuit aurait posé du texte sombre sur eux. */
  --reserve:      #FFFDF9;

  --ink:          ${ENCRES.ink};
  --ink-soft:     ${ENCRES.inkSoft};
  --ink-mute:     ${ENCRES.inkMute};
  --muted:        ${ENCRES.inkMute};
  --label:        ${ENCRES.label};
  --rule:         ${FILETS.rule};
  --rule-strong:  ${FILETS.ruleStrong};

  /* La carte d'emphase : de jour elle est sombre sur du clair, de nuit elle
     devient l'aplat teinté de la section — sinon elle se confondrait avec la
     carte ordinaire, ou creuserait un trou plus noir que la page. On pointe sur
     --accent-soft plutôt que d'en recopier neuf valeurs : la section redéfinit
     déjà cet aplat, et le plan la suit sans qu'on ait à le répéter. */
  --plan-emphase: var(--accent-soft);
  /* Le plan encré : bandeau, barre de navigation, pied de page, boutons actifs.
     De jour c'est l'encre elle-même ; de nuit l'encre devient claire, et un plan
     peint avec elle deviendrait le bloc le plus lumineux de la page. */
  --plan-encre:   var(--accent-soft);
  /* Sur ce plan, « creusé » veut dire plus lumineux : la variante claire y
     tomberait à 3,0:1, l'accent creusé y tient 6,9 à 7,2:1. */
  --accent-sur-plan: var(--accent-deep);

  /* L'accent par défaut recule. De jour, la racine porte le kola de la marque ;
     de nuit, il se lisait à chaque page sans section — le pied, la barre, la
     marque — et c'est lui qui donnait au site son air d'organisation. Il cède la
     place à un graphite à peine teinté de la chaleur du papier : ce sont les neuf
     teintes de section qui portent seules l'identité. */
  --accent:        ${graphite.accent};
  --accent-deep:   ${graphite.deep};
  --accent-soft:   ${graphite.soft};
  --accent-light:  ${graphite.light};

  --lecture:       ${lecture.base};
  --lecture-deep:  ${lecture.deep};
  --lecture-soft:  ${lecture.soft};
  --lecture-light: ${lecture.light};

  --accent-2:       ${accent2.base};
  --accent-2-soft:  ${accent2.soft};
  --accent-2-light: ${accent2.light};

  --ok:        ${etats.find(e => e.nom === 'ok').nuit};
  --ok-soft:   ${aplats['ok-soft']};
  --warn:      ${etats.find(e => e.nom === 'warn').nuit};
  --warn-ink:  ${etats.find(e => e.nom === 'warn-ink').nuit};
  --warn-soft: ${aplats['warn-soft']};
  --bad:       ${etats.find(e => e.nom === 'bad').nuit};
  --bad-soft:  ${aplats['bad-soft']};

  --tier-4: ${etats.find(e => e.nom === 'tier-4').nuit};
  --tier-3: ${etats.find(e => e.nom === 'tier-3').nuit};
  --tier-2: ${etats.find(e => e.nom === 'tier-2').nuit};
  --tier-1: ${etats.find(e => e.nom === 'tier-1').nuit};`.trim();

console.log(`/* ---------- L'ÉDITION DE NUIT --------------------------------------------

   Dérivée de l'édition de jour par le calcul, jamais à l'œil, et vérifiée sur
   les mêmes cibles de contraste : voir scripts/composer-la-nuit.mjs. On ne
   renverse pas une palette — inverser la luminosité donne des couleurs qui
   passent le contraste et sonnent faux. On dérive PAR RÔLE, à teinte tenue.

   Le fond garde la teinte du papier de jour (${(hPapier * 180 / Math.PI).toFixed(0)}°) : deux tirages de la
   même famille, pas un site clair et un site froid.

   DEUX ÉTATS, ET LE JOUR PAR DÉFAUT. Il y avait un troisième réglage, « système »,
   qui suivait prefers-color-scheme — et comme la plupart des appareils sont en
   sombre, presque tout le monde arrivait de nuit sur un site conçu pour le
   papier. Le défaut est donc le jour, franchement, et la nuit se choisit.
   Conséquence : plus une seule règle de média ici. L'absence d'attribut vaut
   jour ; data-theme="nuit" vaut nuit. Rien d'autre à arbitrer.            */

:root[data-theme="nuit"] {
${socle.split('\n').map(l => '  ' + l).join('\n')}
}
${teintes.map(t => `:root[data-theme="nuit"] :is(main, header, nav)[data-section="${t.cle}"] {
  --accent:       ${t.accent};
  --accent-deep:  ${t.deep};
  --accent-soft:  ${t.soft};
  --accent-light: ${t.light};
}`).join('\n')}`);
