"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef } from "react";

type NavigationItem = { href: string; label: string; icon: "home" | "calendar" | "plus" | "schedule" | "settings" };

const items: NavigationItem[] = [
  { href: "/", label: "首頁", icon: "home" },
  { href: "/calendar", label: "日曆", icon: "calendar" },
  { href: "/new-reminder", label: "新增", icon: "plus" },
  { href: "/scheduled-reminders", label: "排程", icon: "schedule" },
  { href: "/settings", label: "設定", icon: "settings" },
];

function NavigationIcon({ name }: { name: NavigationItem["icon"] }) {
  if (name === "home") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden="true"><path d="m3.5 10 8.5-7 8.5 7v9.25a1.75 1.75 0 0 1-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 19.25V10Z" /><path d="M9 21v-6.5h6V21" /></svg>;
  if (name === "calendar") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17" strokeLinecap="round" /></svg>;
  if (name === "plus") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>;
  if (name === "schedule") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M12 13v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" /><path d="m19.2 13.45 1.2.7-1.7 2.95-1.2-.7a7.82 7.82 0 0 1-1.7 1l.02 1.38h-3.4l.02-1.38a7.82 7.82 0 0 1-1.7-1l-1.2.7-1.7-2.95 1.2-.7a7.4 7.4 0 0 1 0-1.96l-1.2-.7 1.7-2.95 1.2.7a7.82 7.82 0 0 1 1.7-1L12.42 6h3.4l-.02 1.39a7.82 7.82 0 0 1 1.7 1l1.2-.7 1.7 2.95-1.2.7a7.4 7.4 0 0 1 0 1.96Z" strokeLinejoin="round" /></svg>;
}

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentIndex = Math.max(0, items.findIndex((item) => item.href === pathname));
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const ignoreNextClick = useRef(false);

  function moveTo(index: number) { const next = Math.max(0, Math.min(items.length - 1, index)); if (next !== currentIndex) router.push(items[next].href); }
  function startSwipe(event: React.PointerEvent<HTMLElement>) { gestureStart.current = { x: event.clientX, y: event.clientY }; }
  function endSwipe(event: React.PointerEvent<HTMLElement>) {
    const start = gestureStart.current; gestureStart.current = null; if (!start) return;
    const x = event.clientX - start.x; const y = event.clientY - start.y;
    if (Math.abs(x) < 28 || Math.abs(x) <= Math.abs(y)) return;
    ignoreNextClick.current = true; moveTo(currentIndex + (x < 0 ? 1 : -1)); window.setTimeout(() => { ignoreNextClick.current = false; }, 240);
  }
  return <nav className="app-tabbar" aria-label="主要導覽" onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gestureStart.current = null; }}><div className="app-tabbar-inner">{items.map((item, index) => {
    const active = pathname === item.href; const isCreate = item.icon === "plus";
    return <Link className={`app-tabbar-item${active ? " is-active" : ""}${isCreate ? " is-create" : ""}`} href={item.href} key={item.href} prefetch={false} aria-current={active ? "page" : undefined} onClick={(event) => { if (ignoreNextClick.current || item.href === pathname) { event.preventDefault(); ignoreNextClick.current = false; } }}><span className="app-tabbar-icon"><NavigationIcon name={item.icon} /></span><span>{item.label}</span></Link>;
  })}</div></nav>;
}
