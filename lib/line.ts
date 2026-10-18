const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";
const LINE_PROFILE_ENDPOINT = "https://api.line.me/v2/bot/profile";

export function isLineConfigured() {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
}

export async function getLineDisplayName(lineUserId: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(`${LINE_PROFILE_ENDPOINT}/${encodeURIComponent(lineUserId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;

    const profile = await response.json() as { displayName?: unknown };
    return typeof profile.displayName === "string" && profile.displayName.trim()
      ? profile.displayName.trim().slice(0, 100)
      : null;
  } catch (error) {
    console.warn("Unable to load LINE user profile", error);
    return null;
  }
}

export async function sendLineReminder(lineUserId: string, message: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new Error("LINE_CHANNEL_ACCESS_TOKEN 尚未設定。");

  const response = await fetch(LINE_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: "text", text: `🔔 提醒\n\n${message}` }],
    }),
  });

  if (response.ok) return;

  const details = await response.json().catch(() => null) as { message?: string } | null;
  throw new Error(`LINE API 回應 ${response.status}${details?.message ? `：${details.message}` : ""}`);
}
