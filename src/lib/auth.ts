import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(process.env.AUTH_SECRET || "fde01-dev-secret-change-in-prod");
const COOKIE = "fde01_session";

export async function createSession(username: string, role: string) {
  const token = await new SignJWT({ username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { username: string; role: string };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE;
