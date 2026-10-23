import { NextResponse } from "next/server";
import { getCurrentUser, hasOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const [user, configured] = await Promise.all([getCurrentUser(), hasOwner()]);
  return NextResponse.json({ authenticated: Boolean(user), configured, username: user?.username ?? null });
}
