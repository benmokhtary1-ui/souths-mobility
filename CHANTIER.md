# File de travail — 25 août 2026

Ce que la relecture a demandé, dans l'ordre où je le traite. Coché = fait et
mesuré. Les items sont volontairement écrits en une ligne : le détail est dans
les commentaires du code qu'ils produisent.

## Textes — suppressions
- [x] 1. Retirer « Chaque chiffre y est rattaché à la source qui le publie… »
- [x] 2. Retirer de la boîte Atlas le compteur « 54 États documentés · 68 références · 82 notions · 79 énoncés »
- [x] 3. Retirer le foliotage en planches (« PL. I », « Pl. XI ») partout ; voir si la marque peut prendre la place

## Textes — à reprendre
- [x] 4. « Plateforme indépendante de recherche et de données sur les mobilités humaines dans les Suds, construite depuis l'Afrique. »
- [x] 5. « Qui est en tête, qui ferme la marche » — et il manque quelque chose à ce niveau
- [x] 6. « Ce que la plateforme ne mesurait pas : l'aspiration » — idem
- [x] 7. « Hub » avec une majuscule partout
- [x] 8. « Pourquoi ce Hub de connaissances ? » aligné sur le paragraphe, ou centré

## Couleur
- [x] 9. Sortir de l'émeraude : elle rappelle l'Union africaine. Éviter aussi le
      bleu ONU/OIM et le jaune ICMPD. Aucune couleur d'institution de la
      question migratoire. Variantes éloignées et dégradés bienvenus.

## Mise en page
- [x] 10. Bandes à icônes : centrer dans la page, police des icônes +20 %, partout
- [x] 11. « Sur 100 habitants… (UN DESA, 2024) » → en note, pas en texte plein
- [x] 12. Atlas : mesuré à 3 064 px en huit blocs déjà serrés — le vide était dans les écarts. La légende, qui EST la légende de la carte, revient contre elle (40 → 16 px).
- [x] 13. Écart de largeur visible à partir de « Cette proportion contraste… »
- [x] 14. Blancs latéraux à réduire ; grand vide après « Exporter (PDF) » avant la bande du bas
- [x] 15. La bande du bas, jamais reprise : plus nette, plus efficace
- [x] 16. Fiches pays : uniformiser, resserrer, corriger — le mobile d'abord
- [x] 17. Fiches de vérification : compacter, trop larges et trop hautes
- [x] 18. « Pour commencer » : condenser de 35 % (l'espace, pas le corps)

## Structure
- [x] 19. Accueil : trois blocs présentent le site, n'en garder qu'un
- [x] 20. Atlas : cliquer un pays donne aussi la perspective régionale sous la carte
- [x] 21. Corridors : une carte animée comme la boîte de titre d'ATLAS ; « ATLAS » en capitales
- [x] 22. Fondre « Ressources & méthode » dans « À propos »
- [x] 23. Trancher l'ordre : Atlas ou Accueil en première section
- [x] 24. Poursuivre la mise en ordre argumentative, partout

## Fond
- [x] 25. Bibliothèque : 70 entrées. UNSD et UNESCO manquaient alors qu'ils fondent des chiffres — ajoutés. Sept notices d'une ligne étoffées : c'étaient les bases les plus employées du site.

## À réappliquer
- 26. Le triptyque « 47 % · 27 % · +9 » est le modèle retenu : clair, net, sans
      remplissage. C'est la forme à reprendre quand trois chiffres se présentent
      ensemble.

## Audit externe — Lamios, 29 août 2026

Ce que le rapport demande, et où j'en suis.

### Technique — fait
- [x] A1. Le titre de page valait « datahub », le gabarit de Vite jamais repris. Corrigé, avec description, canonical et hreflang.
- [x] A2. Aperçu au partage : image 1200×630 composée depuis les tracés du site (`scripts/composer-l-apercu.mjs`).
- [x] A3. L'attribut de langue disait `en` alors que le site ouvre en français.
- [x] A4. Contenu lisible sans JavaScript : 225 mots dans le HTML servi, contre zéro.
- [x] A5. `robots.txt` et `sitemap.xml`.
- [x] A6. Données structurées `Dataset` — auteur, accès libre, couverture, mots-clés.

### Contenu — fait
- [x] A7. Deux chemins dans le bandeau d'accueil : voir les données · comprendre la démarche.
- [x] A8. Trois questions concrètes en entrée, avec lien profond — la carte s'ouvre SUR la réponse, pas devant des filtres.

### Reste, et pourquoi
- [ ] A9. Micro-démo de 30 à 60 s. **C'est une vidéo à enregistrer, pas du code.**
- [ ] A10. Les douze problèmes WCAG A relevés par Insites — il me faut le détail du rapport pour les traiter un par un.
- [~] A11. LCP : polices sorties de l'import du CSS, preconnect posé. CLS : cause identifiée (échange de police sur le titre, Georgia 1,097× Fraunces) mais correction abandonnée — trois calibrages de size-adjust ont échoué et un repli mal calibré décale plus qu'aucun. Leçon consignée dans theme.css.
- [x] A12. Bloc « Key Findings » sur l'accueil : deux ou trois constats, avec « pourquoi ça compte » et un lien vers la preuve.
- [x] A13. Titre, unité, période et source sur chaque visualisation : relevé systématique fait (scripts/relever-les-visuels-nus.mjs). Une seule source échappait à la forme commune, normalisée.
- [x] A14. URL partageable : la couche et la région entrent en paramètres, et se relisent à froid.
- [ ] A15. Analytics — décision RGPD, pas technique.
- [x] A16. Lisibilité mesurée (scripts/mesurer-la-lisibilite.mjs) : 18 mots par phrase en moyenne, 66 % sous 21 mots. La longueur n'était pas le défaut. La phrase de 72 mots — une énumération — est devenue une liste rendue depuis la donnée.
