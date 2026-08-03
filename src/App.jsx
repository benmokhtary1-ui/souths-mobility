import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, ShieldAlert, TrendingUp, MapPin, Database, 
  ArrowRight, Languages, Activity, Users, Scale, Leaf, 
  Search, HeartPulse, ChevronRight, ChevronDown, X, BarChart3, GitMerge, 
  Download, Printer, Map as MapIcon, Info, BookOpen, CheckCircle2, 
  PieChart, TableProperties, Landmark, Quote, Unlock, Target, ExternalLink, FileText, 
  Copy, Check, Mail
} from 'lucide-react';
import { evidenceCheckData } from './narrativesData';

// ============================================================================
// 1. FONCTIONS ET COMPOSANTS UTILITAIRES
// ============================================================================

const downloadCSV = (filename, csvBody) => {
  const blob = new Blob([String.fromCharCode(0xFEFF) + csvBody], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const formatNumber = (val) => {
  if (val === undefined || val === null) return "0";
  const strVal = String(val);
  if (strVal.includes('M') || strVal.includes('k')) return strVal;
  const num = parseInt(strVal.replace(/\s/g, ''), 10);
  if (isNaN(num)) return val;
  return num.toLocaleString('fr-FR'); 
};

const LinkedInIcon = ({ className = "w-3.5 h-3.5" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
  </svg>
);

const HistoricalChart = ({ data, colorClass }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => parseFloat(d.value))) * 1.5; 
  return (
    <div className="flex items-end justify-between h-24 w-full gap-2 mt-4 pt-4 border-b-2 border-slate-100 pb-2">
      {data.map((point, i) => {
        const heightPct = (parseFloat(point.value) / maxVal) * 100;
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
            <div 
              className={`w-full max-w-[32px] rounded-t-md transition-all duration-1000 ease-out cursor-pointer shadow-sm group-hover:shadow-md group-hover:opacity-80 ${colorClass} print:!bg-emerald-500`}
              style={{ height: `${Math.max(5, heightPct)}%` }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100 whitespace-nowrap">
                {parseFloat(point.value) > 100 
                  ? (parseFloat(point.value) >= 1000000 ? (parseFloat(point.value)/1000000).toFixed(1) + 'M' : (parseFloat(point.value)/1000).toFixed(0) + 'k') 
                  : point.value + '%'}
              </span>
            </div>
            <span className="text-[9px] font-black text-slate-400 mt-2">{point.year}</span>
          </div>
        );
      })}
    </div>
  );
};

const EconomicComparison = ({ remittances, remittancesYear, aid, lang }) => {
  const hasRemittances = remittances !== null && remittances !== undefined;
  const max = Math.max(hasRemittances ? remittances : 0, aid) * 1.1;
  const remPct = (!hasRemittances || max === 0) ? 0 : (remittances / max) * 100;
  const aidPct = max === 0 ? 0 : (aid / max) * 100;
  const remLabel = lang === 'fr'
    ? `Transferts des diasporas (BM, ${remittancesYear || 's.d.'})`
    : `Remittances (World Bank, ${remittancesYear || 'n.d.'})`;

  return (
    <div className="space-y-5 mt-4">
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-amber-600 print:!text-amber-600">{remLabel}</span>
          {hasRemittances ? (
            <span className="text-amber-700 print:!text-amber-700">{remittances}% PIB</span>
          ) : (
            <span className="text-slate-400 italic normal-case tracking-normal print:!text-slate-400">{lang === 'fr' ? "Donnée non disponible" : "Data not available"}</span>
          )}
        </div>
        {hasRemittances ? (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden print:!bg-slate-200">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-1000 print:!bg-amber-500" style={{width: `${remPct}%`}}></div>
          </div>
        ) : (
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-dashed border-slate-300 print:!bg-slate-200" title={lang === 'fr' ? "La Banque Mondiale ne publie plus de série récente pour ce pays" : "The World Bank no longer publishes a recent series for this country"}></div>
        )}
      </div>
      <div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1.5">
          <span className="text-slate-500 print:!text-slate-500">{lang === 'fr' ? "Aide Internationale - APD (OCDE, 2024)" : "International Aid - ODA (OECD, 2024)"}</span>
          <span className="text-slate-600 print:!text-slate-600">{aid}% PIB</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden print:!bg-slate-200">
          <div className="h-full bg-slate-400 rounded-full transition-all duration-1000 print:!bg-slate-400" style={{width: `${aidPct}%`}}></div>
        </div>
      </div>
    </div>
  );
};

const PageHeader = ({ badge, title, highlight, desc }) => (
  <header className="bg-[#0f172a] text-white py-14 px-6 lg:px-10 relative overflow-hidden rounded-xl border border-blue-900/50 shadow-lg mb-8">
    <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-[0.02] pointer-events-none">
      <Globe className="w-[400px] h-[400px]" />
    </div>
    <div className="relative z-10 max-w-4xl">
      <div className="inline-block px-3 py-1 rounded-sm bg-blue-900/50 border border-blue-800 text-[10px] font-bold text-blue-200 mb-4 uppercase tracking-widest shadow-sm">
        {badge}
      </div>
      <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-[1.2] tracking-tight">
        {title} <br/>
        <span className="text-blue-300 italic font-normal">
          {highlight}
        </span>
      </h1>
      <p className="text-slate-300 text-base leading-relaxed font-medium">
        {desc}
      </p>
    </div>
  </header>
);

// ============================================================================
// 2. DONNÉES STATIQUES
// ============================================================================

const t = {
    fr: {
      title: "South(s) Mobility",
      subtitle: "DataHub",
      desc: "Analyse citoyenne des migrations mondiales. Une lecture empirique et décolonisée privilégiant la proportionnalité, la gouvernance de l'Union Africaine (CUA) et les dynamiques de transition démographique.",
      sidebar: { title: "Niveaux d'Analyse", subregion: "Sous-région", search: "Rechercher un pays..." },
      all_regions: "Toute l'Afrique",
      perspectives: { continent: "Perspective Continentale", subregion: "Perspective Sous-Régionale" },
      badge: { regional: "Données Macro-Régionales & Gouvernance UA", country: "Profil National" },
      regions: {
        af_med: "Afrique Méditerranéenne", 
        af_west: "Afrique de l'Ouest", 
        af_south: "Afrique Australe", 
        af_east: "Afrique de l'Est", 
        af_central: "Afrique Centrale"
      },
      metrics: { stock: "Stock Total (2024)", female: "Parité (Femmes % 2024)", evolution: "Part Pop. Nationale (2024)" },
      comparative_view_title: "Analyse Comparative : Transition Démographique & Résilience Sud-Sud",
      comparative_view_desc: "Selon le 3e Rapport sur les statistiques migratoires de l'UA (2021) et UNDESA (2024), la dynamique démographique africaine alimente à 70% les marchés du travail régionaux internes. La part des migrants internationaux reste structurellement stable (~1,9% de la population continentale) depuis 1990.",
      modal: {
        close: "Fermer", tabs: { demo: "Démographie", geo: "Géographie & Flux", econ: "Économie & Droits" },
        south_view: "Perspective Analytique des Suds",
        evo_title: "La constante proportionnelle (1990-2024)", parity: "Féminisation des flux (UNDESA 2024)", retention_title: "Rétention Régionale Sud-Sud (UA 2021)",
        orig_dest_title: "Dynamiques de Transition & Proximité", econ_title: "Indépendance Économique & Transferts",
        causal_chain: "Chaîne de causes systémiques", trigger: "Déclencheur", response: "Réponse Migratoire", impact: "Impact Socio-économique",
        data_source: "Sources : UNDESA (2024) / Rapport UA-OIT-OIM-CEA (2021) / IDMC (2025) / UNHCR (2025) / OIT NORMLEX (2025)", export_csv: "Exporter (CSV)", export_pdf: "Rapport (PDF)",
        raw_data_title: "Fiche de Données Brutes", infographic_title: "Infographie : Répartition des Flux",
        idp_title: "Protection & Déplacements Forcés (IDMC/UNHCR 2025)", idp_desc: "L'essentiel de la mobilité contrainte africaine est absorbé à l'intérieur des frontières nationales ou dans les pays limitrophes.",
        idp_conflict: "Déplacés Internes Conflits (IDMC 2025)", idp_disaster: "Déplacés Internes Climat (IDMC 2025)",
        hcr_hosted: "Réfugiés internationaux accueillis (UNHCR 2025)",
        avoi_title: "Intégration Régionale - Indice AVOI (BAD 2024)", avoi_desc: "Score d'ouverture des frontières aux ressortissants africains.",
        au_instruments: "Traités & Conventions Clés de l'Union Africaine (État de ratification 2025)"
      },
      sections: { 
        debunk: "Déconstruction Factuelle des Narratifs", 
        global: "Perspective Globale des Stocks Migratoires (UNDESA, 2024)", 
        explorer: "Explorateur Analytique & Données Consolidées", 
        data: "Cadre d'Indicateurs Recommandés", 
        sdg_gcm: "Alignement ODD (SDGs 2030) & Pactes Mondiaux (GCM / GCR 2018)",
        about_title: "À Propos du Projet", 
        method_title: "Ingénierie & Source des Données" 
      },
      headers: {
        explorer: {
          badge: "Explorateur Macrorégional & National",
          title: "Cartographier et analyser",
          highlight: "les dynamiques de mobilité.",
          desc: "Consultez les profils détaillés par pays ou par sous-région, intégrant les indicateurs de stock démographique, de parité, de rétention sud-sud et les ratifications des traités."
        },
        governance: {
          badge: "Gouvernance & Cadres Stratégiques",
          title: "Architecture panafricaine",
          highlight: "et cadres internationaux.",
          desc: "Explorez l'ancrage multiniveaux de la gouvernance des mobilités, de l'Union africaine et ses blocs régionalisés (CER) jusqu'aux pactes et objectifs mondiaux."
        },
        library: {
          badge: "Centre Documentaire",
          title: "Bibliothèque",
          highlight: "et ressources analytiques.",
          desc: "Un accès centralisé aux rapports de référence, notes de politique (policy briefs), thèses et publications sur la géopolitique des mobilités dans les Suds."
        },
        methodology: {
          badge: "Rigueur & Transparence",
          title: "Ingénierie méthodologique",
          highlight: "et cadre d'indicateurs.",
          desc: "Découvrez l'architecture scientifique du DataHub, le processus d'harmonisation des données officielles et la matrice des indicateurs alternatifs pour objectiver les mobilités."
        }
      },
      global_stats: {
        world: "Total Mondial (2024)", europe: "Europe (2024)", asia: "Asie (2024)", na: "Amérique du Nord (2024)", africa: "Afrique (2024)", latam: "Amérique Latine (2024)", share: "Part mondiale :",
        note: "Données UNDESA (2024) : L'Afrique ne représente que 9,5% du stock migratoire mondial (28,5 M), loin derrière l'Europe (94 M) et l'Asie (92 M)."
      },
      sdg_section: {
        title: "Ancrage International : ODD (2030), GCM (2018) & GCR (2018)",
        subtitle: "L'Agenda 2030 de l'ONU, le Pacte de Marrakech pour les Migrations (GCM) et le Pacte sur les Réfugiés (GCR).",
        tab_sdg: "Objectifs de Développement Durable (ODD)",
        tab_gcm: "Pacte Mondial pour les Migrations (GCM)",
        tab_gcr: "Pacte Mondial sur les Réfugiés (GCR)",
        sdg_desc: "L'Agenda 2030 de l'ONU intègre formellement les mobilités comme accélérateur de développement. La Cible 17.18 impose la désagrégation des données statistiques par statut migratoire.",
        gcm_desc: "Adopté à Marrakech en 2018, le Pacte Mondial pour des Migrations Sûres, Ordonnées et Régulières énonce 23 objectifs structurants axés sur la souveraineté, les droits et la coopération factuelle.",
        gcr_desc: "Affirmé en 2018, le Pacte Mondial sur les Réfugiés (GCR) établit un cadre de partage équitable des charges pour soutenir les pays du Sud qui accueillent 76% des réfugiés mondiaux.",
        link_text: "Accéder au portail officiel",
        sdg_points: [
          { title: "Cible 10.7 (Gouvernance des migrations)", desc: "Faciliter une migration ordonnée, sûre, régulière et responsable grâce à des politiques planifiées et bien gérées." },
          { title: "Cible 10.c (Réduction des coûts de transfert)", desc: "Ramener à moins de 3% les coûts de transaction des envois de fonds des diasporas (Banque Mondiale)." },
          { title: "Cible 17.18 (Désagrégation des données)", desc: "Renforcer les capacités statistiques nationales pour ventiler les données selon le statut migratoire." },
          { title: "Cible 8.8 (Droits des travailleurs migrants)", desc: "Protéger les droits du travail et promouvoir un environnement sûr pour tous les travailleurs migrants (OIT)." }
        ],
        gcm_objectives_list: [
          { num: "Obj. 1", title: "Données factuelles", desc: "Recueillir et utiliser des données factuelles et ventilées pour l'élaboration de politiques." },
          { num: "Obj. 2", title: "Causes structurelles", desc: "Minimiser les facteurs défavorables et structurels qui poussent les personnes à quitter leur pays." },
          { num: "Obj. 3", title: "Information et orientation", desc: "Fournir aux migrants des informations exactes et en temps voulu à toutes les étapes de la migration." },
          { num: "Obj. 4", title: "Preuve d'identité légale", desc: "Veiller à ce que tous les migrants disposent d'une preuve d'identité légale et de documents adéquats." },
          { num: "Obj. 5", title: "Voies de migration régulière", desc: "Améliorer et élargir les voies d'accès à la migration régulière et sûre." },
          { num: "Obj. 6", title: "Recrutement équitable", desc: "Favoriser un recrutement équitable et éthique et interdire les frais facturés aux travailleurs." },
          { num: "Obj. 7", title: "Vulnérabilités", desc: "Réduire les vulnérabilités dans le contexte de la migration à travers des réponses axées sur les droits." },
          { num: "Obj. 8", title: "Sauver des vies", desc: "Saluer et intensifier la recherche et le sauvetage conjoints des migrants en détresse." },
          { num: "Obj. 9", title: "Trafic illicite", desc: "Renforcer la coopération internationale pour lutter contre le trafic illicite de migrants." },
          { num: "Obj. 10", title: "Traite des êtres humains", desc: "Prévenir et combattre la traite dans le contexte de la migration internationale." },
          { num: "Obj. 11", title: "Gestion des frontières", desc: "Gérer les frontières de manière intégrée, sûre et coordonnée tout en respectant les droits." },
          { num: "Obj. 12", title: "Séjour régulier", desc: "Accroître la certitude et la prévisibilité des procédures de migration pour un séjour régulier." },
          { num: "Obj. 13", title: "Détention administrative", desc: "Recourir à la détention des migrants qu'en dernier ressort et chercher des solutions alternatives." },
          { num: "Obj. 14", title: "Protection consulaire", desc: "Renforcer la protection, l'assistance et la coopération consulaires." },
          { num: "Obj. 15", title: "Services de base", desc: "Garantir aux migrants l'accès aux services de base (santé, éducation, protection sociale)." },
          { num: "Obj. 16", title: "Intégration et cohésion", desc: "Favoriser l'inclusion à long terme et la cohésion sociale dans les sociétés d'accueil." },
          { num: "Obj. 17", title: "Élimination des discriminations", desc: "Éliminer toutes les formes de discrimination et promouvoir un discours public factuel." },
          { num: "Obj. 18", title: "Compétences", desc: "Investir dans le développement des compétences et faciliter la reconnaissance mutuelle des qualifications." },
          { num: "Obj. 19", title: "Diasporas", desc: "Créer conditions propices pour que les diasporas contribuent pleinement au développement durable." },
          { num: "Obj. 20", title: "Transferts de fonds", desc: "Promouvoir des transferts de fonds rapides, sûrs et moins coûteux et stimuler l'inclusion financière." },
          { num: "Obj. 21", title: "Retour et réadmission", desc: "Coopérer pour assurer un retour et une réadmission sûrs et dignes, ainsi qu'une réintégration durable." },
          { num: "Obj. 22", title: "Sécurité sociale", desc: "Établir des mécanismes de portabilité des droits sociaux et des prestations de retraite." },
          { num: "Obj. 23", title: "Coopération internationale", desc: "Renforcer la coopération internationale et les partenariats mondiaux pour une migration sûre." }
        ],
        gcr_objectifs: [
          { title: "1. Alléger la pression sur les pays d'accueil", desc: "Soutenir structurellement les pays du Sud (Ouganda, Tchad, Soudan) qui accueillent l'immense majorité des réfugiés." },
          { title: "2. Renforcer l'autonomie des réfugiés", desc: "Favoriser l'accès au marché du travail national et sortir des logiques de camps fermés." },
          { title: "3. Élargir les solutions dans les pays tiers", desc: "Accroître les voies régulières (réinstallation, parrainage, visas d'études et de travail)." },
          { title: "4. Soutenir les conditions de retour", desc: "Créer un cadre favorable aux retours volontaires, sûrs et dignes lorsque la situation le permet." }
        ]
      },
      indicator_desc: "Matrice méthodologique recommandée pour objectiver la gouvernance des mobilités et orienter la collecte d'Open Data sur le terrain.",
      download_indicators: "Télécharger la Matrice (CSV)",
      debunk_cards: [
        { myth: "L'explosion migratoire africaine incontournable.", real: "Stabilité de la proportion continentale (~1,9%).", stat_text: "1.9% (2024)", stat_val: 1.9, color: "bg-blue-700", desc: "UNDESA (2024) : La part des migrants internationaux africains dans la population du continent stagne autour de 1,9% depuis 1990. La hausse du volume absolu est un simple reflet de la croissance démographique globale." },
        { myth: "L'Afrique migre massivement vers l'Europe.", real: "Les migrations intra-africaines dominent à 70%.", stat_text: "70% (2021)", stat_val: 70, color: "bg-teal-700", desc: "Rapport UA/OIT (2021) : 70% des mobilités internationales africaines s'effectuent au sein du continent même (ex: Côte d'Ivoire, Afrique du Sud, Nigéria)." },
        { myth: "Le Nord accueille l'écrasante majorité des réfugiés.", real: "76% des réfugiés restent dans les pays du Sud.", stat_text: "76% (2025)", stat_val: 76, color: "bg-amber-700", desc: "UNHCR (2025) : Plus des trois quarts des personnes fuyant les conflits armés trouvent refuge dans un pays frontalier en développement (ex: Ouganda, Tchad, Éthiopie)." },
        { myth: "La migration africaine est quasi-exclusivement masculine.", real: "Féminisation structurelle des flux (45% à 47%).", stat_text: "47% (2024)", stat_val: 47, color: "bg-purple-700", desc: "UNDESA (2024) / UA (2021) : Les femmes représentent près de la moitié des migrants internationaux en Afrique, redéfinissant l'économie autonome du soin et du commerce transfrontalier." },
        { myth: "L'Afrique dépend financièrement de l'Aide Publique.", real: "86,4 milliards $ d'envois de fonds dépassent l'APD.", stat_text: "86.4 Mrd $ (2019)", stat_val: 85, color: "bg-amber-600", desc: "Banque Mondiale / UA (2021) : Les transferts de la diaspora (86,4 Mrd $ en 2019) dépassent largement l'Aide Publique au Développement (APD) et constituent le premier capital de résilience." },
        { myth: "Le changement climatique va vider l'Afrique vers le Nord.", real: ">90% des déplacements climatiques sont internes.", stat_text: ">90% (2025)", stat_val: 90, color: "bg-cyan-700", desc: "IDMC (2025) : Plus de 90% des personnes déplacées par des chocs climatiques (sécheresses, inondations) restent au sein de leurs frontières nationales ou sous-régionales." },
        { myth: "Les pays d'Afrique côtière ne sont que de simples zones de transit.", real: "Transformation structurelle en pays de destination.", stat_text: "Mutation (2024)", stat_val: 65, color: "bg-indigo-700", desc: "Les données d'installation démontrent que les pays autrefois qualifiés de 'transit' deviennent des pôles d'ancrage économique durable pour la main-d'œuvre régionale." },
        { myth: "Le développement économique stoppe mécaniquement les départs.", real: "Le paradoxe de la transition (Migration Hump).", stat_text: "Catalyseur (2024)", stat_val: 80, color: "bg-rose-700", desc: "Démontré empiriquement : l'augmentation initiale des revenus fournit aux ménages le capital financier nécessaire pour financer un projet migratoire régulier." },
        { myth: "Les travailleurs migrants sont un fardeau pour le pays hôte.", real: "Moteurs de l'emploi et de la valeur ajoutée locale.", stat_text: "+ Valeur (2021)", stat_val: 85, color: "bg-emerald-700", desc: "Rapport UA/OIT (2021) : 27,5% des migrants occupés travaillent dans l'agriculture et comblent des pénuries de main-d'œuvre tout en dynamisant les marchés locaux." }
      ],
      about: {
        intro_title: "À propos de South(s) Mobility",
        intro_subtitle: "Une infrastructure ouverte pour comprendre les mobilités dans les Suds",
        intro_p1: "South(s) Mobility DataHub est une plateforme indépendante de recherche, de données et de visualisation consacrée aux mobilités humaines dans les Suds, avec une première focalisation sur l'Afrique.",
        intro_p2: "À l'intersection des sciences sociales, de la science des données et des études sur les migrations, la plateforme rassemble, harmonise et valorise des données, indicateurs, cartes, publications, instruments juridiques et ressources documentaires provenant d'institutions internationales, régionales et nationales.",
        intro_p3: "Son ambition est de rendre les données sur les mobilités humaines plus accessibles, plus comparables et plus intelligibles, afin de favoriser une compréhension empirique, nuancée et documentée des dynamiques migratoires contemporaines.",
        
        research_title: "Une plateforme née de la recherche",
        research_p1: "South(s) Mobility est issu d'un projet de recherche doctorale consacré à la gouvernance des migrations africaines.",
        research_p2: "Au cours de cette recherche, un constat s'est imposé : une grande quantité de données de qualité est déjà produite par des institutions publiques et internationales, mais ces ressources demeurent largement dispersées, hétérogènes et parfois difficiles d'accès. Les croiser, les contextualiser ou simplement les retrouver représente souvent un travail considérable.",
        research_p3: "South(s) Mobility est né de cette observation. Le projet vise à rassembler ces ressources dans un environnement unique, ouvert et évolutif afin de faciliter leur consultation, leur comparaison et leur réutilisation par les chercheurs, les étudiants, les journalistes, les décideurs publics, les organisations internationales et l'ensemble des personnes intéressées par les mobilités humaines.",
        research_p4: "Il s'inscrit dans une démarche de science ouverte (Open Science), de diffusion des connaissances et de valorisation de la recherche.",

        data_title: "Une approche fondée sur les données",
        data_p1: "Le projet privilégie une approche empirique, transparente et méthodologiquement rigoureuse. Les données et ressources présentées proviennent principalement d'organisations reconnues, notamment :",
        data_list: [
          { name: "Commission de l'Union africaine (AUC)", url: "https://au.int/fr" },
          { name: "Nations Unies (UN DESA, UNHCR, OIM, OIT…)", url: "https://www.un.org/fr" },
          { name: "Banque mondiale", url: "https://data.worldbank.org/" },
          { name: "Banque africaine de développement", url: "https://www.afdb.org/fr" },
          { name: "OCDE", url: "https://data.oecd.org/" },
          { name: "Internal Displacement Monitoring Centre (IDMC)", url: "https://www.internal-displacement.org/" },
          { name: "Communautés économiques régionales africaines", url: "https://au.int/fr/organs/recs" },
          { name: "Instituts nationaux de statistique", url: null }
        ],
        data_p2: "Chaque jeu de données conserve sa source d'origine. Lorsque plusieurs institutions proposent des estimations différentes, ces divergences sont signalées et replacées dans leur contexte méthodologique. Les limites des données sont indiquées autant que possible afin de favoriser une lecture critique et éclairée.",
        data_p3: "South(s) Mobility ne produit pas de statistiques officielles. La plateforme agit comme une infrastructure de consolidation, de contextualisation et de diffusion des connaissances.",

        south_title: "Une perspective ancrée dans les Suds",
        south_p1: "South(s) Mobility adopte une perspective centrée sur les Suds, en accordant une attention particulière aux dynamiques souvent moins visibles dans les bases de données internationales. Cela inclut notamment :",
        south_list: [
          "Les migrations intra-africaines",
          "Les mobilités Sud-Sud",
          "Les communautés économiques régionales africaines",
          "Les instruments juridiques continentaux",
          "Les politiques africaines de mobilité",
          "Les corridors régionaux",
          "Les diasporas",
          "Les déplacements internes",
          "Les connaissances produites depuis les institutions et les chercheurs des Suds"
        ],
        south_p2: "À plus long terme, cette approche a vocation à être progressivement étendue à d'autres régions du monde, notamment l'Amérique latine, les Caraïbes et l'Asie.",

        evolution_title: "Une plateforme en évolution permanente",
        evolution_p1: "South(s) Mobility est un projet évolutif. De nouvelles bases de données, cartes interactives, tableaux de bord, visualisations, fiches méthodologiques, analyses, référentiels documentaires et outils de recherche sont ajoutés régulièrement. Les développements en cours comprennent notamment :",
        evolution_list: [
          "Un Observatoire des narratifs sur les migrations",
          "Des profils pays",
          "Des profils des communautés économiques régionales",
          "Un référentiel des instruments juridiques africains",
          "Une bibliothèque documentaire",
          "Des séries chronologiques harmonisées",
          "Des tableaux de bord interactifs",
          "De nouveaux indicateurs comparatifs"
        ],
        evolution_p2: "L'objectif est de construire progressivement une infrastructure de référence pour l'étude des mobilités humaines dans les Suds.",

        founder_title: "À propos du fondateur",
        founder_p1: "South(s) Mobility a été fondé par Yassine Ben Mokhtar, doctorant en relations internationales dont les recherches portent sur la gouvernance des migrations africaines, les dynamiques institutionnelles continentales et les politiques de mobilité.",
        founder_p2: "Le projet s'appuie sur plusieurs années de recherche académique, d'analyse documentaire et de terrain, ainsi que sur une expérience professionnelle auprès d'institutions travaillant sur les questions migratoires et de gouvernance en Afrique.",
        founder_p3: "South(s) Mobility constitue à la fois un prolongement de cette recherche et une initiative de valorisation scientifique destinée à rendre les connaissances, les données et les ressources plus accessibles au plus grand nombre.",
        founder_p4: "Les analyses, interprétations et éventuelles erreurs relèvent de la seule responsabilité de son auteur et n'engagent aucune institution avec laquelle il a collaboré.",

        collab_title: "Collaborer & Contact",
        collab_p1: "South(s) Mobility est ouvert aux collaborations académiques, institutionnelles et techniques. Les propositions de jeux de données, publications, visualisations, corrections, projets communs ou partenariats sont les bienvenues.",
        contact_p: "Pour toute question, proposition de collaboration ou contribution au projet :",
        disclaimer: "South(s) Mobility est un projet indépendant en développement actif. Les contenus, fonctionnalités et jeux de données sont régulièrement enrichis afin d'améliorer la couverture, la qualité et l'accessibilité des informations disponibles.",
        
        citation_title: "Pour citer ce projet :",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub : Une infrastructure ouverte pour comprendre les mobilités dans les Suds. Récupéré de https://southsmobility.vercel.app/"
      },
      method: { 
        summary: "Architecture méthodologique fondée sur la consolidation et l'harmonisation de bases de données certifiées :",
        m1: "Extraction & Harmonisation : Traitement croisé des recensements nationaux et des registres de la CUA, OIT, UNHCR, IDMC et UNDESA.", 
        m2: "Analyse Proportionnelle : Normalisation des flux et stocks par rapport à la population globale et active.", 
        m3: "Évaluation Juridique : Recensement des ratifications des traités phares de l'Union Africaine et des conventions NORMLEX de l'OIT.",
        m4: "Open Source & Indépendance : Code source ouvert et souveraineté complète du traitement des données.",
        sources_title: "Accès aux Datasets Originaux, Rapports & Cadres Légaux :",
        s1: "Union Africaine & CUA / OIT / OIM / CEA - 3e Rapport sur les statistiques migratoires (2021)",
        s2: "UNDESA - Stock migratoire mondial (2024)",
        s3: "UNHCR - Global Trends Report (2025)",
        s4: "IDMC - GRID Report (2025)",
        s5: "OIM - World Migration Report (2024)",
        s6: "OIT NORMLEX - Normes Internationales du Travail (2025)",
        s7: "Union Africaine - Traités, Conventions et Protocoles (2025)",
        s8: "Banque Mondiale - Base de données des transferts de fonds (2024)"
      },
      myth: "Postulat", reality: "Donnée Factuelle",
      footer: { tag: "L'ingénierie des données au service d'un nouveau récit factuel sur les mobilités.", sources: "Sources : UA / OIT / OIM / CEA (2021) • UN DESA (2024) • UNHCR (2025) • IDMC (2025) • OIT NORMLEX (2025) • Banque Mondiale (2024)" },
      analysis_title: "Tableau de Bord Détaillé", analysis_btn: "Accéder au rapport",
      hero_title: "Objectiver les mobilités", hero_highlight: "par la science des données."
    },
    en: {
      title: "South(s) Mobility", subtitle: "DataHub",
      desc: "Citizen analysis of global migrations. An empirical, decolonized reading prioritizing mathematical proportionality, African Union (AU) governance frameworks, and demographic transition dynamics.",
      sidebar: { title: "Analysis Levels", subregion: "Sub-region", search: "Search country..." },
      all_regions: "All Africa",
      perspectives: { continent: "Continental Perspective", subregion: "Sub-regional Perspective" },
      badge: { regional: "Macro-Regional Data & AU Governance", country: "National Profile" },
      regions: { 
        af_med: "Mediterranean Africa", 
        af_west: "West Africa", 
        af_south: "Southern Africa", 
        af_east: "East Africa", 
        af_central: "Central Africa" 
      },
      metrics: { stock: "Total Stock (2024)", female: "Parity (Women % 2024)", evolution: "Nat. Pop. Share (2024)" },
      comparative_view_title: "Comparative Analysis: Demographic Transition & South-South Resilience",
      comparative_view_desc: "According to the 3rd AU Labour Migration Report (2021) and UNDESA (2024), African demographic dynamics feed 70% into internal regional labor markets. The international migrant share remains structurally stable (~1.9% of total continental population) since 1990.",
      modal: { 
        close: "Close", tabs: { demo: "Demography", geo: "Geography & Flows", econ: "Economy & Treaties" }, 
        south_view: "Analytical Perspective", evo_title: "The Proportional Constant (1990-2024)", parity: "Feminization of flows (UNDESA 2024)", retention_title: "Regional South-South Retention (AU 2021)", orig_dest_title: "Transition & Proximity Dynamics", econ_title: "Economic Independence & Remittances", 
        causal_chain: "Systemic Causal Chain", trigger: "Trigger", response: "Migratory Response", impact: "Socio-economic Impact", 
        data_source: "Sources: UNDESA (2024) / AU-ILO-IOM-ECA Report (2021) / IDMC (2025) / UNHCR (2025) / ILO NORMLEX (2025)", export_csv: "Export (CSV)", export_pdf: "Report (PDF)", 
        raw_data_title: "Raw Data Sheet", infographic_title: "Infographic: Flow Distribution",
        idp_title: "Protection & Forced Displacement (IDMC/UNHCR 2025)", idp_desc: "The vast majority of African forced mobility is absorbed within national borders or neighboring countries.", 
        idp_conflict: "Internally Displaced Conflict (IDMC 2025)", idp_disaster: "Internally Displaced Climate (IDMC 2025)",
        hcr_hosted: "International Refugees Hosted (UNHCR 2025)",
        avoi_title: "Regional Integration - AVOI Index (AfDB 2024)", avoi_desc: "Visa openness index for citizens of other African countries.",
        au_instruments: "Key African Union Treaties & Conventions (Ratification Status 2025)"
      },
      sections: { 
        debunk: "Factual Deconstruction of Narratives", 
        global: "Global Perspective of Migrant Stocks (UNDESA, 2024)", 
        explorer: "Analytical Explorer & Consolidated Data", 
        data: "Recommended Indicators Framework", 
        sdg_gcm: "SDG Alignment (SDGs 2030) & Global Compacts (GCM / GCR 2018)",
        about_title: "About the Project", 
        method_title: "Engineering & Data Sourcing" 
      },
      headers: {
        explorer: {
          badge: "Macro-Regional & National Explorer",
          title: "Mapping and analyzing",
          highlight: "mobility dynamics.",
          desc: "Explore detailed country or sub-regional profiles featuring demographic stocks, gender parity, South-South retention rates, and treaty ratifications."
        },
        governance: {
          badge: "Governance & Strategic Frameworks",
          title: "Pan-African architecture",
          highlight: "and international frameworks.",
          desc: "Explore the multilevel anchoring of mobility governance, from the African Union and its regional building blocks (RECs) to global compacts and goals."
        },
        library: {
          badge: "Documentary Center",
          title: "Library",
          highlight: "and analytical resources.",
          desc: "Centralized access to reference reports, policy briefs, theses, and publications on mobility geopolitics in the Global South."
        },
        methodology: {
          badge: "Rigor & Transparency",
          title: "Methodological engineering",
          highlight: "and indicators framework.",
          desc: "Explore the scientific architecture of the DataHub, the official data harmonization process, and alternative indicators for objective mobility analysis."
        }
      },
      global_stats: {
        world: "Global Total (2024)", europe: "Europe (2024)", asia: "Asia (2024)", na: "North America (2024)", africa: "Africa (2024)", latam: "Latin America (2024)", share: "Global share:",
        note: "UNDESA (2024) Data: Africa accounts for only 9.5% of the global migrant stock (28.5M), well behind Europe (94M) and Asia (92M)."
      },
      sdg_section: {
        title: "International Frameworks: SDGs (2030), GCM (2018) & GCR (2018)",
        subtitle: "The UN 2030 Agenda, the Marrakech Global Compact for Migration (GCM), and the Global Compact on Refugees (GCR).",
        tab_sdg: "Sustainable Development Goals (SDGs)",
        tab_gcm: "Global Compact for Migration (GCM)",
        tab_gcr: "Global Compact on Refugees (GCR)",
        sdg_desc: "The UN 2030 Agenda officially incorporates mobility as a driver of sustainable development. Target 17.18 mandates data disaggregation by migratory status.",
        gcm_desc: "Adopted in Marrakech in 2018, the Global Compact for Safe, Orderly and Regular Migration outlines 23 objectives centered on sovereignty, rights, and factual cooperation.",
        gcr_desc: "Affirmed in 2018, the Global Compact on Refugees (GCR) provides a framework for equitable responsibility-sharing to support Southern countries hosting 76% of world refugees.",
        link_text: "Access official portal",
        sdg_points: [
          { title: "Target 10.7 (Migration Governance)", desc: "Facilitate orderly, safe, regular and responsible migration through planned and well-managed policies." },
          { title: "Target 10.c (Remittance Costs)", desc: "Reduce transaction costs of diaspora remittances to less than 3% (World Bank)." },
          { title: "Target 17.18 (Data Disaggregation)", desc: "Enhance national statistical capacities to disaggregate data by migratory status." },
          { title: "Target 8.8 (Migrant Workers' Rights)", desc: "Protect labor rights and promote safe working environments for all migrant workers (ILO)." }
        ],
        gcm_objectives_list: [
          { num: "Obj. 1", title: "Factual Data", desc: "Collect and utilize factual and disaggregated data for policy making." },
          { num: "Obj. 2", title: "Structural Drivers", desc: "Minimize adverse drivers and structural factors that compel people to leave their country." },
          { num: "Obj. 3", title: "Information & Guidance", desc: "Provide migrants with accurate and timely information at all stages of migration." },
          { num: "Obj. 4", title: "Legal Identity", desc: "Ensure that all migrants have proof of legal identity and adequate documentation." },
          { num: "Obj. 5", title: "Regular Pathways", desc: "Enhance availability and flexibility of pathways for regular migration." },
          { num: "Obj. 6", title: "Fair Recruitment", desc: "Facilitate fair and ethical recruitment and safeguard conditions that secure decent work." },
          { num: "Obj. 7", title: "Vulnerabilities", desc: "Address and reduce vulnerabilities in migration through rights-based approaches." },
          { num: "Obj. 8", title: "Save Lives", desc: "Save lives and establish coordinated international efforts on missing migrants." },
          { num: "Obj. 9", title: "Smuggling", desc: "Strengthen the transnational response to smuggling of migrants." },
          { num: "Obj. 10", title: "Human Trafficking", desc: "Prevent, combat and eradicate trafficking in persons in the context of international migration." },
          { num: "Obj. 11", title: "Border Management", desc: "Manage borders in an integrated, secure and coordinated manner while safeguarding rights." },
          { num: "Obj. 12", title: "Regular Stay", desc: "Strengthen certainty and predictability in migration procedures for adequate screening and referral." },
          { num: "Obj. 13", title: "Administrative Detention", desc: "Use migration detention only as a measure of last resort and work towards alternatives." },
          { num: "Obj. 14", title: "Consular Protection", desc: "Enhance consular protection, assistance and cooperation throughout the migration cycle." },
          { num: "Obj. 15", title: "Basic Services", desc: "Provide access to basic services for migrants regardless of their migratory status." },
          { num: "Obj. 16", title: "Empowerment & Inclusion", desc: "Empower all migrants and societies to realize full inclusion and social cohesion." },
          { num: "Obj. 17", title: "Eliminate Discrimination", desc: "Eliminate all forms of discrimination and promote evidence-based public discourse." },
          { num: "Obj. 18", title: "Skills", desc: "Invest in skills development and facilitate mutual recognition of work qualifications." },
          { num: "Obj. 19", title: "Diasporas", desc: "Create conditions for diasporas to fully contribute to sustainable development in all countries." },
          { num: "Obj. 20", title: "Remittances", desc: "Promote faster, safer and cheaper transfer of remittances and foster financial inclusion." },
          { num: "Obj. 21", title: "Return & Readmission", desc: "Cooperate in safe and dignified return and readmission, as well as sustainable reintegration." },
          { num: "Obj. 22", title: "Social Security", desc: "Establish mechanisms for the portability of social security entitlements and earned benefits." },
          { num: "Obj. 23", title: "International Cooperation", desc: "Strengthen international cooperation and global partnerships for safe, orderly and regular migration." }
        ],
        gcr_objectifs: [
          { title: "1. Ease pressures on host countries", desc: "Structurally support Southern nations (Uganda, Chad, Sudan) hosting the vast majority of refugees." },
          { title: "2. Enhance refugee self-reliance", desc: "Foster access to national labor markets and shift away from closed camp dependency." },
          { title: "3. Expand third-country solutions", desc: "Increase regular pathways (resettlement, private sponsorship, study and work visas)." },
          { title: "4. Support conditions for return", desc: "Create favorable conditions for voluntary, safe, and dignified returns when feasible." }
        ]
      },
      indicator_desc: "Recommended methodological matrix to objectify mobility governance and guide field Open Data collection.",
      download_indicators: "Download Matrix (CSV)",
      debunk_cards: [
        { myth: "Unstoppable African migration explosion.", real: "Continental proportion remains stable (~1.9%).", stat_text: "1.9% (2024)", stat_val: 1.9, color: "bg-blue-700", desc: "UNDESA (2024): The proportion of international African migrants relative to the continent's population has hovered around 1.9% since 1990. Absolute volume increases reflect total population growth." },
        { myth: "Africa is massively invading Europe.", real: "Intra-African migrations dominate at 70%.", stat_text: "70% (2021)", stat_val: 70, color: "bg-teal-700", desc: "AU/ILO Report (2021): 70% of international African mobilities take place within the continent itself (e.g. Côte d'Ivoire, South Africa, Nigeria)." },
        { myth: "The North hosts the vast majority of refugees.", real: "76% of world refugees remain in Southern countries.", stat_text: "76% (2025)", stat_val: 76, color: "bg-amber-700", desc: "UNHCR (2025): Over three-quarters of people fleeing armed conflicts find safety in neighboring developing nations (e.g. Uganda, Chad, Ethiopia)." },
        { myth: "African migration is almost exclusively male.", real: "Structural feminization of flows (45% to 47%).", stat_text: "47% (2024)", stat_val: 47, color: "bg-purple-700", desc: "UNDESA (2024) / AU (2021): Women account for nearly half of international migrants in Africa, reshaping autonomous care and cross-border trade economies." },
        { myth: "Africa financially depends on Official Aid.", real: "$86.4 billion in remittances far exceed ODA.", stat_text: "$86.4B (2019)", stat_val: 85, color: "bg-amber-600", desc: "World Bank / AU (2021): Diaspora remittances ($86.4B in 2019) far surpass Official Development Assistance (ODA), serving as primary resilience capital." },
        { myth: "Climate will empty Africa towards the North.", real: ">90% of climate displacements are internal.", stat_text: ">90% (2025)", stat_val: 90, color: "bg-cyan-700", desc: "IDMC (2025): Over 90% of people displaced by climate events (droughts, floods) remain within their national or sub-regional borders." },
        { myth: "Coastal African nations are mere transit zones.", real: "Structural transition into long-term destination countries.", stat_text: "Mutation (2024)", stat_val: 65, color: "bg-indigo-700", desc: "Data proves that former 'transit' countries are becoming permanent regional economic poles for migrant workers." },
        { myth: "Economic growth automatically stops emigration.", real: "The transition paradox (Migration Hump).", stat_text: "Catalyst (2024)", stat_val: 80, color: "bg-rose-700", desc: "Empirically proven: initial income growth provides households with the financial capital needed to undertake regular migration projects." },
        { myth: "Migrant workers are a burden on host economies.", real: "Drivers of local employment and value creation.", stat_text: "+ Value (2021)", stat_val: 85, color: "bg-emerald-700", desc: "AU/ILO Report (2021): 27.5% of employed migrants work in agriculture, filling labor shortages and stimulating local trade." }
      ],
      about: { 
        intro_title: "About South(s) Mobility",
        intro_subtitle: "An open infrastructure to understand mobility in the Global South",
        intro_p1: "South(s) Mobility DataHub is an independent research, data, and visualization platform dedicated to human mobility in the Global South, with an initial focus on Africa.",
        intro_p2: "At the intersection of social sciences, data science, and migration studies, the platform gathers, harmonizes, and leverages data, indicators, maps, publications, legal instruments, and documentary resources from international, regional, and national institutions.",
        intro_p3: "Its ambition is to make data on human mobility more accessible, comparable, and intelligible, in order to foster an empirical, nuanced, and documented understanding of contemporary migratory dynamics.",
        
        research_title: "A platform born from research",
        research_p1: "South(s) Mobility stems from a doctoral research project focused on the governance of African migrations.",
        research_p2: "During this research, a clear observation emerged: a vast amount of quality data is already produced by public and international institutions, but these resources remain widely scattered, heterogeneous, and sometimes difficult to access. Cross-referencing, contextualizing, or simply finding them often requires considerable effort.",
        research_p3: "South(s) Mobility was born from this observation. The project aims to gather these resources in a single, open, and scalable environment to facilitate their consultation, comparison, and reuse by researchers, students, journalists, public decision-makers, international organizations, and anyone interested in human mobility.",
        research_p4: "It is part of an Open Science approach, aimed at disseminating knowledge and promoting research.",

        data_title: "A data-driven approach",
        data_p1: "The project favors an empirical, transparent, and methodologically rigorous approach. The data and resources presented primarily come from recognized organizations, including:",
        data_list: [
          { name: "African Union Commission (AUC)", url: "https://au.int/en" },
          { name: "United Nations (UN DESA, UNHCR, IOM, ILO…)", url: "https://www.un.org/en" },
          { name: "World Bank", url: "https://data.worldbank.org/" },
          { name: "African Development Bank", url: "https://www.afdb.org/en" },
          { name: "OECD", url: "https://data.oecd.org/" },
          { name: "Internal Displacement Monitoring Centre (IDMC)", url: "https://www.internal-displacement.org/" },
          { name: "African Regional Economic Communities", url: "https://au.int/en/organs/recs" },
          { name: "National Statistical Institutes", url: null }
        ],
        data_p2: "Each dataset retains its original source. When multiple institutions provide different estimates, these divergences are noted and placed within their methodological context. Data limitations are indicated as much as possible to encourage critical and informed reading.",
        data_p3: "South(s) Mobility does not produce official statistics. The platform acts as an infrastructure for consolidation, contextualization, and knowledge dissemination.",

        south_title: "A perspective rooted in the Souths",
        south_p1: "South(s) Mobility adopts a Global South-centric perspective, paying special attention to dynamics that are often less visible in international databases. This includes:",
        south_list: [
          "Intra-African migrations",
          "South-South mobilities",
          "African regional economic communities",
          "Continental legal instruments",
          "African mobility policies",
          "Regional corridors",
          "Diasporas",
          "Internal displacements",
          "knowledge produced by institutions and researchers from the Global South"
        ],
        south_p2: "In the longer term, this approach is intended to be progressively extended to other regions of the world, notably Latin America, the Caribbean, and Asia.",

        evolution_title: "A constantly evolving platform",
        evolution_p1: "South(s) Mobility is an evolving project. New databases, interactive maps, dashboards, visualizations, methodological sheets, analyses, documentary repositories, and research tools are added regularly. Ongoing developments include:",
        evolution_list: [
          "A Migration Narratives Observatory",
          "Country profiles",
          "Regional economic community profiles",
          "A repository of African legal instruments",
          "A documentary library",
          "Harmonized time series",
          "Interactive dashboards",
          "New comparative indicators"
        ],
        evolution_p2: "The goal is to progressively build a benchmark infrastructure for the study of human mobility in the Global South.",

        founder_title: "About the founder",
        founder_p1: "South(s) Mobility was founded by Yassine Ben Mokhtar, a PhD candidate in international relations whose research focuses on African migration governance, continental institutional dynamics, and mobility policies.",
        founder_p2: "The project is built on several years of academic research, documentary and field analysis, as well as professional experience with institutions working on migration and governance issues in Africa.",
        founder_p3: "South(s) Mobility constitutes both an extension of this research and a scientific dissemination initiative designed to make knowledge, data, and resources more accessible to a wider audience.",
        founder_p4: "Analyses, interpretations, and any potential errors are the sole responsibility of the author and do not commit any institution with which he has collaborated.",

        collab_title: "Collaborate & Contact",
        collab_p1: "South(s) Mobility is open to academic, institutional, and technical collaborations. Proposals for datasets, publications, visualizations, corrections, joint projects, or partnerships are welcome.",
        contact_p: "For any questions, collaboration proposals, or contributions to the project:",
        disclaimer: "South(s) Mobility is an independent project in active development. Content, features, and datasets are regularly enriched to improve the coverage, quality, and accessibility of available information.",
        
        citation_title: "To cite this project:",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub: An open infrastructure to understand mobility in the Global South. Retrieved from https://southsmobility.vercel.app/"
      },
      method: { 
        summary: "Methodological architecture based on the consolidation and harmonization of certified open datasets:",
        m1: "Extraction & Harmonization: Cross-referencing national censuses with registries from AUC, ILO, UNHCR, IDMC, and UNDESA.", 
        m2: "Proportional Analysis: Normalizing stock and flow data against active and total population baselines.", 
        m3: "Legal Assessment: Reviewing ratification statuses of key African Union treaties and ILO NORMLEX conventions.",
        m4: "Open Source & Integrity: Open source codebase and full data processing independence.",
        sources_title: "Access Original Datasets, Reports & Legal Frameworks:",
        s1: "African Union & AUC / ILO / IOM / ECA - 3rd Labour Migration Statistics Report (2021)",
        s2: "UNDESA - International Migrant Stock Data (2024)",
        s3: "UNHCR - Global Trends Report (2025)",
        s4: "IDMC - GRID Report (2025)",
        s5: "IOM - World Migration Report (2024)",
        s6: "ILO NORMLEX - International Labour Standards Database (2025)",
        s7: "African Union - Treaties, Conventions, and Protocols (2025)",
        s8: "World Bank - Migration and Remittances Data (2024)"
      },
      myth: "Premise", reality: "Factual Data",
      footer: { tag: "Data engineering serving a new factual narrative on mobilities.", sources: "Sources : AU / ILO / IOM / ECA (2021) • UN DESA (2024) • UNHCR (2025) • IDMC (2025) • ILO NORMLEX (2025) • World Bank (2024)" },
      analysis_title: "Detailed Dashboard", analysis_btn: "Access detailed report",
      hero_title: "Objectifying mobilities", hero_highlight: "through data science."
    }
};

const genericDesc = {
  evo_desc: { fr: "Proportion migratoirement stable rythmée par la démographie locale.", en: "Migratory proportion structurally stable, driven by local demography." },
  origDest: { fr: "Mobilités majoritairement de proximité et circulaires au sein de l'espace sous-régional (UA 2021).", en: "Predominantly proximity and circular mobilities within the sub-regional space (AU 2021)." },
  trigger: { fr: "Asymétries de développement et chocs climatiques.", en: "Development asymmetries and climate shocks." },
  response: { fr: "Déplacements transfrontaliers de travail et stratégies de survie.", en: "Cross-border labor displacements and survival strategies." },
  impact: { fr: "Résilience économique via les transferts de fonds (Remittances 86,4 Mrd $ - UA 2021).", en: "Economic resilience through remittances ($86.4B - AU 2021)." }
};

// ----------------------------------------------------------------------------
// LES AGRÉGATS DES SOUS-RÉGIONS
// `evolution`, `history` et `distribution` sont des séries publiées (UNDESA / UA-OIT) et sont conservées telles quelles.
// `stock`, `female`, `retention`, `remittances`, `aid` et `labour_participation` sont recalculés en direct
// depuis countryData par computeRegionAggregate() : les valeurs ci-dessous ne servent que de filet de sécurité.
// ----------------------------------------------------------------------------
const aggregates = {
  'africa_perspective': { 
    name: { fr: "Afrique (Continentale)", en: "Africa (Continental)" }, flag: "🌍", stock: '28,5 M', female: '47.1', evolution: '1.9', retention: 70, remittances: 6.5, aid: 3.2,
    history: [{ year: 1990, value: '2.5' }, { year: 2000, value: '2.0' }, { year: 2010, value: '1.8' }, { year: 2024, value: '1.9' }],
    distribution: [{ label: {fr: 'Intra-Africain', en: 'Intra-African'}, value: 70, color: 'bg-blue-700' }, { label: {fr: 'Extra-Africain', en: 'Extra-African'}, value: 30, color: 'bg-slate-700' }],
    ...genericDesc
  },
  'af_med_perspective': { 
    name: { fr: "Afrique Méditerranéenne (Sous-région)", en: "Mediterranean Africa (Sub-region)" }, flag: "🌊", stock: '3,4 M', female: '43.7', evolution: '1.8', retention: 65, remittances: 3.9, aid: 1.3,
    history: [{ year: 1990, value: '1.0' }, { year: 2024, value: '3.4' }], ...genericDesc 
  },
  'af_west_perspective': { 
    name: { fr: "Afrique de l'Ouest (Sous-région)", en: "West Africa (Sub-region)" }, flag: "🌳", stock: '7,6 M', female: '47.6', evolution: '2.1', retention: 84, remittances: 5.1, aid: 4.8,
    history: [{ year: 1990, value: '3.5' }, { year: 2024, value: '7.6' }], ...genericDesc 
  },
  'af_central_perspective': { 
    name: { fr: "Afrique Centrale (Sous-région)", en: "Central Africa (Sub-region)" }, flag: "🦍", stock: '4,2 M', female: '48.9', evolution: '3.5', retention: 92, remittances: 1.5, aid: 5.9,
    history: [{ year: 1990, value: '1.5' }, { year: 2024, value: '4.2' }], ...genericDesc 
  },
  'af_east_perspective': { 
    name: { fr: "Afrique de l'Est (Sous-région)", en: "East Africa (Sub-region)" }, flag: "⛰️", stock: '6,8 M', female: '49.1', evolution: '1.6', retention: 88, remittances: 2.8, aid: 5.1,
    history: [{ year: 1990, value: '4.5' }, { year: 2024, value: '6.8' }], ...genericDesc 
  },
  'af_south_perspective': { 
    name: { fr: "Afrique Australe (Sous-région)", en: "Southern Africa (Sub-region)" }, flag: "🦓", stock: '4,5 M', female: '44.8', evolution: '3.2', retention: 95, remittances: 1.9, aid: 2.3,
    history: [{ year: 1990, value: '2.5' }, { year: 2024, value: '4.5' }], ...genericDesc 
  }
};

const countryData = {
  "af_med": [
    { 
      "id": "12", "name": { "fr": "Algérie", "en": "Algeria" }, "flag": "🇩🇿", "retention": 60, "aid": 0.1, "stock": "259458", "female": "47.2", 
      "history": [ { "year": 1990, "value": "273954" }, { "year": 2024, "value": "259458" } ], "remittances": 0.67, "labour_participation": "40.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 0, "idp_disaster": 10, "refugees_hosted": 0, "avoi": 9, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 48, "total": 60, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103006"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "818", "name": { "fr": "Égypte", "en": "Egypt" }, "flag": "🇪🇬", "retention": 75, "aid": 1.5, "stock": "1139820", "female": "47.1", 
      "history": [ { "year": 1990, "value": "144713" }, { "year": 2024, "value": "1139820" } ], "remittances": 11.37, "labour_participation": "59.9", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 834200, "avoi": 11, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 54, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103254"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "impact": { "fr": "L'Égypte reçoit 31% du total des transferts de fonds captés par l'ensemble du continent africain (Rapport UA 2021).", "en": "Egypt receives 31% of total diaspora remittances captured by the entire African continent (AU Report 2021)." }
    },
    { 
      "id": "434", "name": { "fr": "Libye", "en": "Libya" }, "flag": "🇱🇾", "retention": 85, "aid": 2.1, "stock": "897751", "female": "28.2", 
      "history": [ { "year": 1990, "value": "457075" }, { "year": 2024, "value": "897751" } ], "remittances": null, "labour_participation": "61.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "12.8", 
      "idp_conflict": 85000, "idp_disaster": 21000, "refugees_hosted": 551700, "avoi": 4, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 19, "total": 29, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102919"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "504", "name": { "fr": "Maroc", "en": "Morocco" }, "flag": "🇲🇦", "retention": 55, "aid": 1.2, "stock": "111069", "female": "48.5", 
      "history": [ { "year": 1990, "value": "54895" }, { "year": 2024, "value": "111069" } ], "remittances": 7.49, "labour_participation": "46.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 15, 
      "normlex": {"fundamental": 8, "governance": 4, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102993"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "788", "name": { "fr": "Tunisie", "en": "Tunisia" }, "flag": "🇹🇳", "retention": 50, "aid": 1.8, "stock": "63201", "female": "47.7", 
      "history": [ { "year": 1990, "value": "37984" }, { "year": 2024, "value": "63201" } ], "remittances": 6.34, "labour_participation": "52.4", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.5", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102980"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_west": [
    { 
      "id": "204", "name": { "fr": "Bénin", "en": "Benin" }, "flag": "🇧🇯", "retention": 80, "aid": 4.1, "stock": "418202", "female": "52.9", 
      "history": [ { "year": 1990, "value": "76751" }, { "year": 2024, "value": "418202" } ], "remittances": 1.72, "labour_participation": "64.4", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "3.0", 
      "idp_conflict": 26000, "idp_disaster": 1100, "refugees_hosted": 0, "avoi": 91, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 22, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103009"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "854", "name": { "fr": "Burkina Faso", "en": "Burkina Faso" }, "flag": "🇧🇫", "retention": 90, "aid": 6.2, "stock": "739820", "female": "52.4", 
      "history": [ { "year": 1990, "value": "349652" }, { "year": 2024, "value": "739820" } ], "remittances": 2.57, "labour_participation": "64.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "3.2", 
      "idp_conflict": 2063000, "idp_disaster": 210, "refugees_hosted": 0, "avoi": 36, 
      "normlex": {"fundamental": 9, "governance": 4, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103058"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "132", "name": { "fr": "Cabo Verde", "en": "Cabo Verde" }, "flag": "🇨🇻", "retention": 40, "aid": 8.1, "stock": "16515", "female": "49.4", 
      "history": [ { "year": 1990, "value": "8931" }, { "year": 2024, "value": "16515" } ], "remittances": 11.67, "labour_participation": "72.2", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "3.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 86, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 5, "total": 16, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102978"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "384", "name": { "fr": "Côte d'Ivoire", "en": "Côte d'Ivoire" }, "flag": "🇨🇮", "retention": 95, "aid": 1.5, "stock": "2880839", "female": "40.0", 
      "history": [ { "year": 1990, "value": "1822374" }, { "year": 2024, "value": "2880839" } ], "remittances": 2.03, "labour_participation": "74.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "9.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 42, 
      "normlex": {"fundamental": 11, "governance": 4, "technical": 33, "total": 48, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103023"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "270", "name": { "fr": "Gambie", "en": "Gambia" }, "flag": "🇬🇲", "retention": 60, "aid": 10.5, "stock": "236137", "female": "47.2", 
      "history": [ { "year": 1990, "value": "118123" }, { "year": 2024, "value": "236137" } ], "remittances": 22.0, "labour_participation": "72.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "8.6", 
      "idp_conflict": 0, "idp_disaster": 250, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 11, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103004"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "288", "name": { "fr": "Ghana", "en": "Ghana" }, "flag": "🇬🇭", "retention": 70, "aid": 2.5, "stock": "532286", "female": "46.6", 
      "history": [ { "year": 1990, "value": "164851" }, { "year": 2024, "value": "532286" } ], "remittances": 2.12, "labour_participation": "64.4", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.6", 
      "idp_conflict": 3900, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 87, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103271"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "324", "name": { "fr": "Guinée", "en": "Guinea" }, "flag": "🇬🇳", "retention": 85, "aid": 4.8, "stock": "117416", "female": "41.2", 
      "history": [ { "year": 1990, "value": "403621" }, { "year": 2024, "value": "117416" } ], "remittances": 2.46, "labour_participation": "44.0", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 130, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 50, "total": 62, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103001"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "624", "name": { "fr": "Guinée-Bissau", "en": "Guinea-Bissau" }, "flag": "🇬🇼", "retention": 75, "aid": 9.1, "stock": "15064", "female": "50.6", 
      "history": [ { "year": 1990, "value": "15368" }, { "year": 2024, "value": "15064" } ], "remittances": 9.88, "labour_participation": "61.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 700, "refugees_hosted": 0, "avoi": 26, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 25, "total": 34, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103328"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "430", "name": { "fr": "Libéria", "en": "Liberia" }, "flag": "🇱🇷", "retention": 80, "aid": 15.5, "stock": "72423", "female": "42.4", 
      "history": [ { "year": 1990, "value": "94964" }, { "year": 2024, "value": "72423" } ], "remittances": 21.28, "labour_participation": "60.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 26, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 17, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102941"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "466", "name": { "fr": "Mali", "en": "Mali" }, "flag": "🇲🇱", "retention": 85, "aid": 7.2, "stock": "545323", "female": "49.3", 
      "history": [ { "year": 1990, "value": "160736" }, { "year": 2024, "value": "545323" } ], "remittances": 3.99, "labour_participation": "76.0", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.3", 
      "idp_conflict": 409000, "idp_disaster": 5900, "refugees_hosted": 0, "avoi": 41, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 23, "total": 36, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102987"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "478", "name": { "fr": "Mauritanie", "en": "Mauritania" }, "flag": "🇲🇷", "retention": 70, "aid": 5.5, "stock": "195937", "female": "43.4", 
      "history": [ { "year": 1990, "value": "111650" }, { "year": 2024, "value": "195937" } ], "remittances": 0.87, "labour_participation": "68.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 17, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 34, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103031"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "562", "name": { "fr": "Niger", "en": "Niger" }, "flag": "🇳🇪", "retention": 90, "aid": 9.8, "stock": "449236", "female": "53.5", 
      "history": [ { "year": 1990, "value": "115464" }, { "year": 2024, "value": "449236" } ], "remittances": 3.3, "labour_participation": "50.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.7", 
      "idp_conflict": 392000, "idp_disaster": 25000, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 29, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103028"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "566", "name": { "fr": "Nigéria", "en": "Nigeria" }, "flag": "🇳🇬", "retention": 65, "aid": 0.8, "stock": "1403281", "female": "45.5", 
      "history": [ { "year": 1990, "value": "456621" }, { "year": 2024, "value": "1403281" } ], "remittances": 7.84, "labour_participation": "84.7", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 3496000, "idp_disaster": 170000, "refugees_hosted": 0, "avoi": 32, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 32, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103259"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "impact": { "fr": "Le Nigéria perçoit 28% de l'ensemble des envois de fonds diasporiques du continent (Rapport UA 2021). De plus, c'est le seul pays échantillonné où les femmes sont majoritaires parmi les travailleurs migrants occupés (52,8%).", "en": "Nigeria receives 28% of all continental diaspora remittances (AU Report 2021). Furthermore, it is the only sampled country where women represent the majority of employed migrant workers (52.8%)." }
    },
    { 
      "id": "686", "name": { "fr": "Sénégal", "en": "Senegal" }, "flag": "🇸🇳", "retention": 75, "aid": 4.2, "stock": "281867", "female": "47.0", 
      "history": [ { "year": 1990, "value": "270410" }, { "year": 2024, "value": "281867" } ], "remittances": 10.64, "labour_participation": "55.7", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "1.6", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 79, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103046"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "694", "name": { "fr": "Sierra Leone", "en": "Sierra Leone" }, "flag": "🇸🇱", "retention": 80, "aid": 8.5, "stock": "49997", "female": "43.4", 
      "history": [ { "year": 1990, "value": "222148" }, { "year": 2024, "value": "49997" } ], "remittances": 4.6, "labour_participation": "68.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 0, "idp_disaster": 4500, "refugees_hosted": 0, "avoi": 81, 
      "normlex": {"fundamental": 11, "governance": 2, "technical": 33, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103212"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "768", "name": { "fr": "Togo", "en": "Togo" }, "flag": "🇹🇬", "retention": 85, "aid": 4.5, "stock": "281994", "female": "49.3", 
      "history": [ { "year": 1990, "value": "84844" }, { "year": 2024, "value": "281994" } ], "remittances": 8.69, "labour_participation": "59.0", "remittances_year": 2020, "labour_participation_year": 2022, "evolution": "3.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 28, 
      "normlex": {"fundamental": 9, "governance": 4, "technical": 15, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103134"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_central": [
    { 
      "id": "24", "name": { "fr": "Angola", "en": "Angola" }, "flag": "🇦🇴", "retention": 90, "aid": 0.5, "stock": "676507", "female": "49.5", 
      "history": [ { "year": 1990, "value": "33517" }, { "year": 2024, "value": "676507" } ], "remittances": 0.04, "labour_participation": "80.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 0, "idp_disaster": 27000, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 30, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102951"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "120", "name": { "fr": "Cameroun", "en": "Cameroon" }, "flag": "🇨🇲", "retention": 85, "aid": 2.1, "stock": "642948", "female": "50.6", 
      "history": [ { "year": 1990, "value": "265967" }, { "year": 2024, "value": "642948" } ], "remittances": 1.29, "labour_participation": "84.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.2", 
      "idp_conflict": 954000, "idp_disaster": 50000, "refugees_hosted": 0, "avoi": 11, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 39, "total": 51, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102973"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "140", "name": { "fr": "Centrafrique", "en": "Central African Republic" }, "flag": "🇨🇫", "retention": 95, "aid": 12.5, "stock": "94556", "female": "47.6", 
      "history": [ { "year": 1990, "value": "67234" }, { "year": 2024, "value": "94556" } ], "remittances": null, "labour_participation": "77.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 427000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 25, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 35, "total": 47, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103002"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "148", "name": { "fr": "Tchad", "en": "Chad" }, "flag": "🇹🇩", "retention": 95, "aid": 5.5, "stock": "1269673", "female": "55.6", 
      "history": [ { "year": 1990, "value": "74342" }, { "year": 2024, "value": "1269673" } ], "remittances": null, "labour_participation": "60.5", "remittances_year": null, "labour_participation_year": 2022, "evolution": "6.3", 
      "idp_conflict": 593000, "idp_disaster": 48000, "refugees_hosted": 1500000, "avoi": 28, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103022"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "178", "name": { "fr": "Congo", "en": "Congo" }, "flag": "🇨🇬", "retention": 90, "aid": 2.5, "stock": "385589", "female": "45.5", 
      "history": [ { "year": 1990, "value": "129391" }, { "year": 2024, "value": "385589" } ], "remittances": 0.3, "labour_participation": "60.6", "remittances_year": 2021, "labour_participation_year": 2022, "evolution": "6.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 22, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 23, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103014"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "180", "name": { "fr": "R.D. Congo", "en": "DR Congo" }, "flag": "🇨🇩", "retention": 95, "aid": 6.5, "stock": "1085090", "female": "51.8", 
      "history": [ { "year": 1990, "value": "754194" }, { "year": 2024, "value": "1085090" } ], "remittances": 3.65, "labour_participation": "62.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.0", 
      "idp_conflict": 4276000, "idp_disaster": 630000, "refugees_hosted": 0, "avoi": 14, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 27, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102981"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "226", "name": { "fr": "Guinée Équatoriale", "en": "Equatorial Guinea" }, "flag": "🇬🇶", "retention": 98, "aid": 0.5, "stock": "248930", "female": "22.9", 
      "history": [ { "year": 1990, "value": "2740" }, { "year": 2024, "value": "248930" } ], "remittances": null, "labour_participation": "78.0", "remittances_year": null, "labour_participation_year": 2022, "evolution": "13.2", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 11, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 6, "total": 14, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103102"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "266", "name": { "fr": "Gabon", "en": "Gabon" }, "flag": "🇬🇦", "retention": 95, "aid": 0.8, "stock": "449746", "female": "35.7", 
      "history": [ { "year": 1990, "value": "128188" }, { "year": 2024, "value": "449746" } ], "remittances": 0.13, "labour_participation": "64.7", "remittances_year": 2015, "labour_participation_year": 2022, "evolution": "17.7", 
      "idp_conflict": 0, "idp_disaster": 1500, "refugees_hosted": 0, "avoi": 17, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 30, "total": 42, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103008"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "678", "name": { "fr": "Sao Tomé-et-Principe", "en": "Sao Tome and Principe" }, "flag": "🇸🇹", "retention": 80, "aid": 10.5, "stock": "1955", "female": "50.1", 
      "history": [ { "year": 1990, "value": "5582" }, { "year": 2024, "value": "1955" } ], "remittances": 9.71, "labour_participation": "51.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 15, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 13, "total": 25, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103126"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_east": [
    { 
      "id": "108", "name": { "fr": "Burundi", "en": "Burundi" }, "flag": "🇧🇮", "retention": 95, "aid": 15.5, "stock": "387101", "female": "50.7", 
      "history": [ { "year": 1990, "value": "333110" }, { "year": 2024, "value": "387101" } ], "remittances": 8.12, "labour_participation": "69.7", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "2.6", 
      "idp_conflict": 6800, "idp_disaster": 82000, "refugees_hosted": 0, "avoi": 82, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 21, "total": 31, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102988"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "174", "name": { "fr": "Comores", "en": "Comoros" }, "flag": "🇰🇲", "retention": 40, "aid": 10.2, "stock": "12449", "female": "51.6", 
      "history": [ { "year": 1990, "value": "14079" }, { "year": 2024, "value": "12449" } ], "remittances": 20.84, "labour_participation": "36.7", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "1.4", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 80, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 26, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103322"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "262", "name": { "fr": "Djibouti", "en": "Djibouti" }, "flag": "🇩🇯", "retention": 90, "aid": 8.5, "stock": "125996", "female": "47.5", 
      "history": [ { "year": 1990, "value": "122221" }, { "year": 2024, "value": "125996" } ], "remittances": 1.35, "labour_participation": "44.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "10.8", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 80, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 58, "total": 70, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102996"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "232", "name": { "fr": "Érythrée", "en": "Eritrea" }, "flag": "🇪🇷", "retention": 85, "aid": 5.5, "stock": "12512", "female": "43.9", 
      "history": [ { "year": 1990, "value": "11848" }, { "year": 2024, "value": "12512" } ], "remittances": null, "labour_participation": "80.6", "remittances_year": null, "labour_participation_year": 2022, "evolution": "0.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 81, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 0, "total": 8, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103290"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "231", "name": { "fr": "Éthiopie", "en": "Ethiopia" }, "flag": "🇪🇹", "retention": 90, "aid": 3.5, "stock": "1168455", "female": "49.7", 
      "history": [ { "year": 1990, "value": "875325" }, { "year": 2024, "value": "1168455" } ], "remittances": 4.77, "labour_participation": "65.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.9", 
      "idp_conflict": 2378000, "idp_disaster": 757000, "refugees_hosted": 521400, "avoi": 73, 
      "normlex": {"fundamental": 9, "governance": 1, "technical": 13, "total": 23, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102950"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "404", "name": { "fr": "Kenya", "en": "Kenya" }, "flag": "🇰🇪", "retention": 85, "aid": 2.8, "stock": "992536", "female": "49.5", 
      "history": [ { "year": 1990, "value": "298089" }, { "year": 2024, "value": "992536" } ], "remittances": 4.15, "labour_participation": "64.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 10000, "idp_disaster": 3800, "refugees_hosted": 0, "avoi": 96, 
      "normlex": {"fundamental": 7, "governance": 3, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103315"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "450", "name": { "fr": "Madagascar", "en": "Madagascar" }, "flag": "🇲🇬", "retention": 80, "aid": 4.5, "stock": "38625", "female": "43.0", 
      "history": [ { "year": 1990, "value": "23917" }, { "year": 2024, "value": "38625" } ], "remittances": 2.31, "labour_participation": "71.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.1", 
      "idp_conflict": 0, "idp_disaster": 70000, "refugees_hosted": 0, "avoi": 79, 
      "normlex": {"fundamental": 11, "governance": 4, "technical": 38, "total": 53, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102956"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "454", "name": { "fr": "Malawi", "en": "Malawi" }, "flag": "🇲🇼", "retention": 90, "aid": 9.5, "stock": "186719", "female": "51.1", 
      "history": [ { "year": 1990, "value": "1127724" }, { "year": 2024, "value": "186719" } ], "remittances": 1.65, "labour_participation": "70.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 24000, "refugees_hosted": 0, "avoi": 47, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 19, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103138"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "480", "name": { "fr": "Maurice", "en": "Mauritius" }, "flag": "🇲🇺", "retention": 60, "aid": 0.5, "stock": "29142", "female": "44.6", 
      "history": [ { "year": 1990, "value": "3613" }, { "year": 2024, "value": "29142" } ], "remittances": 1.92, "labour_participation": "73.4", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 83, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 40, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103139"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "508", "name": { "fr": "Mozambique", "en": "Mozambique" }, "flag": "🇲🇿", "retention": 95, "aid": 10.5, "stock": "353143", "female": "51.2", 
      "history": [ { "year": 1990, "value": "122332" }, { "year": 2024, "value": "353143" } ], "remittances": 1.17, "labour_participation": "82.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.1", 
      "idp_conflict": 465000, "idp_disaster": 144000, "refugees_hosted": 0, "avoi": 84, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 12, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103149"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "646", "name": { "fr": "Rwanda", "en": "Rwanda" }, "flag": "🇷🇼", "retention": 95, "aid": 12.5, "stock": "513316", "female": "49.4", 
      "history": [ { "year": 1990, "value": "160024" }, { "year": 2024, "value": "513316" } ], "remittances": 3.42, "labour_participation": "63.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "3.6", 
      "idp_conflict": 0, "idp_disaster": 81, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 22, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103153"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "690", "name": { "fr": "Seychelles", "en": "Seychelles" }, "flag": "🇸🇨", "retention": 60, "aid": 1.5, "stock": "13261", "female": "30.0", 
      "history": [ { "year": 1990, "value": "3721" }, { "year": 2024, "value": "13261" } ], "remittances": 0.54, "labour_participation": null, "remittances_year": 2024, "labour_participation_year": null, "evolution": "10.2", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 0, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 27, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103310"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "706", "name": { "fr": "Somalie", "en": "Somalia" }, "flag": "🇸🇴", "retention": 95, "aid": 15.5, "stock": "77972", "female": "44.9", 
      "history": [ { "year": 1990, "value": "478294" }, { "year": 2024, "value": "77972" } ], "remittances": null, "labour_participation": "41.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "0.4", 
      "idp_conflict": 3347000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 19, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 17, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103112"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "728", "name": { "fr": "Soudan du Sud", "en": "South Sudan" }, "flag": "🇸🇸", "retention": 98, "aid": 20.5, "stock": "914001", "female": "49.7", 
      "history": [ { "year": 1990, "value": "652365" }, { "year": 2024, "value": "914001" } ], "remittances": 9.49, "labour_participation": "76.8", "remittances_year": 2015, "labour_participation_year": 2022, "evolution": "8.0", 
      "idp_conflict": 945000, "idp_disaster": 630000, "refugees_hosted": 571100, "avoi": 9, 
      "normlex": {"fundamental": 7, "governance": 0, "technical": 0, "total": 7, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103154"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "729", "name": { "fr": "Soudan", "en": "Sudan" }, "flag": "🇸🇩", "retention": 90, "aid": 5.5, "stock": "2397113", "female": "50.3", 
      "history": [ { "year": 1990, "value": "1402896" }, { "year": 2024, "value": "2397113" } ], "remittances": 2.9, "labour_participation": "28.9", "remittances_year": 2022, "labour_participation_year": 2022, "evolution": "4.8", 
      "idp_conflict": 9117000, "idp_disaster": 0, "refugees_hosted": 635000, "avoi": 3, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102958"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "834", "name": { "fr": "Tanzanie", "en": "Tanzania" }, "flag": "🇹🇿", "retention": 90, "aid": 3.5, "stock": "462371", "female": "50.0", 
      "history": [ { "year": 1990, "value": "574025" }, { "year": 2024, "value": "462371" } ], "remittances": 1.42, "labour_participation": "78.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 6300, "refugees_hosted": 0, "avoi": 71, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 28, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103136"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "800", "name": { "fr": "Ouganda", "en": "Uganda" }, "flag": "🇺🇬", "retention": 95, "aid": 6.5, "stock": "2057759", "female": "55.0", 
      "history": [ { "year": 1990, "value": "560570" }, { "year": 2024, "value": "2057759" } ], "remittances": 2.65, "labour_participation": "68.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 2000, "idp_disaster": 20000, "refugees_hosted": 1900000, "avoi": 40, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 21, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103324"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "894", "name": { "fr": "Zambie", "en": "Zambia" }, "flag": "🇿🇲", "retention": 90, "aid": 4.5, "stock": "249205", "female": "48.1", 
      "history": [ { "year": 1990, "value": "279463" }, { "year": 2024, "value": "249205" } ], "remittances": 1.32, "labour_participation": "66.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.2", 
      "idp_conflict": 0, "idp_disaster": 2300, "refugees_hosted": 0, "avoi": 48, 
      "normlex": {"fundamental": 10, "governance": 4, "technical": 35, "total": 49, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103233"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "716", "name": { "fr": "Zimbabwe", "en": "Zimbabwe" }, "flag": "🇿🇼", "retention": 85, "aid": 5.5, "stock": "429108", "female": "43.2", 
      "history": [ { "year": 1990, "value": "634621" }, { "year": 2024, "value": "429108" } ], "remittances": 8.45, "labour_participation": "69.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.6", 
      "idp_conflict": 0, "idp_disaster": 2200, "refugees_hosted": 0, "avoi": 47, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103183"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_south": [
    { 
      "id": "72", "name": { "fr": "Botswana", "en": "Botswana" }, "flag": "🇧🇼", "retention": 95, "aid": 0.8, "stock": "116402", "female": "43.0", 
      "history": [ { "year": 1990, "value": "27510" }, { "year": 2024, "value": "116402" } ], "remittances": 0.67, "labour_participation": "76.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.4", 
      "idp_conflict": 0, "idp_disaster": 7, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 6, "total": 17, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103184"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "748", "name": { "fr": "Eswatini", "en": "Eswatini" }, "flag": "🇸🇿", "retention": 98, "aid": 5.5, "stock": "33268", "female": "48.5", 
      "history": [ { "year": 1990, "value": "74991" }, { "year": 2024, "value": "33268" } ], "remittances": 0.69, "labour_participation": "67.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.7", 
      "idp_conflict": 0, "idp_disaster": 8, "refugees_hosted": 0, "avoi": 32, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 23, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103185"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "426", "name": { "fr": "Lesotho", "en": "Lesotho" }, "flag": "🇱🇸", "retention": 98, "aid": 8.5, "stock": "15039", "female": "45.8", 
      "history": [ { "year": 1990, "value": "8240" }, { "year": 2024, "value": "15039" } ], "remittances": 20.72, "labour_participation": "63.8", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 30, 
      "normlex": {"fundamental": 11, "governance": 2, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103186"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "516", "name": { "fr": "Namibie", "en": "Namibia" }, "flag": "🇳🇦", "retention": 95, "aid": 1.5, "stock": "116035", "female": "46.0", 
      "history": [ { "year": 1990, "value": "120641" }, { "year": 2024, "value": "116035" } ], "remittances": 0.71, "labour_participation": "70.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 0, "idp_disaster": 1300, "refugees_hosted": 0, "avoi": 65, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103187"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "710", "name": { "fr": "Afrique du Sud", "en": "South Africa" }, "flag": "🇿🇦", "retention": 95, "aid": 0.5, "stock": "2631100", "female": "41.9", 
      "history": [ { "year": 1990, "value": "1285707" }, { "year": 2024, "value": "2631100" } ], "remittances": 0.24, "labour_participation": "72.5", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 0, "idp_disaster": 28000, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103188"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ]
};

// ----------------------------------------------------------------------------
// Agrégation en direct depuis countryData (remplace les totaux saisis à la main)
// ----------------------------------------------------------------------------
const parseStockNumber = (v) => {
  const n = parseFloat(String(v).replace(/\s/g, ''));
  return isNaN(n) ? 0 : n;
};

const weightedAverage = (countries, getter) => {
  let weightSum = 0, valSum = 0;
  countries.forEach(c => {
    const val = getter(c);
    if (val === null || val === undefined) return;
    const num = parseFloat(val);
    if (isNaN(num)) return;
    const w = parseStockNumber(c.stock);
    valSum += num * w;
    weightSum += w;
  });
  return weightSum > 0 ? valSum / weightSum : null;
};

const computeRegionAggregate = (countries) => {
  const totalStock = countries.reduce((sum, c) => sum + parseStockNumber(c.stock), 0);
  const female = weightedAverage(countries, c => c.female);
  const retention = weightedAverage(countries, c => c.retention);
  const remittances = weightedAverage(countries, c => c.remittances);
  const aid = weightedAverage(countries, c => c.aid);
  const labourParticipation = weightedAverage(countries, c => c.labour_participation);

  const remittanceYears = countries.map(c => c.remittances != null ? c.remittances_year : null).filter(Boolean);
  let remittancesYearLabel = null;
  if (remittanceYears.length > 0) {
    const minY = Math.min(...remittanceYears), maxY = Math.max(...remittanceYears);
    remittancesYearLabel = minY === maxY ? String(minY) : `${minY}-${maxY}`;
  }

  return {
    stock: totalStock,
    female: female !== null ? female.toFixed(1) : null,
    retention: retention !== null ? Math.round(retention) : null,
    remittances: remittances !== null ? Math.round(remittances * 100) / 100 : null,
    remittancesYearLabel,
    aid: aid !== null ? Math.round(aid * 100) / 100 : null,
    labourParticipation: labourParticipation !== null ? labourParticipation.toFixed(1) : null,
    countryCount: countries.length
  };
};

const indicatorThemes = [
  {
    theme_fr: "Intégration & Libre Circulation", theme_en: "Integration & Free Movement", icon: <GitMerge />, color: "text-blue-800",
    items: [
      { 
        id: "1.1", fr: "Taux d'effectivité des protocoles régionaux", en: "Effectiveness of regional free movement protocols", 
        desc_fr: "Mesure de l'application réelle des accords (ex: CEDEAO, ZLECAf) sur le terrain.", desc_en: "Measurement of the actual implementation of agreements (e.g. ECOWAS, AfCFTA).",
        method_fr: "Ratio entre les postes frontières appliquant effectivement l'exemption de visa/passeport et le nombre total de postes.", method_en: "Ratio between border posts actually applying visa/passport exemptions and the total number of posts.",
        contrast_fr: "Plutôt que de compter les 'appréhensions' ou 'refoulements' (qui criminalisent la mobilité), cet indicateur évalue la capacité de l'État à faciliter l'intégration régionale légitime.", contrast_en: "Rather than counting 'apprehensions' or 'pushbacks' (which criminalize mobility), this indicator assesses the state's capacity to facilitate legitimate regional integration."
      },
      { 
        id: "1.2", fr: "Volume du commerce informel transfrontalier", en: "Volume of cross-border informal trade", 
        desc_fr: "Impact des mobilités de proximité sur l'intégration économique réelle par le bas.", desc_en: "Impact of proximity mobilities on real economic integration from below.",
        method_fr: "Enquêtes micro-économiques aux frontières et modélisation des flux non-douaniers.", method_en: "Micro-economic surveys at borders and modeling of non-customs flows.",
        contrast_fr: "Le PIB classique ignore l'économie informelle. Cet indicateur montre que les mobilités circulaires sont le véritable moteur de la survie et de l'intégration des communautés frontalières.", contrast_en: "Classic GDP ignores the informal economy. This indicator shows that circular mobilities are the true engine of survival and integration for border communities."
      }
    ]
  },
  {
    theme_fr: "Économie Productive & Diasporas", theme_en: "Productive Economy & Diasporas", icon: <TrendingUp />, color: "text-amber-700",
    items: [
      { 
        id: "2.1", fr: "Transferts alloués à l'investissement productif", en: "Remittances allocated to productive investment", 
        desc_fr: "Part des envois de fonds investie dans la création d'activité vs la consommation.", desc_en: "Share of remittances invested in business creation vs. daily consumption.",
        method_fr: "Suivi bancaire des fonds d'investissement diasporiques et sondages auprès des récipiendaires.", method_en: "Banking tracking of diaspora investment funds and surveys of recipients.",
        contrast_fr: "Au lieu de pleurer sur le coût de la 'fuite des cerveaux', cela prouve que les diasporas sont les premiers investisseurs de l'économie réelle, remplaçant l'Aide Publique au Développement (paternaliste).", contrast_en: "Instead of mourning the cost of 'brain drain', this proves diasporas are the primary investors in the real economy, replacing paternalistic Official Development Assistance."
      },
      { 
        id: "2.2", fr: "Taux d'entrepreneuriat des migrants", en: "Migrant entrepreneurship rate", 
        desc_fr: "Création d'emplois et de micro-entreprises par les populations en mouvement.", desc_en: "Job and micro-enterprise creation by populations on the move.",
        method_fr: "Recensement des entreprises (formelles et informelles) fondées par des non-nationaux.", method_en: "Census of businesses (formal and informal) founded by non-nationals.",
        contrast_fr: "Détruit le mythe du 'migrant qui vole le travail local' en démontrant qu'il est structurellement créateur d'emplois et animateur de marchés.", contrast_en: "Destroys the myth of the 'migrant stealing local jobs' by demonstrating they are structurally job creators and market animators."
      }
    ]
  },
  {
    theme_fr: "Mobilité Climatique & Adaptation", theme_en: "Climate Mobility & Adaptation", icon: <Leaf />, color: "text-teal-700",
    items: [
      { 
        id: "3.1", fr: "Mobilité circulaire comme adaptation", en: "Circular mobility as adaptation", 
        desc_fr: "Déplacements saisonniers anticipés pour pallier les chocs écologiques locaux.", desc_en: "Anticipated seasonal movements to mitigate local ecological shocks.",
        method_fr: "Corrélation entre les flux de main-d'œuvre agricole et les calendriers de sécheresse/inondation.", method_en: "Correlation between agricultural labor flows and drought/flood calendars.",
        contrast_fr: "Sort de la vision misérabiliste du 'réfugié climatique' passif pour objectiver la migration comme une stratégie de résilience proactive et autonome.", contrast_en: "Breaks away from the miserable vision of the passive 'climate refugee' to objectify migration as a proactive and autonomous resilience strategy."
      },
      { 
        id: "3.2", fr: "Fonds diasporiques pour la résilience", en: "Diaspora funds for resilience", 
        desc_fr: "Investissements transnationaux dans l'irrigation, l'énergie ou l'agriculture.", desc_en: "Transnational investments in local irrigation, energy, or agriculture.",
        method_fr: "Analyse des transferts fléchés vers des projets d'infrastructure communautaire.", method_en: "Analysis of remittances directed towards community infrastructure projects.",
        contrast_fr: "Ne plus attendre l'aide conditionnée des 'Fonds Verts' du Nord, mais mesurer la capacité d'auto-réparation climatique des communautés du Sud.", contrast_en: "Stop waiting for conditioned 'Green Funds' from the North, and measure the climate self-repair capacity of Southern communities."
      }
    ]
  },
  {
    theme_fr: "Santé & Économie du Soin (Care)", theme_en: "Health & Care Economy", icon: <HeartPulse />, color: "text-rose-800",
    items: [
      { 
        id: "4.1", fr: "Contribution migrante aux systèmes de santé", en: "Migrant contribution to health systems", 
        desc_fr: "Part des travailleurs étrangers comblant les déficits de personnel médical local.", desc_en: "Share of foreign workers filling local medical staff shortages.",
        method_fr: "Ratio du personnel de santé né à l'étranger au sein des cliniques et hôpitaux de la région.", method_en: "Ratio of foreign-born healthcare staff within regional clinics and hospitals.",
        contrast_fr: "Remplace l'indicateur raciste du 'migrant vecteur de maladies' (sécurité épidémiologique) par la réalité du migrant comme pourvoyeur essentiel de soins.", contrast_en: "Replaces the racist indicator of the 'migrant as a disease vector' (epidemiological security) with the reality of the migrant as an essential care provider."
      },
      { 
        id: "4.2", fr: "Inclusion dans la Couverture Sanitaire", en: "Inclusion in Universal Health Coverage", 
        desc_fr: "Taux d'accès effectif des migrants aux soins de santé publics nationaux.", desc_en: "Effective access rate of migrants to national public healthcare.",
        method_fr: "Étude légale et baromètres d'accès aux hôpitaux publics pour les non-nationaux.", method_en: "Legal review and barometers of access to public hospitals for non-nationals.",
        contrast_fr: "Passe d'une logique humanitaire d'urgence (camps) à une logique structurelle d'intégration par les droits publics de santé.", contrast_en: "Shifts from emergency humanitarian logic (camps) to a structural logic of integration through public health rights."
      }
    ]
  },
  {
    theme_fr: "Savoirs & Circulation des Compétences", theme_en: "Knowledge & Skills Circulation", icon: <BookOpen />, color: "text-sky-700",
    items: [
      { 
        id: "5.1", fr: "Taux de rétention intra-africaine des diplômés", en: "Intra-African retention of graduates", 
        desc_fr: "Proportion d'étudiants circulant au sein du continent (Brain Circulation).", desc_en: "Proportion of students circulating within the continent (Brain Circulation).",
        method_fr: "Traçabilité des diplômés s'insérant professionnellement dans une autre sous-région africaine.", method_en: "Tracking graduates entering the workforce in another African sub-region.",
        contrast_fr: "Renverse le concept euro-centré de 'Brain Drain' pour valoriser la construction d'un marché continental des cerveaux.", contrast_en: "Overturns the Euro-centric concept of 'Brain Drain' to value the construction of a continental brain market."
      },
      { 
        id: "5.2", fr: "Reconnaissance mutuelle des acquis", en: "Mutual recognition of skills", 
        desc_fr: "Avancement des cadres légaux régionaux pour la portabilité des compétences.", desc_en: "Advancement of regional legal frameworks for skills portability.",
        method_fr: "Index mesurant l'opérationnalité des accords d'équivalence universitaire et professionnelle.", method_en: "Index measuring the operability of academic and professional equivalence agreements.",
        contrast_fr: "Démontre l'autonomie académique des Suds sans avoir besoin de faire valider les savoirs par les institutions du Nord.", contrast_en: "Demonstrates the academic autonomy of the South without needing to have knowledge validated by Northern institutions."
      }
    ]
  },
  {
    theme_fr: "Protection & Justice Sociale", theme_en: "Protection & Social Justice", icon: <Scale />, color: "text-slate-700",
    items: [
      { 
        id: "6.1", fr: "Décriminalisation de l'irrégularité", en: "Decriminalization of irregularity", 
        desc_fr: "Indicateur légal : absence de sanctions pénales pour les infractions migratoires.", desc_en: "Legal indicator: absence of criminal sanctions for migratory offenses.",
        method_fr: "Analyse des codes pénaux nationaux concernant l'entrée et le séjour irrégulier.", method_en: "Analysis of national penal codes regarding irregular entry and stay.",
        contrast_fr: "Déconstruit la fiction du 'migrant illégal' en séparant le simple défaut administratif de la criminalité de droit commun.", contrast_en: "Deconstructs the fiction of the 'illegal migrant' by separating simple administrative default from common criminality."
      },
      { 
        id: "6.2", fr: "Portabilité des droits sociaux", en: "Portability of social rights", 
        desc_fr: "Capacité des travailleurs à transférer leurs droits à la retraite ou au chômage.", desc_en: "Workers' ability to transfer their pension or unemployment rights.",
        method_fr: "Nombre et effectivité des conventions bilatérales de sécurité sociale.", method_en: "Number and effectiveness of bilateral social security conventions.",
        contrast_fr: "Arrête de considérer les migrants comme une simple force de travail jetable pour les reconnaître comme des sujets de droits sociaux.", contrast_en: "Stops considering migrants as merely disposable labor force to recognize them as subjects of social rights."
      }
    ]
  }
];

// ============================================================================
// 3. COMPOSANTS DES ONGLETS
// ============================================================================

const TabEvidenceCheck = ({ text, lang }) => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedFiche, setExpandedFiche] = useState(null);

  // Extraire les catégories uniques depuis les données
  const categoriesList = [...new Set(evidenceCheckData.map(item => item.category))];
  const allFilters = ["All", ...categoriesList];

  // Déterminer quelles catégories afficher selon le filtre actif
  const displayCategories = activeCategory === "All" 
    ? categoriesList 
    : [activeCategory];

  const getVerdictStyle = (level) => {
    switch (level) {
      case "🟢": return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "🟢🟡": return "bg-lime-100 text-lime-800 border-lime-300";
      case "🟡": return "bg-amber-100 text-amber-800 border-amber-300";
      case "🟠": return "bg-orange-100 text-orange-800 border-orange-300";
      case "🔴": return "bg-rose-100 text-rose-800 border-rose-300";
      case "⚪": return "bg-slate-100 text-slate-800 border-slate-300";
      default: return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader 
        badge={lang === 'fr' ? 'Observatoire des Narratifs' : 'Narratives Observatory'}
        title={lang === 'fr' ? 'Évaluation des affirmations' : 'Evidence Check'}
        highlight={lang === 'fr' ? 'à la lumière des données.' : 'powered by open data.'}
        desc={lang === 'fr' 
          ? "Cette section évalue le niveau de robustesse scientifique des affirmations publiques courantes sur les migrations. Elle ne cherche pas à juger, mais à objectiver le débat en croisant les meilleures sources institutionnelles disponibles."
          : "This section assesses the scientific robustness of common public claims regarding migrations based on the best available institutional sources."}
      />

      {/* Boutons de filtrage en haut */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-2 items-center justify-center">
        {allFilters.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => { setActiveCategory(cat); setExpandedFiche(null); }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm border ${
              activeCategory === cat 
                ? 'bg-slate-900 text-white border-slate-900 scale-105' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {cat === "All" ? (lang === 'fr' ? "Tout voir" : "View All") : cat}
          </button>
        ))}
      </section>

      {/* Rendu dynamique groupé par catégories */}
      <div className="space-y-16">
        {displayCategories.map((categoryName) => {
          // Filtrer les fiches appartenant à cette catégorie
          const catFiches = evidenceCheckData.filter(fiche => fiche.category === categoryName);
          // Récupérer l'icône de la catégorie depuis la première fiche
          const catIcon = catFiches.length > 0 ? catFiches[0].category_icon : '';

          return (
            <section key={categoryName} className="space-y-6 animate-in fade-in duration-500">
              
              {/* Titre de la section (Catégorie) */}
              <div className="flex items-center space-x-3 border-b border-slate-200 pb-3">
                <span className="text-3xl bg-white border border-slate-200 shadow-sm p-2 rounded-lg">{catIcon}</span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                  {categoryName}
                </h2>
              </div>

              {/* Grille des fiches pour cette catégorie */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {catFiches.map((fiche) => {
                  const isExpanded = expandedFiche === fiche.id;
                  return (
                    <div 
                      key={fiche.id} 
                      className={`bg-white rounded-xl border transition-all duration-300 flex flex-col shadow-sm ${
                        isExpanded ? 'border-slate-800 shadow-xl ring-1 ring-slate-800 z-10' : 'border-slate-200 hover:shadow-md hover:border-slate-300'
                      }`}
                    >
                      <div 
                        className="p-6 cursor-pointer group flex flex-col h-full"
                        onClick={() => setExpandedFiche(isExpanded ? null : fiche.id)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-xl">{fiche.category_icon}</span>
                            <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{fiche.category}</span>
                          </div>
                          <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border shadow-sm flex items-center space-x-1.5 ${getVerdictStyle(fiche.confidence_level)}`}>
                            <span className="text-sm">{fiche.confidence_level}</span>
                            <span>{fiche.verdict}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-slate-900 font-serif font-bold text-lg leading-tight mb-4 group-hover:text-blue-800 transition-colors">
                          « {fiche.narrative} »
                        </h3>

                        <div className="pt-4 border-t border-slate-100 mt-auto">
                          <span className="text-[9px] font-bold uppercase text-slate-400 tracking-widest block mb-2">
                            {lang === 'fr' ? 'Ce que montrent les données :' : 'What data shows:'}
                          </span>
                          <p className="text-slate-700 text-sm leading-relaxed font-medium">
                            {fiche.reality}
                          </p>
                        </div>
                        
                        <div className="flex justify-center mt-5">
                          <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-slate-800' : 'group-hover:text-blue-600'}`} />
                        </div>
                      </div>

                      <div className={`overflow-hidden transition-all duration-700 bg-slate-50 rounded-b-xl ${isExpanded ? 'max-h-[2000px] opacity-100 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 space-y-6">
                          {fiche.why_persists && fiche.why_persists.length > 0 && (
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-800 mb-3 flex items-center">
                                <Info className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                                {lang === 'fr' ? "Pourquoi ce narratif persiste ?" : "Why does this narrative persist?"}
                              </h4>
                              <ul className="space-y-2">
                                {fiche.why_persists.map((reason, i) => (
                                  <li key={i} className="flex items-start text-xs text-slate-600 leading-relaxed">
                                    <span className="text-blue-400 mr-2 mt-0.5">•</span> {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                {lang === 'fr' ? "📊 Indicateurs Croisés" : "📊 Crossed Indicators"}
                              </h4>
                              <ul className="space-y-1.5">
                                {fiche.indicators.map((ind, i) => (
                                  <li key={i} className="text-[11px] text-slate-700 bg-slate-100/50 p-1.5 rounded-sm border border-slate-100">{ind}</li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                {lang === 'fr' ? "🏛️ Sources" : "🏛️ Sources"}
                              </h4>
                              <ul className="space-y-1.5">
                                {fiche.sources.map((src, i) => (
                                  <li key={i} className="text-[11px] font-medium text-blue-800 bg-blue-50/50 p-1.5 rounded-sm border border-blue-100">{src}</li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 flex items-center">
                              <ShieldAlert className="w-3 h-3 mr-1.5" />
                              {lang === 'fr' ? "Limites méthodologiques :" : "Methodological limits:"}
                            </h4>
                            <p className="text-xs text-slate-500 italic">
                              {fiche.limits}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};

const TabGovernance = ({ text, lang, activeSdgzTab, setActiveSdgzTab }) => {
  const [expandedRec, setExpandedRec] = useState(null);
  const [matrixView, setMatrixView] = useState('table'); // 'table' ou 'details'

  // ========================================================================
  // 1. LES COMMUNAUTÉS ÉCONOMIQUES RÉGIONALES (CER)
  // ========================================================================
  const recsList = [
    {
      id: 'cedeao',
      name: 'CEDEAO / ECOWAS (Afrique de l’Ouest)',
      tag: lang === 'fr' ? 'Ouverture standardisée & pionnière' : 'Pioneering & standardized openness',
      desc: {
        fr: "La CEDEAO constitue le bloc de référence du régime continental. L'ouverture y est une présomption stabilisée dans les pratiques administratives, malgré la sécession en 2024-2025 de l'Alliance des États du Sahel (AES - Mali, Burkina Faso, Niger) qui vient fragmenter l'acquis historique de 1979.",
        en: "ECOWAS constitutes the reference bloc of the continental regime. Openness is a stabilized presumption in administrative practices, despite the 2024-2025 secession of the Alliance of Sahel States (AES - Mali, Burkina Faso, Niger) which fragments the historical 1979 acquis."
      },
      instruments: {
        fr: "Protocole de 1979 et Actes additionnels de 2014 (suppression de la limite de 90 jours). Processus consultatif : MIDWA (Dialogue sur la Migration en Afrique de l'Ouest).",
        en: "1979 Protocol and 2014 Additional Acts (removal of the 90-day limit). Consultative process: MIDWA (Migration Dialogue for West Africa)."
      },
      dynamics: {
        fr: "La région affichait l'indice AVOI le plus élevé (0,597), prouvant la force de son architecture. L'enjeu de 2026 est de gérer juridiquement le statut des millions de ressortissants de l'AES vivant en zone CEDEAO (notamment en Côte d'Ivoire).",
        en: "The region showed the highest AVOI index (0.597), proving the strength of its architecture. The 2026 challenge is legally managing the status of millions of AES citizens living in the ECOWAS zone (notably in Côte d'Ivoire)."
      }
    },
    {
      id: 'cae',
      name: 'CAE / EAC (Communauté d’Afrique de l’Est)',
      tag: lang === 'fr' ? 'Citoyenneté de marché & corridors' : 'Market citizenship & corridors',
      desc: {
        fr: "La CAE fonde son intégration sur une citoyenneté de marché. La mobilité y est pensée comme une condition de crédibilité du marché commun, articulant droit au travail, résidence et établissement de manière asymétrique.",
        en: "The EAC bases its integration on market citizenship. Mobility is seen as a condition for the credibility of the common market, asymmetrically articulating the right to work, residence, and establishment."
      },
      instruments: {
        fr: "Protocole du Marché commun (2010), politique de migration de travail (2025-2030), et forte procéduralisation douanière via les Postes-frontières à arrêt unique (OSBP).",
        en: "Common Market Protocol (2010), labor migration policy (2025-2030), and strong customs proceduralization via One-Stop Border Posts (OSBP)."
      },
      dynamics: {
        fr: "Un score AVOI élevé (~0,54) porté par le Rwanda et le Kenya (qui dispense d'ETA les membres de la CAE pour 180 jours). L'intégration de la RDC et de la Somalie ajoute cependant des défis sécuritaires complexes.",
        en: "A high AVOI score (~0.54) driven by Rwanda and Kenya (which exempts EAC members from ETA for 180 days). The integration of the DRC and Somalia, however, adds complex security challenges."
      }
    },
    {
      id: 'sadc',
      name: 'SADC (Communauté de Développement de l’Afrique Australe)',
      tag: lang === 'fr' ? 'Procéduralisation sectorielle & prudence' : 'Sectoral approach & caution',
      desc: {
        fr: "Face aux réticences souverainistes (notamment de l'Afrique du Sud), la SADC déploie une intégration asymétrique et sélective, privilégiant la gestion logistique des corridors et l'attraction des talents plutôt qu'une ouverture universelle.",
        en: "Faced with sovereign reluctance (notably from South Africa), SADC deploys an asymmetric and selective integration, prioritizing logistics corridor management and talent attraction over universal openness."
      },
      instruments: {
        fr: "Protocole de 2005, Plan sur la migration de travail (2020-2025). Processus consultatif : MIDSA (Dialogue sur la Migration pour l'Afrique Australe).",
        en: "2005 Protocol, Labour migration plan (2020-2025). Consultative process: MIDSA (Migration Dialogue for Southern Africa)."
      },
      dynamics: {
        fr: "Un espace dominé par la prudence (score AVOI de 0,491), polarisé par Pretoria (réforme BMA et White Paper de 2024). L'innovation passe par des accords bilatéraux (ex: utilisation de la carte d'identité entre le Botswana et la Namibie).",
        en: "A space dominated by caution (AVOI score of 0.491), polarized by Pretoria (BMA reform and 2024 White Paper). Innovation comes through bilateral agreements (e.g., ID card usage between Botswana and Namibia)."
      }
    },
    {
      id: 'comesa',
      name: 'COMESA (Marché Commun de l’Afrique Orientale et Australe)',
      tag: lang === 'fr' ? 'Facilitation macro-régionale' : 'Macro-regional facilitation',
      desc: {
        fr: "Vaste bloc de 21 États (de la Tunisie à l'Eswatini) où l'intégration humaine avance par accumulation technique (visas d'affaires) afin de réduire les coûts de transaction commerciale dans un espace hétérogène.",
        en: "Vast bloc of 21 States (from Tunisia to Eswatini) where human integration advances through technical accumulation (business visas) to reduce commercial transaction costs in a heterogeneous space."
      },
      instruments: {
        fr: "Protocoles de 1984 et 1998 (application inégale). Processus consultatif : MIDCOM. Production massive d'outils de capacitation technique.",
        en: "1984 and 1998 Protocols (uneven application). Consultative process: MIDCOM. Massive production of technical capacity-building tools."
      },
      dynamics: {
        fr: "L'obligation juridique de libre circulation pure y est supplantée par une rationalisation pragmatique liée à la facilitation commerciale et à la complémentarité avec la ZLECAf.",
        en: "The pure legal obligation of free movement is supplanted by pragmatic rationalization linked to trade facilitation and complementarity with the AfCFTA."
      }
    },
    {
      id: 'igad',
      name: 'IGAD (Autorité Intergouvernementale pour le Développement)',
      tag: lang === 'fr' ? 'Nexus sécurité-climat-mobilité' : 'Security-climate-mobility nexus',
      desc: {
        fr: "Dans une Corne de l'Afrique marquée par les conflits et les chocs climatiques, la mobilité est saisie par l'IGAD à l'articulation exacte entre sécurité régionale, transhumance de survie et développement.",
        en: "In a Horn of Africa marked by conflicts and climate shocks, mobility is captured by IGAD at the exact articulation between regional security, survival transhumance, and development."
      },
      instruments: {
        fr: "Deux protocoles pionniers en 2020 : Libre circulation des personnes ET Transhumance pastorale transfrontalière. Processus consultatif : MIDIGAD.",
        en: "Two pioneering protocols in 2020: Free movement of persons AND Cross-border pastoral transhumance. Consultative process: MIDIGAD."
      },
      dynamics: {
        fr: "A enregistré une forte progression de son ouverture (~0,50 AVOI) au début des années 2020, mais l'homogénéisation reste suspendue à l'instabilité géopolitique chronique de la sous-région (guerre au Soudan).",
        en: "Recorded strong progress in openness (~0.50 AVOI) in the early 2020s, but homogenization remains suspended on the chronic geopolitical instability of the sub-region (war in Sudan)."
      }
    },
    {
      id: 'ceeac',
      name: 'CEEAC & CEMAC (Afrique Centrale)',
      tag: lang === 'fr' ? 'Configuration à deux étages' : 'Two-tier configuration',
      desc: {
        fr: "L'Afrique Centrale repose sur une intégration à double vitesse où le noyau dense (CEMAC) porte la facilitation, tandis que le vaste ensemble CEEAC demeure entravé par les contraintes d'enclavement physique.",
        en: "Central Africa relies on a two-tier integration where the dense core (CEMAC) carries facilitation, while the vast ECCAS whole remains hampered by physical landlocked constraints."
      },
      instruments: {
        fr: "Traité révisé de la CEEAC (2019). Actes additionnels CEMAC (2013, 2017) instituant la suppression des visas pour 90 jours et le passeport biométrique communautaire.",
        en: "Revised ECCAS Treaty (2019). CEMAC Additional Acts (2013, 2017) establishing visa abolition for 90 days and the community biometric passport."
      },
      dynamics: {
        fr: "Le défi est la conversion de l'acquis CEMAC vers les piliers de résidence, et son extension au périmètre CEEAC face à des États très sourcilleux sur leur souveraineté sécuritaire (Gabon, Guinée Équatoriale).",
        en: "The challenge is converting the CEMAC acquis towards residence pillars, and its extension to the ECCAS perimeter facing States highly sensitive about their security sovereignty (Gabon, Equatorial Guinea)."
      }
    },
    {
      id: 'uma',
      name: 'UMA (Union du Maghreb Arabe)',
      tag: lang === 'fr' ? 'Normativité d’horizon & gel institutionnel' : 'Horizon normativity & institutional freeze',
      desc: {
        fr: "La paralysie géopolitique structurelle gèle l'ambition fondatrice de 1989. L'intégration de la mobilité maghrébine se fait aujourd'hui par défaut, via l'externalisation sécuritaire européenne et des accords bilatéraux épars.",
        en: "Structural geopolitical paralysis freezes the 1989 founding ambition. Maghreb mobility integration currently happens by default, via European security externalization and scattered bilateral agreements."
      },
      instruments: {
        fr: "Traité de Marrakech (1989) comme pur horizon normatif.",
        en: "Marrakech Treaty (1989) as a pure normative horizon."
      },
      dynamics: {
        fr: "Le bloc affiche la moyenne d'ouverture la plus basse du continent. L'Algérie a notamment imposé des visas aux ressortissants marocains fin 2024, illustrant le recul de l'intégration sous-régionale.",
        en: "The bloc shows the lowest openness average on the continent. Algeria notably imposed visas on Moroccan nationals in late 2024, illustrating the regression of sub-regional integration."
      }
    }
  ];

  // ========================================================================
  // 2. LES CADRES ET TEXTES FONDAMENTAUX DE L'UNION AFRICAINE
  // ========================================================================
  const auFrameworks = [
    {
      title: { fr: "L'Agenda 2063 & STYIP (2024-2033)", en: "Agenda 2063 & STYIP (2024-2033)" },
      tag: { fr: "Vision Téléologique", en: "Teleological Vision" },
      desc: {
        fr: "Adopté en 2015, c'est le grand parapluie stratégique de l'Union. Son Second Plan Décennal de Mise en Œuvre (STYIP) place la libre circulation au cœur du développement.",
        en: "Adopted in 2015, it is the Union's overarching strategic umbrella. Its Second Ten-Year Implementation Plan (STYIP) places free movement at the heart of development."
      },
      article: {
        ref: "Aspiration N°2 (Agenda 2063)",
        textFr: "« Un continent intégré, politiquement uni, basé sur les idéaux du Panafricanisme et la vision de la Renaissance africaine. (...) L'introduction d'un passeport africain et l'abolition de l'obligation de visa pour tous les citoyens africains. »",
        textEn: "« An integrated continent, politically united and based on the ideals of Pan-Africanism and the vision of Africa’s Renaissance. (...) The introduction of an African passport and the abolition of visa requirements for all African citizens. »"
      }
    },
    {
      title: { fr: "Le Traité d'Abuja (1991)", en: "The Abuja Treaty (1991)" },
      tag: { fr: "Acte Fondateur", en: "Foundational Act" },
      desc: {
        fr: "L'acte fondateur de la Communauté économique africaine (CEA). Il ancre juridiquement la libre circulation comme condition sine qua non de l'intégration des marchés.",
        en: "The founding act of the African Economic Community (AEC). It legally anchors free movement as a sine qua non condition for market integration."
      },
      article: {
        ref: "Article 43 - Chapitre VI",
        textFr: "« Les États membres conviennent d’adopter, individuellement, à l’échelon bilatéral ou régional, les mesures nécessaires en vue de réaliser progressivement la libre circulation des personnes, et de garantir la jouissance du droit de résidence et d’établissement à leurs ressortissants. »",
        textEn: "« Member States agree to adopt, individually, at bilateral or regional levels, the necessary measures, in order to achieve progressively the free movement of persons, and to ensure the enjoyment of the right of residence and the right of establishment by their nationals. »"
      }
    },
    {
      title: { fr: "Le Protocole de Kigali (2018)", en: "The Kigali Protocol (2018)" },
      tag: { fr: "Le Droit Entravé", en: "Hindered Law" },
      desc: {
        fr: "Le Protocole sur la Libre Circulation vise à opérationnaliser l'Art. 43 d'Abuja. Paradoxe : ratifié par 4 pays seulement (Rwanda, Sao Tomé, Mali, Niger - ces deux derniers ayant pourtant quitté la CEDEAO pour l'AES).",
        en: "The Protocol on Free Movement aims to operationalize Art. 43 of Abuja. Paradox: ratified by only 4 countries (Rwanda, Sao Tome, Mali, Niger - the latter two having nevertheless left ECOWAS for the AES)."
      },
      article: {
        ref: "Article 4 - Réalisation progressive",
        textFr: "« La libre circulation des personnes, le droit de résidence et le droit d'établissement sont réalisés en trois (3) phases : Première phase - Droit d'entrée; Deuxième phase - Droit de résidence; Troisième phase - Droit d'établissement. »",
        textEn: "« The free movement of persons, right of residence and right of establishment shall be achieved in three (3) phases: Phase One - Right of Entry; Phase Two - Right of Residence; Phase Three - Right of Establishment. »"
      }
    },
    {
      title: { fr: "La ZLECAf & Le 'Mode 4' (2018)", en: "AfCFTA & 'Mode 4' (2018)" },
      tag: { fr: "Le Cheval de Troie Économique", en: "Economic Trojan Horse" },
      desc: {
        fr: "Face au blocage politique du Protocole de Kigali, l'Accord sur la Zone de Libre-Échange force la mobilité par le prisme économique (les services), obligeant les États à laisser circuler les travailleurs qualifiés liés au commerce.",
        en: "Facing the political blockage of the Kigali Protocol, the Free Trade Area Agreement forces mobility through the economic prism (services), compelling States to allow trade-related skilled workers to circulate."
      },
      article: {
        ref: "Protocole sur le Commerce des Services - Art. 1(p)",
        textFr: "« Fourniture d'un service par la présence de personnes physiques (Mode 4) d'un État partie sur le territoire d'un autre État partie. (...) Les États parties négocient des engagements spécifiques applicables au mouvement des personnes physiques. »",
        textEn: "« Supply of a service by the presence of natural persons (Mode 4) of a State Party in the territory of any other State Party. (...) State Parties shall negotiate specific commitments applying to the movement of natural persons. »"
      }
    },
    {
      title: { fr: "Conventions sur la Protection (1969 & 2009)", en: "Protection Conventions (1969 & 2009)" },
      tag: { fr: "Asile & Solidarité", en: "Asylum & Solidarity" },
      desc: {
        fr: "L'Afrique a inventé une définition du réfugié plus inclusive que l'ONU (Convention OUA 1969) et est le seul continent avec un traité contraignant protégeant les déplacés internes (Convention de Kampala 2009).",
        en: "Africa invented a more inclusive refugee definition than the UN (1969 OAU Convention) and is the only continent with a binding treaty protecting internally displaced persons (2009 Kampala Convention)."
      },
      article: {
        ref: "Article 1.2 - Convention OUA 1969",
        textFr: "« Le terme “réfugié” s’applique également à toute personne qui, du fait d’une agression, d’une occupation extérieure, d’une domination étrangère ou d’événements troublant gravement l’ordre public (...) est obligée de quitter sa résidence habituelle. »",
        textEn: "« The term “refugee” shall also apply to every person who, owing to external aggression, occupation, foreign domination or events seriously disturbing public order (...) is compelled to leave his place of habitual residence. »"
      }
    }
  ];

  // ========================================================================
  // 3. MATRICES ET PROFILS JURIDIQUES (54 PAYS)
  // ========================================================================
  const legalMatrixData = [
    {
      region: "Afrique Méditerranéenne",
      intro: "La région méditerranéenne se caractérise par des systèmes d'immigration codifiés, influencés par le droit civil (Maghreb) ou des systèmes mixtes (Égypte, Soudan). Le seuil de résidence y est strictement policé, exigeant souvent une sortie du territoire ou des démarches bureaucratiques complexes pour étendre le séjour au-delà de l'allocation touristique standard.",
      countries: [
        {
          name: "Algérie", threshold: "90 Jours", tableNotes: "Max 180 jours/an. Carte de résident requise après 90 jours.",
          instrument: "Loi N° 08-11 du 25 juin 2008 relative aux conditions d'entrée, de séjour et de circulation des étrangers.",
          details: [
            { label: "Analyse Juridique", text: "La durée maximale de séjour autorisé à chaque entrée est de 90 jours. Cette durée peut être exceptionnellement prorogée de 90 jours supplémentaires, mais le séjour effectif cumulé ne peut excéder 180 jours par an." },
            { label: "Obligation de Résidence", text: "Tout étranger souhaitant séjourner au-delà de la validité de son visa (ou de l'extension) doit solliciter une « Carte de Résident ». La loi opère une distinction nette entre le « visa de court séjour » et le permis de résidence. Le défaut d'obtention de la carte de résident après l'expiration du visa constitue un séjour illégal passible de sanctions pénales et administratives." }
          ]
        },
        {
          name: "Égypte", threshold: "30-90 Jours", tableNotes: "Enregistrement requis sous 7 jours. Permis après expiration visa.",
          instrument: "Loi N° 89 de 1960 sur l'entrée et le séjour des étrangers (amendée par Loi 88/2005 et Loi 173/2018).",
          details: [
            { label: "Analyse Juridique", text: "Les visas touristiques standard sont généralement délivrés pour 30 jours. Toutefois, la loi catégorise la résidence en trois niveaux temporels distincts : « Spéciale », « Ordinaire » et « Temporaire »." },
            { label: "Mécanisme de Transition", text: "Un visiteur souhaitant rester doit demander un permis de résidence temporaire (souvent valide pour 6 mois à 1 an) avant l'expiration de son visa touristique. Récemment, des décrets ont instauré une période de grâce pour la régularisation des résidents illégaux moyennant le paiement d'amendes (env. 1 000 USD), soulignant la volonté de l'État d'imposer le permis de résidence." }
          ]
        },
        {
          name: "Libye", threshold: "90 Jours (3 Mois)", tableNotes: "Visa de Résidence requis pour séjours > 3 mois.",
          instrument: "Loi N° 6 de 1987 organisant l'entrée, le séjour et la sortie des étrangers.",
          details: [
            { label: "Analyse Juridique", text: "Les visas d'entrée autorisent un séjour maximal de trois mois. L'article 5 de la loi classifie explicitement les visas en : entrée, transit, sortie et résidence." },
            { label: "Obligation d'Enregistrement", text: "Pour séjourner au-delà de trois mois, un étranger doit obtenir un « Visa de Résidence » puis un permis. La loi impose une exigence d'enregistrement stricte : tout étranger doit s'enregistrer auprès de l'autorité des passeports la plus proche dans les sept jours suivant son arrivée. C'est l'une des fenêtres de surveillance administrative les plus étroites du continent." }
          ]
        },
        {
          name: "Maroc", threshold: "90 Jours", tableNotes: "Extension possible, mais carte d'immatriculation requise > 90 jours.",
          instrument: "Loi N° 02-03 relative à l'entrée et au séjour des étrangers au Royaume du Maroc.",
          details: [
            { label: "Analyse Juridique", text: "L'article 8 de la Loi 02-03 stipule explicitement que tout étranger souhaitant séjourner sur le territoire marocain pour une durée supérieure à 90 jours est tenu de demander une « Carte d'Immatriculation »." },
            { label: "Sanctions", text: "Le dépassement de ce seuil de 90 jours sans dépôt de demande de carte constitue une infraction. Bien que des prolongations de visa soient possibles pour des motifs exceptionnels, la norme juridique fixe la fin du statut de simple visiteur au 90e jour." }
          ]
        },
        {
          name: "Mauritanie", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi N° 1965-046 et Décrets subséquents.",
          details: [
            { label: "Analyse Juridique", text: "Les visas sont délivrés pour des durées de 30 à 90 jours. Un étranger désirant rester au-delà de la durée du visa doit obligatoirement solliciter une « Carte de Séjour »." },
            { label: "Réforme", text: "Récemment, la validité de la carte de séjour a été étendue d'un an à cinq ans, facilitant la vie des résidents à long terme, mais le seuil d'entrée déclenchant cette obligation demeure l'expiration du visa court séjour. Le système « e-visa » facilite l'entrée mais ne confère aucun droit de résidence." }
          ]
        },
        {
          name: "Tunisie", threshold: "90 Jours (3 Mois)", tableNotes: "Carte de séjour obligatoire après 3 mois consécutifs.",
          instrument: "Loi N° 68-7 du 8 mars 1968 relative à la condition des étrangers.",
          details: [
            { label: "Analyse Juridique", text: "L'article 7 précise que le visa d'entrée spécifie la durée de séjour autorisée, qui ne peut excéder trois mois." },
            { label: "Obligation de Résidence", text: "Tout étranger souhaitant séjourner plus de 3 mois consécutifs ou 6 mois au total par an doit demander une « Carte de Séjour » et un « Visa de Séjour ». La règle des 3 mois est appliquée rigoureusement, avec des pénalités hebdomadaires pour tout dépassement non régularisé à la sortie." }
          ]
        }
      ]
    },
    {
      region: "Afrique de l'Ouest",
      intro: "L'Afrique de l'Ouest présente un régime d'immigration dual : l'un pour les citoyens de la CEDEAO et l'autre pour les ressortissants tiers. Le Protocole A/P.1/5/79 de la CEDEAO établit un privilège de 90 jours sans visa, qui est devenu le seuil de facto pour définir le « visiteur » dans toute la région. Reste la zone la plus intégrée avec 15 pays offrant une libre circulation totale.",
      countries: [
        {
          name: "Bénin", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi N° 2022-31 / Loi N° 2025-15 (Nouvelle).",
          details: [
            { label: "Analyse", text: "Les e-visas de court séjour sont disponibles pour 30 ou 90 jours." },
            { label: "Obligation", text: "« Tout étranger souhaitant séjourner [...] pour une période excédant 90 jours doit détenir une carte de séjour ». La nouvelle Loi 2025-15 renforce ces conditions, maintenant le seuil de 90 jours comme la ligne de démarcation entre visiteur et résident." }
          ]
        },
        {
          name: "Burkina Faso", threshold: "90 Jours", tableNotes: "Permis de résidence requis après 90 jours.",
          instrument: "Loi 2024 (remplaçant l'Ordonnance n°84-049).",
          details: [
            { label: "Analyse", text: "« Tout étranger souhaitant séjourner au Burkina Faso pour une période excédant quatre-vingt-dix (90) jours doit détenir soit un visa long séjour, soit un permis de résidence »." },
            { label: "Transition", text: "Le visa long séjour (valide 1 an) ou la « Carte de Résident » est requis immédiatement après l'expiration de la période visiteur de 90 jours. La loi de 2024 a durci les contrôles aux frontières." }
          ]
        },
        {
          name: "Cap-Vert", threshold: "90 Jours", tableNotes: "Visa extensible, mais autorisation résidence nécessaire > 90 jours.",
          instrument: "Loi N° 66/VIII/2014.",
          details: [
            { label: "Analyse", text: "Les visas touristiques permettent un séjour jusqu'à 90 jours, prolongeable une fois. Pour les citoyens exemptés de visa, l'enregistrement EASE permet 30 jours." },
            { label: "Obligation", text: "Les séjours dépassant la limite du visa (90 jours) nécessitent une « Autorização de Residência ». La loi distingue strictement le « Visa » de la « Résidence ». Des changements récents facilitent l'accès pour la CPLP." }
          ]
        },
        {
          name: "Côte d'Ivoire", threshold: "90 Jours (3 Mois)", tableNotes: "Titre de séjour obligatoire après 3 mois.",
          instrument: "Loi N° 2004-303 (et Loi N° 2002-03).",
          details: [
            { label: "Analyse", text: "Un permis de résidence (« Titre de Séjour ») est obligatoire pour quiconque a l'intention de séjourner plus de trois mois." },
            { label: "Obligation", text: "S'applique aux travailleurs, étudiants et dépendants. La « Carte de Résident » est valide 5 ans pour les nationaux CEDEAO et 1 an pour les autres. Le système est biométrique et exige une présence à l'Office National d'Identification." }
          ]
        },
        {
          name: "Gambie", threshold: "28-90 Jours", tableNotes: "Non-CEDEAO besoin permis après 56-90 jours.",
          instrument: "Immigration Act (Cap 16:02).",
          details: [
            { label: "Entrée Standard", text: "Les visiteurs reçoivent généralement un tampon de 28 jours initialement, extensible." },
            { label: "Nationaux non-CEDEAO", text: "Sont tenus d'obtenir un permis de résidence (« Alien Card » + « Residential Permit B ») s'ils séjournent au-delà de 56 jours, bien que 90 jours soit souvent la limite pratique maximale pour les extensions avant l'application stricte de la résidence." }
          ]
        },
        {
          name: "Ghana", threshold: "60-90 Jours", tableNotes: "Max 90 jours (CEDEAO). Permis résidence pour > 90 jours.",
          instrument: "Immigration Act, 2000 (Act 573).",
          details: [
            { label: "Analyse", text: "Les visiteurs se voient accorder un maximum de 60 jours initialement (90 jours pour la CEDEAO). Cela peut être étendu jusqu'à 90 jours." },
            { label: "Obligation", text: "Tout non-Ghanéen ayant l'intention de résider pour plus de 90 jours (ou extension maximale de 6 mois) doit obtenir un permis de résidence. La résidence indéfinie est possible après 5 ans." }
          ]
        },
        {
          name: "Guinée", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi L/94/019/CTRN (1994).",
          details: [
            { label: "Analyse", text: "Le « Visa de court séjour » est valide jusqu'à 90 jours." },
            { label: "Obligation", text: "Les étrangers ayant l'intention de rester plus longtemps doivent demander une « Carte de Séjour ». La validité du visa permet l'entrée, mais la carte est le document de résidence requis sur le territoire." }
          ]
        },
        {
          name: "Guinée-Bissau", threshold: "90 Jours", tableNotes: "Permis de résidence requis après 90 jours.",
          instrument: "Loi N° 2/92 (Citoyenneté) et Décret-Loi sur les Étrangers.",
          details: [
            { label: "Analyse", text: "Les visas à l'arrivée sont valides pour un maximum de 90 jours." },
            { label: "Obligation", text: "Pour les séjours dépassant cette période, une « Autorização de Residência » est requise. La loi mandate l'enregistrement pour tout séjour impliquant un établissement." }
          ]
        },
        {
          name: "Liberia", threshold: "60 Jours", tableNotes: "Séjour initial 60 jours. Permis résidence pour plus long.",
          instrument: "Aliens and Nationality Law (Titre 4).",
          details: [
            { label: "Analyse", text: "« La période pour laquelle un visiteur étranger est autorisé à entrer au Liberia sera fixée [...] pour une période de 60 jours »." },
            { label: "Obligation", text: "Ce seuil est notablement plus court que la norme régionale de 90 jours. Pour tout séjour à long terme, un « Residence Permit » est requis immédiatement à l'expiration de l'admission visiteur de 60 jours." }
          ]
        },
        {
          name: "Mali", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi N° 04-058 (2004).",
          details: [
            { label: "Analyse", text: "Le « Visa Long Séjour » est requis pour les séjours excédant 90 jours." },
            { label: "Obligation", text: "Dès l'arrivée avec un visa long séjour (ou après 90 jours sur un visa régulier), l'étranger doit solliciter une « Carte de Séjour ». L'article 22 prévoit l'emprisonnement pour séjour sans permis." }
          ]
        },
        {
          name: "Niger", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Ordonnance N° 81-40 (1981).",
          details: [
            { label: "Analyse", text: "Les ressortissants étrangers ayant l'intention de séjourner plus de 90 jours doivent demander une « Carte de Séjour » (Permis de Résidence Temporaire)." },
            { label: "Procédure", text: "Cette ordonnance reste le socle du droit de l'immigration au Niger. Les citoyens de la CEDEAO nécessitent également des cartes de séjour pour l'établissement, bien que la procédure soit simplifiée." }
          ]
        },
        {
          name: "Nigeria", threshold: "90 Jours", tableNotes: "CERPAC requis pour emploi ou séjour > 90 jours (non-CEDEAO).",
          instrument: "Immigration Act 2015.",
          details: [
            { label: "Analyse", text: "« Les Visas de Court Séjour permettent aux voyageurs de visiter le Nigeria pour une période n'excédant pas trois mois (90 jours) »." },
            { label: "Obligation", text: "Pour l'emploi ou la résidence au-delà de 90 jours, le CERPAC est obligatoire. Une mise à jour politique de 2025 a introduit des amendes journalières (15 USD) pour les dépassements de séjour, soulignant la rigueur de la limite." }
          ]
        },
        {
          name: "Sénégal", threshold: "90 Jours", tableNotes: "Carte d'identité d'étranger obligatoire après 90 jours.",
          instrument: "Loi N° 71-10 (1971) et Décret 71-860.",
          details: [
            { label: "Analyse", text: "« Pour séjourner au Sénégal plus de 90 jours, vous devez obtenir une carte nationale d'identité étrangère (Carte d'Identité d'Étranger) »." },
            { label: "Note", text: "Ceci s'applique même aux ressortissants exemptés de visa (comme les Français ou citoyens CEDEAO). La marque des 90 jours est le déclencheur légal définitif." }
          ]
        },
        {
          name: "Sierra Leone", threshold: "30-90 Jours", tableNotes: "Permis de résidence requis pour séjours > 90 jours.",
          instrument: "Non-Citizens (Registration, Immigration and Expulsion) Act, 1965.",
          details: [
            { label: "Analyse", text: "Les visas à entrer unique sont valides 90 jours à l'émission pour des visites jusqu'à un maximum de 30 jours." },
            { label: "Obligation", text: "« Un Permis de Travail & Résidence doit être obtenu dans les 30 jours suivant l'arrivée » pour ceux qui ont l'intention de rester. L'un des seuils les plus courts du continent." }
          ]
        },
        {
          name: "Togo", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi sur la Police des Étrangers (1987, actualisée 2022).",
          details: [
            { label: "Analyse", text: "Les visas touristiques sont valides jusqu'à 90 jours. « Tout étranger souhaitant séjourner [...] pour une période excédant 90 jours doit détenir une carte de séjour »." },
            { label: "Réforme", text: "La nouvelle loi de 2022 a renforcé les pénalités pour dépassement de séjour et rationalisé le processus de permis de résidence." }
          ]
        }
      ]
    },
    {
      region: "Afrique Centrale",
      intro: "La région CEMAC soutient théoriquement la libre circulation, mais la mise en œuvre nationale est caractérisée par une haute sécurisation. Le seuil pour les visiteurs est généralement de 90 jours, mais l'exigence de permis de résidence (souvent liée à des cautions de rapatriement) est strictement appliquée.",
      countries: [
        {
          name: "Cameroun", threshold: "90 Jours (3 Mois)", tableNotes: "Carte de séjour requise après 3 mois.",
          instrument: "Loi N° 97/012 (1997).",
          details: [
            { label: "Analyse", text: "L'article 17 stipule : « Tout étranger [...] doit, dans un délai de trois (3) mois [...] se présenter aux autorités compétentes pour solliciter une carte de séjour »." },
            { label: "Mandat", text: "La marque des 3 mois est l'échéance statutaire pour demander une carte de séjour. Les visiteurs restant moins de ce délai sont des « visiteurs temporaires »." }
          ]
        },
        {
          name: "RCA", threshold: "90 Jours (3 Mois)", tableNotes: "Titre de séjour requis après 3 mois.",
          instrument: "Code de l'Immigration.",
          details: [
            { label: "Analyse", text: "Les exemptions de visa (pour la CEMAC) vont jusqu'à 90 jours. Pour les autres, les visas court séjour couvrent la même période." },
            { label: "Obligation", text: "« À l'arrivée, l'individu doit demander un permis de résidence (Titre de Séjour) pour tout séjour supérieur à trois mois »." }
          ]
        },
        {
          name: "Tchad", threshold: "90 Jours (3 Mois)", tableNotes: "Carte de séjour requise après 3 mois.",
          instrument: "Ordonnance N° 27-62.",
          details: [
            { label: "Analyse", text: "Similaire aux autres États de la CEMAC, la période visiteur est plafonnée à 3 mois. « Une carte de séjour est requise pour les expatriés »." },
            { label: "Enregistrement", text: "L'enregistrement auprès de l'immigration est requis dans les 72 heures suivant l'arrivée, une mesure de sécurité commune au Sahel." }
          ]
        },
        {
          name: "Congo (Rep)", threshold: "90 Jours (3 Mois)", tableNotes: "Permis de résidence requis après 3 mois.",
          instrument: "Loi N° 23-96 (1996).",
          details: [
            { label: "Analyse", text: "« Les étrangers séjournant [...] devront dans les trois mois, se soumettre aux dispositions qui précèdent » (concernant la résidence)." },
            { label: "Exigence", text: "Un permis de résidence est obligatoire après l'expiration de la fenêtre visiteur de 3 mois." }
          ]
        },
        {
          name: "RDC", threshold: "~6 Mois", tableNotes: "Visa voyage max 6 mois. Visa établissement pour résidence.",
          instrument: "Ordonnance-Loi 83-033 relative à la Police des Étrangers.",
          details: [
            { label: "Analyse", text: "Le « Visa de Voyage » autorise un séjour jusqu'à 6 mois. C'est toutefois la limite supérieure pour un visiteur." },
            { label: "Obligation", text: "Pour l'« établissement » (résidence), un « Visa d'Établissement » spécifique est requis. La RDC permet une validité de visa visiteur jusqu'à 6 mois, mais l'intention de résidence doit être déclarée plus tôt." }
          ]
        },
        {
          name: "Guinée Équatoriale", threshold: "90 Jours", tableNotes: "Permis de résidence requis après 90 jours.",
          instrument: "Loi Organique N° 3/2010.",
          details: [
            { label: "Analyse", text: "« Les visas de court terme sont valides pour 90 jours. Pour des séjours plus longs, vous devez vous adresser aux postes de police locaux »." },
            { label: "Exigence", text: "Les permis de résidence sont requis pour tout séjour à long terme au-delà de la limite de 3 mois. Les nationaux CEMAC peuvent entrer avec une CNI, mais le seuil s'applique." }
          ]
        },
        {
          name: "Gabon", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi N° 5/86.",
          details: [
            { label: "Analyse", text: "« Les visiteurs qui souhaitent rester dans le pays pour plus de 90 jours doivent obtenir un permis de résidence (carte de séjour) »." },
            { label: "Application", text: "Stricte. Les visas de sortie ne sont plus requis pour les résidents, mais la carte de séjour est obligatoire après 3 mois." }
          ]
        },
        {
          name: "Sao Tomé", threshold: "15-30 Jours", tableNotes: "Seuil très court. Résidence requise après 30-90 jours.",
          instrument: "Loi N° 5/2008.",
          details: [
            { label: "Analyse", text: "Les exemptions de visa sont souvent de 15 jours. Les visas touristiques sont généralement valides pour 30 jours." },
            { label: "Obligation", text: "Pour les séjours plus longs que ces courtes durées, un permis de résidence est requis. Le seuil initial de visiteur est notablement plus court que la moyenne continentale." }
          ]
        }
      ]
    },
    {
      region: "Afrique de l'Est",
      intro: "La Communauté d'Afrique de l'Est (CAE) fournit un cadre robuste pour le mouvement, mais des lois nationales distinctes s'appliquent aux non-citoyens de la CAE. Le seuil est généralement de 90 jours, avec des allocations spécifiques (souvent 6 mois) pour les visiteurs régionaux. Forte progression de la réciprocité, notamment entre la RDC, l'Ouganda et le Sud-Soudan.",
      countries: [
        {
          name: "Burundi", threshold: "30 Jours (extensible)", tableNotes: "Permis de résidence généralement requis après 3 mois.",
          instrument: "Loi N° 1/13 (2011).",
          details: [
            { label: "Analyse", text: "Les voyageurs obtiennent un visa de 30 jours à l'arrivée. Ceci peut être étendu. « Ceux qui restent plus de 30 jours peuvent aussi demander un visa de trois mois [...] Permis de résidence requis pour plus longtemps »." },
            { label: "Limite", text: "Le plafond visiteur est généralement fixé à 3 mois avant que le permis de résidence ne devienne nécessaire." }
          ]
        },
        {
          name: "Comores", threshold: "45 Jours", tableNotes: "Visa à l'arrivée 45 jours. Permis résidence pour plus long.",
          instrument: "Loi N° 88-025 (1988).",
          details: [
            { label: "Analyse", text: "Le visa à l'arrivée est valide pour 45 jours." },
            { label: "Obligation", text: "Tout étranger souhaitant rester au-delà de cette période doit demander un permis de résidence. C'est une durée spécifique à l'archipel, légèrement plus courte que les 90 jours standards." }
          ]
        },
        {
          name: "Djibouti", threshold: "90 Jours", tableNotes: "Carte de séjour requise après 90 jours.",
          instrument: "Loi N° 201/AN/07.",
          details: [
            { label: "Analyse", text: "« La loi sur l'immigration djiboutienne permet aux visiteurs d'entrer et de rester pour 90 jours avec un eVisa »." },
            { label: "Obligation", text: "« Ceux souhaitant rester plus de 90 jours doivent travailler avec les autorités pour ajuster leur statut » (Carte de Séjour)." }
          ]
        },
        {
          name: "Érythrée", threshold: "90 Jours (3 Mois)", tableNotes: "Permis de résidence requis après 3-6 mois.",
          instrument: "Proclamation N° 24/1992.",
          details: [
            { label: "Analyse", text: "« Un visa touristique [...] peut permettre au titulaire de rester en Érythrée pendant les trois mois »." },
            { label: "Obligation", text: "« Tout étranger qui [...] a séjourné pour pas plus de six mois doit demander un permis de résidence ». Bien que le visa touristique soit de 3 mois, la date limite absolue pour la résidence semble être de 6 mois." }
          ]
        },
        {
          name: "Éthiopie", threshold: "90 Jours", tableNotes: "ID de Résidence requise après 90 jours.",
          instrument: "Immigration Proclamation N° 354/2003.",
          details: [
            { label: "Analyse", text: "Lese-visas touristiques sont émis pour 30 ou 90 jours." },
            { label: "Obligation", text: "« Tout étranger qui [...] a l'intention de rester pour plus de quatre-vingt-dix jours [...] doit s'enregistrer dans les trente jours suivant son arrivée ». La marque des 90 jours est le seuil critique." }
          ]
        },
        {
          name: "Kenya", threshold: "90 Jours (extensible)", tableNotes: "Max 6 mois pass visiteur. Permis requis ensuite.",
          instrument: "Kenya Citizenship and Immigration Act 2011.",
          details: [
            { label: "Analyse", text: "Un pass visiteur est valide pour 3 mois initialement. Il peut être étendu pour 3 autres mois. La période agrégée maximale est de 6 mois." },
            { label: "Obligation", text: "Au-delà de 6 mois, un Permis (Classe K, etc.) est strictement requis. La transition de Visiteur à Résident doit se produire avant le plafond de 6 mois." }
          ]
        },
        {
          name: "Madagascar", threshold: "90 Jours", tableNotes: "Carte de résident requise après 3 mois.",
          instrument: "Loi N° 62-006 (1962).",
          details: [
            { label: "Analyse", text: "« Les étrangers entrant à Madagascar pour une période n'excédant pas trois mois sont des non-immigrants »." },
            { label: "Obligation", text: "« Les étrangers séjournant [...] durant une période supérieure à trois mois sont des immigrants ». Ainsi, le seuil de résidence est de 3 mois." }
          ]
        },
        {
          name: "Maurice", threshold: "90-180 Jours", tableNotes: "Max 180 jours/an touriste. Permis pour plus long/travail.",
          instrument: "Immigration Act 2022.",
          details: [
            { label: "Analyse", text: "Les visas touristiques permettent un séjour cumulatif de 180 jours par an. Toutefois, une visite unique est souvent plafonnée à 90 jours." },
            { label: "Premium Visa", text: "Maurice a introduit un « Premium Visa » permettant un séjour d'1 an pour les nomades numériques. Les permis de résidence standards sont pour l'emploi/investissement." }
          ]
        },
        {
          name: "Rwanda", threshold: "30-90 Jours", tableNotes: "Permis requis après 30/90 jours selon origine.",
          instrument: "Loi N° 57/2018.",
          details: [
            { label: "Analyse", text: "30 jours pour beaucoup de nationaux ; 90 jours pour les accords spécifiques (ex: CAE, UA)." },
            { label: "Obligation", text: "« Permis de résidence temporaire [...] période de grâce de 15 jours à l'arrivée [...] pour postuler ». Les visiteurs purs peuvent rester jusqu'à la validité de leur visa." }
          ]
        },
        {
          name: "Seychelles", threshold: "3 Mois", tableNotes: "Permis visiteur extensible jusqu'à 12 mois.",
          instrument: "Immigration Decree 1979.",
          details: [
            { label: "Analyse", text: "Un permis visiteur est valide pour 3 mois initialement." },
            { label: "Extension", text: "Il peut être étendu par tranches de 3 mois jusqu'à un maximum de 12 mois. On peut rester « visiteur » jusqu'à un an, mais cela exige une extension active." }
          ]
        },
        {
          name: "Somalie", threshold: "30 Jours", tableNotes: "Permis de résidence requis pour plus long.",
          instrument: "Immigration Law 1966.",
          details: [
            { label: "Analyse", text: "Le visa à l'arrivée est valide pour 30 jours." },
            { label: "Obligation", text: "« Les visas long terme ont une durée qui excède 90 jours [...] les détenteurs de ces types de visas reçoivent la résidence ». La limite visiteur est très courte." }
          ]
        },
        {
          name: "Soudan", threshold: "90 Jours (3 Mois)", tableNotes: "Enregistrement étranger requis après 3 mois.",
          instrument: "Passports and Immigration Act de 1994.",
          details: [
            { label: "Analyse Juridique", text: "La loi dispose qu'« aucun visa n'est requis pour les visiteurs qui ne restent pas au Soudan plus de trois mois »." },
            { label: "Obligation de Résidence", text: "La section 25 impose que « tout étranger résidant au Soudan pour plus de trois mois doit s'adresser à l'officier d'enregistrement [...] pour se faire enregistrer ». De plus, les étrangers doivent signaler leur présence dans les 3 jours suivant l'arrivée." }
          ]
        },
        {
          name: "Soudan du Sud", threshold: "90 Jours (3 Mois)", tableNotes: "Permis de résidence requis après 3 mois.",
          instrument: "Passports and Immigration Act, 2011.",
          details: [
            { label: "Analyse", text: "« Les touristes séjournant pour une période n'excédant pas trois mois au Nouveau Soudan sont exemptés de prendre des permis de résidence »." },
            { label: "Obligation", text: "Permis de résidence requis strictement après 3 mois." }
          ]
        },
        {
          name: "Tanzanie", threshold: "90 Jours", tableNotes: "Permis de Résidence requis après 90 jours.",
          instrument: "Immigration Act 1995 (Cap 54).",
          details: [
            { label: "Analyse", text: "« La validité du Pass Visiteur n'excédera pas 90 jours »." },
            { label: "Obligation", text: "Tout séjour au-delà de 90 jours nécessite un Permis de Résidence (Classe A, B, ou C)." }
          ]
        },
        {
          name: "Ouganda", threshold: "90 Jours", tableNotes: "Special Pass ou Entry Permit requis après 90 jours.",
          instrument: "Citizenship and Immigration Control Act (Cap 66).",
          details: [
            { label: "Analyse", text: "« Un étranger en possession d'un pass visiteur valide ou spécial dont la période de séjour n'excède pas quatre-vingt-dix jours » est exempté de l'enregistrement des étrangers." },
            { label: "Obligation", text: "Les séjours au-delà de 90 jours nécessitent généralement un Special Pass (pour courtes extensions) ou un Entry Permit (Travail/Résidence)." }
          ]
        }
      ]
    },
    {
      region: "Afrique Australe",
      intro: "La région de la SADC se caractérise par un calcul « jours par an » pour les visiteurs. Contrairement à d'autres régions où une sortie et réentrée (« border run ») réinitialise le compteur de 90 jours, les pays de la SADC comme l'Afrique du Sud et le Botswana appliquent souvent une limite annuelle agrégée pour empêcher la résidence de fait.",
      countries: [
        {
          name: "Angola", threshold: "90 Jours (Agrégé)", tableNotes: "30 jours par visite, max 90 jours/an.",
          instrument: "Loi N° 13/19 (2019).",
          details: [
            { label: "Analyse", text: "Les visas touristiques sont valides pour 120 jours, permettant des entrées multiples pour un séjour de jusqu'à 30 jours par visite. Crucialement, le séjour total ne peut excéder 90 jours par an." },
            { label: "Obligation", text: "Les permis de résidence sont requis pour l'établissement au-delà de cette limite agrégée." }
          ]
        },
        {
          name: "Botswana", threshold: "90 Jours (Agrégé)", tableNotes: "Limite stricte de 90 jours par année civile.",
          instrument: "Immigration Act 2011.",
          details: [
            { label: "Analyse", text: "« Un non-citoyen [...] ne restera pas au Botswana pour plus de 90 jours au total dans une année quelconque »." },
            { label: "Limite Stricte", text: "Rester au-delà de 90 jours dans une année civile est strictement interdit sans un permis de résidence ou une dérogation spéciale." }
          ]
        },
        {
          name: "Eswatini", threshold: "60 Jours", tableNotes: "30 jours + 30 extension. Permis résidence après 60 jours.",
          instrument: "Immigration Act 1982.",
          details: [
            { label: "Analyse", text: "L'entrée sans visa (ou visa à l'arrivée) est typiquement pour 30 jours. Elle peut être étendue pour 30 autres jours." },
            { label: "Obligation", text: "« Si vous voulez rester plus de 60 jours, vous devez demander un permis de résidence temporaire ». C'est plus serré que la norme de 90 jours." }
          ]
        },
        {
          name: "Lesotho", threshold: "44-90 Jours", tableNotes: "Permis de résidence requis après 90 jours.",
          instrument: "Aliens Control Act 1966.",
          details: [
            { label: "Analyse", text: "« Les visiteurs avec un visa à entrer unique [...] peuvent rester pour une période maximale de 44 jours ». Des permis temporaires peuvent être émis jusqu'à 90 jours." },
            { label: "Obligation", text: "Les séjours au-delà de la limite du permis temporaire (90 jours) exigent un permis de résidence." }
          ]
        },
        {
          name: "Malawi", threshold: "90 Jours", tableNotes: "Permis Résidence Temporaire requis après 90 jours.",
          instrument: "Immigration Act (Cap 15:03).",
          details: [
            { label: "Analyse", text: "Le permis visiteur est valide pour 30 jours, extensible pour 60 jours (Total 90)." },
            { label: "Obligation", text: "« Délivré à un visiteur [...] qui a résidé au Malawi pour le maximum de 90 jours [...] Un Permis de Résidence Temporaire » est alors requis." }
          ]
        },
        {
          name: "Mozambique", threshold: "90 Jours", tableNotes: "Nouvelle loi permet 90 jours. Résidence (DIRE) pour plus long.",
          instrument: "Loi N° 23/2022 (Nouvelle Loi Immigration).",
          details: [
            { label: "Analyse", text: "« Les citoyens étrangers avec un visa touristique peuvent maintenant rester dans le pays pour une période de 90 jours, continus ou interrompus durant 12 mois »." },
            { label: "Obligation", text: "« Le Permis de Résidence Temporaire du Mozambique est requis pour les nationaux étrangers qui ont l'intention de rester [...] pour plus de trois mois »." }
          ]
        },
        {
          name: "Namibie", threshold: "90 Jours (Agrégé)", tableNotes: "Limite stricte de 90 jours par année civile.",
          instrument: "Immigration Control Act 7 of 1993.",
          details: [
            { label: "Analyse", text: "« Le maximum de quatre-vingt-dix (90) jours par an pour visite peut être pris en une fois ou en partie »." },
            { label: "Limite Stricte", text: "Similaire au Botswana, la limite annuelle de 90 jours est strictement appliquée pour empêcher le tourisme perpétuel." }
          ]
        },
        {
          name: "Afrique du Sud", threshold: "90 Jours (+90 ext)", tableNotes: "Max 180 jours. Visa Résidence requis pour > 3 mois.",
          instrument: "Immigration Act 13 of 2002.",
          details: [
            { label: "Analyse", text: "Le visa visiteur est valide pour 90 jours. Il peut être étendu une fois pour 90 autres jours (Total 180)." },
            { label: "Obligation", text: "Pour des séjours excédant 3 mois (qui ne sont pas de simples extensions touristiques) ou 3 ans (visa visiteur long séjour), un Visa de Résidence Temporaire (TRV) est requis." }
          ]
        },
        {
          name: "Zambie", threshold: "90 Jours", tableNotes: "Visiting Permit pour > 90 jours.",
          instrument: "Immigration and Deportation Act 2010.",
          details: [
            { label: "Analyse", text: "« Tous les visiteurs ordinaires et touristes ont droit à une visite gratuite de quatre-vingt-dix (90) jours dans toute période de douze (12) mois ». Les visiteurs d'affaires sont limités à 30 jours." },
            { label: "Obligation", text: "Pour rester plus longtemps, il faut demander un « Visiting Permit » (valide 3 mois, jusqu'à 9 mois total) ou un Permis de Résidence." }
          ]
        },
        {
          name: "Zimbabwe", threshold: "90 Jours", tableNotes: "Max 90 jours touriste. Permis requis ensuite.",
          instrument: "Immigration Act (Chapitre 4:02).",
          details: [
            { label: "Analyse", text: "« Vous pouvez demander 2 extensions consécutives (pour un total de 90 jours) »." },
            { label: "Obligation", text: "Les séjours au-delà de 90 jours exigent un permis (Étudiant, Emploi, ou Résidence)." }
          ]
        }
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <PageHeader 
        badge={text.headers.governance.badge}
        title={text.headers.governance.title}
        highlight={text.headers.governance.highlight}
        desc={text.headers.governance.desc}
      />
      
      <section className="bg-slate-50 rounded-xl p-6 md:p-8 shadow-sm">
        
        {/* NOUVEAU MENU EN 3 COLONNES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Bloc 1 : Global */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
              <Globe className="w-3.5 h-3.5 mr-1.5" /> 1. Cadres Mondiaux
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setActiveSdgzTab('sdgs')} className={`w-full text-left py-2 px-3 rounded-md font-bold text-xs transition-all ${activeSdgzTab === 'sdgs' ? 'bg-blue-900 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>ODD / SDGs (Agenda 2030)</button>
              <button onClick={() => setActiveSdgzTab('gcm')} className={`w-full text-left py-2 px-3 rounded-md font-bold text-xs transition-all ${activeSdgzTab === 'gcm' ? 'bg-blue-900 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Pacte GCM (Migrations)</button>
              <button onClick={() => setActiveSdgzTab('gcr')} className={`w-full text-left py-2 px-3 rounded-md font-bold text-xs transition-all ${activeSdgzTab === 'gcr' ? 'bg-blue-900 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Pacte GCR (Réfugiés)</button>
            </div>
          </div>

          {/* Bloc 2 : Africain */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
              <MapIcon className="w-3.5 h-3.5 mr-1.5" /> 2. Cadres Africains
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setActiveSdgzTab('au')} className={`w-full text-left py-2 px-3 rounded-md font-bold text-xs transition-all ${activeSdgzTab === 'au' ? 'bg-emerald-800 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>Union Africaine (Traités & Agences)</button>
              <button onClick={() => setActiveSdgzTab('recs')} className={`w-full text-left py-2 px-3 rounded-md font-bold text-xs transition-all ${activeSdgzTab === 'recs' ? 'bg-emerald-800 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>CER (Régions & Processus)</button>
            </div>
          </div>

          {/* Bloc 3 : États Juridiques (54 pays) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
              <Scale className="w-3.5 h-3.5 mr-1.5" /> 3. États Juridiques
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => setActiveSdgzTab('matrix')} className={`w-full text-left py-2 px-3 rounded-md font-bold text-xs transition-all flex justify-between items-center ${activeSdgzTab === 'matrix' ? 'bg-slate-900 text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                <span>Entrées & Séjours (54 pays)</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================== */}
        {/* Rendu des Onglets Globaux (ODD, GCM, GCR) */}
        {/* ============================================================== */}
        {activeSdgzTab === 'sdgs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed">{text.sdg_section.sdg_desc}</p>
              <a href="https://www.un.org/sustainabledevelopment/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {text.sdg_section.sdg_points.map((pt, idx) => (
                <div key={idx} className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Cible ONU</span>
                  <h4 className="font-serif font-bold text-slate-900 text-base mb-2">{pt.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{pt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSdgzTab === 'gcm' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed">{text.sdg_section.gcm_desc}</p>
              <a href="https://www.iom.int/global-compact-migration" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {text.sdg_section.gcm_objectives_list.map((obj, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border border-slate-100 px-1.5 py-0.5 rounded-sm inline-block mb-1.5">{obj.num}</span>
                  <h4 className="font-serif font-bold text-slate-900 text-sm mb-1.5">{obj.title}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{obj.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSdgzTab === 'gcr' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed">{text.sdg_section.gcr_desc}</p>
              <a href="https://globalcompactrefugees.org/about-digital-platform/global-compact-refugees" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                <span>{text.sdg_section.link_text}</span><ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {text.sdg_section.gcr_objectifs.map((obj, idx) => (
                <div key={idx} className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="font-serif font-bold text-slate-900 text-base mb-2">{obj.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{obj.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* Rendu des Onglets Africains (UA, CER) */}
        {/* ============================================================== */}
        {activeSdgzTab === 'au' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-emerald-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-10 pointer-events-none">
                <Landmark className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                  {lang === 'fr' ? 'Architecture Continentale Endogène' : 'Endogenous Continental Architecture'}
                </span>
                <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 leading-tight">
                  {lang === 'fr' ? "L'Union Africaine et le Régime Panafricain des Mobilités" : "The African Union and the Pan-African Mobility Regime"}
                </h3>
                <p className="text-emerald-100 text-sm md:text-base leading-relaxed max-w-4xl">
                  {lang === 'fr' 
                    ? "La gouvernance des mobilités en Afrique ne se réduit pas aux pactes mondiaux. Elle s'enracine dans une architecture institutionnelle propre, structurée par l'Union Africaine (UA). Cette architecture illustre la tension du « normer sans ancrer » : une densification normative exceptionnelle (traités, positions communes, agences) qui se heurte souvent aux capacités et aux réticences des États dans l'« entre-deux national ». Le régime continental repose sur la construction d'une souveraineté épistémique (produire ses propres données et diagnostics) et sur un maillage de textes et de bureaucraties interconnectés."
                    : "African mobility governance is not reduced to global compacts. It is rooted in its own institutional architecture, structured by the African Union (AU). This architecture illustrates the tension of 'norming without anchoring': exceptional normative densification that often clashes with State capacities and reluctance in the 'national in-between'. The continental regime relies on building epistemic sovereignty and a network of interconnected texts and bureaucracies."}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Textes Fondateurs */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <FileText className="w-5 h-5 mr-2 text-emerald-700" />
                  {lang === 'fr' ? "Textes Fondateurs & Cadres Politiques" : "Foundational Texts & Policy Frameworks"}
                </h4>
                <div className="space-y-4">
                  {auFrameworks.map((fw, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest inline-block mb-2">
                          {fw.tag[lang]}
                        </span>
                        <h5 className="font-bold text-slate-900 text-lg mb-2 leading-tight">{fw.title[lang]}</h5>
                        <p className="text-xs text-slate-600 leading-relaxed">{fw.desc[lang]}</p>
                      </div>
                      <div className="md:w-2/3 bg-white p-5 rounded-lg border border-slate-200 flex flex-col justify-center relative shadow-sm">
                        <Quote className="absolute top-4 left-4 w-6 h-6 text-slate-100" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-6">{fw.article.ref}</span>
                        <p className="text-sm font-serif italic text-slate-800 leading-relaxed ml-6 relative z-10">
                          {lang === 'fr' ? fw.article.textFr : fw.article.textEn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agences et Infrastructures */}
              <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="flex items-center text-lg font-serif font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">
                  <Database className="w-5 h-5 mr-2 text-indigo-700" />
                  {lang === 'fr' ? "Agences Spécialisées & Souveraineté Épistémique" : "Specialized Agencies & Epistemic Sovereignty"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 shadow-sm flex flex-col h-full">
                    <h5 className="font-bold text-indigo-900 text-sm mb-1">OAM / AMO</h5>
                    <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-3 block">Rabat, Maroc (2020)</span>
                    <p className="text-xs text-slate-700 leading-relaxed flex-grow">
                      {lang === 'fr' ? "Observatoire Africain des Migrations. Bras technique centralisant la donnée pour déconstruire les récits exogènes (Evidence-based policy)." : "African Migration Observatory. Technical arm centralizing data to deconstruct exogenous narratives."}
                    </p>
                  </div>
                  <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 shadow-sm flex flex-col h-full">
                    <h5 className="font-bold text-indigo-900 text-sm mb-1">ACSRM / CERSM</h5>
                    <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-3 block">Bamako, Mali</span>
                    <p className="text-xs text-slate-700 leading-relaxed flex-grow">
                      {lang === 'fr' ? "Centre d’études et recherches sur la migration. Think tank continental orientant la recherche académique." : "Centre for the Study and Research on Migration. Continental think tank guiding academic research."}
                    </p>
                  </div>
                  <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 shadow-sm flex flex-col h-full">
                    <h5 className="font-bold text-indigo-900 text-sm mb-1">COC</h5>
                    <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-3 block">Khartoum, Soudan</span>
                    <p className="text-xs text-slate-700 leading-relaxed flex-grow">
                      {lang === 'fr' ? "Centre opérationnel pour la lutte contre la migration irrégulière et la traite (actuellement paralysé par le conflit au Soudan)." : "Operational Centre fighting irregular migration and trafficking (currently paralyzed by the Sudan conflict)."}
                    </p>
                  </div>
                  <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 shadow-sm flex flex-col h-full">
                    <h5 className="font-bold text-indigo-900 text-sm mb-1">AIR & STATAFRIC</h5>
                    <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-bold mb-3 block">Kenya / Tunisie</span>
                    <p className="text-xs text-slate-700 leading-relaxed flex-grow">
                      {lang === 'fr' ? "Institut africain pour les transferts de fonds (AIR) capte l'économie de la diaspora. STATAFRIC coordonne l'architecture statistique." : "African Institute for Remittances (AIR) leverages diaspora economy. STATAFRIC coordinates statistics."}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* JLMP & Coordination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="flex items-center text-sm font-bold text-slate-800 mb-3"><ShieldAlert className="w-4 h-4 mr-2 text-rose-700" /> Conventions de protection</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">Pionnière, la Convention OUA de 1969 a élargi la définition du réfugié aux victimes de violences généralisées. La Convention de Kampala (2009) est le premier instrument juridique contraignant au monde protégeant spécifiquement les personnes déplacées internes (IDPs).</p>
                </div>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm flex items-start gap-4">
                  <Activity className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-2">Le programme JLMP (OIT, OIM, UA)</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">Là où le droit pur bloque (Kigali), la gouvernance avance par la technique. Le JLMP est l'initiative la plus concrète d'harmonisation de la migration de travail, palliant le manque de capacités administratives des États membres.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {activeSdgzTab === 'recs' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-emerald-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                {lang === 'fr' ? 'Les Blocs Régionalisés du Régime Continental' : 'Regionalized Blocs of the Continental Regime'}
              </span>
              <h3 className="font-serif font-bold text-2xl mb-3">
                {lang === 'fr' ? "Les Communautés Économiques Régionales (CER)" : "Regional Economic Communities (RECs)"}
              </h3>
              <p className="text-emerald-100 text-sm leading-relaxed">
                {lang === 'fr' 
                  ? "L'architecture continentale repose sur 8 CER reconnues. L'analyse démontre que l'intégration humaine y est à « géométrie variable » : chaque sous-région développe une trajectoire d'ouverture conditionnée par son histoire, son économie et ses défis sécuritaires."
                  : "The continental architecture relies on 8 recognized RECs. Analysis shows human integration is of 'variable geometry': each sub-region develops an openness trajectory conditioned by its history, economy, and security challenges."}
              </p>
            </div>

            <div className="space-y-4">
              {recsList.map((rec) => {
                const isOpen = expandedRec === rec.id;
                return (
                  <div key={rec.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
                    <button onClick={() => setExpandedRec(isOpen ? null : rec.id)} className="w-full p-5 text-left flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <h4 className="font-serif font-bold text-slate-900 text-base md:text-lg">{rec.name}</h4>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 mt-1.5 inline-block">
                          {rec.tag}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-emerald-700' : ''}`} />
                    </button>

                    {isOpen && (
                      <div className="p-6 bg-slate-50 border-t border-slate-200 animate-in fade-in duration-300 space-y-5">
                        <p className="text-sm text-slate-800 leading-relaxed font-medium">{lang === 'fr' ? rec.desc.fr : rec.desc.en}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-2"><FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Instruments Clés</h5>
                            <p className="text-xs text-slate-700 leading-relaxed">{lang === 'fr' ? rec.instruments.fr : rec.instruments.en}</p>
                          </div>
                          <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm">
                            <h5 className="flex items-center font-bold text-[11px] uppercase tracking-widest text-slate-500 mb-2"><Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Dynamique & Défis</h5>
                            <p className="text-xs text-slate-700 leading-relaxed">{lang === 'fr' ? rec.dynamics.fr : rec.dynamics.en}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* NOUVEAU TAB 3 : ÉTATS JURIDIQUES ET MATRICE DES 54 PAYS */}
        {/* ============================================================== */}
        {activeSdgzTab === 'matrix' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-xl shadow-md border border-slate-800">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-2">
                Cartographie Réglementaire Continentale
              </span>
              <h3 className="font-serif font-bold text-2xl md:text-3xl mb-4 leading-tight">
                Matrices de réciprocité des visas et profils d’entrée et de séjour (54 pays)
              </h3>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl">
                L'analyse des seuils d'entrée et de l'obligation de résidence démontre la persistance d'une frontière juridique stricte entre le statut de « visiteur » (toléré pour le commerce ou le tourisme de courte durée) et celui d'« immigrant » (soumis au pouvoir discrétionnaire de l'État pour l'établissement). Le seuil standard en Afrique est de 90 jours.
              </p>
            </div>

            {/* Disclaimer Methodologique */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 mb-1">À propos de ces données</h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Ce tableau de synthèse et les fiches détaillées par pays résultent d'une <strong>analyse comparative personnelle des instruments juridiques nationaux</strong> (Lois sur l'immigration et codes des étrangers) en vigueur sur le continent en 2025. Ces données contextualisent les indicateurs de l'Africa Visa Openness Index (BAD).
                  </p>
                </div>
              </div>
            </div>

            {/* Toggle Vue Tableau / Vue Fiches */}
            <div className="flex bg-slate-200 p-1.5 rounded-lg w-fit mx-auto md:mx-0">
              <button 
                onClick={() => setMatrixView('table')} 
                className={`py-2 px-6 rounded-md text-xs font-bold transition-all flex items-center ${matrixView === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <TableProperties className="w-3.5 h-3.5 mr-2" /> Vue Tableau (Synthèse)
              </button>
              <button 
                onClick={() => setMatrixView('details')} 
                className={`py-2 px-6 rounded-md text-xs font-bold transition-all flex items-center ${matrixView === 'details' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <FileText className="w-3.5 h-3.5 mr-2" /> Fiches Détaillées
              </button>
            </div>

            {/* VUE : TABLEAU */}
            {matrixView === 'table' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600">
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">Région</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">Pays</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">Seuil Légal Visiteur</th>
                        <th className="py-4 px-4 font-bold text-[10px] uppercase tracking-widest">Notes sur l'Obligation de Résidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {legalMatrixData.map((regionObj, rIdx) => (
                        <React.Fragment key={rIdx}>
                          {regionObj.countries.map((country, cIdx) => (
                            <tr key={cIdx} className="hover:bg-slate-50 transition-colors">
                              {cIdx === 0 && (
                                <td rowSpan={regionObj.countries.length} className="py-3 px-4 font-bold text-slate-900 bg-slate-50/50 align-top border-r border-slate-100">
                                  {regionObj.region}
                                </td>
                              )}
                              <td className="py-3 px-4 font-bold text-slate-800">{country.name}</td>
                              <td className="py-3 px-4">
                                <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                                  {country.threshold}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-600 leading-relaxed">{country.tableNotes}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VUE : FICHES DÉTAILLÉES */}
            {matrixView === 'details' && (
              <div className="space-y-8 animate-in fade-in">
                {legalMatrixData.map((regionObj, rIdx) => (
                  <div key={rIdx} className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xl font-serif font-bold text-slate-900 mb-3 border-b border-slate-100 pb-3">{regionObj.region}</h4>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium italic">{regionObj.intro}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {regionObj.countries.map((country, cIdx) => (
                        <div key={cIdx} className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-bold text-slate-900 text-lg">{country.name}</h5>
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{country.threshold}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mb-4 pb-3 border-b border-slate-200">
                            <strong className="text-slate-700 uppercase tracking-widest">Instrument : </strong>
                            <span className="italic">{country.instrument}</span>
                          </div>
                          <div className="space-y-3 flex-grow">
                            {country.details.map((detail, dIdx) => (
                              <div key={dIdx}>
                                <h6 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{detail.label}</h6>
                                <p className="text-xs text-slate-800 leading-relaxed">{detail.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sources Légales */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <BookOpen className="w-4 h-4 mr-2 text-slate-400" />
                Liste des Instruments Juridiques Analysés (Sources)
              </h4>
              <div className="h-48 overflow-y-auto pr-4 custom-scrollbar text-xs text-slate-600 leading-relaxed space-y-3">
                <p><strong>Afrique méditerranéenne :</strong><br/>
                Algérie : Loi n° 08-11 (2008). Égypte : Loi n° 89 (1960, am. 2018). Libye : Loi n° 6 (1987). Maroc : Loi n° 02-03 (2003). Mauritanie : Loi n° 1965-046. Soudan : Passports and Immigration Act (1994). Tunisie : Loi n° 68-7 (1968).</p>
                <p><strong>Afrique de l'Ouest :</strong><br/>
                Bénin : Loi n° 2025-15. Burkina Faso : Loi de 2024. Cap-Vert : Loi n° 66/VIII/2014. Côte d'Ivoire : Loi n° 2004-303. Gambie : Immigration Act (Cap. 16:02). Ghana : Immigration Act (2000). Guinée : Loi L/94/019. Guinée-Bissau : Loi n° 2/92. Liberia : Aliens and Nationality Law. Mali : Loi n° 04-058. Niger : Ordonnance n° 81-40. Nigeria : Immigration Act 2015. Sénégal : Loi n° 71-10. Sierra Leone : Non-Citizens Act (1965). Togo : Loi sur la police des étrangers (2022).</p>
                <p><strong>Afrique Centrale :</strong><br/>
                Cameroun : Loi n° 97/012. Gabon : Loi n° 5/86. Guinée équat. : Loi org. n° 3/2010. RCA : Code de l'immigration. RDC : Ordonnance n° 83-033. Congo : Loi n° 23-96. Sao Tomé : Loi n° 5/2008. Tchad : Ordonnance n° 27-62.</p>
                <p><strong>Afrique de l'Est :</strong><br/>
                Burundi : Loi n° 1/13. Comores : Loi n° 88-025. Djibouti : Loi n° 201/AN/07. Érythrée : Proclamation n° 24/1992. Éthiopie : Proclamation n° 354/2003. Kenya : Citizenship and Immigration Act (2011). Madagascar : Loi n° 62-006. Maurice : Immigration Act 2022. Ouganda : Act (Cap. 66). Rwanda : Loi n° 57/2018. Seychelles : Decree 1979. Somalie : Law 1966. Soudan du Sud : Act 2011. Tanzanie : Act 1995.</p>
                <p><strong>Afrique Australe :</strong><br/>
                Afrique du Sud : Act 13 (2002). Angola : Loi n° 13/19. Botswana : Act 2011. Eswatini : Act 1982. Lesotho : Act 1966. Malawi : Act (Cap. 15:03). Mozambique : Loi n° 23/2022. Namibie : Act 7 (1993). Zambie : Act 2010. Zimbabwe : Act (Chapter 4:02).</p>
              </div>
            </div>

          </div>
        )}

      </section>
    </div>
  );
};

const TabExplorer = ({ text, lang, activeSubRegion, setActiveSubRegion, activeSubTab, setActiveSubTab, searchTerm, setSearchTerm, filteredCountries, display, setShowModal }) => (
  <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
    <PageHeader 
      badge={text.headers.explorer.badge}
      title={text.headers.explorer.title}
      highlight={text.headers.explorer.highlight}
      desc={text.headers.explorer.desc}
    />

    <div className="flex flex-col lg:flex-row gap-8 items-start">
      
      {/* SIDEBAR GAUCHE : NAVIGATION */}
      <div className="w-full lg:w-1/4 space-y-6 lg:sticky lg:top-24">
        
        {/* RECHERCHE */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
          <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder={text.sidebar.search}
            className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* FILTRES DE RÉGION */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center">
            <MapIcon className="w-3.5 h-3.5 mr-1.5" />
            {text.sidebar.title}
          </h3>
          <div className="space-y-1.5">
            <button
              onClick={() => { setActiveSubRegion('all'); setActiveSubTab('perspective'); setSearchTerm(''); }}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center ${activeSubRegion === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Globe className={`w-4 h-4 mr-2.5 ${activeSubRegion === 'all' ? 'text-blue-400' : 'text-slate-400'}`} />
              {text.all_regions}
            </button>
            
            <div className="pt-3 pb-2">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-4">{text.sidebar.subregion}</span>
            </div>
            
            {Object.keys(text.regions).map(regionKey => (
              <button
                key={regionKey}
                onClick={() => { setActiveSubRegion(regionKey); setActiveSubTab('perspective'); setSearchTerm(''); }}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors flex justify-between items-center group ${activeSubRegion === regionKey ? 'bg-blue-50 text-blue-800 border border-blue-100 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}
              >
                <span>{text.regions[regionKey]}</span>
                <ChevronRight className={`w-4 h-4 transition-transform ${activeSubRegion === regionKey ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-400'}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ZONE PRINCIPALE : RÉSULTATS */}
      <div className="w-full lg:w-3/4 space-y-6">
        
        {/* TABS (Perspective globale vs Liste de pays) */}
        <div className="flex bg-slate-200 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveSubTab('perspective')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'perspective' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {activeSubRegion === 'all' ? text.perspectives.continent : text.perspectives.subregion}
          </button>
          <button
            onClick={() => {
              if (filteredCountries.length > 0) {
                setActiveSubTab(filteredCountries[0].id);
              }
            }}
            className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-bold transition-all ${activeSubTab !== 'perspective' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {lang === 'fr' ? 'Profils Nationaux' : 'National Profiles'} ({filteredCountries.length})
          </button>
        </div>

        {/* CONTENU (Vue Perspective) */}
        {activeSubTab === 'perspective' && (
          <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm animate-in fade-in">
            <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
              <div>
                <span className="inline-block px-2.5 py-1 rounded bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                  {text.badge.regional}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 flex items-center">
                  <span className="mr-3 text-3xl">{display.flag}</span>
                  {display.name}
                </h2>
              </div>
              <button onClick={() => setShowModal(true)} className="hidden md:flex items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-md font-bold text-xs transition shadow-sm">
                <BarChart3 className="w-4 h-4" />
                <span>{text.analysis_btn}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><Users className="w-3 h-3 mr-1.5" /> {text.metrics.stock}</span>
                <div className="text-3xl font-serif font-bold text-slate-900">{display.stock}</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><PieChart className="w-3 h-3 mr-1.5" /> {text.metrics.evolution}</span>
                <div className="text-3xl font-serif font-bold text-blue-700">{display.evolution}%</div>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block flex items-center"><HeartPulse className="w-3 h-3 mr-1.5" /> {text.metrics.female}</span>
                <div className="text-3xl font-serif font-bold text-rose-700">{display.female}%</div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-lg border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3 text-sm uppercase tracking-widest flex items-center">
                <TableProperties className="w-4 h-4 mr-2" />
                {text.comparative_view_title}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                {text.comparative_view_desc}
              </p>
              
              {/* Distribution Bar if available (for 'all' regions view) */}
              {display.distribution && (
                <div className="mt-6 pt-5 border-t border-blue-200/50">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-800">{display.distribution[0].label[lang]} ({display.distribution[0].value}%)</span>
                    <span className="text-slate-600">{display.distribution[1].label[lang]} ({display.distribution[1].value}%)</span>
                  </div>
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{width: `${display.distribution[0].value}%`}}></div>
                    <div className="h-full bg-slate-500 transition-all duration-1000" style={{width: `${display.distribution[1].value}%`}}></div>
                  </div>
                </div>
              )}
            </div>
            
            <button onClick={() => setShowModal(true)} className="w-full mt-6 md:hidden flex justify-center items-center space-x-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-3 rounded-md font-bold text-sm transition shadow-sm">
              <BarChart3 className="w-4 h-4" />
              <span>{text.analysis_btn}</span>
            </button>
          </div>
        )}

        {/* CONTENU (Liste des Pays) */}
        {activeSubTab !== 'perspective' && (
          <div className="space-y-4">
            
            {/* Grille des drapeaux pour navigation rapide */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
              {filteredCountries.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveSubTab(c.id)}
                  className={`px-3 py-1.5 rounded border transition-all text-xs font-bold flex items-center space-x-2 ${
                    activeSubTab === c.id 
                      ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-md' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base flag-emoji">{c.flag}</span>
                  <span className="hidden sm:inline">{c.name[lang] || c.name.fr}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="w-full p-4 text-center text-slate-400 text-sm">
                  {lang === 'fr' ? 'Aucun pays trouvé.' : 'No country found.'}
                </div>
              )}
            </div>

            {/* Profil du pays sélectionné */}
            {filteredCountries.find(c => c.id === activeSubTab) && (
              <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm animate-in fade-in">
                <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                      {text.badge.country}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 flex items-center">
                      <span className="mr-3 text-3xl flag-emoji">{display.flag}</span>
                      {display.name}
                    </h2>
                  </div>
                  <button onClick={() => setShowModal(true)} className="hidden md:flex items-center space-x-2 bg-blue-700 text-white hover:bg-blue-800 px-5 py-2.5 rounded-md font-bold text-xs transition shadow-sm">
                    <Target className="w-4 h-4" />
                    <span>{text.analysis_btn}</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Total (2024)</span>
                    <div className="text-xl font-serif font-bold text-slate-900">{formatNumber(display.stock)}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 block">% Pop. Nat.</span>
                    <div className="text-xl font-serif font-bold text-blue-800">{display.evolution}%</div>
                  </div>
                  <div className="bg-rose-50 p-4 rounded-lg border border-rose-100">
                    <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest mb-1.5 block">% Femmes</span>
                    <div className="text-xl font-serif font-bold text-rose-800">{display.female}%</div>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1.5 block">Rétention (Sud)</span>
                    <div className="text-xl font-serif font-bold text-emerald-800">{display.retention}%</div>
                  </div>
                </div>

                {display.impact && (
                   <div className="bg-amber-50 p-5 rounded-lg border border-amber-100 flex items-start mb-6">
                     <Info className="w-5 h-5 text-amber-600 mr-3 shrink-0 mt-0.5" />
                     <p className="text-sm text-amber-900 font-medium leading-relaxed">{display.impact}</p>
                   </div>
                )}
                
                <button onClick={() => setShowModal(true)} className="w-full mt-4 md:hidden flex justify-center items-center space-x-2 bg-blue-700 text-white hover:bg-blue-800 px-5 py-3 rounded-md font-bold text-sm transition shadow-sm">
                  <Target className="w-4 h-4" />
                  <span>{text.analysis_btn}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
);

const TabLibrary = ({ text, lang }) => (
  <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
    <PageHeader 
      badge={text.headers.library.badge}
      title={text.headers.library.title}
      highlight={text.headers.library.highlight}
      desc={text.headers.library.desc}
    />
    <div className="p-16 text-center bg-white border-2 border-dashed border-slate-300 rounded-xl shadow-sm">
      <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h2 className="text-2xl font-serif font-bold text-slate-700 mb-2">
        {lang === 'fr' ? 'Bibliothèque Documentaire' : 'Migration Library'}
      </h2>
      <p className="text-slate-500 max-w-lg mx-auto">
        {lang === 'fr' 
          ? 'Cette section accueillera prochainement une base de données filtrable de rapports, thèses et policy briefs sur les mobilités.'
          : 'This section will soon host a filterable database of reports, theses, and policy briefs on mobility.'}
      </p>
      <div className="mt-6 inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-sm uppercase tracking-widest border border-blue-200">
        En construction
      </div>
    </div>
  </div>
);

const TabMethodology = ({ text, lang, expandedIndicator, setExpandedIndicator, exportIndicatorsCSV }) => (
  <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
    <PageHeader 
      badge={text.headers.methodology.badge}
      title={text.headers.methodology.title}
      highlight={text.headers.methodology.highlight}
      desc={text.headers.methodology.desc}
    />

    <section id="data">
      <div className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-5 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-slate-100 rounded-sm border border-slate-200"><BookOpen className="h-6 w-6 text-slate-700" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 tracking-tight">{text.sections.data}</h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed max-w-3xl">{text.indicator_desc}</p>
            </div>
          </div>
          <button onClick={exportIndicatorsCSV} className="flex items-center space-x-2 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 px-5 py-2.5 rounded-sm font-bold text-xs transition-all border border-slate-300 shadow-sm shrink-0">
            <Download className="w-4 h-4" /> <span>{text.download_indicators}</span>
          </button>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {indicatorThemes.map((theme, i) => (
            <div key={i}>
              <h3 className={`flex items-center text-base font-serif font-bold ${theme.color} mb-5`}>
                {React.cloneElement(theme.icon, { className: "w-5 h-5 mr-2" })} 
                {lang === 'fr' ? theme.theme_fr : theme.theme_en}
              </h3>
              <div className="space-y-3">
                {theme.items.map((ind, j) => (
                  <div 
                    key={j} 
                    onClick={() => setExpandedIndicator(expandedIndicator === ind.id ? null : ind.id)}
                    className={`p-4 border rounded-lg transition-all cursor-pointer group flex flex-col items-start relative overflow-hidden ${expandedIndicator === ind.id ? 'bg-slate-50 border-blue-300 shadow-md' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between w-full mb-2 relative z-10">
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-sm tracking-widest shrink-0 uppercase">
                        Ind. {ind.id}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expandedIndicator === ind.id ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'}`} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-slate-900 leading-snug relative z-10">
                      {lang === 'fr' ? ind.fr : ind.en}
                    </p>
                    {(lang === 'fr' ? ind.desc_fr : ind.desc_en) && (
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed relative z-10">
                        {lang === 'fr' ? ind.desc_fr : ind.desc_en}
                      </p>
                    )}
                      
                    <div className={`w-full overflow-hidden transition-all duration-500 relative z-10 ${expandedIndicator === ind.id ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-200' : 'max-h-0 opacity-0'}`}>
                      <div className="space-y-4">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{lang === 'fr' ? "🔍 Méthodologie & Collecte" : "🔍 Methodology & Data Collection"}</span>
                          <p className="text-xs text-slate-700 leading-relaxed">{lang === 'fr' ? ind.method_fr : ind.method_en}</p>
                        </div>
                        <div className="bg-white p-3 rounded-sm border border-slate-200">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "💡 Le Changement de Paradigme" : "💡 The Paradigm Shift"}</span>
                          <p className="text-xs text-slate-800 italic leading-relaxed">{lang === 'fr' ? ind.contrast_fr : ind.contrast_en}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-white rounded-xl p-8 md:p-10 border shadow-sm relative border-slate-200">
      <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-serif font-bold text-slate-900 flex items-center"><Database className="w-5 h-5 mr-2.5 text-blue-700" /> {text.sections.method_title}</h2></div>
      <p className="text-slate-700 text-sm leading-relaxed mb-2">{text.method.summary}</p>
      <div className="mt-6 pt-6 border-t border-slate-100">
        <ul className="space-y-5">
          <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '1. Sourcing : ' : '1. Sourcing: '}</strong>{text.method.m1}</p></li>
          <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '2. Analyse Proportionnelle : ' : '2. Proportional Analysis: '}</strong>{text.method.m2}</p></li>
          <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '3. Évaluation Juridique : ' : '3. Legal Assessment: '}</strong>{text.method.m3}</p></li>
          <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '4. Open Source & Intégrité : ' : '4. Open Source & Integrity: '}</strong>{text.method.m4}</p></li>
        </ul>
      </div>
        
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{text.method.sources_title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="https://www.un.org/development/desa/pd/data/international-migrant-stock" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Database className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s1}</span>
          </a>
          <a href="https://www.unhcr.org/refugee-statistics/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Users className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s2}</span>
          </a>
          <a href="https://www.internal-displacement.org/database/displacement-data/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s3}</span>
          </a>
          <a href="https://www.iom.int/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s4}</span>
          </a>
          <a href="https://normlex.ilo.org/" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Scale className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s5}</span>
          </a>
          <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="flex items-center p-3 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
            <Landmark className="w-4 h-4 text-slate-400 group-hover:text-blue-600 mr-3 shrink-0" />
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s6}</span>
          </a>
        </div>
      </div>
    </section>
  </div>
);

const TabAbout = ({ text, lang }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCitation = async () => {
    try {
      await navigator.clipboard.writeText(text.about.citation_text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Erreur lors de la copie de la citation : ", err);
    }
  };

  return (
    <section className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500 space-y-6">
      
      <div className="bg-[#0f172a] rounded-xl p-8 md:p-12 text-white shadow-lg relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5"><Info className="w-64 h-64" /></div>
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
            {text.about.intro_title}
          </h1>
          <p className="text-blue-300 font-bold text-sm md:text-base uppercase tracking-widest mb-8">
            {text.about.intro_subtitle}
          </p>
          <div className="space-y-4 text-slate-300 leading-relaxed max-w-3xl">
            <p>{text.about.intro_p1}</p>
            <p>{text.about.intro_p2}</p>
            <p>{text.about.intro_p3}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-blue-50 rounded-sm"><BookOpen className="w-5 h-5 text-blue-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.research_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>{text.about.research_p1}</p>
            <p>{text.about.research_p2}</p>
            <p>{text.about.research_p3}</p>
            <p className="font-medium text-slate-800">{text.about.research_p4}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-emerald-50 rounded-sm"><Database className="w-5 h-5 text-emerald-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.data_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>{text.about.data_p1}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
              {text.about.data_list.map((item, idx) => (
                item.url ? (
                  <a 
                    key={idx}
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-md bg-slate-50 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0 group-hover:text-emerald-700" />
                    <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-900">{item.name}</span>
                  </a>
                ) : (
                  <div key={idx} className="flex items-center p-3 rounded-md bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                  </div>
                )
              ))}
            </div>

            <p>{text.about.data_p2}</p>
            <p className="italic">{text.about.data_p3}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-amber-50 rounded-sm"><Globe className="w-5 h-5 text-amber-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.south_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>{text.about.south_p1}</p>
            <ul className="space-y-2 my-4 bg-slate-50 p-4 rounded-md border border-slate-100">
              {text.about.south_list.map((item, idx) => (
                <li key={idx} className="flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-3"></span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <p>{text.about.south_p2}</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-5">
            <div className="p-2 bg-purple-50 rounded-sm"><TrendingUp className="w-5 h-5 text-purple-700" /></div>
            <h2 className="text-xl font-serif font-bold text-slate-900">{text.about.evolution_title}</h2>
          </div>
          <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
            <p>{text.about.evolution_p1}</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-4">
              {text.about.evolution_list.map((item, idx) => (
                <li key={idx} className="flex items-start">
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0 mt-1" />
                  <span className="text-xs">{item}</span>
                </li>
              ))}
            </ul>
            <p className="font-bold text-slate-800">{text.about.evolution_p2}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 p-8 md:p-10 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-10">
        <div className="flex-1 space-y-4">
          <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">{text.about.founder_title}</h2>
          <div className="text-sm text-slate-600 leading-relaxed space-y-3">
            <p>{text.about.founder_p1}</p>
            <p>{text.about.founder_p2}</p>
            <p>{text.about.founder_p3}</p>
            <p className="text-xs italic text-slate-500 border-l-2 border-slate-300 pl-3 mt-4">{text.about.founder_p4}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900 mb-4">{text.about.collab_title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{text.about.collab_p1}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{text.about.contact_p}</p>
            
            <div className="flex flex-col gap-3">
              <a href="mailto:benmokhtary1@gmail.com?subject=South(s)%20Mobility%20DataHub%20-%20Contact" 
                 className="inline-flex items-center space-x-3 bg-white hover:bg-blue-50 border border-slate-200 text-slate-700 hover:text-blue-700 hover:border-blue-200 px-4 py-3 rounded-md transition-colors shadow-sm w-fit">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-bold">benmokhtary1@gmail.com</span>
              </a>
              <a href="https://www.linkedin.com/in/yassine-b-m" target="_blank" rel="noopener noreferrer" 
                 className="inline-flex items-center space-x-3 bg-[#0a66c2] hover:bg-[#084e96] text-white px-4 py-3 rounded-md transition-colors shadow-sm w-fit">
                <LinkedInIcon className="w-4 h-4" />
                <span className="text-sm font-bold">Yassine Ben Mokhtar</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-70 ml-1" />
              </a>
            </div>
          </div>

          <div className="bg-amber-50 text-amber-800 text-xs p-4 rounded-md border border-amber-200 leading-relaxed">
            {text.about.disclaimer}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm group hover:border-blue-300 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center space-x-2">
            <Quote className="w-5 h-5 text-blue-500" />
            <h4 className="text-sm font-bold uppercase tracking-widest text-slate-700">{text.about.citation_title}</h4>
          </div>
          
          <button 
            onClick={handleCopyCitation}
            className={`inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-sm text-xs font-bold transition-all border shadow-sm w-full sm:w-auto
            ${isCopied ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
          >
            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{isCopied ? (lang === 'fr' ? 'Copié !' : 'Copied!') : (lang === 'fr' ? 'Copier' : 'Copy')}</span>
          </button>
        </div>
        <p className="text-sm text-slate-600 font-serif italic border-l-2 border-blue-500 pl-4 leading-relaxed">
          {text.about.citation_text}
        </p>
      </div>
    </section>
  );
};

// ============================================================================
// 4. COMPOSANT PRINCIPAL (App)
// ============================================================================

export default function App() {
  const [lang, setLang] = useState('fr');
  const [activeTab, setActiveTab] = useState('evidence'); 
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [activeSubRegion, setActiveSubRegion] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('perspective');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState('demography'); 
  const [expandedIndicator, setExpandedIndicator] = useState(null);
  const [activeSdgzTab, setActiveSdgzTab] = useState('sdgs');

  useEffect(() => { setIsLoaded(true); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const text = t[lang];

  const currentCountries = useMemo(() => {
    if (activeSubRegion === 'all') return Object.values(countryData).flat();
    return countryData[activeSubRegion] || [];
  }, [activeSubRegion]);

  const filteredCountries = useMemo(() => {
    return currentCountries.filter(c => {
      const cName = c.name?.[lang] || c.name?.fr || 'Unknown';
      return cName.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => (a.name[lang] || a.name.fr).localeCompare(b.name[lang] || b.name.fr));
  }, [currentCountries, searchTerm, lang]);

  const regionAggregate = useMemo(() => computeRegionAggregate(currentCountries), [currentCountries]);

  const display = useMemo(() => {
    const country = currentCountries.find(c => c.id === activeSubTab);
    
    if (country && activeSubTab !== 'perspective') {
      return {
        name: country.name?.[lang] || country.name?.fr || 'Unknown', flag: country.flag, stock: country.stock, female: country.female, evolution: country.evolution,
        retention: country.retention ?? 50,
        remittances: country.remittances ?? null, remittances_year: country.remittances_year ?? null,
        labour_participation: country.labour_participation ?? null, labour_participation_year: country.labour_participation_year ?? null,
        aid: country.aid ?? 0, history: country.history || [],
        evo_desc: country.evo_desc?.[lang] || country.evo_desc?.fr || "", origDest: country.origDest?.[lang] || country.origDest?.fr || "", trigger: country.trigger?.[lang] || country.trigger?.fr || "", response: country.response?.[lang] || country.response?.fr || "", impact: country.impact?.[lang] || country.impact?.fr || "",
        idp_conflict: country.idp_conflict || 0, idp_disaster: country.idp_disaster || 0, refugees_hosted: country.refugees_hosted || 0, avoi: country.avoi || null,
        normlex: country.normlex || null,
        au_treaties: country.au_treaties || null,
        isRegion: false
      };
    }

    const fallbackKey = activeSubRegion === 'all' ? 'africa_perspective' : `${activeSubRegion}_perspective`;
    const fallback = aggregates[fallbackKey] || aggregates['africa_perspective'];
    const agg = regionAggregate;

    return {
      name: typeof fallback.name === 'object' ? (fallback.name?.[lang] || fallback.name?.fr || 'Unknown') : String(fallback.name || 'Unknown'),
      flag: fallback.flag,
      stock: formatNumber(Math.round(agg.stock)),
      female: agg.female ?? fallback.female,
      evolution: fallback.evolution,
      retention: agg.retention ?? (fallback.retention || 50),
      remittances: agg.remittances,
      remittances_year: agg.remittancesYearLabel,
      labour_participation: agg.labourParticipation,
      labour_participation_year: null,
      aid: agg.aid ?? (fallback.aid || 0),
      history: fallback.history, distribution: fallback.distribution || null,
      evo_desc: typeof fallback.evo_desc === 'object' ? (fallback.evo_desc?.[lang] || fallback.evo_desc?.fr || "") : (fallback.evo_desc || ""),
      origDest: typeof fallback.origDest === 'object' ? (fallback.origDest?.[lang] || fallback.origDest?.fr || "") : (fallback.origDest || ""),
      trigger: typeof fallback.trigger === 'object' ? (fallback.trigger?.[lang] || fallback.trigger?.fr || "") : (fallback.trigger || ""),
      response: typeof fallback.response === 'object' ? (fallback.response?.[lang] || fallback.response?.fr || "") : (fallback.response || ""),
      impact: typeof fallback.impact === 'object' ? (fallback.impact?.[lang] || fallback.impact?.fr || "") : (fallback.impact || ""),
      idp_conflict: 0, idp_disaster: 0, refugees_hosted: 0, avoi: null, normlex: null, au_treaties: null,
      isRegion: true,
      countryCount: agg.countryCount
    };
  }, [activeSubTab, activeSubRegion, lang, currentCountries, regionAggregate]);

  useEffect(() => {
    document.title = `${display.name} | South(s) Mobility DataHub`;
    document.documentElement.lang = lang;
  }, [display, lang]);

  const exportIndicatorsCSV = () => {
    let csvContent = "ID,Theme(FR),Theme(EN),Indicator(FR),Indicator(EN),Description(FR),Description(EN)\n";
    indicatorThemes.forEach(thm => thm.items.forEach(i => {
      csvContent += `${i.id},"${thm.theme_fr}","${thm.theme_en}","${(i.fr||'').replace(/"/g, '""')}","${(i.en||'').replace(/"/g, '""')}","${(i.desc_fr||"").replace(/"/g, '""')}","${(i.desc_en||"").replace(/"/g, '""')}"\n`;
    }));
    downloadCSV("souths_indicators_registry.csv", csvContent);
  };

  const exportCountryProfileCSV = () => {
    const remitValue = display.remittances !== null && display.remittances !== undefined ? `${display.remittances} (${display.remittances_year || 's.d.'})` : 'N/A';
    const labourValue = display.labour_participation !== null && display.labour_participation !== undefined ? `${display.labour_participation} (${display.labour_participation_year || 's.d.'})` : 'N/A';
    const csvContent = `Metric,Value\nProfile,"${display.name}"\nStock,"${display.stock}"\nFemale Share %,"${display.female}"\nEvolution,"${display.evolution}"\nRemittances % GDP (year),"${remitValue}"\nMigrant Labour Participation % (year),"${labourValue}"\nOrig/Dest,"${display.origDest}"\nTrigger,"${display.trigger}"\nResponse,"${display.response}"\nImpact,"${display.impact}"\nIDP Conflict,"${display.idp_conflict}"\nIDP Disaster,"${display.idp_disaster}"\n`;
    downloadCSV(`Profile_${display.name}.csv`, csvContent);
  };

  const navigation = [
    { id: 'evidence', icon: Globe, label: { fr: 'Evidence Check', en: 'Evidence Check' } },
    { id: 'explorer', icon: MapPin, label: { fr: 'Explorateur', en: 'Data Explorer' } },
    { id: 'governance', icon: Landmark, label: { fr: 'Gouvernance', en: 'Governance' } },
    { id: 'library', icon: BookOpen, label: { fr: 'Bibliothèque', en: 'Library' } },
    { id: 'methodology', icon: Database, label: { fr: 'Méthodologie', en: 'Methodology' } },
    { id: 'about', icon: Info, label: { fr: 'À Propos', en: 'About' } },
  ];

  return (
    <div className={`min-h-screen bg-[#f8f9fa] font-sans text-slate-800 text-sm transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'} print:bg-white print:text-black`}>
      <style type="text/css">
        {`
          @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400&family=Source+Sans+3:wght@400;500;600;700&display=swap');
          body { font-family: 'Source Sans 3', sans-serif; }
          h1, h2, h3, h4, h5, h6, .font-serif { font-family: 'Merriweather', serif; }
        `}
      </style>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 12mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .print\\:hidden { display: none !important; }
        `}
      </style>
      <style>{`
        .flag-emoji {
          font-family: "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
          font-size: 1.2em;
          display: inline-block;
          vertical-align: middle;
        }
      `}</style>

      <nav className="bg-[#0f172a] text-white sticky top-0 z-50 shadow-md print:hidden">
        <div className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-14 items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-800 p-1.5 rounded-sm shadow-sm"><Globe className="h-4 w-4 text-blue-100" /></div>
              <span className="text-base font-serif font-bold tracking-tight uppercase">
                {text.title} <span className="text-blue-300 font-sans font-medium lowercase italic">{text.subtitle}</span>
              </span>
            </div>
            <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="flex items-center space-x-1 text-[10px] font-bold bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700 transition hover:bg-blue-900 hover:text-white hover:border-blue-700">
              <Languages className="h-3 w-3" /> <span>{lang.toUpperCase()}</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto custom-scrollbar">
          <div className="flex space-x-1 py-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center px-4 py-2.5 rounded-sm text-xs font-bold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-800 text-white shadow-inner border-t-2 border-t-blue-400' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-t-2 border-t-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${isActive ? 'text-blue-200' : 'text-slate-500'}`} />
                  {item.label[lang]}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 print:hidden">
        {activeTab === 'evidence' && (
          <TabEvidenceCheck text={text} lang={lang} />
        )}
        {activeTab === 'explorer' && (
          <TabExplorer 
            text={text} lang={lang} 
            activeSubRegion={activeSubRegion} setActiveSubRegion={setActiveSubRegion}
            activeSubTab={activeSubTab} setActiveSubTab={setActiveSubTab}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filteredCountries={filteredCountries} display={display} setShowModal={setShowModal}
          />
        )}
        {activeTab === 'governance' && (
          <TabGovernance text={text} lang={lang} activeSdgzTab={activeSdgzTab} setActiveSdgzTab={setActiveSdgzTab} />
        )}
        {activeTab === 'library' && (
          <TabLibrary text={text} lang={lang} />
        )}
        {activeTab === 'methodology' && (
          <TabMethodology 
            text={text} lang={lang} 
            expandedIndicator={expandedIndicator} setExpandedIndicator={setExpandedIndicator}
            exportIndicatorsCSV={exportIndicatorsCSV}
          />
        )}
        {activeTab === 'about' && (
          <TabAbout text={text} lang={lang} />
        )}
      </main>

      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-5 bg-[#0f172a]/90 backdrop-blur-sm animate-in fade-in duration-300 print:bg-white print:p-0 print:absolute print:inset-0 print:block"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-slate-50 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-700 print:shadow-none print:border-none print:max-h-none print:rounded-none"
          >
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-white print:border-b-2 print:border-slate-900 print:pb-4 gap-5 print:break-inside-avoid">
              <div className="flex items-center space-x-5">
                <span className="text-4xl md:text-5xl flag-emoji border border-slate-200 rounded-sm bg-slate-50 p-1 shadow-sm print:border-none">{display.flag}</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 uppercase tracking-tight">{display.name}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 border border-slate-200 inline-block px-2 py-0.5 rounded-sm">{display.isRegion ? (text.modal.south_view || "") : text.modal.raw_data_title}</p>
                </div>
              </div>
                
              <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 print:hidden">
                <button onClick={() => setModalView('demography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'demography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.demo}</button>
                <button onClick={() => setModalView('geography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'geography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.geo}</button>
                <button onClick={() => setModalView('economy')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'economy' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.econ}</button>
              </div>
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white hover:bg-slate-50 rounded-sm border border-slate-200 transition-colors print:hidden shadow-sm"><X className="w-4 h-4 text-slate-600" /></button>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto space-y-10 print:overflow-visible print:p-0 print:pt-6 bg-slate-50 print:bg-white h-full print:flex print:flex-col print:gap-6 print:space-y-0">
              <div className={`grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500 ${modalView === 'demography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:border print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Users className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Le Réel Poids Démographique" : "The Real Demographic Weight"}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "La population migrante comparée à la population totale." : "Migrant population compared to total population."}</p>
                  <div className="relative pt-6 pb-3 print:pt-4">
                    <div className="h-10 w-full bg-slate-100 rounded-sm relative overflow-hidden flex items-center border border-slate-200 print:h-8 print:!bg-slate-100">
                      <span className="absolute right-3 text-[10px] font-bold text-slate-400">POPULATION TOTALE</span>
                      <div className="h-full bg-blue-700 flex items-center px-3 transition-all duration-1000 print:!bg-blue-700" style={{width: `${Math.max(5, parseFloat(display.evolution))}%`}}>
                        <span className="text-white font-bold text-base print:text-xs">{display.evolution}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-5 border-t border-slate-100 print:mt-3 print:pt-3">
                    <h4 className="font-bold text-slate-800 text-[10px] mb-2 uppercase tracking-widest print:text-[9px]">{text.modal.evo_title}</h4>
                    <HistoricalChart data={display.history} colorClass="bg-blue-700" />
                  </div>
                </div>
                  
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center items-center print:border print:p-4">
                   <h3 className="font-serif font-bold text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><HeartPulse className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.parity}</h3>
                   <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-sm border border-slate-100 print:w-24 print:h-24" style={{ background: `conic-gradient(#1d4ed8 ${display.female}%, #f1f5f9 0)` }}>
                     <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center border border-slate-50">
                       <span className="text-3xl font-serif font-bold text-slate-900 print:text-xl">{display.female}%</span>
                       <span className="text-[9px] font-bold text-blue-700 uppercase mt-0.5 tracking-widest">{lang === 'fr' ? "Femmes" : "Women"}</span>
                     </div>
                   </div>
                   <p className="text-center text-sm text-slate-600 mt-6 max-w-xs leading-relaxed print:mt-3 print:text-[10px]">{lang === 'fr' ? "La migration n'est pas qu'une affaire d'hommes fuyant la misère. Elle est structurellement féminisée." : "Migration is not just men fleeing poverty. It is structurally feminized."}</p>
                </div>
              </div>

              <div className={`grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500 ${modalView === 'geography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                <div className="lg:col-span-2 bg-[#0f172a] rounded-lg p-7 text-white shadow-md flex flex-col justify-center items-center print:bg-white print:text-slate-900 print:border print:border-slate-200 print:p-4 print:shadow-none">
                  <h3 className="font-serif font-bold text-white print:text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><Globe className="w-5 h-5 mr-2.5 text-blue-400 print:w-4 print:h-4" /> {text.modal.retention_title}</h3>
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner border border-slate-700 print:shadow-inner print:w-24 print:h-24 print:border-slate-200" style={{ background: `conic-gradient(#3b82f6 ${display.retention}%, ${display.isRegion ? '#1e293b' : '#1e293b'} 0)` }}>
                    <div className="absolute inset-4 bg-[#0f172a] print:bg-white rounded-full flex flex-col items-center justify-center border border-slate-800 print:border-slate-100">
                      <span className="text-3xl font-serif font-bold text-white print:text-slate-900 print:text-xl">{display.retention}%</span>
                      <span className="text-[9px] font-bold text-blue-400 uppercase mt-0.5 tracking-widest text-center px-2">{lang === 'fr' ? "Restent dans la région" : "Stay in the region"}</span>
                    </div>
                  </div>
                </div>
                  
                <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 p-7 shadow-sm flex flex-col justify-between print:p-4 print:break-inside-avoid">
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 mb-4 flex items-center text-xl print:mb-2 print:text-lg"><GitMerge className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.orig_dest_title}</h3>
                    <p className="text-slate-700 text-base leading-relaxed print:text-xs">{display.origDest}</p>
                    <div className="mt-4 pt-4 border-t border-slate-100 print:mt-2 print:pt-2">
                      <p className="text-xs text-slate-500 italic print:text-[10px]">{lang === 'fr' ? "Cette dynamique prouve que les pays du Sud sont avant tout des pays d'accueil et de passage interne." : "This dynamic proves that Southern countries are primarily host and internal passage countries."}</p>
                    </div>
                  </div>
                    
                  {!display.isRegion && (
                    <div className="mt-6 flex flex-col gap-4 print:mt-3 print:gap-2">
                      {(display.idp_conflict > 0 || display.idp_disaster > 0 || display.refugees_hosted > 0) && (
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-200 print:p-3">
                          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center print:text-xs print:mb-2"><ShieldAlert className="w-4 h-4 mr-2 text-slate-400" /> {text.modal.idp_title}</h4>
                          <div className="space-y-4 print:space-y-2">
                            {display.refugees_hosted > 0 && (
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                                  <span className="text-slate-600 print:!text-slate-600">{text.modal.hcr_hosted}</span>
                                  <span className="text-slate-900 print:!text-slate-900">{formatNumber(display.refugees_hosted)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200"><div className="h-full bg-slate-500 rounded-sm print:!bg-slate-500" style={{width: '100%'}}></div></div>
                              </div>
                            )}
                            {display.idp_conflict > 0 && (
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                                  <span className="text-rose-700 print:!text-rose-700">{text.modal.idp_conflict}</span>
                                  <span className="text-rose-900 print:!text-rose-900">{formatNumber(display.idp_conflict)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200"><div className="h-full bg-rose-700 rounded-sm print:!bg-rose-700" style={{width: '100%'}}></div></div>
                              </div>
                            )}
                            {display.idp_disaster > 0 && (
                              <div>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                                  <span className="text-blue-600 print:!text-blue-600">{text.modal.idp_disaster}</span>
                                  <span className="text-blue-800 print:!text-blue-800">{formatNumber(display.idp_disaster)}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200"><div className="h-full bg-blue-600 rounded-sm print:!bg-blue-600" style={{width: '100%'}}></div></div>
                              </div>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-3 italic print:mt-1.5 print:text-[8px]">{text.modal.idp_desc}</p>
                        </div>
                      )}

                      {display.avoi !== null && (
                        <div className="bg-slate-50 p-5 rounded-md border border-slate-200 print:p-3">
                          <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center print:text-xs print:mb-2"><Unlock className="w-4 h-4 mr-2 text-slate-400" /> {text.modal.avoi_title}</h4>
                          <div>
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5 print:text-[8px]">
                              <span className="text-slate-600 print:!text-slate-600">Score</span>
                              <span className="text-slate-900 print:!text-slate-900">{display.avoi}/100</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-sm overflow-hidden print:h-1.5 print:!bg-slate-200">
                              <div className="h-full bg-slate-600 rounded-sm transition-all duration-1000 print:!bg-slate-600" style={{width: `${display.avoi}%`}}></div>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 italic print:text-[8px] print:mt-1.5">{text.modal.avoi_desc}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className={`space-y-8 animate-in fade-in duration-500 ${modalView === 'economy' ? 'block' : 'hidden print:block'} print:space-y-4 print:break-inside-avoid`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Landmark className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.econ_title}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "L'apport des diasporas face à l'Assistance Publique au Développement (APD)." : "Diaspora contribution vs. Official Development Assistance (ODA)."}</p>
                  <div className="max-w-2xl"><EconomicComparison remittances={display.remittances} remittancesYear={display.remittances_year} aid={display.aid} lang={lang} /></div>
                  <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:mt-3 print:p-2"><p className="text-slate-700 text-sm print:text-[10px]">{lang === 'fr' ? "Les diasporas injectent massivement du capital directement dans l'économie réelle (familles, santé, éducation), rendant les Suds économiquement résilients sans dépendre exclusivement de la charité internationale." : "Diasporas inject massive capital directly into the real economy, making the Souths economically resilient without depending solely on international charity."}</p></div>
                </div>

                {display.au_treaties && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><FileText className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.au_instruments}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "État de ratification des conventions phares de l'OUA/UA en matière d'intégration et de mobilité." : "Ratification status of key OAU/AU conventions on integration and mobility."}</p>
                    <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] text-blue-700 font-bold hover:underline mb-6 print:hidden">
                      {lang === 'fr' ? "→ Consulter la base des traités de l'UA" : "→ View AU Treaties Database"}
                    </a>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className={`p-3 rounded-md border flex items-center justify-between ${display.au_treaties.constitutive ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="text-xs font-bold">Acte Constitutif UA</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${display.au_treaties.constitutive ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>{display.au_treaties.constitutive ? 'Ratifié' : 'Non ratifié'}</span>
                      </div>
                      <div className={`p-3 rounded-md border flex items-center justify-between ${display.au_treaties.abuja ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="text-xs font-bold">Traité d'Abuja (AEC)</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${display.au_treaties.abuja ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>{display.au_treaties.abuja ? 'Ratifié' : 'Non ratifié'}</span>
                      </div>
                      <div className={`p-3 rounded-md border flex items-center justify-between ${display.au_treaties.refugees_1969 ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="text-xs font-bold">Conv. Réfugiés (1969)</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${display.au_treaties.refugees_1969 ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>{display.au_treaties.refugees_1969 ? 'Ratifié' : 'Non ratifié'}</span>
                      </div>
                      <div className={`p-3 rounded-md border flex items-center justify-between ${display.au_treaties.kampala ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="text-xs font-bold">Conv. de Kampala (IDPs)</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${display.au_treaties.kampala ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>{display.au_treaties.kampala ? 'Ratifié' : 'Non ratifié'}</span>
                      </div>
                      <div className={`p-3 rounded-md border flex items-center justify-between ${display.au_treaties.free_movement ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="text-xs font-bold">Protocole Libre Circ.</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${display.au_treaties.free_movement ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>{display.au_treaties.free_movement ? 'Ratifié' : 'Non ratifié'}</span>
                      </div>
                      <div className={`p-3 rounded-md border flex items-center justify-between ${display.au_treaties.zlecaf ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        <span className="text-xs font-bold">Accord ZLECAf</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border ${display.au_treaties.zlecaf ? 'bg-blue-100 border-blue-200 text-blue-800' : 'bg-white border-slate-200 text-slate-500'}`}>{display.au_treaties.zlecaf ? 'Ratifié' : 'Non ratifié'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {display.normlex && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Scale className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Évaluation Juridique des Droits (Base NORMLEX OIT)" : "Legal Evaluation of Rights (ILO NORMLEX)"}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "Ratification des conventions internationales du travail et protection des travailleurs." : "Ratification of international labor standards and worker protection."}</p>
                    {display.normlex.link && (
                      <a href={display.normlex.link} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] text-blue-700 font-bold hover:underline mb-6 print:hidden">
                        {lang === 'fr' ? "→ Consulter le profil national NORMLEX" : "→ View NORMLEX National Profile"}
                      </a>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:grid-cols-4">
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Fondamentales" : "Fundamental"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.fundamental} / 11</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Gouvernance" : "Governance"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.governance} / 4</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Techniques" : "Technical"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.technical}</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 text-center print:p-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-1">{lang === 'fr' ? "Total Ratifications" : "Total Ratified"}</span>
                        <span className="text-xl font-serif font-bold text-slate-900 print:text-sm">{display.normlex.total}</span>
                      </div>
                    </div>
                  </div>
                )}
                  
                <div className="bg-[#0f172a] p-7 rounded-lg text-white relative overflow-hidden shadow-md print:bg-white print:text-slate-900 print:shadow-none print:border print:border-slate-200 print:p-4 print:break-inside-avoid">
                  <h3 className="text-lg font-serif font-bold mb-6 border-b border-slate-700 pb-3 print:border-slate-200 print:mb-3 print:pb-2 print:text-base">{text.modal.causal_chain}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 print:gap-3">
                    <div className="bg-slate-800/50 p-5 rounded-md border border-slate-700/50 print:bg-slate-50 print:border print:border-slate-200 print:p-3">
                      <span className="text-slate-400 print:text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2 block">{text.modal.trigger}</span>
                      <p className="text-sm leading-relaxed print:text-xs text-slate-200 print:text-slate-800">{display.trigger}</p>
                    </div>
                    <div className="bg-slate-800/50 p-5 rounded-md border border-slate-700/50 print:bg-slate-50 print:border print:border-slate-200 print:p-3">
                      <span className="text-slate-400 print:text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2 block">{text.modal.response}</span>
                      <p className="text-sm leading-relaxed print:text-xs text-slate-200 print:text-slate-800">{display.response}</p>
                    </div>
                    <div className="bg-slate-800/50 p-5 rounded-md border border-slate-700/50 print:bg-slate-50 print:border print:border-slate-200 print:p-3">
                      <span className="text-slate-400 print:text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-2 block">{text.modal.impact}</span>
                      <p className="text-sm leading-relaxed print:text-xs text-slate-200 print:text-slate-800">{display.impact}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 print:hidden">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest hidden md:block">{text.modal.data_source}</span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button onClick={exportCountryProfileCSV} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-white border border-slate-300 text-slate-700 hover:text-blue-700 px-4 py-2 rounded-sm text-[11px] font-bold transition-colors shadow-sm"><Download className="w-3.5 h-3.5" /> <span>{text.modal.export_csv}</span></button>
                <button onClick={() => window.print()} className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-sm text-[11px] font-bold transition-colors shadow-sm"><Printer className="w-3.5 h-3.5" /> <span>{text.modal.export_pdf}</span></button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <div className="flex items-center space-x-2 mb-2 justify-center md:justify-start">
              <Globe className="h-5 w-5 text-blue-500" />
              <span className="text-white font-serif font-bold text-lg tracking-widest uppercase">South(s) Mobility</span>
            </div>
            <p className="text-xs">{text.footer.tag}</p>
          </div>
          <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500">
            <p>{text.footer.sources}</p>
            <p className="mt-3 text-blue-500">© 2026 • Yassine Ben Mokhtar • Initiative Citoyenne & Recherche Indépendante</p>
          </div>
        </div>
      </footer>
    </div>
  );
}