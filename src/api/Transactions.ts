import { ApiHelper } from "./ApiHelper";

export interface Transaction {
  id: number;
  accountId: number;
  type: "Debit" | "Credit";
  amount: number;
  description: string;
  date: number;
}

export interface TransactionFilter {
  amount?: number;
  type?: "Debit" | "Credit";
}

export async function getTransactions(
  apiHelper: ApiHelper,
  accountId: number,
  filter: TransactionFilter = {},
) {
  const params = new URLSearchParams();
  if (filter.amount !== undefined) params.set("amount", String(filter.amount));
  if (filter.type !== undefined) params.set("type", filter.type);

  const query = params.toString();
  const path = `/accounts/${accountId}/transactions${query ? `?${query}` : ""}`;
  return apiHelper.get(path);
}
