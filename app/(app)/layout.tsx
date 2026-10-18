import { BottomNavigation } from "@/components/bottom-navigation";
import { ReminderDataProvider } from "@/components/reminder-data";
import { UnlockScreen } from "@/components/unlock-screen";
import { getCurrentUser, hasOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, passwordExists] = await Promise.all([getCurrentUser(), hasOwner()]);
  if (!user) return <UnlockScreen setupMode={!passwordExists} />;

  return (
    <ReminderDataProvider>
      {children}
      <BottomNavigation />
    </ReminderDataProvider>
  );
}
