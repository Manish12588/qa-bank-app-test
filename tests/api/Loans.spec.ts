import {
  getAccountById,
  getAccounts,
  getBalance,
} from "../../src/api/Accounts";
import { LoanResponse, requestLoan } from "../../src/api/Loans";
import { setupCustomerWithSavings } from "../../src/api/Transfer";
import { test, expect } from "../../src/fixtures/ApiFixtures";

let checkingId: number;
let savingsId: number;

test.beforeEach(async ({ apiHelper }) => {
  ({ checkingId, savingsId } = await setupCustomerWithSavings(apiHelper)); // checking 900, savings 100
});

test(
  "LOAN-01 approves loan from checking",
  {
    annotation: {
      type: "description",
      description: `Down payment 90, amount 900 (exactly 10 x). Returns approved: true, a LOAN account appears, and checking drops 900 → 810.`,
    },
  },
  async ({ apiHelper }) => {
    const response = await requestLoan(apiHelper, {
      amount: 900,
      downPayment: 90,
      fromAccountId: checkingId,
    });
    expect(response.status).toBe(200);
    const loan: LoanResponse = response.body;
    expect(loan).toMatchObject({
      approved: true,
      accountId: expect.any(Number),
      amount: 900,
      downPayment: 90,
    });

    //Get Loan Accounts Id
    const account = await getAccountById(apiHelper, loan.accountId);
    expect(account).toMatchObject({ type: "LOAN" });

    //getBalance
    const accountBalance = await getBalance(apiHelper, checkingId);
    expect(accountBalance).toBe(810);
  },
);

test(
  "LOAN-02 approves loan from savings",
  {
    annotation: {
      type: "description",
      description: `Down payment 50, amount 500 (exactly 10 x). Returns approved: true, a LOAN account appears, savings drops 100 → 50, and checking stays 900.`,
    },
  },
  async ({ apiHelper }) => {
    const response = await requestLoan(apiHelper, {
      amount: 500,
      downPayment: 50,
      fromAccountId: savingsId,
    });
    expect(response.status).toBe(200);
    const loan: LoanResponse = response.body;
    expect(loan).toMatchObject({
      approved: true,
      accountId: expect.any(Number),
      amount: 500,
      downPayment: 50,
    });

    //Get Loan Accounts Id
    const account = await getAccountById(apiHelper, loan.accountId);
    expect(account).toMatchObject({ type: "LOAN" });

    //getBalance = Savings
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(savingsBalance).toBe(50);

    //getBalance = Checking
    const checkingBalance = await getBalance(apiHelper, checkingId);
    expect(checkingBalance).toBe(900);
  },
);

test(
  "LOAN-03 denies loan above the limit",
  {
    annotation: {
      type: "description",
      description: `Down payment 100, amount 1000.01 (one cent over 10 x). Returns approved: false, no LOAN account, and the balance is unchanged.`,
    },
  },
  async ({ apiHelper }) => {
    const response = await requestLoan(apiHelper, {
      amount: 910,
      downPayment: 90,
      fromAccountId: checkingId,
    });
    expect(response.status).toBe(200);
    const loan: LoanResponse = response.body;
    expect(loan).toMatchObject({
      approved: false,
      message: "error.insufficient.funds",
      accountId: null,
    });

    //getBalance = Checking
    const checkingBalance = await getBalance(apiHelper, checkingId);
    expect(checkingBalance).toBe(900);
  },
);

test(
  "LOAN-04 denies down payment above source balance",
  {
    annotation: {
      type: "description",
      description: `From savings, down payment 100.01 against a 100 balance, amount 1000 (within the limit). 
      Returns approved: false, no LOAN account, and both balances are unchanged (savings 100, checking 900).
`,
    },
  },
  async ({ apiHelper }) => {
    const response = await requestLoan(apiHelper, {
      amount: 1000,
      downPayment: 110,
      fromAccountId: savingsId,
    });
    expect(response.status).toBe(200);
    const loan: LoanResponse = response.body;
    expect(loan).toMatchObject({
      approved: false,
      message: "error.insufficient.funds",
      accountId: null,
    });

    //getBalance = Checking
    const checkingBalance = await getBalance(apiHelper, checkingId);
    expect(checkingBalance).toBe(900);

    //getBalance = Savings
    const savingsBalance = await getBalance(apiHelper, savingsId);
    expect(savingsBalance).toBe(100);
  },
);
