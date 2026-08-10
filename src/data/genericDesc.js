// Descriptifs communs a plusieurs entrees. Utilises par diffusion (...genericDesc)
// a la fois par la base pays et par les agregats regionaux : ils doivent donc
// vivre dans un module a part, sinon l un des deux se retrouve sans eux — et le
// defaut ne se voit qu a l execution, jamais au build.

export const genericDesc = {
  evo_desc: { fr: "Proportion migratoirement stable rythmée par la démographie locale.", en: "Migratory proportion structurally stable, driven by local demography." },
  origDest: { fr: "Mobilités majoritairement de proximité et circulaires au sein de l'espace sous-régional (UA 2021).", en: "Predominantly proximity and circular mobilities within the sub-regional space (AU 2021)." },
  trigger: { fr: "Asymétries de développement et chocs climatiques.", en: "Development asymmetries and climate shocks." },
  response: { fr: "Déplacements transfrontaliers de travail et stratégies de survie.", en: "Cross-border labor displacements and survival strategies." },
  impact: { fr: "Résilience économique via les transferts de fonds (Remittances 86,4 Mrd $ - UA 2021).", en: "Economic resilience through remittances ($86.4B - AU 2021)." }
};
