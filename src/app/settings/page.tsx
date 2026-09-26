import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CalendarPreferencesProvider } from "@/components/calendar-preferences";
import { NavBar } from "@/components/nav-bar";
import { SettingsView } from "@/components/settings-view";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <CalendarPreferencesProvider>
      <div className="flex min-h-full flex-1 flex-col">
        <NavBar />
        <SettingsView />
      </div>
    </CalendarPreferencesProvider>
  );
}
