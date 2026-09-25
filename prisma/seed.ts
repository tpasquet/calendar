import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Seeds the two (and only two) accounts for this app: Aurélie and Terry.
// Override via env vars before running `npm run db:seed` in production.
async function upsertUser(email: string, name: string, password: string, color: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, color },
    create: { email, name, passwordHash, color },
  });

  await prisma.category.upsert({
    where: { id: `${user.id}-default` },
    update: {},
    create: { id: `${user.id}-default`, name: "Personnel", color, ownerId: user.id },
  });

  return user;
}

async function main() {
  await upsertUser(
    process.env.SEED_AURELIE_EMAIL ?? "aurelie@atcalendar.fr",
    "Aurélie",
    process.env.SEED_AURELIE_PASSWORD ?? "changeme",
    "#ec4899",
  );

  await upsertUser(
    process.env.SEED_TERRY_EMAIL ?? "terry@atcalendar.fr",
    "Terry",
    process.env.SEED_TERRY_PASSWORD ?? "changeme",
    "#6366f1",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
