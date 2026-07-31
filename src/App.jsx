import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, ShieldAlert, TrendingUp, Sun, MapPin, Database, 
  ArrowRight, Languages, Activity, Users, Scale, Leaf, 
  Search, HeartPulse, ChevronRight, ChevronDown, X, BarChart3, GitMerge, 
  Download, Printer, Map as MapIcon, Info, BookOpen, CheckCircle2, 
  PieChart, TableProperties, Landmark, Quote, Unlock, Target, ExternalLink, FileText,
  Mail, Linkedin
} from 'lucide-react';

const formatNumber = (val) => {
  if (val === undefined || val === null) return "0";
  const strVal = String(val);
  if (strVal.includes('M') || strVal.includes('k')) return strVal;
  const num = parseInt(strVal.replace(/\s/g, ''), 10);
  if (isNaN(num)) return val;
  return num.toLocaleString('fr-FR'); 
};

const getCountryCode = (nameFr) => {
  const map = {
    "Algérie": "dz", "Égypte": "eg", "Libye": "ly", "Maroc": "ma", "Tunisie": "tn",
    "Bénin": "bj", "Burkina Faso": "bf", "Cabo Verde": "cv", "Côte d'Ivoire": "ci", "Gambie": "gm",
    "Ghana": "gh", "Guinée": "gn", "Guinée-Bissau": "gw", "Libéria": "lr", "Mali": "ml",
    "Mauritanie": "mr", "Niger": "ne", "Nigéria": "ng", "Sénégal": "sn", "Sierra Leone": "sl", "Togo": "tg",
    "Angola": "ao", "Cameroun": "cm", "Centrafrique": "cf", "Tchad": "td", "Congo": "cg",
    "R.D. Congo": "cd", "Guinée Équatoriale": "gq", "Gabon": "ga", "Sao Tomé-et-Principe": "st",
    "Burundi": "bi", "Comores": "km", "Djibouti": "dj", "Érythrée": "er", "Éthiopie": "et",
    "Kenya": "ke", "Madagascar": "mg", "Malawi": "mw", "Maurice": "mu", "Mozambique": "mz",
    "Rwanda": "rw", "Seychelles": "sc", "Somalie": "so", "Soudan du Sud": "ss", "Soudan": "sd",
    "Tanzanie": "tz", "Ouganda": "ug", "Zambie": "zm", "Zimbabwe": "zw",
    "Botswana": "bw", "Eswatini": "sz", "Lesotho": "ls", "Namibie": "na", "Afrique du Sud": "za"
  };
  return map[nameFr] || "un";
};

const HistoricalChart = ({ data, colorClass }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => parseFloat(d.value))) * 1.5; 
  return (
    <div className="flex items-end justify-between h-24 w-full gap-2 mt-4 pt-4 border-b border-slate-200 pb-2">
      {data.map((point, i) => {
        const heightPct = (parseFloat(point.value) / maxVal) * 100;
        return (
          <div key={i} className="flex flex-col items-center flex-1 group relative h-full justify-end">
            <div 
              className={`w-full max-w-[32px] rounded-t-sm transition-all duration-1000 ease-out cursor-pointer hover:opacity-80 ${colorClass} print:!bg-blue-700`}
              style={{ height: `${Math.max(5, heightPct)}%` }}
            >
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity print:opacity-100 whitespace-nowrap">
                {parseFloat(point.value) > 100 
                  ? (parseFloat(point.value) >= 1000000 ? (parseFloat(point.value)/1000000).toFixed(1) + 'M' : (parseFloat(point.value)/1000).toFixed(0) + 'k') 
                  : point.value + '%'}
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-500 mt-2">{point.year}</span>
          </div>
        );
      })}
    </div>
  );
};

const EconomicComparison = ({ remittances, aid, lang }) => {
  const max = Math.max(remittances, aid) * 1.1;
  const remPct = max === 0 ? 0 : (remittances / max) * 100;
  const aidPct = max === 0 ? 0 : (aid / max) * 100;
  
  return (
    <div className="space-y-5 mt-4">
      <div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
          <span className="text-amber-700 print:!text-amber-700">{lang === 'fr' ? "Transferts des diasporas" : "Remittances"}</span>
          <span className="text-amber-900 print:!text-amber-900">{remittances}% PIB</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden print:!bg-slate-200">
          <div className="h-full bg-amber-600 rounded-sm transition-all duration-1000 print:!bg-amber-600" style={{width: `${remPct}%`}}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
          <span className="text-slate-600 print:!text-slate-500">{lang === 'fr' ? "Aide Internationale (APD)" : "International Aid (ODA)"}</span>
          <span className="text-slate-800 print:!text-slate-600">{aid}% PIB</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden print:!bg-slate-200">
          <div className="h-full bg-slate-400 rounded-sm transition-all duration-1000 print:!bg-slate-400" style={{width: `${aidPct}%`}}></div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState('fr');
  const [activeSubRegion, setActiveSubRegion] = useState('all');
  const [activeSubTab, setActiveSubTab] = useState('perspective');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalView, setModalView] = useState('demography'); 
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedMyth, setExpandedMyth] = useState(null);
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

  const t = {
    fr: {
      title: "South(s) Mobility",
      subtitle: "DataHub",
      desc: "Analyse citoyenne des migrations mondiales. Une lecture décolonisée privilégiant la proportionnalité, les ratifications de l'Union Africaine et les dynamiques de transition démographique des Suds.",
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
      metrics: { stock: "Stock Total (2024)", female: "Parité (Femmes %)", evolution: "Part Pop. Nationale" },
      comparative_view_title: "Analyse Comparative : Transition Démographique & Résilience Sud-Sud",
      comparative_view_desc: "Contrairement au mythe d'un continent subissant une pression migratoire incontrôlable vers le Nord, les données croisées de l'UNDESA et de l'IDMC démontrent que la dynamique démographique africaine nourrit d'abord l'économie interne et la mobilité circulaire Sud-Sud. La part des migrants internationaux reste structurellement stable (~1,9%), absorbée à 70% par le continent lui-même.",
      modal: {
        close: "Fermer", tabs: { demo: "Démographie", geo: "Géographie", econ: "Économie & Droits" },
        south_view: "Perspective Analytique des Suds",
        evo_title: "La constante proportionnelle (1990-2024)", parity: "Féminisation des flux", retention_title: "Rétention Régionale (Sud-Sud)",
        orig_dest_title: "Dynamiques de Transition & Proximité", econ_title: "Indépendance Économique",
        causal_chain: "Chaîne de causes systémiques", trigger: "Déclencheur", response: "Réponse Migratoire", impact: "Impact Socio-économique",
        data_source: "Sources : UNDESA / IDMC / UNHCR / OIT (NORMLEX) / OIM (IOM) / Union Africaine (UA)", export_csv: "Exporter (CSV)", export_pdf: "Rapport (PDF)",
        raw_data_title: "Fiche de Données Brutes", infographic_title: "Infographie : Répartition des Flux",
        idp_title: "Protection & Déplacements Forcés", idp_desc: "L'essentiel de la mobilité contrainte africaine est absorbée à l'intérieur des frontières ou dans les pays limitrophes.",
        idp_conflict: "Déplacés Internes (Conflits)", idp_disaster: "Déplacés Internes (Climat)",
        hcr_hosted: "Réfugiés internationaux accueillis",
        avoi_title: "Intégration Régionale (Indice AVOI)", avoi_desc: "Score d'ouverture des frontières aux ressortissants des autres pays africains.",
        au_instruments: "Traités Clés de l'Union Africaine"
      },
      sections: { 
        debunk: "1. Déconstruction des Narratifs", 
        global: "2. Perspective Globale (2024)", 
        explorer: "3. Explorateur Analytique & Comparatif", 
        data: "4. Cadre d'Indicateurs Recommandés", 
        sdg_gcm: "5. Alignement ODD (SDGs) & GCM / GCR",
        about_title: "6. À Propos du Projet", 
        method_title: "7. Ingénierie & Méthodologie" 
      },
      global_stats: {
        world: "Total Mondial",
        europe: "Europe",
        asia: "Asie",
        na: "Amérique du Nord",
        africa: "Afrique",
        latam: "Amérique Latine",
        share: "Part mondiale :",
        note: "Contrairement aux discours alarmistes, l'Afrique ne représente que 9,5% du stock migratoire mondial. L'Europe et l'Asie accueillent la vaste majorité des mobilités internationales."
      },
      sdg_section: {
        title: "Ancrage International : ODD, GCM & GCR",
        subtitle: "L'Agenda 2030, le Pacte Mondial pour les Migrations (GCM - 23 Objectifs) et le Pacte sur les Réfugiés (GCR).",
        tab_sdg: "Objectifs de Développement Durable (ODD)",
        tab_gcm: "Pacte Mondial pour les Migrations (GCM)",
        tab_gcr: "Pacte Mondial sur les Réfugiés (GCR)",
        sdg_desc: "Reconnaissant pour la première fois la migration comme un accélérateur du développement, l'Agenda 2030 intègre la mobilité à travers ses 17 objectifs. Ne pas 'laisser pour compte' les migrants exige une désagrégation rigoureuse des données par statut migratoire (Cible 17.18).",
        gcm_desc: "Le Pacte Mondial pour des Migrations Sûres, Ordonnées et Régulières (GCM, Marrakech 2018) énonce 23 objectifs interconnectés pour améliorer la gouvernance mondiale des migrations à tous les niveaux.",
        gcr_desc: "Le Pacte Mondial sur les Réfugiés (GCR, 2018) établit un cadre contraignant pour un partage plus équitable et prévisible de la charge et de la responsabilité de l'accueil des réfugiés, reconnaissant que les pays du Sud en portent l'immense majorité.",
        link_text: "Accéder au site officiel",
        sdg_points: [
          { title: "Cible 10.7 (Gestion des migrations)", desc: "Faciliter une migration ordonnée, sûre, régulière et responsable grâce à des politiques planifiées et bien gérées." },
          { title: "Cible 10.c (Réduction des coûts de transfert)", desc: "Ramener à moins de 3 % les coûts de transaction des envois de fonds des diasporas et éliminer les corridors > 5%." },
          { title: "Cible 17.18 (Désagrégation des données)", desc: "Améliorer l'aide aux pays en développement pour accroître la disponibilité de données ventilées par statut migratoire." },
          { title: "Cible 8.8 (Droits des travailleurs)", desc: "Protéger les droits du travail et promouvoir un environnement de travail sûr pour tous les travailleurs, y compris les migrants." }
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
          { num: "Obj. 19", title: "Diasporas", desc: "Créer des conditions propices pour que les diasporas contribuent pleinement au développement durable." },
          { num: "Obj. 20", title: "Transferts de fonds", desc: "Promouvoir des transferts de fonds rapides, sûrs et moins coûteux et stimuler l'inclusion financière." },
          { num: "Obj. 21", title: "Retour et réadmission", desc: "Coopérer pour assurer un retour et une réadmission sûrs et dignes, ainsi qu'une réintégration durable." },
          { num: "Obj. 22", title: "Sécurité sociale", desc: "Établir des mécanismes de portabilité des droits sociaux et des prestations de retraite." },
          { num: "Obj. 23", title: "Coopération internationale", desc: "Renforcer la coopération internationale et les partenariats mondiaux pour une migration sûre." }
        ],
        gcr_objectifs: [
          { title: "1. Alléger la pression sur les pays d'accueil", desc: "Soutenir structurellement les pays en développement (comme l'Ouganda ou le Tchad) qui accueillent de larges populations de réfugiés." },
          { title: "2. Renforcer l'autonomie des réfugiés", desc: "Sortir de l'assistanat humanitaire de longue durée en favorisant l'accès au marché du travail et aux services nationaux." },
          { title: "3. Élargir l'accès aux solutions de pays tiers", desc: "Multiplier les voies régulières d'admission (réinstallation, parrainage privé, visas d'études et de travail)." },
          { title: "4. Appuyer les conditions de retour", desc: "Favoriser les retours volontaires, sûrs et dignes dans les pays d'origine lorsque la situation sécuritaire le permet." }
        ]
      },
      indicator_desc: "Ce référentiel n'est pas une base de données exhaustive, mais une matrice méthodologique suggérée. Il sert de guide pour les institutions, décideurs et chercheurs souhaitant objectiver la gouvernance des mobilités et orienter leurs futures collectes de données brutes sur le terrain.",
      download_indicators: "Télécharger la Matrice (CSV)",
      debunk_cards: [
        { myth: "L'explosion migratoire africaine.", real: "Stabilité historique de la proportion (~1,9%).", stat_text: "1.9%", stat_val: 1.9, color: "bg-blue-700", desc: "La part des migrants internationaux africains évolue très lentement. L'augmentation des volumes absolus n'est qu'un reflet de la croissance démographique continentale." },
        { myth: "L'Afrique envahit l'Europe.", real: "Les migrations intra-africaines dominent (70%).", stat_text: "70%", stat_val: 70, color: "bg-teal-700", desc: "Les pôles d'attraction sont internes. Des pays comme la Côte d'Ivoire ou l'Afrique du Sud attirent massivement les travailleurs régionaux." },
        { myth: "Le Nord accueille la majorité des réfugiés.", real: "Les réfugiés restent dans les pays frontaliers.", stat_text: "76%", stat_val: 76, color: "bg-orange-700", desc: "Le rapport HCR 2025 confirme que l'écrasante majorité des personnes fuyant les conflits trouvent refuge dans des pays limitrophes du Sud." },
        { myth: "La migration est une affaire d'hommes.", real: "Féminisation structurelle des flux (47%).", stat_text: "47%", stat_val: 47, color: "bg-purple-700", desc: "Les femmes représentent aujourd'hui près de la moitié des migrants, redéfinissant l'économie du soin." },
        { myth: "L'Afrique dépend de l'Aide Internationale.", real: "Les transferts de la diaspora dépassent l'aide publique.", stat_text: "3x plus", stat_val: 75, color: "bg-amber-600", desc: "Les envois de fonds constituent un filet de sécurité vital qui surpasse largement les budgets de l'aide internationale." },
        { myth: "Le climat va vider le continent vers le Nord.", real: "Les déplacements climatiques sont majoritairement internes.", stat_text: ">90%", stat_val: 90, color: "bg-cyan-700", desc: "Plus de 90% des déplacés climatiques restent à l'intérieur de leurs frontières nationales ou sous-régionales (données IDMC)." },
        { myth: "Les pays d'Afrique côtière ne sont que des zones de passage.", real: "Transformation structurelle en pays de destination.", stat_text: "Mutation", stat_val: 65, color: "bg-indigo-700", desc: "Contrairement au narratif de l'Europe 'forteresse', les États perçus comme de simples espaces de passage voient une majorité de personnes s'y installer durablement, transformant leur gouvernance locale et leur tissu socio-économique." },
        { myth: "Le développement économique arrêtera les départs.", real: "Le paradoxe de la transition (Migration Hump).", stat_text: "Catalyseur", stat_val: 80, color: "bg-rose-700", desc: "Historiquement et statistiquement, l'augmentation initiale des revenus dans un pays en développement fournit en réalité le capital nécessaire pour migrer. La mobilité augmente avec le développement avant de se stabiliser." },
        { myth: "Les migrants représentent un fardeau pour les pays d'accueil du Sud.", real: "Ils sont des moteurs de l'économie informelle et de l'emploi.", stat_text: "+ Valeur", stat_val: 85, color: "bg-emerald-700", desc: "Les données montrent que les migrants intra-africains comblent des pénuries structurelles, stimulent la consommation locale et créent des micro-entreprises, contribuant positivement à la résilience des pays hôtes." }
      ],
      about: { 
        p1: "South(s) Mobility DataHub est un portail d'analyse géopolitique, de recherche académique et de visualisation de données indépendant, conçu à l'intersection de la science des données et de l'analyse des politiques publiques.", 
        p2: "Rigueur empirique & Neutralité institutionnelle : Face à la polarisation médiatique et aux narratifs surinterprétés, ce projet adopte une démarche strictement empirique. Il privilégie l'objectivation statistique des réalités continentales africaines et des Suds.",
        expanded_p1: "En plaçant la proportionnalité mathématique et la pondération démographique au cœur de sa méthode, le portal neutralise les biais d'optique causés par la croissance absolue des volumes et révèle les constantes structurelles des mobilités.",
        expanded_p2: "Ce portail met en lumière les angles morts des statistiques officielles et constitue un outil de référence apolitique et factuel pour les chercheurs, décideurs publics, journalistes et la société civile.",
        contact_title: "Transparence & Rétroaction Citoyenne",
        contact_desc: "Une coquille statistique ? Une suggestion méthodologique ou une opportunité de collaboration académique / institutionnelle ? L'Open Data s'enrichit grâce à l'amélioration continue et au dialogue.",
        citation_title: "Citation Académique & Journalistique (Norme APA) :",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub : Analyse empirique des migrations africaines. Extrait de https://southsmobility.org"
      },
      method: { 
        summary: "L'architecture méthodologique repose sur la consolidation rigoureuse et le traitement transparent de données ouvertes certifiées (Open Data) :",
        m1: "Extraction & Harmonisation : Croisement des bases de données internationales certifiées.", 
        m2: "Analyse Proportionnelle : Normalisation des stocks migratoires par rapport aux bases démographiques régionales.", 
        m3: "Modélisation Comparative : Évaluation croisée de la transition démographique et de la rétention régionale.",
        m4: "Open Source & Intégrité : Infrastructure ouverte et indépendante de toute affiliation institutionnelle.",
        sources_title: "Accès aux Datasets Originaux & Cadres :",
        s1: "Département des affaires économiques et sociales (UNDESA, 2024)",
        s2: "Haut Commissariat des Nations Unies pour les Réfugiés (UNHCR, 2025)",
        s3: "Observatoire des déplacements internes (IDMC, 2025)",
        s4: "Organisation Internationale pour les Migrations (OIM, 2025)",
        s5: "Organisation Internationale du Travail (OIT NORMLEX)",
        s6: "Union Africaine (Traités)"
      },
      myth: "Postulat", reality: "Donnée Factuelle",
      footer: { tag: "L'ingénierie des données au service d'une analyse géopolitique apaisée.", sources: "Data: UNDESA 2024 • UNHCR 2025 • IDMC 2025 • OIT • OIM • Traités UA • BM" },
      analysis_title: "Tableau de Bord Détaillé", analysis_btn: "Accéder au rapport",
      hero_title: "Objectiver les mobilités", hero_highlight: "par la science des données."
    },
    en: {
      title: "South(s) Mobility", subtitle: "DataHub",
      desc: "Citizen analysis of global migrations. A decolonized reading focusing on proportionality and demographic transition dynamics.",
      sidebar: { title: "Analysis Levels", subregion: "Sub-region", search: "Search country..." },
      all_regions: "All Africa",
      perspectives: { continent: "Continental Perspective", subregion: "Sub-regional Perspective" },
      badge: { regional: "Macro-Regional Data & Demographic Transition", country: "National Profile" },
      regions: { 
        af_med: "Mediterranean Africa", 
        af_west: "West Africa", 
        af_south: "Southern Africa", 
        af_east: "East Africa", 
        af_central: "Central Africa" 
      },
      metrics: { stock: "Total Stock (2024)", female: "Parity (Women %)", evolution: "Nat. Pop. Share" },
      comparative_view_title: "Comparative Analysis: Demographic Transition & South-South Resilience",
      comparative_view_desc: "Contrary to the myth of an uncontrollable migratory pressure heading North, cross-referenced UNDESA and IDMC data show that Africa's demographic dynamics primarily feed internal economies and South-South circular mobility. International migrant share remains structurally stable (~1.9%), with 70% absorbed within the continent.",
      modal: { 
        close: "Close", tabs: { demo: "Demography", geo: "Geography", econ: "Economy & Treaties" }, 
        south_view: "Analytical Perspective", evo_title: "The Proportional Constant (1990-2024)", parity: "Feminization of flows", retention_title: "Regional Retention (South-South)", orig_dest_title: "Transition & Proximity Dynamics", econ_title: "Economic Independence", 
        causal_chain: "Systemic Causal Chain", trigger: "Trigger", response: "Migratory Response", impact: "Socio-economic Impact", 
        data_source: "Sources: UNDESA / IDMC / UNHCR / ILO NORMLEX / IOM / African Union", export_csv: "Export (CSV)", export_pdf: "Report (PDF)", 
        raw_data_title: "Raw Data Sheet", infographic_title: "Infographic: Flow Distribution",
        idp_title: "Protection & Forced Displacement", idp_desc: "A significant part of African forced mobility is absorbed within borders or neighboring countries.", 
        idp_conflict: "Internally Displaced (Conflict)", idp_disaster: "Internally Displaced (Climate)",
        hcr_hosted: "International Refugees Hosted",
        avoi_title: "Regional Integration (AVOI)", avoi_desc: "Visa openness index for citizens of other African countries.",
        au_instruments: "Key African Union Treaties"
      },
      sections: { 
        debunk: "1. Deconstructing Narratives", 
        global: "2. Perspective Globale (2024)", 
        explorer: "3. Analytical Explorer & Comparative View", 
        data: "4. Recommended Indicators Framework", 
        sdg_gcm: "5. SDG & GCM Policy Alignment",
        about_title: "6. About the Project", 
        method_title: "7. Engineering & Methodology" 
      },
      global_stats: {
        world: "Global Total",
        europe: "Europe",
        asia: "Asia",
        na: "North America",
        africa: "Africa",
        latam: "Latin America",
        share: "Global share:",
        note: "Contrary to alarmist narratives, Africa accounts for only 9.5% of the global migrant stock. Europe and Asia host the vast majority of international mobilities."
      },
      sdg_section: {
        title: "International Frameworks: SDGs, GCM & GCR",
        subtitle: "The 2030 Agenda, the Global Compact for Migration (GCM - 23 Objectives), and the Global Compact on Refugees (GCR) as political compasses.",
        tab_sdg: "Sustainable Development Goals (SDGs)",
        tab_gcm: "Global Compact for Migration (GCM)",
        tab_gcr: "Global Compact on Refugees (GCR)",
        sdg_desc: "Recognizing migration for the first time as a driver of sustainable development, the 2030 Agenda integrates mobility across all 17 goals. Ensuring 'no one is left behind' requires rigorous data disaggregation by migratory status (Target 17.18).",
        gcm_desc: "Adopted in 2018, the Global Compact for Safe, Orderly and Regular Migration (GCM) outlines 23 comprehensive objectives focused on international cooperation, rights, and South-South synergies.",
        gcr_desc: "Affirmed in 2018, the Global Compact on Refugees (GCR) provides a blueprint for predictable and equitable burden- and responsibility-sharing, acknowledging the vital hosting role played by Southern countries.",
        link_text: "Access official website",
        sdg_points: [
          { title: "Target 10.7 (Migration Governance)", desc: "Facilitate orderly, safe, regular and responsible migration and mobility through planned and well-managed policies." },
          { title: "Target 10.c (Remittance Costs)", desc: "Reduce transaction costs of diaspora remittances to less than 3% and eliminate high-cost corridors." },
          { title: "Target 17.18 (Data Disaggregation)", desc: "Enhance support to developing countries to increase availability of high-quality data disaggregated by migratory status." },
          { title: "Target 8.8 (Labor Rights)", desc: "Protect labor rights and promote safe working environments for all migrant workers." }
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
          { title: "1. Ease pressures on host countries", desc: "Provide robust, sustained structural support to developing nations hosting large refugee populations." },
          { title: "2. Enhance refugee self-reliance", desc: "Move beyond prolonged aid dependency by integrating refugees into local economies and national systems." },
          { title: "3. Expand access to third-country solutions", desc: "Increase resettlement slots, complementary pathways, and safe regular migration channels." },
          { title: "4. Support conditions in countries of origin", desc: "Foster safe, voluntary, and dignified returns when conditions stabilize." }
        ]
      },
      indicator_desc: "This registry is not an exhaustive database, but a suggested methodological matrix. It serves as a guide for institutions, policymakers, and researchers wishing to objectify mobility governance and guide their future raw data collection on the ground.",
      download_indicators: "Download Matrix (CSV)",
      debunk_cards: [
        { myth: "The African migration explosion.", real: "Historical stability of proportion (~1.9%).", stat_text: "1.9%", stat_val: 1.9, color: "bg-blue-700", desc: "The share of international migrants evolves very slowly. Absolute volume increase is a reflection of demographic growth." },
        { myth: "Africa is invading Europe.", real: "Intra-African migrations dominate (70%).", stat_text: "70%", stat_val: 70, color: "bg-teal-700", desc: "Poles of attraction are internal. Countries like Côte d'Ivoire or South Africa massively attract regional workers." },
        { myth: "The North hosts the majority of refugees.", real: "Refugees stay in bordering countries.", stat_text: "76%", stat_val: 76, color: "bg-orange-700", desc: "The UNHCR 2025 report confirms the overwhelming majority of people fleeing conflicts find refuge in neighboring Southern countries." },
        { myth: "Migration is primarily a male affair.", real: "Structural feminization of flows (47%).", stat_text: "47%", stat_val: 47, color: "bg-purple-700", desc: "Women now represent nearly half of migrants, redefining the global care economy." },
        { myth: "Africa depends on International Aid.", real: "Remittances far exceed official public aid.", stat_text: "3x more", stat_val: 75, color: "bg-amber-600", desc: "Diaspora remittances constitute a vital safety net that far surpasses international aid budgets." },
        { myth: "Climate will empty the continent to the North.", real: "Climate displacement is overwhelmingly internal.", stat_text: ">90%", stat_val: 90, color: "bg-cyan-700", desc: "Over 90% of climate displaced persons remain within their national or sub-regional borders (IDMC data)." },
        { myth: "Coastal African nations are merely areas of passage.", real: "Structural transformation into destination countries.", stat_text: "Mutation", stat_val: 65, color: "bg-indigo-700", desc: "Contrary to the 'Fortress Europe' narrative, states perceived as simple areas of passage see a majority of people settle permanently, transforming local governance and socioeconomic fabrics." },
        { myth: "Economic development will mechanically stop emigration.", real: "The transition paradox (Migration Hump).", stat_text: "Catalyst", stat_val: 80, color: "bg-rose-700", desc: "Historically and statistically, an initial increase in income in a developing country actually provides the capital needed to migrate. Mobility increases with development before stabilizing." },
        { myth: "Migrants are a burden on Southern host countries.", real: "They are drivers of the informal economy and employment.", stat_text: "+ Value", stat_val: 85, color: "bg-emerald-700", desc: "Data shows that intra-African migrants fill structural shortages, stimulate local consumption, and create micro-enterprises, contributing positively to host countries' resilience." }
      ],
      about: { 
        p1: "South(s) Mobility DataHub is an independent data research and visualization portal at the intersection of data science, geopolitics, and public policy analysis.", 
        p2: "Empirical Rigor & Institutional Neutrality: Facing polarized narratives, this project adopts a strictly factual approach centered on African continental realities.",
        expanded_p1: "By prioritizing mathematical proportionality and demographic weighting, the methodology neutralizes absolute volume biases to reveal structural mobility trends.",
        expanded_p2: "This portal highlights statistical blind spots, standing as a factual and apolitical reference tool for researchers, policymakers, journalists, and civil society.",
        contact_title: "Transparency & Community Feedback",
        contact_desc: "Spotted a data discrepancy? Have a methodological suggestion or a collaboration proposal? Open Data thrives on continuous improvement and peer dialogue.",
        citation_title: "Academic & Journalistic Citation (APA format):",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub: Empirical analysis of African migrations. Retrieved from https://southsmobility.org"
      },
      method: { 
        summary: "The methodological architecture relies on the rigorous consolidation and transparent processing of certified Open Data:",
        m1: "Extraction & Harmonization: Cross-referencing certified international databases.", 
        m2: "Proportional Analysis: Normalization of migratory stocks against regional demographic bases.", 
        m3: "Comparative Modeling: Cross-evaluating demographic transition and regional retention.",
        m4: "Open Source & Integrity: Open infrastructure, independent of institutional affiliations.",
        sources_title: "Access Original Datasets & Frameworks:",
        s1: "Department of Economic and Social Affairs (UNDESA, 2024)",
        s2: "United Nations High Commissioner for Refugees (UNHCR, 2025)",
        s3: "Internal Displacement Monitoring Centre (IDMC, 2025)",
        s4: "International Organization for Migration (IOM, 2025)",
        s5: "International Labour Organization (ILO NORMLEX)",
        s6: "African Union (Treaties)"
      },
      myth: "Premise", reality: "Factual Data",
      footer: { tag: "Data engineering serving an objective geopolitical narrative.", sources: "Data: UN DESA 2024 • UNHCR 2025 • IDMC 2025 • ILO • IOM • AU Treaties • WB" },
      analysis_title: "Detailed Dashboard", analysis_btn: "Access detailed report",
      hero_title: "Objectifying mobilities", hero_highlight: "through data science."
    }
  };

  const text = t[lang];

  const genericDesc = {
    evo_desc: { fr: "Proportion migratoirement stable rythmée par la démographie locale.", en: "Migratory proportion structurally stable, driven by local demography." },
    origDest: { fr: "Mobilités majoritairement de proximité et circulaires au sein de l'espace sous-régional.", en: "Predominantly proximity and circular mobilities within the sub-regional space." },
    trigger: { fr: "Asymétries de développement et chocs climatiques.", en: "Development asymmetries and climate shocks." },
    response: { fr: "Déplacements transfrontaliers de travail et stratégies de survie.", en: "Cross-border labor displacements and survival strategies." },
    impact: { fr: "Résilience économique via les transferts de fonds (Remittances).", en: "Economic resilience through remittances." }
  };

  const countryData = {
    "af_med": [
      { 
        "id": "12", "name": { "fr": "Algérie", "en": "Algeria" }, "flag": "🇩🇿", "retention": 60, "aid": 0.1, "stock": "259458", "female": "47.2", 
        "history": [ { "year": 1990, "value": "273954" }, { "year": 2024, "value": "259458" } ], "remittances": 0.8, "labour_participation": "65.0", "evolution": "0.6", 
        "idp_conflict": 0, "idp_disaster": 10, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 48, "total": 60, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103006"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "818", "name": { "fr": "Égypte", "en": "Egypt" }, "flag": "🇪🇬", "retention": 75, "aid": 1.5, "stock": "1139820", "female": "47.1", 
        "history": [ { "year": 1990, "value": "144713" }, { "year": 2024, "value": "1139820" } ], "remittances": 4.9, "labour_participation": "65.0", "evolution": "1.1", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 834200, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 3, "technical": 54, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103254"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "434", "name": { "fr": "Libye", "en": "Libya" }, "flag": "🇱🇾", "retention": 85, "aid": 2.1, "stock": "897751", "female": "28.2", 
        "history": [ { "year": 1990, "value": "457075" }, { "year": 2024, "value": "897751" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "12.8", 
        "idp_conflict": 85000, "idp_disaster": 21000, "refugees_hosted": 551700, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 19, "total": 29, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102919"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "504", "name": { "fr": "Maroc", "en": "Morocco" }, "flag": "🇲🇦", "retention": 55, "aid": 1.2, "stock": "111069", "female": "48.5", 
        "history": [ { "year": 1990, "value": "54895" }, { "year": 2024, "value": "111069" } ], "remittances": 8.0, "labour_participation": "65.0", "evolution": "0.3", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 4, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102993"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "788", "name": { "fr": "Tunisie", "en": "Tunisia" }, "flag": "🇹🇳", "retention": 50, "aid": 1.8, "stock": "63201", "female": "47.7", 
        "history": [ { "year": 1990, "value": "37984" }, { "year": 2024, "value": "63201" } ], "remittances": 6.0, "labour_participation": "65.0", "evolution": "0.5", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102980"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      }
    ],
    "af_west": [
      { 
        "id": "204", "name": { "fr": "Bénin", "en": "Benin" }, "flag": "🇧🇯", "retention": 80, "aid": 4.1, "stock": "418202", "female": "52.9", 
        "history": [ { "year": 1990, "value": "76751" }, { "year": 2024, "value": "418202" } ], "remittances": 1.7, "labour_participation": "65.0", "evolution": "3.0", 
        "idp_conflict": 26000, "idp_disaster": 1100, "refugees_hosted": 0, "avoi": 100, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 22, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103009"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "854", "name": { "fr": "Burkina Faso", "en": "Burkina Faso" }, "flag": "🇧🇫", "retention": 90, "aid": 6.2, "stock": "739820", "female": "52.4", 
        "history": [ { "year": 1990, "value": "349652" }, { "year": 2024, "value": "739820" } ], "remittances": 2.9, "labour_participation": "65.0", "evolution": "3.2", 
        "idp_conflict": 2063000, "idp_disaster": 210, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 4, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103058"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "132", "name": { "fr": "Cabo Verde", "en": "Cabo Verde" }, "flag": "🇨🇻", "retention": 40, "aid": 8.1, "stock": "16515", "female": "49.4", 
        "history": [ { "year": 1990, "value": "8931" }, { "year": 2024, "value": "16515" } ], "remittances": 12.6, "labour_participation": "65.0", "evolution": "3.0", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 2, "technical": 5, "total": 16, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102978"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "384", "name": { "fr": "Côte d'Ivoire", "en": "Côte d'Ivoire" }, "flag": "🇨🇮", "retention": 95, "aid": 1.5, "stock": "2880839", "female": "40.0", 
        "history": [ { "year": 1990, "value": "1822374" }, { "year": 2024, "value": "2880839" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "9.5", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 4, "technical": 33, "total": 48, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103023"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "270", "name": { "fr": "Gambie", "en": "Gambia" }, "flag": "🇬🇲", "retention": 60, "aid": 10.5, "stock": "236137", "female": "47.2", 
        "history": [ { "year": 1990, "value": "118123" }, { "year": 2024, "value": "236137" } ], "remittances": 21.6, "labour_participation": "65.0", "evolution": "8.8", 
        "idp_conflict": 0, "idp_disaster": 250, "refugees_hosted": 0, "avoi": 100, 
        "normlex": {"fundamental": 8, "governance": 0, "technical": 11, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103004"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "288", "name": { "fr": "Ghana", "en": "Ghana" }, "flag": "🇬🇭", "retention": 70, "aid": 2.5, "stock": "532286", "female": "46.6", 
        "history": [ { "year": 1990, "value": "164851" }, { "year": 2024, "value": "532286" } ], "remittances": 3.0, "labour_participation": "65.0", "evolution": "1.6", 
        "idp_conflict": 3900, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103271"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "324", "name": { "fr": "Guinée", "en": "Guinea" }, "flag": "🇬🇳", "retention": 85, "aid": 4.8, "stock": "117416", "female": "41.2", 
        "history": [ { "year": 1990, "value": "403621" }, { "year": 2024, "value": "117416" } ], "remittances": 2.2, "labour_participation": "65.0", "evolution": "0.8", 
        "idp_conflict": 0, "idp_disaster": 130, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 50, "total": 62, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103001"},
        "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "624", "name": { "fr": "Guinée-Bissau", "en": "Guinea-Bissau" }, "flag": "🇬🇼", "retention": 75, "aid": 9.1, "stock": "15064", "female": "50.6", 
        "history": [ { "year": 1990, "value": "15368" }, { "year": 2024, "value": "15064" } ], "remittances": 9.8, "labour_participation": "65.0", "evolution": "0.7", 
        "idp_conflict": 0, "idp_disaster": 700, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 1, "technical": 25, "total": 34, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103328"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "430", "name": { "fr": "Libéria", "en": "Liberia" }, "flag": "🇱🇷", "retention": 80, "aid": 15.5, "stock": "72423", "female": "42.4", 
        "history": [ { "year": 1990, "value": "94964" }, { "year": 2024, "value": "72423" } ], "remittances": 21.6, "labour_participation": "65.0", "evolution": "1.3", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 17, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102941"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "466", "name": { "fr": "Mali", "en": "Mali" }, "flag": "🇲🇱", "retention": 85, "aid": 7.2, "stock": "545323", "female": "49.3", 
        "history": [ { "year": 1990, "value": "160736" }, { "year": 2024, "value": "545323" } ], "remittances": 4.2, "labour_participation": "65.0", "evolution": "2.3", 
        "idp_conflict": 409000, "idp_disaster": 5900, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 3, "technical": 23, "total": 36, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102987"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "478", "name": { "fr": "Mauritanie", "en": "Mauritania" }, "flag": "🇲🇷", "retention": 70, "aid": 5.5, "stock": "195937", "female": "43.4", 
        "history": [ { "year": 1990, "value": "111650" }, { "year": 2024, "value": "195937" } ], "remittances": 1.6, "labour_participation": "65.0", "evolution": "4.0", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 34, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103031"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "562", "name": { "fr": "Niger", "en": "Niger" }, "flag": "🇳🇪", "retention": 90, "aid": 9.8, "stock": "449236", "female": "53.5", 
        "history": [ { "year": 1990, "value": "115464" }, { "year": 2024, "value": "449236" } ], "remittances": 3.7, "labour_participation": "65.0", "evolution": "1.7", 
        "idp_conflict": 392000, "idp_disaster": 25000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 3, "technical": 29, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103028"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "566", "name": { "fr": "Nigéria", "en": "Nigeria" }, "flag": "🇳🇬", "retention": 65, "aid": 0.8, "stock": "1403281", "female": "45.5", 
        "history": [ { "year": 1990, "value": "456621" }, { "year": 2024, "value": "1403281" } ], "remittances": 4.0, "labour_participation": "65.0", "evolution": "0.6", 
        "idp_conflict": 3496000, "idp_disaster": 170000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 2, "technical": 32, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103259"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "686", "name": { "fr": "Sénégal", "en": "Senegal" }, "flag": "🇸🇳", "retention": 75, "aid": 4.2, "stock": "281867", "female": "47.0", 
        "history": [ { "year": 1990, "value": "270410" }, { "year": 2024, "value": "281867" } ], "remittances": 10.6, "labour_participation": "65.0", "evolution": "1.6", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 3, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103046"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "694", "name": { "fr": "Sierra Leone", "en": "Sierra Leone" }, "flag": "🇸🇱", "retention": 80, "aid": 8.5, "stock": "49997", "female": "43.4", 
        "history": [ { "year": 1990, "value": "222148" }, { "year": 2024, "value": "49997" } ], "remittances": 4.6, "labour_participation": "65.0", "evolution": "0.6", 
        "idp_conflict": 0, "idp_disaster": 4500, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 2, "technical": 33, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103212"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "768", "name": { "fr": "Togo", "en": "Togo" }, "flag": "🇹🇬", "retention": 85, "aid": 4.5, "stock": "281994", "female": "49.3", 
        "history": [ { "year": 1990, "value": "84844" }, { "year": 2024, "value": "281994" } ], "remittances": 8.7, "labour_participation": "65.0", "evolution": "3.1", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 4, "technical": 15, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103134"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      }
    ],
    "af_central": [
      { 
        "id": "24", "name": { "fr": "Angola", "en": "Angola" }, "flag": "🇦🇴", "retention": 90, "aid": 0.5, "stock": "676507", "female": "49.5", 
        "history": [ { "year": 1990, "value": "33517" }, { "year": 2024, "value": "676507" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "1.8", 
        "idp_conflict": 0, "idp_disaster": 27000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 3, "technical": 30, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102951"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "120", "name": { "fr": "Cameroun", "en": "Cameroon" }, "flag": "🇨🇲", "retention": 85, "aid": 2.1, "stock": "642948", "female": "50.6", 
        "history": [ { "year": 1990, "value": "265967" }, { "year": 2024, "value": "642948" } ], "remittances": 1.6, "labour_participation": "65.0", "evolution": "2.2", 
        "idp_conflict": 954000, "idp_disaster": 50000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 39, "total": 51, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102973"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "140", "name": { "fr": "Centrafrique", "en": "Central African Rep." }, "flag": "🇨🇫", "retention": 95, "aid": 12.5, "stock": "94556", "female": "47.6", 
        "history": [ { "year": 1990, "value": "67234" }, { "year": 2024, "value": "94556" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "1.8", 
        "idp_conflict": 427000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 35, "total": 47, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103002"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "148", "name": { "fr": "Tchad", "en": "Chad" }, "flag": "🇹🇩", "retention": 95, "aid": 5.5, "stock": "1269673", "female": "55.6", 
        "history": [ { "year": 1990, "value": "74342" }, { "year": 2024, "value": "1269673" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "6.3", 
        "idp_conflict": 593000, "idp_disaster": 48000, "refugees_hosted": 1500000, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 3, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103022"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "178", "name": { "fr": "Congo", "en": "Congo" }, "flag": "🇨🇬", "retention": 90, "aid": 2.5, "stock": "385589", "female": "45.5", 
        "history": [ { "year": 1990, "value": "129391" }, { "year": 2024, "value": "385589" } ], "remittances": 4.7, "labour_participation": "65.0", "evolution": "6.3", 
        "idp_conflict": 4276000, "idp_disaster": 630000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 23, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103014"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "180", "name": { "fr": "R.D. Congo", "en": "DR Congo" }, "flag": "🇨🇩", "retention": 95, "aid": 6.5, "stock": "1085090", "female": "51.8", 
        "history": [ { "year": 1990, "value": "754194" }, { "year": 2024, "value": "1085090" } ], "remittances": 4.7, "labour_participation": "65.0", "evolution": "1.0", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 27, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102981"},
        "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "226", "name": { "fr": "Guinée Équatoriale", "en": "Equatorial Guinea" }, "flag": "🇬🇶", "retention": 98, "aid": 0.5, "stock": "248930", "female": "22.9", 
        "history": [ { "year": 1990, "value": "2740" }, { "year": 2024, "value": "248930" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "14.5", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 0, "technical": 6, "total": 14, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103102"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "266", "name": { "fr": "Gabon", "en": "Gabon" }, "flag": "🇬🇦", "retention": 95, "aid": 0.8, "stock": "449746", "female": "35.7", 
        "history": [ { "year": 1990, "value": "128188" }, { "year": 2024, "value": "449746" } ], "remittances": 0.1, "labour_participation": "65.0", "evolution": "18.2", 
        "idp_conflict": 0, "idp_disaster": 1500, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 30, "total": 42, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103008"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "678", "name": { "fr": "Sao Tomé-et-Principe", "en": "Sao Tome and Principe" }, "flag": "🇸🇹", "retention": 80, "aid": 10.5, "stock": "1955", "female": "50.1", 
        "history": [ { "year": 1990, "value": "5582" }, { "year": 2024, "value": "1955" } ], "remittances": 14.2, "labour_participation": "65.0", "evolution": "0.8", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 2, "technical": 13, "total": 25, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103126"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": true, "zlecaf": true },
        ...genericDesc 
      }
    ],
    "af_east": [
      { 
        "id": "108", "name": { "fr": "Burundi", "en": "Burundi" }, "flag": "🇧🇮", "retention": 95, "aid": 15.5, "stock": "387101", "female": "50.7", 
        "history": [ { "year": 1990, "value": "333110" }, { "year": 2024, "value": "387101" } ], "remittances": 5.7, "labour_participation": "65.0", "evolution": "2.6", 
        "idp_conflict": 6800, "idp_disaster": 82000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 21, "total": 31, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102988"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "174", "name": { "fr": "Comores", "en": "Comoros" }, "flag": "🇰🇲", "retention": 40, "aid": 10.2, "stock": "12449", "female": "51.6", 
        "history": [ { "year": 1990, "value": "14079" }, { "year": 2024, "value": "12449" } ], "remittances": 20.8, "labour_participation": "65.0", "evolution": "1.4", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 26, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103322"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "262", "name": { "fr": "Djibouti", "en": "Djibouti" }, "flag": "🇩🇯", "retention": 90, "aid": 8.5, "stock": "125996", "female": "47.5", 
        "history": [ { "year": 1990, "value": "122221" }, { "year": 2024, "value": "125996" } ], "remittances": 1.5, "labour_participation": "65.0", "evolution": "11.2", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 58, "total": 70, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102996"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "232", "name": { "fr": "Érythrée", "en": "Eritrea" }, "flag": "🇪🇷", "retention": 85, "aid": 5.5, "stock": "12512", "female": "43.9", 
        "history": [ { "year": 1990, "value": "11848" }, { "year": 2024, "value": "12512" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "0.3", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 0, "technical": 0, "total": 8, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103290"},
        "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "231", "name": { "fr": "Éthiopie", "en": "Ethiopia" }, "flag": "🇪🇹", "retention": 90, "aid": 3.5, "stock": "1168455", "female": "49.7", 
        "history": [ { "year": 1990, "value": "875325" }, { "year": 2024, "value": "1168455" } ], "remittances": 0.4, "labour_participation": "65.0", "evolution": "0.9", 
        "idp_conflict": 2378000, "idp_disaster": 757000, "refugees_hosted": 521400, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 1, "technical": 13, "total": 23, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102950"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "404", "name": { "fr": "Kenya", "en": "Kenya" }, "flag": "🇰🇪", "retention": 85, "aid": 2.8, "stock": "992536", "female": "49.5", 
        "history": [ { "year": 1990, "value": "298089" }, { "year": 2024, "value": "992536" } ], "remittances": 3.9, "labour_participation": "65.0", "evolution": "1.8", 
        "idp_conflict": 10000, "idp_disaster": 3800, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 7, "governance": 3, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103315"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "450", "name": { "fr": "Madagascar", "en": "Madagascar" }, "flag": "🇲🇬", "retention": 80, "aid": 4.5, "stock": "38625", "female": "43.0", 
        "history": [ { "year": 1990, "value": "23917" }, { "year": 2024, "value": "38625" } ], "remittances": 1.9, "labour_participation": "65.0", "evolution": "0.1", 
        "idp_conflict": 0, "idp_disaster": 70000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 4, "technical": 38, "total": 53, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102956"},
        "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "454", "name": { "fr": "Malawi", "en": "Malawi" }, "flag": "🇲🇼", "retention": 90, "aid": 9.5, "stock": "186719", "female": "51.1", 
        "history": [ { "year": 1990, "value": "1127724" }, { "year": 2024, "value": "186719" } ], "remittances": 1.4, "labour_participation": "65.0", "evolution": "0.8", 
        "idp_conflict": 0, "idp_disaster": 24000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 3, "technical": 19, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103138"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "480", "name": { "fr": "Maurice", "en": "Mauritius" }, "flag": "🇲🇺", "retention": 60, "aid": 0.5, "stock": "29142", "female": "44.6", 
        "history": [ { "year": 1990, "value": "3613" }, { "year": 2024, "value": "29142" } ], "remittances": 2.2, "labour_participation": "65.0", "evolution": "2.3", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 2, "technical": 40, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103139"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "508", "name": { "fr": "Mozambique", "en": "Mozambique" }, "flag": "🇲🇿", "retention": 95, "aid": 10.5, "stock": "353143", "female": "51.2", 
        "history": [ { "year": 1990, "value": "122332" }, { "year": 2024, "value": "353143" } ], "remittances": 1.2, "labour_participation": "65.0", "evolution": "1.1", 
        "idp_conflict": 465000, "idp_disaster": 144000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 3, "technical": 12, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103149"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "646", "name": { "fr": "Rwanda", "en": "Rwanda" }, "flag": "🇷🇼", "retention": 95, "aid": 12.5, "stock": "513316", "female": "49.4", 
        "history": [ { "year": 1990, "value": "160024" }, { "year": 2024, "value": "513316" } ], "remittances": 3.5, "labour_participation": "65.0", "evolution": "3.6", 
        "idp_conflict": 0, "idp_disaster": 81, "refugees_hosted": 0, "avoi": 100, 
        "normlex": {"fundamental": 10, "governance": 3, "technical": 22, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103153"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "690", "name": { "fr": "Seychelles", "en": "Seychelles" }, "flag": "🇸🇨", "retention": 60, "aid": 1.5, "stock": "13261", "female": "30.0", 
        "history": [ { "year": 1990, "value": "3721" }, { "year": 2024, "value": "13261" } ], "remittances": 0.5, "labour_participation": "65.0", "evolution": "12.5", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 100, 
        "normlex": {"fundamental": 9, "governance": 2, "technical": 27, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103310"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "706", "name": { "fr": "Somalie", "en": "Somalia" }, "flag": "🇸🇴", "retention": 95, "aid": 15.5, "stock": "77972", "female": "44.9", 
        "history": [ { "year": 1990, "value": "478294" }, { "year": 2024, "value": "77972" } ], "remittances": 0.0, "labour_participation": "65.0", "evolution": "0.4", 
        "idp_conflict": 3347000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 1, "technical": 17, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103112"},
        "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "728", "name": { "fr": "Soudan du Sud", "en": "South Sudan" }, "flag": "🇸🇸", "retention": 98, "aid": 20.5, "stock": "914001", "female": "49.7", 
        "history": [ { "year": 1990, "value": "652365" }, { "year": 2024, "value": "914001" } ], "remittances": 9.5, "labour_participation": "65.0", "evolution": "8.0", 
        "idp_conflict": 945000, "idp_disaster": 630000, "refugees_hosted": 571100, "avoi": 50, 
        "normlex": {"fundamental": 7, "governance": 0, "technical": 0, "total": 7, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103154"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "729", "name": { "fr": "Soudan", "en": "Sudan" }, "flag": "🇸🇩", "retention": 90, "aid": 5.5, "stock": "2397113", "female": "50.3", 
        "history": [ { "year": 1990, "value": "1402896" }, { "year": 2024, "value": "2397113" } ], "remittances": 2.9, "labour_participation": "65.0", "evolution": "4.8", 
        "idp_conflict": 9117000, "idp_disaster": 0, "refugees_hosted": 635000, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102958"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": false },
        ...genericDesc 
      },
      { 
        "id": "834", "name": { "fr": "Tanzanie", "en": "Tanzania" }, "flag": "🇹🇿", "retention": 90, "aid": 3.5, "stock": "462371", "female": "50.0", 
        "history": [ { "year": 1990, "value": "574025" }, { "year": 2024, "value": "462371" } ], "remittances": 1.6, "labour_participation": "65.0", "evolution": "0.7", 
        "idp_conflict": 0, "idp_disaster": 6300, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 1, "technical": 28, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103136"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "800", "name": { "fr": "Ouganda", "en": "Uganda" }, "flag": "🇺🇬", "retention": 95, "aid": 6.5, "stock": "2057759", "female": "55.0", 
        "history": [ { "year": 1990, "value": "560570" }, { "year": 2024, "value": "2057759" } ], "remittances": 3.1, "labour_participation": "65.0", "evolution": "4.3", 
        "idp_conflict": 2000, "idp_disaster": 20000, "refugees_hosted": 1900000, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 3, "technical": 21, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103324"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "894", "name": { "fr": "Zambie", "en": "Zambia" }, "flag": "🇿🇲", "retention": 90, "aid": 4.5, "stock": "249205", "female": "48.1", 
        "history": [ { "year": 1990, "value": "279463" }, { "year": 2024, "value": "249205" } ], "remittances": 0.9, "labour_participation": "65.0", "evolution": "1.2", 
        "idp_conflict": 0, "idp_disaster": 2300, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 4, "technical": 35, "total": 49, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103233"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "716", "name": { "fr": "Zimbabwe", "en": "Zimbabwe" }, "flag": "🇿🇼", "retention": 85, "aid": 5.5, "stock": "429108", "female": "43.2", 
        "history": [ { "year": 1990, "value": "634621" }, { "year": 2024, "value": "429108" } ], "remittances": 9.2, "labour_participation": "65.0", "evolution": "2.6", 
        "idp_conflict": 0, "idp_disaster": 2200, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 3, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103183"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      }
    ],
    "af_south": [
      { 
        "id": "72", "name": { "fr": "Botswana", "en": "Botswana" }, "flag": "🇧🇼", "retention": 95, "aid": 0.8, "stock": "116402", "female": "43.0", 
        "history": [ { "year": 1990, "value": "27510" }, { "year": 2024, "value": "116402" } ], "remittances": 0.4, "labour_participation": "65.0", "evolution": "4.4", 
        "idp_conflict": 0, "idp_disaster": 7, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 3, "technical": 6, "total": 17, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103184"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "748", "name": { "fr": "Eswatini", "en": "Eswatini" }, "flag": "🇸🇿", "retention": 98, "aid": 5.5, "stock": "33268", "female": "48.5", 
        "history": [ { "year": 1990, "value": "74991" }, { "year": 2024, "value": "33268" } ], "remittances": 1.7, "labour_participation": "65.0", "evolution": "2.7", 
        "idp_conflict": 0, "idp_disaster": 8, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 8, "governance": 2, "technical": 23, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103185"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "426", "name": { "fr": "Lesotho", "en": "Lesotho" }, "flag": "🇱🇸", "retention": 98, "aid": 8.5, "stock": "15039", "female": "45.8", 
        "history": [ { "year": 1990, "value": "8240" }, { "year": 2024, "value": "15039" } ], "remittances": 22.5, "labour_participation": "65.0", "evolution": "0.7", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 11, "governance": 2, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103186"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "516", "name": { "fr": "Namibie", "en": "Namibia" }, "flag": "🇳🇦", "retention": 95, "aid": 1.5, "stock": "116035", "female": "46.0", 
        "history": [ { "year": 1990, "value": "120641" }, { "year": 2024, "value": "116035" } ], "remittances": 0.7, "labour_participation": "65.0", "evolution": "4.3", 
        "idp_conflict": 0, "idp_disaster": 1300, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103187"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      },
      { 
        "id": "710", "name": { "fr": "Afrique du Sud", "en": "South Africa" }, "flag": "🇿🇦", "retention": 95, "aid": 0.5, "stock": "2631100", "female": "41.9", 
        "history": [ { "year": 1990, "value": "1285707" }, { "year": 2024, "value": "2631100" } ], "remittances": 0.2, "labour_participation": "65.0", "evolution": "4.3", 
        "idp_conflict": 0, "idp_disaster": 28000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 9, "governance": 2, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103188"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      }
    ]
  };

  const aggregates = {
    'africa_perspective': { 
      name: { fr: "Afrique (Continentale)", en: "Africa (Continental)" }, flag: "🌍", stock: '28,5 M', female: '47.1', evolution: '1.9', retention: 70, remittances: 6.5, aid: 3.2,
      history: [{ year: 1990, value: '2.5' }, { year: 2000, value: '2.0' }, { year: 2010, value: '1.8' }, { year: 2024, value: '1.9' }],
      distribution: [{ label: {fr: 'Intra-Africain', en: 'Intra-African'}, value: 70, color: 'bg-blue-700' }, { label: {fr: 'Extra-Africain', en: 'Extra-African'}, value: 30, color: 'bg-slate-700' }],
      ...genericDesc
    }
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

  const display = useMemo(() => {
    const country = currentCountries.find(c => c.id === activeSubTab);
    if (country && activeSubTab !== 'perspective') {
      return { 
        name: country.name?.[lang] || country.name?.fr || 'Unknown', flag: country.flag, stock: country.stock, female: country.female, evolution: country.evolution,
        retention: country.retention || 50, remittances: country.remittances || 0, aid: country.aid || 0, history: country.history || [], 
        evo_desc: country.evo_desc?.[lang] || country.evo_desc?.fr || "", origDest: country.origDest?.[lang] || country.origDest?.fr || "", trigger: country.trigger?.[lang] || country.trigger?.fr || "", response: country.response?.[lang] || country.response?.fr || "", impact: country.impact?.[lang] || country.impact?.fr || "",
        idp_conflict: country.idp_conflict || 0, idp_disaster: country.idp_disaster || 0, refugees_hosted: country.refugees_hosted || 0, avoi: country.avoi || null,
        normlex: country.normlex || null,
        au_treaties: country.au_treaties || null,
        isRegion: false
      };
    }
    const fallback = aggregates['africa_perspective'];
    return {
      name: typeof fallback.name === 'object' ? (fallback.name?.[lang] || fallback.name?.fr || 'Unknown') : String(fallback.name || 'Unknown'),
      flag: fallback.flag, stock: fallback.stock, female: fallback.female, evolution: fallback.evolution,
      retention: fallback.retention || 50, remittances: fallback.remittances || 0, aid: fallback.aid || 0, history: fallback.history, distribution: fallback.distribution || null,
      evo_desc: typeof fallback.evo_desc === 'object' ? (fallback.evo_desc?.[lang] || fallback.evo_desc?.fr || "") : (fallback.evo_desc || ""),
      origDest: typeof fallback.origDest === 'object' ? (fallback.origDest?.[lang] || fallback.origDest?.fr || "") : (fallback.origDest || ""),
      trigger: typeof fallback.trigger === 'object' ? (fallback.trigger?.[lang] || fallback.trigger?.fr || "") : (fallback.trigger || ""),
      response: typeof fallback.response === 'object' ? (fallback.response?.[lang] || fallback.response?.fr || "") : (fallback.response || ""),
      impact: typeof fallback.impact === 'object' ? (fallback.impact?.[lang] || fallback.impact?.fr || "") : (fallback.impact || ""),
      idp_conflict: 0, idp_disaster: 0, refugees_hosted: 0, avoi: null, normlex: null, au_treaties: null,
      isRegion: true
    };
  }, [activeSubTab, activeSubRegion, lang, currentCountries]);

  useEffect(() => {
    document.title = `${display.name} | South(s) Mobility DataHub`;
    document.documentElement.lang = lang;
  }, [display, lang]);

  const exportIndicatorsCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,ID,Theme(FR),Theme(EN),Indicator(FR),Indicator(EN),Description(FR),Description(EN)\n";
    indicatorThemes.forEach(t => t.items.forEach(i => {
      csvContent += `${i.id},"${t.theme_fr}","${t.theme_en}","${(i.fr||'').replace(/"/g, '""')}","${(i.en||'').replace(/"/g, '""')}","${(i.desc_fr||"").replace(/"/g, '""')}","${(i.desc_en||"").replace(/"/g, '""')}"\n`;
    }));
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = "souths_indicators_registry.csv"; link.click();
  };

  const exportCountryProfileCSV = () => {
    let csvContent = `data:text/csv;charset=utf-8,Metric,Value\nProfile,"${display.name}"\nStock,"${display.stock}"\nFemale Share %,"${display.female}"\nEvolution,"${display.evolution}"\nOrig/Dest,"${display.origDest}"\nTrigger,"${display.trigger}"\nResponse,"${display.response}"\nImpact,"${display.impact}"\nIDP Conflict,"${display.idp_conflict}"\nIDP Disaster,"${display.idp_disaster}"\n`;
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `Profile_${display.name}.csv`; link.click();
  };

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

      {/* NAVBAR */}
      <nav className="bg-[#0f172a] text-white sticky top-0 z-50 border-b border-slate-800 shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-14 items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-800 p-1.5 rounded-sm shadow-sm"><Globe className="h-4 w-4 text-blue-100" /></div>
            <span className="text-base font-serif font-bold tracking-tight uppercase">{text.title} <span className="text-blue-300 font-sans font-medium lowercase italic">{text.subtitle}</span></span>
          </div>
          <button onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')} className="flex items-center space-x-1 text-[10px] font-bold bg-slate-800 px-3 py-1.5 rounded-sm border border-slate-700 transition hover:bg-blue-900 hover:text-white hover:border-blue-700">
            <Languages className="h-3 w-3" /> <span>{lang.toUpperCase()}</span>
          </button>
        </div>
      </nav>

      {/* HERO HEADER */}
      <header className="bg-[#0f172a] text-white py-14 relative overflow-hidden print:hidden border-b border-blue-900/50">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-[0.02] pointer-events-none"><Globe className="w-[400px] h-[400px]" /></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-block px-3 py-1 rounded-sm bg-blue-900/50 border border-blue-800 text-[10px] font-bold text-blue-200 mb-4 uppercase tracking-widest shadow-sm">Open Data Initiative</div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-4 leading-[1.2] tracking-tight">{text.hero_title}<br/><span className="text-blue-300 italic font-normal">{text.hero_highlight}</span></h1>
          <p className="text-slate-300 max-w-2xl text-base leading-relaxed font-medium">{text.desc}</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 print:hidden space-y-16">

        {/* 1. DÉCONSTRUCTION */}
        <section>
          <div className="flex items-center space-x-3 mb-6"><div className="p-2 bg-rose-50 rounded-sm text-rose-800"><ShieldAlert className="h-5 w-5" /></div><h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">{text.sections.debunk}</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {text.debunk_cards.map((card, idx) => (
              <div 
                key={idx} 
                onClick={() => setExpandedMyth(expandedMyth === idx ? null : idx)}
                className={`bg-white rounded-lg p-5 border transition-all duration-300 flex flex-col cursor-pointer ${expandedMyth === idx ? 'border-blue-600 shadow-lg scale-[1.01]' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'}`}
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest border border-slate-100 px-2 py-0.5 rounded-sm">{text.myth}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${expandedMyth === idx ? 'rotate-180 text-blue-600' : ''}`} />
                  </div>
                  <p className="text-slate-800 font-serif italic text-sm md:text-base leading-snug mb-3">"{card.myth}"</p>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-auto">
                  <span className="text-[9px] font-bold uppercase text-blue-800 tracking-widest bg-blue-50 px-2 py-0.5 rounded-sm">{text.reality}</span>
                  <p className="text-slate-900 font-bold text-base mt-2 mb-2 leading-tight">{card.real}</p>
                  <div className="flex items-center space-x-3">
                     <div className="w-full bg-slate-100 h-1.5 rounded-sm overflow-hidden">
                       <div className={`${card.color} h-full transition-all duration-1000 ease-out`} style={{width: `${card.stat_val}%`}}></div>
                     </div>
                     <span className={`text-xs font-bold ${card.color.replace('bg-', 'text-')}`}>{card.stat_text}</span>
                  </div>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${expandedMyth === idx ? 'max-h-48 opacity-100 mt-3 pt-3 border-t border-slate-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-xs text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. PERSPECTIVE GLOBALE */}
        <section className="bg-[#0f172a] rounded-xl p-8 md:p-10 text-white shadow-xl border border-slate-800 relative overflow-hidden print:bg-white print:border print:text-slate-900 print:shadow-none">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-5 print:hidden"><Globe className="w-96 h-96" /></div>
          <div className="relative z-10 flex items-center space-x-3 mb-8">
            <div className="p-2 bg-blue-900/50 rounded-sm border border-blue-800 text-blue-300 print:bg-slate-100 print:text-blue-800"><Globe className="h-5 w-5" /></div>
            <h2 className="text-xl md:text-2xl font-serif font-bold tracking-tight">{text.sections.global}</h2>
          </div>
          
          <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{text.global_stats.world}</span>
              <span className="text-2xl font-bold text-white print:text-slate-900 block">304 M</span>
              <div className="w-full bg-slate-700 h-1 mt-2 rounded-sm overflow-hidden print:bg-slate-200"><div className="bg-slate-500 h-full w-full"></div></div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">{text.global_stats.europe}</span>
              <span className="text-2xl font-bold text-white print:text-slate-900 block">94 M</span>
              <div className="flex justify-between items-center mt-2"><div className="w-full bg-slate-700 h-1 rounded-sm overflow-hidden mr-2 print:bg-slate-200"><div className="bg-slate-400 h-full" style={{width: '30.9%'}}></div></div><span className="text-[9px] font-bold text-slate-400">30.9%</span></div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">{text.global_stats.asia}</span>
              <span className="text-2xl font-bold text-white print:text-slate-900 block">92 M</span>
              <div className="flex justify-between items-center mt-2"><div className="w-full bg-slate-700 h-1 rounded-sm overflow-hidden mr-2 print:bg-slate-200"><div className="bg-slate-400 h-full" style={{width: '30.2%'}}></div></div><span className="text-[9px] font-bold text-slate-400">30.2%</span></div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">{text.global_stats.na}</span>
              <span className="text-2xl font-bold text-white print:text-slate-900 block">61 M</span>
              <div className="flex justify-between items-center mt-2"><div className="w-full bg-slate-700 h-1 rounded-sm overflow-hidden mr-2 print:bg-slate-200"><div className="bg-slate-400 h-full" style={{width: '20%'}}></div></div><span className="text-[9px] font-bold text-slate-400">20.1%</span></div>
            </div>
            <div className="bg-blue-900/30 p-4 rounded-md border border-blue-700/50 transform hover:scale-105 transition-transform print:bg-blue-50 print:border-blue-200 shadow-md">
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest block mb-1 print:text-blue-800">{text.global_stats.africa}</span>
              <span className="text-2xl font-bold text-blue-200 print:text-blue-900 block">29 M</span>
              <div className="flex justify-between items-center mt-2"><div className="w-full bg-slate-700 h-1 rounded-sm overflow-hidden mr-2 print:bg-blue-200"><div className="bg-blue-500 h-full" style={{width: '9.5%'}}></div></div><span className="text-[9px] font-bold text-blue-300 print:text-blue-800">9.5%</span></div>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-md border border-slate-700/50 print:bg-slate-50 print:border-slate-200">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-1">{text.global_stats.latam}</span>
              <span className="text-2xl font-bold text-white print:text-slate-900 block">17 M</span>
              <div className="flex justify-between items-center mt-2"><div className="w-full bg-slate-700 h-1 rounded-sm overflow-hidden mr-2 print:bg-slate-200"><div className="bg-slate-400 h-full" style={{width: '5.7%'}}></div></div><span className="text-[9px] font-bold text-slate-400">5.7%</span></div>
            </div>
          </div>
          
          {/* Section Carte Afrique */}
          <div className="mt-8 bg-slate-50 p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col items-center print:border-slate-300 print:bg-white">
            <h3 className="text-lg font-serif font-bold text-slate-900 mb-6 uppercase tracking-widest text-center">
              {lang === 'fr' ? "Territoires et Mobilités" : "Territories and Mobilities"}
            </h3>
            <img 
              src="/map_africa.png" 
              alt="Carte de l'Afrique" 
              className="max-w-md w-full h-auto rounded-sm shadow-md border border-slate-200" 
            />
            <p className="text-[10px] text-slate-500 mt-4 italic">
              {lang === 'fr' ? "Représentation cartographique à titre illustratif." : "Cartographic representation for illustrative purposes."}
            </p>
          </div>
          
          <div className="relative z-10 mt-8 flex items-start space-x-3 bg-slate-800/50 p-4 rounded-sm border-l-4 border-blue-500 print:bg-slate-50 print:border-slate-200 print:border-l-blue-700">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5 print:text-blue-700" />
            <p className="text-slate-300 text-sm leading-relaxed print:text-slate-700">{text.global_stats.note}</p>
          </div>
        </section>

        {/* 3. EXPLORATEUR & VUE COMPARATIVE */}
        <section id="explorer">
          <div className="flex items-center space-x-3 mb-6"><div className="p-2 bg-slate-200 rounded-sm text-slate-700"><MapPin className="h-5 w-5" /></div><h2 className="text-xl font-serif font-bold text-slate-900 tracking-tight">{text.sections.explorer}</h2></div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            <div className="w-full md:w-72 bg-[#0f172a] text-white flex flex-col border-r border-slate-800 shrink-0">
              <div className="p-5 border-b border-slate-800 bg-slate-800/30">
                <h4 className="text-blue-300 text-[9px] font-bold uppercase tracking-widest mb-2 flex items-center"><MapIcon className="w-3 h-3 mr-1.5" /> {text.sidebar.subregion}</h4>
                <select value={activeSubRegion} onChange={(e) => { setActiveSubRegion(e.target.value); setActiveSubTab('perspective'); }} className="w-full bg-[#0f172a] border border-slate-700 rounded-sm py-2 px-3 text-xs font-bold text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer appearance-none">
                  <option value="all">{text.all_regions}</option>
                  {Object.keys(countryData).map(regId => (<option key={regId} value={regId}>{text.regions[regId]}</option>))}
                </select>
              </div>
              <div className="p-5 pb-2">
                <div className="relative"><input type="text" placeholder={text.sidebar.search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700 rounded-sm py-2 pl-8 pr-3 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-shadow" /><Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" /></div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar max-h-[400px]">
                <button onClick={() => setActiveSubTab('perspective')} className={`w-full flex items-center p-3 rounded-sm transition-all font-bold text-xs text-left mb-3 border ${activeSubTab === 'perspective' ? 'bg-blue-800 border-blue-700 text-white shadow-md' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><Database className="w-4 h-4 mr-2.5 shrink-0 opacity-80" /><span className="truncate">{activeSubRegion === 'all' ? text.perspectives.continent : text.perspectives.subregion}</span></button>
                {filteredCountries.map((item) => (
                  <button key={item.id} onClick={() => setActiveSubTab(item.id)} className={`w-full flex items-center p-2.5 rounded-sm transition-all text-xs text-left group border ${activeSubTab === item.id ? 'bg-white border-white text-slate-900 font-bold shadow-sm' : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}><span className="text-xl mr-2.5 shrink-0 flag-emoji">{item.flag}</span><span className="truncate">{item.name?.[lang] || item.name?.fr || "Unknown"}</span>{activeSubTab === item.id && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-600" />}</button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 p-6 md:p-10 animate-in fade-in zoom-in-95 duration-500 bg-slate-50">
              <div className="flex items-center space-x-5 mb-10"><span className="text-6xl md:text-7xl shrink-0 flag-emoji border border-slate-200 rounded-sm bg-white p-2 shadow-sm">{display.flag}</span><div><h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 leading-tight tracking-tight">{display.name}</h3><div className="mt-3"><span className="px-3 py-1 bg-white text-blue-800 text-[9px] font-bold uppercase rounded-sm tracking-widest border border-blue-200 shadow-sm">{display.isRegion ? text.badge.regional : text.badge.country}</span></div></div></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm"><div className="flex items-center space-x-1.5 text-slate-500 mb-4 font-bold text-[9px] uppercase tracking-widest"><Users className="h-4 w-4" /> {text.metrics.stock}</div><span className="block text-3xl md:text-4xl font-serif font-bold text-slate-800">{formatNumber(display.stock)}</span></div>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm"><div className="flex items-center space-x-1.5 text-slate-500 mb-4 font-bold text-[9px] uppercase tracking-widest"><HeartPulse className="h-4 w-4" /> {text.metrics.female}</div><span className="block text-3xl md:text-4xl font-serif font-bold text-slate-800">{display.female}%</span></div>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm"><div className="flex items-center space-x-1.5 text-slate-500 mb-4 font-bold text-[9px] uppercase tracking-widest"><BarChart3 className="h-4 w-4" /> {text.metrics.evolution}</div><span className="block text-2xl md:text-3xl font-serif font-bold text-slate-800">{display.evolution}%</span></div>
              </div>

              {display.isRegion && (
                <div className="mt-8 p-6 bg-blue-50/50 rounded-lg border border-blue-100 shadow-sm space-y-3">
                  <h4 className="text-blue-900 font-serif font-bold text-base flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-700" />
                    {text.comparative_view_title}
                  </h4>
                  <p className="text-sm text-blue-950 leading-relaxed">
                    {text.comparative_view_desc}
                  </p>
                </div>
              )}

              <div className="mt-10 p-6 bg-[#0f172a] rounded-lg text-white relative overflow-hidden shadow-md group cursor-pointer border border-slate-800" onClick={() => setShowModal(true)}>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
                  <div className="flex items-center space-x-4"><div className="p-3 bg-blue-900/50 rounded-sm border border-blue-800 group-hover:bg-blue-800 transition-colors">{display.isRegion ? <PieChart className="w-6 h-6 text-blue-300" /> : <TableProperties className="w-6 h-6 text-blue-300" />}</div><div><h4 className="font-serif font-bold text-lg mb-0.5">{display.isRegion ? text.modal.infographic_title : text.modal.raw_data_title}</h4><p className="text-slate-400 text-xs">{lang === 'fr' ? `Consulter l'analyse pour : ${display.name}.` : `View analysis for: ${display.name}.`}</p></div></div>
                  <button className="bg-blue-700 text-white font-bold px-6 py-3 rounded-sm text-xs transition-colors flex items-center shrink-0 shadow-sm group-hover:bg-blue-600">{text.analysis_btn}<ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. RÉFÉRENTIEL (GUIDE MÉTHODOLOGIQUE) */}
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
                        
                        {/* Zone extensible */}
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

        {/* 5. SECTION : ODD (SDGs), GCM & GCR */}
        <section className="bg-white rounded-xl p-8 md:p-10 border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-4 mb-6">
            <div className="p-3 bg-slate-100 rounded-sm border border-slate-200 text-slate-700"><Target className="h-6 w-6" /></div>
            <div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-900 tracking-tight">{text.sdg_section.title}</h2>
              <p className="text-slate-500 text-sm mt-1">{text.sdg_section.subtitle}</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-md mb-6 max-w-xl flex-wrap border border-slate-200">
            <button onClick={() => setActiveSdgzTab('sdgs')} className={`flex-1 min-w-[120px] py-2 px-3 rounded-sm font-bold text-xs transition-all ${activeSdgzTab === 'sdgs' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              ODD / SDGs
            </button>
            <button onClick={() => setActiveSdgzTab('gcm')} className={`flex-1 min-w-[120px] py-2 px-3 rounded-sm font-bold text-xs transition-all ${activeSdgzTab === 'gcm' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              Pacte GCM (23 Obj.)
            </button>
            <button onClick={() => setActiveSdgzTab('gcr')} className={`flex-1 min-w-[120px] py-2 px-3 rounded-sm font-bold text-xs transition-all ${activeSdgzTab === 'gcr' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              Pacte Réfugiés GCR
            </button>
          </div>

          {activeSdgzTab === 'sdgs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {text.sdg_section.sdg_desc}
                </p>
                <a href="https://www.un.org/sustainabledevelopment/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                  <span>{text.sdg_section.link_text}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {text.sdg_section.gcm_desc}
                </p>
                <a href="https://www.iom.int/global-compact-migration" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                  <span>{text.sdg_section.link_text}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-slate-700 text-sm leading-relaxed">
                  {text.sdg_section.gcr_desc}
                </p>
                <a href="https://globalcompactrefugees.org/about-digital-platform/global-compact-refugees" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center space-x-1.5 bg-blue-700 text-white px-4 py-2 rounded-sm text-xs font-bold hover:bg-blue-800 transition shrink-0 shadow-sm">
                  <span>{text.sdg_section.link_text}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
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
        </section>

        {}
        {/* 6 & 7. À PROPOS ET MÉTHODOLOGIE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          <div className="bg-[#0f172a] rounded-xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden flex flex-col justify-between border border-slate-800">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5"><Info className="w-40 h-40" /></div>
            <div>
              <div className="relative z-10 flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif font-bold flex items-center text-white">
                  <Info className="w-5 h-5 mr-2.5 text-blue-400" /> {text.sections.about_title}
                </h2>
              </div>
              <div className="relative z-10 mb-4">
                <p className="text-slate-300 leading-relaxed mb-3 text-sm font-medium">{text.about.p1}</p>
                <p className="text-slate-300 leading-relaxed mb-3 text-sm font-medium">{text.about.p2}</p>
                <div className="mt-4 pt-5 border-t border-slate-700/50">
                  <p className="text-slate-200 leading-relaxed mb-4 text-sm font-medium">{text.about.expanded_p1}</p>
                  <p className="text-slate-200 leading-relaxed text-sm font-medium">{text.about.expanded_p2}</p>
                </div>
              </div>
            </div>

            <div>
              {/* BLOC CONTACT & RÉTROACTION CITOYENNE / INSTITUTIONNELLE */}
              <div className="relative z-10 bg-slate-800/90 p-5 rounded-md border border-slate-700 mt-6 space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300">{text.about.contact_title}</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{text.about.contact_desc}</p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <a 
                    href="mailto:benmokhtary1@gmail.com?subject=South(s)%20Mobility%20DataHub%20-%20Contact" 
                    className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-600 text-white font-bold px-3.5 py-2 rounded-sm text-xs transition-colors shadow-sm"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{lang === 'fr' ? 'Email : benmokhtary1@gmail.com' : 'Email: benmokhtary1@gmail.com'}</span>
                  </a>
                  <a 
                    href="https://www.linkedin.com/in/yassine-b-m" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white font-bold px-3.5 py-2 rounded-sm text-xs border border-slate-600 transition-colors shadow-sm"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-300" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              </div>

              {/* CITATION ACADÉMIQUE */}
              <div className="relative z-10 bg-slate-800/80 p-4 rounded-md border border-slate-700 mt-4">
                <div className="flex items-center space-x-2 mb-1.5"><Quote className="w-3.5 h-3.5 text-blue-400" /><h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{text.about.citation_title}</h4></div>
                <p className="text-xs text-slate-300 font-serif italic border-l-2 border-blue-500 pl-2.5">{text.about.citation_text}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-8 md:p-10 border shadow-sm relative border-slate-200">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-serif font-bold text-slate-900 flex items-center"><BookOpen className="w-5 h-5 mr-2.5 text-blue-700" /> {text.sections.method_title}</h2></div>
            <p className="text-slate-700 text-sm leading-relaxed mb-2">{text.method.summary}</p>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <ul className="space-y-5">
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '1. Sourcing : ' : '1. Sourcing: '}</strong>{text.method.m1}</p></li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '2. Analyse Proportionnelle : ' : '2. Proportional Analysis: '}</strong>{text.method.m2}</p></li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '3. Modélisation Comparative : ' : '3. Comparative Modeling: '}</strong>{text.method.m3}</p></li>
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
            
          </div>
        </section>

      </main>

      {/* --- MODAL DÉTAILLÉ (FICHE PAYS) AVEC RATIFICATIONS UA & OIT --- */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-5 bg-[#0f172a]/90 backdrop-blur-sm animate-in fade-in duration-300 print:bg-white print:p-0 print:absolute print:inset-0 print:block"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-slate-50 rounded-xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col border border-slate-700 print:shadow-none print:border-none print:max-h-none print:rounded-none"
          >
            
            {/* EN-TÊTE DU MODAL */}
            <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:justify-between md:items-center bg-white print:border-b-2 print:border-slate-900 print:pb-4 gap-5 print:break-inside-avoid">
              <div className="flex items-center space-x-5">
                <span className="text-4xl md:text-5xl flag-emoji border border-slate-200 rounded-sm bg-slate-50 p-1 shadow-sm print:border-none">{display.flag}</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 uppercase tracking-tight">{display.name}</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 border border-slate-200 inline-block px-2 py-0.5 rounded-sm">{display.isRegion ? (text.modal.south_view || "") : text.modal.raw_data_title}</p>
                </div>
              </div>
              
              {/* BOUTONS D'ONGLETS */}
              <div className="flex bg-slate-100 p-1 rounded-sm border border-slate-200 print:hidden">
                <button onClick={() => setModalView('demography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'demography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.demo}</button>
                <button onClick={() => setModalView('geography')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'geography' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.geo}</button>
                <button onClick={() => setModalView('economy')} className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all ${modalView === 'economy' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>{text.modal.tabs.econ}</button>
              </div>
              <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 p-2 bg-white hover:bg-slate-50 rounded-sm border border-slate-200 transition-colors print:hidden shadow-sm"><X className="w-4 h-4 text-slate-600" /></button>
            </div>

            {/* CORPS DU MODAL */}
            <div className="p-6 md:p-10 overflow-y-auto space-y-10 print:overflow-visible print:p-0 print:pt-6 bg-slate-50 print:bg-white h-full print:flex print:flex-col print:gap-6 print:space-y-0">
              
              {/* ONGLET 1 : DÉMOGRAPHIE */}
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

              {/* ONGLET 2 : GÉOGRAPHIE & INTÉGRATION */}
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
                      
                      {/* PROTECTION & VULNÉRABILITÉS */}
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

                      {/* INTÉGRATION RÉGIONALE (AVOI) */}
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

              {/* ONGLET 3 : ÉCONOMIE, NORMES OIT ET INSTRUMENTS DE L'UNION AFRICAINE */}
              <div className={`space-y-8 animate-in fade-in duration-500 ${modalView === 'economy' ? 'block' : 'hidden print:block'} print:space-y-4 print:break-inside-avoid`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Landmark className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.econ_title}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "L'apport des diasporas face à l'Assistance Publique au Développement (APD)." : "Diaspora contribution vs. Official Development Assistance (ODA)."}</p>
                  <div className="max-w-2xl"><EconomicComparison remittances={display.remittances} aid={display.aid} lang={lang} /></div>
                  <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:mt-3 print:p-2"><p className="text-slate-700 text-sm print:text-[10px]">{lang === 'fr' ? "Les diasporas injectent massivement du capital directement dans l'économie réelle (familles, santé, éducation), rendant les Suds économiquement résilients sans dépendre exclusivement de la charité internationale." : "Diasporas inject massive capital directly into the real economy, making the Souths economically resilient without depending solely on international charity."}</p></div>
                </div>

                {/* BLOC INSTRUMENTS ET TRAITÉS CLÉS DE L'UNION AFRICAINE */}
                {display.au_treaties && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><FileText className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.au_instruments}</h3>
                    <p className="text-sm text-slate-600 mb-2 print:mb-2">{lang === 'fr' ? "État de ratification des conventions phares de l'OUA/UA en matière d'intégration et de mobilité." : "Ratification status of key OAU/AU conventions on integration and mobility."}</p>
                    <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-blue-700 font-bold hover:underline mb-6 print:hidden">
                      <span>{lang === 'fr' ? "Accéder à la base des traités officiels de l'UA" : "Access Official AU Treaties Database"}</span>
                      <ExternalLink className="w-3 h-3" />
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

                {/* BLOC NORMES OIT (NORMLEX) */}
                {display.normlex && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Scale className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Évaluation Juridique des Droits (Base NORMLEX OIT)" : "Legal Evaluation of Rights (ILO NORMLEX)"}</h3>
                    <p className="text-sm text-slate-600 mb-2 print:mb-3">{lang === 'fr' ? "Ratification des conventions internationales du travail et protection des travailleurs." : "Ratification of international labor standards and worker protection."}</p>
                    {display.normlex.link && (
                      <a href={display.normlex.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-xs text-blue-700 font-bold hover:underline mb-6 print:hidden">
                        <span>{lang === 'fr' ? "Accéder au profil NORMLEX complet" : "Access full NORMLEX profile"}</span>
                        <ExternalLink className="w-3 h-3" />
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

      {}
      {/* FOOTER */}
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
            <p className="mt-3 text-blue-500">© 2026 • Yassine Ben Mokhtar • Initiative Citoyenne</p>
          </div>
        </div>
      </footer>
    </div>
  );
}