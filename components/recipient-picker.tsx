"use client";

import { useEffect, useState } from "react";

type RecipientChoice = { userId: string; lineUserId: string; displayName: string; passwordConfigured: boolean };

export function RecipientPicker() {
  const [recipients, setRecipients] = useState<RecipientChoice[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetch("/api/selection/recipients")
      .then(async (response) => {
        const body = await response.json().catch(() => null) as RecipientChoice[] | { error?: string } | null;
        if (!response.ok || !Array.isArray(body)) throw new Error(!Array.isArray(body) ? body?.error : undefined);
        setRecipients(body);
        setSelected(body[0] ? `${body[0].userId}:${body[0].lineUserId}` : "");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "無法讀取 LINE 收件人。"))
      .finally(() => setLoading(false));
  }, []);

  const choice = recipients.find((item) => `${item.userId}:${item.lineUserId}` === selected);

  async function enter() {
    if (!choice) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/selection/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...choice, password, confirmPassword }),
      });
      const body = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error || "無法進入提醒。" );
      window.location.assign("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "無法進入提醒。" );
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-panel" aria-labelledby="recipient-picker-title">
        <a className="auth-brand" href="/" aria-label="提醒一下首頁"><span className="auth-brand-mark">·</span><span>提醒一下</span></a>
        <div className="auth-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="3" /><path d="M5 20c.8-4 3.1-6 7-6s6.2 2 7 6" /></svg>
        </div>
        <p className="auth-kicker">LINE REMINDER</p>
        <h1 id="recipient-picker-title">選擇提醒對象。</h1>
        <p className="auth-copy">選擇已綁定的 LINE 名稱，再輸入這位使用者專屬的密碼即可進入。</p>
        <label className="auth-field recipient-choice">
          <span>已綁定的 LINE 收件人</span>
          <select value={selected} onChange={(event) => setSelected(event.target.value)} disabled={loading || busy || !recipients.length}>
            {loading && <option>讀取中…</option>}
            {!loading && !recipients.length && <option>尚未有已綁定收件人</option>}
            {recipients.map((recipient) => <option key={`${recipient.userId}:${recipient.lineUserId}`} value={`${recipient.userId}:${recipient.lineUserId}`}>{recipient.displayName}</option>)}
          </select>
        </label>
        {choice && (
          <div className="auth-fields recipient-password-fields">
            <label className="auth-field">
              <span>{choice.passwordConfigured ? "密碼" : "設定密碼"}</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={choice.passwordConfigured ? "輸入這位使用者的密碼" : "至少 12 個字元"}
                autoComplete={choice.passwordConfigured ? "current-password" : "new-password"}
                disabled={busy}
              />
            </label>
            {!choice.passwordConfigured && (
              <label className="auth-field">
                <span>再次確認密碼</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="再次輸入密碼"
                  autoComplete="new-password"
                  disabled={busy}
                />
              </label>
            )}
          </div>
        )}
        <button className="auth-button" type="button" onClick={enter} disabled={loading || busy || !selected}>
          <span className="auth-button-icon" aria-hidden="true">↗</span>{busy ? "確認中…" : choice?.passwordConfigured ? "輸入密碼並進入" : "設定密碼並進入"}
        </button>
        {message && <p className="auth-error" role="alert">{message}</p>}
        <p className="auth-note">每位 LINE 收件人都有獨立密碼；進入後，新提醒會自動發送給這位收件人。</p>
      </section>
      <p className="auth-footer">切換收件人，即可切換各自的提醒空間。</p>
    </main>
  );
}
