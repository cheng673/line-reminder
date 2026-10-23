import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReminder, validateReminderPayload } from "@/lib/reminders";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const reminders = await prisma.reminder.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(reminders.map(serializeReminder));
  } catch (error) {
    console.error("Unable to list reminders", error);
    return NextResponse.json({ error: "暫時無法讀取提醒，請稍後再試。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const result = validateReminderPayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const recipient = result.data.lineUserId
      ? await prisma.lineRecipient.findUnique({
        where: { userId_lineUserId: { userId: user.id, lineUserId: result.data.lineUserId } },
      })
      : null;
    if (result.data.lineUserId && (!recipient || !recipient.isActive)) {
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
        userId: user.id,
      },
    });
    return NextResponse.json(serializeReminder(reminder), { status: 201 });
  } catch (error) {
    console.error("Unable to create reminder", error);
    return NextResponse.json({ error: "建立提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
