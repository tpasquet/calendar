import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();
type SeedUser = {
  email: string;
  name: string;
  color: string;
};

type SeedEvent = {
  ownerEmail: string;
  categoryName: string;
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  allDay?: boolean;
  rrule?: string;
};

const users: SeedUser[] = [
  { email: "aurelie@atcalendrier.fr", name: "Aurélie", color: "#ec4899" },
  { email: "terry@atcalendrier.fr", name: "Terry", color: "#6366f1" },
];

const today = new Date();
const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
const day = (offset: number, hour: number, minute = 0) => {
  const value = new Date(todayUtc);
  value.setUTCDate(value.getUTCDate() + offset);
  value.setUTCHours(hour, minute, 0, 0);
  return value;
};
const allDayEnd = (offset: number) => day(offset + 1, 0);
const rruleDate = (value: Date) => value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
const recurringRule = (value: Date, rule: string) => `DTSTART:${rruleDate(value)}\nRRULE:${rule}`;

const events: SeedEvent[] = [
  {
    ownerEmail: "terry@atcalendrier.fr",
    categoryName: "Travail",
    title: "Point équipe",
    description: "Réunion hebdomadaire de suivi.",
    startsAt: day(-2, 9),
    endsAt: day(-2, 10),
    rrule: recurringRule(day(-2, 9), "FREQ=WEEKLY"),
  },
  {
    ownerEmail: "terry@atcalendrier.fr",
    categoryName: "Personnel",
    title: "Déjeuner avec un ami",
    startsAt: day(1, 12, 30),
    endsAt: day(1, 14),
  },
  {
    ownerEmail: "terry@atcalendrier.fr",
    categoryName: "Santé",
    title: "Rendez-vous médical",
    startsAt: day(4, 8, 30),
    endsAt: day(4, 9, 15),
  },
  {
    ownerEmail: "aurelie@atcalendrier.fr",
    categoryName: "Travail",
    title: "Télétravail",
    startsAt: day(-1, 0),
    endsAt: allDayEnd(-1),
    allDay: true,
  },
  {
    ownerEmail: "aurelie@atcalendrier.fr",
    categoryName: "Personnel",
    title: "Cours de sport",
    startsAt: day(2, 18),
    endsAt: day(2, 19),
    rrule: recurringRule(day(2, 18), "FREQ=WEEKLY"),
  },
  {
    ownerEmail: "aurelie@atcalendrier.fr",
    categoryName: "Famille",
    title: "Anniversaire de famille",
    startsAt: day(7, 0),
    endsAt: allDayEnd(7),
    allDay: true,
    rrule: recurringRule(day(7, 0), "FREQ=YEARLY"),
  },
  {
    ownerEmail: "terry@atcalendrier.fr",
    categoryName: "Personnel",
    title: "Routine quotidienne",
    description: "Événement récurrent de test pour la vue agenda.",
    startsAt: day(-1, 7, 30),
    endsAt: day(-1, 8),
    rrule: recurringRule(day(-1, 7, 30), "FREQ=DAILY;COUNT=10"),
  },
  {
    ownerEmail: "aurelie@atcalendrier.fr",
    categoryName: "Famille",
    title: "Dîner mensuel",
    startsAt: day(14, 19),
    endsAt: day(14, 21),
    rrule: recurringRule(day(14, 19), "FREQ=MONTHLY;COUNT=6"),
  },
];

const categoryDefinitions = [
  ["Travail", "#2563eb"],
  ["Personnel", "#6366f1"],
  ["Santé", "#16a34a"],
  ["Famille", "#f97316"],
] as const;
const categoryKey = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("seed-dev.ts is only allowed in a local development environment");
  }

  const userRecords = await Promise.all(
    users.map((user) =>
      prisma.user.findUniqueOrThrow({
        where: { email: user.email },
        select: { id: true, email: true },
      }),
    ),
  );
  const userByEmail = new Map(userRecords.map((user) => [user.email, user]));

  const developmentEventIds = events.map((_, index) => `seed-dev-event-${index}`);
  const developmentCategoryIds = userRecords.flatMap((user) =>
    categoryDefinitions.map(([categoryName]) => `${user.id}-seed-dev-${categoryKey(categoryName)}`),
  );
  await prisma.event.deleteMany({ where: { id: { in: developmentEventIds } } });
  await prisma.category.deleteMany({ where: { id: { in: developmentCategoryIds } } });

  const categories = new Map<string, string>();
  for (const owner of userRecords) {
    for (const [categoryName, color] of categoryDefinitions) {
      const category = await prisma.category.create({
        data: {
          id: `${owner.id}-seed-dev-${categoryKey(categoryName)}`,
          name: categoryName,
          color,
          ownerId: owner.id,
        },
      });
      categories.set(`${owner.email}:${categoryName}`, category.id);
    }
  }

  for (const [index, event] of events.entries()) {
    const owner = userByEmail.get(event.ownerEmail);
    if (!owner) throw new Error(`Unknown seed user: ${event.ownerEmail}`);

    const categoryId = categories.get(`${event.ownerEmail}:${event.categoryName}`);
    await prisma.event.create({
      data: {
        id: developmentEventIds[index],
        title: event.title,
        description: event.description,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        allDay: event.allDay ?? false,
        rrule: event.rrule,
        ownerId: owner.id,
        categoryId,
      },
    });
  }

  console.log(`Inserted ${events.length} development events for ${userRecords.length} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });