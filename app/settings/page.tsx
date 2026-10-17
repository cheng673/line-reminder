import { SettingsPage } from "@/components/settings-page";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsRoute() {
  if (!(await getCurrentUser())) redirect("/");
  return <SettingsPage />;
}
