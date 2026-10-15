import { registerCustomer, DEFAULT_PASSWORD } from "../../src/api/Auth";
import { test, expect } from "../../src/fixtures/PageFixtures";

test.beforeEach(async ({ basePage }) => {
  await basePage.navigateTo("/register.html");
});

test(
  "WEB-AUTH-01: registers and lands on dashboard",
  {
    annotation: {
      type: "description",
      description: `Fill the register form with valid data. The user lands on the dashboard, which shows one checking account with 1000. Drives the form, no API setup.`,
    },
  },
  async ({ authPage, page }) => {
    let register = await authPage.doRegister();
    expect(register.message).toBe(
      "Your account was created successfully. You are now logged in.",
    );
  },
);

test(
  "WEB-AUTH-02: shows error for missing required field",
  {
    annotation: {
      type: "description",
      description: `Submit the register form with one required field empty. An error names the field, and the user stays on the form. Drives the form, no API setup.`,
    },
  },
  async ({ authPage }) => {
    const { username, field } = await authPage.submitInvalid({
      firstName: "",
    });
    expect(field).toBe("firstName");
  },
);

test(
  "WEB-AUTH-03: shows error for duplicate username",
  {
    annotation: {
      type: "description",
      description: `Create a customer through the API, then register the same username in the UI. An error is shown, and no second account is created. Drives the form.`,
    },
  },
  async ({ apiHelper, authPage, page }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);
    let registerResult = await authPage.doRegister({
      username: registeredCustomer.username,
    });
    expect(registerResult.message).toBe("This username already exists.");
  },
);

test(
  "WEB-AUTH-04: logs in with valid credentials",
  {
    tag: "@smoke",
    annotation: {
      type: "description",
      description: `A customer registered through the API logs in through the form and lands on the dashboard.`,
    },
  },
  async ({ apiHelper, loginPage, accountsPage, page }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);
    await loginPage.goToLoginPage();
    await loginPage.doLogin(registeredCustomer.username, DEFAULT_PASSWORD);

    let header = await accountsPage.getPageHeader();
    expect(header).toBe("Accounts Overview");
  },
);

test(
  "WEB-AUTH-05: shows error for wrong password",
  {
    annotation: {
      type: "description",
      description: `Logging in with a wrong password shows an error, and the user stays on the login page.`,
    },
  },
  async ({ apiHelper, loginPage, page }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);
    await loginPage.goToLoginPage();
    await loginPage.doLogin(registeredCustomer.username, "IncorrectPassword");

    const message = await loginPage.getLoginMessage();
    expect(message).toBe("Invalid username and/or password");
    await expect(page).toHaveURL(/login/);
  },
);

test(
  "WEB-AUTH-06: logs out and returns to login",
  {
    annotation: {
      type: "description",
      description: `Click logout. The login page appears, and going back to the dashboard URL does not show the account.`,
    },
  },
  async ({ apiHelper, loginPage, accountsPage, page }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);
    await loginPage.goToLoginPage();
    await loginPage.doLogin(registeredCustomer.username, DEFAULT_PASSWORD);
    expect(await accountsPage.getPageHeader()).toBe("Accounts Overview");
    await expect(page).toHaveURL(/dashboard/);
    await accountsPage.doLogout();
    await expect(page).toHaveURL(/login/);
  },
);

test(
  "WEB-AUTH-07: redirects to login without a session",
  {
    annotation: {
      type: "description",
      description: `Opening the dashboard URL in a browser with no session redirects to the login page.`,
    },
  },
  async ({ basePage, page }) => {
    await basePage.navigateTo("/dashboard.html");
    await expect(page).toHaveURL(/login/);
  },
);
