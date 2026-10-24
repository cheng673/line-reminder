"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Frequency = "DAILY" | "WEEKLY";
type ScheduledReminder = {
  id: string;
  message: string;
  frequency: Frequency;
  weekdays: number[];
  timeOfDay: string;
  nextRunAt: string;
  lastSentAt: string | null;
  isActive: boolean;
};

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "系統暫時無法完成操作。");
  return body as T;
}

function formatNextRun(value: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

export function ScheduledRemindersPage() {
  const [schedules, setSchedules] = useState<ScheduledReminder[]>([]);
  const [message, setMessage] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("DAILY");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [timeOfDay, setTimeOfDay] = useState("08:00");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    requestJson<ScheduledReminder[]>("/api/scheduled-reminders")
      .then(setSchedules)
      .catch((error) => setNotice(error instanceof Error ? error.message : "無法讀取排程提醒。"))
      .finally(() => setLoading(false));
  }, []);

  const frequencyLabel = useMemo(() => frequency === "DAILY" ? "每天" : `每週${selectedDays.map((day) => weekdays[day]).join("、")}`, [frequency, selectedDays]);

  function toggleDay(day: number) {
    setSelectedDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b));
  }

  async function createSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    try {
      const schedule = await requestJson<ScheduledReminder>("/api/scheduled-reminders", {
        method: "POST",
        body: JSON.stringify({ message, frequency, weekdays: selectedDays, timeOfDay }),
      });
      setSchedules((current) => [...current, schedule].sort((a, b) => a.nextRunAt.localeCompare(b.nextRunAt)));
      setMessage("");
      setNotice(`已建立${frequencyLabel} ${timeOfDay} 的排程提醒。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "建立排程提醒失敗。" );
    } finally {
      setSaving(false);
    }
  }

  async function toggleSchedule(schedule: ScheduledReminder) {
    try {
      const updated = await requestJson<ScheduledReminder>(`/api/scheduled-reminders/${schedule.id}`, {
        method: "PATCH", body: JSON.stringify({ isActive: !schedule.isActive }),
      });
      setSchedules((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "無法更新排程提醒。" );
    }
  }

  async function deleteSchedule(id: string) {
    try {
      await requestJson<void>(`/api/scheduled-reminders/${id}`, { method: "DELETE" });
      setSchedules((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "無法刪除排程提醒。" );
    }
  }

  return (
    <main className="shell subpage-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="回到提醒一下首頁"><span className="brand-mark">✓</span><span>提醒一下</span></a>
        <Link className="lock-button" href="/">單次提醒</Link>
      </header>
      <section className="subpage-hero">
        <p className="eyebrow">RECURRING SCHEDULE</p>
        <h1>排程提醒</h1>
        <p>設定固定時段，讓系統每天或每週自動透過 LINE 提醒你。</p>
      </section>
      <section className="scheduled-layout">
        <form className="create-card" onSubmit={createSchedule}>
          <div className="section-heading"><div><p className="eyebrow">NEW SCHEDULE</p><h2>建立排程</h2></div></div>
          <label className="field full"><span>提醒內容</span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="例如：記得補充水分" rows={3} maxLength={500} required /></label>
          <div className="schedule-frequency" role="group" aria-label="重複頻率">
            <button type="button" className={frequency === "DAILY" ? "is-selected" : ""} onClick={() => setFrequency("DAILY")}>每天</button>
            <button type="button" className={frequency === "WEEKLY" ? "is-selected" : ""} onClick={() => setFrequency("WEEKLY")}>每週</button>
          </div>
          {frequency === "WEEKLY" && <div className="weekday-picker" aria-label="選擇星期">{weekdays.map((day, index) => <button type="button" className={selectedDays.includes(index) ? "is-selected" : ""} key={day} onClick={() => toggleDay(index)}>{day}</button>)}</div>}
          <label className="field full"><span>提醒時間</span><input type="time" value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value)} required /></label>
          {notice && <p className="notice" role="status">{notice}</p>}
          <button className="primary-button" type="submit" disabled={saving}><span>＋</span>{saving ? "儲存中…" : "建立排程提醒"}</button>
        </form>
        <section className="list-card schedule-list" aria-live="polite">
          <div className="section-heading"><div><p className="eyebrow">ACTIVE SCHEDULES</p><h2>我的排程</h2></div><span className="count">{schedules.filter((item) => item.isActive).length} 個啟用</span></div>
          {loading && <p className="empty">正在讀取排程提醒…</p>}
          {!loading && schedules.map((schedule) => <article className="schedule-row" key={schedule.id}>
            <div><p>{schedule.message}</p><span>{schedule.frequency === "DAILY" ? "每天" : `每週${schedule.weekdays.map((day) => weekdays[day]).join("、")}`} · {schedule.timeOfDay}</span><small>下次：{formatNextRun(schedule.nextRunAt)}</small></div>
            <div className="schedule-actions"><button type="button" className={schedule.isActive ? "schedule-toggle is-active" : "schedule-toggle"} onClick={() => toggleSchedule(schedule)} aria-label={`${schedule.isActive ? "暫停" : "啟用"}：${schedule.message}`}><span /></button><button type="button" className="delete" onClick={() => deleteSchedule(schedule.id)}>刪除</button></div>
          </article>)}
          {!loading && schedules.length === 0 && <p className="empty">尚未建立排程提醒。</p>}
        </section>
      </section>
    </main>
  );
}
