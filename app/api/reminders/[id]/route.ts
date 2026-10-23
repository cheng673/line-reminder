import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeReminder, validateReminderPayload } from "@/lib/reminders";
import { getCurrentRecipient } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const result = validateReminderPayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const { id } = await params;
    const existing = await prisma.reminder.findFirst({
      where: { id, userId: access.user.id, lineUserId: access.recipient.lineUserId },
    });
    if (!existing) return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        message: result.data.message,
        scheduledAt: new Date(result.data.scheduledAt),
        recipientName: access.recipient.displayName,
        lineUserId: access.recipient.lineUserId,
        status: "PENDING",
        sentAt: null,
        error: null,
      },
    });
    return NextResponse.json(serializeReminder(reminder));
  } catch (error) {
    console.error("Unable to update reminder", error);
    return NextResponse.json({ error: "更新提醒失敗，請稍後再試。" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const { id } = await params;
    const deleted = await prisma.reminder.deleteMany({
      where: { id, userId: access.user.id, lineUserId: access.recipient.lineUserId },
    });
    if (!deleted.count) return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unable to delete reminder", error);
    return NextResponse.json({ error: "刪除提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
