import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeReminder, validateReminderPayload } from "@/lib/reminders";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const result = validateReminderPayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const { id } = await params;
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        message: result.data.message,
        scheduledAt: new Date(result.data.scheduledAt),
        recipientName: result.data.recipientName,
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
    const { id } = await params;
    await prisma.reminder.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "找不到這個提醒。" }, { status: 404 });
    }
    console.error("Unable to delete reminder", error);
    return NextResponse.json({ error: "刪除提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
