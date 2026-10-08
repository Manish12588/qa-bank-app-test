import { expect } from "@playwright/test";
import { ApiHelper } from "./ApiHelper";

// Shape of one account, taken from the real GET /api/accounts response
export interface Account {
  id: number;
  customerId: number;
  type: string; // "CHECKING" so far; "SAVINGS" and "LOAN" will appear in later tests
  balance: number;
}

export async function getAccounts(apiHelper: ApiHelper) {
  return apiHelper.get("/accounts");
}

//Response interface
export interface OpenAccountPayload {
  type: string;
  fromAccountId: number;
}

export async function openAccount(
  apiHelper: ApiHelper,
  payload: OpenAccountPayload,
) {
  return apiHelper.post("/accounts", { type: "json", data: payload });
}

export async function openSavingsAccounts(
  apiHelper: ApiHelper,
  fromAccountId: number,
  count: number,
) {
  for (let i = 1; i <= count; i++) {
    const res = await openAccount(apiHelper, {
      type: "SAVINGS",
      fromAccountId,
    });
    expect(res.status, `setup: savings account #${i}`).toBe(201);
  }
}

export async function getBalance(
  apiHelper: ApiHelper,
  accountId: number,
): Promise<number> {
  const res = await getAccounts(apiHelper);
  expect(res.status).toBe(200);
  const account = res.body.find((a: Account) => a.id === accountId);
  expect(account, `account ${accountId} not found`).toBeDefined();
  return account.balance;
}
