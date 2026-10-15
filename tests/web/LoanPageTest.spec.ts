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
  "WEB-LOAN-01: approved loan shows loan account",
  {
    tag: "@smoke",
    annotation: {
      type: "description",
      description: `Down payment 90, amount 900. An approval message appears, a LOAN account is listed, and checking shows 810.`,
    },
  },
  async ({ loanPage, transferPage, accountsPage, page }) => {
    const amount = 900;
    const downPayment = 90;
    await loanPage.navigateToPageFromSideBar("Request Loan");
    let loanResponse = await loanPage.doRequestLoan(
      amount,
      downPayment,
      checkingAccountId,
    );
    expect(loanResponse.message).toBe(
      "Congratulations, your loan has been approved.",
    );
    expect(loanResponse.accountId).toBeGreaterThan(0);

    await transferPage.navigateToPageFromSideBar("Accounts Overview");
    const displayedAccouts = await accountsPage.getDisplayedAccounts();
    expect(
      displayedAccouts.find((a) => a.accountType === "LOAN")?.balance,
    ).toBe(900);
    expect(displayedAccouts).toContainEqual({
      accountNumber: Number(savingsAccountId),
      accountType: "SAVINGS",
      balance: 100,
    });
    expect(
      displayedAccouts.find((a) => a.accountType === "CHECKING")?.balance,
    ).toBe(810);
  },
);

test(
  "WEB-LOAN-02: denied loan shows rejection",
  {
    annotation: {
      type: "description",
      description: `Amount above 10 times the down payment. A denial message appears, no LOAN account is listed, and the balance is unchanged.`,
    },
  },
  async ({ loanPage, transferPage, accountsPage, page }) => {
    const amount = 9000;
    const downPayment = 90;
    await loanPage.navigateToPageFromSideBar("Request Loan");
    let loanResponse = await loanPage.doRequestLoan(
      amount,
      downPayment,
      checkingAccountId,
    );
    expect(loanResponse.message).toBe("Your loan request has been denied.");

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
