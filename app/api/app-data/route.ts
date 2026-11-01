import { NextResponse } from "next/server";
import { getCurrentRecipient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeReminder } from "@/lib/reminders";

export const dynamic = "force-dynamic";

// The app shell needs these values together. Returning one compact response
// avoids separate session checks and three competing browser requests on load.
export async function GET() {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });

    const [reminders, recipients, activeScheduleCount] = await Promise.all([
      prisma.reminder.findMany({
        where: { userId: access.user.id, lineUserId: access.recipient.lineUserId },
        orderBy: { scheduledAt: "asc" },
      }),
      prisma.lineRecipient.findMany({
        where: { userId: access.user.id, lineUserId: access.recipient.lineUserId, isActive: true },
        orderBy: { createdAt: "asc" },
        select: { lineUserId: true, displayName: true },
      }),
      prisma.scheduledReminder.count({
        where: { userId: access.user.id, lineUserId: access.recipient.lineUserId, isActive: true },
      }),
    ]);

    return NextResponse.json({
      reminders: reminders.map(serializeReminder),
      recipients,
      activeScheduleCount,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("Unable to load app data", error);
    return NextResponse.json({ error: "暫時無法讀取提醒資料，請稍後再試。" }, { status: 500 });
  }
}
