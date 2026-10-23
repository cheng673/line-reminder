import { NextResponse } from "next/server";
import { createSession, hashPassword, setSessionCookie, validatePassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { userId, lineUserId, password, confirmPassword } = (await request.json()) as {
      userId?: unknown; lineUserId?: unknown; password?: unknown; confirmPassword?: unknown;
    };
    if (typeof userId !== "string" || typeof lineUserId !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "請選擇已綁定的 LINE 收件人。" }, { status: 400 });
    }

    const recipient = await prisma.lineRecipient.findUnique({
      where: { userId_lineUserId: { userId, lineUserId } },
    });
    if (!recipient?.isActive) {
      return NextResponse.json({ error: "這位 LINE 收件人目前無法使用。" }, { status: 404 });
    }

    if (!recipient.passwordHash) {
      const passwordError = validatePassword(password);
      if (passwordError) return NextResponse.json({ error: passwordError.replaceAll("管理密碼", "密碼") }, { status: 400 });
      if (password !== confirmPassword) return NextResponse.json({ error: "兩次輸入的密碼不一致。" }, { status: 400 });
      await prisma.lineRecipient.update({
        where: { userId_lineUserId: { userId, lineUserId } },
        data: { passwordHash: hashPassword(password) },
      });
    } else if (!verifyPassword(password, recipient.passwordHash)) {
      return NextResponse.json({ error: "密碼不正確。" }, { status: 401 });
    }

    const token = await createSession(userId, lineUserId);
    const response = NextResponse.json({ ok: true, displayName: recipient.displayName });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Unable to select LINE recipient", error);
    return NextResponse.json({ error: "暫時無法切換 LINE 收件人。" }, { status: 500 });
  }
}
