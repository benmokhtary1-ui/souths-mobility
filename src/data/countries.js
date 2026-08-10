import { genericDesc } from './genericDesc.js';

// Base pays de la plateforme : 54 États, cinq régions selon le découpage
// officiel de l'Union africaine (et non la nomenclature M49 des Nations unies).
//
// Provenance des champs — voir aussi src/data/SCHEMA.md :
//   stock, female, evolution ......... UN DESA, International Migrant Stock 2024
//   retention ........................ UA / OIT / OIM / CEA (2021)
//   avoi ............................. BAD & CUA, Africa Visa Openness Index
//   remittances ...................... Banque mondiale
//   idp_conflict, idp_disaster ....... IDMC
//   refugees_hosted .................. HCR
//   normlex .......................... OIT, base NORMLEX
//   au_treaties ...................... listes officielles de statut de l'UA

// Descriptifs communs a plusieurs pays : ils etaient repandus par diffusion
// (...genericDesc) depuis App.jsx. Sortis avec la base, sinon la base ne peut
// pas vivre seule — et le defaut ne se voit qu a l execution, pas au build.


export const countryData = {
  "af_med": [
    { 
      "id": "12", "name": { "fr": "Algérie", "en": "Algeria" }, "flag": "🇩🇿", "iso2": "dz", "retention": 60, "aid": 0.1, "stock": "259458", "female": "47.2", 
      "history": [ { "year": 1990, "value": "273954" }, { "year": 2024, "value": "259458" } ], "remittances": 0.67, "labour_participation": "40.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 0, "idp_disaster": 10, "refugees_hosted": 0, "avoi": 9, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 48, "total": 60, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103006"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "818", "name": { "fr": "Égypte", "en": "Egypt" }, "flag": "🇪🇬", "iso2": "eg", "retention": 75, "aid": 1.5, "stock": "1139820", "female": "47.1", 
      "history": [ { "year": 1990, "value": "144713" }, { "year": 2024, "value": "1139820" } ], "remittances": 11.37, "labour_participation": "59.9", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 834200, "avoi": 11, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 54, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103254"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "L'Égypte est structurellement un pays d'émigration de travail vers le Golfe. L'Arabie saoudite héberge à elle seule environ 1,5 million d'Égyptiens. Les pays du Golfe fournissent plus de 40 % des 19,5 milliards de dollars de transferts reçus par le pays en 2023 (Banque mondiale).", "en": "Egypt is structurally a labour-emigration country toward the Gulf: Saudi Arabia alone hosts around 1.5 million Egyptians, and Gulf countries provide over 40% of the $19.5 billion in remittances the country received in 2023 (World Bank)." },
      "impact": { "fr": "L'Égypte reçoit 31% du total des transferts de fonds captés par l'ensemble du continent africain (Rapport UA 2021).", "en": "Egypt receives 31% of total diaspora remittances captured by the entire African continent (AU Report 2021)." }
    },
    { 
      "id": "434", "name": { "fr": "Libye", "en": "Libya" }, "flag": "🇱🇾", "iso2": "ly", "retention": 85, "aid": 2.1, "stock": "897751", "female": "28.2", 
      "history": [ { "year": 1990, "value": "457075" }, { "year": 2024, "value": "897751" } ], "remittances": null, "labour_participation": "61.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "12.8", 
      "idp_conflict": 85000, "idp_disaster": 21000, "refugees_hosted": 551700, "avoi": 4, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 19, "total": 29, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102919"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "504", "name": { "fr": "Maroc", "en": "Morocco" }, "flag": "🇲🇦", "iso2": "ma", "retention": 55, "aid": 1.2, "stock": "111069", "female": "48.5", 
      "history": [ { "year": 1990, "value": "54895" }, { "year": 2024, "value": "111069" } ], "remittances": 7.49, "labour_participation": "46.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 15, 
      "normlex": {"fundamental": 8, "governance": 4, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102993"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "Environ 72% de la diaspora marocaine réside dans trois pays européens : la France (env. 1,1 million de personnes), l'Espagne (env. 770 000) et l'Italie (env. 490 000) — un corridor historique remontant aux migrations de travail des années 1960-1970.", "en": "About 72% of the Moroccan diaspora lives in three European countries: France (approx. 1.1 million people), Spain (approx. 770,000), and Italy (approx. 490,000) — a historic corridor dating back to the labour migrations of the 1960s-1970s." }
    },
    {
      "id": "788", "name": { "fr": "Tunisie", "en": "Tunisia" }, "flag": "🇹🇳", "iso2": "tn", "retention": 50, "aid": 1.8, "stock": "63201", "female": "47.7", 
      "history": [ { "year": 1990, "value": "37984" }, { "year": 2024, "value": "63201" } ], "remittances": 6.34, "labour_participation": "52.4", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.5", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 53, "total": 65, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102980"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "478", "name": { "fr": "Mauritanie", "en": "Mauritania" }, "flag": "🇲🇷", "iso2": "mr", "retention": 70, "aid": 5.5, "stock": "195937", "female": "43.4", 
      "history": [ { "year": 1990, "value": "111650" }, { "year": 2024, "value": "195937" } ], "remittances": 0.87, "labour_participation": "68.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 17, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 34, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103031"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_west": [
    { 
      "id": "204", "name": { "fr": "Bénin", "en": "Benin" }, "flag": "🇧🇯", "iso2": "bj", "retention": 80, "aid": 4.1, "stock": "418202", "female": "52.9", 
      "history": [ { "year": 1990, "value": "76751" }, { "year": 2024, "value": "418202" } ], "remittances": 1.72, "labour_participation": "64.4", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "3.0", 
      "idp_conflict": 26000, "idp_disaster": 1100, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 22, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103009"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "854", "name": { "fr": "Burkina Faso", "en": "Burkina Faso" }, "flag": "🇧🇫", "iso2": "bf", "retention": 90, "aid": 6.2, "stock": "739820", "female": "52.4", 
      "history": [ { "year": 1990, "value": "349652" }, { "year": 2024, "value": "739820" } ], "remittances": 2.57, "labour_participation": "64.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "3.2", 
      "idp_conflict": 2063000, "idp_disaster": 210, "refugees_hosted": 0, "avoi": 36, 
      "normlex": {"fundamental": 9, "governance": 4, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103058"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "132", "name": { "fr": "Cabo Verde", "en": "Cabo Verde" }, "flag": "🇨🇻", "iso2": "cv", "retention": 40, "aid": 8.1, "stock": "16515", "female": "49.4", 
      "history": [ { "year": 1990, "value": "8931" }, { "year": 2024, "value": "16515" } ], "remittances": 11.67, "labour_participation": "72.2", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "3.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 86, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 5, "total": 16, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102978"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "384", "name": { "fr": "Côte d'Ivoire", "en": "Côte d'Ivoire" }, "flag": "🇨🇮", "iso2": "ci", "retention": 95, "aid": 1.5, "stock": "2880839", "female": "40.0", 
      "history": [ { "year": 1990, "value": "1822374" }, { "year": 2024, "value": "2880839" } ], "remittances": 2.03, "labour_participation": "74.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "9.0", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 42, 
      "normlex": {"fundamental": 11, "governance": 4, "technical": 33, "total": 48, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103023"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "270", "name": { "fr": "Gambie", "en": "Gambia" }, "flag": "🇬🇲", "iso2": "gm", "retention": 60, "aid": 10.5, "stock": "236137", "female": "47.2", 
      "history": [ { "year": 1990, "value": "118123" }, { "year": 2024, "value": "236137" } ], "remittances": 22.0, "labour_participation": "72.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "8.6", 
      "idp_conflict": 0, "idp_disaster": 250, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 11, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103004"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "288", "name": { "fr": "Ghana", "en": "Ghana" }, "flag": "🇬🇭", "iso2": "gh", "retention": 70, "aid": 2.5, "stock": "532286", "female": "46.6", 
      "history": [ { "year": 1990, "value": "164851" }, { "year": 2024, "value": "532286" } ], "remittances": 2.12, "labour_participation": "64.4", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.6", 
      "idp_conflict": 3900, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 87, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103271"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "324", "name": { "fr": "Guinée", "en": "Guinea" }, "flag": "🇬🇳", "iso2": "gn", "retention": 85, "aid": 4.8, "stock": "117416", "female": "41.2", 
      "history": [ { "year": 1990, "value": "403621" }, { "year": 2024, "value": "117416" } ], "remittances": 2.46, "labour_participation": "44.0", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 130, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 50, "total": 62, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103001"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "624", "name": { "fr": "Guinée-Bissau", "en": "Guinea-Bissau" }, "flag": "🇬🇼", "iso2": "gw", "retention": 75, "aid": 9.1, "stock": "15064", "female": "50.6", 
      "history": [ { "year": 1990, "value": "15368" }, { "year": 2024, "value": "15064" } ], "remittances": 9.88, "labour_participation": "61.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 700, "refugees_hosted": 0, "avoi": 26, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 25, "total": 34, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103328"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "430", "name": { "fr": "Libéria", "en": "Liberia" }, "flag": "🇱🇷", "iso2": "lr", "retention": 80, "aid": 15.5, "stock": "72423", "female": "42.4", 
      "history": [ { "year": 1990, "value": "94964" }, { "year": 2024, "value": "72423" } ], "remittances": 21.28, "labour_participation": "60.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 26, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 17, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102941"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "466", "name": { "fr": "Mali", "en": "Mali" }, "flag": "🇲🇱", "iso2": "ml", "retention": 85, "aid": 7.2, "stock": "545323", "female": "49.3", 
      "history": [ { "year": 1990, "value": "160736" }, { "year": 2024, "value": "545323" } ], "remittances": 3.99, "labour_participation": "76.0", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.3", 
      "idp_conflict": 409000, "idp_disaster": 5900, "refugees_hosted": 0, "avoi": 41, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 23, "total": 36, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102987"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "562", "name": { "fr": "Niger", "en": "Niger" }, "flag": "🇳🇪", "iso2": "ne", "retention": 90, "aid": 9.8, "stock": "449236", "female": "53.5", 
      "history": [ { "year": 1990, "value": "115464" }, { "year": 2024, "value": "449236" } ], "remittances": 3.3, "labour_participation": "50.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.7", 
      "idp_conflict": 392000, "idp_disaster": 25000, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 29, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103028"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "566", "name": { "fr": "Nigéria", "en": "Nigeria" }, "flag": "🇳🇬", "iso2": "ng", "retention": 65, "aid": 0.8, "stock": "1403281", "female": "45.5", 
      "history": [ { "year": 1990, "value": "456621" }, { "year": 2024, "value": "1403281" } ], "remittances": 7.84, "labour_participation": "84.7", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 3496000, "idp_disaster": 170000, "refugees_hosted": 0, "avoi": 32, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 32, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103259"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "Malgré une diaspora nombreuse au Royaume-Uni et aux États-Unis, les premières destinations réelles des Nigérians sont des pays voisins. Le Cameroun et le Niger accueillent à eux deux plus de 320 000 Nigérians — davantage que le Royaume-Uni (OIM, Rapport sur les migrations dans le monde 2024).", "en": "Despite a large diaspora in the UK and US, Nigerians' top real destinations are neighboring countries: Cameroon and Niger together host over 320,000 Nigerians, more than the UK (IOM, World Migration Report 2024)." },
      "impact": { "fr": "Le Nigéria perçoit 28% de l'ensemble des envois de fonds diasporiques du continent (Rapport UA 2021). De plus, c'est le seul pays échantillonné où les femmes sont majoritaires parmi les travailleurs migrants occupés (52,8%).", "en": "Nigeria receives 28% of all continental diaspora remittances (AU Report 2021). Furthermore, it is the only sampled country where women represent the majority of employed migrant workers (52.8%)." }
    },
    { 
      "id": "686", "name": { "fr": "Sénégal", "en": "Senegal" }, "flag": "🇸🇳", "iso2": "sn", "retention": 75, "aid": 4.2, "stock": "281867", "female": "47.0", 
      "history": [ { "year": 1990, "value": "270410" }, { "year": 2024, "value": "281867" } ], "remittances": 10.64, "labour_participation": "55.7", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "1.6", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 79, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 31, "total": 44, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103046"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "694", "name": { "fr": "Sierra Leone", "en": "Sierra Leone" }, "flag": "🇸🇱", "iso2": "sl", "retention": 80, "aid": 8.5, "stock": "49997", "female": "43.4", 
      "history": [ { "year": 1990, "value": "222148" }, { "year": 2024, "value": "49997" } ], "remittances": 4.6, "labour_participation": "68.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.6", 
      "idp_conflict": 0, "idp_disaster": 4500, "refugees_hosted": 0, "avoi": 81, 
      "normlex": {"fundamental": 11, "governance": 2, "technical": 33, "total": 46, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103212"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "768", "name": { "fr": "Togo", "en": "Togo" }, "flag": "🇹🇬", "iso2": "tg", "retention": 85, "aid": 4.5, "stock": "281994", "female": "49.3", 
      "history": [ { "year": 1990, "value": "84844" }, { "year": 2024, "value": "281994" } ], "remittances": 8.69, "labour_participation": "59.0", "remittances_year": 2020, "labour_participation_year": 2022, "evolution": "3.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 28, 
      "normlex": {"fundamental": 9, "governance": 4, "technical": 15, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103134"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_central": [
    { 
      "id": "24", "name": { "fr": "Angola", "en": "Angola" }, "flag": "🇦🇴", "iso2": "ao", "retention": 90, "aid": 0.5, "stock": "676507", "female": "49.5", 
      "history": [ { "year": 1990, "value": "33517" }, { "year": 2024, "value": "676507" } ], "remittances": 0.04, "labour_participation": "80.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 0, "idp_disaster": 27000, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 30, "total": 43, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102951"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "120", "name": { "fr": "Cameroun", "en": "Cameroon" }, "flag": "🇨🇲", "iso2": "cm", "retention": 85, "aid": 2.1, "stock": "642948", "female": "50.6", 
      "history": [ { "year": 1990, "value": "265967" }, { "year": 2024, "value": "642948" } ], "remittances": 1.29, "labour_participation": "84.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.2", 
      "idp_conflict": 954000, "idp_disaster": 50000, "refugees_hosted": 0, "avoi": 11, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 39, "total": 51, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102973"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "140", "name": { "fr": "Centrafrique", "en": "Central African Republic" }, "flag": "🇨🇫", "iso2": "cf", "retention": 95, "aid": 12.5, "stock": "94556", "female": "47.6", 
      "history": [ { "year": 1990, "value": "67234" }, { "year": 2024, "value": "94556" } ], "remittances": null, "labour_participation": "77.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 427000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 25, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 35, "total": 47, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103002"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "148", "name": { "fr": "Tchad", "en": "Chad" }, "flag": "🇹🇩", "iso2": "td", "retention": 95, "aid": 5.5, "stock": "1269673", "female": "55.6", 
      "history": [ { "year": 1990, "value": "74342" }, { "year": 2024, "value": "1269673" } ], "remittances": null, "labour_participation": "60.5", "remittances_year": null, "labour_participation_year": 2022, "evolution": "6.3", 
      "idp_conflict": 593000, "idp_disaster": 48000, "refugees_hosted": 1500000, "avoi": 28, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103022"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "178", "name": { "fr": "Congo", "en": "Congo" }, "flag": "🇨🇬", "iso2": "cg", "retention": 90, "aid": 2.5, "stock": "385589", "female": "45.5", 
      "history": [ { "year": 1990, "value": "129391" }, { "year": 2024, "value": "385589" } ], "remittances": 0.3, "labour_participation": "60.6", "remittances_year": 2021, "labour_participation_year": 2022, "evolution": "6.1", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 22, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 23, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103014"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "180", "name": { "fr": "R.D. Congo", "en": "DR Congo" }, "flag": "🇨🇩", "iso2": "cd", "retention": 95, "aid": 6.5, "stock": "1085090", "female": "51.8", 
      "history": [ { "year": 1990, "value": "754194" }, { "year": 2024, "value": "1085090" } ], "remittances": 3.65, "labour_participation": "62.3", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "1.0", 
      "idp_conflict": 4276000, "idp_disaster": 630000, "refugees_hosted": 0, "avoi": 14, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 27, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102981"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "Plus de 1,2 million de Congolais réfugiés sont hébergés en Afrique, près de la moitié en Ouganda seul (env. 560 000-575 000 personnes), avec le Burundi, la Tanzanie, le Rwanda et la Zambie comme autres pays d'accueil majeurs (HCR, 2025).", "en": "Over 1.2 million Congolese refugees are hosted across Africa, nearly half in Uganda alone (approx. 560,000-575,000 people), with Burundi, Tanzania, Rwanda, and Zambia as other major host countries (UNHCR, 2025)." }
    },
    {
      "id": "226", "name": { "fr": "Guinée Équatoriale", "en": "Equatorial Guinea" }, "flag": "🇬🇶", "iso2": "gq", "retention": 98, "aid": 0.5, "stock": "248930", "female": "22.9", 
      "history": [ { "year": 1990, "value": "2740" }, { "year": 2024, "value": "248930" } ], "remittances": null, "labour_participation": "78.0", "remittances_year": null, "labour_participation_year": 2022, "evolution": "13.2", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 11, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 6, "total": 14, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103102"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "266", "name": { "fr": "Gabon", "en": "Gabon" }, "flag": "🇬🇦", "iso2": "ga", "retention": 95, "aid": 0.8, "stock": "449746", "female": "35.7", 
      "history": [ { "year": 1990, "value": "128188" }, { "year": 2024, "value": "449746" } ], "remittances": 0.13, "labour_participation": "64.7", "remittances_year": 2015, "labour_participation_year": 2022, "evolution": "17.7", 
      "idp_conflict": 0, "idp_disaster": 1500, "refugees_hosted": 0, "avoi": 17, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 30, "total": 42, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103008"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "678", "name": { "fr": "Sao Tomé-et-Principe", "en": "Sao Tome and Principe" }, "flag": "🇸🇹", "iso2": "st", "retention": 80, "aid": 10.5, "stock": "1955", "female": "50.1", 
      "history": [ { "year": 1990, "value": "5582" }, { "year": 2024, "value": "1955" } ], "remittances": 9.71, "labour_participation": "51.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 15, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 13, "total": 25, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103126"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "108", "name": { "fr": "Burundi", "en": "Burundi" }, "flag": "🇧🇮", "iso2": "bi", "retention": 95, "aid": 15.5, "stock": "387101", "female": "50.7", 
      "history": [ { "year": 1990, "value": "333110" }, { "year": 2024, "value": "387101" } ], "remittances": 8.12, "labour_participation": "69.7", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "2.6", 
      "idp_conflict": 6800, "idp_disaster": 82000, "refugees_hosted": 0, "avoi": 82, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 21, "total": 31, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102988"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "646", "name": { "fr": "Rwanda", "en": "Rwanda" }, "flag": "🇷🇼", "iso2": "rw", "retention": 95, "aid": 12.5, "stock": "513316", "female": "49.4", 
      "history": [ { "year": 1990, "value": "160024" }, { "year": 2024, "value": "513316" } ], "remittances": 3.42, "labour_participation": "63.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "3.6", 
      "idp_conflict": 0, "idp_disaster": 81, "refugees_hosted": 0, "avoi": 100, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 22, "total": 35, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103153"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": true, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_east": [
    { 
      "id": "174", "name": { "fr": "Comores", "en": "Comoros" }, "flag": "🇰🇲", "iso2": "km", "retention": 40, "aid": 10.2, "stock": "12449", "female": "51.6", 
      "history": [ { "year": 1990, "value": "14079" }, { "year": 2024, "value": "12449" } ], "remittances": 20.84, "labour_participation": "36.7", "remittances_year": 2023, "labour_participation_year": 2022, "evolution": "1.4", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 80, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 26, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103322"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "262", "name": { "fr": "Djibouti", "en": "Djibouti" }, "flag": "🇩🇯", "iso2": "dj", "retention": 90, "aid": 8.5, "stock": "125996", "female": "47.5", 
      "history": [ { "year": 1990, "value": "122221" }, { "year": 2024, "value": "125996" } ], "remittances": 1.35, "labour_participation": "44.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "10.8", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 80, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 58, "total": 70, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102996"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "232", "name": { "fr": "Érythrée", "en": "Eritrea" }, "flag": "🇪🇷", "iso2": "er", "retention": 85, "aid": 5.5, "stock": "12512", "female": "43.9", 
      "history": [ { "year": 1990, "value": "11848" }, { "year": 2024, "value": "12512" } ], "remittances": null, "labour_participation": "80.6", "remittances_year": null, "labour_participation_year": 2022, "evolution": "0.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 81, 
      "normlex": {"fundamental": 8, "governance": 0, "technical": 0, "total": 8, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103290"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "231", "name": { "fr": "Éthiopie", "en": "Ethiopia" }, "flag": "🇪🇹", "iso2": "et", "retention": 90, "aid": 3.5, "stock": "1168455", "female": "49.7", 
      "history": [ { "year": 1990, "value": "875325" }, { "year": 2024, "value": "1168455" } ], "remittances": 4.77, "labour_participation": "65.1", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.9", 
      "idp_conflict": 2378000, "idp_disaster": 757000, "refugees_hosted": 521400, "avoi": 73, 
      "normlex": {"fundamental": 9, "governance": 1, "technical": 13, "total": 23, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102950"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "404", "name": { "fr": "Kenya", "en": "Kenya" }, "flag": "🇰🇪", "iso2": "ke", "retention": 85, "aid": 2.8, "stock": "992536", "female": "49.5", 
      "history": [ { "year": 1990, "value": "298089" }, { "year": 2024, "value": "992536" } ], "remittances": 4.15, "labour_participation": "64.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.8", 
      "idp_conflict": 10000, "idp_disaster": 3800, "refugees_hosted": 0, "avoi": 96, 
      "normlex": {"fundamental": 7, "governance": 3, "technical": 42, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103315"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "450", "name": { "fr": "Madagascar", "en": "Madagascar" }, "flag": "🇲🇬", "iso2": "mg", "retention": 80, "aid": 4.5, "stock": "38625", "female": "43.0", 
      "history": [ { "year": 1990, "value": "23917" }, { "year": 2024, "value": "38625" } ], "remittances": 2.31, "labour_participation": "71.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.1", 
      "idp_conflict": 0, "idp_disaster": 70000, "refugees_hosted": 0, "avoi": 79, 
      "normlex": {"fundamental": 11, "governance": 4, "technical": 38, "total": 53, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102956"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "480", "name": { "fr": "Maurice", "en": "Mauritius" }, "flag": "🇲🇺", "iso2": "mu", "retention": 60, "aid": 0.5, "stock": "29142", "female": "44.6", 
      "history": [ { "year": 1990, "value": "3613" }, { "year": 2024, "value": "29142" } ], "remittances": 1.92, "labour_participation": "73.4", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.3", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 83, 
      "normlex": {"fundamental": 10, "governance": 2, "technical": 40, "total": 52, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103139"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": false, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "690", "name": { "fr": "Seychelles", "en": "Seychelles" }, "flag": "🇸🇨", "iso2": "sc", "retention": 60, "aid": 1.5, "stock": "13261", "female": "30.0", 
      "history": [ { "year": 1990, "value": "3721" }, { "year": 2024, "value": "13261" } ], "remittances": 0.54, "labour_participation": null, "remittances_year": 2024, "labour_participation_year": null, "evolution": "10.2", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 100,
      "normlex": {"fundamental": 9, "governance": 2, "technical": 27, "total": 38, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103310"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "706", "name": { "fr": "Somalie", "en": "Somalia" }, "flag": "🇸🇴", "iso2": "so", "retention": 95, "aid": 15.5, "stock": "77972", "female": "44.9", 
      "history": [ { "year": 1990, "value": "478294" }, { "year": 2024, "value": "77972" } ], "remittances": null, "labour_participation": "41.2", "remittances_year": null, "labour_participation_year": 2022, "evolution": "0.4", 
      "idp_conflict": 3347000, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 19, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 17, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103112"},
      "au_treaties": { "constitutive": true, "abuja": false, "refugees_1969": false, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc,
      "origDest": { "fr": "Le Kenya et l'Éthiopie hébergent l'essentiel des réfugiés somaliens sur le continent — près de 450 000 rien qu'au Kenya, dont la majorité dans le seul complexe de camps de Dadaab, ouvert depuis plus de trois décennies (HCR, 2025).", "en": "Kenya and Ethiopia host the bulk of Somali refugees on the continent — nearly 450,000 in Kenya alone, most of them in the Dadaab camp complex, open for more than three decades (UNHCR, 2025)." }
    },
    {
      "id": "728", "name": { "fr": "Soudan du Sud", "en": "South Sudan" }, "flag": "🇸🇸", "iso2": "ss", "retention": 98, "aid": 20.5, "stock": "914001", "female": "49.7", 
      "history": [ { "year": 1990, "value": "652365" }, { "year": 2024, "value": "914001" } ], "remittances": 9.49, "labour_participation": "76.8", "remittances_year": 2015, "labour_participation_year": 2022, "evolution": "8.0", 
      "idp_conflict": 945000, "idp_disaster": 630000, "refugees_hosted": 571100, "avoi": 9, 
      "normlex": {"fundamental": 7, "governance": 0, "technical": 0, "total": 7, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103154"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "729", "name": { "fr": "Soudan", "en": "Sudan" }, "flag": "🇸🇩", "iso2": "sd", "retention": 90, "aid": 5.5, "stock": "2397113", "female": "50.3", 
      "history": [ { "year": 1990, "value": "1402896" }, { "year": 2024, "value": "2397113" } ], "remittances": 2.9, "labour_participation": "28.9", "remittances_year": 2022, "labour_participation_year": 2022, "evolution": "4.8", 
      "idp_conflict": 9117000, "idp_disaster": 0, "refugees_hosted": 635000, "avoi": 3, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:102958"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": false },
      ...genericDesc 
    },
    { 
      "id": "834", "name": { "fr": "Tanzanie", "en": "Tanzania" }, "flag": "🇹🇿", "iso2": "tz", "retention": 90, "aid": 3.5, "stock": "462371", "female": "50.0", 
      "history": [ { "year": 1990, "value": "574025" }, { "year": 2024, "value": "462371" } ], "remittances": 1.42, "labour_participation": "78.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 6300, "refugees_hosted": 0, "avoi": 71, 
      "normlex": {"fundamental": 8, "governance": 1, "technical": 28, "total": 37, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103136"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "800", "name": { "fr": "Ouganda", "en": "Uganda" }, "flag": "🇺🇬", "iso2": "ug", "retention": 95, "aid": 6.5, "stock": "2057759", "female": "55.0", 
      "history": [ { "year": 1990, "value": "560570" }, { "year": 2024, "value": "2057759" } ], "remittances": 2.65, "labour_participation": "68.9", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 2000, "idp_disaster": 20000, "refugees_hosted": 1900000, "avoi": 40, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 21, "total": 32, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103324"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ],
  "af_south": [
    { 
      "id": "454", "name": { "fr": "Malawi", "en": "Malawi" }, "flag": "🇲🇼", "iso2": "mw", "retention": 90, "aid": 9.5, "stock": "186719", "female": "51.1", 
      "history": [ { "year": 1990, "value": "1127724" }, { "year": 2024, "value": "186719" } ], "remittances": 1.65, "labour_participation": "70.2", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "0.8", 
      "idp_conflict": 0, "idp_disaster": 24000, "refugees_hosted": 0, "avoi": 47, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 19, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103138"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "508", "name": { "fr": "Mozambique", "en": "Mozambique" }, "flag": "🇲🇿", "iso2": "mz", "retention": 95, "aid": 10.5, "stock": "353143", "female": "51.2", 
      "history": [ { "year": 1990, "value": "122332" }, { "year": 2024, "value": "353143" } ], "remittances": 1.17, "labour_participation": "82.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.1", 
      "idp_conflict": 465000, "idp_disaster": 144000, "refugees_hosted": 0, "avoi": 84, 
      "normlex": {"fundamental": 11, "governance": 3, "technical": 12, "total": 26, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103149"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "894", "name": { "fr": "Zambie", "en": "Zambia" }, "flag": "🇿🇲", "iso2": "zm", "retention": 90, "aid": 4.5, "stock": "249205", "female": "48.1", 
      "history": [ { "year": 1990, "value": "279463" }, { "year": 2024, "value": "249205" } ], "remittances": 1.32, "labour_participation": "66.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "1.2", 
      "idp_conflict": 0, "idp_disaster": 2300, "refugees_hosted": 0, "avoi": 48, 
      "normlex": {"fundamental": 10, "governance": 4, "technical": 35, "total": 49, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103233"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "716", "name": { "fr": "Zimbabwe", "en": "Zimbabwe" }, "flag": "🇿🇼", "iso2": "zw", "retention": 85, "aid": 5.5, "stock": "429108", "female": "43.2", 
      "history": [ { "year": 1990, "value": "634621" }, { "year": 2024, "value": "429108" } ], "remittances": 8.45, "labour_participation": "69.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.6", 
      "idp_conflict": 0, "idp_disaster": 2200, "refugees_hosted": 0, "avoi": 47, 
      "normlex": {"fundamental": 10, "governance": 3, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103183"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc,
      "origDest": { "fr": "L'Afrique du Sud concentre à elle seule quatre diasporas zimbabwéennes sur cinq recensées officiellement (env. 773 000 personnes, Zimstat 2022) ; en juillet 2024, ce seul corridor représentait 92% de tous les mouvements frontaliers officiels du Zimbabwe (OIM).", "en": "South Africa alone accounts for four out of five officially recorded Zimbabwean diaspora members (approx. 773,000 people, Zimstat 2022); in July 2024, this single corridor accounted for 92% of all official cross-border movements out of Zimbabwe (IOM)." }
    },
    {
      "id": "72", "name": { "fr": "Botswana", "en": "Botswana" }, "flag": "🇧🇼", "iso2": "bw", "retention": 95, "aid": 0.8, "stock": "116402", "female": "43.0", 
      "history": [ { "year": 1990, "value": "27510" }, { "year": 2024, "value": "116402" } ], "remittances": 0.67, "labour_participation": "76.6", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.4", 
      "idp_conflict": 0, "idp_disaster": 7, "refugees_hosted": 0, "avoi": 34, 
      "normlex": {"fundamental": 8, "governance": 3, "technical": 6, "total": 17, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103184"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "748", "name": { "fr": "Eswatini", "en": "Eswatini" }, "flag": "🇸🇿", "iso2": "sz", "retention": 98, "aid": 5.5, "stock": "33268", "female": "48.5", 
      "history": [ { "year": 1990, "value": "74991" }, { "year": 2024, "value": "33268" } ], "remittances": 0.69, "labour_participation": "67.7", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "2.7", 
      "idp_conflict": 0, "idp_disaster": 8, "refugees_hosted": 0, "avoi": 32, 
      "normlex": {"fundamental": 8, "governance": 2, "technical": 23, "total": 33, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103185"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "426", "name": { "fr": "Lesotho", "en": "Lesotho" }, "flag": "🇱🇸", "iso2": "ls", "retention": 98, "aid": 8.5, "stock": "15039", "female": "45.8", 
      "history": [ { "year": 1990, "value": "8240" }, { "year": 2024, "value": "15039" } ], "remittances": 20.72, "labour_participation": "63.8", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "0.7", 
      "idp_conflict": 0, "idp_disaster": 0, "refugees_hosted": 0, "avoi": 30, 
      "normlex": {"fundamental": 11, "governance": 2, "technical": 14, "total": 27, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103186"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": true, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "516", "name": { "fr": "Namibie", "en": "Namibia" }, "flag": "🇳🇦", "iso2": "na", "retention": 95, "aid": 1.5, "stock": "116035", "female": "46.0", 
      "history": [ { "year": 1990, "value": "120641" }, { "year": 2024, "value": "116035" } ], "remittances": 0.71, "labour_participation": "70.3", "remittances_year": 2024, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 0, "idp_disaster": 1300, "refugees_hosted": 0, "avoi": 65, 
      "normlex": {"fundamental": 9, "governance": 3, "technical": 7, "total": 19, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103187"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    },
    { 
      "id": "710", "name": { "fr": "Afrique du Sud", "en": "South Africa" }, "flag": "🇿🇦", "iso2": "za", "retention": 95, "aid": 0.5, "stock": "2631100", "female": "41.9", 
      "history": [ { "year": 1990, "value": "1285707" }, { "year": 2024, "value": "2631100" } ], "remittances": 0.24, "labour_participation": "72.5", "remittances_year": 2025, "labour_participation_year": 2022, "evolution": "4.3", 
      "idp_conflict": 0, "idp_disaster": 28000, "refugees_hosted": 0, "avoi": 38, 
      "normlex": {"fundamental": 9, "governance": 2, "technical": 17, "total": 28, "link": "https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:11110:0::NO::P11110_COUNTRY_ID:103188"},
      "au_treaties": { "constitutive": true, "abuja": true, "refugees_1969": true, "kampala": false, "free_movement": false, "zlecaf": true },
      ...genericDesc 
    }
  ]
};
