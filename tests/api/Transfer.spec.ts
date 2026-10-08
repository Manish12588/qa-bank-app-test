import { test, expect } from "../../src/fixtures/ApiFixtures";
import { registerCustomer } from "../../src/api/Auth";
import { getBalance, openAccount } from "../../src/api/Accounts";
import { setupCustomerWithSavings, transferFund } from "../../src/api/Transfer";

let checkingId: number;
let savingsId: number;

test.beforeEach(async ({ apiHelper }) => {
  ({ checkingId, savingsId } = await setupCustomerWithSavings(apiHelper)); // checking 900, savings 100
});

test(
  "TRF-01 moves money between own accounts",
  {
    annotation: {
      type: "description",
      description: `A valid POST /api/transfers from checking to savings returns success. 
      Read back through GET /api/accounts: the source dropped by the amount, 
      the destination rose by the same amount, and the total across both accounts is unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer from CHecking to Savings
    const response = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: savingsId,
      amount: 250,
    });
    expect(response.status).toBe(200);

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(checking).toBe(650);
    expect(savingsBalance).toBe(350);
    expect(checking + savingsBalance).toBe(1000);
  },
);

test(
  "TRF-02 rejects overdraft",
  {
    annotation: {
      type: "description",
      description: `Transferring more than the source balance returns 400. Both balances are unchanged afterwards (verified by a second GET /api/accounts).`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer from CHecking to Savings
    const transfer = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: savingsId,
      amount: 1000,
    });
    expect(transfer.status).toBe(400);
    expect(transfer.body.error).toBe("Insufficient funds");

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(checking).toBe(900);
    expect(savingsBalance).toBe(100);
    expect(checking + savingsBalance).toBe(1000);
  },
);

test(
  "TRF-03 rejects negative amount",
  {
    annotation: {
      type: "description",
      description: `A transfer with a negative amount returns 400, and both balances are unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer from CHecking to Savings (Negative)
    const transfer = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: savingsId,
      amount: -100,
    });
    expect(transfer.status).toBe(400);
    expect(transfer.body.error).toBe("Amount must be a positive number");

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(checking).toBe(900);
    expect(savingsBalance).toBe(100);
    expect(checking + savingsBalance).toBe(1000);
  },
);

test(
  "TRF-04 rejects zero amount",
  {
    annotation: {
      type: "description",
      description: `A transfer with an amount of 0 returns 400, and both balances are unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer from CHecking to Savings (Zero)
    const transfer = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: savingsId,
      amount: 0,
    });
    expect(transfer.status).toBe(400);
    expect(transfer.body.error).toBe("Amount must be a positive number");

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(checking).toBe(900);
    expect(savingsBalance).toBe(100);
    expect(checking + savingsBalance).toBe(1000);
  },
);

test(
  "TRF-05 rejects more than 2 decimal places",
  {
    annotation: {
      type: "description",
      description: `A transfer with an amount such as 10.123 returns 400, and both balances are unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer from CHecking to Savings (Decimal Value)
    const transfer = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: savingsId,
      amount: 100.123,
    });
    expect(transfer.status).toBe(400);
    expect(transfer.body.error).toBe(
      "Amount cannot have more than two decimal places",
    );

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(checking).toBe(900);
    expect(savingsBalance).toBe(100);
    expect(checking + savingsBalance).toBe(1000);
  },
);

test(
  "TRF-06 rejects same-account transfer",
  {
    annotation: {
      type: "description",
      description: `Transferring from an account to itself returns 400, and the balance is unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer to same account (CHECKING)
    const checkingTransfer = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: checkingId,
      amount: 100,
    });
    expect(checkingTransfer.status).toBe(400);
    expect(checkingTransfer.body.error).toBe(
      "Cannot transfer to the same account",
    );

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    expect(checking).toBe(900);
  },
);

test(
  "TRF-07 rejects unknown destination account",
  {
    annotation: {
      type: "description",
      description: `A transfer to an account id that does not exist returns 400, and the source balance is unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //Transfer to account which does not exist
    const transfer = await transferFund(apiHelper, {
      fromAccountId: checkingId,
      toAccountId: 123456,
      amount: 100,
    });
    expect(transfer.status).toBe(400);
    expect(transfer.body.error).toBe(
      `Could not find account number ${checkingId} and/or 123456`,
    );

    //Read back through a second GET
    const checking = await getBalance(apiHelper, checkingId);
    expect(checking).toBe(900);
  },
);

test(
  "TRF-08 blocks transfer without session",
  {
    annotation: {
      type: "description",
      description: `POST /api/transfers through a client with no session returns 401.`,
    },
  },
  async ({ apiHelper, anonApiHelper }) => {
    const transfer = await transferFund(anonApiHelper, {
      fromAccountId: checkingId,
      toAccountId: savingsId,
      amount: 50,
    });
    expect(transfer.status).toBe(401);
    expect(transfer.body.error).toBe("Not logged in");

    //The logged-in client confirms that nothing moved
    expect(await getBalance(apiHelper, checkingId)).toBe(900);
    expect(await getBalance(apiHelper, savingsId)).toBe(100);
  },
);
