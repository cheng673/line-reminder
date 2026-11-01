import { BottomNavigation } from "@/components/bottom-navigation";
import { AppLaunch } from "@/components/app-launch";
import { ReminderDataProvider } from "@/components/reminder-data";
import { RecipientPicker } from "@/components/recipient-picker";
import { getCurrentRecipient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getCurrentRecipient();
  if (!access) return <AppLaunch><RecipientPicker /></AppLaunch>;

  return (
    <AppLaunch>
      <ReminderDataProvider>
        {children}
        <BottomNavigation />
      </ReminderDataProvider>
    </AppLaunch>
  );
}
