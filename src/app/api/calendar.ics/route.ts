import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildIcsCalendar } from "@/lib/ics";

// GET /api/calendar.ics - export the shared calendar as a standard .ics feed
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response("Non authentifié", { status: 401 });
  }

  const events = await prisma.event.findMany({ include: { category: true } });
  const ics = buildIcsCalendar(events);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="atcalendar.ics"',
    },
  });
}
