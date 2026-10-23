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
  const [registerMode, setRegisterMode] = useState(setupMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function unlock() {
    setBusy(true);
    setMessage("");
    try {
      if (registerMode) {
        await readJson(
          await fetch(setupMode ? "/api/auth/setup" : "/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, confirmPassword }),
          }),
        );
      } else {
        await readJson(
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          }),
        );
      }
      window.location.assign("/");
    } catch (error) {
      const fallback = registerMode ? "無法建立帳號，請再試一次。" : "無法登入，請再試一次。";
      setMessage(error instanceof Error ? error.message : fallback);
      setBusy(false);
    }
  }

  const title = registerMode ? "建立你的空間。" : "歡迎回來。";
  const description = registerMode
    ? "建立帳號與密碼。登入後，你只能查看與管理自己的提醒和 LINE 收件人。"
    : "輸入帳號與密碼，即可安全查看屬於你的 LINE 提醒。";

  function switchMode() {
    setRegisterMode((current) => !current);
    setMessage("");
    setPassword("");
    setConfirmPassword("");
  }

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
            <span>帳號</span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="例如：cheng"
              autoComplete="username"
              disabled={busy}
            />
          </label>
          <label className="auth-field">
            <span>密碼</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={registerMode ? "至少 12 個字元" : "輸入密碼"}
              autoComplete={registerMode ? "new-password" : "current-password"}
              disabled={busy}
            />
          </label>
          {registerMode && (
            <label className="auth-field">
              <span>再次確認</span>
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
          {busy ? "正在確認…" : registerMode ? "建立帳號並進入" : "登入提醒"}
        </button>
        {message && <p className="auth-error" role="alert">{message}</p>}

        <p className="auth-note">
          {registerMode ? "密碼只會以不可逆雜湊方式保存。" : "忘記密碼時，請建立新的帳號。"}
        </p>
        {!setupMode && (
          <button className="auth-switch" type="button" onClick={switchMode} disabled={busy}>
            {registerMode ? "已有帳號？改為登入" : "第一次使用？建立新帳號"}
          </button>
        )}
      </section>
      <p className="auth-footer">你的提醒，只會顯示在自己的帳號內。</p>
    </main>
  );
}
