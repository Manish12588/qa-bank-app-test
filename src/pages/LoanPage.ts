import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";

export interface LoanResponse {
  message: string;
  accountId: number | null;
}

export class LoanPage extends BasePage {
  private readonly loanAmount: Locator;
  private readonly downPayment: Locator;
  private readonly fromAccount: Locator;
  private readonly applyNow: Locator;
  private readonly loanMessage: Locator;
  private readonly loanAccountId: Locator;

  constructor(page: Page) {
    super(page);
    this.loanAmount = page.getByRole("textbox", { name: "Loan Amount" });
    this.downPayment = page.getByRole("textbox", { name: "Down Payment" });
    this.fromAccount = page.getByRole("combobox", { name: "From Account" });
    this.applyNow = page.getByRole("button", { name: "Apply Now" });
    this.loanMessage = page.locator("p#loanStatus");
    this.loanAccountId = page.locator("span#loanAccountId");
  }

  async doRequestLoan(
    loanAmount: number,
    downPayment: number,
    fromAccount: number,
  ): Promise<LoanResponse> {
    await this.loanAmount.fill(loanAmount.toString());
    await this.downPayment.fill(downPayment.toString());
    await this.fromAccount.selectOption(fromAccount.toString());
    await this.applyNow.click();

    await expect(this.loanMessage).toHaveText(/\S/);
    const message = (await this.loanMessage.innerText()).trim();
    const idLocator = this.loanAccountId.filter({ hasText: /\d/ });
    const accountId =
      (await idLocator.count()) > 0
        ? Number(await idLocator.innerText())
        : null;
    return { message, accountId };
  }
}
