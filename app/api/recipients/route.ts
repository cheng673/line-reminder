import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const recipients = await prisma.lineRecipient.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: { lineUserId: true, displayName: true },
    });
    return NextResponse.json(recipients);
  } catch (error) {
    console.error("Unable to list LINE recipients", error);
    return NextResponse.json({ error: "暫時無法讀取 LINE 收件人。" }, { status: 500 });
  }
}
