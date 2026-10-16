import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReminder, validateReminderPayload } from "@/lib/reminders";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "請先解鎖提醒。" }, { status: 401 });
    const reminders = await prisma.reminder.findMany({ orderBy: { scheduledAt: "asc" } });
    return NextResponse.json(reminders.map(serializeReminder));
  } catch (error) {
    console.error("Unable to list reminders", error);
    return NextResponse.json({ error: "暫時無法讀取提醒，請稍後再試。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await getCurrentUser())) return NextResponse.json({ error: "請先解鎖提醒。" }, { status: 401 });
    const result = validateReminderPayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const recipient = result.data.lineUserId
      ? await prisma.lineRecipient.findFirst({ where: { lineUserId: result.data.lineUserId, isActive: true } })
      : null;
    if (result.data.lineUserId && !recipient) {
      return NextResponse.json({ error: "這位 LINE 收件人尚未註冊或已解除連結。" }, { status: 400 });
    }

    // LINE_DEFAULT_USER_ID is kept as a development fallback. The normal path
    // is a recipient registered by the signed LINE webhook.
    const lineUserId = recipient?.lineUserId || process.env.LINE_DEFAULT_USER_ID || "PENDING_LINE_SETUP";
    const reminder = await prisma.reminder.create({
      data: {
        message: result.data.message,
        scheduledAt: new Date(result.data.scheduledAt),
        recipientName: recipient?.displayName || result.data.recipientName,
        lineUserId,
      },
    });
    return NextResponse.json(serializeReminder(reminder), { status: 201 });
  } catch (error) {
    console.error("Unable to create reminder", error);
    return NextResponse.json({ error: "建立提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
