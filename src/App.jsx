import React, { useState, useMemo, useEffect } from 'react';
import { 
  Globe, ShieldAlert, TrendingUp, Sun, MapPin, Database, 
  ArrowRight, Languages, Activity, Users, Scale, Leaf, 
  Search, HeartPulse, ChevronRight, ChevronDown, X, BarChart3, GitMerge, 
  Download, Printer, Map as MapIcon, Info, BookOpen, CheckCircle2, 
  PieChart, TableProperties, Landmark, Quote, Unlock, Target, ExternalLink, FileText, Mail
} from 'lucide-react';

const LinkedInIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.49 1.49 0 1 0 0 2.97 1.49 1.49 0 0 0 0-2.97Z"/>
  </svg>
);

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
          <span className="text-amber-700 print:!text-amber-700">{lang === 'fr' ? "Transferts des diasporas (Banque Mondiale, 2024)" : "Remittances (World Bank, 2024)"}</span>
          <span className="text-amber-900 print:!text-amber-900">{remittances}% PIB</span>
        </div>
        <div className="h-2 w-full bg-slate-200 rounded-sm overflow-hidden print:!bg-slate-200">
          <div className="h-full bg-amber-600 rounded-sm transition-all duration-1000 print:!bg-amber-600" style={{width: `${remPct}%`}}></div>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-1.5">
          <span className="text-slate-600 print:!text-slate-500">{lang === 'fr' ? "Aide Internationale - APD (OCDE, 2024)" : "International Aid - ODA (OECD, 2024)"}</span>
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
        causal_chain: "Chaîne de causes systémiques", trigger: "Déclencheur", response: "Réponse Migratory", impact: "Impact Socio-économique",
        data_source: "Sources : UNDESA (2024) / Rapport UA-OIT-OIM-CEA (2021) / IDMC (2025) / UNHCR (2025) / OIT NORMLEX (2025)", export_csv: "Exporter (CSV)", export_pdf: "Rapport (PDF)",
        raw_data_title: "Fiche de Données Brutes", infographic_title: "Infographie : Répartition des Flux",
        idp_title: "Protection & Déplacements Forcés (IDMC/UNHCR 2025)", idp_desc: "L'essentiel de la mobilité contrainte africaine est absorbée à l'intérieur des frontières nationales ou dans les pays limitrophes.",
        idp_conflict: "Déplacés Internes Conflits (IDMC 2025)", idp_disaster: "Déplacés Internes Climat (IDMC 2025)",
        hcr_hosted: "Réfugiés internationaux accueillis (UNHCR 2025)",
        avoi_title: "Intégration Régionale - Indice AVOI (BAD 2024)", avoi_desc: "Score d'ouverture des frontières aux ressortissants africains.",
        au_instruments: "Traités & Conventions Clés de l'Union Africaine (État de ratification 2025)"
      },
      sections: { 
        debunk: "1. Déconstruction Factuelle des Narratifs", 
        global: "2. Perspective Globale des Stocks Migratoires (UNDESA, 2024)", 
        explorer: "3. Explorateur Analytique & Données Consolidees", 
        data: "4. Cadre d'Indicateurs Recommandés", 
        sdg_gcm: "5. Alignement ODD (SDGs 2030) & Pactes Mondiaux (GCM / GCR 2018)",
        about_title: "6. À Propos du Projet & Contact", 
        method_title: "7. Ingénierie & Source des Données" 
      },
      global_stats: {
        world: "Total Mondial (2024)",
        europe: "Europe (2024)",
        asia: "Asie (2024)",
        na: "Amérique du Nord (2024)",
        africa: "Afrique (2024)",
        latam: "Amérique Latine (2024)",
        share: "Part mondiale :",
        note: "Données UNDESA (2024) : L'Afrique ne représente que 9,5% du stock migratoire mondial (29 M), loin derrière l'Europe (94 M) et l'Asie (92 M)."
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
          { num: "Obj. 19", title: "Diasporas", desc: "Créer des conditions propices pour que les diasporas contribuent pleinement au développement durable." },
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
        p1: "South(s) Mobility DataHub est un portail indépendant de recherche et de visualisation Open Data, situé à la jonction de la science des données, de la démographie et de la géopolitique des mobilités.", 
        p2: "Rigueur Empirique & Neutralité : En écartant les caricatures sensationnalistes, ce projet s'appuie sur la consolidation stricte des rapports officiels de l'Union Africaine (CUA), des agences de l'ONU (UNDESA, UNHCR, OIM, OIT) et des institutions financières (Banque Mondiale).",
        expanded_p1: "Actuellement en phase de construction active, le portail fait l'objet de mises à jour régulières et d'enrichissements continus de ses bases de données et de ses indicateurs analytiques.",
        expanded_p2: "À terme, l'objectif est de disposer de l'ensemble des données relatives aux migrations et à la mobilité humaine en Afrique sur une large gamme thématique, puis de répliquer ce modèle pour l'Amérique latine et l'Asie, dans une perspective ancrée dans les Suds (South(s)) et la majorité globale (global majority).",
        citation_title: "Citation Académique & Institutionnelle (Norme APA) :",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub : Analyse empirique des migrations et gouvernance des mobilités africaines. Récupéré de https://southsmobility.org",
        contact_title: "Contact, Remarques & Rétroaction Citoyenne :",
        contact_desc: "Avez-vous identifié une coquille, une donnée à actualiser ou souhaitez-vous proposer une collaboration académique / institutionnelle ? N'hésitez pas à me contacter directement :"
      },
      method: { 
        summary: "Architecture méthodologique fondée sur la consolidation et l'harmonisation de bases de données certifiées :",
        m1: "Extraction & Harmonisation : Traitement croisé des recensements nationaux et des registres de la CUA, OIT, UNHCR, IDMC et UNDESA.", 
        m2: "Analyse Proportionnelle : Normalisation des flux et stocks par rapport à la population globale et active.", 
        m3: "Évaluation Juridique : Recensement des ratifications des traités phares de l'Union Africaine et des conventions NORMLEX de l'OIT.",
        m4: "Open Source & Indépendance : Code source ouvert et souveraineté complète du traitement des données.",
        sources_title: "Accès aux Datasets Originaux, Rapports & Cadres Légaux :",
        s1: "Union Africaine & CUA / OIT / OIM / CEA - 3e Rapport sur les statistiques migratoires de main-d'œuvre (Données 2010-2019 / Publié en 2021)",
        s2: "UNDESA - Nations Unies, Département des Affaires Économiques et Sociales (Stock migratoire mondial, 2024)",
        s3: "UNHCR - Haut Commissariat des Nations Unies pour les Réfugiés (Global Trends Report, 2025)",
        s4: "IDMC - Internal Displacement Monitoring Centre (GRID Report, 2025)",
        s5: "OIM - Organisation Internationale pour les Migrations (World Migration Report, 2024)",
        s6: "OIT NORMLEX - Base de données sur les Normes Internationales du Travail (2025)",
        s7: "Union Africaine - Traités, Conventions et Protocoles de Libre Circulation (2025)",
        s8: "Banque Mondiale - Base de données des transferts de fonds et indicateurs de développement (2024)"
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
        debunk: "1. Factual Deconstruction of Narratives", 
        global: "2. Global Perspective of Migrant Stocks (UNDESA, 2024)", 
        explorer: "3. Analytical Explorer & Consolidated Data", 
        data: "4. Recommended Indicators Framework", 
        sdg_gcm: "5. SDG Alignment (SDGs 2030) & Global Compacts (GCM / GCR 2018)",
        about_title: "6. About the Project & Contact", 
        method_title: "7. Engineering & Data Sourcing" 
      },
      global_stats: {
        world: "Global Total (2024)",
        europe: "Europe (2024)",
        asia: "Asia (2024)",
        na: "North America (2024)",
        africa: "Africa (2024)",
        latam: "Latin America (2024)",
        share: "Global share:",
        note: "UNDESA (2024) Data: Africa accounts for only 9.5% of the global migrant stock (29M), well behind Europe (94M) and Asia (92M)."
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
        { myth: "Climate change will empty Africa towards the North.", real: ">90% of climate displacements are internal.", stat_text: ">90% (2025)", stat_val: 90, color: "bg-cyan-700", desc: "IDMC (2025): Over 90% of people displaced by climate events (droughts, floods) remain within their national or sub-regional borders." },
        { myth: "Coastal African nations are mere transit zones.", real: "Structural transition into long-term destination countries.", stat_text: "Mutation (2024)", stat_val: 65, color: "bg-indigo-700", desc: "Data proves that former 'transit' countries are becoming permanent regional economic poles for migrant workers." },
        { myth: "Economic growth automatically stops emigration.", real: "The transition paradox (Migration Hump).", stat_text: "Catalyst (2024)", stat_val: 80, color: "bg-rose-700", desc: "Empirically proven: initial income growth provides households with the financial capital needed to undertake regular migration projects." },
        { myth: "Migrant workers are a burden on host economies.", real: "Drivers of local employment and value creation.", stat_text: "+ Value (2021)", stat_val: 85, color: "bg-emerald-700", desc: "AU/ILO Report (2021): 27.5% of employed migrants work in agriculture, filling labor shortages and stimulating local trade." }
      ],
      about: { 
        p1: "South(s) Mobility DataHub is an independent data visualization and research portal at the intersection of data science, demography, and mobility geopolitics.", 
        p2: "Empirical Rigor & Neutrality: Bypassing sensationalist narratives, this project strictly consolidates official reports from the African Union (AUC), UN agencies (UNDESA, UNHCR, IOM, ILO), and financial institutions (World Bank).",
        expanded_p1: "Currently under active construction, the portal undergoes regular updates and continuous dataset and indicator expansions.",
        expanded_p2: "Ultimately, the objective is to provide comprehensive data on migration and human mobility across Africa over a wide range of themes, and subsequently replicate this model for Latin America and Asia, within a perspective rooted in the Global South and the global majority.",
        citation_title: "Academic & Institutional Citation (APA format):",
        citation_text: "Ben Mokhtar, Y. (2026). South(s) Mobility DataHub: Empirical analysis of African migration and mobility governance. Retrieved from https://southsmobility.org",
        contact_title: "Contact, Feedback & Citizen Engagement:",
        contact_desc: "Did you spot a typo, a dataset to update, or would you like to propose an academic / institutional collaboration? Feel free to contact me directly:"
      },
      method: { 
        summary: "Methodological architecture based on the consolidation and harmonization of certified open datasets:",
        m1: "Extraction & Harmonization: Cross-referencing national censuses with registries from AUC, ILO, UNHCR, IDMC, and UNDESA.", 
        m2: "Proportional Analysis: Normalizing stock and flow data against active and total population baselines.", 
        m3: "Legal Assessment: Reviewing ratification statuses of key African Union treaties and ILO NORMLEX conventions.",
        m4: "Open Source & Integrity: Open source codebase and full data processing independence.",
        sources_title: "Access Original Datasets, Reports & Legal Frameworks:",
        s1: "African Union & AUC / ILO / IOM / ECA - 3rd Labour Migration Statistics Report in Africa (2010-2019 Data / Published 2021)",
        s2: "UNDESA - United Nations Department of Economic and Social Affairs (International Migrant Stock Data, 2024)",
        s3: "UNHCR - United Nations High Commissioner for Refugees (Global Trends Report, 2025)",
        s4: "IDMC - Internal Displacement Monitoring Centre (GRID Report, 2025)",
        s5: "IOM - International Organization for Migration (World Migration Report, 2024)",
        s6: "ILO NORMLEX - International Labour Standards Database (2025)",
        s7: "African Union - Treaties, Conventions, and Free Movement Protocols (2025)",
        s8: "World Bank - Migration and Remittances Data & Development Indicators (2024)"
      },
      myth: "Premise", reality: "Factual Data",
      footer: { tag: "Data engineering serving a new factual narrative on mobilities.", sources: "Sources: AU / ILO / IOM / ECA (2021) • UN DESA (2024) • UNHCR (2025) • IDMC (2025) • ILO NORMLEX (2025) • World Bank (2024)" },
      analysis_title: "Detailed Dashboard", analysis_btn: "Access detailed report",
      hero_title: "Objectifying mobilities", hero_highlight: "through data science."
    }
  };

  const text = t[lang];

  const genericDesc = {
    evo_desc: { fr: "Proportion migratoirement stable rythmée par la démographie locale.", en: "Migratory proportion structurally stable, driven by local demography." },
    origDest: { fr: "Mobilités majoritairement de proximité et circulaires au sein de l'espace sous-régional (UA 2021).", en: "Predominantly proximity and circular mobilities within the sub-regional space (AU 2021)." },
    trigger: { fr: "Asymétries de développement et chocs climatiques.", en: "Development asymmetries and climate shocks." },
    response: { fr: "Déplacements transfrontaliers de travail et stratégies de survie.", en: "Cross-border labor displacements and survival strategies." },
    impact: { fr: "Résilience économique via les transferts de fonds (Remittances 86,4 Mrd $ - UA 2021).", en: "Economic resilience through remittances ($86.4B - AU 2021)." }
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
        evo_desc: genericDesc.evo_desc,
        origDest: genericDesc.origDest,
        trigger: genericDesc.trigger,
        response: genericDesc.response,
        impact: { fr: "L'Égypte reçoit 31% du total des transferts de fonds captés par l'ensemble du continent africain (Rapport UA 2021).", en: "Egypt receives 31% of total diaspora remittances captured by the entire African continent (AU Report 2021)." }
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
        "id": "566", "name": { "fr": "Nigéria", "en": "Nigeria" }, "flag": "🇳🇬", "retention": 65, "aid": 0.8, "stock": "1403281", "female": "45.5", 
        "history": [ { "year": 1990, "value": "456621" }, { "year": 2024, "value": "1403281" } ], "remittances": 4.0, "labour_participation": "65.0", "evolution": "0.6", 
        "idp_conflict": 3496000, "idp_disaster": 170000, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 2, "technical": 32, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103259"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
        evo_desc: genericDesc.evo_desc,
        origDest: genericDesc.origDest,
        trigger: genericDesc.trigger,
        response: genericDesc.response,
        impact: { fr: "Le Nigéria perçoit 28% de l'ensemble des envois de fonds diasporiques du continent (Rapport UA 2021). De plus, c'est le seul pays échantillonné où les femmes sont majoritaires parmi les travailleurs migrants occupés (52,8%).", en: "Nigeria receives 28% of all continental diaspora remittances (AU Report 2021). Furthermore, it is the only sampled country where women represent the majority of employed migrant workers (52.8%)." }
      },
      { 
        "id": "686", "name": { "fr": "Sénégal", "en": "Senegal" }, "flag": "🇸🇳", "retention": 75, "aid": 4.2, "stock": "281867", "female": "47.0", 
        "history": [ { "year": 1990, "value": "270410" }, { "year": 2024, "value": "281867" } ], "remittances": 10.6, "labour_participation": "65.0", "evolution": "1.6", 
        "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 50, 
        "normlex": {"fundamental": 10, "governance": 3, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103046"},
        "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
        ...genericDesc 
      }
    ]
  };

  const aggregates = {
    'africa_perspective': { 
      name: { fr: "Afrique (Continentale)", en: "Africa (Continental)" }, flag: "🌍", stock: '29 M', female: '47.1', evolution: '1.9', retention: 70, remittances: 6.5, aid: 3.2,
      history: [{ year: 1990, value: '2.5' }, { year: 2000, value: '2.0' }, { year: 2010, value: '1.8' }, { year: 2024, value: '1.9' }],
      distribution: [{ label: {fr: 'Intra-Africain (UA 2021)', en: 'Intra-African (AU 2021)'}, value: 70, color: 'bg-blue-700' }, { label: {fr: 'Extra-Africain', en: 'Extra-African'}, value: 30, color: 'bg-slate-700' }],
      ...genericDesc
    }
  };

  const indicatorThemes = [
    {
      theme_fr: "Intégration & Libre Circulation", theme_en: "Integration & Free Movement", icon: <GitMerge />, color: "text-blue-800",
      items: [
        { 
          id: "1.1", fr: "Taux d'effectivité des protocoles régionaux", en: "Effectiveness of regional free movement protocols", 
          desc_fr: "Mesure de l'application réelle des accords (ex: CEDEAO, ZLECAf 2021) sur le terrain.", desc_en: "Measurement of the actual implementation of agreements (e.g. ECOWAS, AfCFTA 2021).",
          method_fr: "Ratio entre les postes frontières appliquant effectivement l'exemption de visa et le nombre total de postes.", method_en: "Ratio between border posts actually applying visa exemptions and the total number of posts.",
          contrast_fr: "Évalue la capacité de l'État à faciliter l'intégration légitime plutôt que d'axer la mesure sur le refoulement.", contrast_en: "Assesses the State's capacity to facilitate legitimate integration rather than focusing on pushbacks."
        }
      ]
    },
    {
      theme_fr: "Économie Productive & Diasporas", theme_en: "Productive Economy & Diasporas", icon: <TrendingUp />, color: "text-amber-700",
      items: [
        { 
          id: "2.1", fr: "Allocation des transferts et insertion sectorielle", en: "Remittance allocation and sector employment", 
          desc_fr: "Selon le rapport UA (2021), 27,5% des migrants occupés travaillent dans le secteur agricole.", desc_en: "According to the AU report (2021), 27.5% of employed migrants work in agriculture.",
          method_fr: "Enquêtes emploi de l'OIT et données de la Banque Mondiale (86,4 Mrd $ de transferts en 2019).", method_en: "ILO labor surveys and World Bank data ($86.4B remittances in 2019).",
          contrast_fr: "Prouve que les diasporas et travailleurs migrants sont des investisseurs directs de l'économie réelle.", contrast_en: "Proves diasporas and migrant workers are direct investors in the real economy."
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
    let csvContent = "data:text/csv;charset=utf-8,ID,Theme(FR),Theme(EN),Indicator(FR),Indicator(EN)\n";
    indicatorThemes.forEach(t => t.items.forEach(i => {
      csvContent += `${i.id},"${t.theme_fr}","${t.theme_en}","${(i.fr||'').replace(/"/g, '""')}","${(i.en||'').replace(/"/g, '""')}"\n`;
    }));
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = "souths_indicators_registry.csv"; link.click();
  };

  const exportCountryProfileCSV = () => {
    let csvContent = `data:text/csv;charset=utf-8,Metric,Value\nProfile,"${display.name}"\nStock,"${display.stock}"\nFemale Share %,"${display.female}"\nEvolution,"${display.evolution}"\n`;
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

        {/* 4. RÉFÉRENTIEL */}
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

        {/* 5. SECTION ODD / GCM / GCR */}
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
              ODD / SDGs (2030)
            </button>
            <button onClick={() => setActiveSdgzTab('gcm')} className={`flex-1 min-w-[120px] py-2 px-3 rounded-sm font-bold text-xs transition-all ${activeSdgzTab === 'gcm' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              Pacte GCM (2018)
            </button>
            <button onClick={() => setActiveSdgzTab('gcr')} className={`flex-1 min-w-[120px] py-2 px-3 rounded-sm font-bold text-xs transition-all ${activeSdgzTab === 'gcr' ? 'bg-white text-blue-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'}`}>
              Pacte Réfugiés GCR (2018)
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
                    <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Cible ONU (2030)</span>
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

        {/* 6 & 7. À PROPOS, CONTACT ET MÉTHODOLOGIE */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
          <div className="bg-[#0f172a] rounded-xl p-8 md:p-10 text-white shadow-lg relative overflow-hidden flex flex-col justify-between border border-slate-800">
            <div className="relative z-10 flex justify-between items-center mb-6"><h2 className="text-xl font-serif font-bold flex items-center text-white"><Info className="w-5 h-5 mr-2.5 text-blue-400" /> {text.sections.about_title}</h2></div>
            <div className="relative z-10 mb-4">
              <p className="text-slate-300 leading-relaxed mb-3 text-sm">{text.about.p1}</p>
              <p className="text-slate-300 leading-relaxed mb-3 text-sm">{text.about.p2}</p>
              <div className="mt-4 pt-5 border-t border-slate-700/50">
                <p className="text-slate-200 leading-relaxed mb-4 text-sm">{text.about.expanded_p1}</p>
                <p className="text-slate-200 leading-relaxed text-sm">{text.about.expanded_p2}</p>
              </div>
            </div>

            {/* BLOC CONTACT DIRECT */}
            <div className="relative z-10 bg-slate-800/80 p-5 rounded-md border border-slate-700 mt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-blue-300 flex items-center">
                <Mail className="w-4 h-4 mr-2" /> {text.about.contact_title}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">{text.about.contact_desc}</p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a href="mailto:benmokhtary1@gmail.com?subject=South(s)%20Mobility%20DataHub%20-%20Retour%20/%20Contact" className="inline-flex items-center space-x-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-sm transition-colors shadow-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span>benmokhtary1@gmail.com</span>
                </a>
                <a href="https://www.linkedin.com/in/yassine-b-m" target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-2 rounded-sm transition-colors shadow-sm">
                  <LinkedInIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>LinkedIn / yassine-b-m</span>
                </a>
              </div>
            </div>

            <div className="relative z-10 bg-slate-900/90 p-4 rounded-md border border-slate-800 mt-4">
              <div className="flex items-center space-x-2 mb-1.5"><Quote className="w-3.5 h-3.5 text-blue-400" /><h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{text.about.citation_title}</h4></div>
              <p className="text-xs text-slate-300 font-serif italic border-l-2 border-blue-500 pl-2.5">{text.about.citation_text}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-8 md:p-10 border shadow-sm relative border-slate-200">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-serif font-bold text-slate-900 flex items-center"><BookOpen className="w-5 h-5 mr-2.5 text-blue-700" /> {text.sections.method_title}</h2></div>
            <p className="text-slate-700 text-sm leading-relaxed mb-2">{text.method.summary}</p>
            <div className="mt-6 pt-6 border-t border-slate-100">
              <ul className="space-y-4">
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '1. Sourcing : ' : '1. Sourcing: '}</strong>{text.method.m1}</p></li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '2. Analyse Proportionnelle : ' : '2. Proportional Analysis: '}</strong>{text.method.m2}</p></li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '3. Évaluation Juridique : ' : '3. Legal Evaluation: '}</strong>{text.method.m3}</p></li>
                <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-slate-400 mr-3 shrink-0 mt-0.5" /><p className="text-slate-600 text-sm leading-relaxed"><strong className="text-slate-900">{lang === 'fr' ? '4. Open Source & Intégrité : ' : '4. Open Source & Integrity: '}</strong>{text.method.m4}</p></li>
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{text.method.sources_title}</h4>
              <div className="grid grid-cols-1 gap-2.5">
                <a href="https://au.int/en/documents/20211208/3rd-report-labour-migration-statistics-africa-2019" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <FileText className="w-4 h-4 text-blue-700 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s1}</span>
                </a>
                <a href="https://www.un.org/development/desa/pd/data/international-migrant-stock" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <Database className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s2}</span>
                </a>
                <a href="https://www.unhcr.org/refugee-statistics/" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <Users className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s3}</span>
                </a>
                <a href="https://www.internal-displacement.org/database/displacement-data/" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <MapPin className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s4}</span>
                </a>
                <a href="https://www.iom.int/wmr/" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <Globe className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s5}</span>
                </a>
                <a href="https://normlex.ilo.org/" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <Scale className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s6}</span>
                </a>
                <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <Landmark className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s7}</span>
                </a>
                <a href="https://www.worldbank.org/en/topic/migrationremittancesdiasporaissues" target="_blank" rel="noopener noreferrer" className="flex items-center p-2.5 rounded-md bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors group shadow-sm">
                  <TrendingUp className="w-4 h-4 text-slate-500 group-hover:text-blue-600 mr-3 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900">{text.method.s8}</span>
                </a>
              </div>
            </div>
            
          </div>
        </section>

      </main>

      {/* --- MODAL DÉTAILLÉ (FICHE PAYS) --- */}
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
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Users className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Poids Démographique (UNDESA 2024)" : "Demographic Weight (UNDESA 2024)"}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "La population migrante comparée à la population totale nationale." : "Migrant population compared to total national population."}</p>
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
                       <span className="text-[9px] font-bold text-blue-700 uppercase mt-0.5 tracking-widest">{lang === 'fr' ? "Femmes (2024)" : "Women (2024)"}</span>
                     </div>
                   </div>
                   <p className="text-center text-sm text-slate-600 mt-6 max-w-xs leading-relaxed print:mt-3 print:text-[10px]">{lang === 'fr' ? "La migration n'est pas qu'une affaire d'hommes. Elle est structurellement féminisée (UNDESA 2024)." : "Migration is not just men. It is structurally feminized (UNDESA 2024)."}</p>
                </div>
              </div>

              {/* ONGLET 2 : GÉOGRAPHIE & INTÉGRATION */}
              <div className={`grid-cols-1 lg:grid-cols-5 gap-8 animate-in fade-in duration-500 ${modalView === 'geography' ? 'grid' : 'hidden print:grid'} print:gap-4 print:mb-6`}>
                
                <div className="lg:col-span-2 bg-[#0f172a] rounded-lg p-7 text-white shadow-md flex flex-col justify-center items-center print:bg-white print:text-slate-900 print:border print:border-slate-200 print:p-4 print:shadow-none">
                  <h3 className="font-serif font-bold text-white print:text-slate-900 mb-6 flex items-center text-lg w-full print:mb-3"><Globe className="w-5 h-5 mr-2.5 text-blue-400 print:w-4 print:h-4" /> {text.modal.retention_title}</h3>
                  <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-inner border border-slate-700 print:shadow-inner print:w-24 print:h-24 print:border-slate-200" style={{ background: `conic-gradient(#3b82f6 ${display.retention}%, ${display.isRegion ? '#1e293b' : '#1e293b'} 0)` }}>
                    <div className="absolute inset-4 bg-[#0f172a] print:bg-white rounded-full flex flex-col items-center justify-center border border-slate-800 print:border-slate-100">
                      <span className="text-3xl font-serif font-bold text-white print:text-slate-900 print:text-xl">{display.retention}%</span>
                      <span className="text-[9px] font-bold text-blue-400 uppercase mt-0.5 tracking-widest text-center px-2">{lang === 'fr' ? "Restent dans la région (2021)" : "Stay in region (2021)"}</span>
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
                              <span className="text-slate-600 print:!text-slate-600">Score BAD (2024)</span>
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

              {/* ONGLET 3 : ÉCONOMIE & TRAITÉS */}
              <div className={`space-y-8 animate-in fade-in duration-500 ${modalView === 'economy' ? 'block' : 'hidden print:block'} print:space-y-4 print:break-inside-avoid`}>
                <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                  <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Landmark className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.econ_title}</h3>
                  <p className="text-sm text-slate-600 mb-6 print:mb-3">{lang === 'fr' ? "L'apport des diasporas (Banque Mondiale, 2024) face à l'Assistance Publique au Développement (OCDE, 2024)." : "Diaspora contribution (World Bank, 2024) vs Official Development Assistance (OECD, 2024)."}</p>
                  <div className="max-w-2xl"><EconomicComparison remittances={display.remittances} aid={display.aid} lang={lang} /></div>
                  <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-200 print:mt-3 print:p-2"><p className="text-slate-700 text-sm print:text-[10px]">{lang === 'fr' ? "Les diasporas injectent massivement du capital directement dans l'économie réelle (familles, santé, éducation), rendant les Suds économiquement résilients sans dépendre exclusivement de la charité internationale." : "Diasporas inject massive capital directly into the real economy, making the Souths economically resilient without depending solely on international charity."}</p></div>
                </div>

                {display.au_treaties && (
                  <div className="bg-white p-7 rounded-lg border border-slate-200 shadow-sm print:p-4">
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><FileText className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {text.modal.au_instruments}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "État de ratification des conventions phares de l'OUA/UA en matière d'intégration et de mobilité (Mise à jour 2025)." : "Ratification status of key OAU/AU conventions on integration and mobility (2025 Update)."}</p>
                    <a href="https://au.int/en/treaties" target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] text-blue-700 font-bold hover:underline mb-6 print:hidden">
                      {lang === 'fr' ? "→ Consulter la base officielle des traités de l'UA" : "→ View Official AU Treaties Database"}
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
                    <h3 className="font-serif font-bold text-slate-900 mb-1.5 flex items-center text-lg"><Scale className="w-5 h-5 mr-2.5 text-slate-400 print:w-4 print:h-4" /> {lang === 'fr' ? "Évaluation Juridique des Droits (Base NORMLEX OIT, 2025)" : "Legal Evaluation of Rights (ILO NORMLEX, 2025)"}</h3>
                    <p className="text-sm text-slate-600 mb-4 print:mb-3">{lang === 'fr' ? "Ratification des conventions internationales du travail et protection des travailleurs." : "Ratification of international labor standards and worker protection."}</p>
                    {display.normlex.link && (
                      <a href={display.normlex.link} target="_blank" rel="noopener noreferrer" className="inline-block text-[10px] text-blue-700 font-bold hover:underline mb-6 print:hidden">
                        {lang === 'fr' ? "→ Consulter le profil national NORMLEX OIT" : "→ View NORMLEX National Profile"}
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
          <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 max-w-lg text-center md:text-right leading-relaxed">
            <p>{text.footer.sources}</p>
            <p className="mt-3 text-blue-400">© 2026 • Yassine Ben Mokhtar • Initiative Citoyenne & Recherche Indépendante</p>
          </div>
        </div>
      </footer>
    </div>
  );
}