# Multilingue — comment ajouter une langue

Le périmètre visé est celui de l'**article 25 de l'Acte constitutif de l'Union
africaine**, tel qu'amendé par le Protocole sur les amendements : arabe,
anglais, français, portugais, espagnol, kiswahili, et toute autre langue
africaine. Un site qui parle des mobilités africaines depuis les institutions
africaines se doit d'être lisible dans les langues de ces institutions.

## Le principe

Aucune chaîne du site n'est écrite en dur pour deux langues. Tout passe par des
dictionnaires `{ fr: '…', en: '…' }` et par `tr()`, qui choisit la bonne
branche et **replie sur le français puis l'anglais** quand la traduction
manque. Le lecteur voit donc toujours du texte, jamais un vide.

C'était le verrou : un `lang === 'fr' ? a : b` n'a que deux branches et devrait
être réécrit pour chaque langue ajoutée. Il n'en reste que deux dans tout le
code, tous deux porteurs de JSX.

## Ajouter une langue — la marche à suivre

1. **Déclarer la langue.** Elle figure déjà dans `LANGUES` (`langues.js`) avec
   son étiquette Intl, son sens de lecture et son endonyme. Rien à faire pour
   les six langues de l'UA.

2. **Traduire.** Ajouter la clé de langue à chaque dictionnaire :
   `{ fr: 'Gouvernance', en: 'Governance', ar: 'الحوكمة' }`. Les fichiers
   concernés sont `src/App.jsx` (l'objet `t`, les appels `L(...)` et `tr(...)`)
   et les modules de `src/data/`.

   Les appels positionnels acceptent un troisième argument nommé :
   ```js
   L('Gouvernance', 'Governance', { ar: 'الحوكمة', sw: 'Utawala' })
   ```

3. **Activer.** Ajouter le code à `ACTIVES` dans `langues.js`. Le sélecteur de
   la barre de navigation la propose alors automatiquement — il parcourt cette
   liste, il n'énumère rien en dur.

4. **Vérifier.**
   ```bash
   node scripts/verifier-i18n.cjs
   ```
   Le rapport donne le taux de préparation, les points à deux branches figées
   restants, et les utilitaires de mise en page qui ne se retourneraient pas en
   lecture droite-à-gauche.

## Droite à gauche

`appliquerLangue()` pose `lang` et `dir` sur `<html>`. Le reste suit tout seul :
les utilitaires de marge, de filet et d'alignement ont été convertis en
propriétés logiques (`ms-`/`me-`, `ps-`/`pe-`, `border-s`/`border-e`,
`text-start`/`text-end`, `start-`/`end-`), et les `space-x-*` portent
`rtl:space-x-reverse`. Vérifié : en basculant le document en `dir="rtl"`, les
marges passent bien de gauche à droite.

Reste à prévoir le jour où l'arabe sera activé : une police arabe (Schibsted
Grotesk ne couvre pas l'écriture arabe) et une relecture typographique des
chiffres, qui restent en Fraunces.

## Pluriels

Ne jamais construire « 3 pays » par concaténation. L'arabe compte six formes
grammaticales de pluriel, le français deux :

```js
pluriel(n, lang, {
  one:   '{n} pays',
  other: '{n} pays',
})
```

`Intl.PluralRules` désigne la forme, le catalogue la fournit.

## Nombres et dates

`localeOf(lang)` renvoie l'étiquette BCP-47 du registre. Les séparateurs de
milliers, les décimales et l'ordre des dates suivent donc la langue choisie,
sans réglage supplémentaire.
