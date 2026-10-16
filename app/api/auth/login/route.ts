import { NextResponse } from "next/server";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OWNER_ID = "owner";

export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: unknown };
    if (typeof password !== "string") {
      return NextResponse.json({ error: "請輸入管理密碼。" }, { status: 400 });
    }

    const owner = await prisma.appUser.findUnique({ where: { id: OWNER_ID } });
    if (!owner?.passwordHash || !verifyPassword(password, owner.passwordHash)) {
      return NextResponse.json({ error: "管理密碼不正確。" }, { status: 401 });
    }

    const token = await createSession(OWNER_ID);
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Unable to log in", error);
    return NextResponse.json({ error: "暫時無法解鎖，請稍後再試。" }, { status: 500 });
  }
}
