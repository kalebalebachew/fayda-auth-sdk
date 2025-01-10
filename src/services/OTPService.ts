import axios, { AxiosError } from "axios";

interface OTPRequestBody {
  id: string; 
  version: string;
  transactionID: string;
  requestTime: string;
  env: string; 
  domainUri: string; 
  idType: string; // "VID" or "UIN"
  otpChannel: string; // "EMAIL" or "PHONE"
}

export class OTPService {
  private baseUrl: string;
  private authorizationToken: string;
  private fispLicenseKey: string;
  private partnerId: string;
  private partnerApiKey: string;

  constructor(
    baseUrl: string,
    authorizationToken: string,
    fispLicenseKey: string,
    partnerId: string,
    partnerApiKey: string
  ) {
    this.baseUrl = baseUrl;
    this.authorizationToken = authorizationToken;
    this.fispLicenseKey = fispLicenseKey;
    this.partnerId = partnerId;
    this.partnerApiKey = partnerApiKey;
  }

  /**
   * Requests an OTP for the specified user (by UIN/VID).
   * JWS signature of the request body is required by the specification.
   */
  public async requestOTP(
    otpRequestBody: OTPRequestBody,
    jwsSignature: string
  ): Promise<unknown> {
    const url = `${this.baseUrl}/idauthentication/v1/otp/${this.fispLicenseKey}/${this.partnerId}/${this.partnerApiKey}`;

    try {
      const response = await axios.post(url, otpRequestBody, {
        headers: {
          Authorization: this.authorizationToken,
          Signature: jwsSignature,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, "Failed to request OTP");
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
