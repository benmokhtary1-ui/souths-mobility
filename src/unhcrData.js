// Donnees du Haut Commissariat des Nations unies pour les refugies (HCR),
// Refugee Data Finder — API publique api.unhcr.org, population par pays d’asile.
// Recuperees pour les pays du perimetre de la plateforme, millesimes 2014 et 2024.
//
// Champs : refugees (refugies sous mandat), asylum (demandeurs d’asile),
//          idps (deplaces internes suivis par le HCR), stateless (apatrides).
//
// Reserve : le HCR ne publie pas de ligne pour tous les pays chaque annee ;
// l’absence d’un pays signifie « non rapporte », pas necessairement zero.
// Les Seychelles et Sao Tome-et-Principe ne figurent pas dans la reponse 2024.
//
// Note de comparabilite : le total des deplaces internes suivis par le HCR
// differe de celui de l’IDMC utilise ailleurs sur la plateforme — les deux
// institutions n’ont ni le meme perimetre de suivi ni la meme methode. Les
// deux chiffres sont affiches plutot qu’harmonises.

export const unhcrByCountry = {
 "ao": {
  "2014": {
   "asylum": 30200,
   "idps": 0,
   "refugees": 15468,
   "stateless": 0
  },
  "2024": {
   "asylum": 30267,
   "idps": 0,
   "refugees": 25275,
   "stateless": 0
  }
 },
 "bf": {
  "2014": {
   "asylum": 201,
   "idps": 0,
   "refugees": 31894,
   "stateless": 0
  },
  "2024": {
   "asylum": 1493,
   "idps": 2062534,
   "refugees": 39915,
   "stateless": 0
  }
 },
 "bi": {
  "2014": {
   "asylum": 3046,
   "idps": 78948,
   "refugees": 52931,
   "stateless": 1302
  },
  "2024": {
   "asylum": 2089,
   "idps": 6877,
   "refugees": 89075,
   "stateless": 791
  }
 },
 "bj": {
  "2014": {
   "asylum": 68,
   "idps": 0,
   "refugees": 414,
   "stateless": 0
  },
  "2024": {
   "asylum": 6993,
   "idps": 8785,
   "refugees": 16232,
   "stateless": 0
  }
 },
 "bw": {
  "2014": {
   "asylum": 195,
   "idps": 0,
   "refugees": 2642,
   "stateless": 0
  },
  "2024": {
   "asylum": 7,
   "idps": 0,
   "refugees": 816,
   "stateless": 0
  }
 },
 "cd": {
  "2014": {
   "asylum": 1182,
   "idps": 2756585,
   "refugees": 119752,
   "stateless": 0
  },
  "2024": {
   "asylum": 1041,
   "idps": 6905511,
   "refugees": 517404,
   "stateless": 0
  }
 },
 "cf": {
  "2014": {
   "asylum": 408,
   "idps": 438538,
   "refugees": 7692,
   "stateless": 0
  },
  "2024": {
   "asylum": 8270,
   "idps": 469342,
   "refugees": 45108,
   "stateless": 0
  }
 },
 "cg": {
  "2014": {
   "asylum": 3192,
   "idps": 0,
   "refugees": 54842,
   "stateless": 0
  },
  "2024": {
   "asylum": 7714,
   "idps": 0,
   "refugees": 62052,
   "stateless": 0
  }
 },
 "ci": {
  "2014": {
   "asylum": 660,
   "idps": 24000,
   "refugees": 1918,
   "stateless": 700000
  },
  "2024": {
   "asylum": 66799,
   "idps": 0,
   "refugees": 2377,
   "stateless": 930978
  }
 },
 "cm": {
  "2014": {
   "asylum": 11736,
   "idps": 0,
   "refugees": 264122,
   "stateless": 0
  },
  "2024": {
   "asylum": 16034,
   "idps": 1036775,
   "refugees": 427706,
   "stateless": 0
  }
 },
 "cv": {
  "2014": {
   "asylum": 0,
   "idps": 0,
   "refugees": 0,
   "stateless": 115
  },
  "2024": {
   "asylum": 0,
   "idps": 0,
   "refugees": 0,
   "stateless": 115
  }
 },
 "dj": {
  "2014": {
   "asylum": 3832,
   "idps": 0,
   "refugees": 20525,
   "stateless": 0
  },
  "2024": {
   "asylum": 8649,
   "idps": 0,
   "refugees": 23987,
   "stateless": 0
  }
 },
 "dz": {
  "2014": {
   "asylum": 4864,
   "idps": 0,
   "refugees": 94119,
   "stateless": 0
  },
  "2024": {
   "asylum": 4838,
   "idps": 0,
   "refugees": 183368,
   "stateless": 0
  }
 },
 "eg": {
  "2014": {
   "asylum": 25603,
   "idps": 0,
   "refugees": 236085,
   "stateless": 20
  },
  "2024": {
   "asylum": 638948,
   "idps": 0,
   "refugees": 238014,
   "stateless": 5
  }
 },
 "er": {
  "2014": {
   "asylum": 0,
   "idps": 0,
   "refugees": 2898,
   "stateless": 0
  },
  "2024": {
   "asylum": 0,
   "idps": 0,
   "refugees": 119,
   "stateless": 0
  }
 },
 "et": {
  "2014": {
   "asylum": 4120,
   "idps": 0,
   "refugees": 659520,
   "stateless": 0
  },
  "2024": {
   "asylum": 63055,
   "idps": 2272533,
   "refugees": 1008826,
   "stateless": 0
  }
 },
 "ga": {
  "2014": {
   "asylum": 1884,
   "idps": 0,
   "refugees": 1007,
   "stateless": 0
  },
  "2024": {
   "asylum": 82,
   "idps": 0,
   "refugees": 179,
   "stateless": 0
  }
 },
 "gh": {
  "2014": {
   "asylum": 2634,
   "idps": 0,
   "refugees": 18448,
   "stateless": 0
  },
  "2024": {
   "asylum": 9855,
   "idps": 0,
   "refugees": 7479,
   "stateless": 0
  }
 },
 "gm": {
  "2014": {
   "asylum": 0,
   "idps": 0,
   "refugees": 11606,
   "stateless": 0
  },
  "2024": {
   "asylum": 447,
   "idps": 0,
   "refugees": 3964,
   "stateless": 0
  }
 },
 "gn": {
  "2014": {
   "asylum": 283,
   "idps": 0,
   "refugees": 8763,
   "stateless": 0
  },
  "2024": {
   "asylum": 172,
   "idps": 0,
   "refugees": 2171,
   "stateless": 0
  }
 },
 "gq": {
  "2024": {
   "asylum": 0,
   "idps": 0,
   "refugees": 5,
   "stateless": 0
  }
 },
 "gw": {
  "2014": {
   "asylum": 115,
   "idps": 0,
   "refugees": 8685,
   "stateless": 0
  },
  "2024": {
   "asylum": 30,
   "idps": 0,
   "refugees": 24,
   "stateless": 0
  }
 },
 "ke": {
  "2014": {
   "asylum": 33994,
   "idps": 0,
   "refugees": 551351,
   "stateless": 20000
  },
  "2024": {
   "asylum": 219647,
   "idps": 0,
   "refugees": 604257,
   "stateless": 9800
  }
 },
 "km": {
  "2024": {
   "asylum": 13,
   "idps": 0,
   "refugees": 5,
   "stateless": 0
  }
 },
 "lr": {
  "2014": {
   "asylum": 33,
   "idps": 0,
   "refugees": 38586,
   "stateless": 0
  },
  "2024": {
   "asylum": 687,
   "idps": 0,
   "refugees": 1167,
   "stateless": 0
  }
 },
 "ls": {
  "2014": {
   "asylum": 0,
   "idps": 0,
   "refugees": 43,
   "stateless": 0
  },
  "2024": {
   "asylum": 191,
   "idps": 0,
   "refugees": 419,
   "stateless": 0
  }
 },
 "ly": {
  "2014": {
   "asylum": 8886,
   "idps": 363067,
   "refugees": 27964,
   "stateless": 0
  },
  "2024": {
   "asylum": 76675,
   "idps": 32791,
   "refugees": 200335,
   "stateless": 0
  }
 },
 "ma": {
  "2014": {
   "asylum": 1828,
   "idps": 0,
   "refugees": 1205,
   "stateless": 0
  },
  "2024": {
   "asylum": 11378,
   "idps": 0,
   "refugees": 7470,
   "stateless": 0
  }
 },
 "mg": {
  "2014": {
   "asylum": 5,
   "idps": 0,
   "refugees": 11,
   "stateless": 0
  },
  "2024": {
   "asylum": 1173,
   "idps": 0,
   "refugees": 83,
   "stateless": 0
  }
 },
 "ml": {
  "2014": {
   "asylum": 633,
   "idps": 99816,
   "refugees": 15193,
   "stateless": 0
  },
  "2024": {
   "asylum": 294,
   "idps": 360591,
   "refugees": 135533,
   "stateless": 0
  }
 },
 "mr": {
  "2014": {
   "asylum": 417,
   "idps": 0,
   "refugees": 75628,
   "stateless": 0
  },
  "2024": {
   "asylum": 7084,
   "idps": 0,
   "refugees": 155193,
   "stateless": 0
  }
 },
 "mu": {
  "2024": {
   "asylum": 72,
   "idps": 0,
   "refugees": 10,
   "stateless": 0
  }
 },
 "mw": {
  "2014": {
   "asylum": 14493,
   "idps": 0,
   "refugees": 5871,
   "stateless": 0
  },
  "2024": {
   "asylum": 21149,
   "idps": 0,
   "refugees": 35510,
   "stateless": 0
  }
 },
 "mz": {
  "2014": {
   "asylum": 13316,
   "idps": 0,
   "refugees": 4534,
   "stateless": 0
  },
  "2024": {
   "asylum": 18880,
   "idps": 577545,
   "refugees": 5370,
   "stateless": 0
  }
 },
 "na": {
  "2014": {
   "asylum": 816,
   "idps": 0,
   "refugees": 1765,
   "stateless": 0
  },
  "2024": {
   "asylum": 1317,
   "idps": 0,
   "refugees": 5258,
   "stateless": 14796
  }
 },
 "ne": {
  "2014": {
   "asylum": 103,
   "idps": 0,
   "refugees": 77826,
   "stateless": 0
  },
  "2024": {
   "asylum": 51959,
   "idps": 507438,
   "refugees": 369836,
   "stateless": 0
  }
 },
 "ng": {
  "2014": {
   "asylum": 848,
   "idps": 1188018,
   "refugees": 1237,
   "stateless": 0
  },
  "2024": {
   "asylum": 30744,
   "idps": 3432959,
   "refugees": 96387,
   "stateless": 0
  }
 },
 "rw": {
  "2014": {
   "asylum": 218,
   "idps": 0,
   "refugees": 73822,
   "stateless": 0
  },
  "2024": {
   "asylum": 14193,
   "idps": 0,
   "refugees": 114368,
   "stateless": 14500
  }
 },
 "sd": {
  "2014": {
   "asylum": 10194,
   "idps": 2192830,
   "refugees": 277818,
   "stateless": 0
  },
  "2024": {
   "asylum": 44593,
   "idps": 11559970,
   "refugees": 793395,
   "stateless": 0
  }
 },
 "sl": {
  "2014": {
   "asylum": 12,
   "idps": 0,
   "refugees": 1371,
   "stateless": 0
  },
  "2024": {
   "asylum": 0,
   "idps": 0,
   "refugees": 0,
   "stateless": 0
  }
 },
 "sn": {
  "2014": {
   "asylum": 2911,
   "idps": 0,
   "refugees": 14267,
   "stateless": 0
  },
  "2024": {
   "asylum": 1228,
   "idps": 0,
   "refugees": 11836,
   "stateless": 0
  }
 },
 "so": {
  "2014": {
   "asylum": 9262,
   "idps": 1133000,
   "refugees": 2732,
   "stateless": 0
  },
  "2024": {
   "asylum": 22260,
   "idps": 3861643,
   "refugees": 19503,
   "stateless": 0
  }
 },
 "ss": {
  "2014": {
   "asylum": 128,
   "idps": 1645392,
   "refugees": 248152,
   "stateless": 0
  },
  "2024": {
   "asylum": 2677,
   "idps": 944631,
   "refugees": 514794,
   "stateless": 18000
  }
 },
 "sz": {
  "2014": {
   "asylum": 266,
   "idps": 0,
   "refugees": 511,
   "stateless": 0
  },
  "2024": {
   "asylum": 3164,
   "idps": 0,
   "refugees": 1295,
   "stateless": 0
  }
 },
 "td": {
  "2014": {
   "asylum": 1793,
   "idps": 0,
   "refugees": 452897,
   "stateless": 0
  },
  "2024": {
   "asylum": 7779,
   "idps": 220610,
   "refugees": 1278866,
   "stateless": 0
  }
 },
 "tg": {
  "2014": {
   "asylum": 710,
   "idps": 0,
   "refugees": 21773,
   "stateless": 0
  },
  "2024": {
   "asylum": 1262,
   "idps": 9680,
   "refugees": 47494,
   "stateless": 0
  }
 },
 "tn": {
  "2014": {
   "asylum": 223,
   "idps": 0,
   "refugees": 895,
   "stateless": 0
  },
  "2024": {
   "asylum": 9620,
   "idps": 0,
   "refugees": 2955,
   "stateless": 0
  }
 },
 "tz": {
  "2014": {
   "asylum": 883,
   "idps": 0,
   "refugees": 88492,
   "stateless": 0
  },
  "2024": {
   "asylum": 41264,
   "idps": 0,
   "refugees": 176859,
   "stateless": 0
  }
 },
 "ug": {
  "2014": {
   "asylum": 35468,
   "idps": 0,
   "refugees": 385503,
   "stateless": 0
  },
  "2024": {
   "asylum": 37105,
   "idps": 0,
   "refugees": 1759492,
   "stateless": 10284
  }
 },
 "za": {
  "2014": {
   "asylum": 463909,
   "idps": 0,
   "refugees": 112182,
   "stateless": 0
  },
  "2024": {
   "asylum": 100313,
   "idps": 0,
   "refugees": 71171,
   "stateless": 0
  }
 },
 "zm": {
  "2014": {
   "asylum": 2174,
   "idps": 0,
   "refugees": 25566,
   "stateless": 0
  },
  "2024": {
   "asylum": 9643,
   "idps": 0,
   "refugees": 79275,
   "stateless": 0
  }
 },
 "zw": {
  "2014": {
   "asylum": 642,
   "idps": 0,
   "refugees": 6076,
   "stateless": 0
  },
  "2024": {
   "asylum": 13192,
   "idps": 0,
   "refugees": 9240,
   "stateless": 0
  }
 }
};

export const unhcrTotals = {
 "2024": {
  "refugees": 9191472,
  "asylum": 1616339,
  "idps": 34270215,
  "stateless": 999269
 },
 "2014": {
  "refugees": 4126602,
  "asylum": 698388,
  "idps": 9920194,
  "stateless": 721437
 }
};

export const UNHCR_SOURCE = {
  label: {
    fr: "HCR — Refugee Data Finder (population par pays d’asile, 2014 et 2024)",
    en: 'UNHCR — Refugee Data Finder (population by country of asylum, 2014 and 2024)',
  },
  url: 'https://www.unhcr.org/refugee-statistics',
  api: 'https://api.unhcr.org/docs/refugee-statistics.html',
};
