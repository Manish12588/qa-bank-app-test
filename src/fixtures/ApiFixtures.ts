import { test as baseTest, request } from "@playwright/test";
import { ApiHelper } from "../api/ApiHelper";
import process from "process";

//Define the type of API fixtures
type ApiFixtures = {
  apiHelper: ApiHelper;
  anonApiHelper: ApiHelper;
};

export let test = baseTest.extend<ApiFixtures>({
  apiHelper: async ({ request }, use) => {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl)
      throw new Error("API_BASE_URL is not set. Check config/.env.<ENV>");
    await use(new ApiHelper(request, apiBaseUrl));
  },
  anonApiHelper: async ({ playwright }, use) => {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl)
      throw new Error("API_BASE_URL is not set. Check config/.env.<ENV>");
    const context = await playwright.request.newContext(); // new context = empty cookies
    await use(new ApiHelper(context, apiBaseUrl));
    await context.dispose(); // close it after the test
  },
});

export { expect } from "@playwright/test";
