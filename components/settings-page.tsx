"use client";

import { useState } from "react";
import { useReminderData } from "@/components/reminder-data";

export function SettingsPage() {
  const [locking, setLocking] = useState(false);
  const [linkToken, setLinkToken] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linking, setLinking] = useState(false);
  const { recipients, isLoading, error, refresh } = useReminderData();

  async function lockApp() {
    setLocking(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }

  async function createLinkToken() {
    setLinking(true);
    setLinkError("");
    try {
      const response = await fetch("/api/line/link-token", { method: "POST" });
      const body = await response.json().catch(() => null) as { token?: string; error?: string } | null;
      if (!response.ok || !body?.token) throw new Error(body?.error || "無法產生 LINE 綁定碼。");
      setLinkToken(body.token);
      void refresh();
    } catch (reason) {
      setLinkError(reason instanceof Error ? reason.message : "無法產生 LINE 綁定碼。");
    } finally {
      setLinking(false);
    }
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
          <h2>切換提醒對象</h2>
          <p>返回選擇畫面後，可切換到另一位已綁定的 LINE 收件人；每位收件人的提醒會各自分開。</p>
          <button className="settings-action" type="button" onClick={lockApp} disabled={locking}>{locking ? "切換中…" : "選擇其他收件人"}</button>
        </article>
        <article className="settings-card">
          <p className="eyebrow">CONNECT LINE</p>
          <h2>連結你的 LINE</h2>
          <p>產生綁定碼後，在 LINE 官方帳號的聊天室傳送下方指令。綁定碼 10 分鐘後失效，且只會連結到目前登入的帳號。</p>
          {linkToken ? (
            <div className="line-link-code" aria-live="polite">
              <span>請傳送</span>
              <strong>綁定 {linkToken}</strong>
            </div>
          ) : null}
          {linkError && <p className="notice" role="alert">{linkError}</p>}
          <button className="settings-action" type="button" onClick={createLinkToken} disabled={linking}>
            {linking ? "產生中…" : linkToken ? "重新產生綁定碼" : "產生 LINE 綁定碼"}
          </button>
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
          {!isLoading && !error && recipients.length === 0 && <p className="empty">尚未連結 LINE。產生綁定碼後，傳送到 LINE 官方帳號即可完成連結。</p>}
        </article>
      </section>
      <p className="settings-version">目前版本 · V2.4.0</p>
    </main>
  );
}
