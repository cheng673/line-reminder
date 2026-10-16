import { timingSafeEqual } from "crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { isLineConfigured, sendLineReminder } from "@/lib/line";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BATCH_SIZE = 50;
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;
const SENT_RETENTION_MS = 24 * 60 * 60 * 1000;

type ClaimedReminder = {
  id: string;
  message: string;
  lineUserId: string;
};

function isAuthorized(request: Request) {
  const expected = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!expected || !authorization?.startsWith("Bearer ")) return false;

  const provided = authorization.slice("Bearer ".length);
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "未授權的排程請求。" }, { status: 401 });
  }

  // Retain a successful reminder for 24 hours, then remove only that completed
  // record. Pending, failed, and currently processing reminders are preserved.
  const expired = await prisma.reminder.deleteMany({
    where: { status: "SENT", sentAt: { lt: new Date(Date.now() - SENT_RETENTION_MS) } },
  });

  if (!isLineConfigured()) {
    return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN 尚未設定；沒有處理任何提醒。", expiredDeleted: expired.count }, { status: 503 });
  }

  // A server crash after claiming a reminder must not leave it permanently stuck.
  const staleBefore = new Date(Date.now() - PROCESSING_TIMEOUT_MS);
  const recovered = await prisma.reminder.updateMany({
    where: { status: "PROCESSING", processingAt: { lt: staleBefore } },
    data: { status: "PENDING", processingAt: null },
  });

  // This atomic claim, plus SKIP LOCKED, lets overlapping cron runs safely work
  // through different reminders without duplicate sends.
  const claimed = await prisma.$queryRaw<ClaimedReminder[]>(Prisma.sql`
    UPDATE "reminders"
    SET "status" = CAST('PROCESSING' AS "ReminderStatus"), "processing_at" = NOW()
    WHERE "id" IN (
      SELECT "id"
      FROM "reminders"
      WHERE "status" = CAST('PENDING' AS "ReminderStatus")
        AND "scheduled_at" <= NOW()
        AND "line_user_id" <> 'PENDING_LINE_SETUP'
      ORDER BY "scheduled_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    RETURNING "id", "message", "line_user_id" AS "lineUserId"
  `);

  let sent = 0;
  let failed = 0;
  for (const reminder of claimed) {
    try {
      await sendLineReminder(reminder.lineUserId, reminder.message);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "SENT", sentAt: new Date(), processingAt: null, error: null },
      });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message.slice(0, 1000) : "未知的 LINE 發送錯誤。";
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: "FAILED", processingAt: null, error: message },
      });
      failed += 1;
      console.error(`Unable to send reminder ${reminder.id}`, error);
    }
  }

  return NextResponse.json({ claimed: claimed.length, sent, failed, recovered: recovered.count, expiredDeleted: expired.count });
}
