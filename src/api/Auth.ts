import { ApiHelper } from "./ApiHelper";
import { fa, faker, fakerDE } from "@faker-js/faker";
import { expect } from "@playwright/test";

export const DEFAULT_PASSWORD = "Test@12345";

//Payload Interface
export interface CustomerPayload {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  ssn: string;
}

//Response interface
export interface RegisterResponse {
  customerId: number;
  username: string;
  checkingAccountId: number;
}

export function generateCustomerPayload(): CustomerPayload {
  let fname = faker.person.firstName("generic");
  let lname = faker.person.lastName("generic");
  const suffix = `${Date.now().toString(36)}${faker.string.alphanumeric(4).toLowerCase()}`;
  let payload = {
    firstName: fname,
    lastName: lname,
    username: `${fname}.${lname}.${suffix}`,
    password: DEFAULT_PASSWORD,
    address: fakerDE.location.streetAddress(),
    city: fakerDE.location.city(),
    state: fakerDE.location.state(),
    zipCode: fakerDE.location.zipCode(),
    phone: fakerDE.phone.number(),
    ssn: "65 170884 J 053",
  };
  return payload;
}

export const MANDATORY_FIELDS = [
  "firstName",
  "lastName",
  "username",
  "password",
] as const;
export type MandatoryField = (typeof MANDATORY_FIELDS)[number];

export async function registerCustomerWithout(
  apiHelper: ApiHelper,
  field: MandatoryField,
) {
  const payload: Partial<CustomerPayload> = await generateCustomerPayload();
  delete payload[field]; // removes the key itself, so the field is absent from the JSON
  return apiHelper.post("/register", { type: "json", data: payload });
}

export async function registerCustomer(
  apiHelper: ApiHelper,
): Promise<RegisterResponse> {
  const payload = generateCustomerPayload();
  const res = await apiHelper.post(`/register`, {
    type: "json",
    data: payload,
  });
  expect(res.status).toBe(201);
  return res.body as RegisterResponse;
}

export async function registerWithExistingUsername(apiHelper: ApiHelper) {
  const existing = await registerCustomer(apiHelper);
  const payload: CustomerPayload = {
    ...generateCustomerPayload(),
    username: existing.username,
  };
  return apiHelper.post("/register", { type: "json", data: payload });
}

export async function loginCustomer(
  apiHelper: ApiHelper,
  username: string,
  password: string = DEFAULT_PASSWORD,
) {
  return apiHelper.post("/login", {
    type: "json",
    data: { username, password },
  });
}

export async function logoutCustomer(apiHelper: ApiHelper) {
  return apiHelper.post("/logout", { type: "json", data: {} });
}
