import { test, expect } from "../../src/fixtures/ApiFixtures";
import {
  DEFAULT_PASSWORD,
  loginCustomer,
  logoutCustomer,
  MANDATORY_FIELDS,
  registerCustomer,
  registerCustomerWithout,
  registerWithExistingUsername,
} from "../../src/api/Auth";

test(
  "AUTH-01 creates customer with funded checking account",
  {
    annotation: {
      type: "description",
      description:
        "POST /api/register returns 201 with customerId, username, checkingAccountId; checking balance is 1000.00 (verified via GET /api/accounts)",
    },
  },
  async ({ apiHelper }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    expect(registeredCustomer.customerId).toBeGreaterThan(0);

    const accounts = await apiHelper.get("/accounts");
    expect(accounts.status).toBe(200);
    expect(accounts.body).toHaveLength(1);
    expect(accounts.body[0]).toMatchObject({
      id: registeredCustomer.checkingAccountId,
      customerId: registeredCustomer.customerId,
      type: "CHECKING",
      balance: 1000,
    });
  },
);

test(
  "AUTH-02: rejects missing required field",
  {
    annotation: {
      type: "description",
      description:
        "POST /api/register with a required field omitted returns 400, and the fields array names the missing field.",
    },
  },
  async ({ apiHelper }) => {
    for (const field of MANDATORY_FIELDS) {
      const res = await registerCustomerWithout(apiHelper, field);
      expect(res.status, `omitting ${field}`).toBe(400);
      expect(res.body.error, `omitting ${field}`).toBe(
        "Missing required fields",
      );
      expect(res.body.fields, `omitting ${field}`).toEqual([field]);
    }
  },
);

test(
  "AUTH-03: rejects duplicate username",
  {
    annotation: {
      type: "description",
      description:
        "POST /api/register Registering a second customer with an already-used username returns 409.",
    },
  },
  async ({ apiHelper }) => {
    const res = await registerWithExistingUsername(apiHelper);
    expect(res.status).toBe(409);
  },
);

test(
  "AUTH-04: logs in with valid credentials",
  {
    annotation: {
      type: "description",
      description:
        "POST /api/login with correct credentials returns 200 with the customer, and the session cookie is set (verified by a following authenticated call).",
    },
  },
  async ({ apiHelper, anonApiHelper }) => {
    const registeredCustomer = await registerCustomer(apiHelper);
    const response = await loginCustomer(
      anonApiHelper,
      registeredCustomer.username,
    );
    expect(response.status).toBe(200);
    expect(response.body.customerId).toBe(registeredCustomer.customerId);
    expect(response.body.username).toBe(registeredCustomer.username);

    // the session exists only if login set the cookie in this fresh context
    const me = await anonApiHelper.get("/me");
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({
      customerId: registeredCustomer.customerId,
      username: registeredCustomer.username,
    });
  },
);

test(
  "AUTH-05: rejects wrong password and unknown username",
  {
    annotation: {
      type: "description",
      description:
        "POST /api/login with a wrong password, and separately with an unknown username, returns 400 in both cases.",
    },
  },
  async ({ apiHelper, anonApiHelper }) => {
    const customer = await registerCustomer(apiHelper);

    // case 1: real username, wrong password
    const wrongPassword = await loginCustomer(
      anonApiHelper,
      customer.username,
      "Wrong@12345",
    );
    expect(wrongPassword.status).toBe(400);
    expect(wrongPassword.body.error).toBe("Invalid username and/or password");

    // case 2: username that was never registered
    const unknownUser = await loginCustomer(anonApiHelper, "no.such.user.xyz");
    expect(unknownUser.status).toBe(400);
    expect(unknownUser.body.error).toBe("Invalid username and/or password");

    // neither failed attempt may have created a session
    const me = await anonApiHelper.get("/me");
    expect(me.status).toBe(401);
  },
);

test(
  "AUTH-06: /api/me returns 401 without session, customer with session",
  {
    annotation: {
      type: "description",
      description:
        "GET /api/me with no session returns 401. With a registered session it returns 200 and the correct customer.",
    },
  },
  async ({ apiHelper, anonApiHelper }) => {
    const noSession = await anonApiHelper.get("/me");
    expect(noSession.status).toBe(401);
    expect(noSession.body.error).toBe("Not logged in");

    //with session. register logs the new customer in, so apiHelper holds the cookie.
    const customer = await registerCustomer(apiHelper);
    const me = await apiHelper.get("/me");
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({
      customerId: customer.customerId,
      username: customer.username,
    });
  },
);

test(
  "AUTH-07: blocks account access after logout",
  {
    annotation: {
      type: "description",
      description:
        "After logout, GET /api/accounts returns 401. access must be blocked once the session has ended",
    },
  },
  async ({ apiHelper }) => {
    await registerCustomer(apiHelper);
    const before = await apiHelper.get("/accounts");
    expect(before.status).toBe(200);

    const logout = await logoutCustomer(apiHelper);
    expect(logout.status).toBe(200);

    const after = await apiHelper.get("/accounts");
    expect(after.status).toBe(401);
  },
);
