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