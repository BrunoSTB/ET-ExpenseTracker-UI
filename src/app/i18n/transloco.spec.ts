import { TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';

import { DEFAULT_LANG, TranslocoHttpLoader } from './transloco';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { SessionService } from '../services/session.service';
import { getTranslocoModule } from '../../testing/transloco-testing';

describe('TranslocoHttpLoader', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should load the translation file of the language', () => {
    let translation: unknown;
    TestBed.inject(TranslocoHttpLoader)
      .getTranslation('pt-BR')
      .subscribe((t) => (translation = t));

    const req = httpMock.expectOne('/assets/i18n/pt-BR.json');
    expect(req.request.method).toBe('GET');
    req.flush({ hello: 'olá' });

    expect(translation).toEqual({ hello: 'olá' });
  });

  it('should not send the API token with translation files', () => {
    TestBed.inject(SessionService).saveSession({
      username: 'bruno',
      accessToken: 'token-123',
    });

    TestBed.inject(TranslocoHttpLoader).getTranslation('pt-BR').subscribe();

    const req = httpMock.expectOne('/assets/i18n/pt-BR.json');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});

@Component({
  selector: 'app-translated',
  imports: [TranslocoPipe],
  template: `{{ 'bills.status.overdue' | transloco }}`,
  changeDetection: ChangeDetectionStrategy.Eager,
})
class TranslatedComponent {}

describe('getTranslocoModule', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslatedComponent, getTranslocoModule()],
    });
  });

  it('should use pt-BR as the active language', () => {
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe(DEFAULT_LANG);
  });

  it('should render the real pt-BR translations synchronously', () => {
    const fixture = TestBed.createComponent(TranslatedComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toBe('Atrasada');
  });
});
