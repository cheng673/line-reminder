import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReminder, validateReminderPayload } from "@/lib/reminders";
import { getCurrentRecipient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const reminders = await prisma.reminder.findMany({
      where: { userId: access.user.id, lineUserId: access.recipient.lineUserId },
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
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const result = validateReminderPayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const reminder = await prisma.reminder.create({
      data: {
        message: result.data.message,
        scheduledAt: new Date(result.data.scheduledAt),
        recipientName: access.recipient.displayName,
        lineUserId: access.recipient.lineUserId,
        userId: access.user.id,
      },
    });
    return NextResponse.json(serializeReminder(reminder), { status: 201 });
  } catch (error) {
    console.error("Unable to create reminder", error);
    return NextResponse.json({ error: "建立提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
