// src/services/ResidentAuthService.ts
import axios, { AxiosError } from "axios";

interface ResidentAuthRequestBody {
  id: string;              // "fayda.identity.auth"
  version: string;
  transactionID: string;
  requestTime: string;
  env: string;
  domainUri: string;
  requestedAuth: {
    otp: boolean;
    demo: boolean;
    bio: boolean;
  };
  individualId: string;
  individualIdType: string; // "VID" or "UIN"
  consentObtained: boolean;
  thumbprint: string;
  requestSessionKey: string; 
  requestHMAC: string;       // HMAC of the request block
  request: string;           // Encrypted request block (base64URL)
}

export class ResidentAuthService {
  private baseUrl: string;
  private authorizationToken: string;
  private fispLicenseKey: string;
  private authPartnerId: string;
  private partnerApiKey: string;

  constructor(
    baseUrl: string,
    authorizationToken: string,
    fispLicenseKey: string,
    authPartnerId: string,
    partnerApiKey: string
  ) {
    this.baseUrl = baseUrl;
    this.authorizationToken = authorizationToken;
    this.fispLicenseKey = fispLicenseKey;
    this.authPartnerId = authPartnerId;
    this.partnerApiKey = partnerApiKey;
  }

  /**
   * Authenticates a resident using the specified auth methods (OTP, demographic, or biometric).
   */
  public async authenticateResident(
    authBody: ResidentAuthRequestBody,
    jwsSignature: string
  ): Promise<unknown> {
    const url = `${this.baseUrl}/idauthentication/v1/auth/${this.fispLicenseKey}/${this.authPartnerId}/${this.partnerApiKey}`;

    try {
      const response = await axios.post(url, authBody, {
        headers: {
          Authorization: this.authorizationToken,
          Signature: jwsSignature,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, "Failed to authenticate resident");
    }
  }

  private handleAxiosError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const details = axiosError.response?.data || "No additional details";
      throw new Error(`${context}: ${axiosError.message} - ${JSON.stringify(details)}`);
    }
    if (error instanceof Error) {
      throw new Error(`${context}: ${error.message}`);
    }
    throw new Error(`${context}: ${String(error)}`);
  }
}
