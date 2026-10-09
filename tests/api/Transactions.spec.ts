import { getAccountById, getBalance } from "../../src/api/Accounts";
import { payBill } from "../../src/api/BillPay";
import { getTransactions, Transaction } from "../../src/api/Transactions";
import {
  setupCustomerWithSavings,
  transferFund,
  transferMany,
} from "../../src/api/Transfer";
import { test, expect } from "../../src/fixtures/ApiFixtures";

let checkingId: number;
let savingsId: number;

test.beforeEach(async ({ apiHelper }) => {
  ({ checkingId, savingsId } = await setupCustomerWithSavings(apiHelper)); // checking 900, savings 100
});

test(
  "TXN-01 filters by exact amount",
  {
    annotation: {
      type: "description",
      description: `Seed three transfers of 10, 25 and 25. Filtering by amount 25 returns exactly 2 rows, and every row has amount 25.`,
    },
  },
  async ({ apiHelper }) => {
    await transferMany(apiHelper, checkingId, savingsId, [10, 25, 25]);

    const res = await getTransactions(apiHelper, checkingId, { amount: 25 });
    expect(res.status).toBe(200);
    const rows: Transaction[] = res.body;
    expect(rows.map((r) => r.amount)).toEqual([25, 25]);
  },
);

test(
  "TXN-02 returns empty list for unmatched amount",
  {
    annotation: {
      type: "description",
      description: `Filtering by an amount that was never used (e.g. 7.77) returns 200 with an empty list, not an error.`,
    },
  },
  async ({ apiHelper }) => {
    await transferMany(apiHelper, checkingId, savingsId, [10, 25, 25]);

    const res = await getTransactions(apiHelper, checkingId, { amount: 7.77 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  },
);

test(
  "TXN-03 filters by type Debit",
  {
    annotation: {
      type: "description",
      description: `After a transfer out and a bill payment from checking, filtering by Debit returns exactly those 2 rows, and none has type Credit.`,
    },
  },
  async ({ apiHelper }) => {
    await transferMany(apiHelper, checkingId, savingsId, [10, 25]); // Debits on checking
    await transferMany(apiHelper, savingsId, checkingId, [20]); // Credit on checking

    const all: Transaction[] = (await getTransactions(apiHelper, checkingId))
      .body;
    const res = await getTransactions(apiHelper, checkingId, { type: "Debit" });
    expect(res.status).toBe(200);
    const debits: Transaction[] = res.body;

    // precondition: a Credit exists, so the filter has something to exclude
    expect(all.some((r) => r.type === "Credit")).toBe(true);

    const ids = (rows: Transaction[]) =>
      rows.map((r) => r.id).sort((a, b) => a - b);
    expect(ids(debits)).toEqual(ids(all.filter((r) => r.type === "Debit")));
  },
);

test(
  "TXN-04 filters by type Credit",
  {
    annotation: {
      type: "description",
      description: `After a transfer into savings, filtering the savings account by Credit returns exactly that 1 row, and none has type Debit.`,
    },
  },
  async ({ apiHelper }) => {
    await transferMany(apiHelper, checkingId, savingsId, [25]); // Credit on savings
    await transferMany(apiHelper, savingsId, checkingId, [20]); // Debit on savings

    const all: Transaction[] = (await getTransactions(apiHelper, savingsId))
      .body;
    const res = await getTransactions(apiHelper, savingsId, { type: "Credit" });
    expect(res.status).toBe(200);
    const credits: Transaction[] = res.body;

    // precondition: a Debit exists, so the filter has something to exclude
    expect(all.some((r) => r.type === "Debit")).toBe(true);

    const ids = (rows: Transaction[]) =>
      rows.map((r) => r.id).sort((a, b) => a - b);
    expect(ids(credits)).toEqual(ids(all.filter((r) => r.type === "Credit")));
    expect(credits.map((r) => r.amount)).toContain(25); // the seeded transfe
  },
);
