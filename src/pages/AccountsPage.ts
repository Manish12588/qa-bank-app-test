import { BasePage } from "./BasePage";
import { Locator, Page } from "@playwright/test";

export class AccountsPage extends BasePage {
  private readonly accountsOverviewHeader: Locator;
  private readonly logout: Locator;

  constructor(page: Page) {
    super(page);
    this.accountsOverviewHeader = page.getByRole("heading", {
      name: "Accounts Overview",
    });
    this.logout = page.getByRole("link", { name: "Log Out" });
  }

  async getPageHeader(): Promise<string> {
    await this.accountsOverviewHeader.waitFor({ state: "visible" });
    return this.accountsOverviewHeader.innerText();
  }

  async doLogout(): Promise<void> {
    this.logout.click();
  }
}
