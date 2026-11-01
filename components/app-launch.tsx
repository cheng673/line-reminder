"use client";

import { useEffect, useState } from "react";

export function AppLaunch({ children }: Readonly<{ children: React.ReactNode }>) {
  const [leaving, setLeaving] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 1150);
    const hideTimer = window.setTimeout(() => setVisible(false), 1600);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <>
      {children}
      {visible && (
        <div className={`app-splash${leaving ? " is-leaving" : ""}`} aria-hidden="true">
          <div className="app-splash-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 21h4" strokeLinecap="round" /></svg>
          </div>
          <p className="app-splash-title">提醒一下</p>
          <p className="app-splash-copy">重要的事，讓我幫你記得</p>
        </div>
      )}
    </>
  );
}
