// Glossaire. Regle de definition : l'instrument africain fait reference pour
// les notions juridiques ; la definition operatoire d'UN DESA n'intervient que
// pour les agregats statistiques.

import { Globe, Users, ShieldAlert, MapPin, Briefcase, Brain, Landmark } from 'lucide-react';

export const glossaryData = [
  {
    category: { fr: "Typologie des Mobilités", en: "Mobility Typology" },
    icon: Globe,
    terms: [
      {
        term: "Migration",
        en_term: "Migration",
        fr: "Le mouvement d'une personne ou d'un groupe de personnes d'une unité géographique à une autre à travers une frontière administrative ou politique, avec l'intention de s'installer indéfiniment ou temporairement dans un lieu autre que son lieu d'origine (Statut de l'OAM).",
        en: "The movement of a person or group of persons from one geographical unit to another across an administrative or political border, with the intention of settling indefinitely or temporarily in a place other than their place of origin (AMO Statute).",
        source: { fr: "Statut de l'Observatoire africain des migrations (UA)", en: "Statute of the African Migration Observatory (AU)", url: "https://amo.au.int/en" }
      },
      {
        term: "Migration internationale",
        en_term: "International Migration",
        fr: "Mouvement d'individus à travers des frontières étatiques internationalement reconnues avec l'intention d'établir une résidence. À des fins statistiques, l'ONU (UNDESA) et l'OIM définissent un migrant international comme une personne qui change de pays de résidence habituelle pour une période d'au moins 12 mois.",
        en: "Movement of individuals across internationally recognized state borders with the intention of establishing residence. For statistical purposes, the UN (UNDESA) and IOM define an international migrant as a person who moves to a country other than their usual residence for at least 12 months.",
        source: { fr: "UN DESA — définition opératoire (résidence habituelle, 12 mois)", en: "UN DESA — operational definition (usual residence, 12 months)" }
      },
      {
        term: "Migration interne",
        en_term: "Internal Migration",
        fr: "Mouvement de personnes à l'intérieur d'un État impliquant l'établissement d'une nouvelle résidence temporaire ou permanente (ex: rural vers urbain). C'est la forme de migration la plus courante (OIM).",
        en: "Movement of people within a State involving the establishment of a new temporary or permanent residence (e.g., rural-to-urban). It is the most common form of migration (IOM).",
        source: { fr: "OIM — Glossaire de la migration", en: "IOM — Glossary on Migration" }
      },
      {
        term: "Migration de travail",
        en_term: "Labor Migration",
        fr: "Mouvement d'individus de leur pays d'origine vers un autre pays à des fins d'emploi. L'OIT et le MPFA (2018-2030) soulignent qu'elle peut générer un « triple gain » (pour le pays d'origine, de destination et le migrant) si elle est bien gouvernée.",
        en: "Movement of individuals from their home country to another country for the purpose of employment. The ILO and MPFA (2018-2030) emphasize that it can create a 'triple win' scenario if well-governed."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Migration circulaire",
        en_term: "Circular Migration",
        fr: "Mouvement temporaire et répété d'individus entre leur pays d'origine et un ou plusieurs pays d'accueil, souvent à des fins économiques, permettant le maintien de liens forts avec les communautés d'origine (OIM).",
        en: "Temporary and repeated movement of individuals between their country of origin and one or more host countries, typically for economic purposes, allowing the maintenance of strong links with home communities (IOM).",
        source: { fr: "OIM — Glossaire de la migration", en: "IOM — Glossary on Migration" }
      },
      {
        term: "Migration saisonnière",
        en_term: "Seasonal Migration (Labor)",
        fr: "Déplacement temporaire lié aux fluctuations saisonnières de secteurs spécifiques (agriculture, tourisme). En Afrique, c'est une stratégie de subsistance traditionnelle facilitée par des protocoles régionaux comme celui de la CEDEAO.",
        en: "Temporary movement linked to seasonal fluctuations in specific industries (agriculture, tourism). In Africa, it is a traditional livelihood strategy facilitated by regional protocols like ECOWAS.",
        source: { fr: "Protocole de la CEDEAO sur la libre circulation", en: "ECOWAS Protocol on Free Movement" }
      },
      {
        term: "Mobilité induite par le climat",
        en_term: "Climate-Induced Mobility",
        fr: "Mouvement (interne ou transfrontalier, volontaire ou forcé) déclenché par des changements climatiques soudains (inondations) ou progressifs (sécheresse). Bien que le terme « réfugié climatique » n'ait pas d'existence légale sous la Convention de 1951, ces populations nécessitent une protection (HCR, Déclaration de Kampala 2022).",
        en: "Movement (internal or cross-border, voluntary or forced) driven by sudden (floods) or progressive (drought) climate changes. While the term 'climate refugee' has no legal standing under the 1951 Convention, these populations require protection (UNHCR, Kampala Declaration 2022).",
        source: { fr: "HCR ; Déclaration ministérielle de Kampala sur migrations, environnement et changement climatique (2022)", en: "UNHCR; Kampala Ministerial Declaration on Migration, Environment and Climate Change (2022)", url: "https://au.int/" }
      },
      {
        term: "Migration régulière",
        en_term: "Regular Migration",
        fr: "Mouvement s'effectuant en conformité avec les lois et règlements des pays d'origine, de transit et de destination (OIM). Le Pacte Mondial (GCM) encourage l'expansion des voies régulières pour réduire les vulnérabilités.",
        en: "Movement that occurs in compliance with the laws and regulations of sending, transit, and receiving states (IOM). The Global Compact (GCM) encourages expanding regular pathways to reduce vulnerabilities.",
        source: { fr: "Pacte mondial pour les migrations (GCM, 2018)", en: "Global Compact for Migration (GCM, 2018)" }
      },
      {
        term: "Migration irrégulière",
        en_term: "Irregular Migration",
        fr: "Mouvement de personnes s'opérant en dehors des lois, règlements ou accords internationaux régissant l'entrée ou la sortie (OIM). Cela inclut le franchissement non autorisé des frontières ou le dépassement de la durée de validité d'un visa (overstaying).",
        en: "Movement of persons that takes place outside the laws, regulations, or international agreements governing entry or exit (IOM). This includes unauthorized border crossings or visa overstaying."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Dépassement de séjour (Overstaying)",
        en_term: "Overstaying",
        fr: "Fait de rester dans un pays au-delà de la période autorisée par un visa ou un permis. C'est l'une des formes les plus courantes de migration irrégulière, souvent liée à des lenteurs administratives ou à l'absence de voies de régularisation claires.",
        en: "Remaining in a country beyond the authorized period granted by a visa or permit. It is one of the most common forms of irregular migration, often linked to administrative delays or lack of clear regularization pathways."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      { 
        term: "Nomadisme & Pastoralisme", 
        en_term: "Nomadism & Mobile Pastoralism", 
        fr: "Forme traditionnelle et adaptative de mobilité où les communautés se déplacent pour assurer leurs moyens de subsistance, étroitement liée à la gestion du bétail et aux variations climatiques. Le MPFA souligne la nécessité de sécuriser cette mobilité vitale, souvent menacée par le changement climatique et l'expansion agricole sédentaire.", 
        en: "Traditional and adaptive form of mobility where communities move to sustain their livelihoods, closely tied to livestock management and climatic variations. The MPFA highlights the need to secure this vital mobility, often threatened by climate change and sedentary agricultural expansion." 
      ,
        source: "Union africaine — Cadre de politique pour le pastoralisme en Afrique (2010)"
      },
    ]
  },
  {
    category: { fr: "Personnes & Statuts Juridiques", en: "People & Legal Statuses" },
    icon: Users,
    terms: [
      {
        term: "Migrant international",
        en_term: "International Migrant",
        fr: "Toute personne résidant dans un pays autre que son pays de naissance ou de nationalité, indépendamment de son statut légal ou du motif de son déplacement (UN DESA).",
        en: "Any person residing in a country other than their country of birth or nationality, regardless of their legal status or the reason for their movement (UN DESA).",
        source: { fr: "UN DESA", en: "UN DESA" }
      },
      {
        term: "Réfugié",
        en_term: "Refugee",
        fr: "La Convention de l'OUA (1969) définit le réfugié plus largement que celle de Genève (1951). À la crainte de persécution individuelle, elle ajoute l'agression extérieure, l'occupation et les événements troublant gravement l'ordre public.",
        en: "The OAU Convention (1969) defines a refugee more broadly than the Geneva Convention (1951). It covers anyone compelled to flee by individual persecution, and equally by external aggression, occupation, or events seriously disturbing public order.",
        source: { fr: "Convention de l'OUA (1969), art. I(2) — définition de référence de la plateforme", en: "OAU Convention (1969), Art. I(2) — the platform's reference definition", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Demandeur d'asile",
        en_term: "Asylum Seeker",
        fr: "Individu ayant quitté son pays d'origine et formellement demandé une protection internationale, mais dont la demande de statut de réfugié n'a pas encore été statuée (HCR). Contrairement au réfugié, son statut juridique est en cours d'évaluation.",
        en: "An individual who has left their country of origin and formally applied for international protection, but whose claim for refugee status has not yet been determined (UNHCR). Unlike a refugee, their legal status is pending assessment.",
        source: { fr: "HCR", en: "UNHCR" }
      },
      {
        term: "Personne déplacée interne (PDI)",
        en_term: "Internally Displaced Person (IDP)",
        fr: "Selon la Convention de Kampala (2009, Art. 1) : personne ou groupe forcé de fuir son foyer (conflit, violences, catastrophes) sans avoir franchi de frontière internationale. Ne relève donc pas des statistiques de migration internationale.",
        en: "Under the Kampala Convention (2009, Art. 1): persons or groups forced to flee their homes (conflict, violence, disasters) without crossing an internationally recognized State border. They are not counted in international migration statistics.",
        source: { fr: "Convention de Kampala (2009), art. 1", en: "Kampala Convention (2009), Art. 1", url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" }
      },
      {
        term: "Apatride",
        en_term: "Stateless Person",
        fr: "Personne qu'aucun État ne considère comme son ressortissant par l'application de sa législation (Convention de 1954). Cette situation prive l'individu de l'accès aux droits fondamentaux, à l'identité légale et aux services de base.",
        en: "A person who is not considered as a national by any State under the operation of its law (1954 Convention). This condition deprives individuals of access to fundamental rights, legal identity, and basic services.",
        source: { fr: "Convention de 1954 relative au statut des apatrides", en: "1954 Convention relating to the Status of Stateless Persons" }
      },
      {
        term: "Mineur non accompagné",
        en_term: "Unaccompanied Migrant Minor",
        fr: "Enfant (moins de 18 ans) séparé de ses parents ou de son tuteur légal lors d'un mouvement migratoire. L'approche juridique (Charte africaine des droits et du bien-être de l'enfant) exige que « l'intérêt supérieur de l'enfant » prime sur toute décision migratoire.",
        en: "A child (under 18) separated from both parents and legally responsible caregivers during a migratory movement. The legal approach (African Charter on the Rights and Welfare of the Child) requires that the 'best interests of the child' be the primary consideration.",
        source: { fr: "Charte africaine des droits et du bien-être de l'enfant ; Convention relative aux droits de l'enfant", en: "African Charter on the Rights and Welfare of the Child; Convention on the Rights of the Child", url: "https://au.int/" }
      },
      {
        term: "Travailleur transfrontalier",
        en_term: "Cross-Border Worker",
        fr: "Individu maintenant sa résidence principale dans un pays tout en se rendant régulièrement dans un autre pour y travailler. Une pratique courante en Afrique, facilitée par les zones de libre circulation des CER (CEDEAO, CAE).",
        en: "An individual maintaining their primary residence in one country while regularly traveling to another for employment. A common practice in Africa, facilitated by REC free movement zones (ECOWAS, EAC).",
        source: { fr: "Protocoles de libre circulation des CER (CEDEAO, CAE)", en: "REC free movement protocols (ECOWAS, EAC)" }
      },
      {
        term: "Survivant de la traite",
        en_term: "Survivor of Human Trafficking",
        fr: "Personne ayant subi une exploitation (travail forcé, exploitation sexuelle) via le recrutement ou le transfert par la menace, la force ou la tromperie (Protocole de Palerme). Le terme « survivant » (plutôt que victime) reconnaît l'agentivité de l'individu dans sa reconstruction.",
        en: "A person who has experienced exploitation (forced labor, sexual exploitation) through recruitment or transfer by means of threat, force, or deception (Palermo Protocol). The term 'survivor' (rather than victim) acknowledges the individual's agency in recovery."
      ,
        source: "Protocole de Palerme (2000), art. 3 — ONUDC"
      }
    ]
  },
  {
    category: { fr: "Frontières, Droits & Protection", en: "Borders, Rights & Protection" },
    icon: ShieldAlert,
    terms: [
      {
        term: "Asile (droit d')",
        en_term: "Asylum (right to)",
        fr: "Le droit de chercher asile et de bénéficier de l'asile en d'autres pays, énoncé à l'article 14 de la Déclaration universelle des droits de l'homme. En Afrique, la Convention de l'OUA de 1969 va plus loin. Son article II engage les États membres à faire « tout ce qui est en leur pouvoir » pour recevoir les réfugiés et assurer leur installation. Il pose aussi l'octroi de l'asile comme un acte pacifique et humanitaire, qu'aucun État ne peut tenir pour inamical.",
        en: "The right to seek and to enjoy asylum in other countries, set out in Article 14 of the Universal Declaration of Human Rights. In Africa the 1969 OAU Convention goes further than recognising a right to seek. Its Article II commits member states to use \"their best endeavours\" to receive refugees and secure their settlement. It also establishes that granting asylum is a peaceful and humanitarian act, which no other state may regard as unfriendly.",
        source: { fr: "Convention de l'OUA (1969), art. II ; DUDH, art. 14", en: "OAU Convention (1969), Art. II; UDHR, Art. 14", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" },
        stakes: { fr: "Qualifier l'asile d'acte « pacifique et humanitaire » désamorce l'argument diplomatique du pays d'origine qui reprocherait à son voisin d'accueillir ses opposants. C'est une clause de protection des États d'accueil autant que des personnes.", en: "Framing asylum as a \"peaceful and humanitarian act\" defuses the diplomatic argument of an origin state accusing its neighbour of harbouring its opponents. It protects host states as much as people." }
      },
      {
        term: "Reconnaissance prima facie",
        en_term: "Prima facie recognition",
        fr: "Reconnaissance du statut de réfugié fondée sur des circonstances objectives et manifestes dans le pays d'origine, sans examen individuel du dossier. Elle s'applique typiquement aux arrivées massives, où la détermination individuelle serait impraticable. Bien que peu codifiée, c'est la voie par laquelle la majorité des réfugiés du monde sont reconnus. C'est aussi la pratique dominante en Afrique, où la définition élargie de la Convention de l'OUA s'y prête directement.",
        en: "Recognition of refugee status based on readily apparent, objective circumstances in the country of origin, without individual examination. It typically applies to large-scale arrivals where individual determination would be impracticable. Though thinly codified, it is the route by which most of the world's refugees are recognised — and the dominant practice in Africa, where the OAU Convention's broadened definition lends itself directly to it.",
        source: { fr: "HCR, Principes directeurs sur la protection internationale n° 11 (2015)", en: "UNHCR, Guidelines on International Protection No. 11 (2015)", url: "https://www.unhcr.org/media/guidelines-international-protection-no-11-prima-facie-recognition-refugee-status-5-june-2015" },
        stakes: { fr: "Une reconnaissance de groupe donne un statut immédiat sans file d'attente administrative. La basculer en examen individuel — comme certains États le font sous pression budgétaire ou politique — laisse des dizaines de milliers de personnes sans statut pendant des années, sans qu'aucun texte n'ait changé.", en: "Group recognition confers immediate status with no administrative queue. Switching to individual examination — as some states do under budgetary or political pressure — leaves tens of thousands without status for years, with no text having changed." }
      },
      {
        term: "Détermination du statut de réfugié (DSR)",
        en_term: "Refugee Status Determination (RSD)",
        fr: "Procédure, administrative ou judiciaire, par laquelle un État ou le HCR établit si une personne relève de la définition du réfugié. En Afrique, elle est conduite tantôt par une commission nationale d'éligibilité, tantôt par le HCR agissant sous mandat lorsque l'État n'a pas encore d'appareil dédié. Cette configuration déplace vers une organisation internationale une décision de souveraineté.",
        en: "The administrative or judicial procedure by which a state or UNHCR establishes whether a person falls within the refugee definition. In Africa it is conducted sometimes by a national eligibility commission, sometimes by UNHCR acting under its mandate where the state has no dedicated apparatus. That configuration shifts a sovereign decision to an international organisation.",
        source: { fr: "HCR ; Convention de l'OUA (1969)", en: "UNHCR; OAU Convention (1969)", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Déplacement prolongé",
        en_term: "Protracted displacement",
        fr: "Situation dans laquelle des personnes déplacées se trouvent durablement sans solution — ni retour, ni intégration locale, ni réinstallation — souvent pendant des années voire des décennies. La notion déplace le regard de l'urgence vers la durée : elle décrit un régime d'attente institutionnalisé, où provisoire veut dire des années.",
        en: "A situation in which displaced people remain durably without a solution — no return, no local integration, no resettlement — often for years or decades. The notion shifts attention from emergency to duration: it describes an institutionalised regime of waiting, where temporary means years.",
        source: { fr: "HCR, Global Trends", en: "UNHCR, Global Trends", url: "https://www.unhcr.org/global-trends" },
        stakes: { fr: "Tant qu'une situation est nommée « urgence », elle appelle des financements humanitaires courts et renouvelables. La nommer « prolongée » ouvre au contraire les instruments de développement — mais suppose de reconnaître une présence durable, ce que les États d'accueil hésitent souvent à faire.", en: "As long as a situation is named an \"emergency\", it draws short, renewable humanitarian funding. Naming it \"protracted\" opens development instruments instead — but requires acknowledging a lasting presence, which host states are often reluctant to do." }
      },
      {
        term: "Externalisation des frontières",
        en_term: "Border externalisation",
        fr: "Ensemble des dispositifs par lesquels un État reporte le contrôle de ses frontières au-delà de son territoire. Financement et équipement de forces de sécurité tierces, agents de liaison, campagnes de dissuasion, conditionnement de l'aide à la coopération migratoire. Le contrôle s'exerce ainsi loin du lieu où le droit d'asile pourrait être invoqué.",
        en: "The set of arrangements by which a state pushes control of its borders beyond its own territory: funding and equipping third-country security forces, liaison officers, deterrence campaigns, tying aid to migration cooperation. Control is thereby exercised far from where a right to asylum could be invoked.",
        source: { fr: "Notion analytique consolidée dans la littérature sur les régimes de mobilité ; voir Achiume (2019) et Bakewell (2008) en Bibliothèque", en: "Analytical notion consolidated in the mobility-regimes literature; see Achiume (2019) and Bakewell (2008) in the Library" },
        stakes: { fr: "Le déplacement du contrôle déplace aussi la responsabilité juridique : une personne interceptée avant d'atteindre un territoire ne peut y demander l'asile, et l'État qui a financé l'interception n'est pas celui qui la refuse. La responsabilité se dilue exactement là où elle serait exigible (Ben Mokhtar, 2026).", en: "Displacing control also displaces legal responsibility: a person intercepted before reaching a territory cannot claim asylum there, and the state that funded the interception is not the one refusing it. Accountability dissolves precisely where it would be enforceable (Ben Mokhtar, 2026)." }
      },
      {
        term: "Accord de réadmission",
        en_term: "Readmission agreement",
        fr: "Instrument bilatéral ou régional par lequel un État s'engage à reprendre ses ressortissants — et parfois des ressortissants de pays tiers ayant transité par son territoire — éloignés depuis un autre État. Souvent négocié en contrepartie de facilités de visa, d'aide au développement ou de coopération commerciale.",
        en: "A bilateral or regional instrument by which a state undertakes to take back its nationals — and sometimes third-country nationals who transited its territory — removed from another state. Often negotiated in exchange for visa facilitation, development aid or trade cooperation.",
        source: { fr: "Pratique conventionnelle bilatérale ; voir Adamson & Tsourapas (2019) sur la diplomatie migratoire, en Bibliothèque", en: "Bilateral treaty practice; see Adamson & Tsourapas (2019) on migration diplomacy, in the Library" },
        stakes: { fr: "La clause « ressortissants de pays tiers » transforme un État de transit en dépositaire de personnes qui n'en sont pas originaires. C'est le point où un accord technique produit des effets de séjour durables, sans qu'aucun droit de séjour n'ait été accordé.", en: "The \"third-country nationals\" clause turns a transit state into the custodian of people who are not from it. That is where a technical agreement produces lasting residence effects without any residence right having been granted." }
      },
      {
        term: "Visa (régime de)",
        en_term: "Visa (regime)",
        fr: "Autorisation préalable d'entrée délivrée par un État. Trois régimes structurent les mobilités intra-africaines : le visa requis avant le départ, le visa à l'arrivée (délivré au poste-frontière) et l'exemption. La distinction est de nature : le visa préalable transfère la décision au consulat du pays de départ, c'est-à-dire hors de portée d'un recours dans le pays de destination.",
        en: "A prior entry authorisation issued by a state. Three regimes structure intra-African mobility: visa required before departure, visa on arrival (issued at the border post), and exemption. The distinction is one of kind. A prior visa moves the decision to the consulate in the country of departure, beyond the reach of any appeal in the destination country.",
        source: { fr: "BAD & CUA, Africa Visa Openness Report", en: "AfDB & AUC, Africa Visa Openness Report", url: "https://www.visaopenness.org/" }
      },
      {
        term: "Gestion intégrée des frontières",
        en_term: "Integrated Border Management",
        fr: "Administration globale et coordonnée visant à réguler les flux transfrontaliers, harmonisant les contrôles d'immigration, les douanes et la sécurité, tout en identifiant les personnes vulnérables nécessitant une protection (OIM, 2019).",
        en: "Comprehensive and coordinated administration to regulate cross-border flows, harmonizing immigration, customs, and security controls, while identifying vulnerable persons requiring protection (IOM, 2019).",
        source: { fr: "OIM (2019)", en: "IOM (2019)" }
      },
      {
        term: "Principe de non-refoulement",
        en_term: "Non-Refoulement Principle",
        fr: "Norme impérative (jus cogens) du droit international interdisant à un État d'expulser ou de renvoyer un individu vers un territoire où sa vie ou sa liberté seraient menacées (Art. 33 de la Convention de Genève 1951 ; Art. II(3) de la Convention de l'OUA 1969).",
        en: "Peremptory norm (jus cogens) of international law prohibiting a state from expelling or returning an individual to a territory where their life or freedom would be threatened (Art. 33 of the 1951 Geneva Convention; Art. II(3) of the 1969 OAU Convention).",
        source: { fr: "Convention de Genève (1951), art. 33 ; Convention de l'OUA (1969), art. II(3)", en: "Geneva Convention (1951), Art. 33; OAU Convention (1969), Art. II(3)", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Trafic illicite de migrants",
        en_term: "Smuggling of Migrants",
        fr: "Fait d'assurer, afin d'en tirer un avantage financier, l'entrée illégale d'une personne dans un État (Protocole de Palerme, 2000). Contrairement à la traite, le trafic implique le consentement initial du migrant et prend fin une fois la frontière franchie, bien que les risques d'abus soient immenses.",
        en: "The procurement, for financial benefit, of the illegal entry of a person into a State (Palermo Protocol, 2000). Unlike trafficking, smuggling involves the initial consent of the migrant and ends once the border is crossed, though the risks of abuse are immense.",
        source: { fr: "Protocole de Palerme (2000)", en: "Palermo Protocol (2000)" }
      },
      {
        term: "Traite des êtres humains",
        en_term: "Human Trafficking",
        fr: "Recrutement, transport, transfert ou hébergement de personnes par la force, la contrainte ou la tromperie à des fins d'exploitation (travail forcé, servitude, exploitation sexuelle). Elle n'implique pas nécessairement le franchissement d'une frontière internationale (Protocole de Palerme).",
        en: "Recruitment, transportation, transfer, or harboring of persons by force, coercion, or deception for the purpose of exploitation (forced labor, servitude, sexual exploitation). It does not necessarily involve crossing an international border (Palermo Protocol).",
        source: { fr: "Protocole de Palerme (2000)", en: "Palermo Protocol (2000)" }
      },
      {
        term: "Vulnérabilités des migrants",
        en_term: "Migrant Vulnerabilities",
        fr: "Capacité diminuée d'un individu à résister ou se relever de l'exploitation, de la violence ou des violations de droits (OIM, 2019). Ces vulnérabilités naissent de l'interaction entre des facteurs personnels (âge, sexe, santé) et structurels (absence de statut légal, pauvreté, discrimination).",
        en: "The diminished capacity of an individual to resist or recover from exploitation, violence, or rights violations (IOM, 2019). These vulnerabilities arise from the interaction of personal factors (age, gender, health) and structural factors (lack of legal status, poverty, discrimination)."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Identité légale",
        en_term: "Legal Identity",
        fr: "Reconnaissance de l'identité d'un individu par l'État (enregistrement des naissances, documents de voyage). Sans identité légale, les migrants sont exposés à l'exclusion systémique, à la détention arbitraire et au risque d'apatridie (Cible ODD 16.9).",
        en: "State recognition of an individual's identity (birth registration, travel documents). Without legal identity, migrants face systemic exclusion, arbitrary detention, and the risk of statelessness (SDG Target 16.9).",
        source: { fr: "Cible 16.9 des Objectifs de développement durable", en: "Sustainable Development Goal target 16.9", url: "https://www.un.org/sustainabledevelopment/" }
      }
    ]
  },
  {
    category: { fr: "Retour, Intégration & Résidence", en: "Return, Integration & Residence" },
    icon: MapPin,
    terms: [
      {
        term: "Solutions durables",
        en_term: "Durable solutions",
        fr: "Les trois issues reconnues à une situation de déplacement : le rapatriement volontaire dans le pays d'origine, l'intégration locale dans le pays d'accueil, et la réinstallation dans un pays tiers. Une solution n'est dite durable que lorsqu'elle met fin au besoin de protection internationale — critère rarement rempli à l'échelle des effectifs déplacés.",
        en: "The three recognised outcomes of a displacement situation: voluntary repatriation to the country of origin, local integration in the host country, and resettlement in a third country. A solution counts as durable only when it ends the need for international protection — a threshold rarely met at the scale of displaced populations.",
        source: { fr: "HCR ; Pacte mondial sur les réfugiés (2018)", en: "UNHCR; Global Compact on Refugees (2018)", url: "https://globalcompactrefugees.org/" }
      },
      {
        term: "Réinstallation",
        en_term: "Resettlement",
        fr: "Transfert d'un réfugié depuis son pays d'asile vers un pays tiers qui accepte de l'admettre et de lui accorder une résidence durable. Les places de réinstallation offertes chaque année restent très inférieures aux besoins identifiés, ce qui en fait moins une solution générale qu'un dispositif de protection ciblée.",
        en: "The transfer of a refugee from their country of asylum to a third state that agrees to admit them and grant durable residence. The resettlement places offered each year remain far below identified needs, making it less a general solution than a targeted protection mechanism.",
        source: { fr: "HCR, Projected Global Resettlement Needs", en: "UNHCR, Projected Global Resettlement Needs", url: "https://www.unhcr.org/global-trends" }
      },
      {
        term: "Voies complémentaires",
        en_term: "Complementary pathways",
        fr: "Canaux d'admission légale distincts de la réinstallation — visas humanitaires, regroupement familial élargi, bourses d'études, mobilité professionnelle — mobilisés pour ouvrir des accès sûrs sans passer par le contingent de réinstallation. Complémentaires signifie qu'elles s'ajoutent à la protection, sans s'y substituer.",
        en: "Legal admission channels distinct from resettlement — humanitarian visas, extended family reunification, scholarships, labour mobility — used to open safe access outside the resettlement quota. \"Complementary\" means they add to protection rather than replace it.",
        source: { fr: "Pacte mondial sur les réfugiés (2018)", en: "Global Compact on Refugees (2018)", url: "https://globalcompactrefugees.org/" }
      },
      {
        term: "Intégration locale",
        en_term: "Local integration",
        fr: "Processus par lequel un réfugié s'installe durablement dans son pays d'asile, avec une dimension juridique (accès à un statut stable, voire à la naturalisation), économique (droit au travail et aux moyens de subsistance) et sociale. C'est la solution durable la plus fréquente en Afrique de fait, et la moins reconnue en droit.",
        en: "The process by which a refugee settles durably in the country of asylum. It has a legal dimension (access to a stable status, possibly naturalisation), an economic one (the right to work and to livelihoods), and a social one. It is the most common durable solution in Africa in practice, and the least recognised in law.",
        source: { fr: "HCR ; Convention de l'OUA (1969), art. II", en: "UNHCR; OAU Convention (1969), Art. II", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Retour (Volontaire vs Forcé)",
        en_term: "Return (Voluntary vs Forced)",
        fr: "Processus par lequel un migrant regagne son pays d'origine. Le retour est « volontaire » lorsqu'il repose sur un consentement libre et éclairé. Il est « forcé » (expulsion, déportation) lorsqu'imposé par l'État hôte, devant toutefois respecter les droits humains et le non-refoulement (MPFA 2018-2030).",
        en: "Process by which a migrant goes back to their country of origin. Return is 'voluntary' when based on free and informed consent. It is 'forced' (expulsion, deportation) when imposed by the host state, though it must respect human rights and non-refoulement (MPFA 2018-2030).",
        source: { fr: "Cadre de politique migratoire pour l'Afrique (MPFA 2018-2030)", en: "Migration Policy Framework for Africa (MPFA 2018-2030)", url: "https://au.int/" }
      },
      {
        term: "Rapatriement",
        en_term: "Repatriation",
        fr: "Droit d'un réfugié ou d'une personne déplacée à retourner dans son pays d'origine dans des conditions de sécurité et de dignité, telles que définies par le droit international (Convention de Genève, Convention de l'OUA 1969).",
        en: "The right of a refugee or displaced person to return to their country of origin in safety and dignity, as defined by international law (Geneva Convention, 1969 OAU Convention).",
        source: { fr: "Convention de Genève (1951) ; Convention de l'OUA (1969)", en: "Geneva Convention (1951); OAU Convention (1969)", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" }
      },
      {
        term: "Réintégration",
        en_term: "Reintegration",
        fr: "Processus permettant aux migrants de retour de se réinsérer économiquement, socialement et psychologiquement dans leur communauté d'origine. Une réintégration durable prévient la réémigration irrégulière (MPFA 2018-2030).",
        en: "Process through which returning migrants re-establish themselves economically, socially, and psychologically in their community of origin. Sustainable reintegration prevents irregular re-migration (MPFA 2018-2030).",
        source: { fr: "Cadre de politique migratoire pour l'Afrique (MPFA 2018-2030)", en: "Migration Policy Framework for Africa (MPFA 2018-2030)", url: "https://au.int/" }
      },
      {
        term: "Résidence (Droit de)",
        en_term: "Residence",
        fr: "Statut légal accordé à un non-ressortissant pour séjourner légalement sur le territoire. Le Protocole de Kigali de l'UA (2018) promeut le droit de résidence pour l'emploi ou l'établissement commercial pour tous les citoyens africains.",
        en: "Legal status granted to a non-citizen to lawfully stay in the territory. The AU Kigali Protocol (2018) promotes the right of residence for employment or business establishment for all African citizens.",
        source: { fr: "Protocole de l'UA sur la libre circulation (2018)", en: "AU Free Movement Protocol (2018)", url: "https://au.int/en/treaties/protocol-treaty-establishing-african-economic-community-relating-free-movement-persons" }
      },
      {
        term: "Naturalisation",
        en_term: "Naturalization",
        fr: "Processus légal (souvent discrétionnaire) par lequel un non-national acquiert la citoyenneté d'un pays d'accueil. Reconnue comme un levier d'intégration sociale et de réduction de l'apatridie (Déclaration d'Abidjan, 2015).",
        en: "Legal process (often discretionary) by which a non-national acquires the citizenship of a host country. Recognized as a tool for social integration and reducing statelessness (Abidjan Declaration, 2015).",
        source: { fr: "Déclaration d'Abidjan sur l'éradication de l'apatridie (2015)", en: "Abidjan Declaration on the Eradication of Statelessness (2015)" }
      },
      {
        term: "Résilience des migrants",
        en_term: "Resilience of Migrants",
        fr: "Capacité des migrants à s'adapter, résister et se remettre des chocs (économiques, climatiques, discriminatoires) rencontrés durant le parcours migratoire, souvent soutenue par les réseaux de la diaspora et les cadres d'inclusion locaux.",
        en: "The capacity of migrants to adapt, resist, and recover from shocks (economic, climatic, discriminatory) encountered during the migration journey, often supported by diaspora networks and local inclusion frameworks."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      }
    ]
  },
  {
    category: { fr: "Économie, Compétences & Développement", en: "Economy, Skills & Development" },
    icon: Briefcase,
    terms: [
      {
        term: "Transferts de fonds (Remittances)",
        en_term: "Remittances",
        fr: "Fonds ou biens transférés par les migrants vers leur pays d'origine. Les remises migratoires constituent souvent la première source de financement externe en Afrique, dépassant l'Aide publique au développement (OIM, 2019).",
        en: "Money or goods transferred by migrants to their country of origin. Remittances are often the leading source of external financing in Africa, exceeding Official Development Assistance (IOM, 2019).",
        source: { fr: "OIM (2019) ; Banque mondiale — données sur les transferts", en: "IOM (2019); World Bank — remittances data" }
      },
      {
        term: "Fuite des cerveaux (Brain Drain)",
        en_term: "Brain Drain",
        fr: "Émigration d'individus hautement qualifiés entraînant l'épuisement du capital humain du pays d'origine, un défi critique pour les secteurs de la santé et de l'éducation en Afrique.",
        en: "Emigration of highly skilled individuals leading to the depletion of the source country's human capital, a critical challenge for Africa's health and education sectors."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Gain de compétences (Brain Gain)",
        en_term: "Brain Gain",
        fr: "Bénéfice tiré par un pays grâce à l'immigration de professionnels hautement qualifiés ou au retour de ses nationaux ayant acquis une expertise à l'étranger (Réseaux de la diaspora).",
        en: "The benefit a country derives from the immigration of highly qualified professionals or the return of its nationals who acquired expertise abroad (Diaspora networks)."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Circulation des cerveaux (Brain Circulation)",
        en_term: "Brain Circulation",
        fr: "Mouvement répété et bidirectionnel de professionnels qualifiés entre pays d'origine et de destination, par opposition à un départ ou un retour définitifs. Ce cadre déplace le débat de la « fuite » (perte nette et irréversible) vers un échange continu de compétences, de capitaux et de réseaux.",
        en: "Repeated, bidirectional movement of skilled professionals between origin and destination countries, as opposed to a one-way departure or permanent return. This framework shifts the debate from \"drain\" (a net, irreversible loss) toward a continuous exchange of skills, capital, and networks."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Gaspillage de compétences (Brain Waste)",
        en_term: "Brain Waste",
        fr: "Situation où des migrants hautement qualifiés occupent des emplois sans rapport avec leurs diplômes, souvent en raison de la non-reconnaissance de leurs qualifications étrangères ou de barrières systémiques.",
        en: "Situation where highly skilled migrants are employed in jobs unrelated to their qualifications, often due to the non-recognition of foreign credentials or systemic barriers."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Coût de la fuite (Brain Cost)",
        en_term: "Brain Cost",
        fr: "Pertes économiques, sociales et développementales (incluant les fonds publics investis dans l'éducation de l'individu) subies par l'État d'origine lorsque ses travailleurs qualifiés émigrent définitivement.",
        en: "The economic, social, and developmental losses (including public funds invested in the individual's education) incurred by the origin State when its skilled workers emigrate permanently."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Investissement des diasporas",
        en_term: "Investment by Migrants",
        fr: "Contributions économiques des migrants au-delà des simples transferts de fonds familiaux : entrepreneuriat, immobilier, « diaspora bonds », transfert de technologies et de capitaux vers les secteurs productifs.",
        en: "Economic contributions of migrants beyond basic family remittances: entrepreneurship, real estate, diaspora bonds, technology transfer, and capital investment in productive sectors."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Partenariat de compétences (Global Skills Partnership)",
        en_term: "Global Skills Partnership",
        fr: "Accord bilatéral par lequel un pays d'origine et un pays de destination financent ensemble la formation de travailleurs avant leur départ, dans des compétences utiles aux deux économies. L'idée est de faire de la mobilité de main-d'œuvre un investissement partagé, plutôt qu'un prélèvement de capital humain déjà formé.",
        en: "A bilateral agreement in which an origin country and a destination country jointly fund worker training before departure, in skills useful to both economies. The aim is to turn labour mobility into a shared investment, instead of a simple draw on already-trained human capital.",
        source: { fr: "Objectif 18 du Pacte mondial pour les migrations", en: "Objective 18 of the Global Compact for Migration" }
      }
    ]
  },
  {
    category: { fr: "Gouvernance, Données & Concepts Théoriques", en: "Governance, Data & Theoretical Concepts" },
    icon: Brain,
    terms: [
      {
        term: "Corridor migratoire",
        en_term: "Migration Corridor",
        fr: "Paire pays d'origine–pays de destination reliée par un flux ou un stock significatif de migrants. C'est l'unité d'analyse standard des statistiques bilatérales de migration (UN DESA, Banque mondiale). Elle fait apparaître, au-delà des agrégats nationaux, la géographie réelle des déplacements.",
        en: "An origin-destination country pair linked by a significant migrant flow or stock. It is the standard unit of analysis in bilateral migration statistics (UN DESA, World Bank), and it reveals the real geography of movement beyond national aggregates."
      ,
        source: "UN DESA — International Migrant Stock ; Banque mondiale"
      },
      {
        term: "Régime (de gouvernance migratoire)",
        en_term: "Regime (of migration governance)",
        fr: "Ensemble de principes, normes, règles et procédures de décision autour desquels les attentes des acteurs convergent dans un domaine donné. Appliquée au cas africain, la notion permet de tenir ensemble ce qu'une lecture par les seuls traités sépare : les textes adoptés, les bureaucraties qui les portent, les pratiques effectives aux postes-frontières (Ben Mokhtar, 2026).",
        en: "A set of principles, norms, rules and decision-making procedures around which actors' expectations converge in a given area. Applied to the African case, the notion holds together what a treaty-only reading separates: the texts adopted, the bureaucracies that carry them, and the actual practices of border posts (Ben Mokhtar, 2026).",
        source: { fr: "Cadre de la théorie des régimes internationaux, appliqué au cas africain par Ben Mokhtar (2026)", en: "International regime theory framework, applied to the African case by Ben Mokhtar (2026)" }
      },
      {
        term: "Extraversion",
        en_term: "Extraversion",
        fr: "Stratégie par laquelle des acteurs africains convertissent leur position de dépendance en ressource, en mobilisant la relation extérieure — financements, coopération, reconnaissance — comme instrument de pouvoir interne. Appliquée aux migrations, elle éclaire pourquoi certains États négocient activement une coopération qui semble d'abord servir l'agenda de leurs partenaires.",
        en: "A strategy by which African actors convert a position of dependence into a resource, mobilising the external relationship — funding, cooperation, recognition — as an instrument of domestic power. Applied to migration, it explains why some states actively negotiate cooperation that appears to serve their partners' agenda first.",
        source: { fr: "Bayart (2000), « Africa in the World: A History of Extraversion » — voir Bibliothèque", en: "Bayart (2000), \"Africa in the World: A History of Extraversion\" — see Library" }
      },
      {
        term: "Gouvernementalité",
        en_term: "Governmentality",
        fr: "Manière dont un pouvoir gouverne des populations non par la contrainte directe mais par des dispositifs de savoir : catégories, recensements, indicateurs, procédures. Dans le champ migratoire, la notion invite à examiner les instruments de mesure eux-mêmes — compter, classer, nommer — comme des actes de gouvernement plutôt que comme des descriptions neutres.",
        en: "The way a power governs populations not through direct coercion but through knowledge devices: categories, censuses, indicators, procedures. In the migration field, the notion invites examining measurement instruments themselves — counting, classifying, naming — as acts of government rather than neutral descriptions.",
        source: { fr: "Cadre foucaldien, mobilisé dans l'analyse du régime africain (Ben Mokhtar, 2026)", en: "Foucauldian framework, mobilised in the analysis of the African regime (Ben Mokhtar, 2026)" }
      },
      {
        term: "Lecture décoloniale",
        en_term: "Decolonial reading",
        fr: "Approche qui rapporte les asymétries contemporaines de mobilité à l'ordre colonial qui les a instituées : le droit de circuler se distribue selon des lignes héritées, et cette inégalité a une histoire. Appliquée au droit international des migrations, elle conteste que les régimes de mobilité mondiaux soient neutres quant à l'origine.",
        en: "An approach that relates contemporary asymmetries of mobility to the colonial order that instituted them: the right to move is distributed along inherited lines, and that inequality has a history. Applied to international migration law, it contests the claim that global mobility regimes are neutral as to origin.",
        source: { fr: "Achiume (2019), « Migration as Decolonization » — voir Bibliothèque", en: "Achiume (2019), \"Migration as Decolonization\" — see Library", url: "https://ssrn.com/abstract=3330353" }
      },
      {
        term: "Communs migratoires vernaculaires",
        en_term: "Vernacular migration commons",
        fr: "Arrangements collectifs non étatiques qui organisent concrètement la circulation — réseaux d'hébergement, caisses d'entraide, savoirs de route, régulations de corridor — et qui préexistent souvent aux dispositifs publics ou en comblent les vides. Les penser comme des communs, plutôt que comme du désordre, déplace la question vers celle de leur reconnaissance (Ben Mokhtar, 2026).",
        en: "Non-state collective arrangements that concretely organise movement — accommodation networks, mutual-aid funds, route knowledge, corridor regulation — which often predate public schemes or fill their gaps. Thinking of them as commons rather than as disorder changes the question: not how to suppress them, but how to recognise them (Ben Mokhtar, 2026).",
        source: { fr: "Cadre des communs (Ostrom), appliqué aux corridors africains (Ben Mokhtar, 2026)", en: "Commons framework (Ostrom), applied to African corridors (Ben Mokhtar, 2026)" }
      },
      {
        term: "Souveraineté épistémique",
        en_term: "Epistemic sovereignty",
        fr: "Capacité d'un ensemble politique à produire lui-même les catégories, les données et les diagnostics qui le décrivent, plutôt que de les recevoir. C'est la justification explicite des organes africains de données migratoires : sans appareil propre, le continent se lit dans les instruments de ceux qui l'observent.",
        en: "The capacity of a political entity to produce for itself the categories, data and diagnoses that describe it, rather than receiving them. It is the explicit rationale of Africa's migration-data bodies: without its own apparatus, the continent reads itself through the instruments of those who observe it.",
        source: { fr: "Justification institutionnelle des organes de données de l'UA (OAM, STATAFRIC) ; lecture développée dans Ben Mokhtar (2026)", en: "Institutional rationale of the AU's data bodies (AMO, STATAFRIC); reading developed in Ben Mokhtar (2026)" }
      },
      {
        term: "Conditionnalité migratoire",
        en_term: "Migration conditionality",
        fr: "Subordination d'un avantage — aide, préférence commerciale, facilitation de visa — à la coopération d'un État en matière de contrôle migratoire ou de réadmission. Elle installe la migration comme monnaie d'échange dans des négociations qui portent formellement sur autre chose.",
        en: "Making a benefit — aid, trade preference, visa facilitation — conditional on a state's cooperation in migration control or readmission. It installs migration as a bargaining chip in negotiations formally about something else.",
        source: { fr: "Voir Adamson & Tsourapas (2019) sur la diplomatie migratoire — Bibliothèque", en: "See Adamson & Tsourapas (2019) on migration diplomacy — Library", url: "https://doi.org/10.1093/isp/eky015" }
      },
      {
        term: "Entre-deux national",
        en_term: "National In-Between",
        fr: "L'espace de traduction, de filtrage et de mise en procédure où les engagements normatifs continentaux (UA, CER) sont retravaillés, ralentis ou réinterprétés par les bureaucraties nationales. Concept central de la thèse à l'origine de cette plateforme (Ben Mokhtar, 2026).",
        en: "The space of translation, filtering, and procedural conversion where continental normative commitments (AU, RECs) are reworked, slowed, or reinterpreted by national bureaucracies. A central concept of the thesis behind this platform (Ben Mokhtar, 2026).",
        source: { fr: "Ben Mokhtar (2026) — concept central de la thèse à l'origine de la plateforme", en: "Ben Mokhtar (2026) — core concept of the doctoral thesis behind this platform" }
      },
      {
        term: "Capabilités de mouvement",
        en_term: "Capabilities of Movement",
        fr: "Cadre théorique (de Haas, 2021) situant mobilité et immobilité sur un même continuum d'aspirations et de capacités effectivement exerçables, dépassant la dichotomie simpliste volontaire/forcé.",
        en: "Theoretical framework (de Haas, 2021) placing mobility and immobility on the same continuum of aspirations and actually exercisable capabilities, moving beyond the simplistic voluntary/forced dichotomy.",
        source: { fr: "de Haas (2021), « A theory of migration: the aspirations–capabilities framework »", en: "de Haas (2021), 'A theory of migration: the aspirations-capabilities framework'", url: "https://doi.org/10.1186/s40878-020-00210-4" }
      },
      {
        term: "Gouvernance des migrations",
        en_term: "Migration Governance",
        fr: "Ensemble des normes juridiques, politiques, institutions et processus (du niveau local au niveau mondial) façonnant la gestion des mobilités, les droits des migrants et la coopération entre États (OIM, 2015 ; MPFA, 2018).",
        en: "The combined frameworks of legal norms, policies, institutions, and processes (from local to global levels) shaping the management of mobility, migrant rights, and inter-state cooperation (IOM, 2015; MPFA, 2018).",
        source: { fr: "OIM (2015) ; Cadre de politique migratoire pour l'Afrique (MPFA, 2018)", en: "IOM (2015); Migration Policy Framework for Africa (MPFA, 2018)", url: "https://au.int/" }
      },
      {
        term: "Sécurisation (Securitization)",
        en_term: "Securitization",
        fr: "Processus par lequel la migration est progressivement traitée comme une menace sécuritaire (contrôle des frontières, criminalisation) au détriment de ses dimensions développementales et des droits humains.",
        en: "The process by which migration is increasingly framed and governed as a security threat (border control, criminalization) at the expense of its developmental and human rights dimensions."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Désagrégation des données",
        en_term: "Data Disaggregation",
        fr: "Processus technique consistant à ventiler des données statistiques agrégées en sous-catégories (par âge, sexe, statut migratoire) pour identifier les disparités et orienter l'élaboration de politiques basées sur des preuves (Cible ODD 17.18).",
        en: "The technical process of breaking down aggregated statistical data into subcategories (by age, gender, migration status) to identify disparities and guide evidence-based policymaking (SDG Target 17.18).",
        source: { fr: "Cible 17.18 des Objectifs de développement durable", en: "Sustainable Development Goal target 17.18", url: "https://www.un.org/sustainabledevelopment/" }
      },
      {
        term: "Facteurs Push & Pull (Causes profondes)",
        en_term: "Push & Pull Factors (Root Causes)",
        fr: "Conditions structurelles motivant le départ d'une région (Push : pauvreté, chocs climatiques, conflits) ou l'attraction vers une autre (Pull : emploi, réseaux familiaux, stabilité). Le GCM et le MPFA appellent à traiter ces causes profondes pour faire de la migration un choix et non une nécessité vitale.",
        en: "Structural conditions motivating departure from a region (Push: poverty, climate shocks, conflict) or attraction to another (Pull: jobs, family networks, stability). The GCM and MPFA call for addressing these root causes to make migration a choice rather than a necessity."
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      {
        term: "Diplomatie migratoire",
        en_term: "Migration Diplomacy",
        fr: "Utilisation stratégique de la coopération migratoire par les États dans l'arène internationale, s'en servant comme levier de négociation pour obtenir des financements, une reconnaissance politique ou des accords commerciaux (Adamson & Tsourapas, 2019).",
        en: "The strategic use of migration cooperation by states in the international arena, utilizing it as a bargaining lever to secure funding, political recognition, or trade agreements (Adamson & Tsourapas, 2019).",
        source: { fr: "Adamson & Tsourapas (2019), « Migration Diplomacy in World Politics »", en: "Adamson & Tsourapas (2019), 'Migration Diplomacy in World Politics'", url: "https://doi.org/10.1093/isp/eky015" }
      },
      { 
        term: "Nord Global & Sud Global", 
        en_term: "Global North & Global South", 
        fr: "Dichotomie socio-économique et politique. Le Sud Global ne désigne pas une géographie stricte, mais un ensemble d'économies en développement partageant des héritages historiques de colonialisme, d'exploitation des ressources et d'inégalités structurelles dans les accords commerciaux mondiaux.", 
        en: "Socio-economic and political dichotomy. The Global South does not refer to a strict geography, but rather developing economies sharing historical legacies of colonialism, resource exploitation, and structural inequalities in global trade agreements." 
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      { 
        term: "Numérisation de la gouvernance (Digitalization)", 
        en_term: "Digitalization of Migration Governance", 
        fr: "Intégration de technologies numériques (biométrie, e-visas, systèmes de surveillance) pour gérer les migrations. L'utilisation généralisée d'outils développés hors du continent soulève des préoccupations majeures quant à l'appropriation africaine (African ownership) et à la souveraineté épistémique des données.", 
        en: "Integration of digital technologies (biometrics, e-visas, surveillance systems) to manage migration. The widespread use of tools developed outside the continent raises major concerns regarding African ownership and the epistemic sovereignty of data." 
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
      { 
        term: "Processus Consultatifs Régionaux (RCPs)", 
        en_term: "Regional Consultative Processes (RCPs)", 
        fr: "Plateformes étatiques, informelles et non contraignantes de dialogue sur les migrations (ex: MIDWA en Afrique de l'Ouest, MIDSA en Afrique Australe). Les Processus de Rabat et de Khartoum illustrent cette dynamique en structurant la coopération entre l'Afrique et l'Europe.", 
        en: "State-led, informal, and non-binding platforms for migration dialogue (e.g., MIDWA in West Africa, MIDSA in Southern Africa). The Rabat and Khartoum Processes illustrate this dynamic by structuring cooperation between Africa and Europe." 
      ,
        source: "OIM — Glossaire de la migration (2019)"
      },
    ]
  },
  {
    category: { fr: "Instruments & Institutions du Régime Africain", en: "Instruments & Institutions of the African Regime" },
    icon: Landmark,
    terms: [
      {
        term: "Convention de l'OUA (1969)",
        en_term: "OAU Convention (1969)",
        fr: "Convention régissant les aspects propres aux problèmes des réfugiés en Afrique, adoptée à Addis-Abeba le 10 septembre 1969, en vigueur depuis le 20 juin 1974. Son article I(2) élargit la définition du réfugié à quiconque fuit une agression extérieure, une occupation, une domination étrangère ou des événements troublant gravement l'ordre public — sans exiger de crainte de persécution individualisée. C'est la définition de référence de cette plateforme.",
        en: "Convention Governing the Specific Aspects of Refugee Problems in Africa, adopted in Addis Ababa on 10 September 1969, in force since 20 June 1974. Its Article I(2) broadens the refugee definition to anyone fleeing external aggression, occupation, foreign domination or events seriously disturbing public order — with no individualised fear of persecution required. It is this platform's reference definition.",
        source: { fr: "Union africaine — texte du traité", en: "African Union — treaty text", url: "https://au.int/en/treaties/oau-convention-governing-specific-aspects-refugee-problems-africa" },
        stakes: { fr: "Sous la définition de Genève, une personne fuyant une guerre généralisée sans être personnellement visée peut être écartée. Sous l'article I(2), elle est réfugiée. Le même trajet, deux textes, deux issues.", en: "Under the Geneva definition, someone fleeing generalised war without being personally targeted can be excluded. Under Article I(2), they are a refugee. Same journey, two texts, two outcomes." }
      },
      {
        term: "Convention de Kampala (2009)",
        en_term: "Kampala Convention (2009)",
        fr: "Convention de l'Union africaine sur la protection et l'assistance aux personnes déplacées en Afrique. Premier — et toujours seul — traité régional contraignant au monde consacré aux personnes déplacées internes. Son article 1 donne la définition de référence de la PDI retenue sur cette plateforme.",
        en: "African Union Convention for the Protection and Assistance of Internally Displaced Persons in Africa. The first — and still the only — binding regional treaty in the world devoted to internally displaced persons. Its Article 1 provides the reference IDP definition used on this platform.",
        source: { fr: "Union africaine — texte du traité", en: "African Union — treaty text", url: "https://au.int/en/treaties/african-union-convention-protection-and-assistance-internally-displaced-persons-africa" }
      },
      {
        term: "Protocole sur la libre circulation (2018)",
        en_term: "Free Movement Protocol (2018)",
        fr: "Protocole au Traité d'Abuja relatif à la libre circulation des personnes, au droit de résidence et au droit d'établissement, adopté à Kigali en 2018. Il organise l'ouverture en trois phases successives — entrée, résidence, établissement — chacune conditionnant la suivante. Son entrée en vigueur requiert 15 ratifications ; il en compte 4 sur 54.",
        en: "Protocol to the Abuja Treaty on Free Movement of Persons, Right of Residence and Right of Establishment, adopted in Kigali in 2018. It organises opening in three successive phases — entry, residence, establishment — each conditioning the next. Entry into force requires 15 ratifications; it stands at 4 of 54.",
        source: { fr: "Union africaine — texte du traité", en: "African Union — treaty text", url: "https://au.int/en/treaties/protocol-treaty-establishing-african-economic-community-relating-free-movement-persons" },
        stakes: { fr: "Le découpage en phases est ce qui rend le texte signable : un État peut adhérer au principe d'entrée sans s'engager sur le droit d'établissement. C'est aussi ce qui permet de s'arrêter à la première phase indéfiniment.", en: "The phased design is what makes the text signable: a state can endorse entry without committing to establishment rights. It is also what allows stopping at phase one indefinitely." }
      },
      {
        term: "MPFA (2018-2030)",
        en_term: "MPFA (2018-2030)",
        fr: "Cadre de politique migratoire pour l'Afrique et son plan d'action décennal, révisé et adopté en 2018. Document d'orientation non contraignant qui décline les priorités continentales — gouvernance du travail migrant, données, protection, diaspora — et sert de référence aux politiques migratoires nationales et régionales.",
        en: "Migration Policy Framework for Africa and its ten-year action plan, revised and adopted in 2018. A non-binding guidance document setting out continental priorities — labour migration governance, data, protection, diaspora — and serving as the reference for national and regional migration policies.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "AVOI",
        en_term: "AVOI",
        fr: "Indice d'ouverture des visas en Afrique (Africa Visa Openness Index), publié conjointement par la Banque africaine de développement et la Commission de l'Union africaine. Il mesure, pour chaque pays, la facilité d'entrée offerte aux ressortissants des autres États africains selon la part de pays admis sans visa, avec visa à l'arrivée ou avec visa préalable.",
        en: "Africa Visa Openness Index, published jointly by the African Development Bank and the African Union Commission. For each country it measures the ease of entry offered to nationals of other African states, based on the share of countries admitted visa-free, with visa on arrival, or requiring a prior visa.",
        source: { fr: "BAD & CUA, Africa Visa Openness Report", en: "AfDB & AUC, Africa Visa Openness Report", url: "https://www.visaopenness.org/" }
      },
      {
        term: "CER",
        en_term: "REC",
        fr: "Communauté économique régionale. Huit CER sont reconnues par l'Union africaine comme les blocs constitutifs de l'intégration continentale. Elles sont, en matière de mobilité, l'échelon où la libre circulation s'exerce réellement : plusieurs ont ouvert leurs frontières intérieures bien avant que le protocole continental n'existe.",
        en: "Regional Economic Community. Eight RECs are recognised by the African Union as the building blocs of continental integration. On mobility they are the level at which free movement actually operates: several opened their internal borders long before the continental protocol existed.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "ZLECAf",
        en_term: "AfCFTA",
        fr: "Zone de libre-échange continentale africaine. Accord commercial continental dont la mise en œuvre suppose une mobilité des personnes que le protocole sur la libre circulation n'a pas encore rendue effective. Marchandises et personnes forment ainsi deux chantiers volontairement dissociés.",
        en: "African Continental Free Trade Area. A continental trade agreement whose implementation presupposes a mobility of persons that the free movement protocol has not yet made effective — making the movement of goods and of people two deliberately decoupled projects.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/en/agenda2063/flagship-projects" }
      },
      {
        term: "GCR",
        en_term: "GCR",
        fr: "Pacte mondial sur les réfugiés, affirmé par l'Assemblée générale des Nations unies en 2018. Instrument non contraignant organisé autour du partage équitable des charges et des responsabilités. Il est postérieur d'un demi-siècle à la Convention de l'OUA, qui portait déjà l'essentiel de ses principes en droit contraignant.",
        en: "Global Compact on Refugees, affirmed by the UN General Assembly in 2018. A non-binding instrument organised around equitable sharing of burdens and responsibilities. It postdates by half a century the OAU Convention, which already carried most of its principles in binding law.",
        source: { fr: "Nations unies / HCR", en: "United Nations / UNHCR", url: "https://globalcompactrefugees.org/" }
      },
      {
        term: "CTS-MRIDP",
        en_term: "STC-MRIDPs",
        fr: "Comité technique spécialisé sur la migration, les réfugiés et les personnes déplacées. Organe ministériel de l'Union africaine institué sur la base de l'article 5 de l'Acte constitutif ; il se réunit tous les deux ans et supervise la redevabilité des organes techniques du régime, dont l'OAM.",
        en: "Specialized Technical Committee on Migration, Refugees and Displaced Persons. An African Union ministerial organ established under Article 5 of the Constitutive Act; it meets every two years and oversees the accountability of the regime's technical bodies, including the AMO.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "PAFoM",
        en_term: "PAFoM",
        fr: "Forum panafricain sur la migration. Processus consultatif continental créé par décision du Conseil exécutif en 2006, dont la première session s'est tenue à Accra en 2015. Il réunit États membres, CER, processus régionaux et agences onusiennes, sans pouvoir décisionnel propre.",
        en: "Pan-African Forum on Migration. A continental consultative process created by Executive Council decision in 2006, whose first session was held in Accra in 2015. It brings together member states, RECs, regional processes and UN agencies, with no decision-making power of its own.",
        source: { fr: "Union africaine", en: "African Union", url: "https://au.int/" }
      },
      {
        term: "JLMP",
        en_term: "JLMP",
        fr: "Programme conjoint sur la migration de travail (Joint Labour Migration Programme), porté par la Commission de l'UA avec l'OIT, l'OIM et la CEA. Il met en œuvre le cinquième domaine prioritaire de la Déclaration d'Addis-Abeba sur l'emploi (2015) autour de quatre axes : portabilité des compétences, portabilité de la protection sociale, recrutement équitable et protection des travailleurs.",
        en: "Joint Labour Migration Programme, led by the AU Commission with the ILO, IOM and ECA. It implements the fifth priority area of the 2015 Addis Ababa Declaration on Employment around four axes: skills portability, social-security portability, fair recruitment and worker protection.",
        source: { fr: "Union africaine / OIT / OIM / CEA", en: "African Union / ILO / IOM / ECA", url: "https://au.int/" }
      }
    ]
  }
];
