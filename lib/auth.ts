import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "line_reminder_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function validatePassword(password: unknown) {
  if (typeof password !== "string") return "請輸入管理密碼。";
  if (password.length < PASSWORD_MIN_LENGTH) return `管理密碼至少需要 ${PASSWORD_MIN_LENGTH} 個字元。`;
  if (password.length > PASSWORD_MAX_LENGTH) return `管理密碼不能超過 ${PASSWORD_MAX_LENGTH} 個字元。`;
  return null;
}

export function validateUsername(username: unknown) {
  if (typeof username !== "string") return "請輸入帳號。";
  const value = username.trim();
  if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
    return `帳號需為 ${USERNAME_MIN_LENGTH} 至 ${USERNAME_MAX_LENGTH} 個字元。`;
  }
  if (!/^[\p{L}\p{N}_-]+$/u.test(value)) {
    return "帳號只能使用中英文、數字、底線或連字號。";
  }
  return null;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derivedKey = scryptSync(password, salt, 64).toString("base64url");
  return `scrypt$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, storedKey] = storedHash.split("$");
  if (algorithm !== "scrypt" || !salt || !storedKey) return false;
  const derivedKey = scryptSync(password, salt, 64).toString("base64url");
  const expected = Buffer.from(storedKey, "base64url");
  const actual = Buffer.from(derivedKey, "base64url");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function hasOwner() {
  return (await prisma.appUser.count({ where: { passwordHash: { not: null } } })) > 0;
}

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || !session.user.passwordHash) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await prisma.$transaction([
    prisma.userSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.userSession.create({
      data: { userId, tokenHash: hashToken(token), expiresAt },
    }),
  ]);

  return token;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function removeCurrentSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.userSession.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
