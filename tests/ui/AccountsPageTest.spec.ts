import { Account, getAccounts } from "../../src/api/Accounts";
import {
  registerCustomer,
  DEFAULT_PASSWORD,
  loginCustomer,
} from "../../src/api/Auth";
import { test, expect } from "../../src/fixtures/PageFixtures";
import { AccountsPage } from "../../src/pages/AccountsPage";
import { RegisterResult } from "../../src/pages/AuthPage";

let registeredUser: RegisterResult;

test.beforeEach(async ({ basePage, authPage }) => {
  await basePage.navigateTo("/register.html");
  registeredUser = await authPage.doRegister();
  expect(registeredUser.message).toBe(
    "Your account was created successfully. You are now logged in.",
  );
});

test(
  "WEB-ACC-01: dashboard shows funded checking account",
  {
    annotation: {
      type: "description",
      description: `A new customer sees exactly one checking account with balance 1000.00.`,
    },
  },
  async ({ loginPage, accountsPage, apiHelper, page }) => {
    await loginPage.goToLoginPage();
    await loginPage.doLogin(registeredUser.username, DEFAULT_PASSWORD);
    let accountsOverview = await accountsPage.getPageHeader();
    expect(accountsOverview).toBe("Accounts Overview");

    //Fetch all the accounts from UI
    const displayedAccounts = await accountsPage.getDisplayedAccounts();

    //Login
    await loginCustomer(apiHelper, registeredUser.username);
    const response = await getAccounts(apiHelper);
    expect(response.status).toBe(200);
    const fromApi: Account[] = response.body;

    expect(displayedAccounts).toEqual([
      { accountNumber: fromApi[0].id, accountType: "CHECKING", balance: 1000 },
    ]);
  },
);

test(
  "WEB-ACC-02: opens savings account from the UI",
  {
    annotation: {
      type: "description",
      description: `Open a savings account through the UI. It appears with balance 100, and checking shows 900.`,
    },
  },
  async ({ loginPage, accountsPage, apiHelper, page }) => {
    await loginPage.goToLoginPage();
    await loginPage.doLogin(registeredUser.username, DEFAULT_PASSWORD);
    let accountsOverview = await accountsPage.getPageHeader();
    expect(accountsOverview).toBe("Accounts Overview");

    let savingsAccountId = await accountsPage.openNewAccounts();
    const displayedAccouts = await accountsPage.getDisplayedAccounts();
    expect(displayedAccouts).toHaveLength(2);

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
