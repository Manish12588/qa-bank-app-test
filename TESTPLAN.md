# QABank Test Plan

Every test by ID, with what it checks. Back to the [README](README.md) for setup and structure.

Run one test by ID: `npx playwright test -g "TRF-02"` (API) or `npx playwright test -g "WEB-TRF-02"` (UI).

**Contents**

- [API tests (31)](#api-tests)
  [Authentication](#authentication) · [Accounts](#accounts) · [Transfers](#transfers) · [Bill pay](#bill-pay) · [Loans](#loans) · [Transaction history](#transaction-history)
- [UI tests (19)](#ui-tests)
  [Authentication](#ui-authentication) · [Accounts](#ui-accounts) · [Transfers](#ui-transfers) · [Bill pay](#ui-bill-pay) · [Loans](#ui-loans) · [Transaction history](#ui-transaction-history)

---

## API tests

Files in `tests/api/`. Each description is also attached to its test as a `description` annotation.

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

---

## UI tests

Files in `tests/web/`. UI tests check journeys and what the screen shows. The rules at their boundaries are covered in the API tests above. Where a test needs several records or an API session, it uses the API helpers for setup.

### UI Authentication

| ID          | Test                                   | Description                                                                                                                                                                        |
| ----------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WEB-AUTH-01 | registers and lands on dashboard       | Fill the register form with valid data. The user lands on the dashboard, which shows one checking account with 1000. Drives the form, no API setup.                                |
| WEB-AUTH-02 | shows error for missing required field | Submitting with a required field blank is blocked by the browser's validation. The blank field is identified, and no customer can log in with that username (checked via the API). |
| WEB-AUTH-03 | shows error for duplicate username     | A customer created via the API, then registered again through the form with the same username, shows the duplicate-username message.                                               |
| WEB-AUTH-04 | logs in with valid credentials         | Logging in with a registered customer's credentials opens the logged-in area.                                                                                                      |
| WEB-AUTH-05 | shows error for wrong password         | A wrong password shows the login error and stays on the login page.                                                                                                                |
| WEB-AUTH-06 | logs out and returns to login          | Logging out returns to the login page.                                                                                                                                             |
| WEB-AUTH-07 | redirects to login without a session   | Opening the accounts page with no session redirects to the login page.                                                                                                             |

### UI Accounts

| ID         | Test                                    | Description                                                                                                                                |
| ---------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| WEB-ACC-01 | dashboard shows funded checking account | After login the dashboard lists exactly one account, `CHECKING` with balance 1000, and its account number matches the one the API returns. |
| WEB-ACC-02 | opens savings account from the UI       | Opening a savings account through the UI adds a second row. The new account is `SAVINGS` with balance 100 and checking shows 900.          |

### UI Transfers

| ID         | Test                           | Description                                                                                                   |
| ---------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| WEB-TRF-01 | transfers between own accounts | Transferring 50 from checking to savings shows the success message, and the dashboard then shows 850 and 150. |
| WEB-TRF-02 | shows error for overdraft      | A transfer larger than the source balance shows the error message on the page.                                |
| WEB-TRF-03 | rejects zero amount            | A transfer of 0 is rejected and the page shows the error message.                                             |

### UI Bill pay

| ID          | Test                               | Description                                             |
| ----------- | ---------------------------------- | ------------------------------------------------------- |
| WEB-BILL-01 | pays a bill from checking          | Paying a bill from checking shows the success message.  |
| WEB-BILL-02 | shows error for insufficient funds | A bill larger than the balance shows the error message. |

### UI Loans

| ID          | Test                             | Description                                                                    |
| ----------- | -------------------------------- | ------------------------------------------------------------------------------ |
| WEB-LOAN-01 | approved loan shows loan account | An approvable loan shows the approval message and the new loan account number. |
| WEB-LOAN-02 | denied loan shows rejection      | A loan above the limit shows the denial message and no loan account number.    |

### UI Transaction history

| ID         | Test                       | Description                                                                                                                                                               |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WEB-TXN-01 | lists transfers in history | A transfer of 50 made through the UI appears on the history page as a Debit of 50, described "Funds Transfer Sent". End to end: transfer on one screen, shown on another. |
| WEB-TXN-02 | filters by exact amount    | With transfers of 25 and 40 seeded via the API, filtering by 25 shows only the 25 row.                                                                                    |
| WEB-TXN-03 | filters by type            | With a Debit (25) and a Credit (10) on checking seeded via the API, filtering by Debit leaves no Credit rows and includes the 25, and the reverse for Credit.             |
