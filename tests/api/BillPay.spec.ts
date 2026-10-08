import { getBalance } from "../../src/api/Accounts";
import { BillPayResponse, payBill } from "../../src/api/BillPay";
import { setupCustomerWithSavings } from "../../src/api/Transfer";
import { test, expect } from "../../src/fixtures/ApiFixtures";

let checkingId: number;
let savingsId: number;

test.beforeEach(async ({ apiHelper }) => {
  ({ checkingId, savingsId } = await setupCustomerWithSavings(apiHelper)); // checking 900, savings 100
});

test(
  "BILL-01 pays a bill from checking and records a debit",
  {
    annotation: {
      type: "description",
      description: `A valid bill payment from the checking account returns success. 
      The balance drops by exactly the paid amount (checked in the response and by a second GET /api/accounts), 
      and the payment appears in the transaction history as a Debit for that amount.`,
    },
  },
  async ({ apiHelper }) => {
    //PayBill from Checking Account
    const response = await payBill(apiHelper, {
      accountId: checkingId,
      amount: 100,
      payeeName: "Electric Checking Co",
    });
    expect(response.status).toBe(200);
    const paid: BillPayResponse = response.body;
    expect(paid).toMatchObject({
      payeeName: "Electric Checking Co",
      amount: 100,
      accountId: checkingId,
      balance: 800,
    });
    expect(await getBalance(apiHelper, checkingId)).toBe(800);
  },
);

test(
  "BILL-02 pays a bill from savings and records a debit",
  {
    annotation: {
      type: "description",
      description: `The same payment made from the savings account: the balance drops by exactly the paid amount, 
      and the payment appears in the transaction history as a Debit for that amount..`,
    },
  },
  async ({ apiHelper }) => {
    //PayBill from Checking Account
    const response = await payBill(apiHelper, {
      accountId: savingsId,
      amount: 50,
      payeeName: "Electric Savings Co",
    });
    expect(response.status).toBe(200);
    const paid: BillPayResponse = response.body;
    expect(paid).toMatchObject({
      payeeName: "Electric Savings Co",
      amount: 50,
      accountId: savingsId,
      balance: 50,
    });
    expect(await getBalance(apiHelper, savingsId)).toBe(50);
  },
);

test(
  "BILL-03 rejects negative amount",
  {
    annotation: {
      type: "description",
      description: `A bill payment with a negative amount returns 400, and the account balance is unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //PayBill from Checking Account
    const response = await payBill(apiHelper, {
      accountId: savingsId,
      amount: -100,
      payeeName: "Electric Savings Co",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Amount must be a positive number");
    expect(await getBalance(apiHelper, savingsId)).toBe(100);
  },
);

test(
  "BILL-04 rejects insufficient funds",
  {
    annotation: {
      type: "description",
      description: `A bill payment larger than the account balance returns 400, and the account balance is unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    //PayBill from Checking Account
    const response = await payBill(apiHelper, {
      accountId: checkingId,
      amount: 1000,
      payeeName: "Electric Checking Co",
    });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Insufficient funds");
    expect(await getBalance(apiHelper, checkingId)).toBe(900);
  },
);
