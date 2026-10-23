import { BottomNavigation } from "@/components/bottom-navigation";
import { ReminderDataProvider } from "@/components/reminder-data";
import { RecipientPicker } from "@/components/recipient-picker";
import { getCurrentRecipient } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getCurrentRecipient();
  if (!access) return <RecipientPicker />;

  return (
    <ReminderDataProvider>
      {children}
      <BottomNavigation />
    </ReminderDataProvider>
  );
}
