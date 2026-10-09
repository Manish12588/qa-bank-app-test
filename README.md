# QABank API Tests

Playwright + TypeScript API test suite for **QABank**, a demo banking app that runs in Docker as a stable automation target. 31 tests cover authentication, accounts, transfers, bill pay, loans and transaction history.

- **App under test:** QABank, `http://localhost:8080`, API under `/api`
- **Stack:** Playwright (`APIRequestContext`), TypeScript, dotenv
- **Run model:** fully parallel, every test creates its own customer

## Coverage

| Feature             | IDs                | Tests  |
| ------------------- | ------------------ | ------ |
| Authentication      | AUTH-01 to AUTH-07 | 7      |
| Accounts            | ACC-01 to ACC-04   | 4      |
| Transfers           | TRF-01 to TRF-08   | 8      |
| Bill pay            | BILL-01 to BILL-04 | 4      |
| Loans               | LOAN-01 to LOAN-04 | 4      |
| Transaction history | TXN-01 to TXN-04   | 4      |
| **Total**           |                    | **31** |

## Getting started

### Prerequisites

- Node.js 18 or later
- Docker, with QABank running and reachable at `http://localhost:8080`

### Install

```bash
npm install
```

### Configure

Settings live in `config/.env.<ENV>`. `ENV` defaults to `qa`, so the suite reads `config/.env.qa`:

```
API_BASE_URL=http://localhost:8080/api
```

To target another environment, create `config/.env.<name>` and run with `ENV=<name>`.

### Run

```bash
npx playwright test                              # whole suite
npx playwright test tests/api/Transfers.spec.ts  # one feature
npx playwright test -g "TRF-02"                  # one test, by ID
npx playwright test --repeat-each=10             # flakiness check
```

## Project structure

```
config/
  .env.qa                  environment settings
src/
  api/
    ApiHelper.ts           thin wrapper over APIRequestContext (get/post/put/patch/delete)
    Auth.ts                register, login, logout, customer payload generation
    Accounts.ts            list accounts, read balance, open savings accounts
    Transfer.ts            transfer funds, shared setup, bulk transfers
    BillPay.ts             pay a bill
    Loan.ts                request a loan
    Transactions.ts        transaction history with optional filters
  fixtures/
    ApiFixtures.ts         apiHelper and anonApiHelper fixtures
tests/
  api/
    Auth.spec.ts
    Accounts.spec.ts
    Transfers.spec.ts
    BillPay.spec.ts
    Loans.spec.ts
    Transactions.spec.ts
playwright.config.ts
```

## Design decisions

- **Spec files hold only the call and the assertions.** Setup, payload building and request details live in the helpers under `src/api`. A spec reads as the scenario it verifies.
- **Every test is independent.** Each test registers its own customer with a unique username, so tests run in parallel (`fullyParallel: true`) and never depend on execution order. Shared setup runs in `beforeEach`.
- **Two clients, two session states.** `apiHelper` carries the session cookie from registration. `anonApiHelper` is a fresh context with no cookies, used for 401 checks and for proving that login sets a session.
- **Helpers return the raw `{ status, body }`.** Negative tests can assert the status code and error message directly. Typed interfaces (`Account`, `LoanResponse`, `Transaction`, ...) annotate the response body at the call site.
- **Boundaries, not just happy paths.** Rules are tested at the edge: an overdraft of one cent over the balance, a loan at exactly 10 times the down payment and one cent above it, an amount filter one cent off a seeded value.
- **Verify by reading back.** A write is confirmed through a second `GET`: balances after a transfer or loan, a new account in the account list, filtered transaction rows against the unfiltered list.
- **Each rule is isolated.** Denial tests break exactly one rule at a time, so a failure points at one cause.

## Test catalogue

Test titles carry their ID, so any test can be run with `-g "<ID>"`. Descriptions are also attached to each test as a `description` annotation.

### Authentication

| ID      | Test                                                         | Description                                                                                                                                               |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AUTH-01 | creates customer with funded checking account                | Register returns 201 with `customerId`, `username` and `checkingAccountId`. A follow-up `GET /api/accounts` shows the checking account with balance 1000. |
| AUTH-02 | rejects missing required field                               | Register with a required field omitted returns 400, and the `fields` array names the missing field.                                                       |
| AUTH-03 | rejects duplicate username                                   | Registering a second customer with an already-used username returns 409.                                                                                  |
| AUTH-04 | logs in with valid credentials                               | Login with correct credentials returns 200 with the customer, and the session cookie is set (verified by a following authenticated call).                 |
| AUTH-05 | rejects wrong password and unknown username                  | Login with a wrong password, and separately with an unknown username, returns 400 in both cases.                                                          |
| AUTH-06 | `/api/me` returns 401 without session, customer with session | `GET /api/me` with no session returns 401. With a registered session it returns 200 and the correct customer.                                             |
| AUTH-07 | blocks account access after logout                           | After logout, `GET /api/accounts` returns 401.                                                                                                            |

### Accounts

| ID     | Test                                            | Description                                                                                                                                             |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACC-01 | new customer has one funded checking account    | A newly registered customer has exactly one `CHECKING` account with balance 1000.                                                                       |
| ACC-02 | opens savings account funded with 100           | Opening a savings account creates it with 100 and takes 100 from checking. Both are confirmed by reading the accounts back.                             |
| ACC-03 | rejects savings opening with insufficient funds | After the checking balance is drained, opening another savings account returns 400 `Insufficient funds to open a new account`, and no account is added. |
| ACC-04 | rejects non-savings account type                | Opening an account of type `CHECKING` returns 400 `Only SAVINGS can be opened`, and the customer still has one account with balance 1000.               |

### Transfers

| ID     | Test                                | Description                                                                                       |
| ------ | ----------------------------------- | ------------------------------------------------------------------------------------------------- |
| TRF-01 | moves money between own accounts    | A transfer from checking to savings succeeds, and both balances change by exactly the amount.     |
| TRF-02 | rejects overdraft                   | A transfer of one cent more than the source balance is rejected, and both balances are unchanged. |
| TRF-03 | rejects negative amount             | A transfer with a negative amount is rejected, and balances are unchanged.                        |
| TRF-04 | rejects zero amount                 | A transfer of 0 is rejected, and balances are unchanged.                                          |
| TRF-05 | rejects more than 2 decimal places  | A transfer amount with three decimal places is rejected, and balances are unchanged.              |
| TRF-06 | rejects same-account transfer       | A transfer from an account to itself is rejected, and the balance is unchanged.                   |
| TRF-07 | rejects unknown destination account | A transfer to an account id that does not exist is rejected, and the source balance is unchanged. |
| TRF-08 | blocks transfer without session     | A transfer sent without a session returns 401 `Not logged in`, and balances are unchanged.        |

### Bill pay

| ID      | Test                                          | Description                                                                                         |
| ------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| BILL-01 | pays a bill from checking and records a debit | Paying a bill from checking succeeds, reduces the balance by the amount and records a debit.        |
| BILL-02 | pays a bill from savings and records a debit  | Paying a bill from savings succeeds, reduces the savings balance by the amount and records a debit. |
| BILL-03 | rejects negative amount                       | A bill payment with a negative amount is rejected, and the balance is unchanged.                    |
| BILL-04 | rejects insufficient funds                    | A bill payment larger than the account balance is rejected, and the balance is unchanged.           |

### Loans

A loan is approved when `amount <= downPayment * 10` and the source account can cover the down payment.

| ID      | Test                                     | Description                                                                                                                               |
| ------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| LOAN-01 | approves loan from checking              | A loan at exactly 10 times the down payment is approved, a `LOAN` account appears, and checking drops by the down payment.                |
| LOAN-02 | approves loan from savings               | The same approval from savings. The savings balance drops by the down payment, and checking is unchanged.                                 |
| LOAN-03 | denies loan above the limit              | A loan one cent above 10 times the down payment is denied, no `LOAN` account is created, and the balance is unchanged.                    |
| LOAN-04 | denies down payment above source balance | From savings, a down payment one cent above the savings balance is denied, no `LOAN` account is created, and both balances are unchanged. |

### Transaction history

| ID     | Test                                    | Description                                                                                                                                                         |
| ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TXN-01 | filters by exact amount                 | Four seeded transfers (10, 25, 25, 40). Filtering by amount 25 returns exactly the two rows of 25, which rules out range matching.                                  |
| TXN-02 | returns empty list for unmatched amount | Filtering by 25.01, one cent off a seeded amount, returns 200 with an empty list, not an error.                                                                     |
| TXN-03 | filters by type Debit                   | After transfers out of and into checking, filtering by `Debit` returns exactly the Debit rows of the unfiltered list and no Credit row.                             |
| TXN-04 | filters by type Credit                  | After a transfer into and out of savings, filtering by `Credit` returns exactly the Credit rows of the unfiltered list, includes the transfer in, and no Debit row. |
