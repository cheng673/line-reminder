import { ReminderDashboard } from "@/components/reminder-dashboard";
import { UnlockScreen } from "@/components/unlock-screen";
import { getCurrentUser, hasOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [user, passwordExists] = await Promise.all([getCurrentUser(), hasOwner()]);
  return user ? <ReminderDashboard /> : <UnlockScreen setupMode={!passwordExists} />;
}
