import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { routes } from './app.routes';
import { SessionService } from './services/session.service';
import { LandingPageComponent } from './landing-page/landing-page.component';

describe('app routes', () => {
  let router: Router;
  let sessionService: SessionService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });

    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function logIn() {
    sessionService.saveSession({ username: 'bruno', accessToken: 'token-123' });
  }

  describe('/expenses', () => {
    it('should redirect to the landing page without a session', async () => {
      await router.navigateByUrl('/expenses');
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

      it('should redirect to the landing page when already logged in', async () => {
        logIn();

        await router.navigateByUrl(path);
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

    await router.navigateByUrl('/expenses');
    expect(router.url).toBe('/');
    expect(await router.navigateByUrl('/login')).toBeTrue();
    expect(router.url).toBe('/login');
  });

  describe('when a guard blocks the initial navigation', () => {
    const cases: { path: string; loggedIn: boolean }[] = [
      { path: '/expenses', loggedIn: false },
      { path: '/login', loggedIn: true },
      { path: '/signup', loggedIn: true },
    ];

    for (const { path, loggedIn } of cases) {
      it(`should render the landing page for ${path} (logged ${loggedIn ? 'in' : 'out'})`, async () => {
        if (loggedIn) {
          logIn();
        }

        const harness = await RouterTestingHarness.create();
        await harness.navigateByUrl(path);

        expect(router.url).toBe('/');
        expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(LandingPageComponent);
      });
    }
  });
});
