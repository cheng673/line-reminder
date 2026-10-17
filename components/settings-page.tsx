"use client";

import { useEffect, useState } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";
import type { Recipient } from "@/lib/types";

export function SettingsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    fetch("/api/recipients")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.error || "暫時無法讀取 LINE 收件人。");
        return body as Recipient[];
      })
      .then(setRecipients)
      .catch((reason: Error) => setNotice(reason.message))
      .finally(() => setLoading(false));
  }, []);

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
          {loading && <p className="empty">正在讀取收件人…</p>}
          {notice && <p className="notice" role="alert">{notice}</p>}
          {!loading && !notice && recipients.map((recipient) => (
            <div className="recipient-row" key={recipient.lineUserId}>
              <span className="recipient-avatar" aria-hidden="true">L</span>
              <span>{recipient.displayName}</span>
              <span className="recipient-status">已連結</span>
            </div>
          ))}
          {!loading && !notice && recipients.length === 0 && <p className="empty">尚未有 LINE 收件人。將官方帳號加為好友後會自動出現在這裡。</p>}
        </article>
      </section>
      <BottomNavigation />
    </main>
  );
}
