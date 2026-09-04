# African Mobility Hub

Plateforme indépendante de recherche et de données sur les mobilités humaines
africaines. Elle ne produit aucune statistique : elle réunit ce que les
institutions publient, le date, le rapporte à la population dont il est
question, et le lit avec les définitions africaines plutôt qu'avec celles du
Nord.

Adossée à une thèse de doctorat en relations internationales (Yassine Ben
Mokhtar, Université Internationale de Rabat), elle n'engage aucune institution.

- **En ligne** : https://souths-mobility.vercel.app
- **Langues servies** : français, anglais. L'arabe est gelé tant que le fond bouge.

## Faire tourner le site

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Vérifier avant de livrer

C'est la commande qui compte. Elle porte chaque demande faite au projet sous une
forme que le code peut trancher, et sort en erreur si l'une d'elles a cessé
d'être vraie.

```bash
npm run verifier
```

Elle enchaîne le relevé des demandes, les règles de mise en page, la
confrontation des deux versions linguistiques, l'échelle typographique, les
comptes, les définitions doubles, les attributions et l'audit du fond.

`scripts/` contient une quarantaine d'autres relevés, chacun sur un point
précis — la typographie française, les anglicismes résiduels, les tics de prose,
les tournures négatives, les mises en page qui ne divergent que d'un cran. Ils
ne corrigent rien : ils disent où regarder.

## D'où viennent les chiffres

`donnees-sources/` porte les fichiers primaires téléchargés chez les
institutions productrices — UN DESA, IDMC, OIT, Banque mondiale. Ils restent
dans le dépôt pour une raison : **un chiffre se recalcule, il ne se reprend
pas.** Un pourcentage arrive toujours avec le périmètre de sa source, et la
règle du projet est de refaire le calcul sur les 54 États de l'Union africaine
plutôt que de citer un agrégat dont on ignore l'assiette.

`outils/` porte les générateurs Python qui ont produit les bases à partir de ces
fichiers. `src/data/` porte le résultat, documenté champ par champ dans
`src/data/SCHEMA.md`.

Deux conventions gouvernent la lecture. Pour les agrégats, la définition d'UN
DESA, sans laquelle aucune comparaison internationale ne tient. Pour les notions
juridiques, l'instrument africain : le réfugié se lit par la Convention de l'OUA
de 1969, plus large que celle de Genève, et la personne déplacée par la
Convention de Kampala de 2009. Ce choix a un prix, énoncé sur le site : une
donnée lue avec les définitions africaines ne se compare pas terme à terme avec
une donnée européenne lue par Genève.

## Organisation

| | |
|---|---|
| `src/App.jsx` | l'application entière, commentée au fil du raisonnement |
| `src/theme.css` | le système visuel : échelle, teintes de section, mises en page |
| `src/data/` | les bases — pays, glossaire, bibliothèque, conventions |
| `scripts/` | les relevés et vérifications |
| `donnees-sources/` | les fichiers primaires des institutions |
| `outils/` | les générateurs Python |
| `CHANTIER.md` | la file de travail, cochée à mesure |

## Licence

Voir `LICENSE`.
