import { test, expect } from "../../src/fixtures/ApiFixtures";
import { registerCustomer } from "../../src/api/Auth";
import {
  Account,
  getAccounts,
  openAccount,
  openSavingsAccounts,
} from "../../src/api/Accounts";

test(
  "ACC-01 new customer has one funded checking account",
  {
    annotation: {
      type: "description",
      description:
        "GET /api/accounts for a freshly registered customer returns exactly one account, of type CHECKING, with balance 1000.",
    },
  },
  async ({ apiHelper }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);

    const accounts = await getAccounts(apiHelper);
    expect(accounts.status).toBe(200);
    expect(accounts.body).toHaveLength(1);
    expect(accounts.body[0]).toMatchObject({
      id: registeredCustomer.checkingAccountId,
      customerId: registeredCustomer.customerId,
      type: "CHECKING",
      balance: 1000,
    });
  },
);

test(
  "ACC-02 opens savings account funded with 100",
  {
    annotation: {
      type: "description",
      description: `Opening a SAVINGS account returns success. The new account has balance 100, and the source account drops 
        by exactly 100 (verified by reading both back through GET /api/accounts).`,
    },
  },
  async ({ apiHelper }) => {
    //Register a New Customer
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);

    //Open Savings Account
    const response = await openAccount(apiHelper, {
      type: "SAVINGS",
      fromAccountId: registeredCustomer.checkingAccountId,
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      customerId: registeredCustomer.customerId,
      type: "SAVINGS",
      balance: 100,
    });

    //Verified both the accounts
    const accounts = await getAccounts(apiHelper);
    expect(accounts.status).toBe(200);
    expect(accounts.body).toHaveLength(2);

    const checking = accounts.body.find(
      (a: Account) => a.id === registeredCustomer.checkingAccountId,
    );
    const savings = accounts.body.find((a: Account) => a.type === "SAVINGS");
    expect(checking).toMatchObject({ balance: 900 });
    expect(savings).toMatchObject({
      customerId: registeredCustomer.customerId,
      balance: 100,
    });
  },
);

test(
  "ACC-03 rejects savings opening with insufficient funds",
  {
    annotation: {
      type: "description",
      description:
        "Opening a SAVINGS account from a source account with a balance below 100 returns 400, and no account is created.",
    },
  },
  async ({ apiHelper }) => {
    //Register a New Customer
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);

    //Opening 10 Savings Accounts
    await openSavingsAccounts(
      apiHelper,
      registeredCustomer.checkingAccountId,
      10,
    );

    //Now Open another savings account
    const response = await openAccount(apiHelper, {
      type: "SAVINGS",
      fromAccountId: registeredCustomer.checkingAccountId,
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Insufficient funds to open a new account",
    );

    //Validation
    const accounts = await getAccounts(apiHelper);
    expect(accounts.body).toHaveLength(11);
    const checking = accounts.body.find(
      (a: Account) => a.id === registeredCustomer.checkingAccountId,
    );
    expect(checking.balance).toBe(0);
  },
);

test(
  "ACC-04 rejects non-savings account type",
  {
    annotation: {
      type: "description",
      description:
        "Opening an account with a type other than SAVINGS returns 400, and no account is created.",
    },
  },
  async ({ apiHelper }) => {
    //Register a New Customer
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);

    //Now Open another CHECKING account
    const response = await openAccount(apiHelper, {
      type: "CHECKING",
      fromAccountId: registeredCustomer.checkingAccountId,
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe(
      "Only SAVINGS can be opened (CHECKING is created at registration)",
    );

    //Nothing was created and nothing was deducted
    const accounts = await getAccounts(apiHelper);
    expect(accounts.body).toHaveLength(1);
    expect(accounts.body[0]).toMatchObject({
      id: registeredCustomer.checkingAccountId,
      type: "CHECKING",
      balance: 1000,
    });
  },
);
