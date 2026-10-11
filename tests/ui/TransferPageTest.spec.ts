import { DEFAULT_PASSWORD } from "../../src/api/Auth";
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
  "WEB-TRF-01: transfers between own accounts",
  {
    annotation: {
      type: "description",
      description: `Transfer 50 from checking to savings. A success message appears, and the dashboard shows 850 and 150.`,
    },
  },
  async ({ transferPage, accountsPage, page }) => {
    const amount = 50;
    let transferMessage = await transferPage.doTransferFund(
      amount,
      checkingAccountId,
      savingsAccountId,
    );
    expect(transferMessage).toBe(
      `$${amount.toFixed(2)} has been transferred from account #${checkingAccountId} to account #${savingsAccountId}.`,
    );
    await transferPage.navigateToPageFromSideBar("Accounts Overview");
    const displayedAccouts = await accountsPage.getDisplayedAccounts();
    expect(displayedAccouts).toContainEqual({
      accountNumber: Number(savingsAccountId),
      accountType: "SAVINGS",
      balance: 150,
    });
    expect(
      displayedAccouts.find((a) => a.accountType === "CHECKING")?.balance,
    ).toBe(850);
  },
);

test(
  "WEB-TRF-02: shows error for overdraft",
  {
    annotation: {
      type: "description",
      description: `Transfer 900.01 from a 900 balance. An error is shown, and both balances are unchanged.`,
    },
  },
  async ({ transferPage, accountsPage, page }) => {
    const amount = 900.01;
    let transferMessage = await transferPage.doTransferFund(
      amount,
      checkingAccountId,
      savingsAccountId,
    );
    expect(transferMessage).toBe(`Insufficient funds`);
    await transferPage.navigateToPageFromSideBar("Accounts Overview");
    const displayedAccouts = await accountsPage.getDisplayedAccounts();
    expect(displayedAccouts).toContainEqual({
      accountNumber: Number(savingsAccountId),
      accountType: "SAVINGS",
      balance: 100,
    });
    expect(
      displayedAccouts.find((a) => a.accountType === "CHECKING")?.balance,
    ).toBe(900);
  },
);

test(
  "WEB-TRF-03: rejects zero amount",
  {
    annotation: {
      type: "description",
      description: `A transfer of 0 shows an error, and balances are unchanged. Only if the form validates in the browser or on the server with a visible message.`,
    },
  },
  async ({ transferPage, accountsPage, page }) => {
    const amount = 0;
    let transferMessage = await transferPage.doTransferFund(
      amount,
      checkingAccountId,
      savingsAccountId,
    );
    expect(transferMessage).toBe(`Amount must be a positive number`);
    await transferPage.navigateToPageFromSideBar("Accounts Overview");
    const displayedAccouts = await accountsPage.getDisplayedAccounts();
    expect(displayedAccouts).toContainEqual({
      accountNumber: Number(savingsAccountId),
      accountType: "SAVINGS",
      balance: 100,
    });
    expect(
      displayedAccouts.find((a) => a.accountType === "CHECKING")?.balance,
    ).toBe(900);
  },
);
