# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — dev server at http://localhost:4200 (`ng serve`, development config)
- `npm run build` — production build to `dist/expense-tracker/browser` (production is the default build config)
- `npm test` — Karma + Jasmine in watch mode with a visible Chrome
- `npm run test:ci` — single headless run with coverage (`ChromeHeadlessNoSandbox` launcher from `karma.conf.js`); this is what CI runs. If Karma can't find Chrome, set `CHROME_BIN`. Coverage lands in `coverage/expense-tracker/`.
- Run a single spec file: `npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox --include=src/app/services/session.service.spec.ts`. To focus one test inside a file, use `fdescribe`/`fit` temporarily.

## Architecture

Angular 22 SPA with standalone components only (no NgModules), bootstrapped from `src/main.ts` with `src/app/app.config.ts`. Components use classic `@Input`/`@Output`, constructor injection and RxJS subscriptions, not signals. Templates use `@if`/`@for` control flow. Follow that style.

Every component sets `changeDetection: ChangeDetectionStrategy.Eager` because Angular 22 defaults to OnPush and the components mutate fields (e.g. `expensesList.push`, `isLoading`) inside subscriptions. Keep `Eager` on new components unless they are written for OnPush. `app.config.ts` uses `withXhr()` to keep the XHR backend (v22 defaults to fetch).

Angular 22's CLI requires Node >= 22.22.3 or >= 24.15; CI uses Node 24.

The backend is a separate .NET API (Azure Container Apps). All HTTP calls go through `src/app/services/` and build URLs as `environment.apiUri + "<Controller>/<Action>"`, so `apiUri` must keep its trailing slash.

**Auth/session flow** (spread across several files):
- `AuthService.login` returns a `Session` (`username`, `accessToken`). `SessionService` keeps it in a `BehaviorSubject` and persists it to `localStorage` under the key `session`; it restores it in its constructor.
- `authInterceptor` (registered in `app.config.ts` via `withInterceptors`) adds `Authorization: Bearer <token>` to every request when a session exists.
- Route guards in `app.routes.ts` are inline functional guards: `/expenses` requires login, and `/login` and `/signup` require being logged out. Both guards redirect to `/` (landing page) by returning a `UrlTree`. Unknown routes redirect to `/`.

**Bills (v1 redesign, in progress)**: types in `src/app/types/` (`Bill`, `BillMonth`, `RecurringBill`, `AmountType`, `UserPreferences`) mirror the server DTOs. `AmountType` is a string union because the API serializes enums as strings. Dates are ISO `yyyy-MM-dd` strings (server `DateOnly`); parse them with `parseIsoDate`, never `new Date(iso)`, which reads them as UTC and can shift the day. `BillService` (`Bill?year=`, `Bill`, `Bill/{id}/Payment`, `Bill/{id}`) and `RecurringBillService` (`RecurringBill`, `RecurringBill/{id}`) cover the Phase 1 endpoints.

**Formatting and i18n**: the UI language and the number/date format are independent. Texts go through Transloco (`provideAppTransloco()` in `src/app/i18n/transloco.ts`, registered in `app.config.ts`; only `pt-BR`, translations in `src/assets/i18n/<lang>.json`, loaded with an `HttpClient` that skips the interceptors). Currency and dates use `Intl` with the user's `currency`/`locale` from `PreferencesService` (`GET`/`PUT User/Preferences`, defaults `BRL`/`pt-BR`, reset on logout). Use the helpers in `src/app/formatting/format.ts` or the `money` / `localDate` pipes, which take the preferences as an argument (`{{ bill.value | money: preferences }}`) so they stay pure.

**Theme**: `src/styles.css` defines CSS custom properties on `:root` (surfaces, text, the five status colors `--status-*`, `--font-mono`) and a `.money` class for monetary values. Use the tokens instead of hard-coded colors.

**Bills UI** (`src/app/bills/`, route `/expenses`): `BillsPageComponent` is the container. It loads the user preferences, the recurring bills (`RecurringBill`) and one year of bills (`GET Bill?year=`, `BillMonth[]` with 1-based `month`, filled to 12 entries), and owns the year, the selected month (the current one by default) and the loading state. ‹ › in `MonthDetailComponent` move through the months; going past December or January loads the neighbouring year. It passes the data down to `MonthStripComponent` (12 month cards with one status dot per bill and a summary, plus "N overdue this year"), `MonthDetailComponent` (paid count, progress bar, Paid / Left to pay / Overdue totals, To pay and Paid sections of `BillRowComponent`, "Bills this month", and the dashed "+ Add bill" button), `RecurringBillsPanelComponent`, `PreferencesMenuComponent` and `StatusLegendComponent`. Paying (Phase 3a): the status circle of `BillRowComponent` is a `<button>` with `aria-pressed`. A click pays a `Fixed` bill or undoes a payment; on a variable bill it opens an inline value input (estimate pre-filled, Enter confirms, Esc cancels). The rows only emit (`pay` / `undoPayment`, relayed by `MonthDetailComponent`); `BillsPageComponent` does the request with an optimistic update: it replaces the bill in `months` immutably (new arrays, so the strip and the month recalculate), keeps the bill the server returns, or rolls back and shows `bills.payment.*Error`. Clicks on a bill with a request in flight are ignored.

Adding, editing and removing (Phase 3b): the page owns the add/edit form state and renders `AddBillFormComponent` below the month. It creates a `RecurringBill` ("Repeats every month") or a one-off `Bill` in the open month (due day clamped with `dueDateInMonth`), or, given a `recurringBill`, edits it with `PUT RecurringBill/{id}`. Clicking an item of `RecurringBillsPanelComponent` opens it in edit mode; its trash can opens an inline confirmation with the number of unpaid bills removed from the current month on (`countUnpaidFromCurrentMonth`, over the loaded months) and calls `DELETE RecurringBill/{id}`. `BillRowComponent` removes one-off bills (`recurringBillId === null`) the same way with `DELETE Bill/{id}`. Unlike the payments, these components call the services themselves and emit an output on success; the page then reloads the recurring bills and the year without the loading state (`reload()`). `PreferencesMenuComponent` is a collapsible panel that saves the currency and the language (`locale`, only `pt-BR` for now) with `PreferencesService.update`. Shared button, field and inline-confirmation styles (`.button`, `.icon-button`, `.field`, `.inline-confirm`) live in `styles.css`.

The status rules live in `src/app/bills/bill-status.ts` as pure functions that take `today` as a parameter: `getStatus` (`overdue` / `dueSoon` up to 3 days ahead / `pending` / `paid` / `upcoming` for future months), `getDueText` (translation key + params), `getMonthTotals` (Left to pay uses the estimate when there is no value and ignores bills with neither), `getMonthCounts`, `getMonthSummary` and `countOverdueInYear`. Keep the rules there and the components thin. Status colors come from the global `.status-dot` / `.status-<status>` classes in `styles.css`, and the status is always also shown as text.

## Testing conventions

Specs use `TestBed` with `provideHttpClient()` + `provideHttpClientTesting()` and assert requests via `HttpTestingController` (`httpMock.verify()` in `afterEach`). Code that uses `SessionService` touches the real `localStorage`, so specs clear it between tests. Specs of components that use Transloco add `getTranslocoModule()` (from `src/testing/transloco-testing.ts`) to the TestBed `imports`; it loads the real `pt-BR.json` synchronously.

## Deploy / environments

`.github/workflows/azure-static-web-apps.yml` runs on pushes and PRs to `main`. `test_job` (`npm run test:ci`) must pass before `build_and_deploy_job` builds and uploads to Azure Static Web Apps. `public/staticwebapp.config.json` provides the SPA navigation fallback to `index.html`.

Environments: `src/environments/environment.ts` points to the local API (`http://localhost:8080/`, the server repo's `docker-compose.yml`) and is used by `ng serve` and `ng test`. The production build configuration replaces it with `environment.prod.ts` (`fileReplacements` in `angular.json`), which holds the production API URL. `ng serve --configuration production` runs the UI against the production API.
