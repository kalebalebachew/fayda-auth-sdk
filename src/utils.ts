import crypto from "crypto";

export const generateCodeVerifier = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const generateCodeChallenge = (codeVerifier: string): string => {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
};
