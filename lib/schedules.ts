import type { ScheduleFrequency, ScheduledReminder } from "@prisma/client";

export type SchedulePayload = {
  message: string;
  frequency: "DAILY" | "WEEKLY";
  weekdays: number[];
  timeOfDay: string;
};

function taipeiParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day") };
}

function taipeiDateAt(year: number, month: number, day: number, timeOfDay: string) {
  const [hour, minute] = timeOfDay.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 8, minute));
}

export function nextScheduledRun(schedule: Pick<SchedulePayload, "frequency" | "weekdays" | "timeOfDay">, from = new Date()) {
  const { year, month, day } = taipeiParts(from);
  for (let offset = 0; offset <= 8; offset += 1) {
    const candidateDay = new Date(Date.UTC(year, month - 1, day + offset));
    const weekday = candidateDay.getUTCDay();
    const candidate = taipeiDateAt(candidateDay.getUTCFullYear(), candidateDay.getUTCMonth() + 1, candidateDay.getUTCDate(), schedule.timeOfDay);
    const matches = schedule.frequency === "DAILY" || schedule.weekdays.includes(weekday);
    if (matches && candidate > from) return candidate;
  }
  throw new Error("無法計算下一次排程時間。");
}

export function validateSchedulePayload(payload: unknown): { data: SchedulePayload } | { error: string } {
  if (!payload || typeof payload !== "object") return { error: "請提供排程資料。" };
  const { message, frequency, weekdays, timeOfDay } = payload as Record<string, unknown>;
  if (typeof message !== "string" || !message.trim()) return { error: "請輸入提醒內容。" };
  if (message.trim().length > 500) return { error: "提醒內容不可超過 500 個字。" };
  if (frequency !== "DAILY" && frequency !== "WEEKLY") return { error: "請選擇每天或每週。" };
  if (typeof timeOfDay !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(timeOfDay)) return { error: "請選擇有效時間。" };
  const days = Array.isArray(weekdays) ? weekdays : [];
  if (!days.every((day) => Number.isInteger(day) && day >= 0 && day <= 6)) return { error: "星期設定不正確。" };
  const uniqueDays = [...new Set(days)].sort((a, b) => a - b);
  if (frequency === "WEEKLY" && uniqueDays.length === 0) return { error: "每週排程至少選擇一天。" };
  return { data: { message: message.trim(), frequency, weekdays: frequency === "DAILY" ? [] : uniqueDays, timeOfDay } };
}

export function serializeScheduledReminder(reminder: ScheduledReminder) {
  return {
    id: reminder.id,
    message: reminder.message,
    frequency: reminder.frequency,
    weekdays: reminder.weekdays,
    timeOfDay: reminder.timeOfDay,
    nextRunAt: reminder.nextRunAt.toISOString(),
    lastSentAt: reminder.lastSentAt?.toISOString() ?? null,
    isActive: reminder.isActive,
  };
}
