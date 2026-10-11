//Pagefixtures: collections of all the objects, Fixtures is the collections of the pages
//1. Create an alias of test object as baseTest

//import { test as baseTest } from "@playwright/test";
import { test as baseTest } from "./ApiFixtures";
import { BasePage } from "../pages/BasePage";
import { AuthPage } from "../pages/AuthPage";
import { LoginPage } from "../pages/LoginPage";
import { AccountsPage } from "../pages/AccountsPage";
import { TransferPage } from "../pages/TransferPage";
import { BillPayPage } from "../pages/BillPayPage";
import { LoanPage } from "../pages/LoanPage";
import { TransactionHistoryPage } from "../pages/TransactionHistoryPage";

type pageFixtures = {
  basePage: BasePage;
  authPage: AuthPage;
  loginPage: LoginPage;
  accountsPage: AccountsPage;
  transferPage: TransferPage;
  billPayPage: BillPayPage;
  loanPage: LoanPage;
  transactionHistoryPage: TransactionHistoryPage;
};

//Extends the playwright test
export const test = baseTest.extend<pageFixtures>({
  basePage: async ({ page }, use) => {
    const basePage = new BasePage(page);
    use(basePage); //default: what exactly you wanted to give it to test
  },
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    use(authPage); //default: what exactly you wanted to give it to test
  },
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    use(loginPage); //default: what exactly you wanted to give it to test
  },
  accountsPage: async ({ page }, use) => {
    const accountsPage = new AccountsPage(page);
    use(accountsPage); //default: what exactly you wanted to give it to test
  },
  transferPage: async ({ page }, use) => {
    const transferPage = new TransferPage(page);
    use(transferPage); //default: what exactly you wanted to give it to test
  },
  billPayPage: async ({ page }, use) => {
    const billPayPage = new BillPayPage(page);
    use(billPayPage); //default: what exactly you wanted to give it to test
  },
  loanPage: async ({ page }, use) => {
    const loanPage = new LoanPage(page);
    use(loanPage); //default: what exactly you wanted to give it to test
  },
  transactionHistoryPage: async ({ page }, use) => {
    const transactionHistoryPage = new TransactionHistoryPage(page);
    use(transactionHistoryPage); //default: what exactly you wanted to give it to test
  },
});

export { expect } from "@playwright/test"; //Advantange of to add this expect it will work with my fixures as well
