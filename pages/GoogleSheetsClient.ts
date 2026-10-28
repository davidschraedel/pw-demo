import { APIRequestContext, expect } from '@playwright/test';
import { parse } from 'csv-parse/sync';

export interface FormResponseRow {
  Timestamp: string;
  'What is your full name?': string;
  'Provide a brief description of your automation project.': string;
  'Select your primary programming language.': string;
  'Which testing tools do you currently use?': string;
  'Select your experience level with automation.': string;
  'Select the target test execution date.': string;
  'Select the preferred execution time.': string;
  'Rate the ease of form automation from 1 to 5.': string;
  'Rate the overall stability of your test suite.': string;
  'Evaluate the following test environments. [Development]': string;
  'Evaluate the following test environments. [Staging]': string;
  'Evaluate the following test environments. [Production]': string;
  'Select applicable browser support per environment. [Desktop]': string;
  'Select applicable browser support per environment. [Mobile]': string;
  'Select applicable browser support per environment. [Tablet]': string;
  [key: string]: string;
}

export class GoogleSheetsClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly sheetUrl: string
  ) {
    if (!sheetUrl) {
      throw new Error('GoogleSheetsClient requires a valid sheetUrl.');
    }
  }

  /**
   * Extracts the Google Sheet ID from the provided URL.
   */
  public getSheetId(): string {
    const match = this.sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      throw new Error(`Could not extract sheet ID from url: ${this.sheetUrl}`);
    }
    return match[1];
  }

  /**
   * Fetches and parses Google Sheet rows via the cache-busted gviz CSV endpoint.
   */
  public async fetchRows(): Promise<{ headers: string[]; rows: FormResponseRow[] }> {
    const sheetId = this.getSheetId();
    const cacheBuster = Date.now();
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&_=${cacheBuster}`;

    const response = await this.request.get(csvUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    expect(response.status(), `Failed to fetch CSV: status ${response.status()}`).toBe(200);

    const csvText = await response.text();
    const allRows: string[][] = parse(csvText, {
      skip_empty_lines: true,
      trim: true,
    });

    const headers = allRows[0] || [];
    const rows: FormResponseRow[] = [];

    for (let i = 1; i < allRows.length; i++) {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, colIdx) => {
        rowObj[header] = allRows[i][colIdx] ?? '';
      });
      rows.push(rowObj as FormResponseRow);
    }

    return { headers, rows };
  }

  /**
   * Uses Playwright's native polling to wait until a row matching the identifier appears.
   */
  public async pollForRow(
    columnName: keyof FormResponseRow | string,
    expectedValue: string,
    options?: { timeout?: number; intervals?: number[] }
  ): Promise<FormResponseRow> {
    let matchedRow: FormResponseRow | undefined;

    await expect.poll(async () => {
      const { rows } = await this.fetchRows();
      matchedRow = rows.find(r => r[columnName] === expectedValue);
      return !!matchedRow;
    }, {
      message: `Expected row with ${String(columnName)}="${expectedValue}" to appear in Google Sheet within timeout`,
      timeout: options?.timeout ?? 20_000,
      intervals: options?.intervals ?? [1_000, 2_000, 3_000],
    }).toBe(true);

    return matchedRow!;
  }
}
