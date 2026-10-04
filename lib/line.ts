const LINE_PUSH_ENDPOINT = "https://api.line.me/v2/bot/message/push";

export function isLineConfigured() {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN);
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
