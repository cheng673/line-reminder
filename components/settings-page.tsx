"use client";

import { useState } from "react";
import { useReminderData } from "@/components/reminder-data";

export function SettingsPage() {
  const [locking, setLocking] = useState(false);
  const { recipients, isLoading, error } = useReminderData();

  async function lockApp() {
    setLocking(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  return (
    <main className="shell subpage-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="回到提醒一下首頁"><span className="brand-mark">✓</span><span>提醒一下</span></a>
      </header>
      <section className="subpage-hero">
        <p className="eyebrow">SETTINGS</p>
        <h1>設定</h1>
        <p>管理目前已連結的 LINE 收件人與本次登入狀態。</p>
      </section>

      <section className="settings-stack" aria-label="設定內容">
        <article className="settings-card">
          <p className="eyebrow">ACCOUNT</p>
          <h2>管理密碼保護</h2>
          <p>這個網站目前以共用管理密碼保護提醒資料。</p>
          <button className="settings-action" type="button" onClick={lockApp} disabled={locking}>{locking ? "鎖定中…" : "立即鎖定"}</button>
        </article>
        <article className="settings-card">
          <div className="section-heading">
            <div><p className="eyebrow">LINE RECIPIENTS</p><h2>LINE 收件人</h2></div>
            <span className="count">{recipients.length} 位</span>
          </div>
          {isLoading && <p className="empty">正在讀取收件人…</p>}
          {error && <p className="notice" role="alert">{error}</p>}
          {!isLoading && !error && recipients.map((recipient) => (
            <div className="recipient-row" key={recipient.lineUserId}>
              <span className="recipient-avatar" aria-hidden="true">L</span>
              <span>{recipient.displayName}</span>
              <span className="recipient-status">已連結</span>
            </div>
          ))}
          {!isLoading && !error && recipients.length === 0 && <p className="empty">尚未有 LINE 收件人。將官方帳號加為好友後會自動出現在這裡。</p>}
        </article>
      </section>
    </main>
  );
}
