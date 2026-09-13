import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventInputSchema } from "@/lib/validation";
import { expandOccurrences } from "@/lib/recurrence";

// GET /api/events?from=ISO&to=ISO
// Returns occurrences (recurring events expanded) for the shared calendar.
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json({ error: "Paramètres 'from' et 'to' requis" }, { status: 400 });
  }

  const rangeStart = new Date(from);
  const rangeEnd = new Date(to);

  // The calendar is shared: every event owned by either user is visible to both.
  const events = await prisma.event.findMany({
    include: { category: true, owner: { select: { id: true, name: true, color: true } } },
  });

  const occurrences = events.flatMap((event) => {
    const occs = expandOccurrences(
      { id: event.id, startsAt: event.startsAt, endsAt: event.endsAt, rrule: event.rrule },
      rangeStart,
      rangeEnd,
    );
    return occs.map((occ) => ({
      ...occ,
      event,
    }));
  });

  return NextResponse.json({ occurrences });
}

// POST /api/events
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = eventInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  if (new Date(data.endsAt) < new Date(data.startsAt)) {
    return NextResponse.json(
      { error: "La date de fin doit être après la date de début" },
      { status: 400 },
    );
  }

  const event = await prisma.event.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
      allDay: data.allDay,
      rrule: data.rrule ?? null,
      categoryId: data.categoryId ?? null,
      ownerId: session.user.id,
    },
    include: { category: true, owner: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ event }, { status: 201 });
}
