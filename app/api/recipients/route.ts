import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getLineDisplayName } from "@/lib/line";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "請先解鎖提醒。" }, { status: 401 });
    const recipients = await prisma.lineRecipient.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { lineUserId: true, displayName: true },
    });

    // Older recipients were saved before profile names were collected. Resolve
    // those placeholder values on read, so existing friends are repaired
    // without requiring another webhook event.
    const resolvedRecipients = await Promise.all(
      recipients.map(async (recipient) => {
        if (recipient.displayName !== "我的 LINE") return recipient;

        const displayName = await getLineDisplayName(recipient.lineUserId);
        if (!displayName) return recipient;

        await prisma.lineRecipient.update({
          where: { lineUserId: recipient.lineUserId },
          data: { displayName },
        });
        return { ...recipient, displayName };
      }),
    );

    return NextResponse.json(resolvedRecipients, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (error) {
    console.error("Unable to list LINE recipients", error);
    return NextResponse.json({ error: "暫時無法讀取 LINE 收件人。" }, { status: 500 });
  }
}
