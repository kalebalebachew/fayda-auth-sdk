import { FaydaOIDC } from "../src/oidc";

describe("FaydaOIDC", () => {
  it("should generate a valid authorization URL", () => {
    const oidc = new FaydaOIDC({
      clientId: "test-client-id",
      redirectUri: "http://localhost:4000/callback",
      authorizationEndpoint: "http://auth.endpoint/authorize",
      tokenEndpoint: "http://auth.endpoint/token",
      userInfoEndpoint: "http://auth.endpoint/userinfo",
    });

    const url = oidc.getAuthorizationUrl("test-state");
    expect(url).toContain("client_id=test-client-id");
    expect(url).toContain("state=test-state");
  });
});
