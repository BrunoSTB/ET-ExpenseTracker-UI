import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { DEFAULT_PREFERENCES, PreferencesService } from './preferences.service';
import { SessionService } from './session.service';
import { UserPreferences } from '../types/userPreferences';
import { environment } from '../../environments/environment';

describe('PreferencesService', () => {
  let service: PreferencesService;
  let sessionService: SessionService;
  let httpMock: HttpTestingController;

  const usdPreferences: UserPreferences = { currency: 'USD', locale: 'en-US' };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    sessionService = TestBed.inject(SessionService);
    sessionService.saveSession({ username: 'bruno', accessToken: 'token' });
    service = TestBed.inject(PreferencesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should start with the default preferences (BRL, pt-BR)', async () => {
    expect(await firstValueFrom(service.getPreferences())).toEqual(
      DEFAULT_PREFERENCES
    );
    expect(DEFAULT_PREFERENCES).toEqual({ currency: 'BRL', locale: 'pt-BR' });
  });

  describe('load', () => {
    it('should GET the preferences and publish them', async () => {
      service.load().subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'User/Preferences');
      expect(req.request.method).toBe('GET');
      req.flush(usdPreferences);

      expect(await firstValueFrom(service.getPreferences())).toEqual(
        usdPreferences
      );
    });

    it('should keep the current preferences when the request fails', async () => {
      service.load().subscribe({ error: () => {} });

      httpMock
        .expectOne(environment.apiUri + 'User/Preferences')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(await firstValueFrom(service.getPreferences())).toEqual(
        DEFAULT_PREFERENCES
      );
    });
  });

  describe('update', () => {
    it('should PUT the preferences and publish them', async () => {
      service.update(usdPreferences).subscribe();

      const req = httpMock.expectOne(environment.apiUri + 'User/Preferences');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(usdPreferences);
      req.flush(null, { status: 204, statusText: 'No Content' });

      expect(await firstValueFrom(service.getPreferences())).toEqual(
        usdPreferences
      );
    });

    it('should not publish the preferences when the request fails', async () => {
      service.update(usdPreferences).subscribe({ error: () => {} });

      httpMock
        .expectOne(environment.apiUri + 'User/Preferences')
        .flush(null, { status: 400, statusText: 'Bad Request' });

      expect(await firstValueFrom(service.getPreferences())).toEqual(
        DEFAULT_PREFERENCES
      );
    });
  });

  it('should go back to the defaults on logout', async () => {
    service.load().subscribe();
    httpMock
      .expectOne(environment.apiUri + 'User/Preferences')
      .flush(usdPreferences);

    sessionService.cleanSession();

    expect(await firstValueFrom(service.getPreferences())).toEqual(
      DEFAULT_PREFERENCES
    );
  });
});
