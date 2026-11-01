"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useReminderData } from "@/components/reminder-data";
import type { Reminder } from "@/lib/types";

function taipeiToday() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = (name: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === name)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function ReminderFormPage() {
  const router = useRouter();
  const { recipients, setReminders } = useReminderData();
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(taipeiToday);
  const [time, setTime] = useState("09:00");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const recipient = recipients[0];
  const schedule = useMemo(() => new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(`${date}T${time}:00+08:00`)), [date, time]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim()) { setNotice("請輸入提醒內容。"); return; }
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: message.trim(), scheduledAt: new Date(`${date}T${time}:00+08:00`).toISOString() }) });
      const body = await response.json().catch(() => null) as Reminder | { error?: string } | null;
      if (!response.ok || !body || "error" in body) throw new Error(!body || "error" in body ? body?.error || "建立提醒失敗。" : "建立提醒失敗。");
      const reminder = body as Reminder;
      setReminders((current) => [...current, reminder].sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt)));
      router.push("/");
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "建立提醒失敗。"); } finally { setSaving(false); }
  }

  return <main className="app-shell reminder-form-page">
    <header className="form-header"><Link href="/" className="back-button" aria-label="返回首頁">‹</Link><div><p className="app-kicker">NEW REMINDER</p><h1>新增提醒</h1></div><span /> </header>
    <form className="reminder-editor" onSubmit={submit}>
      <label className="editor-title"><span>提醒內容</span><textarea autoFocus value={message} onChange={(event) => setMessage(event.target.value)} placeholder="想提醒自己什麼？" maxLength={500} rows={3} /></label>
      <section className="editor-group"><h2>時間</h2><label><span>日期</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label><span>時間</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label></section>
      <section className="editor-group"><h2>通知方式</h2><div className="editor-static-row"><span className="row-icon blue">⌁</span><div><strong>LINE 通知</strong><small>系統會在指定時間傳送提醒</small></div></div><div className="editor-static-row"><span className="friend-avatar">{recipient?.displayName.slice(0, 1) || "L"}</span><div><strong>{recipient?.displayName || "尚未選擇收件人"}</strong><small>目前綁定的提醒對象</small></div></div></section>
      <Link href="/scheduled-reminders" className="repeat-link"><span>↻</span><div><strong>需要重複提醒？</strong><small>前往排程提醒設定每天或每週通知</small></div><b>›</b></Link>
      <p className="schedule-preview">預計於 {schedule} 透過 LINE 提醒</p>{notice && <p className="inline-notice" role="alert">{notice}</p>}
      <button className="save-reminder-button" type="submit" disabled={saving}>{saving ? "儲存中…" : "儲存提醒"}</button>
    </form>
  </main>;
}
