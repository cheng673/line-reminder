import { NextResponse } from "next/server";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { username, password } = (await request.json()) as { username?: unknown; password?: unknown };
    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "請輸入帳號與密碼。" }, { status: 400 });
    }

    const user = await prisma.appUser.findUnique({ where: { username: username.trim() } });
    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "帳號或密碼不正確。" }, { status: 401 });
    }

    const token = await createSession(user.id);
    const response = NextResponse.json({ ok: true, username: user.username });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Unable to log in", error);
    return NextResponse.json({ error: "暫時無法解鎖，請稍後再試。" }, { status: 500 });
  }
}
