"use client";

import { useMemo, useState } from "react";
import { useReminderData } from "@/components/reminder-data";

export function FriendsPage() {
  const { recipients, isLoading, error, refresh } = useReminderData();
  const [query, setQuery] = useState("");
  const [linkToken, setLinkToken] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);
  const visibleRecipients = useMemo(() => recipients.filter((recipient) => recipient.displayName.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [recipients, query]);

  async function createLinkToken() {
    setCreating(true); setNotice("");
    try {
      const response = await fetch("/api/line/link-token", { method: "POST" });
      const body = await response.json().catch(() => null) as { token?: string; error?: string } | null;
      if (!response.ok || !body?.token) throw new Error(body?.error || "無法產生 LINE 綁定碼。");
      setLinkToken(body.token); void refresh();
    } catch (reason) { setNotice(reason instanceof Error ? reason.message : "無法產生 LINE 綁定碼。"); } finally { setCreating(false); }
  }

  return <main className="app-shell friends-page">
    <header className="app-header"><div><p className="app-kicker">LINE CONTACTS</p><h1>好友</h1><p>管理已綁定、能收到提醒的 LINE 對象。</p></div><span className="profile-orb" aria-hidden="true">{recipients[0]?.displayName?.slice(0, 1) || "L"}</span></header>
    <section className="friend-search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.25" /><path d="m15.2 15.2 4.3 4.3" strokeLinecap="round" /></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋已綁定好友" aria-label="搜尋已綁定好友" /></section>
    <section className="friend-section"><div className="section-title"><div><p className="app-kicker">CONNECTED</p><h2>已連結的 LINE</h2></div><span>{recipients.length} 位</span></div>
      {isLoading && <p className="empty-state">正在讀取好友…</p>}{error && <p className="inline-notice" role="alert">{error}</p>}
      {!isLoading && !error && visibleRecipients.map((recipient) => <article className="friend-row" key={recipient.lineUserId}><span className="friend-avatar">{recipient.displayName.slice(0, 1)}</span><div><strong>{recipient.displayName}</strong><small>LINE 已連結</small></div><span className="friend-check" aria-label="已連結">✓</span></article>)}
      {!isLoading && !error && visibleRecipients.length === 0 && <p className="empty-state">找不到符合的好友。</p>}
    </section>
    <section className="link-contact-card"><p className="app-kicker">ADD CONTACT</p><h2>綁定新的 LINE</h2><p>產生專屬綁定碼後，將指令傳送給 LINE 官方帳號即可加入。</p>{linkToken && <p className="link-token">請傳送 <strong>綁定 {linkToken}</strong></p>}{notice && <p className="inline-notice" role="alert">{notice}</p>}<button className="secondary-action" type="button" onClick={createLinkToken} disabled={creating}>{creating ? "產生中…" : linkToken ? "重新產生綁定碼" : "產生綁定碼"}</button></section>
  </main>;
}
