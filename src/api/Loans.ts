import { ApiHelper } from "./ApiHelper";

export interface LoanPayload {
  amount: number;
  downPayment: number;
  fromAccountId: number;
}

export interface LoanResponse {
  approved: boolean;
  accountId: number;
  amount: number;
  downPayment: number;
  message: string;
}

export async function requestLoan(apiHelper: ApiHelper, payload: LoanPayload) {
  return apiHelper.post("/loan", { type: "json", data: payload });
}
