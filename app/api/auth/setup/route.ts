import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession, hashPassword, hasOwner, setSessionCookie, validatePassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const OWNER_ID = "owner";

export async function POST(request: Request) {
  try {
    if (await hasOwner()) {
      return NextResponse.json({ error: "管理密碼已設定，請直接解鎖。" }, { status: 409 });
    }

    const { password, confirmPassword } = (await request.json()) as {
      password?: unknown;
      confirmPassword?: unknown;
    };
    const passwordError = validatePassword(password);
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
    if (typeof password !== "string") return NextResponse.json({ error: "請輸入管理密碼。" }, { status: 400 });
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "兩次輸入的管理密碼不一致。" }, { status: 400 });
    }

    try {
      await prisma.appUser.upsert({
        where: { id: OWNER_ID },
        create: { id: OWNER_ID, passwordHash: hashPassword(password) },
        update: { passwordHash: hashPassword(password) },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return NextResponse.json({ error: "管理密碼已設定，請直接解鎖。" }, { status: 409 });
      }
      throw error;
    }

    const token = await createSession(OWNER_ID);
    const response = NextResponse.json({ ok: true });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Unable to set management password", error);
    return NextResponse.json({ error: "無法設定管理密碼，請稍後再試。" }, { status: 500 });
  }
}
