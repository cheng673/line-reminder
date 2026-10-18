"use client";

import { useMemo } from "react";
import { useReminderData } from "@/components/reminder-data";
import type { Reminder, ReminderStatus } from "@/lib/types";

type ReminderListPageProps = { mode: "all" | "mine" };

const statusText: Record<ReminderStatus, string> = {
  pending: "待發送",
  processing: "發送中",
  sent: "已發送",
  failed: "發送失敗",
};

function dateTimeParts(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("zh-TW", { month: "long", day: "numeric", timeZone: "Asia/Taipei" }).format(date),
    time: new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(date),
  };
}

export function ReminderListPage({ mode }: ReminderListPageProps) {
  const { reminders, error, isLoading } = useReminderData();
  const isAll = mode === "all";

  const displayedReminders = useMemo(
    () => (isAll ? reminders : reminders.filter((reminder) => reminder.status !== "sent")),
    [isAll, reminders],
  );

  return (
    <main className="shell subpage-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="回到提醒一下首頁">
          <span className="brand-mark">✓</span>
          <span>提醒一下</span>
        </a>
        <span className="phase-chip">{displayedReminders.length} 筆提醒</span>
      </header>

      <section className="subpage-hero">
        <p className="eyebrow">{isAll ? "EVERYTHING" : "FOR YOU"}</p>
        <h1>{isAll ? "所有提醒" : "我的提醒"}</h1>
        <p>{isAll ? "完整保留每一筆提醒的發送狀態與時間。" : "依目前規則整理尚待處理、發送中與需要留意的提醒。"}</p>
      </section>

      <section className="list-card reminder-collection" aria-live="polite">
        {isLoading && <p className="empty">正在讀取提醒…</p>}
        {error && <p className="notice" role="alert">{error}</p>}
        {!isLoading && !error && displayedReminders.map((reminder) => {
          const when = dateTimeParts(reminder.scheduledAt);
          return (
            <article className="reminder" key={reminder.id}>
              <div className="when"><strong>{when.time}</strong><span>{when.date}</span></div>
              <div className="reminder-content">
                <p>{reminder.message}</p>
                <span className={`status status-${reminder.status}`}>{statusText[reminder.status]} · {reminder.recipientName}</span>
              </div>
            </article>
          );
        })}
        {!isLoading && !error && displayedReminders.length === 0 && <p className="empty">目前沒有符合條件的提醒。</p>}
      </section>
    </main>
  );
}
