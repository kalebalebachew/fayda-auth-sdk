import axios, { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { generateCodeVerifier, generateCodeChallenge } from "./utils";

interface FaydaOIDCConfig {
  clientId: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
}

interface Tokens {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export class FaydaOIDC {
  private clientId: string;
  private redirectUri: string;
  private authorizationEndpoint: string;
  private tokenEndpoint: string;
  private userInfoEndpoint: string;
  private codeVerifier: string;

  constructor(config: FaydaOIDCConfig) {
    this.clientId = config.clientId;
    this.redirectUri = config.redirectUri;
    this.authorizationEndpoint = config.authorizationEndpoint;
    this.tokenEndpoint = config.tokenEndpoint;
    this.userInfoEndpoint = config.userInfoEndpoint;
    this.codeVerifier = generateCodeVerifier();
  }

  /**
   * Generates the authorization URL for initiating the OIDC flow.
   */
  public getAuthorizationUrl(state: string): string {
    const codeChallenge = generateCodeChallenge(this.codeVerifier);
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: "code",
      redirect_uri: this.redirectUri,
      scope: "openid profile email",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });
    return `${this.authorizationEndpoint}?${params.toString()}`;
  }

  /**
   * Exchanges an authorization code for tokens (access and ID tokens).
   */
  public async exchangeCodeForTokens(
    authorizationCode: string
  ): Promise<Tokens> {
    const data = new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      code_verifier: this.codeVerifier,
    });

    try {
      const response = await axios.post<Tokens>(
        this.tokenEndpoint,
        data.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, "Failed to exchange code for tokens");
    }
  }

  /**
   * Retrieves user information using the access token.
   */
  public async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, "Failed to fetch user information");
    }
  }

  /**
   * Decodes an ID token (JWT) to extract user information.
   */
  public decodeIdToken(idToken: string): any {
    try {
      return jwtDecode(idToken);
    } catch (error) {
      throw new Error(
        `Failed to decode ID token: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Handles Axios-specific errors and rethrows them as meaningful exceptions.
   */
  private handleAxiosError(error: unknown, contextMessage: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const details = axiosError.response?.data || "No additional details";
      throw new Error(`${contextMessage}: ${axiosError.message} - ${details}`);
    }

    if (error instanceof Error) {
      throw new Error(`${contextMessage}: ${error.message}`);
    }

    throw new Error(`${contextMessage}: ${String(error)}`);
  }
}
