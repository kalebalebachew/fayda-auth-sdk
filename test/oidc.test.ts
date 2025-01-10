import axios from "axios";
import { FaydaOIDC } from "../src/oidc";
import { ClientAuthService } from "../src/services/ClientAuthService";
import { OTPService } from "../src/services/OTPService";
import { ResidentAuthService } from "../src/services/ResidentAuthService";
import { EKYCService } from "../src/services/EKYCService";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("FaydaOIDC", () => {
  it("should generate a valid authorization URL with PKCE parameters", () => {
    const oidc = new FaydaOIDC({
      clientId: "test-client-id",
      redirectUri: "http://localhost:4000/callback",
      authorizationEndpoint: "http://auth.endpoint/authorize",
      tokenEndpoint: "http://auth.endpoint/token",
      userInfoEndpoint: "http://auth.endpoint/userinfo",
    });

    const url = oidc.getAuthorizationUrl("test-state");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain(
      "redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fcallback"
    );
    expect(url).toContain("state=test-state");
    expect(url).toContain("code_challenge=");
    expect(url).toContain("code_challenge_method=S256");
  });

  it("should exchange an authorization code for tokens", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        access_token: "fake-access-token",
        id_token: "fake-id-token",
        token_type: "Bearer",
      },
    });

    const oidc = new FaydaOIDC({
      clientId: "test-client-id",
      redirectUri: "http://localhost:4000/callback",
      authorizationEndpoint: "http://auth.endpoint/authorize",
      tokenEndpoint: "http://auth.endpoint/token",
      userInfoEndpoint: "http://auth.endpoint/userinfo",
    });

    const result = await oidc.exchangeCodeForTokens("test-auth-code");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://auth.endpoint/token",
      expect.any(String), // Form data
      expect.objectContaining({
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    );
    expect(result).toEqual({
      access_token: "fake-access-token",
      id_token: "fake-id-token",
      token_type: "Bearer",
    });
  });
});

describe("ClientAuthService", () => {
  it("should authenticate and extract token from Set-Cookie header", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      headers: {
        "set-cookie": [
          "authorization=fake-auth-token; Path=/; HttpOnly",
          "some-other-cookie=value",
        ],
      },
      data: {},
    });

    const service = new ClientAuthService("http://base.url");
    const token = await service.authenticateClient(
      "clientId",
      "secretKey",
      "appId"
    );

    expect(mockedAxios.post).toHaveBeenCalled();
    expect(token).toBe("fake-auth-token");
  });

  it("should throw error if no Set-Cookie header is returned", async () => {
    mockedAxios.post.mockResolvedValueOnce({ headers: {}, data: {} });

    const service = new ClientAuthService("http://base.url");
    await expect(
      service.authenticateClient("clientId", "secretKey", "appId")
    ).rejects.toThrow("No 'Set-Cookie' header found");
  });
});

describe("OTPService", () => {
  it("should request OTP successfully", async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    const otpService = new OTPService(
      "http://base.url",
      "fake-auth-token",
      "fispLicenseKey",
      "partnerId",
      "partnerApiKey"
    );

    const body = {
      id: "fayda.identity.otp",
      version: "1.0",
      transactionID: "1234567890",
      requestTime: new Date().toISOString(),
      env: "Developer",
      domainUri: "http://test.com",
      idType: "VID",
      otpChannel: "EMAIL",
    };
    const signature = "fake-signature";
    const response = await otpService.requestOTP(body, signature);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://base.url/idauthentication/v1/otp/fispLicenseKey/partnerId/partnerApiKey",
      body,
      expect.objectContaining({
        headers: {
          Authorization: "fake-auth-token",
          Signature: "fake-signature",
          "Content-Type": "application/json",
        },
      })
    );
    expect(response).toEqual({ success: true });
  });
});

describe("ResidentAuthService", () => {
  it("should authenticate a resident", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { status: "authenticated" },
    });

    const authService = new ResidentAuthService(
      "http://base.url",
      "fake-auth-token",
      "fispLicenseKey",
      "authPartnerId",
      "partnerApiKey"
    );

    const requestBody = {
      id: "fayda.identity.auth",
      version: "1.0",
      transactionID: "543210",
      requestTime: new Date().toISOString(),
      env: "Developer",
      domainUri: "http://test.com",
      requestedAuth: { otp: true, demo: false, bio: false },
      individualId: "9830872690593682",
      individualIdType: "VID",
      consentObtained: true,
      thumbprint: "THUMBPRINT_EXAMPLE",
      requestSessionKey: "ENCRYPTED_SESSION_KEY",
      requestHMAC: "ENCRYPTED_HMAC",
      request: "ENCRYPTED_REQUEST_PAYLOAD",
    };
    const signature = "fake-signature";

    const response = await authService.authenticateResident(
      requestBody,
      signature
    );
    expect(mockedAxios.post).toHaveBeenCalled();
    expect(response).toEqual({ status: "authenticated" });
  });
});

describe("EKYCService", () => {
  it("should request e-KYC successfully", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { kycData: "some-kyc-info" },
    });

    const ekycService = new EKYCService(
      "http://base.url",
      "fake-auth-token",
      "fispLicenseKey",
      "ekycPartnerId",
      "partnerApiKey"
    );

    const requestBody = {
      id: "fayda.identity.kyc",
      version: "1.0",
      transactionID: "987654321",
      requestTime: new Date().toISOString(),
      env: "Developer",
      domainUri: "http://test.com",
      requestedAuth: { otp: true, demo: false, bio: false },
      individualId: "9830872690593682",
      individualIdType: "VID",
      consentObtained: true,
      thumbprint: "THUMBPRINT_EXAMPLE",
      requestSessionKey: "ENCRYPTED_SESSION_KEY",
      requestHMAC: "ENCRYPTED_HMAC",
      request: "ENCRYPTED_REQUEST_PAYLOAD",
    };
    const signature = "fake-signature";

    const response = await ekycService.requestEKYC(requestBody, signature);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://base.url/idauthentication/v1/kyc/fispLicenseKey/ekycPartnerId/partnerApiKey",
      requestBody,
      expect.objectContaining({
        headers: {
          Authorization: "fake-auth-token",
          Signature: "fake-signature",
          "Content-Type": "application/json",
        },
      })
    );
    expect(response).toEqual({ kycData: "some-kyc-info" });
  });
});
