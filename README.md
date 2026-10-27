# Playwright Google Form & Sheets Automation

## Project Goal

This project automates the end-to-end flow of filling out and submitting a Google Form using Playwright, followed by automated verification to ensure that the submitted response is accurately recorded in the linked Google Sheets spreadsheet.

## Prerequisites & Permissions

Before running the automation, make sure the Google Form and Google Sheet permissions are configured as follows:

- **Google Form Permissions**:
  - The form must be set so **anyone with the link can respond** (in Form Settings, ensure *"Requires sign-in / Restrict to users in domain"* is **disabled** and *"Limit to 1 response"* is **disabled**).
  - **Important Privacy Note**: Because the form and responses spreadsheet are publicly accessible for test automation, **only use mock/synthetic test data**. Never submit or store sensitive, real, or personal information.

- **Google Sheets Permissions**:
  - The response sheet must have link sharing set to **"Anyone with the link can view"** (Viewer permission) so the automated verification suite can query the response export without needing Google OAuth login credentials.

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and supply your URLs:
   ```env
   # add your google form here:
   formUrl = "https://forms.gle/your-form-id"

   # add your google sheet here:
   googleSheetUrl = "https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
   ```

> **Note**: `.env` is ignored by Git in `.gitignore` to prevent leaking links or sensitive configuration to remote repositories. Only `.env.example` should be tracked in source control.
