"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Recipient, Reminder, ReminderStatus } from "@/lib/types";

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
  const [recipient, setRecipient] = useState("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

  const pendingCount = useMemo(
    () => reminders.filter((reminder) => reminder.status === "pending").length,
    [reminders],
  );
  const recentReminders = useMemo(() => reminders.slice(0, 5), [reminders]);

  useEffect(() => {
    Promise.all([requestJson<Reminder[]>("/api/reminders"), requestJson<Recipient[]>("/api/recipients")])
      .then(([savedReminders, savedRecipients]) => {
        setReminders(savedReminders);
        setRecipients(savedRecipients);
        setRecipient((current) => current || savedRecipients[0]?.lineUserId || "");
      })
      .catch((error: Error) => setNotice(error.message))
      .finally(() => setIsLoading(false));
  }, []);

  function clearForm() {
    setMessage("");
    setDate(taipeiToday());
    setTime("07:30");
    setRecipient(recipients[0]?.lineUserId || "");
    setEditingId(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setNotice("請先輸入提醒內容。");
      return;
    }
    const selectedRecipient = recipients.find((item) => item.lineUserId === recipient);
    if (!selectedRecipient) {
      setNotice("請先把 LINE 官方帳號加為好友，讓系統註冊你的收件人資料。");
      return;
    }

    const body = {
      message: trimmedMessage,
      scheduledAt: new Date(`${date}T${time}:00+08:00`).toISOString(),
      recipientName: selectedRecipient.displayName,
      lineUserId: selectedRecipient.lineUserId,
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
    setRecipient(reminder.lineUserId);
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
    setIsLocking(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.assign("/");
    } finally {
      setIsLocking(false);
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
          <span className="phase-chip">今天 · {taipeiTodayLabel()}</span>
          <button className="lock-button" type="button" onClick={lockApp} disabled={isLocking}>
            {isLocking ? "鎖定中…" : "鎖定"}
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

          <label className="field full">
            <span>發送給</span>
            <select value={recipient} onChange={(event) => setRecipient(event.target.value)} disabled={!recipients.length}>
              {!recipients.length && <option value="">尚未註冊 LINE 收件人</option>}
              {recipients.map((item) => (
                <option key={item.lineUserId} value={item.lineUserId}>{item.displayName}</option>
              ))}
            </select>
            <small>加為官方帳號好友後，系統會自動列出你的 LINE。</small>
          </label>

          {notice && <p className="notice" role="status">{notice}</p>}
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
      <BottomNavigation />
    </main>
  );
}
