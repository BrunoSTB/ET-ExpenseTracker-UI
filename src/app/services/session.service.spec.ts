import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { SessionService } from './session.service';
import { Session } from '../types/session';

describe('SessionService', () => {
  let service: SessionService;

  const aSession: Session = {
    username: 'bruno',
    accessToken: 'token-123',
  };

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start logged out when there is nothing stored', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should report the user as logged in after saving a session', () => {
    service.saveSession(aSession);

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('should expose a token after saving a session', () => {
    service.saveSession(aSession);

    expect(service.getToken()).toContain(aSession.accessToken);
  });

  it('should emit the saved session to subscribers', async () => {
    const emitted: (Session | null)[] = [];
    service.getSession().subscribe((value) => emitted.push(value));

    service.saveSession(aSession);

    expect(emitted).toEqual([null, aSession]);
  });

  it('should emit null and report logged out after cleaning the session', async () => {
    service.saveSession(aSession);

    service.cleanSession();

    expect(service.isLoggedIn()).toBeFalse();
    await expectAsync(firstValueFrom(service.getSession())).toBeResolvedTo(null);
  });

  it('should prefix the token for the Authorization header', () => {
    service.saveSession(aSession);

    expect(service.getToken()).toBe(`Bearer ${aSession.accessToken}`);
  });

  it('should have no token when there is no session', () => {
    expect(service.getToken()).toBeNull();
  });

  // Regressão #6: saveSession gravava em localStorage enquanto restoreSession
  // lia de sessionStorage, então a sessão não sobrevivia a um refresh.
  it('should restore the session in a new instance, as happens on a page refresh', () => {
    service.saveSession(aSession);

    const afterRefresh = new SessionService();

    expect(afterRefresh.isLoggedIn()).toBeTrue();
    expect(afterRefresh.getToken()).toBe(`Bearer ${aSession.accessToken}`);
  });

  // Regressão #6: cleanSession limpava o sessionStorage e deixava o token
  // no localStorage, então o logout não removia a credencial.
  it('should not restore a session that was cleaned before the refresh', () => {
    service.saveSession(aSession);
    service.cleanSession();

    const afterRefresh = new SessionService();

    expect(afterRefresh.isLoggedIn()).toBeFalse();
    expect(afterRefresh.getToken()).toBeNull();
  });

  it('should ignore corrupted data in the storage', () => {
    localStorage.setItem('session', 'not json');

    const afterRefresh = new SessionService();

    expect(afterRefresh.isLoggedIn()).toBeFalse();
  });
});
