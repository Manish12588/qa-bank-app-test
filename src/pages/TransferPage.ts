import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";

export class TransferPage extends BasePage {
  private readonly transferFundsLink: Locator;
  private readonly transferFundswHeader: Locator;
  private readonly amountField: Locator;
  private readonly fromAccount: Locator;
  private readonly toAccount: Locator;
  private readonly transferButton: Locator;
  private readonly transferSuccessMessage: Locator;
  private readonly transferErrorMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.transferFundsLink = page.getByRole("link", { name: "Transfer Funds" });
    this.transferFundswHeader = page.getByRole("heading", {
      name: "Transfer Funds",
    });
    this.amountField = page.getByRole("textbox", { name: "Amount" });
    this.fromAccount = page.getByRole("combobox", { name: "From Account" });
    this.toAccount = page.getByRole("combobox", { name: "To Account" });
    this.transferButton = page.getByRole("button", { name: "Transfer" });
    this.transferSuccessMessage = page.locator("div#transferSuccessMessage");
    this.transferErrorMessage = page.locator("div#transferError");
  }

  async doTransferFund(
    amount: number,
    fromAccount: number,
    toAccount: number,
  ): Promise<string> {
    await this.transferFundsLink.first().click();
    await this.transferFundswHeader.waitFor({ state: "visible" });
    await this.amountField.fill(amount.toString());
    await this.fromAccount.selectOption(fromAccount.toString());
    await this.toAccount.selectOption(toAccount.toString());
    await this.transferButton.click();
    const outcome = this.transferSuccessMessage
      .or(this.transferErrorMessage)
      .filter({ hasText: /\S/ });
    await outcome.waitFor({ state: "visible" });
    return (await outcome.innerText()).trim();
  }
}
