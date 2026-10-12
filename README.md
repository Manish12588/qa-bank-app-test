# QABank Tests

Playwright + TypeScript API and UI tests for **QABank**, a demo banking app that runs in Docker as a stable automation target.

| Suite | Tests | Covers                                                                    |
| ----- | ----- | ------------------------------------------------------------------------- |
| API   | 31    | Authentication, accounts, transfers, bill pay, loans, transaction history |
| UI    | 19    | The same features through the browser, using Page Objects                 |

Every test, with what it checks: **[TESTPLAN.md](TESTPLAN.md)**

## Quick start

**Prerequisites:** Node.js 18+, and QABank running in Docker at `http://localhost:8080`.

```bash
npm install
```

Settings live in `config/.env.qa` (`ENV` defaults to `qa`; use `ENV=<name>` with `config/.env.<name>` for another environment):

```
API_BASE_URL=http://localhost:8080/api
WEB_BASE_URL=http://localhost:8080
```

```bash
npx playwright test                         # everything
npx playwright test tests/api               # API only
npx playwright test --project=ui            # UI only
npx playwright test -g "WEB-TRF-02"         # one test, by ID
npx playwright test --project=ui --headed   # watch the browser
npx playwright test --repeat-each=10        # flakiness check
npx playwright show-report                  # open the HTML report
```

## Project structure

```
qabank-test/
├── config/
│   └── .env.qa
├── src/
│   ├── api/
│   │   ├── ApiHelper.ts
│   │   ├── Auth.ts
│   │   ├── Accounts.ts
│   │   ├── Transfer.ts
│   │   ├── BillPay.ts
│   │   ├── Loan.ts
│   │   └── Transactions.ts
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── AuthPage.ts
│   │   ├── LoginPage.ts
│   │   ├── AccountsPage.ts
│   │   ├── TransferPage.ts
│   │   ├── BillPayPage.ts
│   │   ├── LoanPage.ts
│   │   └── TransactionHistoryPage.ts
│   └── fixtures/
│       ├── ApiFixtures.ts
│       └── PageFixtures.ts
├── tests/
│   ├── api/
│   │   ├── Auth.spec.ts
│   │   ├── Accounts.spec.ts
│   │   ├── Transfers.spec.ts
│   │   ├── BillPay.spec.ts
│   │   ├── Loans.spec.ts
│   │   └── Transactions.spec.ts
│   └── ui/
│       ├── AuthPageTest.spec.ts
│       ├── AccountsPageTest.spec.ts
│       ├── TransferPageTest.spec.ts
│       ├── BillPayPageTest.spec.ts
│       ├── LoanPageTest.spec.ts
│       └── TransactionHistoryPageTest.spec.ts
├── playwright.config.ts
├── README.md
└── TESTPLAN.md
```

- `src/api`: API helpers that return the raw `{ status, body }`. Also used by UI tests for setup.
- `src/pages`: Page Objects. `BasePage` holds the path, navigation and logout.
- `src/fixtures`: `apiHelper`, `anonApiHelper` and the page objects. `PageFixtures` builds on `ApiFixtures`, so one import gives a spec both.

## Design decisions

- **Specs hold only the call and the assertions.** Setup and request details live in the API helpers and page objects.
- **Every test is independent.** Each registers its own customer with a unique username, so the suite runs fully parallel.
- **Boundaries, not just happy paths.** An overdraft one cent over the balance, a loan at exactly 10 times the down payment and one cent above it.
- **Verify by reading back.** A write is confirmed with a second read, not just a success response.
- **The API suite owns the rules, the UI suite owns what the user sees.** UI tests check journeys and screens. Rules and boundaries are tested through the API.
- **The browser and `apiHelper` have separate sessions.** Registering in the UI does not log `apiHelper` in. UI tests that also call the API log it in first.
- **Waits are assertions that retry, never fixed delays.** A filtered history waits for its search to finish, so an empty table cannot pass before the search has run.

## Test stability

Both suites pass repeat runs (`--repeat-each=10`: 310 of 310 API, 190 of 190 UI). Key UI assertions were deliberately broken to confirm each one fails.
