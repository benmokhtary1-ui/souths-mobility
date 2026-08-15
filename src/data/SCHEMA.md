# Modèle de données — South(s) Mobility DataHub

Ce fichier décrit **ce que contient chaque champ, d'où il vient, et ce qu'il ne
dit pas**. Il fait partie du dépôt au même titre que le code : une donnée dont on
ignore la provenance n'est pas une donnée, c'est un chiffre.

Chaque module de `src/data/` est autonome et lisible sans le reste de
l'application. On peut l'importer seul, dans Node, pour le vérifier :

```bash
node --input-type=module -e "import {countryData} from './src/data/countries.js'; console.log(Object.values(countryData).flat().length)"
```

---

## `countries.js` — la base pays

54 États, regroupés en cinq régions. **Le découpage est celui de l'Union
africaine**, pas la nomenclature M49 des Nations unies. La Mauritanie est donc au
Nord ; le Burundi et le Rwanda au Centre ; le Malawi, le Mozambique, la Zambie et
le Zimbabwe au Sud.

| Champ | Contenu | Source | Réserve |
|---|---|---|---|
| `id` | identifiant numérique stable | interne | sert de clé d'URL |
| `iso2` | code pays à deux lettres, minuscules | ISO 3166-1 | clé de jointure avec les autres modules |
| `name` | `{ fr, en }` | — | jamais une chaîne simple |
| `stock` | personnes nées à l'étranger résidant dans le pays | UN DESA, *International Migrant Stock* 2024 | une photo, pas un flux |
| `female` | part des femmes parmi ces personnes, en % | UN DESA 2024 | |
| `evolution` | part des migrants dans la population nationale, en % | UN DESA 2024 | |
| `retention` | part des partants restés en Afrique, en % | UA / OIT / OIM / CEA (2021) | agrégat régional appliqué au pays |
| `avoi` | ouverture des visas, note sur 100 | BAD & CUA, *Africa Visa Openness Index* | indice composite |
| `remittances` | transferts de la diaspora, en % du PIB | Banque mondiale | |
| `idp_conflict` | déplacés internes par conflit | IDMC | ne franchissent aucune frontière |
| `idp_disaster` | déplacés internes par catastrophe | IDMC | |
| `refugees_hosted` | réfugiés accueillis | HCR | |
| `normlex` | conventions OIT ratifiées, par catégorie | OIT, base NORMLEX | `total` inclut les conventions techniques |
| `au_treaties` | six instruments de l'UA, ratifié ou non | listes officielles de statut de l'UA | base du score d'ancrage |
| `history` | série `{ year, value }` | UN DESA | valeurs en % de la population |

**Score d'ancrage.** Il n'est pas stocké : il se calcule en comptant les six
booléens de `au_treaties`. C'est une mesure construite pour cette plateforme, pas
un indicateur publié ailleurs.

---

## `glossary.js` — le lexique

7 catégories, 79 termes. **Règle de définition : l'instrument africain fait
référence** pour les notions juridiques — Convention de l'OUA de 1969 pour le
réfugié, Convention de Kampala de 2009 pour le déplacé interne. La définition
opératoire d'UN DESA n'intervient que pour les agrégats statistiques.

Chaque terme porte `term`, `en_term`, `fr`, `en` et une `source`.

---

## `library.js` — la bibliothèque

4 sections, 65 sources, chacune avec son lien d'origine.
**Toute source citée ailleurs sur la plateforme doit y figurer.**

---

## `methodConventions.js` — les choix structurants

10 conventions qui conditionnent la lecture de tous les chiffres : périmètre,
définitions retenues, découpages, dates de référence.

---

## `genericDesc.js` — descriptifs partagés

Diffusés par `...genericDesc` à la fois dans la base pays et dans les agrégats
régionaux. Ils vivent donc à part : sans cela, l'un des deux s'en retrouve
privé — et **le défaut ne se voit qu'à l'exécution, jamais au build**.

---

## Les autres modules

| Module | Contenu | Source |
|---|---|---|
| `../censusData.js` | recensements 1970-2030, 54 pays | compilation de l'auteur d'après UNSD et UN DESA, statuts vérifiés en août 2026 sur les instituts nationaux |
| `../unhcrData.js` | réfugiés, demandeurs, déplacés, apatrides — 52 pays, 2014 et 2024 | HCR, *Refugee Data Finder* |
| `../findexData.js` | compte, mobile, transferts — 48 pays | Banque mondiale, *Global Findex* |
| `../iiagData.js` | rang de gouvernance 2023, 54 pays | Mo Ibrahim Foundation, IIAG |
| `../narrativesData.js` | 70 affirmations évaluées | rédigées par l'auteur, sources vérifiées une par une |
| `../africaMapPaths.js` | tracés SVG des 54 pays | — |

---

## Règles qui tiennent pour tout le corpus

1. **Aucun chiffre sans source.** Un chiffre dont la provenance n'est pas
   traçable ne doit pas entrer.
2. **Une date annoncée n'est pas une donnée.** Les recensements programmés puis
   reportés ne comptent pas comme réalisés.
3. **Les définitions africaines priment** pour les notions juridiques.
4. **Quand deux sources divergent, on montre les deux** avec leur provenance,
   plutôt que d'en choisir une en silence. Exemple : les totaux de déplacés
   internes, que l'IDMC et le HCR n'établissent ni sur le même périmètre de
   suivi ni par la même méthode — les deux séries sont affichées.
5. **Les noms sont toujours bilingues** (`{ fr, en }`), jamais des chaînes
   simples — une comparaison de chaînes sur un nom de pays casse dès qu'on
   change de langue.
