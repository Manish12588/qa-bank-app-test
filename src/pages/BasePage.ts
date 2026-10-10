import { Locator, Page } from "@playwright/test";

export class BasePage {
  //Why we are using protected here, only child class can have the access of these
  protected readonly page: Page;

  //Common locators accross all pages
  private readonly features: Locator;
  private readonly login: Locator;
  private readonly getStarted: Locator;

  constructor(page: Page) {
    this.page = page;
    this.features = page.getByRole("link", { name: "Features" });
    this.login = page.getByRole("link", { name: "Log In" });
    this.getStarted = page.getByRole("link", { name: "Get started" });
  }

  async navigateTo(pageURL: string): Promise<void> {
    await this.page.goto(pageURL);
  }

  //Page level generic methods
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }

  getCurrentPageUrl(): string {
    return this.page.url();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("load");
  }

  async takeScreenshot(name: string) {
    return await this.page.screenshot({
      fullPage: true,
      path: `reports/screenshots/${name}.png`,
    });
  }
}
