//Pagefixtures: collections of all the objects, Fixtures is the collections of the pages
//1. Create an alias of test object as baseTest

import { test as baseTest } from "@playwright/test";
import { BasePage } from "../pages/BasePage";

type pageFixtures = {
  basePage: BasePage;
};

//Extends the playwright test
export let test = baseTest.extend<pageFixtures>({
  basePage: async ({ page }, use) => {
    let basePage = new BasePage(page);
    use(basePage); //default: what exactly you wanted to give it to test
  },
});

export { expect } from "@playwright/test"; //Advantange of to add this expect it will work with my fixures as well
