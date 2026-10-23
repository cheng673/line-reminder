import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recipients = await prisma.lineRecipient.findMany({
      where: { isActive: true },
      select: { userId: true, lineUserId: true, displayName: true, passwordHash: true },
      orderBy: [{ displayName: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(
      recipients.map(({ passwordHash, ...recipient }) => ({ ...recipient, passwordConfigured: Boolean(passwordHash) })),
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Unable to list recipient choices", error);
    return NextResponse.json({ error: "暫時無法讀取已綁定的 LINE 收件人。" }, { status: 500 });
  }
}
