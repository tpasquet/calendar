import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CalendarView } from "@/components/calendar-view";
import { NavBar } from "@/components/nav-bar";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <NavBar />
      <main className="flex-1 p-4">
        <CalendarView />
      </main>
    </div>
  );
}
