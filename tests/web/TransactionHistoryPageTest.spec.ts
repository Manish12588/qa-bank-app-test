import { DEFAULT_PASSWORD, loginCustomer } from "../../src/api/Auth";
import { transferMany } from "../../src/api/Transfer";
import { test, expect } from "../../src/fixtures/PageFixtures";
import { RegisterResult } from "../../src/pages/AuthPage";

let registeredUser: RegisterResult;
let checkingAccountId: number;
let savingsAccountId: number;

test.beforeEach(async ({ basePage, authPage, accountsPage, loginPage }) => {
  await basePage.navigateTo("/register.html");
  registeredUser = await authPage.doRegister();
  expect(registeredUser.message).toBe(
    "Your account was created successfully. You are now logged in.",
  );
  await loginPage.goToLoginPage();
  await loginPage.doLogin(registeredUser.username, DEFAULT_PASSWORD);
  let accountsOverview = await accountsPage.getPageHeader();
  expect(accountsOverview).toBe("Accounts Overview");
  const displayedAccounts = await accountsPage.getDisplayedAccounts();
  checkingAccountId = displayedAccounts[0].accountNumber;
  savingsAccountId = await accountsPage.openNewAccounts();
});

test(
  "WEB-TXN-01: lists transfers in history",
  {
    annotation: {
      type: "description",
      description: `Transfer 50 from checking to savings through the UI. The history page lists the transaction with its type and amount.`,
    },
  },
  async ({ transferPage, transactionHistoryPage }) => {
    const amount = 50;
    let transferMessage = await transferPage.doTransferFund(
      amount,
      checkingAccountId,
      savingsAccountId,
    );
    expect(transferMessage).toBe(
      `$${amount.toFixed(2)} has been transferred from account #${checkingAccountId} to account #${savingsAccountId}.`,
    );

    await transactionHistoryPage.navigateToPageFromSideBar("Find Transactions");
    await transactionHistoryPage.doFindTransactions({
      account: checkingAccountId,
      amount: amount,
      type: "Debit",
    });
    await transactionHistoryPage.waitForRows(1);
    let transactions = await transactionHistoryPage.getDisplayedTransactions();
    expect(transactions[0].description).toBe("Funds Transfer Sent");
    expect(transactions[0].type).toBe("Debit");
    expect(transactions[0].amount).toBe(50);
  },
);

test(
  "WEB-TXN-02: filters by exact amount",
  {
    annotation: {
      type: "description",
      description: `Two transfers (25 and 40) exist. Filtering by 25 shows only the 25 row.`,
    },
  },
  async ({ transferPage, transactionHistoryPage, apiHelper }) => {
    await loginCustomer(apiHelper, registeredUser.username);
    await transferMany(
      apiHelper,
      checkingAccountId,
      savingsAccountId,
      [25, 40],
    );

    await transactionHistoryPage.navigateToPageFromSideBar("Find Transactions");
    await transactionHistoryPage.doFindTransactions({
      account: checkingAccountId,
      amount: 25,
    });
    await transactionHistoryPage.waitForRows(1); // the 40 is filtered out

    const transactions =
      await transactionHistoryPage.getDisplayedTransactions();
    expect(transactions[0].description).toBe("Funds Transfer Sent");
    expect(transactions[0].type).toBe("Debit");
    expect(transactions[0].amount).toBe(25);
  },
);

test(
  "WEB-TXN-03: filters by type",
  {
    annotation: {
      type: "description",
      description: `Filtering by Debit hides Credit rows, and the reverse. Only if the page has a type filter.`,
    },
  },
  async ({ transactionHistoryPage, apiHelper }) => {
    // seed: one Debit (25) and one Credit (10) on checking
    await loginCustomer(apiHelper, registeredUser.username);
    await transferMany(apiHelper, checkingAccountId, savingsAccountId, [25]);
    await transferMany(apiHelper, savingsAccountId, checkingAccountId, [10]);

    await transactionHistoryPage.navigateToPageFromSideBar("Find Transactions");

    // Debit filter: no Credit rows, and the 25 is listed
    await transactionHistoryPage.doFindTransactions({
      account: checkingAccountId,
      type: "Debit",
    });
    await transactionHistoryPage.waitForRowsOfType("Credit", 0);
    const debitRows = await transactionHistoryPage.getDisplayedTransactions();
    expect(debitRows.every((r) => r.type === "Debit")).toBe(true);
    expect(debitRows.some((r) => r.amount === 25)).toBe(true);

    // Credit filter: no Debit rows, and the 10 is listed
    await transactionHistoryPage.doFindTransactions({
      account: checkingAccountId,
      type: "Credit",
    });
    await transactionHistoryPage.waitForRowsOfType("Debit", 0);
    const creditRows = await transactionHistoryPage.getDisplayedTransactions();
    expect(creditRows.every((r) => r.type === "Credit")).toBe(true);
    expect(creditRows.some((r) => r.amount === 10)).toBe(true);
  },
);
