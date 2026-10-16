import { NextResponse } from "next/server";
import { clearSessionCookie, removeCurrentSession } from "@/lib/auth";

export async function POST() {
  await removeCurrentSession();
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
