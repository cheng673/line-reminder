import { NextResponse } from "next/server";
import { getCurrentRecipient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextScheduledRun, serializeScheduledReminder, validateSchedulePayload } from "@/lib/schedules";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const schedules = await prisma.scheduledReminder.findMany({
      where: { userId: access.user.id, lineUserId: access.recipient.lineUserId },
      orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }],
    });
    return NextResponse.json(schedules.map(serializeScheduledReminder));
  } catch (error) {
    console.error("Unable to list scheduled reminders", error);
    return NextResponse.json({ error: "暫時無法讀取排程提醒。" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const access = await getCurrentRecipient();
    if (!access) return NextResponse.json({ error: "請先選擇 LINE 收件人。" }, { status: 401 });
    const result = validateSchedulePayload(await request.json());
    if ("error" in result) return NextResponse.json(result, { status: 400 });

    const schedule = await prisma.scheduledReminder.create({
      data: {
        ...result.data,
        nextRunAt: nextScheduledRun(result.data),
        userId: access.user.id,
        lineUserId: access.recipient.lineUserId,
        recipientName: access.recipient.displayName,
      },
    });
    return NextResponse.json(serializeScheduledReminder(schedule), { status: 201 });
  } catch (error) {
    console.error("Unable to create scheduled reminder", error);
    return NextResponse.json({ error: "建立排程提醒失敗，請稍後再試。" }, { status: 500 });
  }
}
