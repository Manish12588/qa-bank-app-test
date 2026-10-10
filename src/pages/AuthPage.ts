import { Locator, Page } from "@playwright/test";
import { fa, faker, fakerDE } from "@faker-js/faker";
import {
  DEFAULT_PASSWORD,
  generateCustomerPayload,
  CustomerPayload,
} from "../api/Auth";
import { BasePage } from "./BasePage";

export interface RegisterData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
  username: string;
  password: string;
}

export interface RegisterResult {
  username: string;
  message: string;
}

export class AuthPage extends BasePage {
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly address: Locator;
  private readonly city: Locator;
  private readonly state: Locator;
  private readonly zipCode: Locator;
  private readonly phone: Locator;
  private readonly ssn: Locator;
  private readonly userName: Locator;
  private readonly password: Locator;
  private readonly registerButton: Locator;
  private readonly registerSuccessMessage: Locator;
  private readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByRole("textbox", { name: "First Name" });
    this.lastName = page.getByRole("textbox", { name: "Last Name" });
    this.address = page.getByRole("textbox", { name: "Address" });
    this.city = page.getByRole("textbox", { name: "City" });
    this.state = page.getByRole("textbox", { name: "State" });
    this.zipCode = page.getByRole("textbox", { name: "Zip Code" });
    this.phone = page.getByRole("textbox", { name: "Phone" });
    this.ssn = page.getByRole("textbox", { name: "SSN" });
    this.userName = page.getByRole("textbox", { name: "Username" });
    this.password = page.getByRole("textbox", { name: "Password" });
    this.registerButton = page.getByRole("button", { name: "Register" });
    this.registerSuccessMessage = page.locator("div#registerMessage");
    this.loginLink = page.getByRole("link", { name: "Log In" });
  }

  private async fillForm(
    overrides: Partial<RegisterData>,
  ): Promise<RegisterData> {
    const data = { ...this.buildData(), ...overrides };
    await this.firstName.fill(data.firstName);
    await this.lastName.fill(data.lastName);
    await this.address.fill(data.address);
    await this.city.fill(data.city);
    await this.state.fill(data.state);
    await this.zipCode.fill(data.zipCode);
    await this.phone.fill(data.phone);
    await this.ssn.fill(data.ssn);
    await this.userName.fill(data.username);
    await this.password.fill(data.password);
    return data;
  }

  async doRegister(
    overrides: Partial<RegisterData> = {},
  ): Promise<RegisterResult> {
    const data = await this.fillForm(overrides);
    await this.registerButton.click();
    await this.registerSuccessMessage.waitFor({ state: "visible" });
    return {
      username: data.username,
      message: (await this.registerSuccessMessage.innerText()).trim(),
    };
  }

  async submitInvalid(overrides: Partial<RegisterData>) {
    const data = await this.fillForm(overrides);
    await this.registerButton.click();
    const invalid = await this.page
      .locator("input:invalid")
      .first()
      .evaluate((el) => ({
        field: el.id,
        message: (el as HTMLInputElement).validationMessage,
      }));
    return { username: data.username, ...invalid };
  }

  private buildData(): RegisterData {
    const firstName = faker.person.firstName("generic");
    const lastName = faker.person.lastName("generic");
    const suffix = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
    return {
      firstName,
      lastName,
      address: fakerDE.location.streetAddress(),
      city: fakerDE.location.city(),
      state: fakerDE.location.state(),
      zipCode: fakerDE.location.zipCode(),
      phone: fakerDE.phone.number(),
      ssn: "65 170884 J 053",
      username: `${firstName}.${lastName}.${suffix}`,
      password: DEFAULT_PASSWORD,
    };
  }
}
