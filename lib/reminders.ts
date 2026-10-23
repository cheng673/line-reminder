import { Reminder, ReminderStatus } from "@prisma/client";

export type ReminderPayload = {
  message: string;
  scheduledAt: string;
};

export type ReminderResponse = {
  id: string;
  message: string;
  scheduledAt: string;
  lineUserId: string;
  recipientName: string;
  status: Lowercase<ReminderStatus>;
};

export function validateReminderPayload(payload: unknown): { data: ReminderPayload } | { error: string } {
  if (!payload || typeof payload !== "object") return { error: "請提供提醒資料。" };

  const { message, scheduledAt } = payload as Record<string, unknown>;
  if (typeof message !== "string" || !message.trim()) return { error: "請輸入提醒內容。" };
  if (message.trim().length > 500) return { error: "提醒內容不可超過 500 個字。" };
  if (typeof scheduledAt !== "string" || Number.isNaN(new Date(scheduledAt).getTime())) return { error: "請提供有效的日期與時間。" };

  return { data: { message: message.trim(), scheduledAt } };
}

export function serializeReminder(reminder: Reminder): ReminderResponse {
  return {
    id: reminder.id,
    message: reminder.message,
    scheduledAt: reminder.scheduledAt.toISOString(),
    lineUserId: reminder.lineUserId,
    recipientName: reminder.recipientName,
    status: reminder.status.toLowerCase() as Lowercase<ReminderStatus>,
  };
}
