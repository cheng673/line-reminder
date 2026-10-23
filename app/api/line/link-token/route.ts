import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hashLineLinkToken, isLineConfigured } from "@/lib/line";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LINK_TOKEN_LIFETIME_MS = 10 * 60 * 1000;

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    if (!isLineConfigured()) {
      return NextResponse.json({ error: "LINE 連線尚未設定，暫時無法產生綁定碼。" }, { status: 503 });
    }

    const token = randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(Date.now() + LINK_TOKEN_LIFETIME_MS);
    await prisma.$transaction([
      prisma.lineLinkToken.deleteMany({ where: { userId: user.id } }),
      prisma.lineLinkToken.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
      prisma.lineLinkToken.create({
        data: { tokenHash: hashLineLinkToken(token), userId: user.id, expiresAt },
      }),
    ]);

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString() });
  } catch (error) {
    console.error("Unable to create LINE link token", error);
    return NextResponse.json({ error: "暫時無法產生綁定碼。" }, { status: 500 });
  }
}
