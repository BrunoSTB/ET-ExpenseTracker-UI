# ExpenseTracker

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

### Environments

| File | Used by | API |
| --- | --- | --- |
| `src/environments/environment.ts` | `ng serve`, `ng test` | `http://localhost:8080/` (local API) |
| `src/environments/environment.prod.ts` | `ng build` (production configuration) | Production API on Azure Container Apps |

`angular.json` swaps `environment.ts` for `environment.prod.ts` in the production build (`fileReplacements`).

`ng serve` expects the API running locally. In the [server repository](https://github.com/BrunoSTB/ET-ExpenseTracker-Server), run:

```bash
docker compose up -d --build
```

That starts PostgreSQL and the API on `http://localhost:8080`, with `CORSOrigins` already set to `http://localhost:4200`. If you run the API another way, point `apiUri` in `environment.ts` at it, keeping the trailing slash.

To run the UI against the production API instead (careful: it reads and writes real data), use `ng serve --configuration production`.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To run the tests in watch mode, with the browser open:

```bash
npm test
```

To run them once in headless mode, with a coverage report (this is what CI runs):

```bash
npm run test:ci
```

`test:ci` uses the `ChromeHeadlessNoSandbox` launcher defined in `karma.conf.js`. The `--no-sandbox` flag is
required when Chrome runs as root inside a container. If Karma can't find the browser,
point it to the binary explicitly:

```bash
CHROME_BIN=$(which google-chrome) npm run test:ci
```

The coverage report is written to `coverage/expense-tracker/` (HTML and `lcov.info`).

The tests run on GitHub Actions in the `test_job` job, which the build and deploy job depends on,
so a PR with a failing test never gets deployed.

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deploy

Deployment to **Azure Static Web Apps** is handled automatically by GitHub Actions (`.github/workflows/azure-static-web-apps.yml`) on every push or pull request to the `main` branch. The workflow installs the dependencies, runs the tests and builds the Angular app with the production configuration (which uses the API URL in `src/environments/environment.prod.ts`) before publishing the contents of `dist/expense-tracker/browser`.

### Required repository secrets

Configure them under **Settings → Secrets and variables → Actions**:

| Secret | Description |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Deployment token for the Azure Static Web Apps resource |

### Creating the Azure Static Web Apps resource

```bash
az staticwebapp create --name et-expense-tracker-ui \
  --resource-group <api-resource-group> \
  --location "East US 2" --sku Free
```

Supported regions: East US 2, West US 2, Central US, West Europe, East Asia.

To get the deployment token (the value for the `AZURE_STATIC_WEB_APPS_API_TOKEN` secret):

```bash
az staticwebapp secrets list --name et-expense-tracker-ui --query "properties.apiKey" -o tsv
```

### CORS on the API

After the first deploy, Azure assigns the site its own URL (e.g. `https://xxxxx.azurestaticapps.net`). Add that URL to the `CORSOrigins` environment variable in the API App Service's Application Settings and restart the service, so the API accepts requests from the deployed front end.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
