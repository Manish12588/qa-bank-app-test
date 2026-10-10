//Pagefixtures: collections of all the objects, Fixtures is the collections of the pages
//1. Create an alias of test object as baseTest

//import { test as baseTest } from "@playwright/test";
import { test as baseTest } from "./ApiFixtures";
import { BasePage } from "../pages/BasePage";
import { AuthPage } from "../pages/AuthPage";
import { LoginPage } from "../pages/LoginPage";
import { AccountsPage } from "../pages/AccountsPage";

type pageFixtures = {
  basePage: BasePage;
  authPage: AuthPage;
  loginPage: LoginPage;
  accountsPage: AccountsPage;
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
});

export { expect } from "@playwright/test"; //Advantange of to add this expect it will work with my fixures as well
