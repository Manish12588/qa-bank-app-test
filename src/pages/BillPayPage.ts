import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";

export class BillPayPage extends BasePage {
  private readonly payeeName: Locator;
  private readonly amount: Locator;
  private readonly fromAccount: Locator;
  private readonly sendPayment: Locator;
  private readonly billPayConfirmation: Locator;
  private readonly billPayError: Locator;

  constructor(page: Page) {
    super(page);
    this.payeeName = page.getByRole("textbox", { name: "Payee Name" });
    this.amount = page.getByRole("textbox", { name: "Amount" });
    this.fromAccount = page.getByRole("combobox", { name: "From Account" });
    this.sendPayment = page.getByRole("button", { name: "Send Payment" });
    this.billPayConfirmation = page.locator("div#billPayConfirmation");
    this.billPayError = page.locator("div#billPayError");
  }

  async doBillPay(
    payeeName: string,
    amount: number,
    fromAccount: number,
  ): Promise<string> {
    await this.payeeName.fill(payeeName);
    await this.amount.fill(amount.toString());
    await this.fromAccount.selectOption(fromAccount.toString());
    await this.sendPayment.click();
    const outcome = this.billPayConfirmation
      .or(this.billPayError)
      .filter({ hasText: /\S/ });
    await outcome.waitFor({ state: "visible" });
    return (await outcome.innerText()).trim();
  }
}
