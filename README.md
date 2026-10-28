# Playwright Google Form & Sheets Automation

An end-to-end test automation suite built with [Playwright](https://playwright.dev/) that submits responses to a Google Form and verifies their persistence in a linked Google Sheets spreadsheet.

<sub>*David Schraedel (2026)*</sub>

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   Add your Google Form and Sheet URLs to `.env`:
   ```env
   formUrl = "https://forms.gle/your-form-id"
   googleSheetUrl = "https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
   ```

3. **Run the test suite**:
   ```bash
   npm test
   ```

## Google Form & Sheets Setup

The test suite validates all 10 standard Google Form input widgets. The Page Object dynamically finds questions by title, so **question order does not matter**.

### 1. Form Questions

Create a Google Form with these questions:

| # | Question Title | Question Type | Options / Configuration |
|---|----------------|---------------|-------------------------|
| 1 | `What is your full name?` | **Short answer** | *(Text input)* |
| 2 | `Provide a brief description of your automation project.` | **Paragraph** | *(Multi-line textarea)* |
| 3 | `Select your primary programming language.` | **Multiple choice** | Include `TypeScript` |
| 4 | `Which testing tools do you currently use?` | **Checkboxes** | Include `Playwright`, `Jest` |
| 5 | `Select your experience level with automation.` | **Dropdown** | Include `Beginner`, `Intermediate`, `Advanced` |
| 6 | `Select the target test execution date.` | **Date** | *(Date picker)* |
| 7 | `Select the preferred execution time.` | **Time** | *(Time picker with AM/PM)* |
| 8 | `Rate the ease of form automation from 1 to 5.` | **Linear scale** | `1` to `5` |
| 9 | `Rate the overall stability of your test suite.` | **Linear scale** | `1` to `5` |
| 10 | `Evaluate the following test environments.` | **Multiple-choice grid** | **Rows**: `Development`, `Staging`, `Production`<br>**Columns**: `Poor`, `Fair`, `Good`, `Excellent` |
| 11 | `Select applicable browser support per environment.` | **Checkbox grid** | **Rows**: `Desktop`, `Mobile`, `Tablet`<br>**Columns**: `Chrome`, `Firefox`, `Safari`, `Edge` |

### 2. Form & Sheet Permissions

- **Form Settings**: Disable both *"Requires sign-in"* and *"Limit to 1 response"*.
- **Link to Sheet**: In Form **Responses**, click the green **Link to Sheets** icon -> **Create a new spreadsheet**.
- **Sheet Permissions**: In the created Sheet, click **Share** (top right) and set access to **"Anyone with the link can view"** (allows automated verification without OAuth).

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all 13 tests (Chromium, headless) |
| `npm run test:headed` | Run tests with browser window visible |
| `npm run test:report` | Open the HTML test report |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`) |
| `npx playwright test tests/form-to-sheets.spec.ts` | Run end-to-end test only |
| `npx playwright test tests/field-probes.spec.ts` | Run non-submitting field probes |
| `npx playwright test tests/sheet-verification.spec.ts` | Run standalone sheet CSV verification |

## Project Architecture

```text
pw-demo/
├── pages/
│   ├── GoogleFormPage.ts          # Page Object for form interactions & submissions
│   └── GoogleSheetsClient.ts      # Client for gviz CSV fetching & response polling
├── tests/
│   ├── field-probes.spec.ts       # Probes for all 10 field types (non-submitting)
│   ├── sheet-verification.spec.ts # Standalone test for Sheet CSV fetch & parsing
│   └── form-to-sheets.spec.ts     # End-to-end: submit form -> poll sheet -> verify row
├── playwright.config.ts           # Playwright config (Chromium-only)
├── .env.example                   # Environment template
└── .env                           # Local URLs (git-ignored)
```

## Key Design Highlights

- **Dynamic Locators**: Targets questions by heading text (`getQuestionCard(title)`), making tests resilient to Google's internal DOM changes and question reordering.
- **Zero OAuth Overhead**: Reads sheet data using Google's public `/gviz/tq?tqx=out:csv` endpoint with cache-busting timestamps (`&_=${Date.now()}`).
- **Native Polling**: Uses Playwright's `expect.poll()` to wait for Google's servers to write responses into the sheet without fixed sleep calls.
- **Timestamp Window Matching**: Validates that server timestamps fall within $\pm 5$ minutes of submission to avoid strict clock sync issues.
- **CI Safety**: GitHub Actions runs `npm run typecheck` on pushes and PRs to verify type safety without executing live submissions from the cloud.

