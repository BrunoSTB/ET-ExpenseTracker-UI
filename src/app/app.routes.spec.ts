import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { routes } from './app.routes';
import { SessionService } from './services/session.service';

describe('app routes', () => {
  let router: Router;
  let sessionService: SessionService;

  beforeEach(async () => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });

    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);

    await router.navigateByUrl('/');
  });

  afterEach(() => {
    localStorage.clear();
  });

  function logIn() {
    sessionService.saveSession({ username: 'bruno', accessToken: 'token-123' });
  }

  describe('/expenses', () => {
    it('should be blocked without a session', async () => {
      expect(await router.navigateByUrl('/expenses')).toBeFalse();
      expect(router.url).toBe('/');
    });

    it('should be allowed with a session', async () => {
      logIn();

      expect(await router.navigateByUrl('/expenses')).toBeTrue();
      expect(router.url).toBe('/expenses');
    });
  });

  for (const path of ['/login', '/signup']) {
    describe(path, () => {
      it('should be allowed without a session', async () => {
        expect(await router.navigateByUrl(path)).toBeTrue();
        expect(router.url).toBe(path);
      });

      it('should be blocked when already logged in', async () => {
        logIn();

        expect(await router.navigateByUrl(path)).toBeFalse();
        expect(router.url).toBe('/');
      });
    });
  }

  it('should redirect unknown paths to the landing page', async () => {
    expect(await router.navigateByUrl('/some/unknown/route')).toBeTrue();
    expect(router.url).toBe('/');
  });

  it('should follow the session state instead of a snapshot taken at startup', async () => {
    logIn();
    expect(await router.navigateByUrl('/expenses')).toBeTrue();

    sessionService.cleanSession();
    await router.navigateByUrl('/');

    expect(await router.navigateByUrl('/expenses')).toBeFalse();
    expect(await router.navigateByUrl('/login')).toBeTrue();
  });
});
