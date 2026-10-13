import {
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from "@jsverse/transloco";
import ptBR from "../assets/i18n/pt-BR.json";
import { AVAILABLE_LANGS, DEFAULT_LANG } from "../app/i18n/transloco";

// Add to a spec's TestBed `imports` to render real pt-BR translations
// synchronously, without HTTP:
//   TestBed.configureTestingModule({ imports: [MyComponent, getTranslocoModule()] })
export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: { "pt-BR": ptBR },
    translocoConfig: {
      availableLangs: AVAILABLE_LANGS,
      defaultLang: DEFAULT_LANG,
    },
    preloadLangs: true,
    ...options,
  });
}
