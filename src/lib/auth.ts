import { SignJWT, jwtVerify } from "jose";

const SECRET_STR = process.env.AUTH_SECRET;
if (!SECRET_STR || SECRET_STR.length < 32) {
  throw new Error("AUTH_SECRET missing or too short (<32 chars). Refusing to start.");
}
const SECRET = new TextEncoder().encode(SECRET_STR);
const COOKIE = "fde01_session";

export async function createSession(username: string, role: string) {
  return await new SignJWT({ username, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
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
