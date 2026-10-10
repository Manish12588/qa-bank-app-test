import { BasePage } from "./BasePage";
import { Locator, Page } from "@playwright/test";

export class LoginPage extends BasePage {
  private readonly userNameField: Locator;
  private readonly passwordField: Locator;
  private readonly loginButton: Locator;
  private readonly loginMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.userNameField = page.getByRole("textbox", { name: "Username" });
    this.passwordField = page.getByRole("textbox", { name: "Password" });
    this.loginButton = page.getByRole("button", { name: "Log In" });
    this.loginMessage = page.locator("div#loginMessage");
  }

  async goToLoginPage(): Promise<void> {
    await this.page.goto("/login.html");
  }

  async doLogin(username: string, password: string): Promise<void> {
    await this.userNameField.fill(username);
    await this.passwordField.fill(password);
    await this.loginButton.click();
  }

  async getLoginMessage(): Promise<string> {
    await this.loginMessage.waitFor({ state: "visible" });
    return (await this.loginMessage.innerText()).trim();
  }
}
