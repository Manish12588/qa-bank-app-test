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
  "WEB-BILL-01: pays a bill from checkings",
  {
    annotation: {
      type: "description",
      description: `Pay a bill through the form. A confirmation appears, the balance drops by the amount, and the payment shows in history as a debit.`,
    },
  },
  async ({ billPayPage, transferPage, accountsPage, page }) => {
    const amount = 50;
    await billPayPage.navigateToPageFromSideBar("Bill Pay");
    let billPay = await billPayPage.doBillPay(
      "Automation Bill Payment",
      amount,
      checkingAccountId,
    );
    expect(billPay).toBe(
      `Bill Payment to Automation Bill Payment in the amount of $${amount.toFixed(2)} from account #${checkingAccountId} was successful.`,
    );
    await transferPage.navigateToPageFromSideBar("Accounts Overview");
    const displayedAccouts = await accountsPage.getDisplayedAccounts();
    expect(displayedAccouts).toContainEqual({
      accountNumber: Number(savingsAccountId),
      accountType: "SAVINGS",
      balance: 100,
    });
    expect(
      displayedAccouts.find((a) => a.accountType === "CHECKING")?.balance,
    ).toBe(850);
  },
);

test(
  "WEB-BILL-02: shows error for insufficient funds",
  {
    annotation: {
      type: "description",
      description: `A bill above the balance shows an error, and the balance is unchanged.`,
    },
  },
  async ({ billPayPage, transferPage, accountsPage }) => {
    const amount = 1000;
    await billPayPage.navigateToPageFromSideBar("Bill Pay");
    let billPay = await billPayPage.doBillPay(
      "Automation Bill Payment",
      amount,
      checkingAccountId,
    );
    expect(billPay).toBe(`Insufficient funds`);
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
