export enum Language {
  ENGLISH = 'en',
  TAGALOG = 'tl',
  AKLANON = 'akl',
}

export interface LanguageOption {
  value: Language;
  label: string;
  fullName: string;
}