# Playwright Google Form & Sheets Automation

An end-to-end test automation suite built with [Playwright](https://playwright.dev/) that submits responses to a Google Form and verifies their persistence in a linked Google Sheets spreadsheet.

## Project Architecture

```text
pw-demo/
├── pages/
│   ├── GoogleFormPage.ts       # Page Object Model encapsulating form fields & submission
│   └── GoogleSheetsClient.ts   # Client handling cache-busted gviz CSV query & row polling
├── tests/
│   ├── field-probes.spec.ts    # Isolated, non-submitting probes for all 10 form field types
│   ├── sheet-verification.spec.ts # Standalone test for cache-busted CSV fetch & polling
│   └── form-to-sheets.spec.ts  # End-to-end test: submit form -> poll sheet -> soft assertions
├── playwright.config.ts        # Playwright config (Chromium-only, dotenv enabled)
├── package.json                # Scripts & dependencies (csv-parse, dotenv)
├── .env.example                # Example environment template
└── .env                        # Local environment variables (git-ignored)
```

## Prerequisites & Permissions

- **Google Form Permissions**:
  - The form must be set so **anyone with the link can respond** (in Form Settings, ensure *"Requires sign-in / Restrict to users in domain"* is **disabled** and *"Limit to 1 response"* is **disabled**).
  - **Privacy Note**: Because the form and responses spreadsheet are publicly accessible for test automation, **only use mock/synthetic test data**. Never submit or store sensitive, real, or personal information.

- **Google Sheets Permissions**:
  - The response sheet must have link sharing set to **"Anyone with the link can view"** (Viewer permission) so the automated verification suite can query the response export without needing Google OAuth login credentials.

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and supply your URLs:
   ```env
   # Google Form URL
   formUrl = "https://forms.gle/your-form-id"

   # Google Sheets response spreadsheet URL
   googleSheetUrl = "https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
   ```

> **Note**: `.env` is ignored by Git in `.gitignore` to prevent leaking links or sensitive configuration to remote repositories. Only `.env.example` should be tracked in source control.

## Running the Tests

Install dependencies:
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run End-to-End Test Only
```bash
npx playwright test tests/form-to-sheets.spec.ts
```

### Run Headed Mode
```bash
npm run test:headed
```

### Run Field Probes Only (Non-submitting)
```bash
npx playwright test tests/field-probes.spec.ts
```

### Run Standalone Sheet Verification
```bash
npx playwright test tests/sheet-verification.spec.ts
```

### View HTML Test Report
```bash
npm run test:report
```

## Verification Strategy

1. **Chromium-Locked Execution**: Restricted to Chromium only in `playwright.config.ts` to prevent redundant submissions across multiple browsers.
2. **Cache-Busted CSV Queries**: Appends `&_=${Date.now()}` to the Google Sheets gviz CSV endpoint (`/gviz/tq?tqx=out:csv`) with `Cache-Control: no-cache` to eliminate stale HTTP caching.
3. **Robust CSV Parsing**: Uses `csv-parse` to handle multi-line strings, quoted fields, and gviz column nuances.
4. **Native Polling**: Employs Playwright's `expect.poll()` to wait for the unique submission ID to be written to the sheet by Google servers.
5. **Timestamp Window Assertion**: Instead of asserting on exact seconds, validates that the server-generated timestamp falls within $\pm 5$ minutes of the local submission start time.
## Continuous Integration (GitHub Actions)

The workflow at `.github/workflows/playwright.yml` validates code health on pushes and pull requests to `main`, `master`, and `dev`, as well as manual triggers via `workflow_dispatch`.

- **Remote CI (Code Health & Type Safety)**: Runs `npm run typecheck` (`tsc --noEmit`) to verify that all Page Objects, test specs, and configurations compile cleanly without syntax or type errors. Because target URLs are stored locally in `.env`, live form submission tests are gracefully skipped in CI to ensure no phantom or unauthorized test runs hit external forms from the cloud.
- **Local Runs (Full Automation Suite)**: With [.env](file:///Users/davidschraedel/Desktop/Files/Projects/code/Playwright/pw-demo/.env) populated, running `npm test` executes the complete 13-test automation suite locally against your target Google Form and Sheets.

