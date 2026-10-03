# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — dev server at http://localhost:4200 (`ng serve`, development config)
- `npm run build` — production build to `dist/expense-tracker/browser` (production is the default build config)
- `npm test` — Karma + Jasmine in watch mode with a visible Chrome
- `npm run test:ci` — single headless run with coverage (`ChromeHeadlessNoSandbox` launcher from `karma.conf.js`); this is what CI runs. If Karma can't find Chrome, set `CHROME_BIN`. Coverage lands in `coverage/expense-tracker/`.
- Run a single spec file: `npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox --include=src/app/services/session.service.spec.ts`. To focus one test inside a file, use `fdescribe`/`fit` temporarily.

## Architecture

Angular 19 SPA with standalone components only (no NgModules), bootstrapped from `src/main.ts` with `src/app/app.config.ts`. Components use classic `@Input`/`@Output`, constructor injection and RxJS subscriptions, not signals. Follow that style.

The backend is a separate .NET API (Azure Container Apps). All HTTP calls go through `src/app/services/` and build URLs as `environment.apiUri + "<Controller>/<Action>"`, so `apiUri` must keep its trailing slash.

**Auth/session flow** (spread across several files):
- `AuthService.login` returns a `Session` (`username`, `accessToken`). `SessionService` keeps it in a `BehaviorSubject` and persists it to `localStorage` under the key `session`; it restores it in its constructor.
- `authInterceptor` (registered in `app.config.ts` via `withInterceptors`) adds `Authorization: Bearer <token>` to every request when a session exists.
- Route guards in `app.routes.ts` are inline functional guards: `/expenses` requires login, and `/login` and `/signup` require being logged out. Both guards redirect to `/` (landing page) by returning a `UrlTree`. Unknown routes redirect to `/`.

**Expenses UI**: `ExpensesDashboardComponent` fetches the whole year once (`GET Expense?year=`) as `ExpenseList[]`, one entry per month with a 1-based `expensesMonth`. It renders 12 `ExpensesCardComponent`s, filling months that have no data with empty lists. Each card handles create (`ExpenseFormComponent` emits the new expense) and bulk delete (`DELETE Expense/DeleteByIds?ids=..&ids=..`) for its month.

## Testing conventions

Specs use `TestBed` with `provideHttpClient()` + `provideHttpClientTesting()` and assert requests via `HttpTestingController` (`httpMock.verify()` in `afterEach`). Code that uses `SessionService` touches the real `localStorage`, so specs clear it between tests.

## Deploy / environments

`.github/workflows/azure-static-web-apps.yml` runs on pushes and PRs to `main`. `test_job` (`npm run test:ci`) must pass before `build_and_deploy_job` builds and uploads to Azure Static Web Apps. `public/staticwebapp.config.json` provides the SPA navigation fallback to `index.html`.

Gotcha: CI rewrites `src/environments/environment.prod.ts` from the `API_URI` secret, but `angular.json` has no `fileReplacements`. The build therefore always uses `src/environments/environment.ts`, and the secret currently has no effect. Today both files point to the same production API URL.
