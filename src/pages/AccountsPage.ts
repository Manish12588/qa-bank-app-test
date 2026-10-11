import { BasePage } from "./BasePage";
import { expect, Locator, Page } from "@playwright/test";

export interface AccountRow {
  accountNumber: number;
  accountType: string;
  balance: number;
}

export class AccountsPage extends BasePage {
  private readonly accountsOverviewHeader: Locator;
  private readonly accountsOverview: Locator;
  private readonly logout: Locator;
  private readonly accountRows: Locator;
  private readonly openNewAccount: Locator;
  private readonly openNewAccountButton: Locator;
  private readonly newAccountId: Locator;

  constructor(page: Page) {
    super(page);
    this.accountsOverviewHeader = page.getByRole("heading", {
      name: "Accounts Overview",
    });
    this.logout = page.getByRole("link", { name: "Log Out" });
    this.accountRows = page.locator("#accountTable tbody tr");
    this.openNewAccount = page.locator("//a[text()='Open New Account']");
    this.openNewAccountButton = page.getByRole("button", {
      name: "Open New Account",
    });
    this.newAccountId = page.locator("a#newAccountId");
    this.accountsOverview = page.getByRole("link", {
      name: "Accounts Overview",
    });
  }

  async getPageHeader(): Promise<string> {
    await this.accountsOverviewHeader.waitFor({ state: "visible" });
    return this.accountsOverviewHeader.innerText();
  }

  async doLogout(): Promise<void> {
    this.logout.click();
  }

  async getDisplayedAccounts(): Promise<AccountRow[]> {
    await this.accountRows.first().waitFor({ state: "visible" });
    const accounts: AccountRow[] = [];
    const rowCount = await this.accountRows.count();
    for (let i = 0; i < rowCount; i++) {
      const row = this.accountRows.nth(i);
      const idText = await row.locator("td").nth(0).innerText();
      const typeText = await row.locator("td").nth(1).innerText();
      const balanceText = await row.locator("td").nth(2).innerText();

      accounts.push({
        accountNumber: Number(idText.trim()),
        accountType: typeText.trim(),
        balance: Number(balanceText.replace(/[^0-9.-]/g, "")), // "$1,000.00" becomes 1000
      });
    }
    return accounts;
  }

  async openNewAccounts(): Promise<number> {
    await this.accountRows.first().waitFor();
    const before = await this.accountRows.count();
    await this.openNewAccount.click();
    await this.openNewAccountButton.click();
    await this.newAccountId.waitFor({ state: "visible" });
    let newSavingAccountId = await this.newAccountId.innerText();
    await this.accountsOverview.click();
    await expect(this.accountRows).toHaveCount(before + 1);
    return parseInt(newSavingAccountId);
  }
}
