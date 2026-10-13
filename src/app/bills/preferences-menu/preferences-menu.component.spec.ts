import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { PreferencesMenuComponent } from './preferences-menu.component';
import { PreferencesService } from '../../services/preferences.service';
import { UserPreferences } from '../../types/userPreferences';
import { environment } from '../../../environments/environment';
import { getTranslocoModule } from '../../../testing/transloco-testing';

describe('PreferencesMenuComponent', () => {
  let fixture: ComponentFixture<PreferencesMenuComponent>;
  let httpMock: HttpTestingController;
  let preferencesService: PreferencesService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PreferencesMenuComponent, getTranslocoModule()],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(PreferencesMenuComponent);
    httpMock = TestBed.inject(HttpTestingController);
    preferencesService = TestBed.inject(PreferencesService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function element() {
    return fixture.nativeElement as HTMLElement;
  }

  async function open() {
    fixture.detectChanges();
    element().querySelector<HTMLElement>('.preferences-toggle')!.click();
    fixture.detectChanges();
    // Lets ngModel write the values to the selects.
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function select(id: string) {
    return element().querySelector<HTMLSelectElement>(`#${id}`)!;
  }

  function options(id: string) {
    return Array.from(select(id).options).map((option) => option.textContent!.trim());
  }

  function choose(id: string, value: string) {
    const element = select(id);
    element.value = value;
    element.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function submit() {
    element().querySelector<HTMLElement>('.submit')!.click();
    fixture.detectChanges();
  }

  it('should start closed', () => {
    fixture.detectChanges();

    expect(element().querySelector('.preferences-toggle')?.getAttribute('aria-expanded')).toBe('false');
    expect(element().querySelector('form')).toBeNull();
  });

  it('should show the current preferences and the available options', async () => {
    await open();

    expect(element().querySelector('.preferences-toggle')?.getAttribute('aria-expanded')).toBe('true');
    expect(select('preferences-currency').value).toBe('BRL');
    expect(select('preferences-language').value).toBe('pt-BR');
    expect(options('preferences-currency')).toEqual([
      'Real (BRL)',
      'Dólar americano (USD)',
      'Euro (EUR)',
      'Libra esterlina (GBP)',
    ]);
    expect(options('preferences-language')).toEqual(['Português (Brasil)']);
  });

  it('should save the chosen currency', async () => {
    await open();
    choose('preferences-currency', 'USD');
    submit();

    const request = httpMock.expectOne(environment.apiUri + 'User/Preferences');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ currency: 'USD', locale: 'pt-BR' });
    expect(element().querySelector<HTMLButtonElement>('.submit')!.disabled).toBeTrue();
    request.flush(null);
    fixture.detectChanges();

    let current: UserPreferences | undefined;
    preferencesService.getPreferences().subscribe((preferences) => (current = preferences));
    expect(current).toEqual({ currency: 'USD', locale: 'pt-BR' });
    expect(element().querySelector('.success-message')?.textContent?.trim()).toBe('Preferências salvas.');
  });

  it('should show an error and keep the preferences when saving fails', async () => {
    await open();
    choose('preferences-currency', 'EUR');
    submit();

    httpMock
      .expectOne(environment.apiUri + 'User/Preferences')
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    let current: UserPreferences | undefined;
    preferencesService.getPreferences().subscribe((preferences) => (current = preferences));
    expect(current).toEqual({ currency: 'BRL', locale: 'pt-BR' });
    expect(element().querySelector('.error-message')?.textContent?.trim()).toBe(
      'Não foi possível salvar as preferências.'
    );
    expect(element().querySelector<HTMLButtonElement>('.submit')!.disabled).toBeFalse();
  });
});
