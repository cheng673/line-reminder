import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLineDisplayName } from "@/lib/line";

export const runtime = "nodejs";

type LineEvent = {
  type: "follow" | "unfollow" | "message" | string;
  source?: { type?: string; userId?: string };
};

type WebhookBody = { events?: LineEvent[] };

function signatureMatches(rawBody: string, received: string | null) {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !received) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function POST(request: Request) {
  // Verify the exact, unparsed body first. JSON parsing before verification can
  // change the byte sequence and invalidate LINE's HMAC signature.
  const rawBody = await request.text();
  if (!signatureMatches(rawBody, request.headers.get("x-line-signature"))) {
    return NextResponse.json({ error: "無效的 LINE webhook 簽名。" }, { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody) as WebhookBody;
  } catch {
    return NextResponse.json({ error: "無效的 webhook 資料。" }, { status: 400 });
  }

  await Promise.all(
    (body.events ?? []).map(async (event) => {
      if (event.source?.type !== "user" || !event.source.userId) return;

      if (event.type === "unfollow") {
        await prisma.lineRecipient.updateMany({
          where: { lineUserId: event.source.userId },
          data: { isActive: false },
        });
        return;
      }

      if (event.type === "follow" || event.type === "message") {
        const displayName = await getLineDisplayName(event.source.userId);
        await prisma.lineRecipient.upsert({
          where: { lineUserId: event.source.userId },
          create: { lineUserId: event.source.userId, displayName: displayName || "我的 LINE" },
          update: {
            isActive: true,
            ...(displayName ? { displayName } : {}),
          },
        });
      }
    }),
  );

  return NextResponse.json({ ok: true });
}
