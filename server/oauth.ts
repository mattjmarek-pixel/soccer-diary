import { OAuth2Client } from "google-auth-library";
import { createRemoteJWKSet, jwtVerify } from "jose";

export type OAuthProvider = "apple" | "google";

export interface VerifiedOAuthIdentity {
  provider: OAuthProvider;
  providerId: string;
  email?: string;
}

const appleJwks = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);
const googleClient = new OAuth2Client();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const email = value.trim().toLowerCase();
  return emailPattern.test(email) ? email : undefined;
}

export async function verifyOAuthIdentity(
  provider: OAuthProvider,
  idToken: string,
): Promise<VerifiedOAuthIdentity> {
  if (provider === "apple") {
    const { payload } = await jwtVerify(idToken, appleJwks, {
      issuer: "https://appleid.apple.com",
      audience: ["com.soccerdiary.app", "host.exp.Exponent"],
    });

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new Error("Apple identity token is missing its subject");
    }

    return {
      provider,
      providerId: payload.sub,
      email: normalizeEmail(payload.email),
    };
  }

  const clientIds = (process.env.GOOGLE_CLIENT_IDS || "")
    .split(",")
    .map((clientId: string) => clientId.trim())
    .filter(Boolean);

  if (clientIds.length === 0) {
    throw new Error("GOOGLE_CLIENT_IDS is not configured");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientIds,
  });
  const payload = ticket.getPayload();

  if (
    !payload ||
    typeof payload.sub !== "string" ||
    payload.sub.length === 0 ||
    payload.email_verified !== true
  ) {
    throw new Error(
      "Google identity token is missing verified identity claims",
    );
  }

  return {
    provider,
    providerId: payload.sub,
    email: normalizeEmail(payload.email),
  };
}
