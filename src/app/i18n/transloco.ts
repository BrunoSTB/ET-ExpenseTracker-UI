import { HttpBackend, HttpClient } from "@angular/common/http";
import { inject, Injectable, isDevMode } from "@angular/core";
import {
  provideTransloco,
  Translation,
  TranslocoLoader,
} from "@jsverse/transloco";

export const AVAILABLE_LANGS = ["pt-BR"];
export const DEFAULT_LANG = "pt-BR";

// Translation files live in src/assets/i18n/<lang>.json.
@Injectable({ providedIn: "root" })
export class TranslocoHttpLoader implements TranslocoLoader {
  // Bypasses the interceptors so the API token isn't sent with static files.
  private http = new HttpClient(inject(HttpBackend));

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

export function provideAppTransloco() {
  return provideTransloco({
    config: {
      availableLangs: AVAILABLE_LANGS,
      defaultLang: DEFAULT_LANG,
      fallbackLang: DEFAULT_LANG,
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    loader: TranslocoHttpLoader,
  });
}
