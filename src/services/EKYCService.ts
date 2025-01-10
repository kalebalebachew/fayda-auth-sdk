import axios, { AxiosError } from "axios";

interface EKYCRequestBody {
  id: string; 
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
  individualIdType: string; 
  consentObtained: boolean;
  thumbprint: string;
  requestSessionKey: string;
  requestHMAC: string;
  request: string; 
  secondaryLangCode?: string;
}

export class EKYCService {
  private baseUrl: string;
  private authorizationToken: string;
  private fispLicenseKey: string;
  private ekycPartnerId: string;
  private partnerApiKey: string;

  constructor(
    baseUrl: string,
    authorizationToken: string,
    fispLicenseKey: string,
    ekycPartnerId: string,
    partnerApiKey: string
  ) {
    this.baseUrl = baseUrl;
    this.authorizationToken = authorizationToken;
    this.fispLicenseKey = fispLicenseKey;
    this.ekycPartnerId = ekycPartnerId;
    this.partnerApiKey = partnerApiKey;
  }

  /**
   * Requests e-KYC details for an individual, given successful authentication and consent.
   */
  public async requestEKYC(
    ekycBody: EKYCRequestBody,
    jwsSignature: string
  ): Promise<unknown> {
    const url = `${this.baseUrl}/idauthentication/v1/kyc/${this.fispLicenseKey}/${this.ekycPartnerId}/${this.partnerApiKey}`;

    try {
      const response = await axios.post(url, ekycBody, {
        headers: {
          Authorization: this.authorizationToken,
          Signature: jwsSignature,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, "Failed to request e-KYC");
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
