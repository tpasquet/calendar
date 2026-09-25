import "dotenv/config";
import { beforeAll, afterAll, describe, expect, test, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma";

const getServerSessionMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

const prisma = new PrismaClient();
const { GET } = await import("@/app/api/calendar-members/route");

const sessionUser = { id: "test-user" };

describe("calendar members API integration", () => {
  beforeAll(async () => {
    const user = await prisma.user.findUnique({
      where: { email: "terry@atcalendrier.fr" },
      select: { id: true },
    });
    if (!user) throw new Error("Seed terry@atcalendrier.fr before running integration tests");
    sessionUser.id = user.id;
    getServerSessionMock.mockResolvedValue({ user: sessionUser });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("returns both calendar members with their display colors", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const members = (await response.json()).members;
    expect(members).toHaveLength(2);
    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: "terry@atcalendrier.fr", name: "Terry", color: expect.any(String) }),
        expect.objectContaining({ email: "aurelie@atcalendrier.fr", name: "Aurélie", color: expect.any(String) }),
      ]),
    );
  });
});
