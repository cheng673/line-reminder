import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeReminder, validateReminderPayload } from "@/lib/reminders";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const result = validateReminderPayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const { id } = await params;
    const existing = await prisma.reminder.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });

    const recipient = result.data.lineUserId
      ? await prisma.lineRecipient.findUnique({
        where: { userId_lineUserId: { userId: user.id, lineUserId: result.data.lineUserId } },
      })
      : null;
    if (result.data.lineUserId && (!recipient || !recipient.isActive)) {
      return NextResponse.json({ error: "這位 LINE 收件人尚未連結到你的帳號。" }, { status: 400 });
    }

    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        message: result.data.message,
        scheduledAt: new Date(result.data.scheduledAt),
        recipientName: recipient?.displayName || result.data.recipientName,
        lineUserId: recipient?.lineUserId || existing.lineUserId,
        status: "PENDING",
        sentAt: null,
        error: null,
      },
    });
    return NextResponse.json(serializeReminder(reminder));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });
    }
    console.error("Unable to update reminder", error);
    return NextResponse.json({ error: "更新提醒失敗，請稍後再試。" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "請先登入。" }, { status: 401 });
    const { id } = await params;
    const deleted = await prisma.reminder.deleteMany({ where: { id, userId: user.id } });
    if (!deleted.count) return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });
    }
    console.error("Unable to delete reminder", error);
    return NextResponse.json({ error: "刪除提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
