"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavigationItem = {
  href: string;
  label: string;
  icon: "home" | "list" | "schedule" | "settings";
};

const items: NavigationItem[] = [
  { href: "/", label: "首頁", icon: "home" },
  { href: "/all-reminders", label: "所有提醒", icon: "list" },
  { href: "/scheduled-reminders", label: "排程提醒", icon: "schedule" },
  { href: "/settings", label: "設定", icon: "settings" },
];

function NavigationIcon({ name }: { name: NavigationItem["icon"] }) {
  if (name === "home") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m3.5 10 8.5-7 8.5 7v9.25a1.75 1.75 0 0 1-1.75 1.75H5.25A1.75 1.75 0 0 1 3.5 19.25V10Z" /><path d="M9 21v-6.5h6V21" /></svg>;
  }
  if (name === "list") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6h.01M4 12h.01M4 18h.01" strokeWidth="3.5" strokeLinecap="round" /></svg>;
  }
  if (name === "schedule") {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="3" /><path d="M7.5 3.5v4M16.5 3.5v4M3.5 10h17M12 13v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z" /><path d="m19.2 13.45 1.2.7-1.7 2.95-1.2-.7a7.82 7.82 0 0 1-1.7 1l.02 1.38h-3.4l.02-1.38a7.82 7.82 0 0 1-1.7-1l-1.2.7-1.7-2.95 1.2-.7a7.4 7.4 0 0 1 0-1.96l-1.2-.7 1.7-2.95 1.2.7a7.82 7.82 0 0 1 1.7-1L12.42 6h3.4l-.02 1.39a7.82 7.82 0 0 1 1.7 1l1.2-.7 1.7 2.95-1.2.7a7.4 7.4 0 0 1 0 1.96Z" strokeLinejoin="round" /></svg>;
}

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const currentIndex = Math.max(0, items.findIndex((item) => item.href === pathname));
  const [visibleIndex, setVisibleIndex] = useState(currentIndex);
  const gestureStart = useRef<{ x: number; y: number } | null>(null);
  const ignoreNextClick = useRef(false);

  useEffect(() => {
    setVisibleIndex(currentIndex);
  }, [currentIndex]);

  useEffect(() => {
    items.forEach((item) => router.prefetch(item.href));
  }, [router]);

  function moveTo(index: number) {
    const nextIndex = Math.max(0, Math.min(items.length - 1, index));
    if (nextIndex === currentIndex) return;
    setVisibleIndex(nextIndex);
    router.push(items[nextIndex].href);
  }

  function navigate(event: React.MouseEvent<HTMLAnchorElement>, href: string, index: number) {
    if (ignoreNextClick.current) {
      event.preventDefault();
      ignoreNextClick.current = false;
      return;
    }
    if (href === pathname) return;
    event.preventDefault();
    moveTo(index);
  }

  function startSwipe(event: React.PointerEvent<HTMLDivElement>) {
    gestureStart.current = { x: event.clientX, y: event.clientY };
  }

  function endSwipe(event: React.PointerEvent<HTMLDivElement>) {
    const start = gestureStart.current;
    gestureStart.current = null;
    if (!start) return;

    const horizontalDistance = event.clientX - start.x;
    const verticalDistance = event.clientY - start.y;
    if (Math.abs(horizontalDistance) < 28 || Math.abs(horizontalDistance) <= Math.abs(verticalDistance)) return;

    ignoreNextClick.current = true;
    moveTo(currentIndex + (horizontalDistance < 0 ? 1 : -1));
    window.setTimeout(() => { ignoreNextClick.current = false; }, 250);
  }

  return (
    <nav className="liquid-nav" aria-label="主要導覽">
      <div className="liquid-nav-list" onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gestureStart.current = null; }}>
        <span
          className="liquid-nav-selection"
          aria-hidden="true"
          style={{ transform: `translateX(calc(${visibleIndex * 100}% + ${visibleIndex * 8}px))` }}
        />
        {items.map((item, index) => {
          const active = pathname === item.href;
          return (
            <Link
              className={`liquid-nav-item${active ? " is-active" : ""}`}
              href={item.href}
              key={item.href}
              aria-current={active ? "page" : undefined}
              onClick={(event) => navigate(event, item.href, index)}
            >
              <span className="liquid-nav-icon"><NavigationIcon name={item.icon} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
