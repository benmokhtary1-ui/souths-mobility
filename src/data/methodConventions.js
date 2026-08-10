// Les choix structurants qui conditionnent la lecture de tous les chiffres :
// perimetre, definitions retenues, decoupages, dates de reference.

export const methodConventions = [
  {
    label: { fr: "Périmètre géographique", en: "Geographic perimeter" },
    value: { fr: "54 pays", en: "54 countries" },
    detail: {
      fr: "Le Sahara occidental n'est pas traité comme une entité distincte : il est intégré au Maroc, y compris dans les cartes. Ce choix est constant sur l'ensemble de la plateforme.",
      en: "Western Sahara is not treated as a separate entity: it is integrated into Morocco, including on maps. This choice is applied consistently across the platform."
    }
  },
  {
    label: { fr: "Découpage régional", en: "Regional breakdown" },
    value: { fr: "5 régions de l'UA", en: "5 AU regions" },
    detail: {
      fr: "La plateforme suit le découpage officiel de l'Union africaine, et non la nomenclature M49 des Nations unies. La Mauritanie est donc rattachée au Nord ; le Burundi et le Rwanda au Centre ; le Malawi, le Mozambique, la Zambie et le Zimbabwe au Sud.",
      en: "The platform follows the African Union's official breakdown rather than the UN M49 nomenclature: Mauritania is attached to the North, Burundi and Rwanda to Central, and Malawi, Mozambique, Zambia, and Zimbabwe to the South."
    }
  },
  {
    label: { fr: "Appartenance aux CER", en: "REC membership" },
    value: { fr: "Multiple assumée", en: "Multiple by design" },
    detail: {
      fr: "L'appartenance simultanée à plusieurs CER est la règle et non l'exception : elle est représentée telle quelle. Les retraits récents ou en cours sont signalés et datés plutôt que silencieusement appliqués.",
      en: "Simultaneous membership in several RECs is the rule, not the exception: it is represented as such. Recent or ongoing withdrawals are flagged and dated rather than silently applied."
    }
  },
  {
    label: { fr: "Échelles de l'indice AVOI", en: "AVOI index scales" },
    value: { fr: "0-100 / 0-1", en: "0-100 / 0-1" },
    detail: {
      fr: "Il s'agit du même indice d'ouverture des visas (BAD/CUA), stocké à l'échelle 0-100 au niveau des pays et 0-1 au niveau des CER. Les deux échelles ne sont jamais comparées directement dans un même graphique.",
      en: "This is the same visa openness index (AfDB/AUC), stored on a 0-100 scale at country level and 0-1 at REC level. The two scales are never compared directly within a single chart."
    }
  },
  {
    label: { fr: "Priorité définitionnelle", en: "Definitional priority" },
    value: { fr: "Instrument africain", en: "African instrument" },
    detail: {
      fr: "Pour toute notion juridique disposant à la fois d'une définition onusienne et d'une définition africaine, c'est la seconde qui fait référence : réfugié selon la Convention de l'OUA (1969), personne déplacée interne selon la Convention de Kampala (2009). La définition onusienne n'est citée qu'en comparaison. Les agrégats purement statistiques suivent en revanche UN DESA, condition de comparabilité internationale.",
      en: "For any legal concept holding both a UN and an African definition, the latter is the reference: refugee under the OAU Convention (1969), internally displaced person under the Kampala Convention (2009). The UN definition is cited only for comparison. Purely statistical aggregates, by contrast, follow UN DESA — a precondition for international comparability."
    }
  },
  {
    label: { fr: "Millésimes", en: "Vintages" },
    value: { fr: "Datés, non alignés", en: "Dated, not aligned" },
    detail: {
      fr: "Les séries ne partagent pas toutes la même année de référence. Chaque champ concerné porte son année d'observation (transferts de fonds, activité des migrants, ratifications). Aucune interpolation n'est pratiquée pour produire une homogénéité de façade.",
      en: "Series do not all share a reference year. Each affected field carries its own observation year (remittances, migrant activity, ratifications). No interpolation is applied to manufacture surface-level homogeneity."
    }
  },
  {
    label: { fr: "Chiffres non vérifiables", en: "Unverifiable figures" },
    value: { fr: "Datés et réservés", en: "Dated and caveated" },
    detail: {
      fr: "Lorsqu'un décompte exact ne peut être confirmé sur une source officielle, la plateforme affiche la dernière valeur vérifiée avec sa date et une réserve explicite — plutôt qu'une estimation lissée ou un chiffre arrondi sans provenance.",
      en: "When an exact count cannot be confirmed against an official source, the platform shows the last verified value with its date and an explicit caveat — rather than a smoothed estimate or a rounded figure without provenance."
    }
  },
  {
    label: { fr: "Seuil d'entrée en vigueur", en: "Entry-into-force threshold" },
    value: { fr: "15 ratifications", en: "15 ratifications" },
    detail: {
      fr: "Les instruments de l'UA soumis à ratification sont affichés en rouge tant qu'ils n'atteignent pas 15 États parties — seuil standard d'entrée en vigueur pour cette catégorie de protocoles — et en vert au-delà. Le seuil est stocké par instrument, non codé en dur.",
      en: "AU instruments subject to ratification display in red below 15 states parties — the standard entry-into-force threshold for this class of protocol — and green above it. The threshold is stored per instrument, not hard-coded."
    }
  },
  {
    label: { fr: "Dénomination des pays", en: "Country naming" },
    value: { fr: "Variantes réconciliées", en: "Reconciled variants" },
    detail: {
      fr: "Un même État peut porter des libellés différents selon le jeu de données (« RDC » / « R.D. Congo », « Cap-Vert » / « Cabo Verde »). Les deux formes restent affichées telles quelles ; la correspondance est assurée par une table d'alias, sans renommage des sources.",
      en: "A single state may carry different labels depending on the dataset (\"DRC\" / \"D.R. Congo\", \"Cape Verde\" / \"Cabo Verde\"). Both forms remain displayed as-is; matching is handled by an alias table, without renaming the sources."
    }
  },
  {
    label: { fr: "Affirmations évaluées", en: "Assessed claims" },
    value: { fr: "Formulées par l'auteur", en: "Authored in-house" },
    detail: {
      fr: "Les affirmations examinées dans Evidence Check sont rédigées par l'auteur pour illustrer des perceptions courantes ; ce ne sont pas des citations de médias ou d'institutions identifiés. Seules les sections « ce que montrent les données » sont sourcées institutionnellement.",
      en: "The claims examined in Evidence Check are written by the author to illustrate common perceptions; they are not quotations from identified media or institutions. Only the \"what the data shows\" sections carry institutional sourcing."
    }
  },
  {
    label: { fr: "Matrice d'indicateurs", en: "Indicator matrix" },
    value: { fr: "Proposition, non collecte", en: "Proposal, not collection" },
    detail: {
      fr: "Les 12 indicateurs alternatifs présentés plus bas sont une proposition méthodologique issue de la recherche doctorale, adressée aux instituts nationaux de statistique. Ils ne décrivent pas une réalité déjà mesurée à l'échelle continentale.",
      en: "The 12 alternative indicators presented below are a methodological proposal stemming from doctoral research, addressed to national statistical institutes. They do not describe a reality already measured at continental scale."
    }
  },
];
