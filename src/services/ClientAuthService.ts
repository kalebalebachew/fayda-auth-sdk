import axios, { AxiosResponse, AxiosError } from "axios";

interface ClientAuthRequestBody {
  id: string;
  version: string;
  requesttime: string;
  metadata: Record<string, unknown> | null;
  request: {
    clientId: string;
    secretKey: string;
    appId: string;
  };
}

interface ClientAuthResponse {
  id: string;
  version: string;
  responsetime: string;
  metadata: unknown;
  response: unknown;
  errors?: Array<{ errorCode: string; message: string }>;
}

export class ClientAuthService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Authenticates a client using (clientId, secretKey, appId).
   * On success, returns an authorization token extracted from the 'Set-Cookie' header.
   */
  public async authenticateClient(
    clientId: string,
    secretKey: string,
    appId: string
  ): Promise<string> {
    const url = `${this.baseUrl}/v1/authmanager/authenticate/clientidsecretkey`;

    const requestBody: ClientAuthRequestBody = {
      id: "fayda.client.authenticate",
      version: "1.0",
      requesttime: new Date().toISOString(),
      metadata: null,
      request: {
        clientId,
        secretKey,
        appId,
      },
    };

    try {
      const response: AxiosResponse<ClientAuthResponse> = await axios.post(
        url,
        requestBody,
        {
          withCredentials: true,
        }
      );

      const setCookieHeader = response.headers["set-cookie"];
      if (!setCookieHeader) {
        throw new Error(
          "No 'Set-Cookie' header found. Unable to retrieve auth token."
        );
      }

      const authCookie = setCookieHeader.find((cookie) =>
        cookie.toLowerCase().includes("authorization=")
      );
      if (!authCookie) {
        throw new Error("Authorization cookie not found in Set-Cookie header.");
      }

      const tokenValue = authCookie.split(";")[0].split("=")[1];
      return tokenValue;
    } catch (error) {
      this.handleAxiosError(error, "Failed to authenticate client");
    }
  }

  private handleAxiosError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const details = axiosError.response?.data || "No additional details";
      throw new Error(
        `${context}: ${axiosError.message} - ${JSON.stringify(details)}`
      );
    }
    if (error instanceof Error) {
      throw new Error(`${context}: ${error.message}`);
    }
    throw new Error(`${context}: ${String(error)}`);
  }
}
