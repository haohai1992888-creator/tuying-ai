import crypto from "crypto";
import bcrypt from "bcryptjs";
import { UserRole } from "@acs/shared";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function parseExpiresInSeconds(value: string): number {
  const match = value.trim().match(/^(\d+)([smhd])?$/i);
  if (!match) return 900;
  const amount = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();
  if (unit === "m") return amount * 60;
  if (unit === "h") return amount * 60 * 60;
  if (unit === "d") return amount * 24 * 60 * 60;
  return amount;
}

export function getJwtSecret(): string {
  return process.env.JWT_SECRET?.trim() || "dev-jwt-secret-change-me";
}

export function getRefreshSecret(): string {
  return process.env.REFRESH_TOKEN_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "dev-refresh-secret";
}

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  type: "access";
  exp: number;
  iat: number;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signHmac(data: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export function signAccessToken(userId: string, role: UserRole): { token: string; expiresIn: number } {
  const expiresIn = parseExpiresInSeconds(process.env.JWT_EXPIRES_IN?.trim() || "15m");
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload: AccessTokenPayload = {
    sub: userId,
    role,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };
  const body = base64UrlEncode(JSON.stringify(payload));
  const signature = signHmac(`${header}.${body}`, getJwtSecret());
  return { token: `${header}.${body}.${signature}`, expiresIn };
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;
    const expected = signHmac(`${header}.${body}`, getJwtSecret());
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
    const payload = JSON.parse(base64UrlDecode(body)) as AccessTokenPayload;
    if (payload.type !== "access" || !payload.sub) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(header: string | null): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}
