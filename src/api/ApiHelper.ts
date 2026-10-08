import { APIRequestContext } from "@playwright/test";

//Added a type for Payload
type PostPayload =
  | { type: "json"; data: object }
  | { type: "form"; form: Record<string, string> };

export class ApiHelper {
  private readonly request: APIRequestContext;
  private readonly baseURL: string;

  constructor(request: APIRequestContext, baseURL: string) {
    console.log("baseURL received:", baseURL);
    this.request = request;
    this.baseURL = baseURL;
  }

  private async parseJsonResponse(
    response: any,
    method: string,
    endPoint: string,
  ) {
    const status = response.status();
    const rawText = await response.text();

    let body: any = null;
    if (rawText) {
      try {
        body = JSON.parse(rawText);
      } catch {
        throw new Error(
          `${method} ${endPoint} returned non-JSON response (status ${status}):\n${rawText.slice(0, 500)}`,
        );
      }
    }
    return { status, body };
  }

  private buildUrl(endPoint: string): string {
    const url = /^https?:\/\//i.test(endPoint)
      ? endPoint
      : `${this.baseURL}${endPoint}`;

    console.log(`Resolved URL: ${url}`);
    return url;
  }

  //Helper Methods:
  //GET with Headers
  async get(endPoint: string, headers?: Record<string, string>) {
    let response = await this.request.get(this.buildUrl(endPoint), {
      headers: headers,
    });
    return this.parseJsonResponse(response, "GET", endPoint);
  }

  //POST:
  async post(
    endPoint: string,
    payload: PostPayload,
    headers?: Record<string, string>,
  ) {
    let response = await this.request.post(this.buildUrl(endPoint), {
      headers: headers,
      //...(condition ? objA : objB)
      ...(payload.type === "form"
        ? { form: payload.form }
        : { data: payload.data }),
    });
    return this.parseJsonResponse(response, "POST", endPoint);
  }

  //PUT
  async put(
    endPoint: string,
    payload: PostPayload,
    headers?: Record<string, string>,
  ) {
    let response = await this.request.put(this.buildUrl(endPoint), {
      headers: headers,
      ...(payload.type === "form"
        ? { form: payload.form }
        : { data: payload.data }),
    });
    return this.parseJsonResponse(response, "PUT", endPoint);
  }

  //PATCH
  async patch(
    endPoint: string,
    payload: PostPayload,
    headers?: Record<string, string>,
  ) {
    let response = await this.request.patch(this.buildUrl(endPoint), {
      headers: headers,
      ...(payload.type === "form"
        ? { form: payload.form }
        : { data: payload.data }),
    });
    return this.parseJsonResponse(response, "PATCH", endPoint);
  }

  //DELETE
  async delete(endPoint: string, headers?: Record<string, string>) {
    console.log(this.buildUrl(endPoint));
    let response = await this.request.delete(this.buildUrl(endPoint), {
      headers: headers,
    });

    return {
      status: response.status(),
    };
  }
}
