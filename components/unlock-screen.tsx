"use client";

import { useState } from "react";

type UnlockScreenProps = { setupMode: boolean };

type ApiError = { error?: string };

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiError;
  if (!response.ok) throw new Error(body.error || "暫時無法完成操作，請稍後再試。");
  return body as T;
}

export function UnlockScreen({ setupMode }: UnlockScreenProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function unlock() {
    setBusy(true);
    setMessage("");
    try {
      if (setupMode) {
        await readJson(
          await fetch("/api/auth/setup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password, confirmPassword }),
          }),
        );
      } else {
        await readJson(
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          }),
        );
      }
      window.location.assign("/");
    } catch (error) {
      const fallback = setupMode ? "管理密碼尚未設定，請再試一次。" : "無法解鎖，請再試一次。";
      setMessage(error instanceof Error ? error.message : fallback);
      setBusy(false);
    }
  }

  const title = setupMode ? "設定管理密碼。" : "回來了。";
  const description = setupMode
    ? "建立一組只屬於這個網站的管理密碼。之後無論使用哪個裝置，都用它解鎖提醒。"
    : "輸入管理密碼，即可安全查看與管理你的 LINE 提醒。";

  return (
    <main className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />
      <section className="auth-panel" aria-labelledby="unlock-title">
        <a className="auth-brand" href="/" aria-label="提醒一下首頁">
          <span className="auth-brand-mark">·</span>
          <span>提醒一下</span>
        </a>

        <div className="auth-lock" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <rect x="4.5" y="10" width="15" height="10" rx="3" />
            <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
            <path d="M12 14v2" />
          </svg>
        </div>

        <p className="auth-kicker">PRIVATE SPACE</p>
        <h1 id="unlock-title">{title}</h1>
        <p className="auth-copy">{description}</p>

        <div className="auth-fields">
          <label className="auth-field">
            <span>管理密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={setupMode ? "至少 12 個字元" : "輸入管理密碼"}
              autoComplete={setupMode ? "new-password" : "current-password"}
              disabled={busy}
            />
          </label>
          {setupMode && (
            <label className="auth-field">
              <span>再次確認密碼</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="再次輸入管理密碼"
                autoComplete="new-password"
                disabled={busy}
              />
            </label>
          )}
        </div>
        <button className="auth-button" type="button" onClick={unlock} disabled={busy}>
          <span className="auth-button-icon" aria-hidden="true">↗</span>
          {busy ? "正在確認…" : setupMode ? "儲存並解鎖提醒" : "解鎖提醒"}
        </button>
        {message && <p className="auth-error" role="alert">{message}</p>}

        <p className="auth-note">
          {setupMode ? "密碼只會以不可逆雜湊方式保存。" : "忘記密碼時，需要由管理者重新設定。"}
        </p>
      </section>
      <p className="auth-footer">你的提醒，只對知道管理密碼的人開放。</p>
    </main>
  );
}
