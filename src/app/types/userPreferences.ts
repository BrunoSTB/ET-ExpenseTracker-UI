export interface UserPreferences {
  // ISO 4217 code, e.g. "BRL".
  currency: string;
  // BCP 47 tag used for number and date formatting, e.g. "pt-BR".
  locale: string;
}
