import { test as baseTest, request } from "@playwright/test";
import { ApiHelper } from "../api/ApiHelper";
import process from "process";

//Define the type of API fixtures
type ApiFixtures = {
  apiHelper: ApiHelper;
};

export let test = baseTest.extend<ApiFixtures>({
  apiHelper: async ({ request }, use) => {
    const apiBaseUrl = process.env.API_BASE_URL;
    if (!apiBaseUrl)
      throw new Error("API_BASE_URL is not set. Check config/.env.<ENV>");
    await use(new ApiHelper(request, apiBaseUrl));
  },
});

export { expect } from "@playwright/test";
