import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession, hashPassword, setSessionCookie, validatePassword, validateUsername } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { username, password, confirmPassword } = (await request.json()) as {
      username?: unknown;
      password?: unknown;
      confirmPassword?: unknown;
    };
    const usernameError = validateUsername(username);
    if (usernameError) return NextResponse.json({ error: usernameError }, { status: 400 });
    if (typeof username !== "string") return NextResponse.json({ error: "請輸入帳號。" }, { status: 400 });
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
    if (typeof password !== "string" || password !== confirmPassword) {
      return NextResponse.json({ error: "兩次輸入的密碼不一致。" }, { status: 400 });
    }

    const user = await prisma.appUser.create({
      data: { id: crypto.randomUUID(), username: username.trim(), passwordHash: hashPassword(password) },
    });
    const token = await createSession(user.id);
    const response = NextResponse.json({ ok: true, username: user.username }, { status: 201 });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "這個帳號已有人使用，請換一個。" }, { status: 409 });
    }
    console.error("Unable to register account", error);
    return NextResponse.json({ error: "無法建立帳號，請稍後再試。" }, { status: 500 });
  }
}
