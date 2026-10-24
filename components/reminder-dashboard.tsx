"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useReminderData } from "@/components/reminder-data";
import type { Reminder, ReminderStatus } from "@/lib/types";

const statusText: Record<ReminderStatus, string> = {
  pending: "待發送",
  processing: "發送中",
  sent: "已發送",
  failed: "發送失敗",
};

function taipeiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function taipeiTodayLabel() {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei", year: "numeric", month: "long", day: "numeric", weekday: "long",
  }).format(new Date());
}

function taipeiGreeting() {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Taipei", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  if (hour < 12) return "早安";
  if (hour < 18) return "午安";
  return "晚安";
}

function dateTimeParts(value: string) {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("zh-TW", { month: "2-digit", day: "2-digit", timeZone: "Asia/Taipei" }).format(date),
    time: new Intl.DateTimeFormat("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Taipei" }).format(date),
  };
}

function inputDateTime(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "系統暫時無法完成操作。");
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export function ReminderDashboard() {
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(taipeiToday);
  const [time, setTime] = useState("07:30");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSwitchingRecipient, setIsSwitchingRecipient] = useState(false);
  const { reminders, recipients, isLoading, error: loadingError, setReminders } = useReminderData();

  const pendingCount = useMemo(
    () => reminders.filter((reminder) => reminder.status === "pending").length,
    [reminders],
  );
  const recentReminders = useMemo(() => reminders.slice(0, 5), [reminders]);

  function clearForm() {
    setMessage("");
    setDate(taipeiToday());
    setTime("07:30");
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setNotice("請先輸入提醒內容。");
      return;
    }
    if (!recipients[0]) {
      setNotice("請先選擇已綁定的 LINE 收件人。");
      return;
    }

    const body = {
      message: trimmedMessage,
      scheduledAt: new Date(`${date}T${time}:00+08:00`).toISOString(),
    };
    setIsSaving(true);
    try {
      const reminder = await requestJson<Reminder>(editingId ? `/api/reminders/${editingId}` : "/api/reminders", {
        method: editingId ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setReminders((current) => {
        const next = editingId ? current.map((item) => (item.id === editingId ? reminder : item)) : [...current, reminder];
        return next.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      });
      setNotice(editingId ? "提醒已更新。" : "提醒已儲存。LINE 發送功能將在下一階段啟用。");
      clearForm();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "系統暫時無法完成操作。");
    } finally {
      setIsSaving(false);
    }
  }

  function editReminder(reminder: Reminder) {
    const { date: nextDate, time: nextTime } = inputDateTime(reminder.scheduledAt);
    setMessage(reminder.message);
    setDate(nextDate);
    setTime(nextTime);
    setEditingId(reminder.id);
    setNotice("正在編輯提醒。");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteReminder(id: string) {
    try {
      await requestJson<void>(`/api/reminders/${id}`, { method: "DELETE" });
      setReminders((current) => current.filter((reminder) => reminder.id !== id));
      if (editingId === id) clearForm();
      setNotice("提醒已刪除，不會再發送。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "系統暫時無法完成操作。");
    }
  }

  async function lockApp() {
    setIsSwitchingRecipient(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/");
    } finally {
      setIsSwitchingRecipient(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="提醒一下首頁">
          <span className="brand-mark">✓</span>
          <span>提醒一下</span>
        </a>
        <div className="topbar-actions">
          <span className="greeting">{taipeiGreeting()}，{recipients[0]?.displayName || "你"}</span>
          <span className="phase-chip">今天 · {taipeiTodayLabel()}</span>
          <button className="lock-button" type="button" onClick={lockApp} disabled={isSwitchingRecipient}>
            {isSwitchingRecipient ? "切換中…" : "切換對象"}
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">LINE REMINDER</p>
        <h1>把重要的事，<br /><em>準時提醒自己。</em></h1>
        <p className="hero-copy">設定一次提醒；正式串接後，時間一到就由系統透過 LINE 傳送給你。</p>
      </section>

      <section className="dashboard" aria-label="提醒管理">
        <form className="create-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEW REMINDER</p>
              <h2>{editingId ? "編輯提醒" : "建立提醒"}</h2>
            </div>
            <Link className="text-button schedule-entry" href="/scheduled-reminders">排程提醒 ↗</Link>
            {editingId && (
              <button type="button" className="text-button" onClick={clearForm} disabled={isSaving}>取消編輯</button>
            )}
          </div>

          <label className="field full">
            <span>提醒內容</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="例如：明天記得帶體育服" rows={3} maxLength={500} />
          </label>

          <div className="field-grid">
            <label className="field">
              <span>日期</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="field">
              <span>時間</span>
              <input type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
            </label>
          </div>

          <p className="recipient-summary" aria-live="polite">
            將發送給 <strong>{recipients[0]?.displayName || "尚未選擇 LINE 收件人"}</strong>
          </p>

          {(notice || loadingError) && <p className="notice" role="status">{notice || loadingError}</p>}
          <button className="primary-button" type="submit" disabled={isSaving}>
            <span>＋</span>{isSaving ? "儲存中…" : editingId ? "儲存變更" : "建立提醒"}
          </button>
        </form>

        <section className="list-card" aria-live="polite">
          <div className="section-heading">
            <div>
              <p className="eyebrow">UPCOMING</p>
              <h2>近期提醒</h2>
            </div>
            <span className="count">{pendingCount} 個待辦</span>
          </div>

          <div className="reminder-list">
            {isLoading && <p className="empty">正在讀取提醒…</p>}
            {!isLoading && recentReminders.map((reminder) => {
              const when = dateTimeParts(reminder.scheduledAt);
              return (
                <article className="reminder" key={reminder.id}>
                  <div className="when">
                    <strong>{when.time}</strong>
                    <span>{when.date}</span>
                  </div>
                  <div className="reminder-content">
                    <p>{reminder.message}</p>
                    <span className={`status status-${reminder.status}`}>{statusText[reminder.status]} · {reminder.recipientName}</span>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={() => editReminder(reminder)} aria-label={`編輯：${reminder.message}`} disabled={isSaving}>編輯</button>
                    <button type="button" className="delete" onClick={() => deleteReminder(reminder.id)} aria-label={`刪除：${reminder.message}`} disabled={isSaving}>刪除</button>
                  </div>
                </article>
              );
            })}
            {!isLoading && reminders.length === 0 && <p className="empty">目前沒有提醒。建立第一個提醒吧！</p>}
            {!isLoading && reminders.length > recentReminders.length && <Link className="view-all-link" href="/all-reminders">查看全部提醒</Link>}
          </div>
        </section>
      </section>

      <footer>
        <span>提醒一下 · 先把重要的事準時送達</span>
        <span>Phase 1：UI 原型</span>
      </footer>
    </main>
  );
}
