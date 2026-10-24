import { NextResponse } from "next/server";
import { getCurrentRecipient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextScheduledRun, serializeScheduledReminder } from "@/lib/schedules";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const { isActive } = (await request.json()) as { isActive?: unknown };
    if (typeof isActive !== "boolean") return NextResponse.json({ error: "請提供啟用狀態。" }, { status: 400 });
    const { id } = await params;
    const existing = await prisma.scheduledReminder.findFirst({
      where: { id, userId: access.user.id, lineUserId: access.recipient.lineUserId },
    });
    if (!existing) return NextResponse.json({ error: "找不到這個排程提醒。" }, { status: 404 });
    const schedule = await prisma.scheduledReminder.update({
      where: { id },
      data: {
        isActive,
        nextRunAt: isActive
          ? nextScheduledRun({ frequency: existing.frequency, weekdays: existing.weekdays, timeOfDay: existing.timeOfDay })
          : existing.nextRunAt,
      },
    });
    return NextResponse.json(serializeScheduledReminder(schedule));
  } catch (error) {
    console.error("Unable to update scheduled reminder", error);
    return NextResponse.json({ error: "更新排程提醒失敗。" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: RouteContext) {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const { id } = await params;
    const deleted = await prisma.scheduledReminder.deleteMany({
      where: { id, userId: access.user.id, lineUserId: access.recipient.lineUserId },
    });
    if (!deleted.count) return NextResponse.json({ error: "找不到這個排程提醒。" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Unable to delete scheduled reminder", error);
    return NextResponse.json({ error: "刪除排程提醒失敗。" }, { status: 500 });
  }
}
