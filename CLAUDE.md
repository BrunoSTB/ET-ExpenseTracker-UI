# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project overview

**ET - Expense Tracker (UI)** is the Angular front end for a personal expense tracker. Users sign up, log in, and manage their expenses on a yearly dashboard split into one card per month. All data lives in a separate backend API (.NET, hosted on Azure Container Apps); this repo is UI only.

- Angular 19 (standalone components, no NgModules), TypeScript 5.7 in `strict` mode with `strictTemplates`
- RxJS 7, zone.js change detection (`provideZoneChangeDetection({ eventCoalescing: true })`)
- Template-driven forms (`FormsModule` / `ngModel`), no reactive forms
- Plain CSS per component plus `src/styles.css`; no UI library
- Tests: Jasmine + Karma, with an enforced coverage threshold
- Deployed to Azure Static Web Apps via GitHub Actions

## Commands

```bash
npm install          # install dependencies (CI uses `npm ci`)
npm start            # ng serve → http://localhost:4200 (development config)
npm run build        # production build → dist/expense-tracker/browser
npm run watch        # development build in watch mode
npm test             # Karma in watch mode, opens Chrome
npm run test:ci      # single headless run with coverage (what CI runs)
```

`test:ci` uses the `ChromeHeadlessNoSandbox` launcher from `karma.conf.js` (`--no-sandbox` is required when Chrome runs as root in a container). If Karma can't find a browser, set `CHROME_BIN`, e.g. `CHROME_BIN=$(which chromium) npm run test:ci`. In the Claude Code cloud container, Chromium is at `/opt/pw-browsers/chromium*`.

Run `npm run test:ci` before pushing — it is the gate in CI.

## Layout

```
src/
  main.ts                     # bootstrapApplication(AppComponent, appConfig)
  environments/
    environment.ts            # apiUri used by the app (see "Environments" below)
    environment.prod.ts       # overwritten by CI at build time
  app/
    app.config.ts             # providers: router, HttpClient + authInterceptor
    app.routes.ts             # routes + functional guards
    app.component.*           # shell: <app-top-navbar> + <router-outlet>
    interceptors/
      auth.interceptor.ts     # adds `Authorization: Bearer <token>` when logged in
    services/
      auth.service.ts         # POST User/Login, POST User/Register
      expense.service.ts      # GET Expense?year=, POST Expense, DELETE Expense/DeleteByIds
      session.service.ts      # session state (BehaviorSubject) persisted to localStorage
    types/
      session.ts              # { username, accessToken }
      user.ts                 # { username, email, password }
      expenses.ts             # Expense class, NewExpense type, sample `expenses` data
      expenseList.ts          # { userId, expensesMonth, totalExpenses, expenses[] }
    top-navbar/               # links depend on session; logout clears session
    landing-page/             # public home page
    user-login/               # login form → saves session, navigates to '/'
    user-signup/              # signup form → navigates to /login with state { registered: true }
    expenses-dashboard/       # loads the year's expenses, renders 12 month cards
    expenses-card/            # one month: list, total, remove one, clear all, add form
    expense-form/             # creates an expense via the API, emits the created one
public/
  staticwebapp.config.json    # SPA navigation fallback for Azure Static Web Apps
  favicon.ico
```

## Architecture notes

### Routing and guards (`app.routes.ts`)

| Path | Component | Guard |
| --- | --- | --- |
| `''` | `LandingPageComponent` | — |
| `expenses` | `ExpensesDashboardComponent` | `requireLoggedIn` |
| `login` | `UserLoginComponent` | `requireLoggedOut` |
| `signup` | `UserSignupComponent` | `requireLoggedOut` |
| `**` | redirect to `''` | — |

Guards are inline functional `CanActivateFn`s that **return a `UrlTree`** (`router.createUrlTree(['/'])`) instead of returning `false` or calling `router.navigate`. Returning `false` on the initial navigation left the landing page blank, so keep the `UrlTree` pattern for any new guard.

### Session and auth

- `SessionService` is the single source of truth for login state. It keeps a `BehaviorSubject<Session | null>`, persists to `localStorage` under the key `session`, and restores it on construction (corrupt JSON is discarded).
- `getSession()` returns an observable (used by the navbar with `async`); `isLoggedIn()` and `getToken()` read the current value synchronously (used by guards and the interceptor).
- `getToken()` already returns the full header value (`Bearer <token>`).
- `authInterceptor` is a functional interceptor registered with `withInterceptors([...])`; it attaches the header only when a token exists.
- There is no token-expiry handling or 401 handling yet.

### Expenses data flow

1. `ExpensesDashboardComponent` calls `ExpenseService.list(year)` for the current year and gets `ExpenseList[]` — one entry per month that has expenses. `expensesMonth` from the API is **1-based** (January = 1); JS `Date.getMonth()` is 0-based, hence `month + 1` in `getExpensesForMonth`.
2. It renders an `ExpensesCardComponent` for each of the 12 months, passing `currentDate` (first day of the month) and that month's `ExpenseList`.
3. `ExpensesCardComponent` copies the list into `expensesList` in `ngOnInit` (not in a field initializer — inputs aren't set yet at that point).
4. Remove / clear are **optimistic**: the list is updated immediately and restored with an `errorMessage` if the DELETE fails.
5. `ExpenseFormComponent` POSTs the new expense and emits the **API-returned** `Expense` (with its server-generated `id`) via `formSubmit`; the card pushes it into its list. Don't generate ids on the client.

### API contract quirks

- Base URL comes from `environment.apiUri` (ends with `/`); endpoints are concatenated as `environment.apiUri + 'Expense'`.
- The client model uses `expenseDate`, but `ExpenseService.create` still sends the field as **`date`** because the server's create endpoint expects that name (see the TODO in `expense.service.ts`). Responses use `expenseDate`.
- `DeleteByIds` takes repeated query params: `?ids=1&ids=2`.

### Environments

- Code imports `src/environments/environment.ts`. `angular.json` currently has **no `fileReplacements`**, so `environment.prod.ts` is not swapped in during `ng build --configuration production` — both files point to the same production API today.
- CI rewrites `environment.prod.ts` from the `API_URI` secret before building. If you need the secret to actually take effect, add a `fileReplacements` entry to the production configuration in `angular.json`.
- Never commit secrets; the API URL itself is public.

## Testing conventions

- Every component, service, interceptor and the routes have a `*.spec.ts` next to them. New code should come with specs.
- Coverage thresholds are enforced in `karma.conf.js` (global): **statements 90%, branches 80%, functions 90%, lines 90%**. `test:ci` fails below these.
- HTTP: use `provideHttpClient()` + `provideHttpClientTesting()` and `HttpTestingController`; call `httpMock.verify()` in `afterEach`. Match URLs as `environment.apiUri + '...'`.
- When asserting that *no* request was made, use a predicate — `httpMock.match((r) => r.url === ...)` — rather than a raw URL string (avoids a CodeQL alert).
- Routing: test guards with `provideRouter(routes)` and `router.navigateByUrl(...)` / `RouterTestingHarness`.
- Clear `localStorage` in `beforeEach`/`afterEach` whenever `SessionService` is involved.
- Keep tests locale-independent (e.g. compare month names against `toLocaleString('default', { month: 'long' })` rather than a hard-coded English string).

## Code style

- Follow `.editorconfig`: 2-space indent, UTF-8, final newline, single quotes in `.ts`. (Some services still use double quotes — match the file you're editing; prefer single quotes in new files.)
- Component selector prefix: `app-`. Each component has separate `.ts`, `.html`, `.css`, `.spec.ts` files.
- Components are standalone and declare their own `imports` (`NgFor`, `NgIf`, `FormsModule`, ...). The existing templates use `*ngFor`/`*ngIf`; stay consistent within a file.
- Services are `@Injectable({ providedIn: 'root' })` and return cold `Observable`s from `HttpClient`; components subscribe with `{ next, error }` and surface failures through an `errorMessage: string | null` field rendered in the template.
- UI text is in English; the README and many commit messages are in Portuguese (pt-BR). Either language is fine for commits.
- Production budgets (`angular.json`): initial bundle warns at 500 kB / errors at 1 MB; each component stylesheet warns at 4 kB / errors at 8 kB.

## CI/CD (`.github/workflows/azure-static-web-apps.yml`)

Triggered on pushes and PRs to `main`:

1. **`test_job`** — `npm ci`, resolve a Chrome binary, `npm run test:ci`, upload `coverage/` as an artifact.
2. **`build_and_deploy_job`** (needs `test_job`) — generates `environment.prod.ts` from `secrets.API_URI`, runs `ng build --configuration production`, and uploads `dist/expense-tracker/browser` to Azure Static Web Apps (PRs get a preview environment).
3. **`close_pull_request_job`** — tears down the PR preview environment when the PR closes.

Required repo secrets: `AZURE_STATIC_WEB_APPS_API_TOKEN`, `API_URI`.

`public/staticwebapp.config.json` rewrites unknown paths to `/index.html` so deep links like `/expenses` survive a refresh. Keep it when touching the public folder. The API must list the Static Web Apps origin in its `CORSOrigins` setting.

## Known gaps / ideas

- Only the current year is shown; there is no year selector.
- No edit-expense flow; no input validation beyond the signup password match.
- `types/expenses.ts` still exports a hard-coded sample `expenses` array that is unused by the app.
- `AppComponent.ngOnInit` logs `environment.apiUri` to the console.
- No e2e test framework is configured.
