"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useReminderData } from "@/components/reminder-data";

const weekdayLabels = ["日", "一", "二", "三", "四", "五", "六"];

function taipeiDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("zh-TW", { timeZone: "Asia/Taipei", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export function CalendarPage() {
  const { reminders, isLoading, error } = useReminderData();
  const today = new Date();
  const [monthCursor, setMonthCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => taipeiDateKey(today));
  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyDays = new Date(year, month, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const remindersByDate = useMemo(() => {
    const grouped = new Map<string, typeof reminders>();
    reminders.forEach((reminder) => {
      const key = taipeiDateKey(new Date(reminder.scheduledAt));
      grouped.set(key, [...(grouped.get(key) ?? []), reminder]);
    });
    return grouped;
  }, [reminders]);

  const selectedReminders = reminders.filter((reminder) => taipeiDateKey(new Date(reminder.scheduledAt)) === selectedDate);
  const monthLabel = new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "long" }).format(monthCursor);

  function changeMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setMonthCursor(next);
    setSelectedDate(taipeiDateKey(next));
  }

  return <main className="app-shell calendar-page">
    <header className="app-header"><div><p className="app-kicker">CALENDAR</p><h1>日曆</h1></div><Link className="round-icon-button" href="/new-reminder" aria-label="新增提醒">＋</Link></header>
    <section className="calendar-card" aria-label="提醒日曆">
      <div className="calendar-heading"><button type="button" aria-label="上一個月" onClick={() => changeMonth(-1)}>‹</button><h2>{monthLabel}</h2><button type="button" aria-label="下一個月" onClick={() => changeMonth(1)}>›</button></div>
      <div className="calendar-weekdays">{weekdayLabels.map((day) => <span key={day}>{day}</span>)}</div>
      <div className="calendar-grid">{Array.from({ length: leadingEmptyDays }).map((_, index) => <span className="calendar-empty" key={`empty-${index}`} />)}{days.map((day) => {
        const date = new Date(year, month, day);
        const key = taipeiDateKey(date);
        const count = remindersByDate.get(key)?.length ?? 0;
        const active = key === selectedDate;
        const isToday = key === taipeiDateKey(today);
        return <button type="button" key={key} className={`calendar-day${active ? " is-selected" : ""}${isToday ? " is-today" : ""}`} onClick={() => setSelectedDate(key)} aria-pressed={active}><span>{day}</span>{count > 0 && <i aria-label={`${count} 筆提醒`} />}</button>;
      })}</div>
    </section>
    <section className="day-reminders" aria-live="polite"><div className="section-title"><div><p className="app-kicker">SELECTED DAY</p><h2>{new Intl.DateTimeFormat("zh-TW", { month: "long", day: "numeric", weekday: "long", timeZone: "Asia/Taipei" }).format(new Date(`${selectedDate}T12:00:00+08:00`))}</h2></div><span>{selectedReminders.length} 項</span></div>
      {isLoading && <p className="empty-state">正在讀取提醒…</p>}{error && <p className="inline-notice" role="alert">{error}</p>}
      {!isLoading && !error && selectedReminders.map((reminder) => <Link className="calendar-reminder" href={`/?edit=${reminder.id}`} key={reminder.id}><strong>{formatTime(reminder.scheduledAt)}</strong><span>{reminder.message}</span><small>{reminder.status === "sent" ? "已完成" : reminder.status === "failed" ? "需要留意" : "待提醒"}</small></Link>)}
      {!isLoading && !error && selectedReminders.length === 0 && <p className="empty-state">這一天沒有提醒。<Link href="/new-reminder">新增一項提醒</Link></p>}
    </section>
  </main>;
}
