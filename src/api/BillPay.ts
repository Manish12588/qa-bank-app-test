import { ApiHelper } from "./ApiHelper";

export interface BillPayload {
  accountId: number;
  amount: number;
  payeeName: string;
}

export interface BillPayResponse {
  message: string;
  payeeName: string;
  amount: number;
  accountId: number;
  balance: number;
}

export async function payBill(apiHelper: ApiHelper, payload: BillPayload) {
  return apiHelper.post("/billpay", { type: "json", data: payload });
}
