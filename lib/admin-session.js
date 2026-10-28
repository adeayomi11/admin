import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "gsfc_admin";
const sessionDuration = 8 * 60 * 60;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function safeEqual(left, right) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

function sessionSignature(expiresAt) {
  return createHmac("sha256", getSessionSecret()).update(expiresAt).digest("base64url");
}

export function isAdminAuthenticated(request) {
  const cookies = request.headers.cookie || "";
  const cookie = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  if (!cookie) return false;

  const [expiresAt, signature] = cookie.slice(cookieName.length + 1).split(".");
  if (!expiresAt || !signature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  const expected = sessionSignature(expiresAt);
  return safeEqual(signature, expected);
}

export function setAdminSession(response) {
  const expiresAt = String(Math.floor(Date.now() / 1000) + sessionDuration);
  const token = `${expiresAt}.${sessionSignature(expiresAt)}`;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDuration}${secure}`,
  );
}

export function clearAdminSession(response) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${cookieName}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`,
  );
}

export function checkAdminCredentials(username, password) {
  const configuredUsername = process.env.ADMIN_USERNAME;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredUsername || !configuredPassword) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be configured.");
  }
  return (
    typeof username === "string" &&
    typeof password === "string" &&
    safeEqual(username, configuredUsername) &&
    safeEqual(password, configuredPassword)
  );
}
