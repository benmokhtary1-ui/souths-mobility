// Recensements nationaux africains, cycles 1970 a 2030.
// Compilation de l'auteur (Y. Ben Mokhtar) d'apres les donnees de la Division de
// statistique des Nations unies (UNSD) et d'UN DESA. Transcrit depuis la base source.
// Notes : * territoire non independant a la date du recensement ;
//         ** recensement conduit par l'Ethiopie ; *** periode du regime d'apartheid.
// Statuts et dates du cycle 2020 audites en aout 2026 sur sources nationales :
// six des neuf operations declarees « prevues » ou « en cours » ont eu lieu, mais
// cinq apres la cloture du cycle (31/12/2024) — elles ouvrent la serie 2030.

export const censusRoundMeta = [
  { key: "r1970", label: { fr: "Cycle 1970", en: "1970 round" }, span: "1965-1974", conducted: 24, base: 43, pct: 55 },
  { key: "r1980", label: { fr: "Cycle 1980", en: "1980 round" }, span: "1975-1984", conducted: 48, base: 51, pct: 94 },
  { key: "r1990", label: { fr: "Cycle 1990", en: "1990 round" }, span: "1985-1994", conducted: 44, base: 53, pct: 83 },
  { key: "r2000", label: { fr: "Cycle 2000", en: "2000 round" }, span: "1995-2004", conducted: 38, base: 54, pct: 70 },
  { key: "r2010", label: { fr: "Cycle 2010", en: "2010 round" }, span: "2005-2014", conducted: 47, base: 54, pct: 87 },
  { key: "r2020", label: { fr: "Cycle 2020", en: "2020 round" }, span: "2015-2024", conducted: 35, base: 54, pct: 64 },
  { key: "r2030", label: { fr: "Cycle 2030", en: "2030 round" }, span: "2025-2034", conducted: 4, base: 54, pct: 7, inProgress: true },
];

export const census2020Status = {
  conducted: { fr: "Effectué", en: "Conducted", count: 35, cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  started:   { fr: "En cours", en: "Under way", count: 1,  cls: "text-amber-700 bg-amber-50 border-amber-200" },
  late:      { fr: "Réalisé hors cycle", en: "Conducted after the round", count: 4, cls: "text-violet-700 bg-violet-50 border-violet-200" },
  planned:   { fr: "Prévu",    en: "Planned",   count: 2, cls: "text-rose-700 bg-rose-50 border-rose-200" },
  none:      { fr: "Non prévu", en: "Not planned", count: 12, cls: "text-slate-500 bg-slate-100 border-slate-200" },
};

export const censusByCountry = {
 "dz": {
  "name": "Algeria",
  "r1970": "04/04/1966",
  "r1980": "12/01/1977",
  "r1990": "20/04/1987",
  "r2000": "25/06/1998",
  "r2010": "16/04/2008",
  "r2020": "06/2018",
  "status2020": "conducted"
 },
 "ao": {
  "name": "Angola",
  "r1970": "15/12/1970*",
  "r1980": "",
  "r1990": "",
  "r2000": "",
  "r2010": "16/05/2014",
  "r2020": "19/09/2024",
  "status2020": "conducted",
  "updated2026": { "fr": "Censo 2024, date de référence 19/09/2024 (INE Angola, résultats définitifs)", "en": "Censo 2024, reference date 19/09/2024 (INE Angola, final results)" }
 },
 "bj": {
  "name": "Benin",
  "r1970": "",
  "r1980": "30/03/1979",
  "r1990": "15/02/1992",
  "r2000": "11/02/2002",
  "r2010": "10/05/2013",
  "r2020": "",
  "status2020": "started",
  "updated2026": { "fr": "RGPH5 : cartographie censitaire engagée depuis 03/2024, dénombrement pilote en avril 2025 ; le dénombrement général n'est pas achevé (INStaD).", "en": "5th census: census mapping under way since 03/2024, pilot enumeration April 2025; the general enumeration is not complete (INStaD)." }
 },
 "bw": {
  "name": "Botswana",
  "r1970": "31/08/1971",
  "r1980": "26/08/1981",
  "r1990": "23/08/1991",
  "r2000": "26/08/2001",
  "r2010": "09/08/2011",
  "r2020": "2022",
  "status2020": "conducted"
 },
 "bf": {
  "name": "Burkina Faso",
  "r1970": "",
  "r1980": "07/12/1975",
  "r1990": "20/12/1985",
  "r2000": "20/12/1996",
  "r2010": "09/12/2006",
  "r2020": "2019",
  "status2020": "conducted"
 },
 "bi": {
  "name": "Burundi",
  "r1970": "",
  "r1980": "16/08/1979",
  "r1990": "16/08/1990",
  "r2000": "",
  "r2010": "16/08/2008",
  "r2020": "",
  "status2020": "none"
 },
 "cm": {
  "name": "Cameroon",
  "r1970": "",
  "r1980": "09/04/1976",
  "r1990": "28/04/1987",
  "r2000": "",
  "r2010": "11/11/2005",
  "r2020": "",
  "status2020": "late",
  "r2030": "04/2026",
  "updated2026": { "fr": "RGPH-4, dénombrement du 24/04 au 29/05/2026, couplé au recensement général de l'agriculture et de l'élevage (BUCREP). Recensement précédent : 2005.", "en": "4th census, enumeration 24/04–29/05/2026, coupled with the agriculture and livestock census (BUCREP). Previous census: 2005." }
 },
 "cv": {
  "name": "Cape Verde",
  "r1970": "15/12/1970*",
  "r1980": "02/06/1980",
  "r1990": "23/06/1990",
  "r2000": "30/06/2000",
  "r2010": "16/06/2010",
  "r2020": "2021",
  "status2020": "conducted"
 },
 "cf": {
  "name": "Central African Rep.",
  "r1970": "",
  "r1980": "22/12/1975",
  "r1990": "08/12/1988",
  "r2000": "08/12/2003",
  "r2010": "",
  "r2020": "",
  "status2020": "late",
  "r2030": "12/2025",
  "updated2026": { "fr": "RGPH-4, dénombrement du 8 au 26 décembre 2025, activités post-dénombrement validées en février 2026 (ICASEES). Recensement précédent : 2003.", "en": "4th census, enumeration 8–26 December 2025, post-enumeration activities validated February 2026 (ICASEES). Previous census: 2003." }
 },
 "td": {
  "name": "Chad",
  "r1970": "",
  "r1980": "",
  "r1990": "15/04/1993",
  "r2000": "",
  "r2010": "20/05/2009",
  "r2020": "",
  "status2020": "late",
  "r2030": "06/2026",
  "updated2026": { "fr": "RGPH-3, dénombrement du 20/06 au 06/08/2026, 4 314 752 ménages recensés ; premier recensement entièrement numérique du pays (INSEED). Recensement précédent : 2009.", "en": "3rd census, enumeration 20/06–06/08/2026, 4,314,752 households enumerated; the country's first fully digital census (INSEED). Previous census: 2009." }
 },
 "km": {
  "name": "Comoros",
  "r1970": "09/07/1966*",
  "r1980": "15/09/1980",
  "r1990": "15/09/1991",
  "r2000": "09/2003",
  "r2010": "",
  "r2020": "12/2017",
  "status2020": "conducted"
 },
 "cd": {
  "name": "Congo (Dem. Rep.)",
  "r1970": "07/1974*",
  "r1980": "22/11/1984",
  "r1990": "",
  "r2000": "",
  "r2010": "",
  "r2020": "",
  "status2020": "none"
 },
 "cg": {
  "name": "Congo (Rep.)",
  "r1970": "02/07/1974",
  "r1980": "22/11/1984",
  "r1990": "",
  "r2000": "30/06/1996",
  "r2010": "28/04/2007",
  "r2020": "",
  "status2020": "none"
 },
 "ci": {
  "name": "Cote d'Ivoire",
  "r1970": "",
  "r1980": "30/04/1975",
  "r1990": "01/03/1988",
  "r2000": "21/11/1998",
  "r2010": "17/03/2014",
  "r2020": "14/12/2021",
  "status2020": "conducted"
 },
 "dj": {
  "name": "Djibouti",
  "r1970": "17/03/1967*",
  "r1980": "01/03/1983",
  "r1990": "",
  "r2000": "",
  "r2010": "29/05/2009",
  "r2020": "",
  "status2020": "none"
 },
 "eg": {
  "name": "Egypt",
  "r1970": "30/05/1966",
  "r1980": "23/11/1976",
  "r1990": "18/11/1986",
  "r2000": "19/11/1996",
  "r2010": "26/11/2006",
  "r2020": "18/04/2017",
  "status2020": "conducted"
 },
 "gq": {
  "name": "Equatorial Guinea",
  "r1970": "",
  "r1980": "05/08/1983",
  "r1990": "05/10/1994",
  "r2000": "09/2001",
  "r2010": "09/07/2015",
  "r2020": "",
  "status2020": "none"
 },
 "er": {
  "name": "Eritrea",
  "r1970": "",
  "r1980": "09/05/1984**",
  "r1990": "",
  "r2000": "",
  "r2010": "",
  "r2020": "",
  "status2020": "none"
 },
 "et": {
  "name": "Ethiopia",
  "r1970": "",
  "r1980": "09/05/1984",
  "r1990": "27/10/1994",
  "r2000": "",
  "r2010": "11/2007",
  "r2020": "",
  "status2020": "none"
 },
 "ga": {
  "name": "Gabon",
  "r1970": "06/1970",
  "r1980": "31/08/1980",
  "r1990": "31/07/1993",
  "r2000": "12/2003",
  "r2010": "12/2013",
  "r2020": "",
  "status2020": "late",
  "r2030": "05/2026",
  "updated2026": { "fr": "RGPL, collecte achevée le 25/05/2026, résultats provisoires remis le 08/07/2026, couverture de 97 % ; homologation en cours devant la Cour constitutionnelle. Recensement précédent : 2013.", "en": "RGPL, collection completed 25/05/2026, provisional results delivered 08/07/2026, 97 % coverage; homologation pending before the Constitutional Court. Previous census: 2013." }
 },
 "gm": {
  "name": "Gambia, The",
  "r1970": "21/04/1973",
  "r1980": "11/04/1983",
  "r1990": "15/04/1993",
  "r2000": "15/04/2003",
  "r2010": "04/2013",
  "r2020": "05/2024",
  "status2020": "conducted",
  "updated2026": { "fr": "PHC 2024, dénombrement de mai-juin 2024, rapport préliminaire en septembre 2024 (GBoS)", "en": "2024 PHC, enumeration May–June 2024, preliminary report September 2024 (GBoS)" }
 },
 "gh": {
  "name": "Ghana",
  "r1970": "01/03/1970",
  "r1980": "11/03/1984",
  "r1990": "",
  "r2000": "27/03/2000",
  "r2010": "26/09/2010",
  "r2020": "27/06/2021",
  "status2020": "conducted"
 },
 "gn": {
  "name": "Guinea",
  "r1970": "",
  "r1980": "",
  "r1990": "02/1983",
  "r2000": "15/12/1996",
  "r2010": "02/04/2014",
  "r2020": "",
  "status2020": "none"
 },
 "gw": {
  "name": "Guinea-Bissau",
  "r1970": "15/12/1970*",
  "r1980": "30/04/1979",
  "r1990": "01/12/1991",
  "r2000": "12/2001",
  "r2010": "15/03/2009",
  "r2020": "",
  "status2020": "none"
 },
 "ke": {
  "name": "Kenya",
  "r1970": "25/08/1969",
  "r1980": "25/08/1979",
  "r1990": "24/08/1989",
  "r2000": "24/08/1999",
  "r2010": "24/08/2009",
  "r2020": "25/08/2019",
  "status2020": "conducted"
 },
 "ls": {
  "name": "Lesotho",
  "r1970": "24/04/1966",
  "r1980": "12/04/1976",
  "r1990": "14/04/1986",
  "r2000": "19/04/1996",
  "r2010": "13/06/2006",
  "r2020": "29/04/2016",
  "status2020": "conducted"
 },
 "lr": {
  "name": "Liberia",
  "r1970": "01/02/1974",
  "r1980": "14/02/1984",
  "r1990": "",
  "r2000": "",
  "r2010": "21/03/2008",
  "r2020": "11/11/2022",
  "status2020": "conducted"
 },
 "ly": {
  "name": "Libya",
  "r1970": "31/07/1973",
  "r1980": "31/07/1984",
  "r1990": "",
  "r2000": "1995",
  "r2010": "2006",
  "r2020": "",
  "status2020": "none"
 },
 "mg": {
  "name": "Madagascar",
  "r1970": "",
  "r1980": "18/08/1975",
  "r1990": "19/08/1993",
  "r2000": "",
  "r2010": "",
  "r2020": "20/06/2018",
  "status2020": "conducted"
 },
 "mw": {
  "name": "Malawi",
  "r1970": "09/08/1966",
  "r1980": "20/09/1977",
  "r1990": "21/09/1987",
  "r2000": "",
  "r2010": "08/06/2008",
  "r2020": "2018",
  "status2020": "conducted"
 },
 "ml": {
  "name": "Mali",
  "r1970": "",
  "r1980": "16/12/1976",
  "r1990": "14/04/1987",
  "r2000": "14/04/1998",
  "r2010": "14/04/2009",
  "r2020": "31/12/2022",
  "status2020": "conducted"
 },
 "mr": {
  "name": "Mauritania",
  "r1970": "",
  "r1980": "30/04/1977",
  "r1990": "15/09/1988",
  "r2000": "20/04/2001",
  "r2010": "25/06/2013",
  "r2020": "09/01/2024",
  "status2020": "conducted"
 },
 "mu": {
  "name": "Mauritius",
  "r1970": "15/06/1972",
  "r1980": "03/07/1983",
  "r1990": "01/07/1990",
  "r2000": "03/07/2000",
  "r2010": "04/07/2011",
  "r2020": "01/08/2022",
  "status2020": "conducted"
 },
 "ma": {
  "name": "Morocco",
  "r1970": "20/07/1971",
  "r1980": "21/09/1982",
  "r1990": "04/09/1994",
  "r2000": "09/2004",
  "r2010": "09/2014",
  "r2020": "01/09/2024",
  "status2020": "conducted",
  "updated2026": { "fr": "RGPH 2024, date de référence 01/09/2024 (HCP Maroc)", "en": "2024 census, reference date 01/09/2024 (HCP Morocco)" }
 },
 "mz": {
  "name": "Mozambique",
  "r1970": "15/12/1970*",
  "r1980": "01/08/1980",
  "r1990": "",
  "r2000": "15/08/1997",
  "r2010": "01/08/2007",
  "r2020": "15/08/2017",
  "status2020": "conducted"
 },
 "na": {
  "name": "Namibia",
  "r1970": "06/05/1970*",
  "r1980": "28/08/1981*",
  "r1990": "21/10/1991",
  "r2000": "11/09/2001",
  "r2010": "28/08/2011",
  "r2020": "08/2023",
  "status2020": "conducted"
 },
 "ne": {
  "name": "Niger",
  "r1970": "",
  "r1980": "08/1978",
  "r1990": "03/06/1988",
  "r2000": "18/06/2001",
  "r2010": "24/12/2012",
  "r2020": "12/2022",
  "status2020": "conducted"
 },
 "ng": {
  "name": "Nigeria",
  "r1970": "1962/63",
  "r1980": "02/12/1973",
  "r1990": "31/10/1991",
  "r2000": "",
  "r2010": "21/03/2006",
  "r2020": "12/2023",
  "status2020": "conducted"
 },
 "rw": {
  "name": "Rwanda",
  "r1970": "",
  "r1980": "31/08/1978",
  "r1990": "30/08/1991",
  "r2000": "30/08/2002",
  "r2010": "30/08/2012",
  "r2020": "30/08/2022",
  "status2020": "conducted"
 },
 "st": {
  "name": "Sao Tome and Principe",
  "r1970": "30/09/1970",
  "r1980": "15/08/1981",
  "r1990": "04/08/1991",
  "r2000": "08/09/2001",
  "r2010": "22/06/2012",
  "r2020": "15/11/2024",
  "status2020": "conducted",
  "updated2026": { "fr": "V RGPH, dénombrement du 15/11 au 15/12/2024 ; résultats provisoires : 209 617 habitants (INE São Tomé-et-Principe)", "en": "5th census, enumeration 15/11–15/12/2024; provisional result: 209,617 inhabitants (INE São Tomé and Príncipe)" }
 },
 "sn": {
  "name": "Senegal",
  "r1970": "",
  "r1980": "30/04/1976",
  "r1990": "03/06/1988",
  "r2000": "22/12/2002",
  "r2010": "10/12/2013",
  "r2020": "14/06/2023",
  "status2020": "conducted"
 },
 "sc": {
  "name": "Seychelles",
  "r1970": "05/05/1971",
  "r1980": "20/08/1977",
  "r1990": "08/1987",
  "r2000": "01/09/2002",
  "r2010": "30/08/2010",
  "r2020": "01/04/2022",
  "status2020": "conducted"
 },
 "sl": {
  "name": "Sierra Leone",
  "r1970": "04/1963",
  "r1980": "12/1974",
  "r1990": "12/1985",
  "r2000": "12/2004",
  "r2010": "12/2015",
  "r2020": "",
  "status2020": "planned",
  "updated2026": { "fr": "Recensement à mi-parcours conduit le 10/12/2021 (7 548 702 habitants). Le recensement décennal, repoussé de 2025, est fixé à décembre 2026, après un pilote lancé le 01/12/2025 (Stats SL).", "en": "Mid-term census conducted 10/12/2021 (7,548,702 inhabitants). The decennial census, pushed back from 2025, is set for December 2026, following a pilot launched 01/12/2025 (Stats SL)." }
 },
 "so": {
  "name": "Somalia",
  "r1970": "",
  "r1980": "1974",
  "r1990": "1986",
  "r2000": "",
  "r2010": "",
  "r2020": "",
  "status2020": "planned",
  "updated2026": { "fr": "Recensement « 2024 » lancé le 02/05/2023 mais jamais exécuté ; le SNBS prépare désormais la participation à la série 2030 (SNBS / UNFPA).", "en": "The “2024” census was launched on 02/05/2023 but never carried out; SNBS is now preparing participation in the 2030 series (SNBS / UNFPA)." }
 },
 "za": {
  "name": "South Africa",
  "r1970": "***",
  "r1980": "***",
  "r1990": "***",
  "r2000": "10/10/1996",
  "r2010": "10/10/2011",
  "r2020": "02/2022",
  "status2020": "conducted"
 },
 "sd": {
  "name": "Sudan",
  "r1970": "03/04/1973",
  "r1980": "01/02/1983",
  "r1990": "15/04/1993",
  "r2000": "",
  "r2010": "21/04/2008",
  "r2020": "",
  "status2020": "none"
 },
 "ss": {
  "name": "South Sudan",
  "r1970": "*",
  "r1980": "*",
  "r1990": "*",
  "r2000": "",
  "r2010": "",
  "r2020": "",
  "status2020": "none"
 },
 "sz": {
  "name": "Eswatini",
  "r1970": "24/05/1966*",
  "r1980": "25/08/1976",
  "r1990": "25/08/1986",
  "r2000": "12/12/1997",
  "r2010": "17/05/2007",
  "r2020": "15/05/2017",
  "status2020": "conducted"
 },
 "tz": {
  "name": "Tanzania",
  "r1970": "26/08/1967",
  "r1980": "26/08/1978",
  "r1990": "28/08/1988",
  "r2000": "25/08/2002",
  "r2010": "26/08/2012",
  "r2020": "23/08/2022",
  "status2020": "conducted"
 },
 "tg": {
  "name": "Togo",
  "r1970": "12/1960",
  "r1980": "30/04/1970",
  "r1990": "22/11/1981",
  "r2000": "",
  "r2010": "19/11/2010",
  "r2020": "11/2022",
  "status2020": "conducted"
 },
 "tn": {
  "name": "Tunisia",
  "r1970": "03/05/1966",
  "r1980": "08/05/1975",
  "r1990": "20/04/1994",
  "r2000": "28/04/2004",
  "r2010": "23/04/2014",
  "r2020": "06/11/2024",
  "status2020": "conducted",
  "updated2026": { "fr": "RGPH 2024, date de référence 06/11/2024 (INS Tunisie)", "en": "2024 census, reference date 06/11/2024 (INS Tunisia)" }
 },
 "ug": {
  "name": "Uganda",
  "r1970": "18/08/1969",
  "r1980": "18/01/1980",
  "r1990": "12/01/1991",
  "r2000": "13/09/2002",
  "r2010": "08/2014",
  "r2020": "05/2024",
  "status2020": "conducted",
  "updated2026": { "fr": "NPHC 2024, rapport final publié le 31/12/2024 (UBOS)", "en": "NPHC 2024, final report published 31/12/2024 (UBOS)" }
 },
 "zm": {
  "name": "Zambia",
  "r1970": "30/08/1969",
  "r1980": "25/07/1980",
  "r1990": "20/08/1990",
  "r2000": "25/10/2000",
  "r2010": "15/11/2010",
  "r2020": "08/09/2022",
  "status2020": "conducted"
 },
 "zw": {
  "name": "Zimbabwe",
  "r1970": "11/05/1969*",
  "r1980": "18/08/1982",
  "r1990": "18/08/1992",
  "r2000": "18/08/2002",
  "r2010": "18/08/2012",
  "r2020": "30/04/2022",
  "status2020": "conducted"
 }
};
