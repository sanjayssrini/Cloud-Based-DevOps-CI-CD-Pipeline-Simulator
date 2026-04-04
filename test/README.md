# Webpage Tests

These Playwright tests cover the main frontend flows:

- Landing page copy and auth links
- Register page validation
- Login flow into the dashboard
- Dashboard project loading and workspace open flow
- Landing to login navigation
- Dashboard redirect and logout behavior

## Run

Install dependencies first:

```bash
npm install
```

Install the Playwright browsers once on a new machine:

```bash
npx playwright install chromium
```

Run the tests:

```bash
npm run test:webpage
```

Run them with a visible browser window:

```bash
npm run test:webpage:headed
```

## Run One By One

Run each test script individually:

```bash
npm run test:webpage:landing
npm run test:webpage:auth
npm run test:webpage:dashboard
```

Run a single named test case:

```bash
npx playwright test --config test/playwright.config.ts test/auth.spec.ts -g "login flow redirects to the dashboard when auth succeeds"
```

The config starts the frontend automatically on `http://127.0.0.1:3000`, so you do not need to launch it separately for the tests.