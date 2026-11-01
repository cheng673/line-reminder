"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Recipient, Reminder } from "@/lib/types";

type ReminderDataValue = {
  reminders: Reminder[];
  recipients: Recipient[];
  activeScheduleCount: number;
  isLoading: boolean;
  error: string;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  refresh: () => Promise<void>;
};

type AppData = {
  reminders: Reminder[];
  recipients: Recipient[];
  activeScheduleCount: number;
};

const ReminderDataContext = createContext<ReminderDataValue | null>(null);

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || "暫時無法讀取提醒資料。");
  return body as T;
}

export function ReminderDataProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [activeScheduleCount, setActiveScheduleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await readJson<AppData>("/api/app-data");
      setReminders(data.reminders);
      setRecipients(data.recipients);
      setActiveScheduleCount(data.activeScheduleCount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "暫時無法讀取提醒資料。");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo(() => ({ reminders, recipients, activeScheduleCount, isLoading, error, setReminders, refresh }), [reminders, recipients, activeScheduleCount, isLoading, error, refresh]);
  return <ReminderDataContext.Provider value={value}>{children}</ReminderDataContext.Provider>;
}

export function useReminderData() {
  const value = useContext(ReminderDataContext);
  if (!value) throw new Error("useReminderData 必須在 ReminderDataProvider 中使用。");
  return value;
}
