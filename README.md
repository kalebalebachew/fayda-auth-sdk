# Fayda Auth SDK

![npm](https://img.shields.io/npm/v/fayda-auth-sdk)
![license](https://img.shields.io/npm/l/fayda-auth-sdk)

Fayda Auth SDK simplifies integration with the Fayda eSignet platform using OpenID Connect (OIDC). Quickly set up secure authentication and access user data in your applications.

## Features
- OIDC support with Authorization Code Flow (PKCE).
- Retrieve and decode tokens (ID, Access).
- Fetch user profile securely.

## Installation
```bash
npm install fayda-auth-sdk
```
## Usage Guide
### 1. Initialize FaydaOIDC

Initialize the FaydaOIDC instance with your credentials and endpoint URLs:

```typescript
import { FaydaOIDC } from "fayda-auth-sdk";

const fayda = new FaydaOIDC({
  clientId: "your-client-id",
  redirectUri: "https://yourapp.com/callback",
  authorizationEndpoint: "https://esignet.authorization.endpoint",
  tokenEndpoint: "https://esignet.token.endpoint",
  userInfoEndpoint: "https://esignet.userinfo.endpoint",
});
```
### 2. Get Authorization URL
Generate the authorization URL to redirect users for login:

```typescript
const authUrl = fayda.getAuthorizationUrl("unique-state-value");
console.log(authUrl);
// Redirect the user to this URL
```
### 3. Exchange Authorization Code for Tokens
After the user logs in, exchange the authorization_code received in your callback for tokens:

```typescript
const tokens = await fayda.exchangeCodeForTokens("authorization-code");
console.log("ID Token:", tokens.id_token);
console.log("Access Token:", tokens.access_token);
```
### 4. Retrieve User Information
Use the access token to securely fetch user profile information:

``` typescript
const userInfo = await fayda.getUserInfo(tokens.access_token);
console.log("User Info:", userInfo);
```
### 5. Decode ID Token
Decode the ID Token to extract user claims such as name and email:

```typescript
const userClaims = fayda.decodeIdToken(tokens.id_token);
console.log("User Claims:", userClaims);5. Decode ID Token
Decode the ID Token to extract user claims such as name and email:
```






