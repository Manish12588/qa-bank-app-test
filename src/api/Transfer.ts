import { expect } from "@playwright/test";
import { ApiHelper } from "./ApiHelper";
import { registerCustomer } from "./Auth";
import { openAccount } from "./Accounts";

//Transfer Payload
export interface TransferPayload {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
}

export async function transferFund(
  apiHelper: ApiHelper,
  payload: TransferPayload,
) {
  return apiHelper.post("/transfer", { type: "json", data: payload });
}

export async function setupCustomerWithSavings(apiHelper: ApiHelper) {
  const customer = await registerCustomer(apiHelper);
  const savings = await openAccount(apiHelper, {
    type: "SAVINGS",
    fromAccountId: customer.checkingAccountId,
  });
  expect(savings.status, "setup: savings account").toBe(201);
  return {
    checkingId: customer.checkingAccountId,
    savingsId: savings.body.id as number, // starting balances: checking 900, savings 100
  };
}
