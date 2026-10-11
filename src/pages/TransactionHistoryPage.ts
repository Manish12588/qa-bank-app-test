import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";
import { LoanPage } from "./LoanPage";

export interface TransactionRow {
  description: string;
  type: string;
  amount: number;
}

export class TransactionHistoryPage extends BasePage {
  private readonly account: Locator;
  private readonly byAmount: Locator;
  private readonly byType: Locator;
  private readonly findTransactions: Locator;
  private readonly transactionRows: Locator;

  constructor(page: Page) {
    super(page);
    this.account = page.getByRole("combobox", { name: "Account" });
    this.byAmount = page.getByRole("textbox", { name: "By Amount (optional)" });
    this.byType = page.getByRole("combobox", { name: "By Type (optional)" });
    this.findTransactions = page.getByRole("button", {
      name: "Find Transactions",
    });
    this.transactionRows = page.locator("#transactionRows tr");
  }

  async doFindTransactions(filter: {
    account: number;
    amount?: number;
    type?: "Debit" | "Credit";
  }): Promise<void> {
    await this.account.selectOption(filter.account.toString());
    if (filter.amount !== undefined)
      await this.byAmount.fill(filter.amount.toString());
    if (filter.type) await this.byType.selectOption(filter.type);

    await Promise.all([
      this.page.waitForResponse((r) => r.url().includes("/transactions")),
      this.findTransactions.click(),
    ]);
  }

  async getDisplayedTransactions(): Promise<TransactionRow[]> {
    const rows = this.transactionRows;
    const count = await rows.count();
    const result: TransactionRow[] = [];
    for (let i = 0; i < count; i++) {
      const [, description, type, amount] = await rows
        .nth(i)
        .locator("td")
        .allInnerTexts();
      result.push({
        description: description.trim(),
        type: type.trim(),
        amount: Number(amount.replace(/[^0-9.-]/g, "")),
      });
    }
    return result;
  }

  async waitForRows(count: number): Promise<void> {
    await expect(this.transactionRows).toHaveCount(count);
  }

  async waitForRowsOfType(type: string, count: number): Promise<void> {
    const rows = this.transactionRows.filter({
      has: this.page.getByRole("cell", { name: type, exact: true }),
    });
    await expect(rows).toHaveCount(count);
  }
}
