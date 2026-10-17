import { ReminderListPage } from "@/components/reminder-list-page";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MyRemindersPage() {
  if (!(await getCurrentUser())) redirect("/");
  return <ReminderListPage mode="mine" />;
}
