// Les langues de la plateforme.
//
// Le perimetre n'est pas choisi au hasard : c'est celui de l'article 25 de
// l'Acte constitutif de l'Union africaine, tel qu'amende par le Protocole sur
// les amendements — « les langues officielles de l'Union et de toutes ses
// institutions sont l'arabe, l'anglais, le francais, le portugais, l'espagnol,
// le kiswahili et toute autre langue africaine ».
// https://au.int/en/constitutive-act
//
// Un site qui parle des mobilites africaines depuis les institutions
// africaines se doit d'etre lisible dans les langues de ces institutions.
//
// `actives` distingue ce qui est reellement traduit de ce qui est prevu :
// declarer une langue avant d'avoir le texte donnerait au lecteur une coquille
// vide. On ajoute une entree a ACTIVES le jour ou son catalogue existe.

export const LANGUES = {
  fr: { tag: 'fr-FR', dir: 'ltr', endonyme: 'Français',  nom: { fr: 'Français',  en: 'French' } },
  en: { tag: 'en-GB', dir: 'ltr', endonyme: 'English',   nom: { fr: 'Anglais',   en: 'English' } },
  ar: { tag: 'ar',    dir: 'rtl', endonyme: 'العربية',    nom: { fr: 'Arabe',     en: 'Arabic' } },
  pt: { tag: 'pt-PT', dir: 'ltr', endonyme: 'Português', nom: { fr: 'Portugais', en: 'Portuguese' } },
  es: { tag: 'es-ES', dir: 'ltr', endonyme: 'Español',   nom: { fr: 'Espagnol',  en: 'Spanish' } },
  sw: { tag: 'sw',    dir: 'ltr', endonyme: 'Kiswahili', nom: { fr: 'Kiswahili', en: 'Kiswahili' } },
};

// Ce qui est effectivement servi aujourd'hui.
export const ACTIVES = ['fr', 'en', 'ar'];

// Ordre de repli. Le francais d'abord : c'est la langue de redaction, donc la
// seule ou aucune chaine ne manque. L'anglais ensuite. Un lecteur arabophone
// devant une fiche non encore traduite voit du francais — jamais un vide.
export const REPLI = ['fr', 'en'];

export const LANGUE_DEFAUT = 'fr';

export const estRTL = (lang) => (LANGUES[lang]?.dir || 'ltr') === 'rtl';
export const tagDe = (lang) => LANGUES[lang]?.tag || LANGUES[LANGUE_DEFAUT].tag;
