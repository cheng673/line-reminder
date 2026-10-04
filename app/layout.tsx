import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "提醒一下 | LINE 自動提醒",
  description: "在指定時間透過 LINE 收到提醒。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
