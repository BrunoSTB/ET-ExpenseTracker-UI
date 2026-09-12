# ExpenseTracker

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Deploy

O deploy é feito automaticamente pelo GitHub Actions (`.github/workflows/azure-static-web-apps.yml`) para o **Azure Static Web Apps**, a cada push ou pull request para a branch `main`. O workflow instala as dependências, gera `src/environments/environment.prod.ts` com a URL da API vinda de um secret e builda o Angular antes de publicar o conteúdo de `dist/expense-tracker/browser`.

### Secrets necessários no repositório

Configure em **Settings → Secrets and variables → Actions**:

| Secret | Descrição |
| --- | --- |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Token de deploy do recurso Azure Static Web Apps |
| `API_URI` | URL base da API publicada (ex.: `https://expense-tracker-api.proudforest-e65009bc.brazilsouth.azurecontainerapps.io/`) |

### Criando o recurso Azure Static Web Apps

```bash
az staticwebapp create --name et-expense-tracker-ui \
  --resource-group <resource-group-da-api> \
  --location "East US 2" --sku Free
```

Regiões suportadas: East US 2, West US 2, Central US, West Europe, East Asia.

Para obter o token de deploy (valor do secret `AZURE_STATIC_WEB_APPS_API_TOKEN`):

```bash
az staticwebapp secrets list --name et-expense-tracker-ui --query "properties.apiKey" -o tsv
```

### CORS na API

Após o primeiro deploy, o Azure gera uma URL própria para o site (ex.: `https://xxxxx.azurestaticapps.net`). Adicione essa URL na variável de ambiente `CORSOrigins` das Application Settings do App Service da API e reinicie o serviço, para que a API aceite requisições vindas do front publicado.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
