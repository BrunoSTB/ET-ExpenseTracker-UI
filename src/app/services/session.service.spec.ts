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
});
